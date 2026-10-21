create table public.fpo_group_sales (
  id uuid primary key default gen_random_uuid(),
  fpo_id uuid not null references public.fpo_profiles(id),
  campaign_id uuid not null references public.fpo_campaigns(id),
  buyer_requirement_id uuid not null references public.buyer_requirements(id),
  buyer_id uuid not null references public.profiles(id),
  client_request_id uuid not null,
  crop_type text not null check (char_length(crop_type) between 1 and 120),
  quantity numeric(14, 3) not null check (quantity > 0),
  unit text not null check (unit in ('kg', 'quintal', 'tonne')),
  currency text not null default 'INR' check (currency = 'INR'),
  unit_price numeric(14, 2) not null check (unit_price > 0),
  gross_value numeric(16, 2) not null check (gross_value > 0),
  delivery_method text not null check (delivery_method in ('buyer_pickup', 'farmer_delivery', 'third_party')),
  transport_provider text,
  transport_cost numeric(14, 2) not null default 0 check (transport_cost >= 0),
  transport_payer text not null check (transport_payer in ('buyer', 'farmer', 'third_party', 'none')),
  other_farmer_deductions numeric(14, 2) not null default 0 check (other_farmer_deductions >= 0),
  buyer_total numeric(16, 2) not null check (buyer_total > 0),
  status text not null default 'awaiting_approvals'
    check (status in ('awaiting_approvals', 'confirmed', 'delivered', 'rejected', 'cancelled')),
  buyer_accepted_at timestamptz,
  confirmed_at timestamptz,
  delivered_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fpo_id, client_request_id),
  check (delivery_method <> 'buyer_pickup' or (transport_cost = 0 and transport_payer = 'none' and transport_provider is null)),
  check (delivery_method <> 'third_party' or (nullif(trim(transport_provider), '') is not null and transport_payer <> 'none')),
  check (transport_cost = 0 or transport_payer <> 'none')
);

create table public.fpo_group_sale_contributors (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.fpo_group_sales(id) on delete cascade,
  fpo_id uuid not null references public.fpo_profiles(id),
  allocation_id uuid not null references public.fpo_allocations(id),
  listing_id uuid not null references public.crop_listings(id),
  farmer_id uuid not null references public.profiles(id),
  quantity numeric(14, 3) not null check (quantity > 0),
  gross_amount numeric(16, 2),
  transport_deduction numeric(14, 2),
  other_deduction numeric(14, 2),
  net_proceeds numeric(16, 2),
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (sale_id, allocation_id),
  check (gross_amount is null or gross_amount >= 0),
  check (transport_deduction is null or transport_deduction >= 0),
  check (other_deduction is null or other_deduction >= 0),
  check (net_proceeds is null or net_proceeds >= 0)
);

create table public.fpo_settlements (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.fpo_group_sales(id),
  contributor_id uuid not null unique references public.fpo_group_sale_contributors(id),
  fpo_id uuid not null references public.fpo_profiles(id),
  farmer_id uuid not null references public.profiles(id),
  quantity numeric(14, 3) not null check (quantity > 0),
  gross_amount numeric(16, 2) not null check (gross_amount >= 0),
  transport_deduction numeric(14, 2) not null check (transport_deduction >= 0),
  other_deduction numeric(14, 2) not null check (other_deduction >= 0),
  net_amount numeric(16, 2) not null check (net_amount >= 0),
  status text not null default 'pending' check (status = 'pending'),
  verified_at timestamptz,
  provider_reference text,
  created_at timestamptz not null default now(),
  check (verified_at is null and provider_reference is null)
);

