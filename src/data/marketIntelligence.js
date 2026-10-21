const PRICE_COLUMNS = "id,crop_type,variety,market_name,location,min_price,max_price,modal_price,currency,unit,source,observed_at,last_fetched_at,freshness_status";
const VALID_UNITS = new Set(["kg", "quintal", "tonne"]);
const LIVE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function fail(error, action) {
  if (error) throw new Error(`${action}: ${error.message}`);
}

function freshness(row, now) {
  const observedAt = Date.parse(row.observed_at);
  if (!Number.isFinite(observedAt)) return "unknown";
  if (now - observedAt > LIVE_MAX_AGE_MS) return "stale";
  return row.freshness_status === "live" ? "live" : row.freshness_status;
}

export async function fetchMarketPrices(client, { crop = "", location = "", now = Date.now() } = {}) {
  let query = client.from("market_prices").select(PRICE_COLUMNS).order("observed_at", { ascending: false }).limit(100);
  if (crop.trim()) query = query.ilike("crop_type", `%${crop.trim()}%`);
  if (location.trim()) query = query.ilike("location", `%${location.trim()}%`);
  const { data, error } = await query;
  fail(error, "Could not load recorded market prices");
  return (data || []).map((row) => ({
    id: row.id,
    crop: row.crop_type,
    variety: row.variety || "",
    marketName: row.market_name,
    location: row.location,
    minPrice: row.min_price == null ? null : Number(row.min_price),
    maxPrice: row.max_price == null ? null : Number(row.max_price),
    modalPrice: row.modal_price == null ? null : Number(row.modal_price),
    currency: row.currency || "INR",
    unit: row.unit,
    source: row.source,
    observedAt: row.observed_at,
    lastFetchedAt: row.last_fetched_at,
    freshness: freshness(row, now),
  }));
}

export async function refreshMarketPrices(client, input) {
  if (!client) throw new Error("Supabase is not configured.");
  const crop = String(input?.crop || "").trim();
  const location = String(input?.location || "").trim();
  if (crop.length > 120 || location.length > 240) throw new Error("Crop or location search is too long.");
  const { data, error } = await client.functions.invoke("market-prices", { body: { crop, location } });
  const cached = await fetchMarketPrices(client, { crop, location });
  if (error) {
    return {
      status: cached.length ? "cached" : "unavailable",
      observations: cached,
      message: cached.length
        ? `External refresh unavailable; showing recorded observations. ${error.message}`
        : `No provider response is available. ${error.message}`,
    };
  }
  if (!data || !["live", "cached", "unavailable"].includes(data.status)) {
    return { status: cached.length ? "cached" : "unavailable", observations: cached, message: "Market provider returned an unsupported response." };
  }
  return {
    status: data.status === "live" && cached.some((row) => row.freshness === "live") ? "live" : cached.length ? "cached" : "unavailable",
    observations: cached,
    message: data.message || (cached.length ? "" : "No verified market observations are available."),
  };
}

export function validateMarketObservation(row) {
  if (!row || !String(row.crop_type || "").trim() || !String(row.market_name || "").trim()
    || !String(row.location || "").trim() || !String(row.source || "").trim()) return "Market observations require crop, market, location, and source.";
  if (!VALID_UNITS.has(row.unit) || row.currency !== "INR") return "Market observations must use a supported unit and INR currency.";
  for (const field of ["min_price", "max_price", "modal_price"]) {
    if (row[field] != null && (!Number.isFinite(Number(row[field])) || Number(row[field]) < 0)) return `${field} must be a non-negative number.`;
  }
  if (row.min_price != null && row.max_price != null && Number(row.min_price) > Number(row.max_price)) return "Minimum market price cannot exceed maximum price.";
  if (!Number.isFinite(Date.parse(row.observed_at)) || !Number.isFinite(Date.parse(row.last_fetched_at))) return "Observation and fetch timestamps are required.";
  if (!["live", "cached", "historical", "estimated", "demo"].includes(row.freshness_status)) return "Choose a valid market data freshness status.";
  return "";
}

export function buildSellingRecommendations({ crop, offers = [], prices = [], requests = [], now = Date.now() }) {
  const relevantPrices = prices.filter((price) => price.crop.toLocaleLowerCase() === crop.crop.toLocaleLowerCase()
    && price.unit === crop.unit && price.freshness === "live" && Number.isFinite(price.modalPrice));
  const relevantRequests = requests.filter((request) => request.status === "open"
    && request.crop.toLocaleLowerCase() === crop.crop.toLocaleLowerCase() && request.unit === crop.unit
    && Number(request.quantity) > 0 && Number(crop.availableQuantity) >= Number(request.quantity)
    && Date.parse(`${request.deliveryDate}T23:59:59`) >= now);
  const relevantOffers = offers.filter((offer) => offer.cropId === crop.id && ["pending", "countered"].includes(offer.status));
  const options = relevantOffers.map((offer) => {
    const unitPrice = offer.counterPricePerUnit || offer.pricePerUnit;
    const gross = Math.round(Number(offer.quantity) * Number(unitPrice) * 100) / 100;
    const transportCost = offer.deliveryMethod === "buyer_pickup" ? 0 : Number(offer.transportCost) || 0;
    const farmerTransport = offer.transportPayer === "farmer" ? transportCost : 0;
    const otherCharges = Number(offer.otherFarmerCharges) || 0;
    const net = Math.round((gross - farmerTransport - otherCharges) * 100) / 100;
    const reference = relevantPrices[0];
    return {
      type: "open_offer",
      title: `${offer.buyerName || "Buyer"}'s ${offer.status} offer`,
      quantity: Number(offer.quantity),
      unit: crop.unit,
      unitPrice,
      gross,
      transportCost,
      transportPayer: transportCost ? offer.transportPayer : "none",
      otherCharges,
      farmerNet: net,
      confirmed: false,
      reasons: [
        `A buyer submitted this ${offer.status} offer; it is not a confirmed sale.`,
        reference ? `Unit price is ${Math.round((unitPrice - reference.modalPrice) * 100) / 100} ${reference.currency}/${reference.unit} relative to the latest sourced modal price from ${reference.marketName}.` : "No fresh same-unit market price is available for comparison.",
      ],
      assumptions: ["Offer terms remain subject to negotiation and acceptance.", "Payment and delivery performance are not verified."],
    };
  });
  if (options.length) {
    return {
      options: options.sort((left, right) => right.farmerNet - left.farmerNet).slice(0, 3),
      missing: relevantPrices.length ? [] : ["fresh same-unit market price"],
      disclaimer: "Estimates only; no sale or profit is guaranteed.",
    };
  }
  return {
    options: [],
    missing: [
      ...(relevantOffers.length ? [] : ["open offers for this crop lot"]),
      ...(relevantPrices.length ? [] : ["fresh sourced market observation"]),
      ...(relevantRequests.length ? [] : ["matching open buyer procurement request"]),
    ],
    demandCount: relevantRequests.length,
    disclaimer: "No trustworthy offer-based comparison is available yet. Browse the marketplace; do not treat a missing estimate as a price.",
  };
}
