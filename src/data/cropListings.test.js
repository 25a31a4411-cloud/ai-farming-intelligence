import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  deleteCropListing,
  fetchCropListings,
  mapCropListing,
  saveCropListing,
  validateCropListing,
} from "./cropListings.js";

function createQueryClient(result) {
  const calls = [];
  const query = {
    from(table) {
      calls.push({ table, filters: [], values: null });
      const call = calls.at(-1);
      const builder = {
        select(columns) { call.select = columns; return this; },
        eq(column, value) { call.filters.push([column, value]); return this; },
        order(column, options) { call.order = [column, options]; return this; },
        insert(values) { call.operation = "insert"; call.values = values; return this; },
        update(values) { call.operation = "update"; call.values = values; return this; },
        delete() { call.operation = "delete"; return this; },
        single() { return Promise.resolve(result); },
        maybeSingle() { return Promise.resolve(result); },
        then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); },
      };
      return builder;
    },
  };
  return { client: query, calls };
}

const validCrop = {
  crop: "Tomato",
  variety: "Roma",
  quantity: 25,
  unit: "kg",
  expectedPricePerUnit: 30.5,
  location: "Village",
  harvestDate: "2027-01-15",
  quality: "Not assessed",
  description: "Fresh lot",
  status: "Available",
};
const savedRow = {
  id: "listing-1",
  farmer_id: "farmer-1",
  crop_type: "Tomato",
  variety: "Roma",
  quantity: "25.000",
  available_quantity: "25.000",
  unit: "kg",
  grade: "Not assessed",
  harvest_date: "2027-01-15",
  location: "Village",
  expected_price: "30.50",
  description: "Fresh lot",
  status: "available",
  created_at: "2026-10-20T10:00:00Z",
  updated_at: "2026-10-20T10:00:00Z",
};

test("crop form validation rejects invalid quantities, price, units, and impossible dates", () => {
  assert.equal(validateCropListing(validCrop), "");
  assert.match(validateCropListing({ ...validCrop, quantity: Infinity }), /Quantity/);
  assert.match(validateCropListing({ ...validCrop, expectedPricePerUnit: 0 }), /price/);
  assert.match(validateCropListing({ ...validCrop, unit: "bag" }), /unit/);
  assert.match(validateCropListing({ ...validCrop, harvestDate: "2027-02-30" }), /date/);
  assert.match(validateCropListing({ ...validCrop, crop: " " }), /crop name/);
});

test("crop rows map database columns and status into dashboard fields", () => {
  const crop = mapCropListing({
    id: "listing-1",
    farmer_id: "farmer-1",
    crop_type: "Tomato",
    variety: null,
    quantity: "25.000",
    available_quantity: "15.000",
    unit: "kg",
    grade: "Not assessed",
    harvest_date: "2027-01-15",
    location: "Village",
    expected_price: "30.50",
    description: null,
    status: "available",
    created_at: "2026-10-20T10:00:00Z",
    updated_at: "2026-10-20T10:00:00Z",
  }, "Test Farmer");
  assert.equal(crop.crop, "Tomato");
  assert.equal(crop.quantity, 25);
  assert.equal(crop.availableQuantity, 15);
  assert.equal(crop.expectedPricePerUnit, 30.5);
  assert.equal(crop.farmerName, "Test Farmer");
  assert.equal(crop.status, "Available");
});

test("authenticated farmer listing queries are scoped by owner and errors are not hidden", async () => {
  const rows = [{ id: "listing-1", farmer_id: "farmer-1", crop_type: "Tomato", quantity: "1", available_quantity: "1", unit: "kg", grade: "A", harvest_date: "2027-01-15", location: "Village", expected_price: "5", status: "available" }];
  const { client, calls } = createQueryClient({ data: rows, error: null });
  const result = await fetchCropListings(client, { id: "farmer-1", name: "Farmer" }, "farmer");
  assert.equal(result.length, 1);
  assert.ok(calls[0].filters.some(([column, value]) => column === "farmer_id" && value === "farmer-1"));

  const unavailable = createQueryClient({ data: null, error: { message: "network unavailable" } });
  await assert.rejects(fetchCropListings(unavailable.client, { id: "farmer-1" }, "farmer"), /network unavailable/);
});

test("crop create/update/delete use the authenticated owner and never fall back on failure", async () => {
  const create = createQueryClient({ data: savedRow, error: null });
  assert.equal((await saveCropListing(create.client, "farmer-1", validCrop)).id, "listing-1");
  assert.equal(create.calls[0].values.farmer_id, "farmer-1");
  assert.equal(create.calls[0].values.crop_type, "Tomato");
  assert.ok(create.calls[0].values.available_quantity === undefined);

  const update = createQueryClient({ data: savedRow, error: null });
  await saveCropListing(update.client, "farmer-1", validCrop, "listing-1");
  assert.ok(update.calls[0].filters.some(([column, value]) => column === "farmer_id" && value === "farmer-1"));

  const deletion = createQueryClient({ data: { id: "listing-1" }, error: null });
  await deleteCropListing(deletion.client, "farmer-1", "listing-1");
  assert.ok(deletion.calls[0].filters.some(([column, value]) => column === "farmer_id" && value === "farmer-1"));

  const failedWrite = createQueryClient({ data: null, error: { message: "RLS denied" } });
  await assert.rejects(saveCropListing(failedWrite.client, "farmer-1", validCrop), /RLS denied/);
  await assert.rejects(deleteCropListing(createQueryClient({ data: null, error: null }).client, "farmer-1", "listing-2"), /not found or you do not have permission/);
});

test("configured Supabase mode cannot persist failed authenticated updates to local prototype storage", async () => {
  const appSource = await readFile(new URL("../App.jsx", import.meta.url), "utf8");
  const dashboardSource = await readFile(new URL("../components/FarmerDashboard.jsx", import.meta.url), "utf8");
  assert.match(appSource, /if \(!supabaseClient && !supabaseConfigurationError\) savePrototype/);
  assert.match(appSource, /if \(supabaseClient \|\| supabaseConfigurationError\) return false/);
  assert.match(appSource, /if \(supabaseConfigurationError\) throw new Error\(supabaseConfigurationError\)/);
  assert.match(appSource, /fetchCropListings\(supabaseClient/);
  assert.match(dashboardSource, /!databaseMode && <div className="role-switcher"/);
});
