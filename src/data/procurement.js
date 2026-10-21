const UNITS = new Set(["kg", "quintal", "tonne"]);

function fail(error, action) {
  if (error) throw new Error(`${action}: ${error.message}`);
}

export function validateProcurementRequest(request) {
  if (!request || !String(request.crop || "").trim() || String(request.crop).trim().length > 120) return "Enter a crop name up to 120 characters.";
  if (request.variety && String(request.variety).trim().length > 120) return "Variety must be 120 characters or fewer.";
  if (!Number.isFinite(Number(request.quantity)) || Number(request.quantity) <= 0) return "Quantity must be greater than zero.";
  if (!UNITS.has(request.unit)) return "Choose kg, quintal, or tonne.";
  if (!String(request.location || "").trim() || String(request.location).trim().length > 240) return "Enter a delivery location up to 240 characters.";
  if (request.budgetMin !== "" && request.budgetMin != null && (!Number.isFinite(Number(request.budgetMin)) || Number(request.budgetMin) < 0)) return "Minimum budget cannot be negative.";
  if (request.budgetMax !== "" && request.budgetMax != null && (!Number.isFinite(Number(request.budgetMax)) || Number(request.budgetMax) <= 0)) return "Maximum budget must be greater than zero.";
  if (request.budgetMin != null && request.budgetMin !== "" && request.budgetMax != null && request.budgetMax !== "" && Number(request.budgetMin) > Number(request.budgetMax)) return "Minimum budget cannot exceed maximum budget.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(request.requiredDate || ""))) return "Choose a valid required delivery date.";
  const [year, month, day] = request.requiredDate.split("-").map(Number);
  const requiredDate = new Date(Date.UTC(year, month - 1, day));
  if (requiredDate.getUTCFullYear() !== year || requiredDate.getUTCMonth() !== month - 1 || requiredDate.getUTCDate() !== day) return "Choose a valid required delivery date.";
  if (requiredDate < new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`)) return "Required delivery date must be today or later.";
  return "";
}

export function mapProcurementRequest(row, currentUser) {
  return {
    id: row.id,
    buyerId: row.buyer_id,
    buyerName: row.buyer_id === currentUser?.id ? currentUser.name || "Buyer" : "Buyer",
    crop: row.crop_type,
    variety: row.required_variety || row.variety || "",
    quantity: Number(row.quantity),
    unit: row.unit,
    quality: row.quality || "",
    location: row.location,
    budgetMin: row.budget_min == null ? null : Number(row.budget_min),
    budgetMax: row.budget_max == null ? null : Number(row.budget_max),
    targetPrice: row.budget_max == null ? null : Number(row.budget_max),
    currency: row.currency || "INR",
    deliveryDate: row.required_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchProcurementRequests(client, user) {
  const { data, error } = await client.from("buyer_requirements")
    .select("id,buyer_id,crop_type,variety,required_variety,quantity,unit,quality,location,budget_min,budget_max,currency,required_date,status,created_at,updated_at")
    .order("created_at", { ascending: false });
  fail(error, "Could not load procurement requests");
  return (data || []).map((row) => mapProcurementRequest(row, user));
}

export async function saveProcurementRequest(client, request, requestId = null) {
  const validationError = validateProcurementRequest(request);
  if (validationError) throw new Error(validationError);
  if (!client) throw new Error("Supabase is not configured. The request was not saved.");
  const { data, error } = await client.rpc("save_buyer_requirement", {
    target_request_id: requestId,
    requested_crop: String(request.crop).trim(),
    requested_variety: String(request.variety || "").trim() || null,
    requested_quantity: Number(request.quantity),
    requested_unit: request.unit,
    requested_quality: String(request.quality || "").trim() || null,
    requested_location: String(request.location).trim(),
    requested_budget_min: request.budgetMin === "" || request.budgetMin == null ? null : Number(request.budgetMin),
    requested_budget_max: request.budgetMax === "" || request.budgetMax == null ? null : Number(request.budgetMax),
    requested_date: request.requiredDate,
  });
  fail(error, "Could not save procurement request");
  if (!data) throw new Error("The database did not confirm the procurement request.");
  return data;
}

export async function updateProcurementRequestStatus(client, requestId, status) {
  if (!requestId || !["closed", "cancelled"].includes(status)) throw new Error("Choose a valid request status.");
  const { error } = await client.rpc("set_buyer_requirement_status", {
    target_request_id: requestId,
    requested_status: status,
  });
  fail(error, "Could not update procurement request");
}

export function matchCropListings(request, listings, { now = new Date(), locationFilter = "" } = {}) {
  if (!request || request.status !== "open" || Date.parse(`${request.deliveryDate}T23:59:59`) < now.getTime()) return [];
  const query = String(locationFilter || "").trim().toLocaleLowerCase();
  const requirementLocation = String(request.location || "").trim().toLocaleLowerCase();
  return listings.filter((crop) => {
    if (crop.status !== "Available" || Number(crop.availableQuantity) < Number(request.quantity) || crop.unit !== request.unit) return false;
    if (crop.crop.toLocaleLowerCase() !== request.crop.toLocaleLowerCase()) return false;
    if (request.variety && String(crop.variety || "").toLocaleLowerCase() !== request.variety.toLocaleLowerCase()) return false;
    if (request.quality && !["any grade", "any"].includes(request.quality.toLocaleLowerCase())
      && String(crop.quality || "").toLocaleLowerCase() !== request.quality.toLocaleLowerCase()) return false;
    if (!crop.harvestDate || !/^\d{4}-\d{2}-\d{2}$/.test(crop.harvestDate)
      || Date.parse(`${crop.harvestDate}T00:00:00`) > Date.parse(`${request.deliveryDate}T23:59:59`)) return false;
    if (query && !String(crop.location).toLocaleLowerCase().includes(query)) return false;
    if (requirementLocation && !String(crop.location).toLocaleLowerCase().includes(requirementLocation)
      && !requirementLocation.includes(String(crop.location).toLocaleLowerCase())) return false;
    if (request.budgetMax != null && Number(crop.expectedPricePerUnit) > request.budgetMax) return false;
    if (request.budgetMin != null && Number(crop.expectedPricePerUnit) < request.budgetMin) return false;
    return true;
  });
}
