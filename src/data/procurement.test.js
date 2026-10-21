import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchProcurementRequests,
  matchCropListings,
  saveProcurementRequest,
  updateProcurementRequestStatus,
  validateProcurementRequest,
} from "./procurement.js";

const request = {
  crop: "Tomato",
  variety: "Roma",
  quantity: 30,
  unit: "kg",
  quality: "A Grade",
  location: "Rural market",
  budgetMin: 10,
  budgetMax: 25,
  requiredDate: "2099-12-31",
};

test("buyer requirement validation checks crop, quantity, unit, budget and date", () => {
  assert.equal(validateProcurementRequest(request), "");
  assert.match(validateProcurementRequest({ ...request, quantity: 0 }), /Quantity/);
  assert.match(validateProcurementRequest({ ...request, unit: "bag" }), /kg, quintal, or tonne/);
  assert.match(validateProcurementRequest({ ...request, budgetMin: 30 }), /cannot exceed/);
  assert.match(validateProcurementRequest({ ...request, requiredDate: "2026-02-30" }), /date/);
});

test("request creation and status changes use authenticated database RPCs", async () => {
  const calls = [];
  const client = { rpc: async (...args) => { calls.push(args); return { data: "req-1", error: null }; } };
  assert.equal(await saveProcurementRequest(client, request), "req-1");
  await updateProcurementRequestStatus(client, "req-1", "closed");
  assert.equal(calls[0][0], "save_buyer_requirement");
  assert.equal(calls[0][1].requested_crop, "Tomato");
  assert.equal(calls[0][1].requested_budget_max, 25);
  assert.equal("buyer_id" in calls[0][1], false);
  assert.deepEqual(calls[1], ["set_buyer_requirement_status", { target_request_id: "req-1", requested_status: "closed" }]);
});

test("database authorization and network failures are surfaced without local fallback", async () => {
  const denied = { rpc: async () => ({ data: null, error: { message: "not authorized" } }) };
  await assert.rejects(saveProcurementRequest(denied, request), /not authorized/);
  await assert.rejects(updateProcurementRequestStatus(denied, "req-1", "cancelled"), /not authorized/);
  let called = false;
  await assert.rejects(saveProcurementRequest({ rpc: async () => { called = true; throw new Error("network down"); } }, request), /network down/);
  assert.equal(called, true);
});

test("request matching enforces status, date, crop, variety, quantity, unit and grade", () => {
  const listing = {
    id: "listing-1", status: "Available", crop: "Tomato", variety: "Roma",
    availableQuantity: 40, unit: "kg", quality: "A Grade",
    harvestDate: "2099-11-30", location: "Rural market", expectedPricePerUnit: 20,
  };
  assert.deepEqual(matchCropListings({ ...request, status: "open", deliveryDate: "2099-12-31" }, [listing]), [listing]);
  assert.deepEqual(matchCropListings({ ...request, status: "closed" }, [listing]), []);
  assert.deepEqual(matchCropListings({ ...request, status: "open", quantity: 41 }, [listing]), []);
  assert.deepEqual(matchCropListings({ ...request, status: "open", variety: "Cherry" }, [listing]), []);
  assert.deepEqual(matchCropListings({ ...request, status: "open", quality: "B Grade" }, [listing]), []);
});

test("request reads use RLS and map only fields returned by the database", async () => {
  let tableName = "";
  const builder = {
    select(columns) { assert.match(columns, /buyer_id/); return this; },
    order() { return this; },
    then(resolve) { return resolve({ data: [{ id: "req-1", buyer_id: "buyer-1", crop_type: "Tomato", quantity: "10", unit: "kg", location: "Town", required_date: "2099-12-31", status: "open" }], error: null }); },
  };
  const rows = await fetchProcurementRequests({ from(table) { tableName = table; return builder; } }, { id: "buyer-1", name: "Buyer" });
  assert.equal(tableName, "buyer_requirements");
  assert.equal(rows[0].buyerName, "Buyer");
  assert.equal(rows[0].quantity, 10);
});
