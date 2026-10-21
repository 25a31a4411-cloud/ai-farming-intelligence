import assert from "node:assert/strict";
import test from "node:test";
import { acceptOfferTransaction } from "./prototypeTransactions.js";

function createData(overrides = {}) {
  return {
    crops: [{ id: "lot-1", crop: "Tomato", unit: "kg", availableQuantity: 12, status: "Available" }],
    offers: [{
      id: "offer-1",
      cropId: "lot-1",
      cropName: "Tomato",
      farmerName: "Farmer",
      buyerName: "Buyer",
      buyerRole: "buyer",
      quantity: 7,
      pricePerUnit: 10,
      deliveryMethod: "farmer_delivery",
      transportCost: 4,
      transportPayer: "buyer",
      otherFarmerCharges: 0,
      status: "pending",
      history: [],
    }],
    orders: [],
    ...overrides,
  };
}

test("accepting an offer creates one order and reserves the quantity", () => {
  const result = acceptOfferTransaction(createData(), "offer-1", "farmer");

  assert.equal(result.ok, true);
  assert.equal(result.data.crops[0].availableQuantity, 5);
  assert.equal(result.data.offers[0].status, "accepted");
  assert.equal(result.data.orders.length, 1);
  assert.equal(result.order.financials.saleValue, 70);
  assert.equal(result.order.financials.buyerTotal, 74);
});

test("repeated acceptance cannot create a duplicate order or reserve stock twice", () => {
  const original = createData();
  const first = acceptOfferTransaction(original, "offer-1", "farmer");
  const second = acceptOfferTransaction(first.data, "offer-1", "farmer");

  assert.equal(second.ok, false);
  assert.equal(second.data, undefined);
  assert.equal(first.data.crops[0].availableQuantity, 5);
  assert.equal(first.data.orders.length, 1);
});

test("acceptance fails without changing inventory when available quantity is insufficient", () => {
  const original = createData({
    crops: [{ id: "lot-1", crop: "Tomato", unit: "kg", availableQuantity: 6, status: "Available" }],
  });
  const result = acceptOfferTransaction(original, "offer-1", "farmer");

  assert.equal(result.ok, false);
  assert.equal(original.crops[0].availableQuantity, 6);
  assert.equal(original.orders.length, 0);
});

test("only the other party can accept the current offer or counter-offer", () => {
  const initial = createData();
  const buyerAttempt = acceptOfferTransaction(initial, "offer-1", "buyer");
  assert.equal(buyerAttempt.ok, false);

  const countered = createData({
    offers: [{
      ...initial.offers[0],
      status: "countered",
      counteredBy: "farmer",
      counterPricePerUnit: 12,
    }],
  });
  const farmerAttempt = acceptOfferTransaction(countered, "offer-1", "farmer");
  const buyerResponse = acceptOfferTransaction(countered, "offer-1", "buyer");

  assert.equal(farmerAttempt.ok, false);
  assert.equal(buyerResponse.ok, true);
  assert.equal(buyerResponse.order.unitPrice, 12);
});

test("invalid offer quantities and prices are rejected", () => {
  const invalidQuantity = createData({
    offers: [{ ...createData().offers[0], quantity: Number.NaN }],
  });
  const invalidPrice = createData({
    offers: [{ ...createData().offers[0], pricePerUnit: Number.NaN }],
  });

  assert.equal(acceptOfferTransaction(invalidQuantity, "offer-1", "farmer").ok, false);
  assert.equal(acceptOfferTransaction(invalidPrice, "offer-1", "farmer").ok, false);
});
