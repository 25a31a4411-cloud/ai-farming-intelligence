import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const allowedUnits = new Set(["kg", "quintal", "tonne"]);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

function validObservation(row: Record<string, unknown>, provider: string) {
  const numeric = (value: unknown) => value == null || (Number.isFinite(Number(value)) && Number(value) >= 0);
  const observedAt = Date.parse(String(row.observed_at || ""));
  return String(row.crop_type || "").trim().length <= 120
    && Boolean(String(row.crop_type || "").trim())
    && Boolean(String(row.market_name || "").trim())
    && String(row.market_name).length <= 200
    && Boolean(String(row.location || "").trim())
    && String(row.location).length <= 240
    && (!row.variety || String(row.variety).length <= 120)
    && allowedUnits.has(String(row.unit))
    && String(row.currency || "INR") === "INR"
    && String(row.source || provider) === provider
    && numeric(row.min_price) && numeric(row.max_price) && numeric(row.modal_price)
    && (row.min_price == null || row.max_price == null || Number(row.min_price) <= Number(row.max_price))
    && (row.modal_price == null || ((row.min_price == null || Number(row.modal_price) >= Number(row.min_price))
      && (row.max_price == null || Number(row.modal_price) <= Number(row.max_price))))
    && Number.isFinite(observedAt)
    && observedAt <= Date.now() + 5 * 60_000;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "POST required" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return json({ error: "Market function is not configured" }, 503);

  const authorization = request.headers.get("Authorization");
  if (!authorization) return json({ error: "Authentication required" }, 401);
  const authClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: authData, error: authError } = await authClient.auth.getUser();
  if (authError || !authData.user) return json({ error: "Valid authenticated session required" }, 401);

  let input: { crop?: string; location?: string };
  try {
    input = await request.json();
  } catch {
    return json({ error: "Invalid JSON request" }, 400);
  }
  const crop = String(input.crop || "").trim();
  const location = String(input.location || "").trim();
  if (!crop || crop.length > 120 || location.length > 240) return json({ error: "Enter a valid crop and optional location" }, 400);

  const providerUrl = Deno.env.get("MARKET_DATA_PROVIDER_URL");
  const providerToken = Deno.env.get("MARKET_DATA_PROVIDER_TOKEN");
  const providerName = Deno.env.get("MARKET_DATA_PROVIDER_NAME");
  if (!providerUrl || !providerToken || !providerName) {
    return json({ status: "unavailable", observations: [], message: "No verified market data provider is configured." });
  }

  let providerResponse: Response;
  try {
    providerResponse = await fetch(providerUrl, {
      method: "POST",
      headers: { "Authorization": `Bearer ${providerToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ crop, location }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return json({ error: "Market data provider timed out or could not be reached" }, 502);
  }
  if (!providerResponse.ok) return json({ error: `Market data provider returned HTTP ${providerResponse.status}` }, 502);
  let payload: { observations?: Record<string, unknown>[] };
  try {
    payload = await providerResponse.json();
  } catch {
    return json({ error: "Market data provider returned invalid JSON" }, 502);
  }
  if (!Array.isArray(payload.observations) || payload.observations.length > 100) {
    return json({ error: "Market data provider response must contain at most 100 observations" }, 502);
  }
  const observations = await Promise.all(payload.observations.filter((row) => validObservation(row, providerName)).map(async (row) => {
    const observedAt = new Date(String(row.observed_at)).toISOString();
    const observedAge = Date.now() - Date.parse(observedAt);
    const recordIdentity = [
      providerName,
      String(row.crop_type).trim().toLocaleLowerCase(),
      String(row.variety || "").trim().toLocaleLowerCase(),
      String(row.market_name).trim().toLocaleLowerCase(),
      observedAt,
      String(row.unit),
    ].join("|");
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(recordIdentity));
    const providerRecordKey = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    return {
      crop_type: String(row.crop_type).trim(),
      variety: row.variety ? String(row.variety).trim() : null,
      market_name: String(row.market_name).trim(),
      location: String(row.location).trim(),
      min_price: row.min_price == null ? null : Number(row.min_price),
      max_price: row.max_price == null ? null : Number(row.max_price),
      modal_price: row.modal_price == null ? null : Number(row.modal_price),
      currency: "INR",
      unit: String(row.unit),
      source: providerName,
      observed_at: observedAt,
      last_fetched_at: new Date().toISOString(),
      provider_record_key: providerRecordKey,
      freshness_status: observedAge <= 24 * 60 * 60_000 ? "live" : "historical",
    };
  }));
  if (!observations.length) return json({ status: "unavailable", observations: [], message: "Provider returned no valid, verifiable observations." });

  const serviceClient = createClient(url, serviceKey);
  const { error: insertError } = await serviceClient.from("market_prices").upsert(observations, {
    onConflict: "provider_record_key",
    ignoreDuplicates: false,
  });
  if (insertError) return json({ error: `Could not persist provider observations: ${insertError.message}` }, 502);
  return json({ status: "live", observations, message: `Fetched observations from ${providerName}.` });
});
