const UNITS = new Set(["kg", "quintal", "tonne"]);

function fail(error, action) {
  if (error) throw new Error(`${action}: ${error.message}`);
}

export async function fetchFpoWorkspace(client, user) {
  const [fpoResult, membershipResult, campaignResult, allocationResult] = await Promise.all([
    client.rpc("list_fpo_directory"),
    client.from("fpo_memberships").select("id,fpo_id,farmer_id,status,consent_at,created_at"),
    client.from("fpo_campaigns").select("id,fpo_id,name,crop_type,unit,target_quantity,status,created_by,created_at"),
    client.from("fpo_allocations").select("id,fpo_id,campaign_id,farmer_id,listing_id,order_id,quantity,committed_quantity,sold_quantity,status,consent_at,created_at"),
  ]);
  fail(fpoResult.error, "Could not load FPO directory");
  fail(membershipResult.error, "Could not load FPO memberships");
  fail(campaignResult.error, "Could not load FPO campaigns");
  fail(allocationResult.error, "Could not load FPO allocations");

  const [salesResult, contributorResult, settlementResult, eventResult] = await Promise.all([
    client.from("fpo_group_sales")
      .select("id,fpo_id,campaign_id,buyer_requirement_id,buyer_id,crop_type,quantity,unit,unit_price,gross_value,delivery_method,transport_provider,transport_cost,transport_payer,other_farmer_deductions,buyer_total,status,buyer_accepted_at,confirmed_at,delivered_at,created_at,updated_at")
      .order("created_at", { ascending: false }),
    client.from("fpo_group_sale_contributors")
      .select("id,sale_id,fpo_id,allocation_id,listing_id,farmer_id,quantity,gross_amount,transport_deduction,other_deduction,net_proceeds,consent_at,created_at"),
    client.from("fpo_settlements")
      .select("id,sale_id,contributor_id,fpo_id,farmer_id,quantity,gross_amount,transport_deduction,other_deduction,net_amount,status,verified_at,created_at")
      .order("created_at", { ascending: false }),
    client.from("fpo_group_sale_events")
      .select("id,sale_id,event_type,created_at")
      .order("created_at", { ascending: true }),
  ]);
  fail(salesResult.error, "Could not load FPO group sales");
  fail(contributorResult.error, "Could not load FPO sale contributors");
  fail(settlementResult.error, "Could not load farmer settlements");
  fail(eventResult.error, "Could not load FPO group-sale history");

  const fpos = fpoResult.data || [];
  const fpoNames = new Map(fpos.map((fpo) => [fpo.id, fpo.name]));
  const memberships = (membershipResult.data || []).map((row) => ({
    ...row,
    fpoName: fpoNames.get(row.fpo_id) || "FPO",
  }));
  const campaigns = (campaignResult.data || []).map((row) => ({
    ...row,
    fpoName: fpoNames.get(row.fpo_id) || "FPO",
    allocatedQuantity: (allocationResult.data || [])
      .filter((allocation) => allocation.campaign_id === row.id && ["allocated", "committed", "sold"].includes(allocation.status))
      .reduce((sum, allocation) => sum + Number(allocation.quantity), 0),
  }));
  const allocations = (allocationResult.data || []).map((row) => ({
    ...row,
    fpoName: fpoNames.get(row.fpo_id) || "FPO",
  }));
  const contributors = contributorResult.data || [];
  const groupSales = (salesResult.data || []).map((row) => ({
    ...row,
    contributors: contributors.filter((contributor) => contributor.sale_id === row.id),
    events: (eventResult.data || []).filter((event) => event.sale_id === row.id),
    fpoName: fpoNames.get(row.fpo_id) || "FPO",
  }));
  return {
    fpos, memberships, campaigns, allocations, groupSales,
    settlements: settlementResult.data || [], userId: user?.id,
  };
}

export async function requestFpoMembership(client, fpoId, consentGiven) {
  if (!fpoId || consentGiven !== true) throw new Error("Select an FPO and confirm membership consent.");
  const { data, error } = await client.rpc("request_fpo_membership", {
    target_fpo_id: fpoId,
    consent_given: true,
  });
  fail(error, "Could not request FPO membership");
  if (!data) throw new Error("The database did not confirm the membership request.");
  return data;
}

