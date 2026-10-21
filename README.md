# AI Farming Selling Intelligence

Farmer-first crop selling workspace with a clearly separated local demo and optional Supabase Auth/database mode.

## Run locally

Requirements: Node.js and npm.

```powershell
cd ai-farming-intelligence
npm install
npm run dev
```

Without Supabase environment variables, the sign-in screen remains a frontend demo. Use the displayed prototype OTP `123456`; no SMS is sent. Demo role switching exercises shared local prototype data in this browser's `localStorage`.

When Supabase is configured, the app uses Supabase email/password registration and login, restores sessions after refresh, reads the authoritative role from `public.profiles`, and performs farmer crop-listing CRUD against `public.crop_listings`. The app does not read, import, or write the local demo dataset in this mode. A database/auth failure is shown as an error; there is no silent localStorage fallback.

## Feature status

- **Local prototype:** Crop listings, marketplace search, buyer offers/counters, local offer acceptance and quantity checks, order summaries, simulated order/payment states, quality camera/GPS workflow, and local browser persistence.
- **Demo only:** OTP (`123456`), role switching, browser `localStorage`, simulated delivery/payment, FPO overview, and seeded buyers. These do not provide identity verification or authorization.
- **Supabase integration:** Authentication, profile lookup/update, crop-listing CRUD, offers/orders, transport, notifications, read-only payment records, private quality evidence, buyer requirements, consent-based FPO campaigns/allocations, pending FPO group-sale settlements, crop-health notes, and sourced market reads are wired in configured mode. Authorization is intended to be enforced by RLS and RPCs. Auth roles come from protected profile rows; self-registration cannot choose a role.
- **Database migrations included, not applied here:** Review and apply migrations `202610200001_secure_marketplace.sql` through `202610200006_fpo_group_sales.sql` in ascending filename order. Migration 006 adds buyer-and-contributor-consented group-sale proposals, database-calculated pending farmer settlement records, and transactional inventory commitment after all approvals. No Supabase project is configured in this workspace, so no live DB verification has occurred.
- **Not production-ready:** Real PostgreSQL transaction behavior, RLS, Storage policies, image upload, signed URL access, concurrency, transport transitions, notifications, and cross-session persistence have not been tested. No payment provider is configured; payment reads remain read-only and no funds or refunds are processed. FPO settlement calculations are recorded as pending, but payment/settlement execution, refunds, external notifications, carrier verification/live tracking, AI diagnosis/quality grading, and complete administrative operations are not implemented. Crop-listing photos are unavailable in authenticated mode because the schema has no listing-photo field/bucket.

Do not use demo mode with real payment, identity, or private farm data. Browser `localStorage` is not secure multi-user storage. Supabase mode requires both valid frontend variables and the database migrations applied to the matching project.

## Supabase database setup (Stage A)

