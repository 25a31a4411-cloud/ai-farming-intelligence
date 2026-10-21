import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchTransportRequests,
  requestOrderTransport,
  transitionOrderTransport,
  validateTransportRequest,
} from "./transport.js";
import { fetchNotifications, markNotificationRead } from "./notifications.js";
import { createPaymentProviderAdapter, fetchPaymentsForOrders, PAYMENT_PROVIDER_STATUS } from "./payments.js";

const order = {
  id: "order-1",
  deliveryMethod: "farmer_delivery",
  transportProvider: "",
  financials: { transportCost: 25, transportPayer: "buyer" },
};
const validRequest = {
  order,
  provider: "",
  pickup: "Farm gate",
  destination: "Market",
  requestedDate: new Date().toISOString().slice(0, 10),
  cost: 25,
  payer: "buyer",
  requestId: "request-1",
};

test("transport validation preserves accepted financial terms and rejects invalid inputs", () => {
  assert.equal(validateTransportRequest(validRequest), "");
  assert.match(validateTransportRequest({ ...validRequest, cost: 26 }), /match the accepted order/);
  assert.match(validateTransportRequest({ ...validRequest, requestedDate: "invalid" }), /valid transport date/);
  assert.match(validateTransportRequest({ ...validRequest, pickup: " " }), /pickup location/);
  assert.match(validateTransportRequest({
    ...validRequest,
    order: { ...order, deliveryMethod: "buyer_pickup" },
    cost: 2,
  }), /no separate transport/);
  assert.match(validateTransportRequest({
    ...validRequest,
    order: { ...order, deliveryMethod: "third_party", transportProvider: "Farm Truck" },
    provider: "Other Truck",
  }), /recorded in the accepted order/);
});

test("transport writes use the database RPC and never identify a different requester", async () => {
  let call;
  const client = { rpc: async (...args) => {
    call = args;
    return { data: args[0] === "transition_order_transport" ? "accepted" : "transport-1", error: null };
  } };
  assert.equal(await requestOrderTransport(client, validRequest), "transport-1");
  assert.equal(call[0], "request_order_transport");
  assert.equal(call[1].target_order_id, "order-1");
  assert.equal(call[1].request_id, "request-1");
  assert.equal("requester_id" in call[1], false);
  assert.equal(await transitionOrderTransport(client, "transport-1", "accept"), "accepted");
  assert.deepEqual(call, ["transition_order_transport", {
    target_transport_id: "transport-1",
    requested_action: "accept",
  }]);
});

test("transport mutation and retrieval errors are surfaced without local fallback", async () => {
  const denied = { rpc: async () => ({ data: null, error: { message: "not authorized" } }) };
  await assert.rejects(requestOrderTransport(denied, validRequest), /Could not arrange transport: not authorized/);
  await assert.rejects(transitionOrderTransport(denied, "transport-1", "accept"), /Could not update transport: not authorized/);
  assert.match(validateTransportRequest({ ...validRequest, cost: 1.234 }), /Transport cost/);
  const unavailable = {
    from() {
      return {
        select() { return this; },
        in() { return this; },
        order() { return this; },
        then(resolve) { resolve({ data: null, error: { message: "network unavailable" } }); },
      };
    },
  };
  await assert.rejects(fetchTransportRequests(unavailable, [order]), /Could not load transport requests: network unavailable/);
});

test("transport reads are limited to returned order IDs and include event history", async () => {
  const calls = [];
  const client = {
    from(table) {
      calls.push(table);
      const query = {
        select() { return this; },
        in(_column, ids) { assert.deepEqual(ids, table === "transport_requests" ? ["order-1"] : ["transport-1"]); return this; },
        order() { return this; },
        then(resolve) {
          const data = table === "transport_requests"
            ? [{ id: "transport-1", order_id: "order-1", route: { pickup: "Farm", destination: "Market" }, agreed_cost: 25, payer: "buyer", status: "requested", created_at: "2026-01-01T00:00:00Z" }]
            : [{ id: "event-1", transport_request_id: "transport-1", event_type: "requested", created_at: "2026-01-01T00:00:00Z" }];
          resolve({ data, error: null });
        },
      };
      return query;
    },
  };
  const result = await fetchTransportRequests(client, [order]);
  assert.deepEqual(calls, ["transport_requests", "transport_events"]);
  assert.equal(result[0].status, "requested");
  assert.equal(result[0].events[0].type, "requested");
});

test("notification reads and mark-read are owner-scoped database operations", async () => {
  const calls = [];
  const client = {
    from(table) {
      const query = {
        select(...args) { this.isCountQuery = args[1]?.head === true; calls.push([table, "select", ...args]); return this; },
        order() { return this; },
        limit() { return this; },
        is() { return this; },
        then(resolve) {
          resolve(!this.isCountQuery
            ? { data: [{ id: "notice-1", notification_type: "order_status", message: "Order update", created_at: "2026-01-01T00:00:00Z" }], error: null }
            : { data: null, count: 1, error: null });
        },
      };
      return query;
    },
    rpc: async (...args) => { calls.push(args); return { data: "2026-01-01T01:00:00Z", error: null }; },
  };
  const result = await fetchNotifications(client);
  assert.equal(result.notifications[0].message, "Order update");
  assert.equal(result.unreadCount, 1);
  assert.equal(await markNotificationRead(client, "notice-1"), "2026-01-01T01:00:00Z");
  assert.deepEqual(calls.at(-1), ["mark_notification_read", { target_notification_id: "notice-1" }]);
  const unavailable = {
    from() {
      return {
        select() { return this; },
        order() { return this; },
        limit() { return this; },
        is() { return this; },
        then(resolve) { resolve({ data: null, count: null, error: { message: "network unavailable" } }); },
      };
    },
  };
  await assert.rejects(fetchNotifications(unavailable), /Could not load notifications: network unavailable/);
});

test("payment records are read-only, RLS-scoped and never mark an unverified row as verified", async () => {
  let tableName;
  const client = {
    from(table) {
      tableName = table;
      return {
        select() { return this; },
        in(_column, ids) { assert.deepEqual(ids, ["order-1"]); return this; },
        order() { return this; },
        then(resolve) {
          resolve({ data: [
            { id: "payment-1", order_id: "order-1", amount: 12, status: "pending", verified_at: null },
          ], error: null });
        },
      };
    },
  };
  const result = await fetchPaymentsForOrders(client, [order]);
  assert.equal(tableName, "payments");
  assert.equal(result.get("order-1").verified, false);
  assert.equal(result.get("order-1").status, "pending");
  assert.deepEqual(await fetchPaymentsForOrders(client, []), new Map());
  const unavailable = {
    from() {
      return {
        select() { return this; },
        in() { return this; },
        order() { return this; },
        then(resolve) { resolve({ data: null, error: { message: "network unavailable" } }); },
      };
    },
  };
  await assert.rejects(fetchPaymentsForOrders(unavailable, [order]), /Could not load payment records: network unavailable/);
});

test("unconfigured payment adapter refuses checkout, verification and refund without claiming success", async () => {
  const adapter = createPaymentProviderAdapter();
  assert.deepEqual(PAYMENT_PROVIDER_STATUS, {
    configured: false,
    mode: "read-only",
    message: "No trusted server-side payment provider is configured.",
  });
  await assert.rejects(adapter.createCheckout({ orderId: "order-1" }), /unavailable/);
  await assert.rejects(adapter.verifyWebhook({}), /unavailable/);
  await assert.rejects(adapter.refund({ orderId: "order-1" }), /unavailable/);
});
