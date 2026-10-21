import assert from "node:assert/strict";
import test from "node:test";
import {
  consentFpoCropAllocation,
  createFpoCampaign,
  createFpoGroupSale,
  fetchFpoWorkspace,
  requestFpoMembership,
  respondFpoGroupSale,
  respondToFpoGroupSale,
  reviewFpoMembership,
  transitionFpoGroupSale,
  validateFpoCampaign,
  validateFpoGroupSale,
  withdrawFpoCropAllocation,
} from "./fpo.js";

test("FPO campaign validation rejects missing names, unsupported units and invalid targets", () => {
  const valid = { fpoId: "fpo-1", name: "Tomato season", crop: "Tomato", unit: "quintal", targetQuantity: 200 };
  assert.equal(validateFpoCampaign(valid), "");
  assert.match(validateFpoCampaign({ ...valid, name: " " }), /campaign name/);
  assert.match(validateFpoCampaign({ ...valid, unit: "bag" }), /kg, quintal, or tonne/);
  assert.match(validateFpoCampaign({ ...valid, targetQuantity: 0 }), /greater than zero/);
});

test("membership and allocation RPCs pass explicit consent and never pass a client-selected farmer id", async () => {
  const calls = [];
  const client = { rpc: async (...args) => { calls.push(args); return { data: "created-id", error: null }; } };
  await requestFpoMembership(client, "fpo-1", true);
  await consentFpoCropAllocation(client, { campaignId: "campaign-1", listingId: "listing-1", quantity: 10, consentGiven: true });
  assert.deepEqual(calls[0], ["request_fpo_membership", { target_fpo_id: "fpo-1", consent_given: true }]);
  assert.deepEqual(calls[1], ["consent_fpo_crop_allocation", {
    target_campaign_id: "campaign-1", target_listing_id: "listing-1", requested_quantity: 10, consent_given: true,
  }]);
  assert.equal("farmer_id" in calls[1][1], false);
});

test("membership review, campaign creation, withdrawal and backend authorization errors use RPCs", async () => {
  const calls = [];
  const client = { rpc: async (...args) => { calls.push(args); return { data: args[0] === "create_fpo_campaign" ? "campaign-1" : null, error: null }; } };
  await reviewFpoMembership(client, "member-1", "active");
  await createFpoCampaign(client, { fpoId: "fpo-1", name: "Tomato", crop: "Tomato", unit: "kg", targetQuantity: "" });
  await withdrawFpoCropAllocation(client, "allocation-1");
  assert.deepEqual(calls.map(([name]) => name), ["review_fpo_membership", "create_fpo_campaign", "withdraw_fpo_crop_allocation"]);

  const denied = { rpc: async () => ({ data: null, error: { message: "Allocation quantity exceeds available stock" } }) };
  await assert.rejects(consentFpoCropAllocation(denied, { campaignId: "c", listingId: "l", quantity: 3, consentGiven: true }), /exceeds available stock/);
  await assert.rejects(requestFpoMembership(denied, "fpo-1", false), /consent/);
});

test("FPO directory uses a safe RPC and does not request administrator account IDs", async () => {
  const tables = [];
  const rows = {
    fpo_memberships: [],
    fpo_campaigns: [],
    fpo_allocations: [],
    fpo_group_sales: [{ id: "sale-1", fpo_id: "fpo-1", status: "awaiting_approvals" }],
    fpo_group_sale_contributors: [{ id: "contributor-1", sale_id: "sale-1", farmer_id: "farmer-1" }],
    fpo_settlements: [{ id: "settlement-1", sale_id: "sale-1", farmer_id: "farmer-1", status: "pending" }],
    fpo_group_sale_events: [{ id: "event-1", sale_id: "sale-1", event_type: "proposed" }],
  };
  const client = {
    rpc: async (name) => {
      assert.equal(name, "list_fpo_directory");
      return { data: [{ id: "fpo-1", name: "Growers", can_manage: true }], error: null };
    },
    from(table) {
      tables.push(table);
      return {
        select() { return this; },
        order() { return this; },
        then(resolve) { return resolve({ data: rows[table], error: null }); },
      };
    },
  };
  const workspace = await fetchFpoWorkspace(client, { id: "fpo-admin-1" });
  assert.deepEqual(tables, [
    "fpo_memberships", "fpo_campaigns", "fpo_allocations",
    "fpo_group_sales", "fpo_group_sale_contributors", "fpo_settlements", "fpo_group_sale_events",
  ]);
  assert.equal(workspace.fpos[0].can_manage, true);
  assert.equal(workspace.groupSales[0].contributors[0].farmer_id, "farmer-1");
  assert.equal(workspace.groupSales[0].events[0].event_type, "proposed");
  assert.equal(workspace.settlements[0].status, "pending");
  assert.equal("authorized_admin_id" in workspace.fpos[0], false);
});

