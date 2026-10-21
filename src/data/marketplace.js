import { calculateFinancials } from "./financials.js";

const OFFER_COLUMNS = "id,buyer_id,farmer_id,listing_id,quantity,unit,unit_price,delivery_method,transport_provider,transport_cost,transport_payer,other_farmer_charges,counter_history,status,last_responded_by,expires_at,created_at,updated_at";
const ORDER_COLUMNS = "id,offer_id,listing_id,buyer_id,farmer_id,quantity,unit,unit_price,gross_value,transport_method,transport_provider,transport_cost,transport_payer,other_farmer_deductions,farmer_net,buyer_total,status,created_at,updated_at";
const VALID_UNITS = new Set(["kg", "quintal", "tonne"]);
const VALID_DELIVERY_METHODS = new Set(["buyer_pickup", "farmer_delivery", "third_party"]);
const VALID_TRANSPORT_PAYERS = new Set(["buyer", "farmer", "third_party", "none"]);
const hasDecimalPrecision = (value, maximumDecimals) => {
  const text = String(value).trim();
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return false;
  return (text.split(".")[1] || "").length <= maximumDecimals;
};

function fail(error, action) {
  if (error) throw new Error(`${action}: ${error.message}`);
}

function isPositive(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

export function validateOffer(input) {
  if (!input || typeof input !== "object") return "Enter valid offer details.";
  if (!input.listingId) return "Choose a crop listing.";
  if (!isPositive(input.quantity) || !hasDecimalPrecision(input.quantity, 3)) return "Offer quantity must be greater than zero and use at most three decimal places.";
  if (!isPositive(input.availableQuantity) || Number(input.quantity) > Number(input.availableQuantity)) return "Offer quantity must not exceed available crop stock.";
  if (!VALID_UNITS.has(input.unit)) return "Choose kg, quintal, or tonne as the unit.";
  if (!isPositive(input.unitPrice) || !hasDecimalPrecision(input.unitPrice, 2)) return "Unit price must be positive and use at most two decimal places.";
  if (input.currency !== "INR") return "Offers currently support INR only.";
  if (!VALID_DELIVERY_METHODS.has(input.deliveryMethod)) return "Choose a supported delivery method.";
  const transportCost = Number(input.transportCost);
  const otherFarmerCharges = Number(input.otherFarmerCharges || 0);
  if (!Number.isFinite(transportCost) || transportCost < 0 || !hasDecimalPrecision(input.transportCost, 2)
    || !Number.isFinite(otherFarmerCharges) || otherFarmerCharges < 0 || !hasDecimalPrecision(input.otherFarmerCharges || 0, 2)) {
    return "Transport and other charges must be zero or a valid positive amount.";
  }
  if (input.deliveryMethod === "buyer_pickup" && transportCost !== 0) return "Buyer pickup cannot have a separate transport charge.";
  if (input.deliveryMethod === "third_party" && !String(input.transportProvider || "").trim()) return "Enter the third-party transport provider.";
  if (!VALID_TRANSPORT_PAYERS.has(input.transportPayer)) return "Choose who pays for transport.";
  if (transportCost > 0 && input.transportPayer === "none") return "Choose who pays for the transport cost.";
  if (input.deliveryMethod === "buyer_pickup" && input.transportPayer !== "none") return "Buyer pickup has no separate platform transport charge.";
  const financials = calculateFinancials({
    quantity: input.quantity,
    unitPrice: input.unitPrice,
    deliveryMethod: input.deliveryMethod,
    transportCost,
    transportPayer: input.transportPayer,
    otherFarmerCharges,
  });
  if (financials.estimatedFarmerNet < 0) return "Farmer deductions cannot exceed the crop value.";
  return "";
}

function mapOffer(row, { user, crops }) {
  const crop = crops.find((item) => item.id === row.listing_id);
  const counterHistory = Array.isArray(row.counter_history) ? row.counter_history : [];
  const lastCounter = counterHistory[counterHistory.length - 1];
  const counteredBy = row.last_responded_by === row.buyer_id ? "buyer" : "farmer";
  const history = [
    { by: "buyer", action: "Offer submitted", at: row.created_at },
    ...counterHistory.map((entry) => ({
      by: entry.actor_id === row.buyer_id ? "buyer" : "farmer",
      action: "Counter-offer",
      pricePerUnit: Number(entry.unit_price),
      at: entry.created_at,
    })),
    ...(row.status === "rejected" ? [{ by: counteredBy, action: "Offer rejected", at: row.updated_at }] : []),
  ];
  return {
    id: row.id,
    cropId: row.listing_id,
    cropName: crop?.crop || "Crop listing",
    farmerName: row.farmer_id === user.id ? user.name || "Farmer" : "Farmer",
    buyerName: row.buyer_id === user.id ? user.name || "Buyer" : "Buyer",
    buyerRole: "buyer",
    buyerId: row.buyer_id,
    farmerId: row.farmer_id,
    quantity: Number(row.quantity),
    unit: row.unit,
    pricePerUnit: Number(row.unit_price),
    counterPricePerUnit: lastCounter ? Number(lastCounter.unit_price) : null,
    counteredBy: row.status === "countered" ? counteredBy : null,
    deliveryMethod: row.delivery_method,
    transportProvider: row.transport_provider || "",
    transportCost: Number(row.transport_cost),
    transportPayer: row.transport_payer,
    otherFarmerCharges: Number(row.other_farmer_charges),
    status: row.status,
    history,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
  };
}

function mapOrder(row, events, user, crops) {
  const crop = crops.find((item) => item.id === row.listing_id);
  const financials = {
    saleValue: Number(row.gross_value),
    transportCost: Number(row.transport_cost),
    transportPayer: row.transport_payer,
    otherFarmerCharges: Number(row.other_farmer_deductions),
    estimatedFarmerNet: Number(row.farmer_net),
    buyerTotal: Number(row.buyer_total),
  };
  return {
    id: row.id,
    cropId: row.listing_id,
    cropName: crop?.crop || "Crop listing",
    farmerName: row.farmer_id === user.id ? user.name || "Farmer" : "Farmer",
    buyerName: row.buyer_id === user.id ? user.name || "Buyer" : "Buyer",
    farmerId: row.farmer_id,
    buyerId: row.buyer_id,
    quantity: Number(row.quantity),
    unit: row.unit,
    unitPrice: Number(row.unit_price),
    deliveryMethod: row.transport_method,
    transportProvider: row.transport_provider || "",
    paymentStatus: "Not verified",
    status: row.status,
    financials,
    events: events
      .filter((event) => event.order_id === row.id)
      .map((event) => ({ label: event.event_type.replaceAll("_", " "), at: event.created_at, details: event.details })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchMarketplaceData(client, user, role, crops) {
  const [offersResult, ordersResult] = await Promise.all([
    client.from("offers").select(OFFER_COLUMNS).order("created_at", { ascending: false }),
    client.from("orders").select(ORDER_COLUMNS).order("created_at", { ascending: false }),
  ]);
  fail(offersResult.error, "Could not load offers");
  fail(ordersResult.error, "Could not load orders");
  const orders = ordersResult.data || [];
  let events = [];
  if (orders.length) {
    const eventResult = await client
      .from("order_events")
      .select("order_id,event_type,details,created_at")
      .in("order_id", orders.map((order) => order.id))
      .order("created_at", { ascending: true });
    fail(eventResult.error, "Could not load order history");
    events = eventResult.data || [];
  }
  return {
    offers: (offersResult.data || []).map((row) => mapOffer(row, { user, crops })),
    orders: orders.map((row) => mapOrder(row, events, user, crops)),
  };
}

export async function createOffer(client, input) {
  const validationError = validateOffer(input);
  if (validationError) throw new Error(validationError);
  if (!client || !input.userId) throw new Error("Sign in as a buyer before making an offer.");
  const { data, error } = await client.rpc("create_offer", {
    target_listing_id: input.listingId,
    requested_quantity: Number(input.quantity),
    requested_unit_price: Number(input.unitPrice),
    requested_delivery_method: input.deliveryMethod,
    requested_transport_provider: String(input.transportProvider || "").trim() || null,
    requested_transport_cost: Number(input.transportCost),
    requested_transport_payer: input.transportPayer,
    requested_farmer_charges: Number(input.otherFarmerCharges || 0),
    request_id: input.requestId || globalThis.crypto.randomUUID(),
  });
  fail(error, "Could not submit offer");
  if (!data) throw new Error("The database did not confirm that the offer was saved.");
  return data;
}

export async function respondToOffer(client, offerId, response, counterPrice) {
  if (!offerId || !["counter", "reject"].includes(response)) throw new Error("Choose a valid offer response.");
  if (response === "counter" && (!isPositive(counterPrice) || !hasDecimalPrecision(counterPrice, 2))) {
    throw new Error("Counter price must be positive and use at most two decimal places.");
  }
  const { error } = await client.rpc("respond_to_offer", {
    target_offer_id: offerId,
    response,
    counter_price: response === "counter" ? Number(counterPrice) : null,
  });
  fail(error, `Could not ${response} offer`);
}

export async function acceptOffer(client, offerId) {
  if (!offerId) throw new Error("Choose an offer to accept.");
  const { data, error } = await client.rpc("accept_offer", { target_offer_id: offerId });
  fail(error, "Could not accept offer");
  return data || null;
}

export async function transitionOrder(client, orderId, action) {
  if (!orderId || !["ready", "pickup", "delivered", "cancel", "dispute"].includes(action)) {
    throw new Error("Choose a valid order action.");
  }
  const { data, error } = await client.rpc("transition_order", {
    target_order_id: orderId,
    requested_action: action,
  });
  fail(error, "Could not update order");
  if (!data) throw new Error("The database did not confirm the order status update.");
  return data;
}

export async function fetchQualityAssessments(client) {
  const { data, error } = await client
    .from("quality_assessments")
    .select("id,listing_id,farmer_id,latitude,longitude,gps_accuracy_m,photo_captured_at,gps_captured_at,submitted_at,result,limitations")
    .order("submitted_at", { ascending: false });
  fail(error, "Could not load quality assessments");
  return (data || []).map((row) => ({
    id: row.id,
    cropId: row.listing_id,
    farmerId: row.farmer_id,
    photoCapturedAt: row.photo_captured_at,
    gps: {
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      accuracy: Number(row.gps_accuracy_m),
      timestamp: row.gps_captured_at,
    },
    gpsCapturedAt: row.gps_captured_at,
    submittedAt: row.submitted_at,
    status: "Submitted; awaiting expert review",
    result: row.result,
    integrityNote: row.limitations,
  }));
}

export function attachCropNamesToAssessments(assessments, crops) {
  return assessments.map((assessment) => ({
    ...assessment,
    cropName: crops.find((crop) => crop.id === assessment.cropId)?.crop || "Crop listing",
  }));
}