1. Create or select a Supabase project, and review the SQL migrations before applying them.
2. From this project directory, link the Supabase CLI to a dedicated test project first and apply all six migration files in order:

   ```powershell
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

   Alternatively, run each migration in `supabase/migrations/` in ascending filename order in the Supabase SQL Editor. The migrations require Supabase Auth and Storage schemas.
3. Review migrations 001–006 and confirm each completes, including `202610200002_security_assertions.sql`. Migration 004 depends on 001–003; 005 depends on 004; 006 depends on the existing FPO, buyer-requirement, crop-listing, and notification schema. These are forward-only schema changes and do not import or delete local demo browser data. Migration 005/006 unique indexes intentionally fail instead of silently rewriting conflicting existing data.
4. In Supabase Authentication → Providers, enable Email and decide whether to require confirmation. In Authentication → URL Configuration, set the local and production site URLs and exact password-reset redirect URLs.
5. Copy `.env.example` to `.env.local`; set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the project's API settings. If using an older supported project, use `VITE_SUPABASE_ANON_KEY` instead. Restart Vite after changes.
6. Configure the same frontend environment variables in the deployment provider (for example, Vercel's project environment settings), then redeploy. Never put a service-role key, database password, payment secret, or other privileged secret in source code or a `VITE_*` variable.
7. Create the first administrator only after the intended account has registered and its profile exists. From SQL Editor, use the trusted project-owner connection to set that exact account's role:

   ```sql
   update public.profiles set role = 'admin' where id = 'AUTH_USER_UUID';
   ```

   Confirm the UUID against the intended Auth user before running this statement. Buyer and FPO roles also require trusted administrator assignment; browser signup cannot set protected roles.

8. Verify the `quality-evidence` bucket exists and is private, with the expected policies and JPEG/PNG/WebP limits. The integration uploads fresh JPEG captures under `<auth-user-uuid>/<random-uuid>.jpg`; object reads are restricted by Storage RLS. Assessment metadata uses `submit_quality_assessment`; failed metadata writes attempt to remove the object. Exact GPS is restricted to the farmer and authorized administrators. Signed URLs are short-lived and still rely on Storage RLS.

9. For authenticated FPO use, create each `fpo_profiles` record through a trusted administrator process and assign its `authorized_admin_id` and protected `fpo` account role. Farmers request membership with explicit consent and separately consent to each crop allocation. An authorized FPO admin may propose one group sale per buyer requirement; the buyer and every contributing farmer must freshly consent before the database commits quantities. The database apportions gross by contribution quantity, then farmer-paid transport and other farmer deductions pro rata by gross share. Rounding remainder goes to the contributor with the greatest allocation ID. Settlement rows remain pending; this application does not pay farmers or verify payouts.

10. Payment access is read-only. The payment adapter intentionally refuses checkout, verification, and refunds until trusted server-side operations exist. A future provider integration must keep credentials server-side, verify signatures against the raw webhook body, enforce provider-event idempotency/replay protection, compare verified amount and currency to the database order snapshot, and verify refunds before updating records. Never store card data or let browser input mark a payment paid.
11. Live market refresh is optional. Deploy `market-prices` only after migration 004 is applied. Configure `MARKET_DATA_PROVIDER_URL`, `MARKET_DATA_PROVIDER_TOKEN`, and `MARKET_DATA_PROVIDER_NAME` as Edge Function secrets, never as frontend variables. The upstream service must accept authenticated `{ "crop": "...", "location": "..." }` POST requests and return `{ "observations": [...] }` with valid crop, market, location, unit, timestamp, currency and source fields. No upstream source is configured here, so prices are not live.

The current crop listing table does not include crop-listing photo storage. The existing demo crop-photo feature remains demo-only; authenticated mode clearly omits that field rather than claiming an upload was persisted.

## Supabase marketplace and evidence workflow

Service modules:

- `src/data/marketplace.js` validates INR offer terms and calls the existing `create_offer`, `respond_to_offer`, and `accept_offer` RPCs; offer/order/event reads are filtered by database RLS. It also reads farmer-owned assessment metadata.
- `src/data/qualityEvidence.js` validates capture metadata, uploads the JPEG to the private `quality-evidence` bucket, calls `submit_quality_assessment`, removes the object if the database write fails, and exposes short-lived signed URLs for owner-authorized use.
- `src/data/procurement.js` validates buyer requirements, persists through the existing request RPCs, and matches open requests to visible listings. Matches are indicative and do not create offers.
- `src/data/fpo.js` uses RLS-scoped membership/campaign/allocation/group-sale/event/settlement reads and RPCs. Migration 006 calculates and records pending farmer settlement breakdowns only after buyer and all farmer approvals; it does not process payment.
- `src/data/transport.js` reads party-visible transport requests/events and calls the migration 005 request/transition RPCs. Routes and carrier/status details are party-entered records, not verified tracking.
- `src/data/notifications.js` reads the authenticated recipient's persisted notifications and marks them read through an owner-only RPC.
- `src/data/payments.js` reads payment records under RLS only and exposes an intentionally unconfigured server-provider adapter boundary. No provider operation is wired; it cannot create payment intents, modify payment status, or verify settlement.
- `src/data/cropHealth.js` stores consented private notes linked to a farmer-owned crop listing; notes are not shared with buyers and do not diagnose disease.
- `src/data/marketIntelligence.js` reads stored observations, invokes the market Edge Function, labels stale/cached data, and presents rule-based explanations only for existing offers. It never synthesizes a price quote.
- `supabase/functions/market-prices/index.ts` is the server-side provider adapter; provider secrets and service-role access remain outside frontend code.
- `src/App.jsx` loads authenticated crop, offer, order, event, transport, notification, read-only payment, procurement, FPO, market and health-note records on session restore and refresh. Configured-mode writes do not fall back to local storage.

Order status values are the schema's `confirmed`, `awaiting_pickup`, `in_transit`, `delivered`, `cancelled`, and `disputed`; the dashboard does not invent `Preparing` or `Ready` states. A farmer can mark an order ready for pickup, the buyer confirms pickup and delivery, and either party can cancel before transit or report a dispute. Cancellation and inventory reconciliation run in the database transaction. No payment status is marked verified.

Manual testing with a dedicated Supabase test project (not performed in this workspace):

1. Apply migrations in order and verify the `quality-evidence` bucket is private.
2. Register separate farmer and buyer test accounts. Assign the test buyer role through a trusted administrator/project-owner process; signup metadata cannot assign it.
3. As farmer, create an available listing. As buyer, submit an INR offer with unit, quantity and delivery terms. Verify both parties can see only their own offer and that a third account cannot read it.
4. Counter or reject as the party expected to respond. Accept from the opposite party. Verify one order, an order event, correct financial snapshot, and reduced available stock. Repeat/concurrently accept against limited inventory and verify no oversell or duplicate order.
5. Advance status using the authorized farmer/buyer actions. Cancel an eligible order once and confirm stock is restored once; verify direct client writes to orders are denied.
6. As the listing farmer, grant camera and location permissions, explicitly consent, capture a new photo and GPS accuracy at or below 100 m, then submit. Verify the database row contains metadata/path but the bucket is private, an unrelated account cannot list/download the object or read precise coordinates, and failed metadata insert attempts clean up the upload.
7. Refresh and sign in again to verify persisted offers, orders and assessments. Confirm no UI claims payment or image-derived quality grading.
8. As a buyer, create/edit/close a requirement and check that matching crop lots do not create offers until you submit an offer. As a farmer, review only open requests and your own listings.
9. Configure a test FPO profile and administrator in the trusted database. Test consented membership, campaign allocations, concurrent stock reservation, and withdrawal of an unused allocation. Propose a group sale; verify only eligible allocated quantity is selectable, the buyer and each farmer must consent, a declined proposal releases its pending claim, and inventory/settlement rows change atomically only after all approvals. Check proportional gross/deduction calculations, deterministic cent rounding, pending-only settlement status, duplicate request-ID behavior, and farmer/FPO RLS visibility. These require real-database testing and have not been performed here.
10. Only with a configured upstream provider, deploy the Edge Function and test its source/timestamp/unit validation, cached/unavailable states, and persisted observations. Check that recommendations cite open offers and state assumptions; no data-provider test has run in this workspace.
11. After applying migration 005, use an eligible test order to request transport with the accepted route cost/payer, accept it from the other order party, and test each allowed transition and cancellation. Confirm both parties receive persistent notifications, unread counts change after marking a notification read, and unrelated accounts cannot read transport events or notifications. Buyer pickup must have no separate transport charge. Payment rows are read-only in the frontend; there is no payment-provider action to test.

For provider integration planning, implement payment creation, webhook verification, and refunds only in trusted server-side/Edge Function code. Verify webhook signatures on the untouched request body, reject replayed or duplicate event IDs with durable idempotency, reconcile amount/currency against the immutable order snapshot before recording payment, and verify refund status before any refund record changes. Test those behaviors against the provider's test environment before enabling them; this project currently has no provider credentials or payment execution code.

## Verification

```powershell
npm run build
npm run lint
npm test
npm run test:db-migration
```

The build output is `dist/`. `npm test` runs unit and mocked auth/listing/marketplace/quality/procurement/FPO/market/health/transport/notification/payment-read service tests, local demo transaction tests, and static migration checks. `npm run test:db-migration` checks SQL text/privilege assertions only; it does not execute PostgreSQL or prove transaction, RLS, Storage, or concurrency behavior. No real database operation, provider response, FPO flow, transport/notification workflow, or evidence upload has been verified in this workspace. Oxlint may report the existing Fast Refresh warning in `src/i18n/LanguageContext.jsx`.

## Vercel

Import the repository in Vercel and set the project Root Directory to `ai-farming-intelligence`. Select Vite (or configure the equivalent settings): install command `npm install`, build command `npm run build`, output directory `dist`. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel only after applying and verifying migrations on the matching Supabase project. Supabase migrations are managed separately and are not deployed by the frontend build. Do not set the key variables until you intend to switch from the local demo to Supabase mode. Test authentication and listing CRUD on the deployed URL with non-sensitive test accounts before treating the deployment as successful.

To commit and push the project from the repository root:

```powershell
git add ai-farming-intelligence
git commit -m "Build farmer buyer prototype workflows"
git push origin main
```