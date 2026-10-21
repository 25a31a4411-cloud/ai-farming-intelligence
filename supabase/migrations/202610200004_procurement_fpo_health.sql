alter table public.buyer_requirements
  add column if not exists required_variety text,
  add column if not exists currency text not null default 'INR',
  add column if not exists updated_at timestamptz not null default now();

alter table public.buyer_requirements
  add constraint buyer_requirements_variety_length
    check (required_variety is null or char_length(required_variety) <= 120),
  add constraint buyer_requirements_currency_inr check (currency = 'INR');

alter table public.market_prices
  add column if not exists variety text,
  add column if not exists modal_price numeric(14, 2),
  add column if not exists currency text not null default 'INR',
  add column if not exists last_fetched_at timestamptz not null default now(),
  add column if not exists provider_record_key text,
  add constraint market_prices_modal_price_nonnegative check (modal_price is null or modal_price >= 0),
  add constraint market_prices_currency_inr check (currency = 'INR');

create unique index if not exists market_prices_provider_record_key_unique
  on public.market_prices (provider_record_key);

create table public.crop_health_notes (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.crop_listings(id) on delete cascade,
  farmer_id uuid not null references public.profiles(id),
  author_id uuid not null references public.profiles(id),
  assessment_id uuid references public.quality_assessments(id) on delete set null,
  note text not null check (char_length(trim(note)) between 1 and 2000),
  observation_type text not null check (observation_type in ('health', 'harvest_readiness')),
  consent_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.fpo_campaigns (
  id uuid primary key default gen_random_uuid(),
  fpo_id uuid not null references public.fpo_profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 200),
  crop_type text not null check (char_length(trim(crop_type)) between 1 and 120),
  unit text not null check (unit in ('kg', 'quintal', 'tonne')),
  target_quantity numeric(14, 3) check (target_quantity is null or target_quantity > 0),
  status text not null default 'open' check (status in ('open', 'closed', 'cancelled')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.fpo_allocations
  add column if not exists campaign_id uuid references public.fpo_campaigns(id) on delete cascade,
  add column if not exists status text not null default 'allocated'
    check (status in ('allocated', 'committed', 'sold', 'released')),
  add column if not exists consent_at timestamptz,
  add column if not exists committed_quantity numeric(14, 3) not null default 0
    check (committed_quantity >= 0 and committed_quantity <= quantity),
  add column if not exists sold_quantity numeric(14, 3) not null default 0
    check (sold_quantity >= 0 and sold_quantity <= committed_quantity),
  add constraint fpo_allocation_campaign_listing_unique unique (campaign_id, listing_id);

create index if not exists buyer_requirements_open_idx
  on public.buyer_requirements (crop_type, unit, required_date) where status = 'open';
create index if not exists crop_health_notes_farmer_created_idx
  on public.crop_health_notes (farmer_id, created_at desc);
create index if not exists fpo_campaigns_open_idx
  on public.fpo_campaigns (fpo_id, status);
create index if not exists fpo_allocations_listing_status_idx
  on public.fpo_allocations (listing_id, status);

alter table public.crop_health_notes enable row level security;
alter table public.fpo_campaigns enable row level security;

drop policy if exists requirements_buyer_insert on public.buyer_requirements;
drop policy if exists requirements_buyer_update on public.buyer_requirements;
drop policy if exists requirements_buyer_delete on public.buyer_requirements;
drop policy if exists fpo_profiles_authorized_read on public.fpo_profiles;
create policy fpo_profiles_authenticated_directory on public.fpo_profiles for select to authenticated using (true);
create policy crop_health_notes_owner_read on public.crop_health_notes for select to authenticated
  using (farmer_id = (select auth.uid()) or (select public.current_app_role()) = 'admin');
create policy fpo_campaigns_member_read on public.fpo_campaigns for select to authenticated
  using (
    (select public.is_fpo_admin(fpo_id))
    or (select public.current_app_role()) = 'admin'
    or exists (
      select 1 from public.fpo_memberships m
      where m.fpo_id = fpo_campaigns.fpo_id
        and m.farmer_id = (select auth.uid())
        and m.status = 'active'
    )
  );

grant select on public.crop_health_notes, public.fpo_campaigns, public.fpo_profiles to authenticated;
grant select on public.market_prices to authenticated;
revoke select on public.fpo_profiles from authenticated;
grant select (id, name) on public.fpo_profiles to authenticated;
revoke insert, update, delete on public.buyer_requirements from authenticated;
revoke insert, update, delete on public.crop_health_notes from authenticated;
revoke insert, update, delete on public.fpo_campaigns, public.fpo_allocations from authenticated;
revoke insert, update, delete on public.fpo_memberships from authenticated;
revoke insert, update, delete on public.market_prices from anon, authenticated;

create or replace function public.list_fpo_directory()
returns table (id uuid, name text, can_manage boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select f.id, f.name,
    f.authorized_admin_id = (select auth.uid()) as can_manage
  from public.fpo_profiles f
  where (select auth.uid()) is not null
  order by f.name
$$;

create or replace function public.save_buyer_requirement(
  target_request_id uuid,
  requested_crop text,
  requested_variety text,
  requested_quantity numeric,
  requested_unit text,
  requested_quality text,
  requested_location text,
  requested_budget_min numeric,
  requested_budget_max numeric,
  requested_date date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actor_role public.app_role;
  result_id uuid;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  select p.role into actor_role from public.profiles p
    where p.id = actor and p.account_status = 'active';
  if actor_role is distinct from 'buyer' then raise exception 'Only active buyers can manage procurement requests'; end if;
  if nullif(trim(requested_crop), '') is null or char_length(trim(requested_crop)) > 120 then
    raise exception 'Enter a crop name up to 120 characters';
  end if;
  if requested_variety is not null and char_length(trim(requested_variety)) > 120 then
    raise exception 'Variety must be 120 characters or fewer';
  end if;
  if requested_quantity is null or requested_quantity <= 0 then raise exception 'Quantity must be greater than zero'; end if;
  if requested_unit not in ('kg', 'quintal', 'tonne') then raise exception 'Choose kg, quintal, or tonne'; end if;
  if nullif(trim(requested_location), '') is null or char_length(trim(requested_location)) > 240 then
    raise exception 'Enter a delivery location up to 240 characters';
  end if;
  if requested_budget_min is not null and requested_budget_min < 0 then raise exception 'Minimum budget cannot be negative'; end if;
  if requested_budget_max is not null and requested_budget_max <= 0 then raise exception 'Maximum budget must be greater than zero'; end if;
  if requested_budget_min is not null and requested_budget_max is not null and requested_budget_min > requested_budget_max then
    raise exception 'Minimum budget cannot exceed maximum budget';
  end if;
  if requested_date is null or requested_date < current_date then raise exception 'Required delivery date must be today or later'; end if;

  if target_request_id is null then
    insert into public.buyer_requirements (
      buyer_id, crop_type, variety, required_variety, quantity, unit, quality,
      location, budget_min, budget_max, required_date, currency, status
    ) values (
      actor, trim(requested_crop), nullif(trim(requested_variety), ''), nullif(trim(requested_variety), ''),
      requested_quantity, requested_unit, nullif(trim(requested_quality), ''), trim(requested_location),
      requested_budget_min, requested_budget_max, requested_date, 'INR', 'open'
    ) returning id into result_id;
  else
    update public.buyer_requirements
      set crop_type = trim(requested_crop),
          variety = nullif(trim(requested_variety), ''),
          required_variety = nullif(trim(requested_variety), ''),
          quantity = requested_quantity,
          unit = requested_unit,
          quality = nullif(trim(requested_quality), ''),
          location = trim(requested_location),
          budget_min = requested_budget_min,
          budget_max = requested_budget_max,
          required_date = requested_date,
          currency = 'INR',
          updated_at = now()
      where id = target_request_id and buyer_id = actor and status = 'open'
      returning id into result_id;
    if result_id is null then raise exception 'Open procurement request not found or not owned by this buyer'; end if;
  end if;
  insert into public.audit_logs (actor_id, action, target_table, target_id, outcome)
  values (actor, case when target_request_id is null then 'create_buyer_requirement' else 'update_buyer_requirement' end,
    'buyer_requirements', result_id, 'success');
  return result_id;
end;
$$;

create or replace function public.set_buyer_requirement_status(target_request_id uuid, requested_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = actor and p.account_status = 'active' and p.role = 'buyer'
  ) then raise exception 'Active buyer account required'; end if;
  if requested_status not in ('closed', 'cancelled') then raise exception 'Request status must be closed or cancelled'; end if;
  update public.buyer_requirements
    set status = requested_status, updated_at = now()
    where id = target_request_id and buyer_id = actor and status = 'open';
  if not found then raise exception 'Open procurement request not found or not owned by this buyer'; end if;
  insert into public.audit_logs (actor_id, action, target_table, target_id, outcome)
  values (actor, 'set_buyer_requirement_' || requested_status, 'buyer_requirements', target_request_id, 'success');
end;
$$;

create or replace function public.save_crop_health_note(
  target_listing_id uuid,
  requested_note text,
  requested_type text,
  target_assessment_id uuid,
  consent_given boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  result_id uuid;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = actor and p.account_status = 'active' and p.role = 'farmer'
  ) then raise exception 'Active farmer account required'; end if;
  if consent_given is distinct from true then raise exception 'Consent is required to store this crop note'; end if;
  if requested_type not in ('health', 'harvest_readiness') then raise exception 'Choose a supported note type'; end if;
  if nullif(trim(requested_note), '') is null or char_length(trim(requested_note)) > 2000 then
    raise exception 'Enter a note between 1 and 2000 characters';
  end if;
  if not exists (
    select 1 from public.crop_listings c
    where c.id = target_listing_id and c.farmer_id = actor
  ) then raise exception 'Crop listing not found or not owned by this farmer'; end if;
  if target_assessment_id is not null and not exists (
    select 1 from public.quality_assessments q
    where q.id = target_assessment_id and q.listing_id = target_listing_id and q.farmer_id = actor
  ) then raise exception 'Assessment reference must belong to this farmer and crop listing'; end if;

  insert into public.crop_health_notes (
    listing_id, farmer_id, author_id, assessment_id, note, observation_type, consent_at
  ) values (
    target_listing_id, actor, actor, target_assessment_id, trim(requested_note), requested_type, now()
  ) returning id into result_id;
  insert into public.audit_logs (actor_id, action, target_table, target_id, outcome)
  values (actor, 'save_crop_health_note', 'crop_health_notes', result_id, 'success');
  return result_id;
end;
$$;

create or replace function public.request_fpo_membership(target_fpo_id uuid, consent_given boolean)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  membership_id uuid;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = actor and p.account_status = 'active' and p.role = 'farmer'
  ) then raise exception 'Active farmer account required'; end if;
  if consent_given is distinct from true then raise exception 'Explicit membership consent is required'; end if;
  if not exists (select 1 from public.fpo_profiles f where f.id = target_fpo_id) then raise exception 'FPO not found'; end if;
  insert into public.fpo_memberships (fpo_id, farmer_id, status, consent_at)
  values (target_fpo_id, actor, 'pending', now())
  on conflict (fpo_id, farmer_id) do update
    set status = 'pending', consent_at = now()
    where public.fpo_memberships.status in ('left', 'suspended')
  returning id into membership_id;
  if membership_id is null then raise exception 'Membership request already exists'; end if;
  return membership_id;
end;
$$;

create or replace function public.review_fpo_membership(target_membership_id uuid, requested_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = actor and p.account_status = 'active' and p.role in ('fpo', 'admin')
  ) then raise exception 'Active FPO administrator account required'; end if;
  if requested_status not in ('active', 'suspended') then raise exception 'Membership status must be active or suspended'; end if;
  update public.fpo_memberships m
    set status = requested_status
    where m.id = target_membership_id
      and m.status in ('pending', 'active')
      and m.consent_at is not null
      and public.is_fpo_admin(m.fpo_id);
  if not found then raise exception 'Consented membership request not found or not authorized'; end if;
end;
$$;

create or replace function public.leave_fpo(target_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.account_status = 'active' and p.role = 'farmer'
  ) then raise exception 'Active farmer account required'; end if;
  update public.fpo_memberships set status = 'left'
    where id = target_membership_id and farmer_id = auth.uid() and status in ('pending', 'active', 'suspended');
  if not found then raise exception 'Membership not found or not owned by this farmer'; end if;
end;
$$;

create or replace function public.create_fpo_campaign(
  target_fpo_id uuid,
  requested_name text,
  requested_crop text,
  requested_unit text,
  requested_target_quantity numeric
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  result_id uuid;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = actor and p.account_status = 'active' and p.role in ('fpo', 'admin')
  ) then raise exception 'Active FPO administrator account required'; end if;
  if not public.is_fpo_admin(target_fpo_id) then raise exception 'FPO administrator access required'; end if;
  if nullif(trim(requested_name), '') is null or char_length(trim(requested_name)) > 200 then raise exception 'Enter a campaign name'; end if;
  if nullif(trim(requested_crop), '') is null or char_length(trim(requested_crop)) > 120 then raise exception 'Enter a crop name'; end if;
  if requested_unit not in ('kg', 'quintal', 'tonne') then raise exception 'Choose kg, quintal, or tonne'; end if;
  if requested_target_quantity is not null and requested_target_quantity <= 0 then raise exception 'Target quantity must be positive'; end if;
  insert into public.fpo_campaigns (fpo_id, name, crop_type, unit, target_quantity, created_by)
  values (target_fpo_id, trim(requested_name), trim(requested_crop), requested_unit, requested_target_quantity, actor)
  returning id into result_id;
  return result_id;
end;
$$;

create or replace function public.consent_fpo_crop_allocation(
  target_campaign_id uuid,
  target_listing_id uuid,
  requested_quantity numeric,
  consent_given boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  campaign public.fpo_campaigns%rowtype;
  listing public.crop_listings%rowtype;
  membership_id uuid;
  result_id uuid;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = actor and p.account_status = 'active' and p.role = 'farmer'
  ) then raise exception 'Active farmer account required'; end if;
  if consent_given is distinct from true then raise exception 'Explicit crop and quantity consent is required'; end if;
  select * into campaign from public.fpo_campaigns where id = target_campaign_id and status = 'open' for update;
  if not found then raise exception 'Open FPO campaign not found'; end if;
  select m.id into membership_id from public.fpo_memberships m
    where m.fpo_id = campaign.fpo_id and m.farmer_id = actor and m.status = 'active' and m.consent_at is not null;
  if membership_id is null then raise exception 'Active, consented FPO membership is required'; end if;
  select * into listing from public.crop_listings where id = target_listing_id for update;
  if not found or listing.farmer_id <> actor then raise exception 'Crop listing not found or not owned by this farmer'; end if;
  if listing.status <> 'available' or listing.unit <> campaign.unit
    or lower(listing.crop_type) <> lower(campaign.crop_type) then
    raise exception 'Crop listing does not match the open campaign';
  end if;
  if requested_quantity is null or requested_quantity <= 0 or listing.available_quantity < requested_quantity then
    raise exception 'Allocation quantity exceeds available stock';
  end if;
  if campaign.target_quantity is not null and
    (select coalesce(sum(a.quantity), 0) from public.fpo_allocations a
      where a.campaign_id = campaign.id and a.status in ('allocated', 'committed', 'sold'))
      + requested_quantity > campaign.target_quantity then
    raise exception 'Allocation would exceed the campaign target quantity';
  end if;
  insert into public.fpo_allocations (
    fpo_id, campaign_id, farmer_id, listing_id, quantity, status, consent_at
  ) values (
    campaign.fpo_id, campaign.id, actor, listing.id, requested_quantity, 'allocated', now()
  ) returning id into result_id;
  update public.crop_listings set available_quantity = available_quantity, updated_at = now() where id = listing.id;
  return result_id;
end;
$$;

create or replace function public.withdraw_fpo_crop_allocation(target_allocation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  allocation public.fpo_allocations%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.account_status = 'active' and p.role = 'farmer'
  ) then raise exception 'Active farmer account required'; end if;
  select * into allocation from public.fpo_allocations where id = target_allocation_id for update;
  if not found or allocation.farmer_id <> auth.uid() then raise exception 'Allocation not found or not owned by this farmer'; end if;
  if allocation.status <> 'allocated' then raise exception 'Only an uncommitted allocation can be withdrawn'; end if;
  update public.fpo_allocations set status = 'released' where id = target_allocation_id;
  update public.crop_listings set available_quantity = available_quantity, updated_at = now() where id = allocation.listing_id;
end;
$$;

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
    select committed + coalesce(sum(a.quantity), 0) into committed
      from public.fpo_allocations a
      where a.listing_id = old.id and a.status in ('allocated', 'committed');
    if new.quantity < committed then
      raise exception 'Listing quantity cannot be less than committed orders and active FPO allocations';
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

create or replace function public.release_cancelled_order_inventory()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status <> 'cancelled' and new.status = 'cancelled' then
    update public.crop_listings set available_quantity = available_quantity, updated_at = now()
      where id = new.listing_id;
  end if;
  return new;
end;
$$;

drop trigger if exists release_cancelled_order_inventory_trigger on public.orders;
create trigger release_cancelled_order_inventory_trigger
  after update of status on public.orders
  for each row execute function public.release_cancelled_order_inventory();

revoke all on function public.save_buyer_requirement(uuid,text,text,numeric,text,text,text,numeric,numeric,date) from public, anon;
grant execute on function public.save_buyer_requirement(uuid,text,text,numeric,text,text,text,numeric,numeric,date) to authenticated;
revoke all on function public.list_fpo_directory() from public, anon;
grant execute on function public.list_fpo_directory() to authenticated;
revoke all on function public.set_buyer_requirement_status(uuid,text) from public, anon;
grant execute on function public.set_buyer_requirement_status(uuid,text) to authenticated;
revoke all on function public.save_crop_health_note(uuid,text,text,uuid,boolean) from public, anon;
grant execute on function public.save_crop_health_note(uuid,text,text,uuid,boolean) to authenticated;
revoke all on function public.request_fpo_membership(uuid,boolean) from public, anon;
grant execute on function public.request_fpo_membership(uuid,boolean) to authenticated;
revoke all on function public.review_fpo_membership(uuid,text) from public, anon;
grant execute on function public.review_fpo_membership(uuid,text) to authenticated;
revoke all on function public.leave_fpo(uuid) from public, anon;
grant execute on function public.leave_fpo(uuid) to authenticated;
revoke all on function public.create_fpo_campaign(uuid,text,text,text,numeric) from public, anon;
grant execute on function public.create_fpo_campaign(uuid,text,text,text,numeric) to authenticated;
revoke all on function public.consent_fpo_crop_allocation(uuid,uuid,numeric,boolean) from public, anon;
grant execute on function public.consent_fpo_crop_allocation(uuid,uuid,numeric,boolean) to authenticated;
revoke all on function public.withdraw_fpo_crop_allocation(uuid) from public, anon;
grant execute on function public.withdraw_fpo_crop_allocation(uuid) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'crop_health_notes' and c.relrowsecurity
  ) or not exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'fpo_campaigns' and c.relrowsecurity
  ) then raise exception 'Health notes and FPO campaigns must have RLS enabled'; end if;
  if has_table_privilege('authenticated', 'public.market_prices', 'INSERT')
    or has_table_privilege('authenticated', 'public.buyer_requirements', 'UPDATE')
    or has_table_privilege('authenticated', 'public.fpo_allocations', 'INSERT') then
    raise exception 'Market and marketplace data writes must use trusted service operations';
  end if;
  if has_table_privilege('authenticated', 'public.fpo_memberships', 'INSERT')
    or has_table_privilege('authenticated', 'public.fpo_memberships', 'UPDATE')
    or has_column_privilege('authenticated', 'public.fpo_profiles', 'authorized_admin_id', 'SELECT') then
    raise exception 'Membership changes must use consent RPCs and FPO administrator IDs must remain private';
  end if;
  if not has_function_privilege('authenticated', 'public.save_buyer_requirement(uuid,text,text,numeric,text,text,text,numeric,numeric,date)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.save_crop_health_note(uuid,text,text,uuid,boolean)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.consent_fpo_crop_allocation(uuid,uuid,numeric,boolean)', 'EXECUTE') then
    raise exception 'Required procurement, health, and FPO RPCs are unavailable';
  end if;
end;
$$;
