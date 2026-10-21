import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = new URL("../../supabase/migrations/202610200001_secure_marketplace.sql", import.meta.url);
const assertionsPath = new URL("../../supabase/migrations/202610200002_security_assertions.sql", import.meta.url);
const integrityMigrationPath = new URL("../../supabase/migrations/202610200003_offer_order_integrity.sql", import.meta.url);
const phaseFiveMigrationPath = new URL("../../supabase/migrations/202610200004_procurement_fpo_health.sql", import.meta.url);
const phaseSixMigrationPath = new URL("../../supabase/migrations/202610200005_transport_notifications.sql", import.meta.url);
const phaseSevenMigrationPath = new URL("../../supabase/migrations/202610200006_fpo_group_sales.sql", import.meta.url);
const migration = await readFile(migrationPath, "utf8");
const assertions = await readFile(assertionsPath, "utf8");
const integrityMigration = await readFile(integrityMigrationPath, "utf8");
const phaseFiveMigration = await readFile(phaseFiveMigrationPath, "utf8");
const phaseSixMigration = await readFile(phaseSixMigrationPath, "utf8");
const phaseSevenMigration = await readFile(phaseSevenMigrationPath, "utf8");

test("migration defines every requested marketplace entity with RLS enabled", () => {
  const tables = [
    "profiles", "farmer_profiles", "buyer_profiles", "fpo_profiles",
    "crop_listings", "quality_assessments", "market_prices",
    "buyer_requirements", "offers", "orders", "order_events",
    "payments", "transport_requests", "fpo_memberships",
    "fpo_allocations", "notifications", "audit_logs",
  ];

  for (const table of tables) {
    assert.match(migration, new RegExp(`create table public\\.${table}\\s*\\(`, "i"), `${table} table exists`);
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, "i"), `${table} has RLS`);
  }
});

test("offer acceptance is a locked transaction with one-order uniqueness and no direct order writes", () => {
  assert.match(migration, /offer_id uuid not null unique references public\.offers/i);
  assert.match(migration, /from public\.offers where id = target_offer_id for update/i);
  assert.match(migration, /from public\.crop_listings where id = accepted_offer\.listing_id for update/i);
  assert.match(migration, /grant execute on function public\.accept_offer\(uuid\) to authenticated/i);
  assert.match(migration, /revoke all on public\.profiles[\s\S]*?from anon, authenticated/i);
  assert.match(migration, /grant select on public\.orders, public\.order_events, public\.payments/i);
  assert.match(assertions, /RLS must be enabled/i);
  assert.match(assertions, /Offer acceptance RPC must be executable by authenticated users only/i);
  assert.match(assertions, /Quality evidence bucket must remain private/i);
});

