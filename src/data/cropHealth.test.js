import assert from "node:assert/strict";
import test from "node:test";
import { fetchCropHealthNotes, saveCropHealthNote, validateCropHealthNote } from "./cropHealth.js";

const note = { listingId: "listing-1", note: "Leaves are curling", type: "health", consentGiven: true };

test("crop health notes require an owned listing, valid note type, text and explicit consent", () => {
  assert.equal(validateCropHealthNote(note), "");
  assert.match(validateCropHealthNote({ ...note, consentGiven: false }), /Consent/);
  assert.match(validateCropHealthNote({ ...note, type: "diagnosis" }), /Choose crop health/);
  assert.match(validateCropHealthNote({ ...note, note: " " }), /between 1 and 2000/);
});

test("health notes are saved through a trusted RPC and access errors are surfaced", async () => {
  let call;
  const client = { rpc: async (...args) => { call = args; return { data: "note-1", error: null }; } };
  assert.equal(await saveCropHealthNote(client, note), "note-1");
  assert.deepEqual(call, ["save_crop_health_note", {
    target_listing_id: "listing-1", requested_note: "Leaves are curling",
    requested_type: "health", target_assessment_id: null, consent_given: true,
  }]);
  await assert.rejects(saveCropHealthNote({ rpc: async () => ({ data: null, error: { message: "listing not owned" } }) }, note), /listing not owned/);
});

test("private health-note retrieval relies on RLS and returns mapped metadata", async () => {
  const builder = {
    select(columns) { assert.match(columns, /farmer_id/); return this; },
    order() { return this; },
    then(resolve) { return resolve({ data: [{ id: "note-1", listing_id: "listing-1", farmer_id: "farmer-1", author_id: "farmer-1", note: "Curling", observation_type: "health", created_at: "2099-01-01" }], error: null }); },
  };
  const result = await fetchCropHealthNotes({ from: (table) => { assert.equal(table, "crop_health_notes"); return builder; } });
  assert.equal(result[0].cropId, "listing-1");
  assert.equal(result[0].type, "health");
});
