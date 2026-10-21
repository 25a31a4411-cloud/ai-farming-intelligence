function fail(error, action) {
  if (error) throw new Error(`${action}: ${error.message}`);
}

export function validateCropHealthNote(note) {
  if (!note || typeof note !== "object") return "Enter a crop observation.";
  if (!note.listingId) return "Choose one of your crop listings.";
  if (!["health", "harvest_readiness"].includes(note.type)) return "Choose crop health or harvest readiness.";
  if (!String(note.note || "").trim() || String(note.note).trim().length > 2000) return "Enter a note between 1 and 2000 characters.";
  if (note.consentGiven !== true) return "Consent is required to save this note to your account.";
  return "";
}

export async function fetchCropHealthNotes(client) {
  const { data, error } = await client.from("crop_health_notes")
    .select("id,listing_id,farmer_id,author_id,assessment_id,note,observation_type,consent_at,created_at")
    .order("created_at", { ascending: false });
  fail(error, "Could not load crop health notes");
  return (data || []).map((row) => ({
    id: row.id,
    cropId: row.listing_id,
    farmerId: row.farmer_id,
    authorId: row.author_id,
    assessmentId: row.assessment_id,
    note: row.note,
    type: row.observation_type,
    consentAt: row.consent_at,
    createdAt: row.created_at,
    source: "farmer_observation",
  }));
}

export async function saveCropHealthNote(client, note) {
  const validationError = validateCropHealthNote(note);
  if (validationError) throw new Error(validationError);
  const { data, error } = await client.rpc("save_crop_health_note", {
    target_listing_id: note.listingId,
    requested_note: String(note.note).trim(),
    requested_type: note.type,
    target_assessment_id: note.assessmentId || null,
    consent_given: true,
  });
  fail(error, "Could not save crop health note");
  if (!data) throw new Error("The database did not confirm the crop note.");
  return data;
}

export function attachCropDetails(notes, crops) {
  return notes.map((note) => ({
    ...note,
    cropName: crops.find((crop) => crop.id === note.cropId)?.crop || "Crop listing",
  }));
}
