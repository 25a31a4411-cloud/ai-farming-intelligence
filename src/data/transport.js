const TRANSPORT_STATUSES = new Set(["requested", "accepted", "pickup", "in_transit", "delivered", "issue", "cancelled"]);
const TRANSPORT_ACTIONS = new Set(["accept", "pickup", "in_transit", "delivered", "issue", "cancel"]);

function fail(error, action) {
  if (error) throw new Error(`${action}: ${error.message}`);
}

function validAmount(value) {
  const text = String(value ?? "").trim();
  return /^\d+(?:\.\d{1,2})?$/.test(text) && Number.isFinite(Number(text)) && Number(text) >= 0;
}

export function validateTransportRequest(input) {
  if (!input?.order?.id) return "Choose an order before arranging transport.";
  if (!String(input.pickup || "").trim() || String(input.pickup).trim().length > 240) return "Enter a pickup location (up to 240 characters).";
  if (!String(input.destination || "").trim() || String(input.destination).trim().length > 240) return "Enter a destination (up to 240 characters).";
  const requestedDate = input.requestedDate || "";
  const parsedDate = new Date(`${requestedDate}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
    || Number.isNaN(parsedDate.getTime())
    || parsedDate.toISOString().slice(0, 10) !== requestedDate
    || requestedDate < new Date().toISOString().slice(0, 10)) {
    return "Choose a valid transport date today or later.";
  }
  if (!validAmount(input.cost)) return "Transport cost must be zero or a positive amount with at most two decimal places.";
  if (!["buyer", "farmer", "third_party", "none"].includes(input.payer)) return "Choose who pays for transport.";
  const provider = String(input.provider || "").trim();
  if (provider.length > 200) return "Transport provider must be 200 characters or fewer.";
  const order = input.order;
  if (order.deliveryMethod === "buyer_pickup") {
    if (Number(input.cost) !== 0 || input.payer !== "none" || provider) return "Buyer pickup has no separate transport provider or charge.";
  } else {
    if (Number(input.cost) !== Number(order.financials?.transportCost) || input.payer !== order.financials?.transportPayer) {
      return "Transport terms must match the accepted order.";
    }
    if (order.deliveryMethod === "third_party" && provider !== String(order.transportProvider || "").trim()) {
      return "Use the third-party provider recorded in the accepted order.";
    }
  }
  return "";
}

export async function fetchTransportRequests(client, orders) {
  const orderIds = orders.map((order) => order.id).filter(Boolean);
  if (!orderIds.length) return [];
  const { data, error } = await client
    .from("transport_requests")
    .select("id,order_id,provider,route,agreed_cost,payer,status,requester_id,requested_date,accepted_at,picked_up_at,delivered_at,cancelled_at,created_at,updated_at")
    .in("order_id", orderIds)
    .order("created_at", { ascending: false });
  fail(error, "Could not load transport requests");
  const requests = data || [];
  if (!requests.length) return [];
  const eventResult = await client
    .from("transport_events")
    .select("id,transport_request_id,actor_id,event_type,details,created_at")
    .in("transport_request_id", requests.map((request) => request.id))
    .order("created_at", { ascending: true });
  fail(eventResult.error, "Could not load transport history");
  return requests.map((request) => ({
    id: request.id,
    orderId: request.order_id,
    provider: request.provider || "",
    route: request.route || {},
    cost: Number(request.agreed_cost),
    payer: request.payer,
    status: request.status,
    requesterId: request.requester_id,
    requestedDate: request.requested_date,
    acceptedAt: request.accepted_at,
    pickedUpAt: request.picked_up_at,
    deliveredAt: request.delivered_at,
    cancelledAt: request.cancelled_at,
    createdAt: request.created_at,
    updatedAt: request.updated_at,
    events: (eventResult.data || [])
      .filter((event) => event.transport_request_id === request.id)
      .map((event) => ({ type: event.event_type, at: event.created_at, details: event.details })),
  }));
}

export async function requestOrderTransport(client, input) {
  const validationError = validateTransportRequest(input);
  if (validationError) throw new Error(validationError);
  if (!client?.rpc) throw new Error("Sign in before arranging transport.");
  const { data, error } = await client.rpc("request_order_transport", {
    target_order_id: input.order.id,
    requested_provider: String(input.provider || "").trim() || null,
    requested_pickup: String(input.pickup).trim(),
    requested_destination: String(input.destination).trim(),
    requested_date: input.requestedDate,
    requested_cost: Number(input.cost),
    requested_payer: input.payer,
    request_id: input.requestId || globalThis.crypto.randomUUID(),
  });
  fail(error, "Could not arrange transport");
  if (!data) throw new Error("The database did not confirm the transport request.");
  return data;
}

export async function transitionOrderTransport(client, transportId, action) {
  if (!transportId || !TRANSPORT_ACTIONS.has(action)) throw new Error("Choose a valid transport action.");
  const { data, error } = await client.rpc("transition_order_transport", {
    target_transport_id: transportId,
    requested_action: action,
  });
  fail(error, "Could not update transport");
  if (!TRANSPORT_STATUSES.has(data)) throw new Error("The database returned an invalid transport status.");
  return data;
}
