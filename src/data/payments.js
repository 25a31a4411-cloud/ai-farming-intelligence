function fail(error, action) {
  if (error) throw new Error(`${action}: ${error.message}`);
}

export const PAYMENT_PROVIDER_STATUS = Object.freeze({
  configured: false,
  mode: "read-only",
  message: "No trusted server-side payment provider is configured.",
});

export function createPaymentProviderAdapter(serverOperations = {}) {
  return Object.freeze({
    async createCheckout(input) {
      if (typeof serverOperations.createCheckout !== "function") {
        throw new Error("Payment checkout is unavailable until a trusted server-side provider is configured.");
      }
      return serverOperations.createCheckout(input);
    },
    async verifyWebhook(request) {
      if (typeof serverOperations.verifyWebhook !== "function") {
        throw new Error("Payment verification is unavailable until signed server-side webhooks are configured.");
      }
      return serverOperations.verifyWebhook(request);
    },
    async refund(input) {
      if (typeof serverOperations.refund !== "function") {
        throw new Error("Refunds are unavailable until a trusted server-side provider is configured.");
      }
      return serverOperations.refund(input);
    },
  });
}

export async function fetchPaymentsForOrders(client, orders) {
  const orderIds = orders.map((order) => order.id).filter(Boolean);
  if (!orderIds.length) return new Map();
  const { data, error } = await client
    .from("payments")
    .select("id,order_id,amount,provider,status,verified_at,created_at")
    .in("order_id", orderIds)
    .order("created_at", { ascending: false });
  fail(error, "Could not load payment records");
  const payments = new Map();
  for (const row of data || []) {
    if (payments.has(row.order_id)) continue;
    payments.set(row.order_id, {
      id: row.id,
      amount: Number(row.amount),
      provider: row.provider || "",
      status: row.status,
      verifiedAt: row.verified_at,
      createdAt: row.created_at,
      verified: row.status === "confirmed" && Boolean(row.verified_at),
    });
  }
  return payments;
}