test("role escalation, verified-payment status and private photo access are guarded", () => {
  assert.match(migration, /Only an authorized administrator can change account roles/i);
  assert.match(migration, /Only an authorized administrator can change buyer verification/i);
  assert.match(migration, /auth\.uid\(\) is not null and new\.role is distinct from old\.role/i);
  assert.match(migration, /buyer_profiles_owner_insert[\s\S]*?verification_status = 'unverified'/i);
  assert.match(migration, /status <> 'confirmed' or verified_at is not null/i);
  assert.match(migration, /values \('quality-evidence', 'quality-evidence', false/i);
  assert.match(migration, /quality_images_owner_read/i);
  assert.match(migration, /quality_images_owner_insert/i);
});

test("phase 4 adds authenticated-only offer, order, and quality RPC workflows", () => {
  assert.match(integrityMigration, /create or replace function public\.create_offer\(/i);
  assert.match(integrityMigration, /for update/i);
  assert.match(integrityMigration, /offers_buyer_request_id_unique/i);
  assert.match(integrityMigration, /create or replace function public\.accept_offer\(target_offer_id uuid\)/i);
  assert.match(integrityMigration, /set status = 'expired'[\s\S]*?return null/i);
  assert.match(integrityMigration, /create or replace function public\.transition_order\(target_order_id uuid, requested_action text\)/i);
  assert.match(integrityMigration, /next_status = 'cancelled'[\s\S]*?set quantity = quantity/i);
  assert.match(integrityMigration, /create or replace function public\.submit_quality_assessment\(/i);
  assert.match(integrityMigration, /target_accuracy_m > 100/i);
  assert.match(integrityMigration, /revoke insert on public\.quality_assessments from authenticated/i);
  assert.match(integrityMigration, /revoke all on public\.offers from authenticated[\s\S]*?grant select on public\.offers to authenticated/i);
  assert.match(integrityMigration, /grant execute on function public\.transition_order\(uuid, text\) to authenticated/i);
  assert.match(integrityMigration, /has_table_privilege\('authenticated', 'public\.orders', 'UPDATE'\)/i);
  assert.match(integrityMigration, /has_function_privilege\('anon',[\s\S]*?Anonymous users must not execute/i);
  assert.match(integrityMigration, /Quality evidence bucket must remain private/i);
});

test("phase 5 adds RLS-protected procurement, health notes and FPO campaign workflows", () => {
  assert.match(phaseFiveMigration, /create table public\.crop_health_notes/i);
  assert.match(phaseFiveMigration, /create table public\.fpo_campaigns/i);
  assert.match(phaseFiveMigration, /alter table public\.crop_health_notes enable row level security/i);
  assert.match(phaseFiveMigration, /alter table public\.fpo_campaigns enable row level security/i);
  assert.match(phaseFiveMigration, /crop_health_notes_owner_read[\s\S]*?farmer_id = \(select auth\.uid\(\)\)/i);
  assert.match(phaseFiveMigration, /fpo_campaigns_member_read[\s\S]*?status = 'active'/i);
  assert.match(phaseFiveMigration, /revoke insert, update, delete on public\.buyer_requirements from authenticated/i);
  assert.match(phaseFiveMigration, /revoke insert, update, delete on public\.crop_health_notes from authenticated/i);
  assert.match(phaseFiveMigration, /revoke insert, update, delete on public\.fpo_campaigns, public\.fpo_allocations from authenticated/i);
  assert.match(phaseFiveMigration, /create or replace function public\.save_buyer_requirement\(/i);
  assert.match(phaseFiveMigration, /create or replace function public\.save_crop_health_note\(/i);
  assert.match(phaseFiveMigration, /create or replace function public\.request_fpo_membership\(/i);
  assert.match(phaseFiveMigration, /create or replace function public\.consent_fpo_crop_allocation\(/i);
  assert.match(phaseFiveMigration, /consent_given is distinct from true/i);
  assert.match(phaseFiveMigration, /from public\.crop_listings where id = target_listing_id for update/i);
  assert.match(phaseFiveMigration, /Allocation quantity exceeds available stock/i);
  assert.match(phaseFiveMigration, /new\.quantity < committed/i);
  assert.match(phaseFiveMigration, /Market and marketplace data writes must use trusted service operations/);
  assert.match(phaseFiveMigration, /revoke insert, update, delete on public\.fpo_memberships from authenticated/i);
  assert.match(phaseFiveMigration, /list_fpo_directory[\s\S]*?f\.authorized_admin_id = \(select auth\.uid\(\)\) as can_manage/i);
  assert.match(phaseFiveMigration, /grant select \(id, name\) on public\.fpo_profiles to authenticated/i);
  assert.match(phaseFiveMigration, /Active farmer account required/i);
  assert.match(phaseFiveMigration, /Active buyer account required/i);
  assert.match(phaseFiveMigration, /Active FPO administrator account required/i);
});

test("phase 6 protects transport, notification and payment writes behind trusted database operations", () => {
  assert.match(phaseSixMigration, /create table public\.transport_events/i);
  assert.match(phaseSixMigration, /alter table public\.transport_events enable row level security/i);
  assert.match(phaseSixMigration, /transport_events_order_party_read[\s\S]*?o\.buyer_id = \(select auth\.uid\(\)\)[\s\S]*?o\.farmer_id = \(select auth\.uid\(\)\)/i);
  assert.match(phaseSixMigration, /create or replace function public\.request_order_transport\(/i);
  assert.match(phaseSixMigration, /create or replace function public\.transition_order_transport\(/i);
  assert.match(phaseSixMigration, /create or replace function public\.mark_notification_read\(/i);
  assert.match(phaseSixMigration, /client_request_id uuid/i);
  assert.match(phaseSixMigration, /transport_requests_one_active_per_order/i);
  assert.match(phaseSixMigration, /requested_cost <> target\.transport_cost/i);
  assert.match(phaseSixMigration, /order-event:[\s\S]*?new\.actor_id/i);
  assert.match(phaseSixMigration, /from public\.transport_requests tr\s+join public\.orders o on o\.id = tr\.order_id/i);
  assert.match(phaseSixMigration, /cancel_unstarted_order_transport_trigger/i);
  assert.match(phaseSixMigration, /revoke insert, update, delete on public\.notifications, public\.payments from authenticated/i);
  assert.match(phaseSixMigration, /payments_provider_reference_unique/i);
  assert.match(phaseSixMigration, /has_table_privilege\('authenticated', 'public\.payments', 'UPDATE'\)/i);
  assert.match(phaseSixMigration, /grant execute on function public\.mark_notification_read\(uuid\) to authenticated/i);
});

test("phase 7 creates RLS-scoped FPO group sales, event history, and pending farmer settlements", () => {
  for (const table of ["fpo_group_sales", "fpo_group_sale_contributors", "fpo_settlements", "fpo_group_sale_events"]) {
    assert.match(phaseSevenMigration, new RegExp(`create table public\\.${table}`, "i"));
    assert.match(phaseSevenMigration, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }
  assert.match(phaseSevenMigration, /fpo_group_sales_party_read[\s\S]*?buyer_id = \(select auth\.uid\(\)\)[\s\S]*?is_fpo_admin[\s\S]*?farmer_id = \(select auth\.uid\(\)\)/i);
  assert.match(phaseSevenMigration, /fpo_settlements_authorized_read[\s\S]*?farmer_id = \(select auth\.uid\(\)\)[\s\S]*?is_fpo_admin/i);
  assert.match(phaseSevenMigration, /fpo_group_sale_events_party_read[\s\S]*?from public\.fpo_group_sales s[\s\S]*?where s\.id = fpo_group_sale_events\.sale_id/i);
  assert.match(phaseSevenMigration, /revoke all on public\.fpo_group_sales, public\.fpo_group_sale_contributors, public\.fpo_settlements, public\.fpo_group_sale_events from anon, authenticated/i);
  assert.match(phaseSevenMigration, /check \(status = 'pending'\)/i);
  assert.match(phaseSevenMigration, /check \(verified_at is null and provider_reference is null\)/i);
  assert.match(phaseSevenMigration, /currency text not null default 'INR' check \(currency = 'INR'\)/i);
});

test("phase 7 serializes proposal idempotency and commits inventory only after buyer and farmer consent", () => {
  assert.match(phaseSevenMigration, /pg_advisory_xact_lock\(hashtextextended\(campaign\.fpo_id::text \|\| ':' \|\| request_id::text, 0\)\)/i);
  assert.match(phaseSevenMigration, /Request ID was already used for different group-sale terms/i);
  assert.match(phaseSevenMigration, /from public\.fpo_allocations[\s\S]*?where id = item_allocation_id for update/i);
  assert.match(phaseSevenMigration, /perform public\.finalize_fpo_group_sale\(sale\.id\)/i);
  assert.match(phaseSevenMigration, /if exists \([\s\S]*?c\.consent_at is null[\s\S]*?\) or not exists/i);
  assert.match(phaseSevenMigration, /committed_quantity = committed_quantity \+ contributor\.quantity[\s\S]*?sold_quantity = sold_quantity \+ contributor\.quantity/i);
  assert.match(phaseSevenMigration, /order by c\.allocation_id, c\.farmer_id/i);
  assert.match(phaseSevenMigration, /insert into public\.fpo_settlements/i);
  assert.match(phaseSevenMigration, /insert into public\.fpo_group_sale_events[\s\S]*?'proposed'/i);
  assert.match(phaseSevenMigration, /insert into public\.fpo_group_sale_events[\s\S]*?'confirmed'/i);
  assert.match(phaseSevenMigration, /requirement public\.buyer_requirements%rowtype/i);
  assert.match(phaseSevenMigration, /select \* into requirement from public\.buyer_requirements r[\s\S]*?for update/i);
});

test("phase 7 keeps direct settlement writes blocked and exposes only approved RPCs", () => {
  assert.match(phaseSevenMigration, /revoke all on function public\.finalize_fpo_group_sale\(uuid\) from public, anon, authenticated/i);
  assert.match(phaseSevenMigration, /grant execute on function public\.create_fpo_group_sale[\s\S]*?to authenticated/i);
  assert.match(phaseSevenMigration, /grant execute on function public\.respond_fpo_group_sale\(uuid,boolean\) to authenticated/i);
  assert.match(phaseSevenMigration, /grant execute on function public\.respond_to_fpo_group_sale\(uuid,boolean\) to authenticated/i);
  assert.match(phaseSevenMigration, /grant execute on function public\.cancel_fpo_group_sale\(uuid\) to authenticated/i);
  assert.match(phaseSevenMigration, /grant execute on function public\.transition_fpo_group_sale\(uuid,text\) to authenticated/i);
  assert.match(phaseSevenMigration, /FPO sale and settlement writes must use trusted database functions/i);
});