create table public.fpo_group_sale_events (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.fpo_group_sales(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  event_type text not null check (event_type in (
    'proposed', 'farmer_approved', 'farmer_declined', 'buyer_approved',
    'buyer_declined', 'confirmed', 'cancelled', 'delivered'
  )),
  created_at timestamptz not null default now()
);

create index fpo_group_sales_buyer_status_idx
  on public.fpo_group_sales (buyer_id, status, created_at desc);
create index fpo_group_sales_fpo_status_idx
  on public.fpo_group_sales (fpo_id, status, created_at desc);
create index fpo_group_contributors_farmer_idx
  on public.fpo_group_sale_contributors (farmer_id, created_at desc);
create index fpo_settlements_farmer_idx
  on public.fpo_settlements (farmer_id, created_at desc);
create index fpo_group_sale_events_sale_created_idx
  on public.fpo_group_sale_events (sale_id, created_at);
create index fpo_group_contributor_allocation_idx
  on public.fpo_group_sale_contributors (allocation_id, sale_id);
create unique index fpo_group_sale_one_active_requirement
  on public.fpo_group_sales (buyer_requirement_id)
  where status in ('awaiting_approvals', 'confirmed');
create unique index fpo_group_sale_one_confirmed_requirement
  on public.fpo_group_sales (buyer_requirement_id)
  where status in ('confirmed', 'delivered');

alter table public.fpo_group_sales enable row level security;
alter table public.fpo_group_sale_contributors enable row level security;
alter table public.fpo_settlements enable row level security;
alter table public.fpo_group_sale_events enable row level security;

create policy fpo_group_sales_party_read on public.fpo_group_sales for select to authenticated
  using (
    buyer_id = (select auth.uid())
    or (select public.is_fpo_admin(fpo_id))
    or (select public.current_app_role()) = 'admin'
    or exists (
      select 1 from public.fpo_group_sale_contributors c
      where c.sale_id = fpo_group_sales.id and c.farmer_id = (select auth.uid())
    )
  );
create policy fpo_group_contributors_authorized_read on public.fpo_group_sale_contributors for select to authenticated
  using (
    farmer_id = (select auth.uid())
    or (select public.is_fpo_admin(fpo_id))
    or (select public.current_app_role()) = 'admin'
  );
create policy fpo_settlements_authorized_read on public.fpo_settlements for select to authenticated
  using (
    farmer_id = (select auth.uid())
    or (select public.is_fpo_admin(fpo_id))
    or (select public.current_app_role()) = 'admin'
  );
create policy fpo_group_sale_events_party_read on public.fpo_group_sale_events for select to authenticated
  using (exists (
    select 1 from public.fpo_group_sales s
    where s.id = fpo_group_sale_events.sale_id
  ));

revoke all on public.fpo_group_sales, public.fpo_group_sale_contributors, public.fpo_settlements, public.fpo_group_sale_events from anon, authenticated;
grant select on public.fpo_group_sales, public.fpo_group_sale_contributors, public.fpo_settlements, public.fpo_group_sale_events to authenticated;

create or replace function public.finalize_fpo_group_sale(target_sale_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  sale public.fpo_group_sales%rowtype;
  contributor record;
  contributor_count integer;
  contributor_index integer := 0;
  allocated_gross numeric(16, 2) := 0;
  allocated_transport numeric(14, 2) := 0;
  allocated_other numeric(14, 2) := 0;
  row_gross numeric(16, 2);
  row_transport numeric(14, 2);
  row_other numeric(14, 2);
  seller_transport numeric(14, 2);
  net_value numeric(16, 2);
begin
  select * into sale from public.fpo_group_sales where id = target_sale_id for update;
  if not found or sale.status <> 'awaiting_approvals' or sale.buyer_accepted_at is null then return; end if;
  if exists (
    select 1 from public.fpo_group_sale_contributors c
    where c.sale_id = sale.id and c.consent_at is null
  ) or not exists (
    select 1 from public.fpo_group_sale_contributors c where c.sale_id = sale.id
  ) then return; end if;
  if sale.other_farmer_deductions
    + case when sale.transport_payer = 'farmer' then sale.transport_cost else 0 end > sale.gross_value then
    raise exception 'Agreed farmer deductions exceed group-sale gross value';
  end if;

  select count(*) into contributor_count from public.fpo_group_sale_contributors where sale_id = sale.id;
  seller_transport := case when sale.transport_payer = 'farmer' then sale.transport_cost else 0 end;
  for contributor in
    select c.* from public.fpo_group_sale_contributors c
    where c.sale_id = sale.id
    order by c.allocation_id, c.farmer_id
  loop
    contributor_index := contributor_index + 1;
    if contributor_index = contributor_count then
      row_gross := sale.gross_value - allocated_gross;
      row_transport := seller_transport - allocated_transport;
      row_other := sale.other_farmer_deductions - allocated_other;
    else
      row_gross := floor(sale.gross_value * contributor.quantity / sale.quantity * 100) / 100;
      row_transport := case when sale.gross_value > 0
        then floor(seller_transport * row_gross / sale.gross_value * 100) / 100 else 0 end;
      row_other := case when sale.gross_value > 0
        then floor(sale.other_farmer_deductions * row_gross / sale.gross_value * 100) / 100 else 0 end;
    end if;
    net_value := row_gross - row_transport - row_other;
    if row_gross < 0 or row_transport < 0 or row_other < 0 or net_value < 0 then
      raise exception 'Group-sale allocation produced an invalid farmer settlement';
    end if;
    update public.fpo_group_sale_contributors
      set gross_amount = row_gross,
          transport_deduction = row_transport,
          other_deduction = row_other,
          net_proceeds = net_value
      where id = contributor.id;
    insert into public.fpo_settlements (
      sale_id, contributor_id, fpo_id, farmer_id, quantity,
      gross_amount, transport_deduction, other_deduction, net_amount
    ) values (
      sale.id, contributor.id, sale.fpo_id, contributor.farmer_id, contributor.quantity,
      row_gross, row_transport, row_other, net_value
    );
    update public.fpo_allocations
      set committed_quantity = committed_quantity + contributor.quantity,
          sold_quantity = sold_quantity + contributor.quantity,
          status = case when sold_quantity + contributor.quantity >= quantity then 'sold' else 'committed' end
      where id = contributor.allocation_id
        and committed_quantity + contributor.quantity <= quantity;
    if not found then raise exception 'FPO allocation changed before sale confirmation'; end if;
    update public.crop_listings set available_quantity = available_quantity, updated_at = now()
      where id = contributor.listing_id;
    allocated_gross := allocated_gross + row_gross;
    allocated_transport := allocated_transport + row_transport;
    allocated_other := allocated_other + row_other;
  end loop;

  update public.fpo_group_sales set status = 'confirmed', confirmed_at = now(), updated_at = now()
    where id = sale.id;
  insert into public.fpo_group_sale_events (sale_id, actor_id, event_type)
  values (sale.id, auth.uid(), 'confirmed');
  insert into public.audit_logs (actor_id, action, target_table, target_id, outcome, metadata)
  values (auth.uid(), 'confirm_fpo_group_sale', 'fpo_group_sales', sale.id, 'success',
    jsonb_build_object('quantity', sale.quantity, 'gross_value', sale.gross_value));
  perform public.notify_recipient(sale.buyer_id, 'fpo_group_sale_confirmed',
    'All contributors approved the group-sale terms; the group order is confirmed.',
    'fpo-sale:' || sale.id::text || ':confirmed:buyer');
  perform public.notify_recipient(
    (select f.authorized_admin_id from public.fpo_profiles f where f.id = sale.fpo_id),
    'fpo_group_sale_confirmed', 'The buyer and all contributing farmers approved the group sale.',
    'fpo-sale:' || sale.id::text || ':confirmed:fpo'
  );
  insert into public.notifications (recipient_id, notification_type, message, source_event_key)
  select c.farmer_id, 'fpo_settlement_pending',
    'Your group-sale quantity and estimated settlement are recorded; no payout has been made.',
    'fpo-sale:' || sale.id::text || ':settlement:' || c.id::text
  from public.fpo_group_sale_contributors c
  where c.sale_id = sale.id
  on conflict (source_event_key) where source_event_key is not null do nothing;
end;
$$;

create or replace function public.create_fpo_group_sale(
  target_campaign_id uuid,
  target_requirement_id uuid,
  requested_contributions jsonb,
  requested_unit_price numeric,
  requested_delivery_method text,
  requested_transport_provider text,
  requested_transport_cost numeric,
  requested_transport_payer text,
  requested_other_deductions numeric,
  request_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  campaign public.fpo_campaigns%rowtype;
  requirement public.buyer_requirements%rowtype;
  allocation public.fpo_allocations%rowtype;
  prior_sale public.fpo_group_sales%rowtype;
  contribution jsonb;
  result_id uuid;
  existing_id uuid;
  total_quantity numeric(14, 3) := 0;
  gross numeric(16, 2);
  item_quantity numeric(14, 3);
  item_allocation_id uuid;
  active_claimed numeric(14, 3);
begin
  if actor is null or request_id is null then raise exception 'Authentication and a request ID are required'; end if;
  if not exists (select 1 from public.profiles p where p.id = actor and p.role in ('fpo', 'admin') and p.account_status = 'active') then
    raise exception 'Active FPO administrator account required';
  end if;
  select * into campaign from public.fpo_campaigns where id = target_campaign_id for update;
  if not found or campaign.status <> 'open' or not public.is_fpo_admin(campaign.fpo_id) then
    raise exception 'Open campaign and authorized FPO administrator required';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(campaign.fpo_id::text || ':' || request_id::text, 0));
  select * into requirement from public.buyer_requirements where id = target_requirement_id for update;
  if not found or requirement.status <> 'open'
    or not exists (select 1 from public.profiles p where p.id = requirement.buyer_id and p.role = 'buyer' and p.account_status = 'active') then
    raise exception 'Open buyer requirement not found';
  end if;
  if lower(requirement.crop_type) <> lower(campaign.crop_type) or requirement.unit <> campaign.unit then
    raise exception 'Campaign crop and unit must match the buyer requirement';
  end if;
  if requirement.required_date < current_date then raise exception 'Buyer requirement delivery date has passed'; end if;
  if requested_unit_price is null or requested_unit_price <= 0 or round(requested_unit_price, 2) <> requested_unit_price then
    raise exception 'Enter a positive unit price with at most two decimal places';
  end if;
  if (requirement.budget_min is not null and requested_unit_price < requirement.budget_min)
    or (requirement.budget_max is not null and requested_unit_price > requirement.budget_max) then
    raise exception 'Agreed unit price must fit the buyer requirement budget';
  end if;
  if requested_delivery_method is null or requested_delivery_method not in ('buyer_pickup', 'farmer_delivery', 'third_party') then
    raise exception 'Choose a supported delivery method';
  end if;
  if requested_transport_cost is null or requested_transport_cost < 0
    or round(requested_transport_cost, 2) <> requested_transport_cost then
    raise exception 'Transport cost must be non-negative with at most two decimal places';
  end if;
  if requested_other_deductions is null or requested_other_deductions < 0
    or round(requested_other_deductions, 2) <> requested_other_deductions then
    raise exception 'Other agreed deductions must be non-negative with at most two decimal places';
  end if;
  if requested_transport_payer is null or requested_transport_payer not in ('buyer', 'farmer', 'third_party', 'none')
    or (requested_transport_cost > 0 and requested_transport_payer = 'none') then
    raise exception 'Choose who pays transport';
  end if;
  if requested_delivery_method = 'buyer_pickup'
    and (requested_transport_cost <> 0 or requested_transport_payer <> 'none' or nullif(trim(requested_transport_provider), '') is not null) then
    raise exception 'Buyer pickup has no separate transport provider or charge';
  end if;
  if requested_delivery_method = 'third_party'
    and (nullif(trim(requested_transport_provider), '') is null or requested_transport_payer = 'none') then
    raise exception 'Third-party transport requires a named provider and payer';
  end if;
  if requested_transport_provider is not null and char_length(trim(requested_transport_provider)) > 200 then
    raise exception 'Transport provider name is too long';
  end if;
  if requested_contributions is null or jsonb_typeof(requested_contributions) <> 'array' then
    raise exception 'Contributions must be a JSON array';
  end if;
  if jsonb_array_length(requested_contributions) = 0 or jsonb_array_length(requested_contributions) > 100 then
    raise exception 'Select between one and 100 farmer crop allocations';
  end if;
  select * into prior_sale from public.fpo_group_sales s
    where s.fpo_id = campaign.fpo_id and s.client_request_id = request_id;
  if found then
    if prior_sale.campaign_id <> campaign.id or prior_sale.buyer_requirement_id <> requirement.id
      or prior_sale.unit_price <> requested_unit_price
      or prior_sale.delivery_method <> requested_delivery_method
      or prior_sale.transport_provider is distinct from nullif(trim(requested_transport_provider), '')
      or prior_sale.transport_cost <> requested_transport_cost
      or prior_sale.transport_payer <> requested_transport_payer
      or prior_sale.other_farmer_deductions <> requested_other_deductions
      or (
        select jsonb_agg(jsonb_build_object('allocation_id', c.allocation_id, 'quantity', c.quantity) order by c.allocation_id)
        from public.fpo_group_sale_contributors c where c.sale_id = prior_sale.id
      ) is distinct from (
        select jsonb_agg(jsonb_build_object(
          'allocation_id', (entry.value ->> 'allocation_id')::uuid,
          'quantity', (entry.value ->> 'quantity')::numeric
        ) order by (entry.value ->> 'allocation_id')::uuid)
        from jsonb_array_elements(requested_contributions) entry(value)
      ) then
      raise exception 'Request ID was already used for different group-sale terms';
    end if;
    return prior_sale.id;
  end if;

  for contribution in
    select entry.value from jsonb_array_elements(requested_contributions) entry(value)
    order by (entry.value ->> 'allocation_id')::uuid
  loop
    begin
      item_allocation_id := (contribution ->> 'allocation_id')::uuid;
      item_quantity := (contribution ->> 'quantity')::numeric;
    exception when invalid_text_representation or numeric_value_out_of_range then
      raise exception 'Each contribution needs a valid allocation ID and quantity';
    end;
    if item_quantity is null or item_quantity <= 0 or round(item_quantity, 3) <> item_quantity then
      raise exception 'Contribution quantities must be positive with at most three decimal places';
    end if;
    select * into allocation from public.fpo_allocations
      where id = item_allocation_id for update;
    if not found or allocation.fpo_id <> campaign.fpo_id or allocation.campaign_id <> campaign.id
      or allocation.status not in ('allocated', 'committed') or allocation.consent_at is null then
      raise exception 'A selected allocation is no longer eligible for this campaign';
    end if;
    if not exists (
      select 1 from public.fpo_memberships m
      where m.fpo_id = campaign.fpo_id and m.farmer_id = allocation.farmer_id
        and m.status = 'active' and m.consent_at is not null
    ) then raise exception 'Every contributing farmer must have active, consented FPO membership'; end if;
    if not exists (
      select 1 from public.crop_listings l where l.id = allocation.listing_id
        and l.farmer_id = allocation.farmer_id and l.unit = campaign.unit
        and lower(l.crop_type) = lower(campaign.crop_type)
    ) then raise exception 'A selected allocation no longer matches the campaign crop'; end if;
    select coalesce(sum(c.quantity), 0) into active_claimed
      from public.fpo_group_sale_contributors c
      join public.fpo_group_sales s on s.id = c.sale_id
      where c.allocation_id = allocation.id and s.status = 'awaiting_approvals';
    if allocation.quantity - allocation.committed_quantity - active_claimed < item_quantity then
      raise exception 'Group sale quantity exceeds the uncommitted farmer allocation';
    end if;
    total_quantity := total_quantity + item_quantity;
  end loop;

  if (select count(distinct (entry.value ->> 'allocation_id')::uuid)
      from jsonb_array_elements(requested_contributions) entry(value)) <> jsonb_array_length(requested_contributions) then
    raise exception 'Select each farmer allocation only once';
  end if;
  if total_quantity > requirement.quantity then raise exception 'Group sale quantity exceeds the buyer requirement'; end if;
  gross := round(total_quantity * requested_unit_price, 2);
  if gross <= 0 then raise exception 'Group-sale gross value must be at least one cent'; end if;
  if requested_other_deductions + case when requested_transport_payer = 'farmer' then requested_transport_cost else 0 end > gross then
    raise exception 'Agreed farmer deductions exceed group-sale gross value';
  end if;

  insert into public.fpo_group_sales (
    fpo_id, campaign_id, buyer_requirement_id, buyer_id, client_request_id, crop_type, quantity, unit,
    unit_price, gross_value, delivery_method, transport_provider, transport_cost,
    transport_payer, other_farmer_deductions, buyer_total, created_by
  ) values (
    campaign.fpo_id, campaign.id, requirement.id, requirement.buyer_id, request_id,
    campaign.crop_type, total_quantity, campaign.unit, requested_unit_price, gross,
    requested_delivery_method, nullif(trim(requested_transport_provider), ''),
    requested_transport_cost, requested_transport_payer, requested_other_deductions,
    gross + case when requested_transport_payer = 'buyer' then requested_transport_cost else 0 end,
    actor
  ) returning id into result_id;

  for contribution in
    select entry.value from jsonb_array_elements(requested_contributions) entry(value)
    order by (entry.value ->> 'allocation_id')::uuid
  loop
    item_allocation_id := (contribution ->> 'allocation_id')::uuid;
    item_quantity := (contribution ->> 'quantity')::numeric;
    select * into allocation from public.fpo_allocations where id = item_allocation_id;
    insert into public.fpo_group_sale_contributors (
      sale_id, fpo_id, allocation_id, listing_id, farmer_id, quantity
    ) values (
      result_id, campaign.fpo_id, allocation.id, allocation.listing_id, allocation.farmer_id, item_quantity
    );
    perform public.notify_recipient(allocation.farmer_id, 'fpo_group_sale_consent',
      'Review the exact buyer price, transport and deductions before accepting this group sale.',
      'fpo-sale:' || result_id::text || ':consent:' || allocation.id::text);
  end loop;
  insert into public.fpo_group_sale_events (sale_id, actor_id, event_type)
  values (result_id, actor, 'proposed');
  perform public.notify_recipient(requirement.buyer_id, 'fpo_group_sale_proposal',
    'An FPO proposed a group sale for your buyer requirement. Review the terms and farmer approvals.',
    'fpo-sale:' || result_id::text || ':proposal:buyer');
  insert into public.audit_logs (actor_id, action, target_table, target_id, outcome)
  values (actor, 'create_fpo_group_sale', 'fpo_group_sales', result_id, 'success');
  return result_id;
end;
$$;

create or replace function public.respond_fpo_group_sale(target_sale_id uuid, consent_given boolean)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  sale public.fpo_group_sales%rowtype;
  contribution public.fpo_group_sale_contributors%rowtype;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  select * into sale from public.fpo_group_sales where id = target_sale_id for update;
  if not found or sale.status <> 'awaiting_approvals' then raise exception 'Group-sale proposal is not awaiting consent'; end if;
  if not exists (select 1 from public.profiles p where p.id = actor and p.role = 'farmer' and p.account_status = 'active') then
    raise exception 'Active farmer account required';
  end if;
  select * into contribution from public.fpo_group_sale_contributors
    where sale_id = sale.id and farmer_id = actor for update;
  if not found then raise exception 'You are not a contributing farmer in this group sale'; end if;
  if consent_given is distinct from true then
    update public.fpo_group_sales set status = 'rejected', updated_at = now() where id = sale.id;
    insert into public.fpo_group_sale_events (sale_id, actor_id, event_type)
    values (sale.id, actor, 'farmer_declined');
    perform public.notify_recipient(sale.buyer_id, 'fpo_group_sale_rejected',
      'A contributing farmer declined the group-sale terms; the proposal was cancelled.',
      'fpo-sale:' || sale.id::text || ':farmer-declined:buyer');
    perform public.notify_recipient(sale.created_by, 'fpo_group_sale_rejected',
      'A contributing farmer declined the group-sale terms; the proposal was cancelled.',
      'fpo-sale:' || sale.id::text || ':farmer-declined:fpo');
    return 'rejected';
  end if;
  if contribution.consent_at is not null then return sale.status; end if;
  update public.fpo_group_sale_contributors set consent_at = now() where id = contribution.id;
  insert into public.fpo_group_sale_events (sale_id, actor_id, event_type)
  values (sale.id, actor, 'farmer_approved');
  perform public.notify_recipient(sale.buyer_id, 'fpo_group_sale_farmer_approved',
    'A contributing farmer approved the group-sale terms.',
    'fpo-sale:' || sale.id::text || ':farmer-approved:' || contribution.id::text);
  perform public.finalize_fpo_group_sale(sale.id);
  select status into sale.status from public.fpo_group_sales where id = sale.id;
  return sale.status;
end;
$$;

create or replace function public.respond_to_fpo_group_sale(target_sale_id uuid, accept_terms boolean)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  sale public.fpo_group_sales%rowtype;
  requirement public.buyer_requirements%rowtype;
  first_acceptance boolean;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.profiles p where p.id = actor and p.role = 'buyer' and p.account_status = 'active') then
    raise exception 'Active buyer account required';
  end if;
  select * into sale from public.fpo_group_sales where id = target_sale_id for update;
  if not found or sale.buyer_id <> actor or sale.status <> 'awaiting_approvals' then
    raise exception 'Group-sale proposal not found or not available to this buyer';
  end if;
  if not accept_terms then
    update public.fpo_group_sales set status = 'rejected', updated_at = now() where id = sale.id;
    insert into public.fpo_group_sale_events (sale_id, actor_id, event_type)
    values (sale.id, actor, 'buyer_declined');
    perform public.notify_recipient(sale.created_by, 'fpo_group_sale_rejected',
      'The buyer declined the proposed group-sale terms.',
      'fpo-sale:' || sale.id::text || ':rejected:fpo');
    return 'rejected';
  end if;
  select * into requirement from public.buyer_requirements r
    where r.id = sale.buyer_requirement_id and r.buyer_id = actor for update;
  if not found or requirement.status <> 'open' or requirement.quantity < sale.quantity
      or lower(requirement.crop_type) <> lower(sale.crop_type) or requirement.unit <> sale.unit
      or requirement.required_date < current_date
      or (requirement.budget_min is not null and sale.unit_price < requirement.budget_min)
      or (requirement.budget_max is not null and sale.unit_price > requirement.budget_max) then
    raise exception 'Buyer requirement changed or closed; the proposed terms must be reviewed again';
  end if;
  first_acceptance := sale.buyer_accepted_at is null;
  update public.fpo_group_sales
    set buyer_accepted_at = coalesce(buyer_accepted_at, now()), updated_at = now()
    where id = sale.id;
  if first_acceptance then
    insert into public.fpo_group_sale_events (sale_id, actor_id, event_type)
    values (sale.id, actor, 'buyer_approved');
  end if;
  perform public.finalize_fpo_group_sale(sale.id);
  select status into sale.status from public.fpo_group_sales where id = sale.id;
  return sale.status;
end;
$$;

create or replace function public.cancel_fpo_group_sale(target_sale_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  sale public.fpo_group_sales%rowtype;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  select * into sale from public.fpo_group_sales where id = target_sale_id for update;
  if not found or sale.status <> 'awaiting_approvals' or not public.is_fpo_admin(sale.fpo_id) then
    raise exception 'Only the authorized FPO administrator can cancel an unconfirmed proposal';
  end if;
  update public.fpo_group_sales set status = 'cancelled', updated_at = now() where id = sale.id;
  insert into public.fpo_group_sale_events (sale_id, actor_id, event_type)
  values (sale.id, actor, 'cancelled');
  perform public.notify_recipient(sale.buyer_id, 'fpo_group_sale_cancelled',
    'The FPO cancelled the group-sale proposal before confirmation.',
    'fpo-sale:' || sale.id::text || ':cancelled:buyer');
end;
$$;

create or replace function public.transition_fpo_group_sale(target_sale_id uuid, requested_action text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  sale public.fpo_group_sales%rowtype;
begin
  if actor is null or requested_action <> 'delivered' then raise exception 'Choose a supported group-sale action'; end if;
  if not exists (select 1 from public.profiles p where p.id = actor and p.role = 'buyer' and p.account_status = 'active') then
    raise exception 'Active buyer account required';
  end if;
  select * into sale from public.fpo_group_sales where id = target_sale_id for update;
  if not found or sale.buyer_id <> actor or sale.status <> 'confirmed' then
    raise exception 'Only the buyer can confirm delivery of a confirmed group sale';
  end if;
  update public.fpo_group_sales set status = 'delivered', delivered_at = now(), updated_at = now()
    where id = sale.id;
  insert into public.fpo_group_sale_events (sale_id, actor_id, event_type)
  values (sale.id, actor, 'delivered');
  return 'delivered';
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
    select committed + coalesce(sum(
      case when a.status = 'sold' then a.sold_quantity else a.quantity end
    ), 0) into committed
      from public.fpo_allocations a
      where a.listing_id = old.id and a.status in ('allocated', 'committed', 'sold');
    if new.quantity < committed then
      raise exception 'Listing quantity cannot be less than committed orders and FPO allocations';
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
  if allocation.status <> 'allocated' or allocation.committed_quantity <> 0 or allocation.sold_quantity <> 0 then
    raise exception 'Only an unused, uncommitted allocation can be withdrawn';
  end if;
  if exists (
    select 1 from public.fpo_group_sale_contributors c
    join public.fpo_group_sales s on s.id = c.sale_id
    where c.allocation_id = allocation.id and s.status = 'awaiting_approvals'
  ) then raise exception 'The FPO must cancel pending group-sale proposals before allocation withdrawal'; end if;
  update public.fpo_allocations set status = 'released' where id = allocation.id;
  update public.crop_listings set available_quantity = available_quantity, updated_at = now()
    where id = allocation.listing_id;
end;
$$;

revoke all on function public.finalize_fpo_group_sale(uuid) from public, anon, authenticated;
revoke all on function public.create_fpo_group_sale(uuid,uuid,jsonb,numeric,text,text,numeric,text,numeric,uuid) from public, anon;
grant execute on function public.create_fpo_group_sale(uuid,uuid,jsonb,numeric,text,text,numeric,text,numeric,uuid) to authenticated;
revoke all on function public.respond_fpo_group_sale(uuid,boolean) from public, anon;
grant execute on function public.respond_fpo_group_sale(uuid,boolean) to authenticated;
revoke all on function public.respond_to_fpo_group_sale(uuid,boolean) from public, anon;
grant execute on function public.respond_to_fpo_group_sale(uuid,boolean) to authenticated;
revoke all on function public.cancel_fpo_group_sale(uuid) from public, anon;
grant execute on function public.cancel_fpo_group_sale(uuid) to authenticated;
revoke all on function public.transition_fpo_group_sale(uuid,text) from public, anon;
grant execute on function public.transition_fpo_group_sale(uuid,text) to authenticated;

do $$
begin
  if has_table_privilege('authenticated', 'public.fpo_group_sales', 'INSERT')
    or has_table_privilege('authenticated', 'public.fpo_group_sales', 'UPDATE')
    or has_table_privilege('authenticated', 'public.fpo_group_sale_contributors', 'INSERT')
    or has_table_privilege('authenticated', 'public.fpo_settlements', 'INSERT')
    or has_table_privilege('authenticated', 'public.fpo_settlements', 'UPDATE')
    or has_table_privilege('authenticated', 'public.fpo_group_sale_events', 'INSERT') then
    raise exception 'FPO sale and settlement writes must use trusted database functions';
  end if;
  if not has_function_privilege('authenticated', 'public.create_fpo_group_sale(uuid,uuid,jsonb,numeric,text,text,numeric,text,numeric,uuid)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.respond_fpo_group_sale(uuid,boolean)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.respond_to_fpo_group_sale(uuid,boolean)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.cancel_fpo_group_sale(uuid)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.transition_fpo_group_sale(uuid,text)', 'EXECUTE') then
    raise exception 'FPO group-sale RPC privileges are incomplete';
  end if;
end;
$$;
