const BUCKET = "quality-evidence";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_GPS_ACCURACY_METERS = 100;
const MAX_GPS_AGE_MILLISECONDS = 60_000;

function ensureNoError(error, action) {
  if (error) throw new Error(`${action}: ${error.message}`);
}

function validDate(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function createAssessmentPath(userId) {
  return `${userId}/${globalThis.crypto.randomUUID()}.jpg`;
}

export function validateQualityEvidence({ userId, cropId, assessment, photoBlob, consented, now = Date.now() }) {
  if (!userId || !cropId) return "Sign in and choose one of your crop listings.";
  if (consented !== true) return "Consent is required before uploading a photo and precise GPS location.";
  if (!(photoBlob instanceof Blob) || photoBlob.type !== "image/jpeg" || photoBlob.size <= 0 || photoBlob.size > MAX_IMAGE_BYTES) {
    return "Capture a live JPEG image smaller than 5 MB.";
  }
  const gps = assessment?.gps;
  if (!gps || !Number.isFinite(Number(gps.latitude)) || Number(gps.latitude) < -90 || Number(gps.latitude) > 90
    || !Number.isFinite(Number(gps.longitude)) || Number(gps.longitude) < -180 || Number(gps.longitude) > 180) {
    return "A valid current GPS location is required.";
  }
  if (!Number.isFinite(Number(gps.accuracy)) || Number(gps.accuracy) < 0 || Number(gps.accuracy) > MAX_GPS_ACCURACY_METERS) {
    return "GPS accuracy must be within 100 meters.";
  }
  const photoCapturedAt = validDate(assessment.photoCapturedAt);
  const gpsCapturedAt = validDate(assessment.gpsCapturedAt || gps.timestamp);
  const consentAt = validDate(assessment.consentAt);
  if (!photoCapturedAt || !gpsCapturedAt || now - gpsCapturedAt.getTime() > MAX_GPS_AGE_MILLISECONDS
    || !consentAt || consentAt.getTime() > now + 5000
    || gpsCapturedAt.getTime() > now + 5000 || now - photoCapturedAt.getTime() > 10 * 60_000
    || photoCapturedAt.getTime() > now + 5000) {
    return "The photo and GPS readings must be recent. Capture them again and retry.";
  }
  return "";
}

export async function submitQualityEvidence(client, { userId, cropId, assessment, photoBlob, consented }) {
  const validationError = validateQualityEvidence({ userId, cropId, assessment, photoBlob, consented });
  if (validationError) throw new Error(validationError);
  if (!client) throw new Error("Supabase is not configured. Quality evidence was not saved.");

  const path = createAssessmentPath(userId);
  const { error: uploadError } = await client.storage.from(BUCKET).upload(path, photoBlob, {
    contentType: photoBlob.type,
    upsert: false,
  });
  ensureNoError(uploadError, "Could not upload private quality photo");

  try {
    const { data, error } = await client.rpc("submit_quality_assessment", {
      target_listing_id: cropId,
      target_image_path: path,
      target_latitude: Number(assessment.gps.latitude),
      target_longitude: Number(assessment.gps.longitude),
      target_accuracy_m: Number(assessment.gps.accuracy),
      target_photo_captured_at: assessment.photoCapturedAt,
      target_gps_captured_at: assessment.gpsCapturedAt || assessment.gps.timestamp,
      target_consent_at: assessment.consentAt,
    });
    ensureNoError(error, "Could not save quality assessment");
    if (!data) throw new Error("The database did not confirm the quality assessment.");
    return { id: data, imagePath: path };
  } catch (error) {
    const { error: cleanupError } = await client.storage.from(BUCKET).remove([path]);
    if (cleanupError) {
      throw new Error(`${error.message}. Cleanup of the uploaded image also failed: ${cleanupError.message}. Contact support before retrying.`);
    }
    throw error;
  }
}

export async function createAuthorizedQualityImageUrl(client, imagePath, expiresInSeconds = 60) {
  if (!imagePath || !Number.isInteger(expiresInSeconds) || expiresInSeconds < 1 || expiresInSeconds > 300) {
    throw new Error("A valid private image path and short expiration are required.");
  }
  const { data, error } = await client.storage.from(BUCKET).createSignedUrl(imagePath, expiresInSeconds);
  ensureNoError(error, "Could not authorize quality image access");
  if (!data?.signedUrl) throw new Error("The storage service did not return a signed image URL.");
  return data.signedUrl;
}
