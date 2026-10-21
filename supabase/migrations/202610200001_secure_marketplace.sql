create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('farmer', 'buyer', 'fpo', 'admin');
create type public.listing_status as enum ('available', 'reserved', 'sold_out', 'archived', 'under_review');
create type public.offer_status as enum ('pending', 'countered', 'accepted', 'rejected', 'expired', 'cancelled');
create type public.order_status as enum ('confirmed', 'awaiting_pickup', 'in_transit', 'delivered', 'cancelled', 'disputed');
create type public.payment_status as enum ('pending', 'confirmed', 'failed', 'refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '' check (char_length(name) <= 160),
  phone text,
  email text,
  role public.app_role not null default 'farmer',
  preferred_language text not null default 'en' check (preferred_language in ('en', 'te', 'hi', 'mr')),
  location text,
  account_status text not null default 'active' check (account_status in ('active', 'suspended', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.farmer_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  farm_name text,
  farm_location text,
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.buyer_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  business_name text,
  business_type text,
  procurement_preferences jsonb not null default '{}'::jsonb,
  verification_status text not null default 'unverified' check (verification_status in ('unverified', 'pending', 'verified', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.fpo_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  registration_reference text,
  authorized_admin_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crop_listings (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.profiles(id),
  crop_type text not null check (char_length(crop_type) between 1 and 120),
  variety text check (variety is null or char_length(variety) <= 120),
  quantity numeric(14, 3) not null check (quantity > 0),
  available_quantity numeric(14, 3) not null check (available_quantity >= 0 and available_quantity <= quantity),
  unit text not null check (unit in ('kg', 'quintal', 'tonne')),
  grade text not null default 'Not assessed' check (char_length(grade) <= 60),
  harvest_date date not null,
  location text not null check (char_length(location) between 1 and 240),
  expected_price numeric(14, 2) check (expected_price is null or expected_price > 0),
  description text check (description is null or char_length(description) <= 2000),
  status public.listing_status not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quality_assessments (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.crop_listings(id) on delete cascade,
  farmer_id uuid not null references public.profiles(id),
  image_path text not null,
  latitude numeric(9, 6) not null check (latitude between -90 and 90),
  longitude numeric(9, 6) not null check (longitude between -180 and 180),
  gps_accuracy_m numeric(9, 2) not null check (gps_accuracy_m >= 0 and gps_accuracy_m <= 100),
  photo_captured_at timestamptz not null,
  gps_captured_at timestamptz not null,
  submitted_at timestamptz not null default now(),
  result jsonb not null default '{}'::jsonb,
  limitations text not null default 'Preliminary evidence only; browser camera and GPS do not prove authenticity or establish internal or laboratory-grade quality.',
  consent_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.market_prices (
  id uuid primary key default gen_random_uuid(),
  crop_type text not null,
  market_name text not null,
  location text not null,
  min_price numeric(14, 2),
  max_price numeric(14, 2),
  unit text not null check (unit in ('kg', 'quintal', 'tonne')),
  source text not null,
  observed_at timestamptz not null,
  freshness_status text not null check (freshness_status in ('live', 'cached', 'historical', 'estimated', 'demo')),
  created_at timestamptz not null default now(),
  check (min_price is null or min_price >= 0),
  check (max_price is null or max_price >= 0),
  check (min_price is null or max_price is null or min_price <= max_price)
);

create table public.buyer_requirements (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id),
  crop_type text not null,
  variety text,
  quantity numeric(14, 3) not null check (quantity > 0),
  unit text not null check (unit in ('kg', 'quintal', 'tonne')),
  quality text,
  location text not null,
  budget_min numeric(14, 2) check (budget_min is null or budget_min >= 0),
  budget_max numeric(14, 2) check (budget_max is null or budget_max > 0),
  required_date date not null,
  status text not null default 'open' check (status in ('open', 'closed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (budget_min is null or budget_max is null or budget_min <= budget_max)
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id),
  farmer_id uuid not null references public.profiles(id),
  listing_id uuid not null references public.crop_listings(id),
  quantity numeric(14, 3) not null check (quantity > 0),
  unit text not null check (unit in ('kg', 'quintal', 'tonne')),
  unit_price numeric(14, 2) not null check (unit_price > 0),
  delivery_method text not null check (delivery_method in ('buyer_pickup', 'farmer_delivery', 'third_party')),
  transport_provider text,
  transport_cost numeric(14, 2) not null default 0 check (transport_cost >= 0),
  transport_payer text not null check (transport_payer in ('buyer', 'farmer', 'third_party', 'none')),
  other_farmer_charges numeric(14, 2) not null default 0 check (other_farmer_charges >= 0),
  counter_history jsonb not null default '[]'::jsonb,
  status public.offer_status not null default 'pending',
  last_responded_by uuid references public.profiles(id),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (delivery_method <> 'buyer_pickup' or transport_cost = 0),
  check (delivery_method <> 'third_party' or (transport_provider is not null and char_length(transport_provider) > 0))
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null unique references public.offers(id),
  listing_id uuid not null references public.crop_listings(id),
  buyer_id uuid not null references public.profiles(id),
  farmer_id uuid not null references public.profiles(id),
  quantity numeric(14, 3) not null check (quantity > 0),
  unit text not null,
  unit_price numeric(14, 2) not null check (unit_price > 0),
  gross_value numeric(16, 2) not null check (gross_value >= 0),
  transport_method text not null,
  transport_provider text,
  transport_cost numeric(14, 2) not null default 0 check (transport_cost >= 0),
  transport_payer text not null check (transport_payer in ('buyer', 'farmer', 'third_party', 'none')),
  other_farmer_deductions numeric(14, 2) not null default 0 check (other_farmer_deductions >= 0),
  farmer_net numeric(16, 2) not null check (farmer_net >= 0),
  buyer_total numeric(16, 2) not null check (buyer_total >= 0),
  status public.order_status not null default 'confirmed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  amount numeric(14, 2) not null check (amount > 0),
  payer_id uuid not null references public.profiles(id),
  recipient_id uuid not null references public.profiles(id),
  provider text,
  provider_reference text,
  status public.payment_status not null default 'pending',
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  check (status <> 'confirmed' or verified_at is not null)
);

create table public.transport_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  provider text,
  route jsonb not null default '{}'::jsonb,
  agreed_cost numeric(14, 2) not null default 0 check (agreed_cost >= 0),
  payer text not null check (payer in ('buyer', 'farmer', 'third_party')),
  status text not null default 'requested' check (status in ('requested', 'accepted', 'pickup', 'in_transit', 'delivered', 'issue', 'cancelled')),
  delivery_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.fpo_memberships (
  id uuid primary key default gen_random_uuid(),
  fpo_id uuid not null references public.fpo_profiles(id) on delete cascade,
  farmer_id uuid not null references public.profiles(id),
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended', 'left')),
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (fpo_id, farmer_id)
);

create table public.fpo_allocations (
  id uuid primary key default gen_random_uuid(),
  fpo_id uuid not null references public.fpo_profiles(id),
  farmer_id uuid not null references public.profiles(id),
  listing_id uuid not null references public.crop_listings(id),
  order_id uuid references public.orders(id),
  quantity numeric(14, 3) not null check (quantity > 0),
  settlement_amount numeric(14, 2) check (settlement_amount is null or settlement_amount >= 0),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null,
  message text not null check (char_length(message) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  target_table text not null,
  target_id uuid,
  outcome text not null check (outcome in ('success', 'denied', 'failure')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index crop_listings_market_idx on public.crop_listings (status, crop_type, location);
create index crop_listings_farmer_idx on public.crop_listings (farmer_id, created_at desc);
create index quality_assessments_owner_idx on public.quality_assessments (farmer_id, submitted_at desc);
create index market_prices_lookup_idx on public.market_prices (crop_type, location, observed_at desc);
create index buyer_requirements_lookup_idx on public.buyer_requirements (status, crop_type, required_date);
create index offers_farmer_idx on public.offers (farmer_id, status, created_at desc);
create index offers_buyer_idx on public.offers (buyer_id, status, created_at desc);
create index orders_parties_idx on public.orders (farmer_id, buyer_id, created_at desc);
create index order_events_order_idx on public.order_events (order_id, created_at);
create index payments_order_idx on public.payments (order_id, created_at desc);
create index notifications_recipient_idx on public.notifications (recipient_id, read_at, created_at desc);
create index audit_logs_target_idx on public.audit_logs (target_table, target_id, created_at desc);

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid())
$$;

create or replace function public.is_fpo_admin(target_fpo uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.fpo_profiles f
    where f.id = target_fpo and f.authorized_admin_id = (select auth.uid())
  )
$$;

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email, phone, preferred_language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    new.email,
    new.phone,
    case when new.raw_user_meta_data ->> 'preferred_language' in ('en', 'te', 'hi', 'mr')
      then new.raw_user_meta_data ->> 'preferred_language' else 'en' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_profile_for_auth_user();

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and new.role is distinct from old.role and public.current_app_role() is distinct from 'admin'::public.app_role then
    raise exception 'Only an authorized administrator can change account roles';
  end if;
  if auth.uid() is not null and new.account_status is distinct from old.account_status and public.current_app_role() is distinct from 'admin'::public.app_role then
    raise exception 'Only an authorized administrator can change account status';
  end if;
  return new;
end;
$$;

create trigger protect_profile_authority
  before update on public.profiles
  for each row execute function public.prevent_profile_role_escalation();

create or replace function public.protect_buyer_verification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and new.verification_status is distinct from old.verification_status
    and public.current_app_role() is distinct from 'admin'::public.app_role then
    raise exception 'Only an authorized administrator can change buyer verification';
  end if;
  return new;
end;
$$;

create trigger protect_buyer_verification_status
  before update on public.buyer_profiles
  for each row execute function public.protect_buyer_verification();

create or replace function public.reconcile_listing_quantity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  committed numeric(14, 3);
begin
  if tg_op = 'INSERT' then
    new.available_quantity := new.quantity;
  else
    select coalesce(sum(o.quantity), 0) into committed
      from public.orders o
      where o.listing_id = old.id and o.status <> 'cancelled';
    if new.quantity < committed then
      raise exception 'Listing quantity cannot be less than already committed orders';
    end if;
    new.available_quantity := new.quantity - committed;
  end if;
  if new.available_quantity = 0 and new.status = 'available' then
    new.status := 'sold_out';
  elsif new.available_quantity > 0 and new.status = 'sold_out' then
    new.status := 'available';
  end if;
  return new;
end;
$$;

create trigger reconcile_crop_listing_quantity
  before insert or update of quantity, available_quantity, status on public.crop_listings
  for each row execute function public.reconcile_listing_quantity();

alter table public.profiles enable row level security;
alter table public.farmer_profiles enable row level security;
alter table public.buyer_profiles enable row level security;
alter table public.fpo_profiles enable row level security;
alter table public.crop_listings enable row level security;
alter table public.quality_assessments enable row level security;
alter table public.market_prices enable row level security;
alter table public.buyer_requirements enable row level security;
alter table public.offers enable row level security;
alter table public.orders enable row level security;
alter table public.order_events enable row level security;
alter table public.payments enable row level security;
alter table public.transport_requests enable row level security;
alter table public.fpo_memberships enable row level security;
alter table public.fpo_allocations enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_read_self_or_admin on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.current_app_role()) = 'admin');
create policy profiles_update_self_or_admin on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select public.current_app_role()) = 'admin')
  with check (id = (select auth.uid()) or (select public.current_app_role()) = 'admin');

create policy farmer_profiles_owner_or_admin on public.farmer_profiles for all to authenticated
  using (user_id = (select auth.uid()) or (select public.current_app_role()) = 'admin')
  with check (user_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');
create policy buyer_profiles_owner_read on public.buyer_profiles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');
create policy buyer_profiles_owner_insert on public.buyer_profiles for insert to authenticated
  with check (user_id = (select auth.uid()) and verification_status = 'unverified'
    and exists (select 1 from public.profiles p where p.id = user_id and p.role = 'buyer'));
create policy buyer_profiles_owner_update on public.buyer_profiles for update to authenticated
  using (user_id = (select auth.uid()) or (select public.current_app_role()) = 'admin')
  with check (user_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');
create policy buyer_profiles_owner_delete on public.buyer_profiles for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');
create policy fpo_profiles_authorized_read on public.fpo_profiles for select to authenticated
  using (authorized_admin_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');
create policy fpo_profiles_authorized_insert on public.fpo_profiles for insert to authenticated
  with check (authorized_admin_id = (select auth.uid()) and (select public.current_app_role()) = 'fpo');
create policy fpo_profiles_authorized_update on public.fpo_profiles for update to authenticated
  using (authorized_admin_id = (select auth.uid()) or (select public.current_app_role()) = 'admin')
  with check (authorized_admin_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');

create policy listings_public_market_read on public.crop_listings for select to authenticated
  using (status = 'available' or farmer_id = (select auth.uid()) or (select public.current_app_role()) = 'admin'
    or exists (select 1 from public.offers o where o.listing_id = id and o.buyer_id = (select auth.uid())));
create policy listings_farmer_insert on public.crop_listings for insert to authenticated
  with check (farmer_id = (select auth.uid()) and (select public.current_app_role()) = 'farmer');
create policy listings_farmer_update on public.crop_listings for update to authenticated
  using (farmer_id = (select auth.uid()) or (select public.current_app_role()) = 'admin')
  with check (farmer_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');
create policy listings_farmer_delete on public.crop_listings for delete to authenticated
  using (farmer_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');

create policy quality_owner_or_admin on public.quality_assessments for select to authenticated
  using (farmer_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');
create policy quality_owner_insert on public.quality_assessments for insert to authenticated
  with check (farmer_id = (select auth.uid()) and exists (
    select 1 from public.crop_listings c where c.id = listing_id and c.farmer_id = (select auth.uid())
  ));
create policy quality_owner_delete on public.quality_assessments for delete to authenticated
  using (farmer_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');

create policy market_prices_authenticated_read on public.market_prices for select to authenticated using (true);
create policy requirements_authenticated_read_open on public.buyer_requirements for select to authenticated
  using (buyer_id = (select auth.uid()) or status = 'open' or (select public.current_app_role()) = 'admin');
create policy requirements_buyer_insert on public.buyer_requirements for insert to authenticated
  with check (buyer_id = (select auth.uid()) and (select public.current_app_role()) = 'buyer');
create policy requirements_buyer_update on public.buyer_requirements for update to authenticated
  using (buyer_id = (select auth.uid()) or (select public.current_app_role()) = 'admin')
  with check (buyer_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');
create policy requirements_buyer_delete on public.buyer_requirements for delete to authenticated
  using (buyer_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');

create policy offers_party_read on public.offers for select to authenticated
  using (buyer_id = (select auth.uid()) or farmer_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');
create policy offers_buyer_insert on public.offers for insert to authenticated
  with check (
    buyer_id = (select auth.uid())
    and last_responded_by = (select auth.uid())
    and (select public.current_app_role()) = 'buyer'
    and exists (select 1 from public.crop_listings c where c.id = listing_id and c.farmer_id = farmer_id)
  );
create policy orders_party_read on public.orders for select to authenticated
  using (buyer_id = (select auth.uid()) or farmer_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');
create policy order_events_party_read on public.order_events for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.buyer_id = (select auth.uid()) or o.farmer_id = (select auth.uid())))
    or (select public.current_app_role()) = 'admin');
create policy payments_party_read on public.payments for select to authenticated
  using (payer_id = (select auth.uid()) or recipient_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');
create policy transport_order_party_read on public.transport_requests for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.buyer_id = (select auth.uid()) or o.farmer_id = (select auth.uid())))
    or (select public.current_app_role()) = 'admin');

create policy fpo_memberships_authorized_read on public.fpo_memberships for select to authenticated
  using (farmer_id = (select auth.uid()) or (select public.is_fpo_admin(fpo_id)) or (select public.current_app_role()) = 'admin');
create policy fpo_membership_farmer_insert on public.fpo_memberships for insert to authenticated
  with check (farmer_id = (select auth.uid()) and status = 'pending');
create policy fpo_membership_farmer_leave on public.fpo_memberships for update to authenticated
  using (farmer_id = (select auth.uid()))
  with check (farmer_id = (select auth.uid()) and status in ('pending', 'left'));
create policy fpo_membership_admin_update on public.fpo_memberships for update to authenticated
  using ((select public.is_fpo_admin(fpo_id)) or (select public.current_app_role()) = 'admin')
  with check ((select public.is_fpo_admin(fpo_id)) or (select public.current_app_role()) = 'admin');
create policy fpo_allocations_authorized_read on public.fpo_allocations for select to authenticated
  using (farmer_id = (select auth.uid()) or (select public.is_fpo_admin(fpo_id)) or (select public.current_app_role()) = 'admin');

create policy notifications_recipient_read on public.notifications for select to authenticated
  using (recipient_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');
create policy notifications_recipient_update on public.notifications for update to authenticated
  using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));
create policy audit_logs_admin_read on public.audit_logs for select to authenticated
  using ((select public.current_app_role()) = 'admin');

create or replace function public.accept_offer(target_offer_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actor_role public.app_role;
  accepted_offer public.offers%rowtype;
  listing public.crop_listings%rowtype;
  new_order_id uuid := gen_random_uuid();
  gross numeric(16, 2);
  transport numeric(14, 2);
  farmer_net_value numeric(16, 2);
  buyer_total_value numeric(16, 2);
begin
  if actor is null then raise exception 'Authentication required'; end if;
  select p.role into actor_role from public.profiles p where p.id = actor and p.account_status = 'active';
  if actor_role is null then raise exception 'Active profile required'; end if;

  select * into accepted_offer from public.offers where id = target_offer_id for update;
  if not found then raise exception 'Offer not found'; end if;
  if actor <> accepted_offer.buyer_id and actor <> accepted_offer.farmer_id then raise exception 'Not an offer party'; end if;
  if actor = accepted_offer.buyer_id and actor_role <> 'buyer' then raise exception 'Buyer role required'; end if;
  if actor = accepted_offer.farmer_id and actor_role <> 'farmer' then raise exception 'Farmer role required'; end if;
  if accepted_offer.status not in ('pending', 'countered') then raise exception 'Offer is not awaiting a response'; end if;
  if accepted_offer.expires_at is not null and accepted_offer.expires_at <= now() then
    update public.offers set status = 'expired', updated_at = now() where id = target_offer_id;
    raise exception 'Offer has expired';
  end if;
  if accepted_offer.last_responded_by = actor then raise exception 'The other party must respond to the latest offer'; end if;

  select * into listing from public.crop_listings where id = accepted_offer.listing_id for update;
  if not found or listing.farmer_id <> accepted_offer.farmer_id then raise exception 'Crop listing is unavailable'; end if;
  if accepted_offer.unit <> listing.unit or accepted_offer.quantity <= 0 or accepted_offer.unit_price <= 0 then
    raise exception 'Offer terms are invalid';
  end if;
  if listing.status <> 'available' or listing.available_quantity < accepted_offer.quantity then
    raise exception 'Insufficient available quantity';
  end if;
  if accepted_offer.delivery_method = 'buyer_pickup' and accepted_offer.transport_cost <> 0 then
    raise exception 'Buyer pickup cannot include a separate transport charge';
  end if;

  gross := round(accepted_offer.quantity * accepted_offer.unit_price, 2);
  transport := case when accepted_offer.delivery_method = 'buyer_pickup' then 0 else accepted_offer.transport_cost end;
  farmer_net_value := gross
    - case when accepted_offer.transport_payer = 'farmer' then transport else 0 end
    - accepted_offer.other_farmer_charges;
  buyer_total_value := gross
    + case when accepted_offer.transport_payer = 'buyer' then transport else 0 end;
  if farmer_net_value < 0 then raise exception 'Farmer deductions exceed gross value'; end if;

  insert into public.orders (
    id, offer_id, listing_id, buyer_id, farmer_id, quantity, unit, unit_price, gross_value,
    transport_method, transport_provider, transport_cost, transport_payer,
    other_farmer_deductions, farmer_net, buyer_total
  ) values (
    new_order_id, accepted_offer.id, listing.id, accepted_offer.buyer_id, accepted_offer.farmer_id,
    accepted_offer.quantity, accepted_offer.unit, accepted_offer.unit_price, gross,
    accepted_offer.delivery_method, accepted_offer.transport_provider, transport, accepted_offer.transport_payer,
    accepted_offer.other_farmer_charges, farmer_net_value, buyer_total_value
  );

  update public.crop_listings
  set available_quantity = available_quantity - accepted_offer.quantity,
      status = case when available_quantity - accepted_offer.quantity = 0 then 'sold_out'::public.listing_status else status end,
      updated_at = now()
  where id = listing.id;

  update public.offers set status = 'accepted', updated_at = now() where id = accepted_offer.id;
  insert into public.order_events (order_id, actor_id, event_type, details)
  values (new_order_id, actor, 'offer_accepted', jsonb_build_object('offer_id', accepted_offer.id, 'gross_value', gross));
  insert into public.audit_logs (actor_id, action, target_table, target_id, outcome)
  values (actor, 'accept_offer', 'orders', new_order_id, 'success');
  return new_order_id;
end;
$$;

create or replace function public.respond_to_offer(target_offer_id uuid, response text, counter_price numeric default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actor_role public.app_role;
  target public.offers%rowtype;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  select p.role into actor_role from public.profiles p where p.id = actor and p.account_status = 'active';
  if actor_role is null then raise exception 'Active profile required'; end if;
  select * into target from public.offers where id = target_offer_id for update;
  if not found or (actor <> target.buyer_id and actor <> target.farmer_id) then raise exception 'Offer not found'; end if;
  if actor = target.buyer_id and actor_role <> 'buyer' then raise exception 'Buyer role required'; end if;
  if actor = target.farmer_id and actor_role <> 'farmer' then raise exception 'Farmer role required'; end if;
  if target.status not in ('pending', 'countered') then raise exception 'Offer is not awaiting a response'; end if;
  if target.expires_at is not null and target.expires_at <= now() then raise exception 'Offer has expired'; end if;
  if target.last_responded_by = actor then raise exception 'The other party must respond first'; end if;

  if response = 'counter' then
    if counter_price is null or counter_price <= 0 then raise exception 'Counter price must be greater than zero'; end if;
    update public.offers
      set unit_price = counter_price,
          status = 'countered',
          last_responded_by = actor,
          counter_history = counter_history || jsonb_build_array(jsonb_build_object(
            'actor_id', actor, 'unit_price', counter_price, 'created_at', now()
          )),
          updated_at = now()
      where id = target_offer_id;
  elsif response = 'reject' then
    update public.offers set status = 'rejected', last_responded_by = actor, updated_at = now()
    where id = target_offer_id;
  else
    raise exception 'Response must be counter or reject';
  end if;

  insert into public.audit_logs (actor_id, action, target_table, target_id, outcome)
  values (actor, 'respond_to_offer_' || response, 'offers', target_offer_id, 'success');
end;
$$;

revoke all on public.profiles, public.farmer_profiles, public.buyer_profiles,
  public.fpo_profiles, public.crop_listings, public.quality_assessments,
  public.market_prices, public.buyer_requirements, public.offers, public.orders,
  public.order_events, public.payments, public.transport_requests,
  public.fpo_memberships, public.fpo_allocations, public.notifications,
  public.audit_logs from anon, authenticated;

revoke all on function public.accept_offer(uuid) from public, anon;
grant execute on function public.accept_offer(uuid) to authenticated;
revoke all on function public.respond_to_offer(uuid, text, numeric) from public, anon;
grant execute on function public.respond_to_offer(uuid, text, numeric) to authenticated;

create policy quality_images_owner_read on storage.objects for select to authenticated
  using (bucket_id = 'quality-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy quality_images_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'quality-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy quality_images_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'quality-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('quality-evidence', 'quality-evidence', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.farmer_profiles, public.buyer_profiles to authenticated;
grant select, insert, update on public.fpo_profiles to authenticated;
grant select, insert, update, delete on public.crop_listings to authenticated;
grant select, insert, delete on public.quality_assessments to authenticated;
grant select on public.market_prices to authenticated;
grant select, insert, update, delete on public.buyer_requirements to authenticated;
grant select, insert on public.offers to authenticated;
grant select on public.orders, public.order_events, public.payments, public.transport_requests to authenticated;
grant select, insert, update on public.fpo_memberships to authenticated;
grant select on public.fpo_allocations to authenticated;
grant select, update on public.notifications to authenticated;
grant select on public.audit_logs to authenticated;