test("group-sale validation enforces delivery, money, quantity, and retry identifiers", () => {
  const valid = {
    campaignId: "campaign-1",
    requirementId: "requirement-1",
    contributions: [{ allocationId: "allocation-1", quantity: "10.125" }],
    unitPrice: "4.50",
    deliveryMethod: "farmer_delivery",
    transportProvider: "",
    transportCost: "25.00",
    transportPayer: "buyer",
    otherDeductions: "1.25",
    requestId: "request-1",
  };
  assert.equal(validateFpoGroupSale(valid), "");
  assert.match(validateFpoGroupSale({ ...valid, transportPayer: "none", transportCost: "2" }), /who pays/);
  assert.match(validateFpoGroupSale({ ...valid, deliveryMethod: "third_party", transportProvider: "" }), /named provider/);
  assert.match(validateFpoGroupSale({ ...valid, contributions: [{ allocationId: "a", quantity: "0" }] }), /positive quantity/);
  assert.match(validateFpoGroupSale({ ...valid, requestId: "" }), /request ID/);
  assert.match(validateFpoGroupSale({ ...valid, deliveryMethod: "buyer_pickup", transportPayer: "none", transportCost: "10" }), /no separate/);
});

test("group-sale proposal submits exact validated terms through the database RPC and surfaces authorization errors", async () => {
  const calls = [];
  const valid = {
    campaignId: "campaign-1",
    requirementId: "requirement-1",
    contributions: [{ allocationId: "allocation-1", quantity: "10.125" }],
    unitPrice: "4.50",
    deliveryMethod: "farmer_delivery",
    transportProvider: "",
    transportCost: "25.00",
    transportPayer: "buyer",
    otherDeductions: "1.25",
    requestId: "request-1",
  };
  const client = { rpc: async (...args) => {
    calls.push(args);
    return { data: "sale-1", error: null };
  } };
  assert.equal(await createFpoGroupSale(client, valid), "sale-1");
  assert.deepEqual(calls, [["create_fpo_group_sale", {
    target_campaign_id: "campaign-1",
    target_requirement_id: "requirement-1",
    requested_contributions: [{ allocation_id: "allocation-1", quantity: 10.125 }],
    requested_unit_price: 4.5,
    requested_delivery_method: "farmer_delivery",
    requested_transport_provider: null,
    requested_transport_cost: 25,
    requested_transport_payer: "buyer",
    requested_other_deductions: 1.25,
    request_id: "request-1",
  }]]);
  const denied = { rpc: async () => ({ data: null, error: { message: "FPO administrator required" } }) };
  await assert.rejects(createFpoGroupSale(denied, valid), /FPO administrator required/);
  await assert.rejects(createFpoGroupSale(client, { ...valid, contributions: [] }), /at least one farmer allocation/);
});

test("farmer consent, buyer acceptance, and delivery transitions use their dedicated RPCs", async () => {
  const calls = [];
  const client = { rpc: async (...args) => {
    calls.push(args);
    return { data: args[0] === "transition_fpo_group_sale" ? "delivered" : "awaiting_approvals", error: null };
  } };
  await respondFpoGroupSale(client, "sale-1", true);
  await respondToFpoGroupSale(client, "sale-1", true);
  assert.equal(await transitionFpoGroupSale(client, "sale-1", "delivered"), "delivered");
  assert.deepEqual(calls, [
    ["respond_fpo_group_sale", { target_sale_id: "sale-1", consent_given: true }],
    ["respond_to_fpo_group_sale", { target_sale_id: "sale-1", accept_terms: true }],
    ["transition_fpo_group_sale", { target_sale_id: "sale-1", requested_action: "delivered" }],
  ]);
  await assert.rejects(transitionFpoGroupSale(client, "sale-1", "cancelled"), /valid group-sale action/);
  const denied = { rpc: async () => ({ data: null, error: { message: "not authorized" } }) };
  await assert.rejects(respondFpoGroupSale(denied, "sale-1", true), /not authorized/);
  await assert.rejects(respondToFpoGroupSale(denied, "sale-1", true), /not authorized/);
});