export async function reviewFpoMembership(client, membershipId, status) {
  if (!membershipId || !["active", "suspended"].includes(status)) throw new Error("Choose a valid membership action.");
  const { error } = await client.rpc("review_fpo_membership", {
    target_membership_id: membershipId,
    requested_status: status,
  });
  fail(error, "Could not update membership");
}

export async function leaveFpo(client, membershipId) {
  if (!membershipId) throw new Error("Choose a membership.");
  const { error } = await client.rpc("leave_fpo", { target_membership_id: membershipId });
  fail(error, "Could not leave FPO");
}

export function validateFpoCampaign(campaign) {
  if (!campaign || !String(campaign.name || "").trim() || String(campaign.name).trim().length > 200) return "Enter a campaign name up to 200 characters.";
  if (!String(campaign.crop || "").trim() || String(campaign.crop).trim().length > 120) return "Enter a crop name up to 120 characters.";
  if (!UNITS.has(campaign.unit)) return "Choose kg, quintal, or tonne.";
  if (campaign.targetQuantity !== "" && campaign.targetQuantity != null
    && (!Number.isFinite(Number(campaign.targetQuantity)) || Number(campaign.targetQuantity) <= 0)) return "Target quantity must be greater than zero.";
  return "";
}

export async function createFpoCampaign(client, campaign) {
  const validationError = validateFpoCampaign(campaign);
  if (validationError) throw new Error(validationError);
  const { data, error } = await client.rpc("create_fpo_campaign", {
    target_fpo_id: campaign.fpoId,
    requested_name: String(campaign.name).trim(),
    requested_crop: String(campaign.crop).trim(),
    requested_unit: campaign.unit,
    requested_target_quantity: campaign.targetQuantity === "" || campaign.targetQuantity == null ? null : Number(campaign.targetQuantity),
  });
  fail(error, "Could not create FPO campaign");
  if (!data) throw new Error("The database did not confirm the campaign.");
  return data;
}

export async function consentFpoCropAllocation(client, allocation) {
  if (!allocation?.campaignId || !allocation?.listingId || !Number.isFinite(Number(allocation.quantity)) || Number(allocation.quantity) <= 0 || allocation.consentGiven !== true) {
    throw new Error("Choose a campaign, crop listing, available quantity, and confirm consent.");
  }
  const { data, error } = await client.rpc("consent_fpo_crop_allocation", {
    target_campaign_id: allocation.campaignId,
    target_listing_id: allocation.listingId,
    requested_quantity: Number(allocation.quantity),
    consent_given: true,
  });
  fail(error, "Could not reserve crop quantity for this campaign");
  if (!data) throw new Error("The database did not confirm the allocation.");
  return data;
}

export async function withdrawFpoCropAllocation(client, allocationId) {
  if (!allocationId) throw new Error("Choose an allocation.");
  const { error } = await client.rpc("withdraw_fpo_crop_allocation", {
    target_allocation_id: allocationId,
  });
  fail(error, "Could not withdraw crop allocation");
}

