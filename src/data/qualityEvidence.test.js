import assert from "node:assert/strict";
import test from "node:test";
import { createAuthorizedQualityImageUrl, submitQualityEvidence, validateQualityEvidence } from "./qualityEvidence.js";

const now = Date.now();
const assessment = {
  photoCapturedAt: new Date(now - 1000).toISOString(),
  gpsCapturedAt: new Date(now - 1000).toISOString(),
  consentAt: new Date(now - 2000).toISOString(),
  gps: { latitude: 16.5, longitude: 80.6, accuracy: 10, timestamp: new Date(now - 1000).toISOString() },
};
const makeInput = (overrides = {}) => ({
  userId: "farmer-1",
  cropId: "listing-1",
  assessment,
  photoBlob: new Blob(["live-photo"], { type: "image/jpeg" }),
  consented: true,
  ...overrides,
});

test("quality validation requires consent, fresh accurate GPS, and a live JPEG payload", () => {
  assert.equal(validateQualityEvidence({ ...makeInput(), now }), "");
  assert.match(validateQualityEvidence({ ...makeInput({ consented: false }), now }), /Consent is required/);
  assert.match(validateQualityEvidence({ ...makeInput({ assessment: { ...assessment, gps: { ...assessment.gps, accuracy: 101 } } }), now }), /within 100 meters/);
  assert.match(validateQualityEvidence({ ...makeInput({ photoBlob: new Blob(["x"], { type: "image/png" }) }), now }), /live JPEG/);
  assert.match(validateQualityEvidence({ ...makeInput({ assessment: { ...assessment, gpsCapturedAt: new Date(now - 61_000).toISOString() } }), now }), /must be recent/);
});

test("quality submission uploads privately then calls the database RPC", async () => {
  const calls = [];
  const client = {
    storage: { from(bucket) {
      assert.equal(bucket, "quality-evidence");
      return { upload: async (path, _blob, options) => {
        calls.push(["upload", path, options]);
        return { error: null };
      } };
    } },
    rpc: async (name, params) => {
      calls.push(["rpc", name, params]);
      return { data: "assessment-1", error: null };
    },
  };
  const result = await submitQualityEvidence(client, makeInput());
  assert.equal(result.id, "assessment-1");
  assert.match(result.imagePath, /^farmer-1\/[0-9a-f-]{36}\.jpg$/i);
  assert.equal(calls[0][0], "upload");
  assert.equal(calls[0][2].upsert, false);
  assert.equal(calls[1][1], "submit_quality_assessment");
  assert.equal(calls[1][2].target_latitude, 16.5);
  assert.equal(calls[1][2].target_consent_at, assessment.consentAt);
});

test("failed assessment write removes the uploaded private object and exposes cleanup failures", async () => {
  let removed;
  const client = {
    storage: { from() {
      return {
        upload: async () => ({ error: null }),
        remove: async (paths) => { removed = paths; return { error: null }; },
      };
    } },
    rpc: async () => ({ data: null, error: { message: "database unavailable" } }),
  };
  await assert.rejects(submitQualityEvidence(client, makeInput()), /Could not save quality assessment: database unavailable/);
  assert.equal(removed.length, 1);

  const cleanupFailure = {
    ...client,
    storage: { from() {
      return {
        upload: async () => ({ error: null }),
        remove: async () => ({ error: { message: "storage unavailable" } }),
      };
    } },
  };
  await assert.rejects(submitQualityEvidence(cleanupFailure, makeInput()), /Cleanup of the uploaded image also failed/);
});

test("upload and signed URL authorization errors are not hidden", async () => {
  const uploadFailure = {
    storage: { from() { return { upload: async () => ({ error: { message: "bucket denied" } }) }; } },
  };
  await assert.rejects(submitQualityEvidence(uploadFailure, makeInput()), /Could not upload private quality photo: bucket denied/);

  const deniedUrlClient = {
    storage: { from() { return { createSignedUrl: async () => ({ data: null, error: { message: "access denied" } }) }; } },
  };
  await assert.rejects(createAuthorizedQualityImageUrl(deniedUrlClient, "farmer-1/photo.jpg"), /Could not authorize quality image access: access denied/);
});

test("signed URLs are short-lived and validated", async () => {
  let expiration;
  const client = {
    storage: { from() {
      return { createSignedUrl: async (_path, seconds) => {
        expiration = seconds;
        return { data: { signedUrl: "https://signed.example/image" }, error: null };
      } };
    } },
  };
  assert.equal(await createAuthorizedQualityImageUrl(client, "farmer-1/photo.jpg", 60), "https://signed.example/image");
  assert.equal(expiration, 60);
  await assert.rejects(createAuthorizedQualityImageUrl(client, "farmer-1/photo.jpg", 3600), /short expiration/);
});
