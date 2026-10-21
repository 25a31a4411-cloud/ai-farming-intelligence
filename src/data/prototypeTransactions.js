import { calculateFinancials } from "./financials.js";
import { createId } from "./ids.js";

export function acceptOfferTransaction(data, offerId, actorRole) {
  const offers = data.offers || [];
  const orders = data.orders || [];
  const crops = data.crops || [];
  const offer = offers.find((item) => item.id === offerId);

  if (!offer) return { ok: false, error: "This offer is no longer available." };
  if (offer.status !== "pending" && offer.status !== "countered") {
    return { ok: false, error: "This offer has already been resolved." };
  }
  const expectedResponder = offer.counteredBy
    ? offer.counteredBy === "farmer" ? offer.buyerRole : "farmer"
    : "farmer";
  if (actorRole !== expectedResponder) {
    return { ok: false, error: "Only the other party to this offer can accept it." };
  }
  if (orders.some((order) => order.offerId === offer.id)) {
    return { ok: false, error: "An order already exists for this offer." };
  }

  const crop = crops.find((item) => item.id === offer.cropId);
  const quantity = Number(offer.quantity);
  if (!crop || !Number.isFinite(quantity) || quantity <= 0 || crop.availableQuantity < quantity) {
    return { ok: false, error: "This lot no longer has enough available quantity." };
  }

  const price = offer.counteredBy ? Number(offer.counterPricePerUnit) : Number(offer.pricePerUnit);
  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, error: "This offer has an invalid price and cannot be accepted." };
  }

  const financials = calculateFinancials({
    quantity,
    unitPrice: price,
    deliveryMethod: offer.deliveryMethod,
    transportCost: offer.transportCost,
    transportPayer: offer.transportPayer,
    otherFarmerCharges: offer.otherFarmerCharges,
  });
  const timestamp = new Date().toISOString();
  const order = {
    id: createId("order"),
    offerId: offer.id,
    cropId: crop.id,
    cropName: crop.crop,
    quantity,
    unit: crop.unit,
    unitPrice: price,
    deliveryMethod: offer.deliveryMethod,
    transportProvider: offer.transportProvider || "",
    transportCost: financials.transportCost,
    transportPayer: financials.transportPayer,
    financials,
    farmerName: offer.farmerName,
    buyerName: offer.buyerName,
    status: "Confirmed",
    paymentStatus: "Not confirmed",
    events: [{ label: "Offer accepted; order confirmed", at: timestamp }],
    createdAt: timestamp,
  };

  return {
    ok: true,
    order,
    data: {
      ...data,
      crops: crops.map((item) => item.id === crop.id
        ? {
          ...item,
          availableQuantity: item.availableQuantity - quantity,
          status: item.availableQuantity - quantity > 0 ? item.status : "Sold out",
        }
        : item),
      offers: offers.map((item) => item.id === offer.id
        ? {
          ...item,
          status: "accepted",
          acceptedPricePerUnit: price,
          history: [...(item.history || []), {
            by: actorRole,
            action: "Accepted; order confirmed",
            pricePerUnit: price,
            at: timestamp,
          }],
        }
        : item),
      orders: [order, ...orders],
    },
  };
}
