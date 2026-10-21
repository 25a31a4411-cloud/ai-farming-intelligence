import { useEffect, useState } from "react";
import { ArrowRight, Bell, Camera, Check, CircleEllipsis, ClipboardList, IndianRupee, LayoutDashboard, Leaf, LogOut, Package, Plus, Search, ShieldCheck, ShoppingBag, Sprout, TrendingUp, UserRound, Users, Wallet, X } from "lucide-react";
import { calculateFinancials } from "../data/financials";
import { createId } from "../data/prototypeData";
import { acceptOfferTransaction } from "../data/prototypeTransactions";
import { validateCropListing } from "../data/cropListings";
import { matchCropListings } from "../data/procurement";
import { buildSellingRecommendations } from "../data/marketIntelligence";
import QualityVerification from "./QualityVerification";
import "./FarmerDashboard.css";

const money = (value) => `₹${(Number(value) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const labels = {
  en: { home: "Home", crops: "My Crops", sell: "Sell", orders: "Orders", more: "More", profile: "Profile", addCrop: "Add Crop", cropName: "Crop name", quantity: "Quantity", expectedPrice: "Expected price", location: "Location", harvest: "Harvest date", quality: "Quality grade", description: "Description", save: "Save crop", language: "Language" },
  te: { home: "హోమ్", crops: "నా పంటలు", sell: "అమ్మండి", orders: "ఆర్డర్లు", more: "మరిన్ని", profile: "ప్రొఫైల్", addCrop: "పంటను జోడించండి", cropName: "పంట పేరు", quantity: "పరిమాణం", expectedPrice: "ఆశించిన ధర", location: "ప్రాంతం", harvest: "పంట తేదీ", quality: "నాణ్యత గ్రేడ్", description: "వివరణ", save: "పంటను సేవ్ చేయండి", language: "భాష" },
};

function FarmerDashboard({ role, user, language, onLanguageChange, onNameChange, data, onDataChange, onCropSave, onCropDelete, onCreateOffer, onOfferResponse, onOfferAcceptance, onOrderTransition, onTransportRequest, onTransportTransition, onNotificationRead, onQualitySubmit, onProcurementSave, onProcurementStatus, onHealthNoteSave, onFpoMembershipRequest, onFpoMembershipReview, onFpoLeave, onFpoCampaignCreate, onFpoAllocationConsent, onFpoAllocationWithdraw, onFpoGroupSaleCreate, onFpoGroupSaleConsent, onFpoGroupSaleResponse, onFpoGroupSaleCancel, onFpoGroupSaleTransition, onMarketRefresh, databaseMode = false, onRoleSwitch, onLogout }) {
  const [section, setSection] = useState("home");
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [offerDraft, setOfferDraft] = useState({});
  const [counterDraft, setCounterDraft] = useState({});
  const [notice, setNotice] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [profileName, setProfileName] = useState(user?.name || "");
  const [healthPhoto, setHealthPhoto] = useState("");
  const [activeQualityCropId, setActiveQualityCropId] = useState("");
  const [voiceMessage, setVoiceMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [savingCrop, setSavingCrop] = useState(false);
  const [deletingCropId, setDeletingCropId] = useState("");
  const [transactionBusy, setTransactionBusy] = useState(false);
  const [offerRequestIds, setOfferRequestIds] = useState({});
  const [requestBusy, setRequestBusy] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState("");
  const [marketCrop, setMarketCrop] = useState("");
  const [marketLocation, setMarketLocation] = useState("");
  const [marketMessage, setMarketMessage] = useState("");
  const [marketBusy, setMarketBusy] = useState(false);
  const [fpoBusy, setFpoBusy] = useState(false);
  const [selectedSaleCampaignId, setSelectedSaleCampaignId] = useState("");
  const [groupSaleRequestId, setGroupSaleRequestId] = useState(() => globalThis.crypto.randomUUID());
  const [groupSaleDeliveryMethod, setGroupSaleDeliveryMethod] = useState("buyer_pickup");
  const [groupSaleTransportPayer, setGroupSaleTransportPayer] = useState("none");
  const [groupSaleTransportProvider, setGroupSaleTransportProvider] = useState("");
  const [transportBusy, setTransportBusy] = useState(false);
  const [transportFormOrderId, setTransportFormOrderId] = useState("");
  const copy = labels[language] || labels.en;
  const farmer = role === "farmer";
  const crops = data.crops || [];
  const offers = data.offers || [];
  const orders = data.orders || [];
  const transportRequests = data.transportRequests || [];
  const notifications = data.notifications || [];
  const unreadNotificationCount = data.unreadNotificationCount || 0;
  const requirements = data.procurementRequests || [];
  const fpo = data.fpo || { fpos: [], memberships: [], campaigns: [], allocations: [], groupSales: [], settlements: [] };
  const healthNotes = data.cropHealthNotes || [];
  const nav = farmer
    ? [["home", copy.home, LayoutDashboard], ["crops", copy.crops, Sprout], ["sell", copy.sell, TrendingUp], ["activity", copy.orders, ClipboardList], ["notifications", "Notifications", Bell], ["more", copy.more, CircleEllipsis]]
    : role === "admin"
      ? [["home", "Admin overview", LayoutDashboard], ["moderation", "Listing review", ShieldCheck], ["activity", "Orders", ClipboardList], ["notifications", "Notifications", Bell], ["profile", "Profile", UserRound]]
      : role === "fpo"
        ? [["home", "FPO overview", LayoutDashboard], ["groups", "Membership & campaigns", Users], ["activity", "Orders", ClipboardList], ["notifications", "Notifications", Bell], ["profile", "Profile", UserRound]]
      : [["home", "Overview", LayoutDashboard], ["market", "Find crops", Search], ["activity", "Offers & orders", ClipboardList], ["requests", "Procurement", ShoppingBag], ["notifications", "Notifications", Bell], ["profile", "Profile", UserRound]];
  const myOffers = offers.filter((offer) => role === "admin"
    ? true
    : databaseMode ? (farmer ? offer.farmerId : offer.buyerId) === user?.id
      : farmer ? offer.buyerRole === "buyer"
        : offer.buyerRole === role && offer.buyerName === (user?.name || "Buyer"));
  const pendingOffers = myOffers.filter((offer) => ["pending", "countered"].includes(offer.status));
  const myRequirements = requirements.filter((request) => databaseMode
    ? request.buyerId === user?.id
    : request.buyerName === (user?.name || "Buyer"));
  const myMemberships = fpo.memberships.filter((membership) => membership.farmer_id === user?.id);
  const myAllocations = fpo.allocations.filter((allocation) => allocation.farmer_id === user?.id);
  const managedFpos = fpo.fpos.filter((item) => item.can_manage);
  const selectedSaleCampaign = fpo.campaigns.find((campaign) => campaign.id === selectedSaleCampaignId);
  const pendingGroupSaleClaims = new Map();
  for (const sale of fpo.groupSales) {
    if (sale.status !== "awaiting_approvals") continue;
    for (const contributor of sale.contributors || []) {
      pendingGroupSaleClaims.set(
        contributor.allocation_id,
        (pendingGroupSaleClaims.get(contributor.allocation_id) || 0) + Number(contributor.quantity),
      );
    }
  }
  const usedGroupSaleRequirements = new Set(fpo.groupSales
    .filter((sale) => ["awaiting_approvals", "confirmed", "delivered"].includes(sale.status))
    .map((sale) => sale.buyer_requirement_id));
  const matchingGroupSaleRequirements = requirements.filter((request) => request.status === "open"
    && !usedGroupSaleRequirements.has(request.id)
    && selectedSaleCampaign && request.crop.toLowerCase() === selectedSaleCampaign.crop_type.toLowerCase()
    && request.unit === selectedSaleCampaign.unit && request.deliveryDate >= new Date().toISOString().slice(0, 10)
    && (!request.budgetMax || Number(request.budgetMax) > 0));
  const eligibleGroupSaleAllocations = fpo.allocations.filter((allocation) =>
    allocation.campaign_id === selectedSaleCampaignId
    && ["allocated", "committed"].includes(allocation.status)
    && Number(allocation.quantity) - Number(allocation.committed_quantity || 0)
      - (pendingGroupSaleClaims.get(allocation.id) || 0) > 0);
  const myFarmerOrders = databaseMode
    ? orders.filter((order) => order.farmerId === user?.id)
    : orders.filter((order) => order.farmerName === (user?.name || "Farmer"));
  const myBuyerOrders = databaseMode
    ? orders.filter((order) => order.buyerId === user?.id)
    : orders.filter((order) => order.buyerName === (user?.name || "Buyer"));
  const myOrders = role === "admin" ? orders : farmer ? myFarmerOrders : myBuyerOrders;
  const available = crops.filter((crop) => crop.status === "Available" && crop.availableQuantity > 0 && `${crop.crop} ${crop.variety} ${crop.location}`.toLowerCase().includes(search.toLowerCase()));
  const netRecorded = myFarmerOrders.filter((order) => ["Payment recorded", "Completed"].includes(order.status)).reduce((sum, order) => sum + order.financials.estimatedFarmerNet, 0);
  const activeOrderStatuses = databaseMode ? ["confirmed", "awaiting_pickup", "in_transit"] : ["Confirmed", "Dispatched", "Delivered", "Payment recorded"];
  const completedOrderStatuses = databaseMode ? ["delivered"] : ["Completed"];
  const unitTotals = crops.reduce((totals, crop) => ({ ...totals, [crop.unit]: (totals[crop.unit] || 0) + (crop.availableQuantity || 0) }), {});
  const inventoryDisplay = Object.entries(unitTotals).map(([unit, amount]) => `${amount.toLocaleString("en-IN")} ${unit}`).join(" · ") || "0 kg";
  const upcomingHarvests = crops.filter((crop) => {
    const days = (Date.parse(crop.harvestDate) - currentTime) / 86400000;
    return currentTime > 0 && Number.isFinite(days) && days >= 0 && days <= 14 && crop.availableQuantity > 0;
  });
  const pendingBuyerOffers = offers.filter((offer) => offer.buyerRole === "buyer" && ["pending", "countered"].includes(offer.status));
  const farmerRecordedEarnings = myFarmerOrders.reduce((sum, order) => sum + order.financials.estimatedFarmerNet, 0);
  const updateData = (updater) => {
    const saved = onDataChange((current) => updater(current));
    if (!saved) setNotice(databaseMode
      ? "This workflow is not connected to your account database yet. Nothing was saved."
      : "Couldn't save this change in browser storage. Free space and try again.");
    return saved;
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setCurrentTime(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function saveCrop(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const quantity = Number(form.get("quantity"));
    const expectedPricePerUnit = Number(form.get("expectedPrice"));
    const cropName = String(form.get("crop") || "").trim();
    const location = String(form.get("location") || "").trim();
    const harvestDate = String(form.get("harvestDate") || "");
    const variety = String(form.get("variety") || "").trim();
    const unit = String(form.get("unit"));
    const quality = String(form.get("quality"));
    const description = String(form.get("description") || "").trim();
    const validationError = validateCropListing({
      crop: cropName,
      quantity,
      unit,
      expectedPricePerUnit,
      location,
      harvestDate,
    });
    if (validationError) {
      setNotice(validationError);
      return;
    }
    const committedQuantity = editing?.id ? editing.quantity - editing.availableQuantity : 0;
    if (quantity < committedQuantity) {
      setNotice(`Quantity cannot be less than ${committedQuantity} already committed.`);
      return;
    }
    const duplicate = crops.some((crop) => crop.id !== editing?.id
      && crop.crop.toLowerCase() === cropName.toLowerCase()
      && (crop.variety || "").toLowerCase() === variety.toLowerCase()
      && crop.location.toLowerCase() === location.toLowerCase()
      && crop.harvestDate === harvestDate
      && crop.quantity === quantity
      && crop.unit === unit);
    if (duplicate) {
      setNotice("This crop lot already exists. Open it from My Crops to edit it.");
      return;
    }
    const record = {
      id: editing?.id || createId("lot"), crop: cropName, variety,
      quantity, unit, expectedPricePerUnit, location, harvestDate,
      quality, description,
      notes: description, photo: databaseMode ? "" : photoPreview || editing?.photo || "",
      status: editing?.status === "Under review" ? "Under review" : quantity - committedQuantity > 0 ? "Available" : "Sold out",
      createdAt: editing?.createdAt || new Date().toISOString(),
      farmerName: editing?.farmerName || user?.name || "Farmer",
      availableQuantity: editing?.id ? Math.max(0, quantity - (editing.quantity - editing.availableQuantity)) : quantity,
    };
    if (databaseMode) {
      setSavingCrop(true);
      try {
        await onCropSave(record, editing?.id);
      } catch (error) {
        setNotice(error.message || "The crop listing could not be saved. Check your connection and retry.");
        setSavingCrop(false);
        return;
      }
      setSavingCrop(false);
    } else if (!updateData((current) => ({ ...current, crops: editing?.id ? current.crops.map((item) => item.id === editing.id ? record : item) : [...current.crops, record] }))) {
      return;
    }
    setEditing(null);
    setNotice(editing?.id ? "Crop listing updated successfully." : databaseMode ? "Crop listing saved to your Supabase account." : "Crop lot added and visible to buyers in this prototype.");
    formElement.reset();
  }

  async function deleteCrop(crop) {
    if (offers.some((offer) => offer.cropId === crop.id && ["pending", "countered"].includes(offer.status)) || orders.some((order) => order.cropId === crop.id && order.status !== "Completed")) {
      setNotice("Resolve open offers and active orders before deleting this crop lot.");
      return;
    }
    if (!window.confirm(`Delete the ${crop.crop} crop lot?`)) return;
    if (databaseMode) {
      setDeletingCropId(crop.id);
      try {
        await onCropDelete(crop.id);
        setNotice("Crop listing deleted from your account.");
      } catch (error) {
        setNotice(error.message || "The crop listing could not be deleted.");
      } finally {
        setDeletingCropId("");
      }
      return;
    }
    if (!updateData((current) => ({ ...current, crops: current.crops.filter((item) => item.id !== crop.id) }))) return;
    setNotice("Crop lot deleted.");
  }

  async function sendOffer(event, crop, initialQuantity) {
    event.preventDefault();
    const draft = offerDraft[crop.id] || { quantity: initialQuantity };
    const quantity = draft.quantity === undefined || draft.quantity === "" ? crop.availableQuantity : Number(draft.quantity);
    const pricePerKg = Number(draft.price);
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > crop.availableQuantity || !Number.isFinite(pricePerKg) || pricePerKg <= 0) {
      setNotice("Offer quantity must be available and price must be above zero.");
      return;
    }
    const deliveryMethod = draft.deliveryMethod || "buyer_pickup";
    const transportProvider = String(draft.transportProvider || "").trim();
    const transportCost = deliveryMethod === "buyer_pickup" ? 0 : Number(draft.transportCost || 0);
    const otherFarmerCharges = Number(draft.otherFarmerCharges || 0);
    if (!Number.isFinite(transportCost) || transportCost < 0 || !Number.isFinite(otherFarmerCharges) || otherFarmerCharges < 0) {
      setNotice("Transport and other charges must be zero or a valid positive amount.");
      return;
    }
    if (deliveryMethod === "third_party" && !transportProvider) {
      setNotice("Enter the third-party transport provider before sending this offer.");
      return;
    }
    if (!databaseMode && offers.some((offer) => offer.cropId === crop.id
      && offer.buyerName === (user?.name || "Buyer")
      && offer.buyerRole === role
      && ["pending", "countered"].includes(offer.status)
      && offer.quantity === quantity
      && offer.pricePerUnit === pricePerKg)) {
      setNotice("You already have an identical open offer for this crop lot.");
      return;
    }
    if (databaseMode) {
      const requestId = offerRequestIds[crop.id] || globalThis.crypto.randomUUID();
      setOfferRequestIds((current) => ({ ...current, [crop.id]: requestId }));
      setTransactionBusy(true);
      try {
        await onCreateOffer({
          listingId: crop.id,
          quantity,
          unit: crop.unit,
          availableQuantity: crop.availableQuantity,
          unitPrice: pricePerKg,
          currency: "INR",
          deliveryMethod,
          transportProvider,
          transportCost,
          transportPayer: deliveryMethod === "buyer_pickup" ? "none" : draft.transportPayer || "buyer",
          otherFarmerCharges,
          requestId,
        });
        setOfferRequestIds((current) => {
          const next = { ...current };
          delete next[crop.id];
          return next;
        });
        setNotice("Offer saved to the database. The farmer can review it in Offers & orders.");
      } catch (error) {
        setNotice(`${error.message || "The offer could not be saved. Check your connection and retry."} Retrying will reuse the same request ID.`);
      } finally {
        setTransactionBusy(false);
      }
      return;
    }
    const record = {
      id: createId("offer"), cropId: crop.id, cropName: crop.crop, farmerName: crop.farmerName || user?.name || "Farmer",
      buyerName: user?.name || "Buyer", buyerRole: role, quantity, unit: crop.unit, pricePerUnit: pricePerKg,
      deliveryMethod, transportProvider,
      transportCost,
      transportPayer: deliveryMethod === "buyer_pickup" ? "none" : draft.transportPayer || "buyer",
      otherFarmerCharges, status: "pending",
      history: [{ by: user?.name || role, action: "Offer submitted", pricePerUnit: pricePerKg, at: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
    };
    if (!updateData((current) => ({ ...current, offers: [record, ...current.offers] }))) return;
    setNotice("Offer submitted. The other party can review it in Offers & orders.");
  }

  function respondToRequest(request, crop) {
    const quantity = Math.min(crop.availableQuantity, request.quantity);
    const unitPrice = request.targetPrice || crop.expectedPricePerUnit;
    if (!unitPrice || quantity <= 0) return setNotice("Add an expected price to this crop lot before responding.");
    const exists = offers.some((offer) => offer.requestId === request.id && offer.cropId === crop.id && ["pending", "countered", "accepted"].includes(offer.status));
    if (exists) return setNotice("You already responded to this buyer request for this crop lot.");
    const offer = {
      id: createId("offer"), requestId: request.id, cropId: crop.id, cropName: crop.crop,
      farmerName: crop.farmerName || user?.name || "Farmer", buyerName: request.buyerName,
      buyerRole: "buyer", quantity, unit: crop.unit, pricePerUnit: unitPrice,
      deliveryMethod: "buyer_pickup", transportCost: 0, transportPayer: "none", status: "pending",
      history: [{ by: user?.name || "Farmer", action: "Offer sent in response to procurement request", pricePerUnit: unitPrice, at: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
    };
    if (!updateData((current) => ({ ...current, offers: [offer, ...current.offers] }))) return;
    setNotice("Offer sent to the buyer in this prototype.");
    setSection("activity");
  }

  async function counter(offer) {
    const pricePerKg = Number(counterDraft[offer.id]);
    if (!Number.isFinite(pricePerKg) || pricePerKg <= 0) return setNotice("Enter a counter price above zero.");
    if (databaseMode) {
      setTransactionBusy(true);
      try {
        await onOfferResponse(offer.id, "counter", pricePerKg);
        setNotice("Counter-offer saved to the database.");
      } catch (error) {
        setNotice(error.message || "The counter-offer could not be saved.");
      } finally {
        setTransactionBusy(false);
      }
      return;
    }
    if (!updateData((current) => ({ ...current, offers: current.offers.map((item) => item.id === offer.id ? {
      ...item, status: "countered", counterPricePerUnit: pricePerKg, counteredBy: role,
      history: [...item.history, { by: user?.name || role, action: "Counter-offer", pricePerUnit: pricePerKg, at: new Date().toISOString() }],
    } : item) }))) return;
    setNotice("Counter-offer sent.");
  }

  async function reject(offer) {
    if (databaseMode) {
      setTransactionBusy(true);
      try {
        await onOfferResponse(offer.id, "reject");
        setNotice("Offer rejected.");
      } catch (error) {
        setNotice(error.message || "The offer could not be rejected.");
      } finally {
        setTransactionBusy(false);
      }
      return;
    }
    if (!updateData((current) => ({ ...current, offers: current.offers.map((item) => item.id === offer.id ? {
      ...item, status: "rejected", history: [...item.history, { by: user?.name || role, action: "Offer rejected", at: new Date().toISOString() }],
    } : item) }))) return;
    setNotice("Offer rejected.");
  }

  async function accept(offer) {
    const price = offer.counteredBy ? offer.counterPricePerUnit : offer.pricePerUnit;
    const crop = crops.find((item) => item.id === offer.cropId);
    if (!crop) return setNotice("This crop lot is no longer available.");
    if (!window.confirm(`Confirm ${offer.quantity} ${crop.unit} at ${money(price)}/${crop.unit}? ${databaseMode ? "This creates a database-backed order; no payment will be processed." : "This creates a prototype order, not a real payment."}`)) return;
    if (databaseMode) {
      setTransactionBusy(true);
      try {
        await onOfferAcceptance(offer.id);
        setNotice("Offer accepted and inventory/order records were updated in the database. Payment is not processed.");
      } catch (error) {
        setNotice(error.message || "The offer could not be accepted. Inventory was not changed in the browser.");
      } finally {
        setTransactionBusy(false);
      }
      return;
    }
    let outcome;
    if (!updateData((current) => {
      outcome = acceptOfferTransaction(current, offer.id, role);
      return outcome.ok ? outcome.data : current;
    })) return;
    if (!outcome.ok) return setNotice(outcome.error);
    setNotice("Order confirmed in this prototype. Payment is not processed.");
  }

  async function updateOrderStatus(order, action, label) {
    if (databaseMode) {
      if (!window.confirm(`Update this order to ${label.toLowerCase()}? This does not record or verify payment.`)) return;
      setTransactionBusy(true);
      try {
        await onOrderTransition(order.id, action);
        setNotice(`Order updated: ${label}. Payment remains unverified.`);
      } catch (error) {
        setNotice(error.message || "Order status could not be updated.");
      } finally {
        setTransactionBusy(false);
      }
      return;
    }
    progressPrototypeOrder(order);
  }

  function progressPrototypeOrder(order) {
    const steps = ["Confirmed", "Dispatched", "Delivered", "Payment recorded", "Completed"];
    const next = steps[Math.min(steps.indexOf(order.status) + 1, steps.length - 1)];
    if (next === "Payment recorded" && !window.confirm("Record a simulated payment? No payment provider is connected.")) return;
    if (!updateData((current) => ({ ...current, orders: current.orders.map((item) => item.id === order.id ? {
      ...item, status: next, paymentStatus: ["Payment recorded", "Completed"].includes(next) ? "Simulated record" : item.paymentStatus,
      events: [...item.events, { label: next, at: new Date().toISOString() }],
    } : item) }))) return;
    setNotice(`Order marked ${next.toLowerCase()} in the prototype.`);
  }

  async function progressOrder(order) {
    if (databaseMode) {
      const transitions = {
        confirmed: farmer ? ["ready", "Mark ready for pickup"] : null,
        awaiting_pickup: role === "buyer" ? ["pickup", "Confirm pickup / in transit"] : null,
        in_transit: role === "buyer" ? ["delivered", "Confirm delivery"] : null,
      };
      const option = transitions[order.status];
      const [action, label] = option || [];
      if (!action) return;
      await updateOrderStatus(order, action, label);
      return;
    }
    progressPrototypeOrder(order);
  }

  async function saveTransportRequest(event, order) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setTransportBusy(true);
    try {
      await onTransportRequest({
        orderId: order.id,
        pickup: String(form.get("pickup") || ""),
        destination: String(form.get("destination") || ""),
        requestedDate: String(form.get("requestedDate") || ""),
        provider: String(form.get("provider") || ""),
        cost: String(form.get("cost") || ""),
        payer: String(form.get("payer") || ""),
      });
      setTransportFormOrderId("");
      setNotice("Transport request saved. The other order party can review it.");
    } catch (error) {
      setNotice(error.message || "Transport request could not be saved. Check your connection and retry.");
    } finally {
      setTransportBusy(false);
    }
  }

  async function updateTransportStatus(request, action) {
    if (["cancel", "issue"].includes(action) && !window.confirm(action === "cancel"
      ? "Cancel this transport request?"
      : "Record a transport issue? This does not verify a carrier or live tracking.")) return;
    setTransportBusy(true);
    try {
      const status = await onTransportTransition(request.id, action);
      setNotice(`Transport status updated: ${status.replaceAll("_", " ")}.`);
    } catch (error) {
      setNotice(error.message || "Transport status could not be updated.");
    } finally {
      setTransportBusy(false);
    }
  }

  async function readNotification(notification) {
    if (!databaseMode || notification.readAt) return;
    try {
      await onNotificationRead(notification.id);
    } catch (error) {
      setNotice(error.message || "Notification could not be marked as read.");
    }
  }

  function setDraft(cropId, field, value) {
    setOfferDraft((current) => ({ ...current, [cropId]: { ...current[cropId], [field]: value } }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    const nextName = profileName.trim();
    if (!nextName || nextName.length > 160) return setNotice("Enter a name between 1 and 160 characters.");
    try {
      const saved = await onNameChange(nextName);
      if (!saved) return setNotice(databaseMode ? "Profile could not be saved to the database." : "Couldn't save your profile in browser storage.");
      setNotice(databaseMode ? "Profile saved to your Supabase account." : "Profile saved in this browser.");
    } catch (error) {
      setNotice(error.message || "The profile could not be saved.");
    }
  }

  async function changeLanguage(event) {
    try {
      await onLanguageChange(event.target.value);
      setNotice(databaseMode ? "Language preference saved to your account." : "Language preference updated.");
    } catch (error) {
      setNotice(error.message || "Language preference could not be saved.");
    }
  }

  async function signOut() {
    try {
      const signedOut = await onLogout();
      if (signedOut === false) setNotice("Could not sign out. Check your connection and try again.");
    } catch (error) {
      setNotice(error.message || "Could not sign out. Please retry.");
    }
  }

  async function saveProcurementRequest(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const request = {
      crop: String(form.get("crop") || "").trim(),
      variety: String(form.get("variety") || "").trim(),
      quantity: Number(form.get("quantity")), unit: String(form.get("unit")),
      budgetMin: form.get("budgetMin") === "" ? null : Number(form.get("budgetMin")),
      budgetMax: form.get("budgetMax") === "" ? null : Number(form.get("budgetMax")),
      targetPrice: Number(form.get("budgetMax")) || null,
      quality: String(form.get("quality") || ""),
      location: String(form.get("location") || "").trim(),
      deliveryDate: String(form.get("deliveryDate") || ""),
    };
    if (databaseMode) {
      setRequestBusy(true);
      try {
        await onProcurementSave({
          ...request,
          requiredDate: request.deliveryDate,
        }, editingRequestId || null);
        setEditingRequestId("");
        formElement.reset();
        setNotice(editingRequestId ? "Procurement request updated." : "Procurement request saved.");
      } catch (error) {
        setNotice(error.message || "The request could not be saved. Retry without changing its details.");
      } finally {
        setRequestBusy(false);
      }
      return;
    }
    if (!request.crop || request.quantity <= 0 || !request.location || !Number.isFinite(Date.parse(request.deliveryDate))) return setNotice("Enter a crop, positive quantity, location, and delivery date.");
    request.id = createId("request");
    request.createdAt = new Date().toISOString();
    request.buyerName = user?.name || "Buyer";
    request.status = "open";
    if (!updateData((current) => ({ ...current, procurementRequests: [request, ...(current.procurementRequests || [])] }))) return;
    formElement.reset();
    setNotice("Procurement request saved in this browser.");
  }

  async function changeRequestStatus(requestId, status) {
    if (!databaseMode) {
      if (!updateData((current) => ({
        ...current,
        procurementRequests: current.procurementRequests.map((request) => request.id === requestId ? { ...request, status } : request),
      }))) return;
      setNotice(`Request marked ${status}.`);
      return;
    }
    setRequestBusy(true);
    try {
      await onProcurementStatus(requestId, status);
      setNotice(`Request marked ${status}.`);
    } catch (error) {
      setNotice(error.message || "The request status could not be updated.");
    } finally {
      setRequestBusy(false);
    }
  }

  async function refreshMarketData(event) {
    event.preventDefault();
    setMarketBusy(true);
    setMarketMessage("");
    try {
      const result = await onMarketRefresh({ crop: marketCrop, location: marketLocation });
      setMarketMessage(result.message || (result.status === "live" ? "Fresh sourced observations loaded." : "Showing previously recorded observations."));
    } catch (error) {
      setMarketMessage(error.message || "Market data could not be refreshed. Existing observations remain unchanged.");
    } finally {
      setMarketBusy(false);
    }
  }

  async function createFpoCampaignFromForm(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setFpoBusy(true);
    try {
      await onFpoCampaignCreate({
        fpoId: String(form.get("fpoId") || ""),
        name: String(form.get("name") || "").trim(),
        crop: String(form.get("crop") || "").trim(),
        unit: String(form.get("unit") || ""),
        targetQuantity: String(form.get("targetQuantity") || ""),
      });
      formElement.reset();
      setNotice("Campaign created. It is visible to active FPO members.");
    } catch (error) {
      setNotice(error.message || "Campaign could not be created.");
    } finally {
      setFpoBusy(false);
    }
  }

  async function createFpoGroupSaleFromForm(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const contributions = eligibleGroupSaleAllocations
      .map((allocation) => ({
        allocationId: allocation.id,
        quantity: String(form.get(`contribution-${allocation.id}`) || "").trim(),
      }))
      .filter((contribution) => contribution.quantity !== "");
    setFpoBusy(true);
    try {
      await onFpoGroupSaleCreate({
        campaignId: String(form.get("campaignId") || ""),
        requirementId: String(form.get("requirementId") || ""),
        contributions,
        unitPrice: String(form.get("unitPrice") || ""),
        deliveryMethod: String(form.get("deliveryMethod") || ""),
        transportProvider: String(form.get("transportProvider") || ""),
        transportCost: String(form.get("transportCost") || ""),
        transportPayer: String(form.get("transportPayer") || ""),
        otherDeductions: String(form.get("otherDeductions") || ""),
        requestId: groupSaleRequestId,
      });
      formElement.reset();
      setSelectedSaleCampaignId("");
      setGroupSaleRequestId(globalThis.crypto.randomUUID());
      setGroupSaleDeliveryMethod("buyer_pickup");
      setGroupSaleTransportPayer("none");
      setGroupSaleTransportProvider("");
      setNotice("Group-sale proposal saved. It is not confirmed until the buyer and every contributing farmer approve the exact terms.");
    } catch (error) {
      setNotice(error.message || "Group-sale proposal could not be saved.");
    } finally {
      setFpoBusy(false);
    }
  }

  async function respondGroupSale(sale, acceptTerms) {
    const confirmation = acceptTerms
      ? `Accept this group sale for ${sale.quantity} ${sale.unit} at ${money(sale.unit_price)}/${sale.unit}? Delivery: ${sale.delivery_method.replaceAll("_", " ")}${sale.transport_provider ? ` (${sale.transport_provider})` : ""}. Transport: ${money(sale.transport_cost)}, paid by ${sale.transport_payer}. Other farmer deductions: ${money(sale.other_farmer_deductions)}. Buyer total: ${money(sale.buyer_total)}.`
      : "Decline this group-sale proposal? It will be cancelled for all contributors.";
    if (!window.confirm(confirmation)) return;
    setFpoBusy(true);
    try {
      await onFpoGroupSaleResponse(sale.id, acceptTerms);
      setNotice(`Group-sale proposal ${acceptTerms ? "accepted" : "declined"}. Inventory is committed only after all approvals.`);
    } catch (error) {
      setNotice(error.message || "Your group-sale decision could not be saved.");
    } finally {
      setFpoBusy(false);
    }
  }

  async function consentToGroupSale(sale, contribution, consentGiven) {
    const confirmation = consentGiven
      ? `Consent to sell ${contribution.quantity} ${sale.unit} at ${money(sale.unit_price)}/${sale.unit}? Delivery: ${sale.delivery_method.replaceAll("_", " ")}${sale.transport_provider ? ` (${sale.transport_provider})` : ""}. Transport is ${money(sale.transport_cost)}, paid by ${sale.transport_payer}; other farmer deductions are ${money(sale.other_farmer_deductions)}. Only farmer-paid transport and other farmer deductions are allocated by gross-value share. Your final gross and net amounts will be calculated by the database after all approvals.`
      : "Decline this group-sale proposal? It will be cancelled for all contributors.";
    if (!window.confirm(confirmation)) return;
    setFpoBusy(true);
    try {
      await onFpoGroupSaleConsent(sale.id, consentGiven);
      setNotice(consentGiven ? "Your consent to the displayed group-sale terms was saved." : "You declined the proposal; it was cancelled without a sale.");
    } catch (error) {
      setNotice(error.message || "Farmer consent could not be saved.");
    } finally {
      setFpoBusy(false);
    }
  }

  async function cancelGroupSale(saleId) {
    if (!window.confirm("Cancel this group-sale proposal before confirmation? No inventory will be sold.")) return;
    setFpoBusy(true);
    try {
      await onFpoGroupSaleCancel(saleId);
      setNotice("Unconfirmed group-sale proposal cancelled.");
    } catch (error) {
      setNotice(error.message || "Group-sale proposal could not be cancelled.");
    } finally {
      setFpoBusy(false);
    }
  }

  async function deliverGroupSale(saleId) {
    if (!window.confirm("Confirm that the group-sale crop was delivered? This does not confirm or record payment.")) return;
    setFpoBusy(true);
    try {
      await onFpoGroupSaleTransition(saleId, "delivered");
      setNotice("Group-sale delivery status recorded. Payment remains pending and unverified.");
    } catch (error) {
      setNotice(error.message || "Group-sale delivery could not be recorded.");
    } finally {
      setFpoBusy(false);
    }
  }

  async function requestFpoMembershipFor(fpoId) {
    setFpoBusy(true);
    try {
      await onFpoMembershipRequest(fpoId, true);
      setNotice("Membership request sent with your consent.");
    } catch (error) {
      setNotice(error.message || "Membership request could not be sent.");
    } finally {
      setFpoBusy(false);
    }
  }

  async function joinFpoFromForm(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get("consent") !== "on") return setNotice("Confirm that you want to request membership.");
    await requestFpoMembershipFor(String(form.get("fpoId") || ""));
  }

  async function reviewMembership(membershipId, status) {
    setFpoBusy(true);
    try {
      await onFpoMembershipReview(membershipId, status);
      setNotice(`Membership marked ${status}.`);
    } catch (error) {
      setNotice(error.message || "Membership could not be updated.");
    } finally {
      setFpoBusy(false);
    }
  }

  async function leaveMembership(membershipId) {
    setFpoBusy(true);
    try {
      await onFpoLeave(membershipId);
      setNotice("You have left the FPO. Existing committed activity is not changed.");
    } catch (error) {
      setNotice(error.message || "Membership could not be ended.");
    } finally {
      setFpoBusy(false);
    }
  }

  async function consentAllocation(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (form.get("consent") !== "on") return setNotice("Confirm the crop quantity and campaign before allocating.");
    setFpoBusy(true);
    try {
      await onFpoAllocationConsent({
        campaignId: String(form.get("campaignId") || ""),
        listingId: String(form.get("listingId") || ""),
        quantity: Number(form.get("quantity")),
        consentGiven: true,
      });
      formElement.reset();
      setNotice("Your crop quantity was reserved for the selected FPO campaign.");
    } catch (error) {
      setNotice(error.message || "The allocation could not be saved.");
    } finally {
      setFpoBusy(false);
    }
  }

  async function withdrawAllocation(allocationId) {
    setFpoBusy(true);
    try {
      await onFpoAllocationWithdraw(allocationId);
      setNotice("Uncommitted allocation withdrawn and available stock recalculated.");
    } catch (error) {
      setNotice(error.message || "Allocation could not be withdrawn.");
    } finally {
      setFpoBusy(false);
    }
  }

  function createGroupPlan(event) {
    event.preventDefault();
    if (databaseMode) {
      setNotice("Group selling is not connected to Supabase yet. Nothing was saved or reserved.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const cropIds = form.getAll("cropIds").map(String);
    const selectedCrops = crops.filter((crop) => cropIds.includes(crop.id));
    if (!String(form.get("name") || "").trim() || !selectedCrops.length) {
      setNotice("Enter a group name and select at least one crop lot.");
      return;
    }
    const group = { id: createId("group"), name: String(form.get("name")).trim(), cropIds, status: "Planning", createdAt: new Date().toISOString() };
    if (!updateData((current) => ({ ...current, groups: [group, ...(current.groups || [])] }))) return;
    event.currentTarget.reset();
    setNotice("Group plan saved. Crop quantities are not reserved by this prototype.");
  }

  function captureFeaturePhoto(event, setPhoto) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 350 * 1024) {
      setNotice("Choose an image file smaller than 350 KB.");
      event.currentTarget.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result || ""));
    reader.onerror = () => setNotice("The photo could not be read. Try another image.");
    reader.readAsDataURL(file);
  }

  function speakGuidance() {
    if (!window.speechSynthesis) {
      setVoiceMessage("Spoken guidance is not supported in this browser.");
      return;
    }
    const utterance = new SpeechSynthesisUtterance("Your crop listings, offers, and orders are available from the home screen. Market prices and AI analysis are not connected yet.");
    utterance.lang = language === "te" ? "te-IN" : "en-IN";
    window.speechSynthesis.speak(utterance);
    setVoiceMessage("Reading a short workspace summary aloud.");
  }

  async function saveAnalysisRecord(kind, event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const crop = crops.find((item) => item.id === String(form.get("cropId")));
    if (!crop) return setNotice("Choose a crop lot before saving these notes.");
    const note = String(form.get("notes") || "").trim();
    if (databaseMode) {
      if (form.get("consent") !== "on") return setNotice("Confirm consent to store this private farmer observation.");
      setTransactionBusy(true);
      try {
        await onHealthNoteSave({
          listingId: crop.id,
          note,
          type: String(form.get("noteType") || "health"),
          assessmentId: String(form.get("assessmentId") || "") || null,
          consentGiven: true,
        });
        formElement.reset();
        setNotice("Crop observation saved privately to your account.");
      } catch (error) {
        setNotice(error.message || "The crop observation could not be saved.");
      } finally {
        setTransactionBusy(false);
      }
      return;
    }
    const record = {
      id: createId(kind), kind, cropId: crop.id, cropName: crop.crop,
      notes: note, observations: Object.fromEntries(form.entries()),
      photo: kind === "health" ? healthPhoto : "",
      status: "Saved for expert review; no AI model is connected", createdAt: new Date().toISOString(),
    };
    if (!updateData((current) => ({ ...current, analyses: [record, ...(current.analyses || [])] }))) return;
    formElement.reset();
    setNotice("Observation saved. No automated diagnosis or grade was generated.");
  }

  async function saveQualityAssessment(assessment, photoBlob) {
    if (databaseMode) return onQualitySubmit(assessment, photoBlob);
    return updateData((current) => ({
      ...current,
      qualityAssessments: [assessment, ...(current.qualityAssessments || [])],
    }));
  }

  function chooseCropPhoto(event) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNotice("Choose an image file for the crop photo.");
      event.currentTarget.value = "";
      return;
    }
    if (file.size > 350 * 1024) {
      setNotice("Choose a photo smaller than 350 KB to fit local browser storage.");
      event.currentTarget.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(String(reader.result || ""));
    reader.onerror = () => setNotice("The photo could not be read. Try another image.");
    reader.readAsDataURL(file);
  }

  if (activeQualityCropId) {
    const selectedCrop = crops.find((crop) => crop.id === activeQualityCropId);
    if (!selectedCrop) {
      return <main className="quality-assessment"><section className="quality-success"><h2>Crop lot unavailable</h2><p>This crop lot is no longer in your saved inventory.</p><button className="button button-primary" onClick={() => setActiveQualityCropId("")}>Back to quality assessments</button></section></main>;
    }
    return <QualityVerification
      crop={selectedCrop}
      farmerId={user?.id || null}
      language={language}
      databaseMode={databaseMode}
      onBack={() => setActiveQualityCropId("")}
      onSubmit={saveQualityAssessment}
    />;
  }

  return <main className="workspace">
    <aside className="workspace-sidebar">
      <a className="workspace-brand" href="#home" onClick={() => setSection("home")}><span className="brand-mark"><Sprout size={20} /></span><span><strong>Fieldwise</strong><small>Selling intelligence</small></span></a>
      {!databaseMode && <div className="role-switcher"><label htmlFor="role-select">Demo role access</label><select id="role-select" value={role} onChange={(event) => { onRoleSwitch(event.target.value); setSection("home"); }}><option value="farmer">Farmer</option><option value="buyer">Buyer</option><option value="fpo">FPO / cooperative</option><option value="admin">Admin demo</option></select></div>}
      <nav className="primary-nav" aria-label="Main navigation">{nav.map(([id, label, Icon]) => <button key={id} className={section === id ? "active" : ""} onClick={() => setSection(id)}><Icon size={18} />{label}{id === "activity" && pendingOffers.length > 0 && <span className="nav-count">{pendingOffers.length}</span>}{id === "notifications" && unreadNotificationCount > 0 && <span className="nav-count">{unreadNotificationCount}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><p className="prototype-note"><span className="demo-dot" />{databaseMode ? "Supabase account connected. Transport and notifications use database records; payments remain read-only." : "Demo mode — data is stored locally on this device."}</p><button className="sidebar-logout" onClick={signOut}><LogOut size={17} />Sign out</button></div>
    </aside>
    <section className="workspace-main">
      <header className="workspace-topbar"><div className="breadcrumb">Workspace <ArrowRight size={14} /> {farmer ? "Farmer" : role === "buyer" ? "Buyer" : "FPO"}</div><div className="topbar-user"><span className="user-avatar">{(user?.name || "U").slice(0, 1).toUpperCase()}</span><span>{user?.name || "User"}</span></div></header>
      <div className="page-content">
        {notice && <div className="notice" role="status"><Check size={17} />{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}><X size={16} /></button></div>}
        {databaseMode && <div className="notice notice-demo"><ShieldCheck size={18} />Supabase account connected. Listings, offers, orders, transport, notifications, procurement, FPO consent records, health notes, and market observations use database services. Payments are read-only; FPO settlements are not implemented.</div>}

        {section === "home" && <>
          <div className="page-heading"><div><p className="eyebrow">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase()} <span className="demo-tag">{databaseMode ? "SUPABASE" : "PROTOTYPE"}</span></p><h1>{farmer ? `Good day, ${user?.name || "Farmer"}` : role === "buyer" ? `Welcome, ${user?.name || "Buyer"}` : "FPO overview"}</h1><p className="heading-subtitle">{farmer ? "Your crops, offers and confirmed sales in one place." : role === "buyer" ? "Find available produce and manage procurement." : databaseMode ? "Review consented memberships and procurement campaigns." : "Crop inventory visible in this prototype workspace."}</p></div>{farmer && <button className="button button-primary" onClick={() => { setEditing({}); setSection("crops"); }}><Plus size={17} /> Add crop lot</button>}</div>
          {role === "fpo" && <div className="notice notice-demo"><Users size={18} />FPO memberships and allocations use consented database records. Aggregated sale matching and settlement are not implemented.</div>}
          <div className="metric-grid">
            <Metric Icon={Package} tone="green" label={farmer ? "My listed crops" : "Available crop lots"} value={farmer ? crops.length : available.length} note={farmer ? inventoryDisplay : "Local prototype listings"} onClick={() => setSection(farmer ? "crops" : "market")} />
            <Metric Icon={Bell} tone="amber" label={farmer ? "Offers to review" : "Offers awaiting reply"} value={farmer ? pendingBuyerOffers.length : pendingOffers.length} note="Open offers and counteroffers" onClick={() => setSection("activity")} />
            <Metric Icon={ClipboardList} tone="blue" label="Active orders" value={myOrders.filter((order) => activeOrderStatuses.includes(order.status)).length} note="Delivery status; payments remain unverified" onClick={() => setSection("activity")} />
            <Metric Icon={IndianRupee} tone="coral" label={farmer ? "Estimated proceeds" : "Procurement value"} value={money(farmer ? farmerRecordedEarnings : myOrders.reduce((sum, order) => sum + order.financials.buyerTotal, 0))} note={farmer ? databaseMode ? "Estimated net; no payment verified" : `${money(netRecorded)} simulated payment records` : "Accepted order records"} onClick={() => setSection(farmer ? "earnings" : "activity")} />
            {farmer && <Metric Icon={Check} tone="green" label="Completed sales" value={myOrders.filter((order) => completedOrderStatuses.includes(order.status)).length} note={databaseMode ? "Delivered orders; payment is not verified" : "Prototype order records"} onClick={() => setSection("earnings")} />}
          </div>
          {farmer && <div className="farmer-quick-actions"><button className="button button-primary" onClick={() => { setPhotoPreview(""); setEditing({}); setSection("crops"); }}><Plus size={17} /> {copy.addCrop}</button><button className="button button-quiet" onClick={() => setSection("markets")}><TrendingUp size={17} /> Check prices</button><button className="button button-quiet" onClick={() => setSection("health")}><Leaf size={17} /> Crop health</button><button className="button button-quiet" onClick={() => setSection("quality")}><Check size={17} /> Verify quality</button><button className="button button-quiet" onClick={() => setSection("advisor")}><IndianRupee size={17} /> Sell advice</button><button className="button button-quiet" onClick={() => setSection("market")}><Search size={17} /> Find buyers</button></div>}
          {role === "fpo" && <section className="advisor-lot"><h2>FPO workspace</h2><p>Manage consented memberships and campaigns. Crop allocations reserve stock only after each farmer explicitly agrees. Settlement and bulk-sale order matching are not implemented.</p><button className="button button-primary" onClick={() => setSection("groups")}>Open membership & campaigns</button></section>}
          {farmer && (pendingBuyerOffers.length > 0 || upcomingHarvests.length > 0) && <section className="farmer-alerts"><div className="section-row"><div><h2>Needs your attention</h2><p>Based on your saved crops and offers.</p></div></div>{pendingBuyerOffers.length > 0 && <button className="farmer-alert" onClick={() => setSection("activity")}><Bell size={17} /><span><strong>{pendingBuyerOffers.length} offer{pendingBuyerOffers.length === 1 ? "" : "s"} waiting</strong><small>Review the price and delivery terms.</small></span><ArrowRight size={16} /></button>}{upcomingHarvests.map((crop) => <button className="farmer-alert" key={crop.id} onClick={() => setSection("crops")}><Leaf size={17} /><span><strong>{crop.crop} harvest coming up</strong><small>{crop.harvestDate} · {crop.availableQuantity} {crop.unit} available</small></span><ArrowRight size={16} /></button>)}</section>}
          {farmer ? <>
            <div className="section-row"><div><h2>Recent crop lots</h2><p>Inventory updates when offers are accepted.</p></div><button className="text-button" onClick={() => setSection("crops")}>View all <ArrowRight size={15} /></button></div>
            {crops.length ? <CropTable crops={crops.slice(0, 4)} /> : <Empty title="Your first crop lot starts here" body={databaseMode ? "Add a crop listing. It will be saved to your authenticated Supabase account." : "Add the crop and quantity you plan to sell. It will appear in the buyer workspace on this device."} action="Add a crop lot" onAction={() => { setEditing({}); setSection("crops"); }} />}
            <div className="section-row section-row-gap"><div><h2>Market reference</h2><p>{data.marketPrices?.length ? `${data.marketPrices.length} sourced observations recorded` : "No sourced observations are available."}</p></div><button className="text-button" onClick={() => setSection("markets")}>Browse data <ArrowRight size={15} /></button></div>
            <div className="market-strip"><div className="market-row"><span>Market prices</span><span>{data.marketPrices?.length ? "Recorded data" : "Unavailable"}</span><span>{data.marketPrices?.[0]?.source || "Provider not configured or no observations recorded"}</span></div></div>
          </> : <>
            <div className="section-row"><div><h2>Available crop lots</h2><p>{databaseMode ? "Farmer-submitted listings visible to authenticated buyers." : "Farmer-submitted inventory in this prototype."}</p></div><button className="text-button" onClick={() => setSection("market")}>Browse all <ArrowRight size={15} /></button></div>
            <div className="buyer-preview-grid">{available.slice(0, 3).map((crop) => <CropCard key={crop.id} crop={crop} role={role} draft={offerDraft[crop.id] || {}} onField={setDraft} onSubmit={sendOffer} />)}{available.length === 0 && <Empty title="No crop lots listed yet" body="Farmer-created listings will appear here." />}</div>
          </>}
        </>}

        {section === "crops" && <>
          <div className="page-heading"><div><p className="eyebrow">INVENTORY</p><h1>My crop lots</h1><p className="heading-subtitle">Manage listing quantity and harvest details.</p></div><button className="button button-primary" onClick={() => setEditing({})}><Plus size={17} /> Add crop lot</button></div>
          {editing !== null && <form className="crop-form" onSubmit={saveCrop}><div className="form-heading"><div><h2>{editing.id ? "Edit crop lot" : "New crop lot"}</h2><p>Required fields are marked with an asterisk.</p></div><button type="button" className="icon-button" aria-label="Close form" onClick={() => setEditing(null)}><X size={18} /></button></div>
            <div className="form-grid"><label>{copy.cropName} *<input name="crop" required maxLength="120" defaultValue={editing.crop || ""} placeholder="e.g. Tomato" /></label><label>Variety<input name="variety" maxLength="120" defaultValue={editing.variety || ""} placeholder="Optional" /></label><label>{copy.quantity} *<input name="quantity" type="number" min="0.001" step="0.001" required defaultValue={editing.quantity || ""} /></label><label>Unit<select name="unit" defaultValue={editing.unit || "kg"}><option value="kg">Kilograms</option><option value="quintal">Quintals</option><option value="tonne">Tonnes</option></select></label><label>{copy.expectedPrice} / unit *<input name="expectedPrice" type="number" min="0.01" step="0.01" required defaultValue={editing.expectedPricePerUnit || ""} placeholder="e.g. 25" /></label><label>{copy.location} *<input name="location" required maxLength="240" defaultValue={editing.location || ""} placeholder="Village or market" /></label><label>{copy.harvest} *<input name="harvestDate" type="date" required defaultValue={editing.harvestDate || ""} /></label><label>{copy.quality}<select name="quality" defaultValue={editing.quality || "Not assessed"}><option>Not assessed</option><option>A Grade</option><option>B Grade</option><option>C Grade</option><option>Mixed grade</option></select></label><label className="form-wide">{copy.description}<textarea name="description" rows="2" maxLength="2000" defaultValue={editing.description || editing.notes || ""} placeholder="Optional details that help buyers" /></label>{!databaseMode && <label className="form-wide">Crop photo<input name="photo" type="file" accept="image/*" onChange={chooseCropPhoto} /><small>Image only, up to 350 KB. Optional.</small></label>}</div>
            {photoPreview && <div className="crop-photo-preview"><img src={photoPreview} alt="Crop lot preview" /><button type="button" className="text-button danger-text" onClick={() => setPhotoPreview("")}>Remove photo</button></div>}
            <p className="form-disclaimer">Expected price is your estimate, not a live market quote. Grade is farmer-entered and not independently verified.{databaseMode ? " Crop photos are not part of the configured database listing schema and are unavailable in database mode." : ""}</p><div className="form-actions"><button type="button" className="button button-quiet" onClick={() => setEditing(null)} disabled={savingCrop}>Cancel</button><button className="button button-primary" type="submit" disabled={savingCrop}><Check size={16} /> {savingCrop ? "Saving…" : copy.save}</button></div>
          </form>}
          {crops.length ? <div className="table-wrap"><table><thead><tr><th>Crop lot</th><th>Location</th><th>Harvest</th><th>Expected price</th><th>Available</th><th>Grade / status</th><th>Actions</th></tr></thead><tbody>{crops.map((crop) => <tr key={crop.id}><td><strong>{crop.crop}</strong><small>{crop.variety || "No variety specified"}</small></td><td>{crop.location}</td><td>{crop.harvestDate}</td><td>{crop.expectedPricePerUnit ? `${money(crop.expectedPricePerUnit)}/${crop.unit}` : "Not set"}</td><td>{crop.availableQuantity} {crop.unit}</td><td>{crop.quality} · {crop.status}</td><td className="table-actions"><button className="text-button" onClick={() => { setPhotoPreview(crop.photo || ""); setEditing(crop); }}>Edit</button><button className="text-button danger-text" onClick={() => deleteCrop(crop)} disabled={deletingCropId === crop.id}>{deletingCropId === crop.id ? "Deleting…" : "Delete"}</button></td></tr>)}</tbody></table></div> : <Empty title="No crop lots yet" body="Add a crop lot to make its available quantity visible in the buyer workspace." /> }
        </>}

        {section === "advisor" && <>
          <div className="page-heading"><div><p className="eyebrow">SELLING OPTIONS</p><h1>Sell advisor</h1><p className="heading-subtitle">Compare recorded offers and estimated proceeds. Forecasting is not connected.</p></div><span className="demo-tag">RULE-BASED · NO AI</span></div>
          {crops.filter((crop) => crop.availableQuantity > 0).length ? crops.filter((crop) => crop.availableQuantity > 0).map((crop) => {
            const recommendation = buildSellingRecommendations({ crop, offers, prices: data.marketPrices || [], requests: requirements });
            const estimate = calculateFinancials({ quantity: crop.availableQuantity, unitPrice: crop.expectedPricePerUnit || 0 });
            return <section className="advisor-lot" key={crop.id}>
              <div className="section-row"><div><h2>{crop.crop} <span className="lot-subtitle">· {crop.availableQuantity} {crop.unit} available</span></h2><p>{crop.location} · Harvest {crop.harvestDate}</p></div></div>
              {recommendation.options.length ? recommendation.options.map((option, index) => <article className="market-row" key={`${crop.id}-${option.type}-${index}`}><span><strong>{option.title}</strong><small>{option.quantity} {option.unit} · {money(option.unitPrice)}/{option.unit} · gross {money(option.gross)}</small><small>Transport {money(option.transportCost)} ({option.transportPayer}) · deductions {money(option.otherCharges)} · estimated farmer net {money(option.farmerNet)}</small>{option.reasons.map((reason) => <small key={reason}>{reason}</small>)}</span><button className="text-button" onClick={() => setSection("activity")}>Review offer <ArrowRight size={15} /></button></article>) : <p className="inline-empty">{recommendation.disclaimer} Missing: {recommendation.missing.join(", ")}.</p>}
              {recommendation.demandCount > 0 && <p className="inline-empty">{recommendation.demandCount} open request(s) match quantity, crop and unit; requests are not offers or confirmed sales.</p>}
              <article className="advisor-options"><div><h3>Your expected price (not a market quote)</h3><p>{crop.expectedPricePerUnit ? `${money(crop.expectedPricePerUnit)}/${crop.unit} · ${money(estimate.saleValue)} gross at current available quantity, before costs.` : "Add your expected price to view a gross estimate."}</p><button className="text-button" onClick={() => { setPhotoPreview(crop.photo || ""); setEditing(crop); setSection("crops"); }}>Update estimate <ArrowRight size={15} /></button></div></article>
            </section>;
          }) : <Empty title="Add a crop lot to compare options" body="The advisor compares recorded buyer offers and your own expected price; no forecast or AI model is connected." action="Add crop lot" onAction={() => { setEditing({}); setSection("crops"); }} />}
        </>}

        {section === "sell" && <>
          <div className="page-heading"><div><p className="eyebrow">SELL CROPS</p><h1>Choose your next step</h1><p className="heading-subtitle">Compare recorded buyer offers with your own expected price.</p></div></div>
          <div className="farmer-tool-grid"><ToolCard title="Get selling advice" body="Compare real offers stored in this workspace. No market forecast or AI model is connected." action="Compare offers" onClick={() => setSection("advisor")} icon={<TrendingUp size={19} />} /><ToolCard title="Check market prices" body="Only sourced, dated market observations are shown; no price is invented." action="Open market prices" onClick={() => setSection("markets")} icon={<IndianRupee size={19} />} /><ToolCard title="Find buyers" body="Review buyer requirements and check them against your crop listings." action="Review buyer requests" onClick={() => setSection("requests")} icon={<Search size={19} />} /><ToolCard title="Plan group selling" body="Join an FPO and allocate crop quantities only with your consent." action="Open group plan" onClick={() => setSection("groups")} icon={<Users size={19} />} /><ToolCard title="Storage & risk" body="Review saved orders and harvest reminders. Crop-specific forecasts are unavailable." action="Open risk checks" onClick={() => setSection("storage")} icon={<Bell size={19} />} /></div>
          <button className="button button-primary" onClick={() => { setPhotoPreview(""); setEditing({}); setSection("crops"); }}><Plus size={17} /> {copy.addCrop}</button>
        </>}

        {section === "markets" && <>
          <div className="page-heading"><div><p className="eyebrow">MARKET INTELLIGENCE</p><h1>Market prices</h1><p className="heading-subtitle">Only sourced observations are shown; expected listing prices are not market data.</p></div><span className="demo-tag">{databaseMode ? "DATABASE OBSERVATIONS" : "NO LIVE PROVIDER"}</span></div>
          {databaseMode && <form className="crop-form" onSubmit={refreshMarketData}><div className="form-grid"><label>Crop<input value={marketCrop} onChange={(event) => setMarketCrop(event.target.value)} maxLength="120" placeholder="Optional filter" /></label><label>Market location<input value={marketLocation} onChange={(event) => setMarketLocation(event.target.value)} maxLength="240" placeholder="Optional filter" /></label></div><div className="form-actions"><button className="button button-primary" type="submit" disabled={marketBusy}>{marketBusy ? "Checking provider…" : "Refresh sourced data"}</button></div>{marketMessage && <p className="inline-empty" role="status">{marketMessage}</p>}</form>}
          {!databaseMode && <Empty title="No sourced prices to compare" body="This prototype has no market data provider configured. Your crop's expected price is your own estimate, not a market quote." action="Review crop estimates" onAction={() => setSection("crops")} />}
          {databaseMode && (data.marketPrices || []).length === 0 && <Empty title="No recorded market observations" body="Try a provider refresh if a server-side provider is configured. Otherwise, no price estimate will be invented." />}
          {(data.marketPrices || []).length > 0 && <div className="table-wrap"><table><thead><tr><th>Crop / variety</th><th>Market & location</th><th>Modal / range</th><th>Unit</th><th>Source & observed</th><th>Freshness</th></tr></thead><tbody>{data.marketPrices.filter((price) => (!marketCrop || price.crop.toLowerCase().includes(marketCrop.toLowerCase())) && (!marketLocation || price.location.toLowerCase().includes(marketLocation.toLowerCase()))).map((price) => <tr key={price.id}><td><strong>{price.crop}</strong><small>{price.variety || "All varieties"}</small></td><td>{price.marketName}<small>{price.location}</small></td><td>{price.modalPrice == null ? "No modal price" : `${money(price.modalPrice)}/${price.unit}`}<small>{price.minPrice == null || price.maxPrice == null ? "No range reported" : `${money(price.minPrice)}–${money(price.maxPrice)}`}</small></td><td>{price.unit}</td><td>{price.source}<small>{new Date(price.observedAt).toLocaleString()}</small></td><td>{price.freshness}</td></tr>)}</tbody></table></div>}
          <p className="form-disclaimer">Market observations are not guarantees. Check the observation date, unit, source, location and freshness.</p>
        </>}

        {section === "health" && <>
          <div className="page-heading"><div><p className="eyebrow">CROP HEALTH</p><h1>Record crop observations</h1><p className="heading-subtitle">This saves notes for follow-up; it does not diagnose disease.</p></div><span className="demo-tag">NO AI MODEL</span></div>
          {databaseMode && <div className="notice notice-demo"><ShieldCheck size={18} />Notes are private to you and stored only after explicit consent. They are not shared with buyers and do not diagnose disease.</div>}
          <form className="crop-form" onSubmit={(event) => saveAnalysisRecord("health", event)}><div className="form-grid"><label className="form-wide">Crop lot<select name="cropId" required defaultValue=""><option value="" disabled>Choose a crop lot</option>{crops.map((crop) => <option value={crop.id} key={crop.id}>{crop.crop} · {crop.location}</option>)}</select></label>{databaseMode && <label>Observation type<select name="noteType"><option value="health">Crop health</option><option value="harvest_readiness">Harvest readiness</option></select></label>}{!databaseMode && <label className="form-wide">Photo (optional)<input type="file" accept="image/*" onChange={(event) => captureFeaturePhoto(event, setHealthPhoto)} /></label>}<label className="form-wide">What are you noticing?<textarea name="notes" rows="4" required maxLength="2000" placeholder="Describe leaf spots, wilting, insects, or other changes" /></label>{databaseMode && <label className="form-wide"><input type="checkbox" name="consent" required /> I consent to storing this private observation against my crop lot.</label>}</div>{healthPhoto && !databaseMode && <div className="crop-photo-preview"><img src={healthPhoto} alt="Crop health observation" /></div>}<p className="form-disclaimer">A photo cannot confirm disease, moisture, pesticide residue or hidden defects. For urgent crop loss or treatment decisions, ask a local agriculture expert.</p><div className="form-actions"><button className="button button-primary" type="submit" disabled={transactionBusy || (databaseMode && !crops.length)}>Save observation</button></div></form>
          {(data.analyses || []).filter((record) => record.kind === "health").map((record) => <div className="inline-empty" key={record.id}><strong>{record.cropName}</strong> · {new Date(record.createdAt).toLocaleDateString()} · {record.notes || "No notes entered"} · No diagnosis generated.</div>)}
          {healthNotes.map((record) => <div className="inline-empty" key={record.id}><strong>{record.cropName}</strong> · {new Date(record.createdAt).toLocaleString()} · {record.type.replaceAll("_", " ")} · {record.note} · Private farmer note; no diagnosis generated.</div>)}
        </>}

        {section === "quality" && <>
          <div className="page-heading"><div><p className="eyebrow">CROP QUALITY</p><h1>Quality assessments</h1><p className="heading-subtitle">Every submission requires a new live photo and an accurate GPS reading.</p></div><span className="demo-tag">NO AI GRADING</span></div>
          {databaseMode && <div className="notice notice-demo"><ShieldCheck size={18} />Photos and precise GPS are uploaded only after your consent. The private evidence service does not create a grade or verify image authenticity.</div>}
          {crops.length === 0 && <Empty title="Add a crop before assessing quality" body="A quality assessment must be linked to a saved crop lot." action={farmer ? copy.addCrop : undefined} onAction={() => { setEditing({}); setSection("crops"); }} />}
          {crops.length > 0 && <div className="quality-crop-list">{crops.map((crop) => <article className="quality-crop-row" key={crop.id}><div><strong>{crop.crop}</strong><small>{crop.quantity} {crop.unit} - {crop.location} - {crop.quality}</small></div><button className="button button-primary button-small" onClick={() => setActiveQualityCropId(crop.id)}><Camera size={16} />Start assessment</button></article>)}</div>}
          {(data.qualityAssessments || []).map((assessment) => <article className="quality-history-row" key={assessment.id}><div><strong>{assessment.cropName}</strong><small>{new Date(assessment.submittedAt).toLocaleString()} · {assessment.status}</small><small>GPS ±{assessment.gps.accuracy.toFixed(1)} m · {assessment.gps.latitude.toFixed(5)}, {assessment.gps.longitude.toFixed(5)}</small></div></article>)}
          <p className="form-disclaimer">Live camera and GPS support assessment traceability only; they do not generate or authenticate a quality grade.</p>
        </>}

        {section === "market" && <><div className="page-heading"><div><p className="eyebrow">PROCUREMENT MARKETPLACE</p><h1>Find crop lots</h1><p className="heading-subtitle">Browse farmer-submitted inventory and send a negotiable offer.</p></div></div><label className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search crop, variety or location" /></label><div className="buyer-market-grid">{available.map((crop) => <CropCard key={crop.id} crop={crop} role={role} draft={offerDraft[crop.id] || {}} onField={setDraft} onSubmit={sendOffer} busy={transactionBusy} />)}{available.length === 0 && <Empty title="No matching crop lots" body="Try another search or check back after farmers add inventory." />}</div><p className="market-disclaimer"><ShoppingBag size={15} />{databaseMode ? "Listing visibility and offer access are enforced by the Supabase database." : "Profiles and listings are prototype records on this device, not verified identities."}</p></>}

        {section === "activity" && <>
          <div className="page-heading"><div><p className="eyebrow">TRANSACTIONS</p><h1>{farmer ? "Orders & offers" : "Offers & orders"}</h1><p className="heading-subtitle">{databaseMode ? "Database-backed negotiations and order updates. Payments remain unverified." : "Negotiate offers and update the simulated order timeline."}</p></div></div>
          <section className="activity-section"><div className="section-row"><div><h2>Offers</h2><p>{myOffers.length} offer records</p></div></div>
            {myOffers.length ? <div className="offer-list">{myOffers.map((offer) => {
              const unit = crops.find((crop) => crop.id === offer.cropId)?.unit || offer.unit || "unit";
              const isOpen = ["pending", "countered"].includes(offer.status);
              const canRespond = ["farmer", "buyer"].includes(role) && isOpen && (offer.counteredBy ? offer.counteredBy !== role : offer.buyerRole !== role);
              const offerPrice = offer.counterPricePerUnit || offer.pricePerUnit;
              const totals = calculateFinancials({
                quantity: offer.quantity,
                unitPrice: offerPrice,
                deliveryMethod: offer.deliveryMethod,
                transportCost: offer.transportCost,
                transportPayer: offer.transportPayer,
                otherFarmerCharges: offer.otherFarmerCharges,
              });
              return <article className="offer-card" key={offer.id}>
                <div className="offer-top"><div><span className="offer-crop">{offer.cropName}</span><span className="offer-by">{farmer ? `Offer from ${offer.buyerName}` : `For ${offer.farmerName}'s lot`}</span><small>Created {new Date(offer.createdAt).toLocaleString()}{offer.expiresAt ? ` · Expires ${new Date(offer.expiresAt).toLocaleString()}` : ""}</small></div><span className={`status-pill ${offer.status}`}>{offer.status}</span></div>
                <div className="offer-facts">
                  <span><strong>{offer.quantity} {unit}</strong> quantity</span>
                  <span><strong>{money(offerPrice)}/{unit}</strong> latest unit price</span>
                  <span><strong>{money(totals.saleValue)}</strong> gross crop value</span>
                  <span><strong>{offer.deliveryMethod === "buyer_pickup" ? "Buyer pickup" : offer.deliveryMethod === "farmer_delivery" ? "Farmer delivery" : `Third-party: ${offer.transportProvider || "provider pending"}`}</strong> transport</span>
                  <span><strong>{money(totals.transportCost)} · {totals.transportPayer}</strong> transport cost / payer</span>
                  <span><strong>{money(totals.otherFarmerCharges)}</strong> other farmer deductions</span>
                  <span><strong>{money(totals.buyerTotal)}</strong> buyer total payable</span>
                  <span><strong>{money(totals.estimatedFarmerNet)}</strong> estimated farmer net</span>
                </div>
                {offer.history?.length > 0 && <details className="offer-history"><summary>Negotiation history ({offer.history.length})</summary>{offer.history.map((event, index) => <p key={`${offer.id}-${index}`}>{event.action}{event.pricePerUnit ? ` · ${money(event.pricePerUnit)}/${unit}` : ""} · {new Date(event.at).toLocaleString()}</p>)}</details>}
                {canRespond && <div className="offer-actions"><button className="button button-primary button-small" disabled={transactionBusy} onClick={() => accept(offer)}><Check size={15} /> Accept</button><div className="counter-control"><label className="sr-only" htmlFor={`counter-${offer.id}`}>Counter price per {unit}</label><input id={`counter-${offer.id}`} type="number" min="0.01" step="any" placeholder={`Counter ₹/${unit}`} value={counterDraft[offer.id] || ""} onChange={(event) => setCounterDraft((current) => ({ ...current, [offer.id]: event.target.value }))} /><button className="button button-quiet button-small" disabled={transactionBusy} onClick={() => counter(offer)}>Counter</button></div><button className="text-button danger-text" disabled={transactionBusy} onClick={() => reject(offer)}>Reject</button></div>}
              </article>;
            })}</div> : <Empty title="No offers yet" body={farmer ? "Offers from buyers will appear here when they are submitted." : "Browse crop lots and submit your first offer."} action={!farmer ? "Find crops" : undefined} onAction={() => setSection("market")} />}
          </section>
          {databaseMode && (fpo.groupSales || []).length > 0 && <section className="activity-section"><div className="section-row"><div><h2>FPO group sales</h2><p>Group orders use fresh buyer and farmer consent. Settlement records never imply payment.</p></div></div><div className="order-list">{fpo.groupSales.map((sale) => {
            const contributions = sale.contributors || [];
            const myContribution = contributions.find((contribution) => contribution.farmer_id === user?.id);
            const saleSettlements = (fpo.settlements || []).filter((settlement) => settlement.sale_id === sale.id);
            return <article className="order-card" key={sale.id}>
              <div className="order-heading"><div><span className="order-id">{sale.fpoName} · {sale.id.slice(0, 14)}</span><h3>{sale.crop_type} · {sale.quantity} {sale.unit}</h3><p>{role === "buyer" ? `FPO: ${sale.fpoName}` : `Buyer requirement: ${sale.buyer_requirement_id.slice(0, 8)}…`}</p></div><span className={`status-pill ${sale.status}`}>{sale.status.replaceAll("_", " ")}</span></div>
              <div className="order-money"><span>Unit price <strong>{money(sale.unit_price)}/{sale.unit}</strong></span><span>Gross crop value <strong>{money(sale.gross_value)}</strong></span><span>Transport <strong>{money(sale.transport_cost)} · {sale.transport_payer}</strong></span><span>Other agreed deductions <strong>{money(sale.other_farmer_deductions)}</strong></span><span>Buyer total payable <strong>{money(sale.buyer_total)}</strong></span></div>
              <p className="payment-note">Transport: {sale.delivery_method === "buyer_pickup" ? "Buyer pickup, no separate charge" : sale.delivery_method === "farmer_delivery" ? "Farmer delivery" : `Third-party · ${sale.transport_provider}`} · buyer acceptance: {sale.buyer_accepted_at ? new Date(sale.buyer_accepted_at).toLocaleString() : "pending"}. No payment is processed or verified.</p>
              {sale.events?.length > 0 && <details className="offer-history"><summary>Group-sale history ({sale.events.length})</summary>{sale.events.map((event) => <p key={event.id}>{event.event_type.replaceAll("_", " ")} · {new Date(event.created_at).toLocaleString()}</p>)}</details>}
              {contributions.length > 0 && <div className="offer-facts">{contributions.map((contribution) => <span key={contribution.id}><strong>{role === "farmer" ? "Your contribution" : `Farmer ${contribution.farmer_id.slice(0, 8)}…`}: {contribution.quantity} {sale.unit}</strong>{contribution.consent_at ? "Farmer approved" : "Farmer approval pending"}{contribution.net_proceeds != null ? ` · net ${money(contribution.net_proceeds)}` : ""}</span>)}</div>}
              {role === "farmer" && myContribution && sale.status === "awaiting_approvals" && !myContribution.consent_at && <div className="transport-actions"><button className="button button-primary button-small" disabled={fpoBusy} onClick={() => consentToGroupSale(sale, myContribution, true)}>Review & consent</button><button className="text-button danger-text" disabled={fpoBusy} onClick={() => consentToGroupSale(sale, myContribution, false)}>Decline proposal</button></div>}
              {role === "buyer" && sale.status === "awaiting_approvals" && <div className="transport-actions"><button className="button button-primary button-small" disabled={fpoBusy} onClick={() => respondGroupSale(sale, true)}>Accept terms</button><button className="text-button danger-text" disabled={fpoBusy} onClick={() => respondGroupSale(sale, false)}>Decline proposal</button></div>}
              {role === "fpo" && sale.status === "awaiting_approvals" && <button className="text-button danger-text" disabled={fpoBusy} onClick={() => cancelGroupSale(sale.id)}>Cancel proposal</button>}
              {role === "buyer" && sale.status === "confirmed" && <button className="button button-quiet button-small" disabled={fpoBusy} onClick={() => deliverGroupSale(sale.id)}>Confirm delivery (not payment)</button>}
              {saleSettlements.length > 0 && <div className="settlement-list"><strong>Farmer settlement breakdown · status is pending</strong>{saleSettlements.map((settlement) => <p className="inline-empty" key={settlement.id}>{role === "farmer" ? "Your proceeds" : `Farmer ${settlement.farmer_id.slice(0, 8)}…`} · {settlement.quantity} {sale.unit} · gross {money(settlement.gross_amount)} · transport deduction {money(settlement.transport_deduction)} · other deduction {money(settlement.other_deduction)} · net {money(settlement.net_amount)} · {settlement.status}; no payout verification</p>)}</div>}
            </article>;
          })}</div></section>}
          <section className="activity-section"><div className="section-row"><div><h2>Orders</h2><p>Confirmed orders and recorded status changes.</p></div></div>
            {myOrders.length ? <div className="order-list">{myOrders.map((order) => {
              const transport = order.transport || transportRequests.find((request) => request.orderId === order.id);
              const canReportTransportIssue = transport && ["requested", "accepted", "pickup", "in_transit"].includes(transport.status);
              const canCancelTransport = transport && ["requested", "accepted", "issue"].includes(transport.status)
                && (transport.status !== "requested" || transport.requesterId === user?.id);
              return <article className="order-card" key={order.id}>
              <div className="order-heading"><div><span className="order-id">{order.id.slice(0, 15)}</span><h3>{order.cropName} · {order.quantity} {order.unit}</h3><p>{farmer ? `Buyer: ${order.buyerName}` : `Farmer: ${order.farmerName}`}</p></div><span className={`status-pill ${order.status}`}>{order.status.replaceAll("_", " ")}</span></div>
              <div className="order-money"><span>Unit price <strong>{money(order.unitPrice)}/{order.unit}</strong></span><span>Gross crop value <strong>{money(order.financials.saleValue)}</strong></span><span>Transport <strong>{money(order.financials.transportCost)} · {order.financials.transportPayer}</strong></span><span>Other deductions <strong>{money(order.financials.otherFarmerCharges)}</strong></span><span>Farmer net <strong>{money(order.financials.estimatedFarmerNet)}</strong></span><span>Buyer total <strong>{money(order.financials.buyerTotal)}</strong></span></div>
              <p className="payment-note">Delivery: {order.deliveryMethod === "buyer_pickup" ? "Buyer pickup" : order.deliveryMethod === "farmer_delivery" ? "Farmer delivery" : `Third-party · ${order.transportProvider || "provider not recorded"}`} · transport paid by {order.financials.transportPayer}. Payment: {order.paymentStatus}. {databaseMode ? order.payment?.verified ? `Stored verification timestamp: ${new Date(order.payment.verifiedAt).toLocaleString()}; this workspace has not verified a provider settlement.` : "No payment provider is connected and no payment was initiated here." : "Prototype status only; no provider is connected."}</p>
              <div className="timeline">{order.events.map((event, index) => <span key={`${order.id}-${index}`}><i />{event.label} · {new Date(event.at).toLocaleString()}</span>)}</div>
              {databaseMode && <section className="transport-panel">
                <div className="section-row"><div><h3>Transport</h3><p>Party-entered route and status records; no carrier verification or live tracking.</p></div>{transport && <span className={`status-pill ${transport.status}`}>{transport.status.replaceAll("_", " ")}</span>}</div>
                {transport && <><p className="transport-route"><strong>Pickup:</strong> {transport.route.pickup || "Not recorded"} · <strong>Destination:</strong> {transport.route.destination || "Not recorded"} · <strong>Provider:</strong> {transport.provider || "Not specified"} · <strong>Agreed cost:</strong> {money(transport.cost)} ({transport.payer})</p>
                  {transport.events.length > 0 && <div className="timeline">{transport.events.map((event, index) => <span key={`${transport.id}-${index}`}><i />{event.type.replaceAll("_", " ")} · {new Date(event.at).toLocaleString()}</span>)}</div>}
                  <div className="transport-actions">
                    {transport.status === "requested" && transport.requesterId !== user?.id && <button className="button button-quiet button-small" disabled={transportBusy} onClick={() => updateTransportStatus(transport, "accept")}>Accept request</button>}
                    {transport.status === "accepted" && farmer && <button className="button button-quiet button-small" disabled={transportBusy} onClick={() => updateTransportStatus(transport, "pickup")}>Record pickup</button>}
                    {transport.status === "pickup" && farmer && order.deliveryMethod !== "buyer_pickup" && <button className="button button-quiet button-small" disabled={transportBusy} onClick={() => updateTransportStatus(transport, "in_transit")}>Record dispatch</button>}
                    {((transport.status === "in_transit" && role === "buyer") || (order.deliveryMethod === "buyer_pickup" && role === "buyer" && ["accepted", "pickup"].includes(transport.status))) && <button className="button button-quiet button-small" disabled={transportBusy} onClick={() => updateTransportStatus(transport, "delivered")}>Confirm transport delivered</button>}
                    {canReportTransportIssue && <button className="text-button danger-text" disabled={transportBusy} onClick={() => updateTransportStatus(transport, "issue")}>Report transport issue</button>}
                    {canCancelTransport && <button className="text-button danger-text" disabled={transportBusy} onClick={() => updateTransportStatus(transport, "cancel")}>Cancel transport</button>}
                  </div>
                </>}
                {(!transport || transport.status === "cancelled") && order.deliveryMethod === "buyer_pickup" && <p className="inline-empty">Buyer pickup has no separate transport request or charge.</p>}
                {(!transport || transport.status === "cancelled") && order.deliveryMethod !== "buyer_pickup" && ["confirmed", "awaiting_pickup"].includes(order.status) && <>
                  <button className="button button-quiet button-small" disabled={transportBusy} onClick={() => setTransportFormOrderId(transportFormOrderId === order.id ? "" : order.id)}>{transportFormOrderId === order.id ? "Close transport form" : "Arrange transport"}</button>
                  {transportFormOrderId === order.id && <form className="transport-form" onSubmit={(event) => saveTransportRequest(event, order)}>
                    <label>Pickup location *<input name="pickup" required maxLength="240" /></label>
                    <label>Destination *<input name="destination" required maxLength="240" /></label>
                    <label>Requested date *<input name="requestedDate" type="date" min={new Date().toISOString().slice(0, 10)} defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
                    {order.deliveryMethod === "third_party" && <label>Agreed provider<input name="provider" value={order.transportProvider} readOnly /></label>}
                    <label>Agreed transport cost<input name="cost" value={order.financials.transportCost} readOnly /></label>
                    <label>Transport payer<input name="payer" value={order.financials.transportPayer} readOnly /></label>
                    <p className="form-disclaimer">Only the accepted order's transport terms can be requested. Route information is visible to the order parties.</p>
                    <button className="button button-primary button-small" type="submit" disabled={transportBusy}>Save transport request</button>
                  </form>}
                </>}
              </section>}
              {databaseMode ? <>
                {((farmer && order.status === "confirmed") || (role === "buyer" && ["awaiting_pickup", "in_transit"].includes(order.status))) && <button className="button button-quiet button-small" disabled={transactionBusy} onClick={() => progressOrder(order)}>{order.status === "confirmed" ? "Mark ready for pickup" : order.status === "awaiting_pickup" ? "Confirm pickup / in transit" : "Confirm delivery"}<ArrowRight size={14} /></button>}
                {["farmer", "buyer"].includes(role) && ["confirmed", "awaiting_pickup"].includes(order.status) && <button className="text-button danger-text" disabled={transactionBusy} onClick={() => updateOrderStatus(order, "cancel", "Cancel order")}>Cancel order</button>}
                {["farmer", "buyer"].includes(role) && ["confirmed", "awaiting_pickup", "in_transit", "delivered"].includes(order.status) && <button className="text-button danger-text" disabled={transactionBusy} onClick={() => updateOrderStatus(order, "dispute", "Report an issue")}>Report an issue</button>}
              </> : order.status !== "Completed" && <button className="button button-quiet button-small" onClick={() => progressOrder(order)}>{order.status === "Delivered" ? "Record simulated payment" : order.status === "Payment recorded" ? "Complete order" : "Advance order status"}<ArrowRight size={14} /></button>}
            </article>;
            })}</div> : <Empty title="No orders recorded" body="Accept an offer to create an order with saved delivery and financial terms." />}
          </section>
        </>}

        {section === "earnings" && <>
          <div className="page-heading"><div><p className="eyebrow">FINANCIAL RECORDS</p><h1>Earnings</h1><p className="heading-subtitle">{databaseMode ? "Database-backed order estimates; no payment provider is connected." : "Order-linked estimates and simulated payment records."}</p></div></div>
          <div className="notice notice-demo"><IndianRupee size={18} />{databaseMode ? "Order records are not proof of payment. No payment is processed or verified." : "No payments are processed. A simulated status does not verify that funds were received."}</div>
          <div className="metric-grid earnings-summary">
            <Metric label="Gross sale value" value={money(myFarmerOrders.reduce((sum, order) => sum + order.financials.saleValue, 0))} />
            <Metric label="Farmer-paid costs" value={money(myFarmerOrders.reduce((sum, order) => sum + order.financials.otherFarmerCharges + (order.financials.transportPayer === "farmer" ? order.financials.transportCost : 0), 0))} />
            <Metric label="Estimated net" value={money(myFarmerOrders.reduce((sum, order) => sum + order.financials.estimatedFarmerNet, 0))} />
          </div>
          {myFarmerOrders.length ? <div className="table-wrap"><table><thead><tr><th>Order</th><th>Crop</th><th>Gross</th><th>Farmer net</th><th>Payment status</th></tr></thead><tbody>{myFarmerOrders.map((order) => <tr key={order.id}><td>{order.id.slice(0, 15)}</td><td>{order.cropName}</td><td>{money(order.financials.saleValue)}</td><td>{money(order.financials.estimatedFarmerNet)}</td><td>{order.paymentStatus}</td></tr>)}</tbody></table></div> : <Empty title="No sales to show" body="Order financial records will appear here after an offer is accepted." />}
        </>}

        {section === "requests" && <>
          <div className="page-heading"><div><p className="eyebrow">PROCUREMENT</p><h1>Procurement requests</h1><p className="heading-subtitle">{role === "buyer" ? "Create and manage your buying requirements; matches are not offers." : "Open buyer requests are matched against your crop listings."}</p></div><span className="demo-tag">{databaseMode ? "SUPABASE" : "LOCAL DEMO"}</span></div>
          {databaseMode && <div className="notice notice-demo"><ShieldCheck size={18} />Requests are visible according to database policies. A match is informational only; the buyer must submit an offer and the farmer must accept it.</div>}
          {role === "buyer" && <form key={editingRequestId || "new-requirement"} className="crop-form" onSubmit={saveProcurementRequest}><div className="form-heading"><div><h2>{editingRequestId ? "Edit requirement" : "New buying requirement"}</h2><p>Your account can create and manage its own requirements.</p></div></div><div className="form-grid"><label>Crop *<input name="crop" required maxLength="120" placeholder="e.g. Tomato" defaultValue={requirements.find((item) => item.id === editingRequestId)?.crop || ""} /></label><label>Variety<input name="variety" maxLength="120" placeholder="Optional" defaultValue={requirements.find((item) => item.id === editingRequestId)?.variety || ""} /></label><label>Quantity *<input name="quantity" type="number" min="0.001" step="any" required defaultValue={requirements.find((item) => item.id === editingRequestId)?.quantity || ""} /></label><label>Unit<select name="unit" defaultValue={requirements.find((item) => item.id === editingRequestId)?.unit || "kg"}><option value="kg">kg</option><option value="quintal">quintal</option><option value="tonne">tonne</option></select></label><label>Minimum price / unit<input name="budgetMin" type="number" min="0" step="any" placeholder="Optional" defaultValue={requirements.find((item) => item.id === editingRequestId)?.budgetMin ?? ""} /></label><label>Maximum price / unit<input name="budgetMax" type="number" min="0.01" step="any" placeholder="Optional" defaultValue={requirements.find((item) => item.id === editingRequestId)?.budgetMax ?? ""} /></label><label>Quality requirement<select name="quality" defaultValue={requirements.find((item) => item.id === editingRequestId)?.quality || "Any grade"}><option>Any grade</option><option>A Grade</option><option>B Grade</option><option>C Grade</option><option>Mixed grade</option></select></label><label>Delivery location *<input name="location" required maxLength="240" placeholder="Village or market" defaultValue={requirements.find((item) => item.id === editingRequestId)?.location || ""} /></label><label>Required by *<input name="deliveryDate" type="date" required defaultValue={requirements.find((item) => item.id === editingRequestId)?.deliveryDate || ""} /></label></div><div className="form-actions"><button className="button button-primary" type="submit" disabled={requestBusy}>{requestBusy ? "Saving…" : editingRequestId ? "Update requirement" : "Save requirement"}</button>{editingRequestId && <button className="button button-quiet" type="button" onClick={() => setEditingRequestId("")}>Cancel edit</button>}</div></form>}
          {role === "buyer" && myRequirements.map((request) => {
            const matches = matchCropListings(databaseMode ? request : { ...request, status: request.status || "open" }, crops);
            return <section className="advisor-lot" key={request.id}><div className="section-row"><div><h2>{request.crop}{request.variety ? ` · ${request.variety}` : ""} · {request.quantity} {request.unit}</h2><p>{request.location} · required by {request.deliveryDate} · {request.quality || "Any grade"} · {request.budgetMin == null && request.budgetMax == null ? "No budget set" : `${request.budgetMin == null ? "No min" : money(request.budgetMin)}–${request.budgetMax == null ? "No max" : money(request.budgetMax)}/${request.unit}`}</p></div><span className={`status-pill ${request.status}`}>{request.status}</span></div>{request.status === "open" && <div className="form-actions"><button className="text-button" onClick={() => setEditingRequestId(request.id)}>Edit request</button><button className="text-button danger-text" disabled={requestBusy} onClick={() => changeRequestStatus(request.id, "closed")}>Close request</button><button className="text-button danger-text" disabled={requestBusy} onClick={() => changeRequestStatus(request.id, "cancelled")}>Cancel request</button></div>}{matches.length ? <><p className="inline-empty">{matches.length} matching available lot(s). Create offers only for the exact lot and quantity shown.</p><div className="buyer-market-grid">{matches.map((crop) => <CropCard key={crop.id} crop={crop} role="buyer" draft={offerDraft[crop.id] || { quantity: request.quantity }} onField={setDraft} onSubmit={(event, listing) => sendOffer(event, listing, request.quantity)} busy={transactionBusy} />)}</div></> : <p className="inline-empty">No available lots match this requirement yet.</p>}</section>;
          })}
          {role === "farmer" && requirements.filter((request) => request.status === "open").map((request) => {
            const matches = matchCropListings(databaseMode ? request : { ...request, status: request.status || "open" }, crops);
            return <section className="advisor-lot" key={request.id}><div className="section-row"><div><h2>{request.crop}{request.variety ? ` · ${request.variety}` : ""} · {request.quantity} {request.unit}</h2><p>Delivery location: {request.location} · wanted by {request.deliveryDate} · {request.quality || "Any grade"}</p></div><span className="status-pill available">Open request</span></div><p className="inline-empty">Maximum budget: {request.budgetMax == null ? "not stated" : `${money(request.budgetMax)}/${request.unit}`}. Your crop listing is matched for crop, quantity, unit, grade, location text, harvest date and budget. Distance and delivery feasibility are not verified. The buyer must submit an offer; you can review it in Offers & orders.</p>{matches.map((crop) => <div className="buyer-request-match" key={crop.id}><span><strong>{crop.crop} · {crop.availableQuantity} {crop.unit}</strong><small>{crop.location} · your asking estimate {crop.expectedPricePerUnit ? `${money(crop.expectedPricePerUnit)}/${crop.unit}` : "not entered"}</small></span></div>)}</section>;
          })}
          {role === "buyer" && !myRequirements.length && <Empty title="No procurement requirements yet" body="Create a requirement to see matching crop lots. You can make an offer directly from a matched listing." />}
          {role === "farmer" && !requirements.filter((request) => request.status === "open").length && <Empty title="No open buyer requests" body="Open buyer requirements will appear here when available." />}
        </>}

        {section === "more" && <><div className="page-heading"><div><p className="eyebrow">ACCOUNT & TOOLS</p><h1>{copy.more}</h1><p className="heading-subtitle">Less-frequent tools and account settings.</p></div></div><div className="more-menu">{farmer && <><MoreLink icon={<Wallet size={18} />} title="Earnings" detail="Sales and proceeds" onClick={() => setSection("earnings")} /><MoreLink icon={<Users size={18} />} title="Group selling" detail="Plan crop aggregation" onClick={() => setSection("groups")} /><MoreLink icon={<Bell size={18} />} title="Notifications" detail="Offers and harvest reminders" onClick={() => setSection("notifications")} /><MoreLink icon={<UserRound size={18} />} title="Profile & language" detail="Name and English/Telugu" onClick={() => setSection("profile")} /><MoreLink icon={<CircleEllipsis size={18} />} title="Help & voice" detail="Guidance and spoken summary" onClick={() => setSection("help")} /></>}{role === "buyer" && <MoreLink icon={<ShoppingBag size={18} />} title="Procurement requests" detail="Save quantity, grade and delivery needs" onClick={() => setSection("requests")} />}{role === "admin" && <MoreLink icon={<ShieldCheck size={18} />} title="Listing review" detail="Moderate prototype crop listings" onClick={() => setSection("moderation")} />}{!databaseMode && <><label htmlFor="mobile-role-select">Demo role access<select id="mobile-role-select" value={role} onChange={(event) => { onRoleSwitch(event.target.value); setSection("home"); }}><option value="farmer">Farmer</option><option value="buyer">Buyer</option><option value="fpo">FPO / cooperative</option><option value="admin">Admin demo</option></select></label><p className="form-disclaimer">Role switching is for this local prototype only, not authorization.</p></>}<button onClick={signOut}><LogOut size={18} /><span><strong>Sign out</strong><small>{databaseMode ? "Sign out of your account" : "Return to role selection"}</small></span><ArrowRight size={16} /></button></div></>}
        {section === "groups" && <>
          <div className="page-heading"><div><p className="eyebrow">FPO & GROUP SELLING</p><h1>{databaseMode && role === "fpo" ? "FPO membership & campaigns" : "Group selling"}</h1><p className="heading-subtitle">{databaseMode ? "Membership and every crop allocation require farmer consent." : "Local demo group planning is not a real membership or inventory reservation."}</p></div><span className="demo-tag">{databaseMode ? "SUPABASE WORKSPACE" : "LOCAL DEMO"}</span></div>
          {!databaseMode && <><div className="notice notice-demo"><ShieldCheck size={18} />Demo plans do not reserve inventory, verify membership, or settle proceeds.</div><form className="crop-form" onSubmit={createGroupPlan}><div className="form-grid"><label className="form-wide">Group or FPO name *<input name="name" required placeholder="e.g. Pithapuram growers" /></label><div className="form-wide crop-select-list"><strong>Select crop lots</strong>{crops.filter((crop) => crop.availableQuantity > 0).map((crop) => <label key={crop.id}><input type="checkbox" name="cropIds" value={crop.id} />{crop.crop} · {crop.availableQuantity} {crop.unit} · {crop.location}</label>)}</div></div><p className="form-disclaimer">No inventory is reserved and no sale or payout is created.</p><div className="form-actions"><button className="button button-primary" type="submit">Save demo plan</button></div></form>{(data.groups || []).map((group) => { const groupCrops = crops.filter((crop) => group.cropIds.includes(crop.id)); return <section className="advisor-lot" key={group.id}><div className="section-row"><div><h2>{group.name}</h2><p>{groupCrops.map((crop) => `${crop.crop}: ${crop.availableQuantity} ${crop.unit}`).join(" · ") || "Selected crop lots no longer exist"}</p></div><span className="status-pill pending">{group.status}</span></div></section>; })}</>}
          {databaseMode && farmer && <>
            <section className="advisor-lot"><h2>Join an FPO</h2><p>Membership is optional. Your request is sent only after you confirm consent, and membership remains pending until the FPO reviews it.</p>{fpo.fpos.map((organization) => {
              const membership = myMemberships.find((item) => item.fpo_id === organization.id && ["pending", "active"].includes(item.status));
              return <div className="buyer-request-match" key={organization.id}><span><strong>{organization.name}</strong><small>{membership ? `Membership ${membership.status}` : "Registered FPO"}</small></span>{membership ? <button className="text-button danger-text" disabled={fpoBusy} onClick={() => leaveMembership(membership.id)}>Leave / withdraw request</button> : <form onSubmit={joinFpoFromForm}><input type="hidden" name="fpoId" value={organization.id} /><label><input type="checkbox" name="consent" required /> I consent to send this membership request.</label><button className="button button-primary button-small" type="submit" disabled={fpoBusy}>Request membership</button></form>}</div>;
            })}{!fpo.fpos.length && <p className="inline-empty">No FPO organizations are listed yet.</p>}</section>
            <section className="advisor-lot"><h2>Active memberships</h2>{myMemberships.length ? myMemberships.map((membership) => <p className="inline-empty" key={membership.id}>{membership.fpoName} · {membership.status} · consent recorded {new Date(membership.consent_at).toLocaleDateString()}</p>) : <p className="inline-empty">Your membership requests and status will appear here.</p>}</section>
            <section className="advisor-lot"><h2>Open campaigns</h2>{fpo.campaigns.filter((campaign) => myMemberships.some((membership) => membership.fpo_id === campaign.fpo_id && membership.status === "active") && campaign.status === "open").map((campaign) => <p className="inline-empty" key={campaign.id}>{campaign.fpoName} · {campaign.name} · {campaign.crop_type} · target {campaign.target_quantity || "not set"} {campaign.unit} · allocated {campaign.allocatedQuantity} {campaign.unit}</p>)}
              {myMemberships.some((membership) => membership.status === "active") && crops.some((crop) => crop.availableQuantity > 0) && <form className="crop-form" onSubmit={consentAllocation}><div className="form-grid"><label>Campaign *<select name="campaignId" required defaultValue=""><option value="" disabled>Choose an open campaign</option>{fpo.campaigns.filter((campaign) => campaign.status === "open" && myMemberships.some((membership) => membership.fpo_id === campaign.fpo_id && membership.status === "active")).map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.fpoName} · {campaign.name} · {campaign.crop_type}</option>)}</select></label><label>Your crop lot *<select name="listingId" required defaultValue=""><option value="" disabled>Choose a matching crop</option>{crops.filter((crop) => crop.availableQuantity > 0).map((crop) => <option key={crop.id} value={crop.id}>{crop.crop} · {crop.availableQuantity} {crop.unit} · {crop.location}</option>)}</select></label><label>Quantity to reserve *<input name="quantity" type="number" min="0.001" step="any" required /></label><label><input name="consent" type="checkbox" required /> I consent to reserve this quantity for this campaign.</label></div><p className="form-disclaimer">The database checks campaign crop/unit and available stock atomically. You may withdraw only before the allocation is committed.</p><div className="form-actions"><button className="button button-primary" type="submit" disabled={fpoBusy}>Allocate with consent</button></div></form>}
            </section>
            <section className="advisor-lot"><h2>My crop allocations</h2>{myAllocations.length ? myAllocations.map((allocation) => <div className="buyer-request-match" key={allocation.id}><span><strong>{allocation.fpoName}</strong><small>{allocation.quantity} allocated · {allocation.sold_quantity} sold · {allocation.status}</small></span>{allocation.status === "allocated" && <button className="text-button danger-text" disabled={fpoBusy} onClick={() => withdrawAllocation(allocation.id)}>Withdraw allocation</button>}</div>) : <p className="inline-empty">You have not consented to any crop allocations.</p>}</section>
          </>}
          {databaseMode && role === "fpo" && <>
            {!managedFpos.length && <Empty title="No FPO administrator workspace" body="This account has no FPO profile assigned to it. Ask the project administrator to configure the organization; do not change your role in the browser." />}
            {managedFpos.length > 0 && <form className="crop-form" onSubmit={createFpoCampaignFromForm}><div className="form-heading"><div><h2>Create a procurement campaign</h2><p>Campaign creation is restricted by the database to your authorized FPO.</p></div></div><div className="form-grid"><label>FPO *<select name="fpoId" required>{managedFpos.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Campaign name *<input name="name" required maxLength="200" /></label><label>Crop *<input name="crop" required maxLength="120" /></label><label>Unit *<select name="unit"><option value="kg">kg</option><option value="quintal">quintal</option><option value="tonne">tonne</option></select></label><label>Target quantity<input name="targetQuantity" type="number" min="0.001" step="any" /></label></div><div className="form-actions"><button className="button button-primary" type="submit" disabled={fpoBusy}>Create campaign</button></div></form>}
            {managedFpos.length > 0 && <section className="advisor-lot"><h2>Propose an aggregated sale</h2><p className="form-disclaimer">Select existing consented campaign allocations and an open matching buyer requirement. Every contributing farmer and the buyer must separately approve these exact sale terms before inventory is committed.</p><form className="crop-form" onSubmit={createFpoGroupSaleFromForm}>
              <div className="form-grid">
                <label>Campaign *<select name="campaignId" value={selectedSaleCampaignId} onChange={(event) => setSelectedSaleCampaignId(event.target.value)} required><option value="">Choose an open campaign</option>{fpo.campaigns.filter((campaign) => campaign.status === "open" && managedFpos.some((organization) => organization.id === campaign.fpo_id)).map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name} · {campaign.crop_type} ({campaign.unit})</option>)}</select></label>
                <label>Buyer requirement *<select name="requirementId" required disabled={!matchingGroupSaleRequirements.length}><option value="">Choose matching requirement</option>{matchingGroupSaleRequirements.map((request) => <option key={request.id} value={request.id}>{request.quantity} {request.unit} · deliver by {request.deliveryDate} · buyer {request.buyerId.slice(0, 8)}…</option>)}</select></label>
                <div className="form-wide crop-select-list"><strong>Farmer allocations and quantities *</strong>{eligibleGroupSaleAllocations.map((allocation) => {
                  const remaining = Number(allocation.quantity) - Number(allocation.committed_quantity || 0) - (pendingGroupSaleClaims.get(allocation.id) || 0);
                  return <label key={allocation.id}><span>{crops.find((crop) => crop.id === allocation.listing_id)?.crop || selectedSaleCampaign?.crop_type} · {allocation.quantity} {selectedSaleCampaign?.unit} allocated · {allocation.committed_quantity || 0} committed · {remaining} available to propose</span><input name={`contribution-${allocation.id}`} type="number" min="0.001" max={remaining} step="0.001" placeholder="Quantity to include" /></label>;
                })}{selectedSaleCampaignId && !eligibleGroupSaleAllocations.length && <p className="inline-empty">No eligible allocated quantities are available for this campaign.</p>}</div>
                <label>Agreed unit price (INR) *<input name="unitPrice" type="number" min="0.01" step="0.01" required /></label>
                <label>Delivery method *<select name="deliveryMethod" value={groupSaleDeliveryMethod} onChange={(event) => {
                  const method = event.target.value;
                  setGroupSaleDeliveryMethod(method);
                  setGroupSaleTransportPayer(method === "buyer_pickup" ? "none" : method === "farmer_delivery" ? "buyer" : "third_party");
                  if (method === "buyer_pickup") setGroupSaleTransportProvider("");
                }}><option value="buyer_pickup">Buyer pickup</option><option value="farmer_delivery">Farmer delivery</option><option value="third_party">Third-party transport</option></select></label>
                <label>Transport provider<input name="transportProvider" value={groupSaleTransportProvider} onChange={(event) => setGroupSaleTransportProvider(event.target.value)} maxLength="200" placeholder="Required for third-party transport" disabled={groupSaleDeliveryMethod === "buyer_pickup"} /></label>
                <label>Agreed transport cost (INR) *<input name="transportCost" type="number" min="0" step="0.01" defaultValue="0" required /></label>
                <label>Transport payer *<select name="transportPayer" value={groupSaleTransportPayer} onChange={(event) => setGroupSaleTransportPayer(event.target.value)} disabled={groupSaleDeliveryMethod === "buyer_pickup"}><option value="none">None (buyer pickup)</option><option value="buyer">Buyer</option><option value="farmer">Farmers, shared by gross value</option><option value="third_party">Third party</option></select></label>
                <label>Other agreed farmer deductions (INR) *<input name="otherDeductions" type="number" min="0" step="0.01" defaultValue="0" required /></label>
              </div>
              <p className="form-disclaimer">Formula: each farmer's gross share is proportional to contributed quantity at the common unit price. Farmer-paid transport and other deductions are allocated pro rata to gross share; the database assigns any rounding remainder to the contributor whose allocation ID sorts last. Farmer delivery defaults to buyer-paid transport; buyer pickup has no separate transport charge. All figures are saved only after every farmer and the buyer consent. Settlements remain pending; no payout is processed or verified.</p>
              <div className="form-actions"><button className="button button-primary" type="submit" disabled={fpoBusy || !selectedSaleCampaignId || !eligibleGroupSaleAllocations.length || !matchingGroupSaleRequirements.length}>Send proposal for consent</button></div>
            </form></section>}
            {managedFpos.flatMap((organization) => fpo.memberships.filter((membership) => membership.fpo_id === organization.id).map((membership) => <div className="buyer-request-match" key={membership.id}><span><strong>Farmer membership request</strong><small>{membership.farmer_id.slice(0, 8)}… · {membership.status} · consent recorded</small></span>{membership.status === "pending" && <><button className="button button-primary button-small" disabled={fpoBusy} onClick={() => reviewMembership(membership.id, "active")}>Approve</button><button className="text-button danger-text" disabled={fpoBusy} onClick={() => reviewMembership(membership.id, "suspended")}>Decline</button></>}</div>))}
            {fpo.campaigns.filter((campaign) => managedFpos.some((organization) => organization.id === campaign.fpo_id)).map((campaign) => <section className="advisor-lot" key={campaign.id}><div className="section-row"><div><h2>{campaign.name}</h2><p>{campaign.crop_type} · target {campaign.target_quantity || "not set"} {campaign.unit} · allocated {campaign.allocatedQuantity} {campaign.unit}</p></div><span className={`status-pill ${campaign.status}`}>{campaign.status}</span></div>{fpo.allocations.filter((allocation) => allocation.campaign_id === campaign.id).map((allocation) => <p className="inline-empty" key={allocation.id}>{allocation.quantity} {campaign.unit} · {allocation.status} · consent recorded</p>)}</section>)}
            <div className="notice notice-demo"><ShieldCheck size={18} />Campaigns and allocations do not create a bulk-sale order or farmer settlement. No shared proceeds or payment is recorded.</div>
          </>}
        </>}

        {section === "notifications" && <><div className="page-heading"><div><p className="eyebrow">UPDATES</p><h1>Notifications</h1><p className="heading-subtitle">{databaseMode ? `${unreadNotificationCount} unread · notifications saved to your account` : "Demo reminders are generated from local offers and harvest dates."}</p></div></div>{databaseMode ? notifications.map((notification) => <article className={`farmer-alert ${notification.readAt ? "notification-read" : ""}`} key={notification.id}><Bell size={17} /><span><strong>{notification.message}</strong><small>{notification.type.replaceAll("_", " ")} · {new Date(notification.createdAt).toLocaleString()}</small></span>{!notification.readAt && <button className="text-button" disabled={transportBusy} onClick={() => readNotification(notification)}>Mark read</button>}</article>) : <>{pendingBuyerOffers.map((offer) => <button className="farmer-alert" key={offer.id} onClick={() => setSection("activity")}><Bell size={17} /><span><strong>Offer received for {offer.cropName}</strong><small>{offer.quantity} units at {money(offer.pricePerUnit)} per unit · {offer.status}</small></span><ArrowRight size={16} /></button>)}{upcomingHarvests.map((crop) => <button className="farmer-alert" key={crop.id} onClick={() => setSection("crops")}><Leaf size={17} /><span><strong>{crop.crop} harvest coming up</strong><small>{crop.harvestDate} · {crop.availableQuantity} {crop.unit} available</small></span><ArrowRight size={16} /></button>)}{pendingBuyerOffers.length === 0 && upcomingHarvests.length === 0 && <Empty title="You are all caught up" body="Offer and harvest reminders will appear here when they apply." />}</>}</>}

        {section === "profile" && <><div className="page-heading"><div><p className="eyebrow">ACCOUNT</p><h1>{copy.profile}</h1><p className="heading-subtitle">{databaseMode ? "Update your authenticated account profile and language." : "Update your local profile and workspace language."}</p></div></div><form className="crop-form" onSubmit={saveProfile}><div className="form-grid"><label>Your name<input value={profileName} onChange={(event) => setProfileName(event.target.value)} required maxLength="160" /></label><label>{copy.language}<select value={language} onChange={changeLanguage}><option value="en">English</option><option value="te">తెలుగు (Telugu)</option><option value="hi">हिन्दी (Hindi)</option><option value="mr">मराठी (Marathi)</option></select></label><label>Current role<input value={role === "admin" && !databaseMode ? "Admin demo" : role} readOnly /></label></div><p className="form-disclaimer">{databaseMode ? "Role is assigned by an administrator and cannot be changed here." : "Profile data is stored in this browser. Role selection does not secure or restrict access."}</p><div className="form-actions"><button className="button button-primary" type="submit">Save profile</button></div></form></>}

        {section === "help" && <><div className="page-heading"><div><p className="eyebrow">HELP & ACCESSIBILITY</p><h1>Help and voice</h1><p className="heading-subtitle">Guidance for your account and demo features.</p></div></div><section className="advisor-lot"><h2>Speak a summary</h2><p className="heading-subtitle">Uses your browser's built-in speech synthesis. No audio is sent to a service.</p><button className="button button-primary" onClick={speakGuidance}>Read workspace summary aloud</button>{voiceMessage && <p className="inline-empty" role="status">{voiceMessage}</p>}</section><section className="advisor-lot"><h2>What is connected?</h2><p className="inline-empty">{databaseMode ? "Crop lots, offers, orders, transport requests/status events, and notifications use your Supabase account. Payment processing, carrier verification/live tracking, FPO settlements, and live AI crop analysis are not connected." : "Crop lots, offers, groups, and orders save in this browser demo. Payment processing, carrier verification/live tracking, and live AI crop analysis are not connected."}</p></section></>}

        {section === "moderation" && role === "admin" && <><div className="page-heading"><div><p className="eyebrow">ADMIN DEMO</p><h1>Listing review</h1><p className="heading-subtitle">Moderation actions for local prototype crop listings.</p></div><span className="demo-tag">NOT SECURE</span></div><div className="notice notice-demo"><ShieldCheck size={18} />Admin role selection is a frontend demo. A backend must enforce authorization.</div><div className="table-wrap"><table><thead><tr><th>Crop</th><th>Farmer label</th><th>Available</th><th>Status</th><th>Action</th></tr></thead><tbody>{crops.map((crop) => <tr key={crop.id}><td>{crop.crop}</td><td>{crop.farmerName}</td><td>{crop.availableQuantity} {crop.unit}</td><td>{crop.status}</td><td><button className="text-button" onClick={() => { if (!updateData((current) => ({ ...current, crops: current.crops.map((item) => item.id === crop.id ? { ...item, status: item.status === "Available" ? "Under review" : "Available" } : item) }))) return; setNotice("Prototype listing status updated."); }}>{crop.status === "Available" ? "Flag for review" : "Restore listing"}</button></td></tr>)}</tbody></table></div></>}

        {section === "buyers" && <><div className="page-heading"><div><p className="eyebrow">BUYERS & OFFERS</p><h1>Buyer requirements</h1><p className="heading-subtitle">Requests are from this local prototype, not verified businesses.</p></div><span className="demo-tag">DEMO DATA</span></div>{(data.procurementRequests || []).length ? (data.procurementRequests || []).map((request) => { const matches = crops.filter((crop) => crop.status === "Available" && crop.availableQuantity > 0 && crop.availableQuantity >= request.quantity && crop.crop.toLowerCase() === request.crop.toLowerCase() && crop.unit === request.unit && (!request.targetPrice || !crop.expectedPricePerUnit || crop.expectedPricePerUnit <= request.targetPrice) && (!request.quality || request.quality === "Any grade" || crop.quality === request.quality)); return <section className="advisor-lot" key={request.id}><div className="section-row"><div><h2>{request.crop} · {request.quantity} {request.unit}</h2><p>{request.buyerName} · delivery near {request.location} by {request.deliveryDate}</p></div><span className="status-pill pending">Buyer request · Demo</span></div><p className="heading-subtitle">Quality: {request.quality || "Any grade"} · target: {request.targetPrice ? `${money(request.targetPrice)}/${request.unit}` : "not specified"}</p>{matches.length ? matches.map((crop) => <div className="buyer-request-match" key={crop.id}><span><strong>{crop.crop} · {crop.availableQuantity} {crop.unit}</strong><small>{crop.location} · your estimate {crop.expectedPricePerUnit ? `${money(crop.expectedPricePerUnit)}/${crop.unit}` : "not entered"}</small></span><button className="button button-primary button-small" onClick={() => respondToRequest(request, crop)}>Send offer</button></div>) : <p className="inline-empty">No matching crop lot. Match checks crop, quantity, unit, expected price and grade; distance and delivery capacity are not verified.</p>}</section>; }) : <Empty title="No buyer requests yet" body="Switch to the Buyer demo role, save a requirement, then return here to match crop lots." action="Browse crop lots" onAction={() => setSection("market")} />}</>}

        {section === "storage" && <><div className="page-heading"><div><p className="eyebrow">STORAGE & RISK</p><h1>Harvest and cost checks</h1><p className="heading-subtitle">Uses recorded dates and order values only. No spoilage or price forecast is generated.</p></div><span className="demo-tag">NO FORECAST</span></div><section className="advisor-lot"><div className="section-row"><div><h2>Harvest reminders</h2><p>Lots with harvest dates in the next 14 days.</p></div></div>{upcomingHarvests.length ? upcomingHarvests.map((crop) => <button className="farmer-alert" key={crop.id} onClick={() => setSection("crops")}><Leaf size={17} /><span><strong>{crop.crop} · {crop.harvestDate}</strong><small>{crop.availableQuantity} {crop.unit} listed. Confirm the lot remains fresh and available.</small></span><ArrowRight size={16} /></button>) : <p className="inline-empty">No upcoming harvest dates in the next 14 days.</p>}</section><section className="advisor-lot"><h2>Order cost consistency</h2><p className="heading-subtitle">Buyer pickup transport should be zero; sale value is quantity × agreed unit price.</p>{orders.length ? orders.map((order) => { const expectedGross = order.quantity * order.unitPrice; const grossMatches = Math.abs(expectedGross - order.financials.saleValue) < 0.01; const pickupCorrect = order.deliveryMethod !== "buyer_pickup" || order.financials.transportCost === 0; return <p className="inline-empty" key={order.id}>{order.cropName} · {order.id.slice(0, 14)} · {grossMatches && pickupCorrect ? "No arithmetic issue found" : "Review saved order terms"}</p>; }) : <p className="inline-empty">No order records to check.</p>}</section><section className="notice notice-demo"><Bell size={18} />Storage duration, spoilage risk, and surplus demand need reliable crop rules or a configured data provider.</section></>}

        <footer className="page-footer"><span>{databaseMode ? "Authenticated Supabase workspace" : "Demo workspace · data stored locally in this browser"}</span><span><Users size={14} />{databaseMode ? "Database policies control access; payments remain unverified" : "Demo profiles are not verified identities"}</span></footer>
      </div>
    </section>
    <nav className="mobile-nav" aria-label="Mobile navigation">{nav.filter(([id]) => !["profile", "more"].includes(id)).map(([id, label, Icon]) => <button key={id} className={section === id ? "active" : ""} aria-label={id === "notifications" && unreadNotificationCount ? `${label}, ${unreadNotificationCount} unread` : label} onClick={() => setSection(id)}><Icon size={19} /><span>{label}</span></button>)}<button className={section === "more" ? "active" : ""} onClick={() => setSection("more")}><CircleEllipsis size={19} /><span>More</span></button></nav>
  </main>;
}

