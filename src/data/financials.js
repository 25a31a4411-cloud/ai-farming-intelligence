export function calculateFinancials({
  quantity,
  unitPrice,
  deliveryMethod = "buyer_pickup",
  transportCost = 0,
  transportPayer = "buyer",
  otherFarmerCharges = 0,
}) {
  const roundCurrency = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
  const normalizedQuantity = Math.round((Math.max(0, Number(quantity) || 0) + Number.EPSILON) * 1000) / 1000;
  const normalizedUnitPrice = roundCurrency(Math.max(0, Number(unitPrice) || 0));
  const saleValue = roundCurrency(normalizedQuantity * normalizedUnitPrice);
  const countedTransport = deliveryMethod === "buyer_pickup"
    ? 0
    : roundCurrency(Math.max(0, Number(transportCost) || 0));
  const farmerTransport = countedTransport > 0 && transportPayer === "farmer"
    ? countedTransport
    : 0;
  const buyerTransport = countedTransport > 0 && transportPayer === "buyer"
    ? countedTransport
    : 0;
  const charges = roundCurrency(Math.max(0, Number(otherFarmerCharges) || 0));

  return {
    saleValue,
    transportCost: countedTransport,
    transportPayer: countedTransport ? transportPayer : "none",
    otherFarmerCharges: charges,
    estimatedFarmerNet: roundCurrency(saleValue - farmerTransport - charges),
    buyerTotal: roundCurrency(saleValue + buyerTransport),
  };
}