export function validateFpoGroupSale(sale) {
  if (!sale?.campaignId || !sale?.requirementId) return "Choose a campaign and open buyer requirement.";
  if (!Array.isArray(sale.contributions) || sale.contributions.length === 0) return "Enter a quantity for at least one farmer allocation.";
  if (!Number.isFinite(Number(sale.unitPrice)) || Number(sale.unitPrice) <= 0
    || !/^\d+(?:\.\d{1,2})?$/.test(String(sale.unitPrice))) return "Unit price must be positive with at most two decimal places.";
  if (!["buyer_pickup", "farmer_delivery", "third_party"].includes(sale.deliveryMethod)) return "Choose a supported delivery method.";
  for (const field of ["transportCost", "otherDeductions"]) {
    if (!/^\d+(?:\.\d{1,2})?$/.test(String(sale[field] ?? ""))
      || !Number.isFinite(Number(sale[field])) || Number(sale[field]) < 0) {
      return "Transport and other deductions must be non-negative with at most two decimal places.";
    }
  }
  if (!["buyer", "farmer", "third_party", "none"].includes(sale.transportPayer)) return "Choose who pays for transport.";
  const provider = String(sale.transportProvider || "").trim();
  if (provider.length > 200) return "Transport provider must be 200 characters or fewer.";
  if (sale.deliveryMethod === "buyer_pickup"
    && (Number(sale.transportCost) !== 0 || sale.transportPayer !== "none" || provider)) {
    return "Buyer pickup has no separate transport provider or charge.";
  }
  if (sale.deliveryMethod === "third_party" && (!provider || sale.transportPayer === "none")) {
    return "Third-party transport requires a named provider and payer.";
  }
  if (Number(sale.transportCost) > 0 && sale.transportPayer === "none") return "Choose who pays for transport.";
  if (!sale.requestId) return "A request ID is required to safely retry this sale proposal.";
  for (const contribution of sale.contributions) {
    if (!contribution.allocationId || !Number.isFinite(Number(contribution.quantity))
      || Number(contribution.quantity) <= 0 || !/^\d+(?:\.\d{1,3})?$/.test(String(contribution.quantity))) {
      return "Each farmer allocation needs a positive quantity with at most three decimal places.";
    }
  }
  return "";
}

export async function createFpoGroupSale(client, sale) {
  const validationError = validateFpoGroupSale(sale);
  if (validationError) throw new Error(validationError);
  const { data, error } = await client.rpc("create_fpo_group_sale", {
    target_campaign_id: sale.campaignId,
    target_requirement_id: sale.requirementId,
    requested_contributions: sale.contributions.map(({ allocationId, quantity }) => ({
      allocation_id: allocationId,
      quantity: Number(quantity),
    })),
    requested_unit_price: Number(sale.unitPrice),
    requested_delivery_method: sale.deliveryMethod,
    requested_transport_provider: String(sale.transportProvider || "").trim() || null,
    requested_transport_cost: Number(sale.transportCost),
    requested_transport_payer: sale.transportPayer,
    requested_other_deductions: Number(sale.otherDeductions),
    request_id: sale.requestId,
  });
  fail(error, "Could not propose FPO group sale");
  if (!data) throw new Error("The database did not confirm the group-sale proposal.");
  return data;
}

export async function respondFpoGroupSale(client, saleId, consentGiven) {
  if (!saleId || typeof consentGiven !== "boolean") throw new Error("Choose whether to consent to the group-sale terms.");
  const { data, error } = await client.rpc("respond_fpo_group_sale", {
    target_sale_id: saleId,
    consent_given: consentGiven,
  });
  fail(error, "Could not record farmer group-sale consent");
  if (!data) throw new Error("The database did not confirm farmer consent.");
  return data;
}

export async function respondToFpoGroupSale(client, saleId, acceptTerms) {
  if (!saleId || typeof acceptTerms !== "boolean") throw new Error("Choose whether to accept the group-sale terms.");
  const { data, error } = await client.rpc("respond_to_fpo_group_sale", {
    target_sale_id: saleId,
    accept_terms: acceptTerms,
  });
  fail(error, "Could not record buyer group-sale decision");
  if (!data) throw new Error("The database did not confirm the buyer response.");
  return data;
}

export async function cancelFpoGroupSale(client, saleId) {
  if (!saleId) throw new Error("Choose a group-sale proposal.");
  const { error } = await client.rpc("cancel_fpo_group_sale", { target_sale_id: saleId });
  fail(error, "Could not cancel group-sale proposal");
}

export async function transitionFpoGroupSale(client, saleId, action) {
  if (!saleId || action !== "delivered") throw new Error("Choose a valid group-sale action.");
  const { data, error } = await client.rpc("transition_fpo_group_sale", {
    target_sale_id: saleId,
    requested_action: action,
  });
  fail(error, "Could not update group-sale status");
  if (data !== "delivered") throw new Error("The database did not confirm group-sale delivery.");
  return data;
}