function Metric({ Icon, tone = "green", label, value, note, onClick }) {
  const Tag = onClick ? "button" : "article";
  return <Tag className={`metric-card${onClick ? " metric-card-action" : ""}`} onClick={onClick} type={onClick ? "button" : undefined}>{Icon && <span className={`metric-icon ${tone}`}><Icon size={19} /></span>}<span className="metric-label">{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</Tag>;
}

function ToolCard({ title, body, action, icon, onClick }) {
  return <article className="farmer-tool-card"><span className="tool-card-icon">{icon}</span><h2>{title}</h2><p>{body}</p><button className="text-button" onClick={onClick}>{action}<ArrowRight size={15} /></button></article>;
}

function MoreLink({ icon, title, detail, onClick }) {
  return <button className="more-link" onClick={onClick}>{icon}<span><strong>{title}</strong><small>{detail}</small></span><ArrowRight size={16} /></button>;
}

function CropTable({ crops }) {
  return <div className="table-wrap"><table><thead><tr><th>Crop lot</th><th>Location</th><th>Harvest</th><th>Available</th><th>Status</th></tr></thead><tbody>{crops.map((crop) => <tr key={crop.id}><td><strong>{crop.crop}</strong><small>{crop.variety || crop.quality}</small></td><td>{crop.location}</td><td>{crop.harvestDate}</td><td>{crop.availableQuantity} {crop.unit}</td><td><span className="status-pill available">{crop.status}</span></td></tr>)}</tbody></table></div>;
}

function CropCard({ crop, role, draft, onField, onSubmit, busy = false }) {
  return <article className="buyer-crop-card"><div className="buyer-crop-top"><span className="crop-glyph"><Leaf size={19} /></span><span className="status-pill available">Available</span></div><h3>{crop.crop}</h3><p>{crop.variety || "Variety not specified"} · {crop.location}</p><div className="buyer-crop-details"><span><strong>{crop.availableQuantity} {crop.unit}</strong> available</span><span><strong>{crop.quality}</strong> farmer-entered</span><span><strong>{crop.harvestDate}</strong> harvest</span>{crop.expectedPricePerUnit > 0 && <span><strong>{money(crop.expectedPricePerUnit)}/{crop.unit}</strong> farmer estimate</span>}</div>{role === "buyer" ? <form className="buyer-offer-form" onSubmit={(event) => onSubmit(event, crop)}><label>Offer price / {crop.unit}<input type="number" min="0.01" step="any" required value={draft.price || ""} onChange={(event) => onField(crop.id, "price", event.target.value)} placeholder={crop.expectedPricePerUnit ? String(crop.expectedPricePerUnit) : "Enter price"} /></label><label>Quantity<input type="number" min="0.1" max={crop.availableQuantity} step="any" value={draft.quantity ?? crop.availableQuantity} onChange={(event) => onField(crop.id, "quantity", event.target.value)} /></label><label>Delivery<select value={draft.deliveryMethod || "buyer_pickup"} onChange={(event) => onField(crop.id, "deliveryMethod", event.target.value)}><option value="buyer_pickup">Buyer pickup (no separate transport charge)</option><option value="farmer_delivery">Farmer delivers</option><option value="third_party">Third-party transport</option></select></label>{draft.deliveryMethod && draft.deliveryMethod !== "buyer_pickup" && <div className="transport-fields">{draft.deliveryMethod === "third_party" && <label>Transport provider *<input required value={draft.transportProvider || ""} onChange={(event) => onField(crop.id, "transportProvider", event.target.value)} placeholder="Provider name" /></label>}<label>Agreed transport cost<input type="number" min="0" value={draft.transportCost || ""} onChange={(event) => onField(crop.id, "transportCost", event.target.value)} /></label><label>Agreed payer<select value={draft.transportPayer || "buyer"} onChange={(event) => onField(crop.id, "transportPayer", event.target.value)}><option value="buyer">Buyer</option><option value="farmer">Farmer</option><option value="third_party">Third-party provider</option></select></label><small>Transport terms must be agreed by both parties before order confirmation.</small></div>}<label>Other agreed farmer-paid charges<input type="number" min="0" value={draft.otherFarmerCharges || ""} onChange={(event) => onField(crop.id, "otherFarmerCharges", event.target.value)} /></label><p className="form-disclaimer">Offer currency: INR. The database recalculates totals when accepted.</p><button className="button button-primary button-small" type="submit" disabled={busy}>{busy ? "Saving offer…" : "Send offer"} <ArrowRight size={14} /></button></form> : <p className="buyer-card-note">Listing details entered by farmer. Buyer accounts can submit an offer.</p>}</article>;
}

function Empty({ title, body, action, onAction }) {
  return <div className="empty-state"><span className="empty-icon"><Package size={21} /></span><h3>{title}</h3><p>{body}</p>{action && <button className="button button-primary" onClick={onAction}>{action}<ArrowRight size={15} /></button>}</div>;
}

export default FarmerDashboard;