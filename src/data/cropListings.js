const units = new Set(["kg", "quintal", "tonne"]);
const cropListingColumns = "id, farmer_id, crop_type, variety, quantity, available_quantity, unit, grade, harvest_date, location, expected_price, description, status, created_at, updated_at";

export function validateCropListing(crop) {
  if (!crop || typeof crop !== "object") return "Enter valid crop details.";
  if (typeof crop.crop !== "string" || !crop.crop.trim() || crop.crop.trim().length > 120) return "Enter a crop name up to 120 characters.";
  if (!Number.isFinite(Number(crop.quantity)) || Number(crop.quantity) <= 0) return "Quantity must be greater than zero.";
  if (!units.has(crop.unit)) return "Choose kg, quintal, or tonne as the unit.";
  if (!Number.isFinite(Number(crop.expectedPricePerUnit)) || Number(crop.expectedPricePerUnit) <= 0) return "Expected price must be greater than zero.";
  if (typeof crop.location !== "string" || !crop.location.trim() || crop.location.trim().length > 240) return "Enter a location up to 240 characters.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(crop.harvestDate)) return "Enter a valid harvest date.";
  const [year, month, day] = crop.harvestDate.split("-").map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (parsedDate.getUTCFullYear() !== year || parsedDate.getUTCMonth() !== month - 1 || parsedDate.getUTCDate() !== day) return "Enter a valid harvest date.";
  return "";
}

export function mapCropListing(row, farmerName = "Farmer") {
  const statuses = {
    available: "Available",
    reserved: "Reserved",
    sold_out: "Sold out",
    archived: "Archived",
    under_review: "Under review",
  };
  return {
    id: row.id,
    crop: row.crop_type,
    variety: row.variety || "",
    quantity: Number(row.quantity),
    availableQuantity: Number(row.available_quantity),
    unit: row.unit,
    quality: row.grade,
    harvestDate: row.harvest_date,
    location: row.location,
    expectedPricePerUnit: Number(row.expected_price),
    description: row.description || "",
    notes: row.description || "",
    status: statuses[row.status] || row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    farmerName,
    farmerId: row.farmer_id,
    photo: "",
  };
}

function toDatabaseRow(crop, farmerId) {
  return {
    farmer_id: farmerId,
    crop_type: crop.crop.trim(),
    variety: crop.variety?.trim() || null,
    quantity: Number(crop.quantity),
    unit: crop.unit,
    grade: crop.quality || "Not assessed",
    harvest_date: crop.harvestDate,
    location: crop.location.trim(),
    expected_price: Number(crop.expectedPricePerUnit),
    description: crop.description?.trim() || null,
    status: crop.status === "Under review" ? "under_review" : "available",
  };
}

function ensureNoError(error, action) {
  if (error) throw new Error(`${action}: ${error.message}`);
}

export async function fetchCropListings(client, user, role) {
  let query = client
    .from("crop_listings")
    .select(cropListingColumns)
    .order("created_at", { ascending: false });

  if (role === "farmer") query = query.eq("farmer_id", user.id);
  else if (role !== "admin") query = query.eq("status", "available");

  const { data, error } = await query;
  ensureNoError(error, "Could not load crop listings");
  return (data || []).map((row) => mapCropListing(row, row.farmer_id === user.id ? user.name : "Farmer"));
}

export async function saveCropListing(client, farmerId, crop, listingId) {
  const validationError = validateCropListing(crop);
  if (validationError) throw new Error(validationError);
  if (!client || !farmerId) throw new Error("Sign in before saving crop listings.");

  const values = toDatabaseRow(crop, farmerId);
  let result;
  if (listingId) {
    result = await client
      .from("crop_listings")
      .update(values)
      .eq("id", listingId)
      .eq("farmer_id", farmerId)
      .select(cropListingColumns)
      .single();
  } else {
    result = await client.from("crop_listings").insert(values).select(cropListingColumns).single();
  }
  ensureNoError(result.error, "Could not save crop listing");
  if (!result.data?.id) throw new Error("The database did not confirm the crop listing save.");
  return mapCropListing(result.data, crop.farmerName || "Farmer");
}

export async function deleteCropListing(client, farmerId, listingId) {
  if (!client || !farmerId || !listingId) throw new Error("Sign in and select a crop listing before deleting.");
  const { data, error } = await client
    .from("crop_listings")
    .delete()
    .eq("id", listingId)
    .eq("farmer_id", farmerId)
    .select("id")
    .maybeSingle();
  ensureNoError(error, "Could not delete crop listing. It may be linked to offers or assessments.");
  if (!data?.id) throw new Error("Crop listing not found or you do not have permission to delete it.");
}
