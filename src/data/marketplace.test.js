import assert from "node:assert/strict";
import test from "node:test";
import { acceptOffer, createOffer, fetchMarketplaceData, respondToOffer, transitionOrder, validateOffer } from "./marketplace.js";
import { calculateFinancials } from "./financials.js";

const validOffer = {
  listingId: "listing-1",
  quantity: 20,
  availableQuantity: 30,
  unit: "kg",
  unitPrice: 12,
  currency: "INR",
  deliveryMethod: "buyer_pickup",
  transportCost: 0,
  transportPayer: "none",
  otherFarmerCharges: 0,
};

test("offer validation checks stock, terms, currency, and transport consistency", () => {
  assert.equal(validateOffer(validOffer), "");
  assert.match(validateOffer({ ...validOffer, quantity: 31 }), /available crop stock/);
  assert.match(validateOffer({ ...validOffer, currency: "USD" }), /INR only/);
  assert.match(validateOffer({ ...validOffer, deliveryMethod: "third_party" }), /provider/);
  assert.match(validateOffer({ ...validOffer, deliveryMethod: "buyer_pickup", transportCost: 3 }), /separate transport/);
  assert.match(validateOffer({ ...validOffer, otherFarmerCharges: 300 }), /cannot exceed/);
  assert.match(validateOffer({ ...validOffer, unitPrice: 1.234 }), /two decimal places/);
  assert.match(validateOffer({ ...validOffer, currency: undefined }), /INR only/);
});

test("financial totals round to stored currency precision without double-counting pickup transport", () => {
  const totals = calculateFinancials({
    quantity: 3,
    unitPrice: 10.125,
    deliveryMethod: "buyer_pickup",
    transportCost: 900,
    transportPayer: "buyer",
    otherFarmerCharges: 0.105,
  });
  assert.deepEqual(totals, {
    saleValue: 30.39,
    transportCost: 0,
    transportPayer: "none",
    otherFarmerCharges: 0.11,
    estimatedFarmerNet: 30.28,
    buyerTotal: 30.39,
  });
});

test("offer creation invokes the database RPC and never accesses local storage", async () => {
  let invoked;
  const client = { rpc: async (...args) => {
    invoked = args;
    return { data: "offer-1", error: null };
  } };
  const result = await createOffer(client, { ...validOffer, userId: "buyer-1", requestId: "request-1" });
  assert.equal(result, "offer-1");
  assert.equal(invoked[0], "create_offer");
  assert.equal(invoked[1].requested_quantity, 20);
  assert.equal(invoked[1].request_id, "request-1");
  assert.equal("requested_buyer_id" in invoked[1], false);
});

test("offer, acceptance, and order mutations surface authorization/database errors", async () => {
  const denied = { rpc: async () => ({ data: null, error: { message: "not authorized" } }) };
  await assert.rejects(createOffer(denied, { ...validOffer, userId: "buyer-1" }), /Could not submit offer: not authorized/);
  await assert.rejects(respondToOffer(denied, "offer-1", "counter", 15), /Could not counter offer: not authorized/);
  await assert.rejects(acceptOffer(denied, "offer-1"), /Could not accept offer: not authorized/);
  await assert.rejects(transitionOrder(denied, "order-1", "ready"), /Could not update order: not authorized/);
});

test("counter response and order transition use only the documented RPC signatures", async () => {
  const calls = [];
  const client = { rpc: async (...args) => {
    calls.push(args);
    return { data: args[0] === "transition_order" ? "awaiting_pickup" : null, error: null };
  } };
  await respondToOffer(client, "offer-1", "reject");
  await transitionOrder(client, "order-1", "ready");
  assert.deepEqual(calls, [
    ["respond_to_offer", { target_offer_id: "offer-1", response: "reject", counter_price: null }],
    ["transition_order", { target_order_id: "order-1", requested_action: "ready" }],
  ]);
});

test("duplicate acceptance and insufficient-stock outcomes come from the backend RPC", async () => {
  const messages = ["Offer is not awaiting a response", "Insufficient available quantity"];
  let index = 0;
  const client = {
    rpc: async (name) => {
      assert.equal(name, "accept_offer");
      return { data: null, error: { message: messages[index++] } };
    },
  };
  await assert.rejects(acceptOffer(client, "offer-1"), /Offer is not awaiting a response/);
  await assert.rejects(acceptOffer(client, "offer-2"), /Insufficient available quantity/);
});

test("marketplace reads rely on RLS and load events only for returned orders", async () => {
  const queries = [];
  const response = (data) => ({ data, error: null });
  const client = {
    from(table) {
      queries.push(table);
      const query = {
        select() { return this; },
        order() { return this; },
        in() { return this; },
        then(resolve) {
          resolve(response(table === "orders" ? [{ id: "order-1", listing_id: "listing-1", buyer_id: "buyer-1", farmer_id: "farmer-1", quantity: 3, unit: "kg", unit_price: 4, gross_value: 12, transport_method: "buyer_pickup", transport_cost: 0, transport_payer: "none", other_farmer_deductions: 0, farmer_net: 12, buyer_total: 12, status: "confirmed", created_at: "2026-01-01T00:00:00Z" }] : table === "order_events" ? [{ order_id: "order-1", event_type: "offer_accepted", details: {}, created_at: "2026-01-01T00:00:00Z" }] : []));
        },
      };
      return query;
    },
  };
  const user = { id: "buyer-1", name: "Buyer One" };
  const result = await fetchMarketplaceData(client, user, "buyer", [{ id: "listing-1", crop: "Tomato" }]);
  assert.deepEqual(queries, ["offers", "orders", "order_events"]);
  assert.equal(result.orders[0].cropName, "Tomato");
  assert.equal(result.orders[0].financials.buyerTotal, 12);
  assert.equal(result.orders[0].paymentStatus, "Not verified");
  assert.equal(result.orders[0].events[0].label, "offer accepted");
});
