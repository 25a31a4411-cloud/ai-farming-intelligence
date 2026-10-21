import assert from "node:assert/strict";
import test from "node:test";
import { buildSellingRecommendations, fetchMarketPrices, refreshMarketPrices } from "./marketIntelligence.js";

const row = {
  id: "price-1", crop_type: "Tomato", variety: "Roma", market_name: "Central market",
  location: "Town", min_price: "18", max_price: "24", modal_price: "21",
  currency: "INR", unit: "kg", source: "Verified source",
  observed_at: "2099-01-01T00:00:00.000Z", last_fetched_at: "2099-01-01T00:01:00.000Z",
  freshness_status: "live",
};

test("market observations map sourced values and label old observations stale", async () => {
  const builder = {
    select() { return this; },
    order() { return this; },
    limit() { return this; },
    ilike() { return this; },
    then(resolve) { return resolve({ data: [row, { ...row, id: "old", observed_at: "2020-01-01T00:00:00.000Z" }], error: null }); },
  };
  const prices = await fetchMarketPrices({ from: (table) => { assert.equal(table, "market_prices"); return builder; } }, { now: Date.parse("2099-01-01T01:00:00.000Z") });
  assert.equal(prices[0].source, "Verified source");
  assert.equal(prices[0].modalPrice, 21);
  assert.equal(prices[0].freshness, "live");
  assert.equal(prices[1].freshness, "stale");
});

test("selling recommendations explain open offers and do not fabricate prices", () => {
  const crop = { id: "listing-1", crop: "Tomato", unit: "kg", availableQuantity: 10 };
  const result = buildSellingRecommendations({
    crop,
    offers: [{ id: "offer-1", cropId: "listing-1", status: "pending", quantity: 5, pricePerUnit: 20, deliveryMethod: "buyer_pickup", transportCost: 0 }],
    prices: [],
  });
  assert.equal(result.options[0].gross, 100);
  assert.equal(result.options[0].farmerNet, 100);
  assert.match(result.options[0].reasons[0], /not a confirmed sale/);
  assert.match(result.options[0].reasons[1], /No fresh/);

  const empty = buildSellingRecommendations({ crop, offers: [], prices: [] });
  assert.deepEqual(empty.options, []);
  assert.match(empty.disclaimer, /No trustworthy/);
});

test("market refresh retains cached data on provider failure and surfaces DB read failure", async () => {
  const query = {
    select() { return this; }, order() { return this; }, limit() { return this; },
    ilike() { return this; },
    then(resolve) { return resolve({ data: [row], error: null }); },
  };
  const client = {
    functions: { invoke: async () => ({ data: null, error: { message: "provider unavailable" } }) },
    from: () => query,
  };
  const result = await refreshMarketPrices(client, { crop: "Tomato", location: "Town" });
  assert.equal(result.status, "cached");
  assert.equal(result.observations.length, 1);
  assert.match(result.message, /provider unavailable/);

  const failedClient = {
    functions: { invoke: async () => ({ data: null, error: { message: "timeout" } }) },
    from: () => ({
      select() { return this; }, order() { return this; }, limit() { return this; },
      then(resolve) { return resolve({ data: null, error: { message: "database down" } }); },
    }),
  };
  await assert.rejects(refreshMarketPrices(failedClient, {}), /database down/);
});
