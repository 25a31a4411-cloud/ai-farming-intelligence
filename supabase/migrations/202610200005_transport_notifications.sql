alter table public.transport_requests
  add column if not exists requester_id uuid references public.profiles(id),
  add column if not exists client_request_id uuid,
  add column if not exists requested_date date,
  add column if not exists accepted_at timestamptz,
  add column if not exists picked_up_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists cancelled_at timestamptz;

alter table public.transport_requests
  drop constraint if exists transport_requests_payer_check,
  add constraint transport_requests_payer_check check (payer in ('buyer', 'farmer', 'third_party', 'none')),
  drop constraint if exists transport_requests_pickup_terms_check,
  add constraint transport_requests_pickup_terms_check
    check (status = 'cancelled' or payer <> 'none' or agreed_cost = 0);

create unique index if not exists transport_requests_requester_idempotency_unique
  on public.transport_requests (requester_id, client_request_id)
  where requester_id is not null and client_request_id is not null;
create unique index if not exists transport_requests_one_active_per_order
  on public.transport_requests (order_id)
  where status in ('requested', 'accepted', 'pickup', 'in_transit', 'issue');

create table public.transport_events (
  id uuid primary key default gen_random_uuid(),
  transport_request_id uuid not null references public.transport_requests(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  event_type text not null check (event_type in ('requested', 'accepted', 'pickup', 'in_transit', 'delivered', 'issue', 'cancelled')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.transport_events enable row level security;
alter table public.transport_requests force row level security;
create policy transport_events_order_party_read on public.transport_events for select to authenticated
  using (exists (
    select 1 from public.transport_requests tr
    join public.orders o on o.id = tr.order_id
    where tr.id = transport_request_id
      and (o.buyer_id = (select auth.uid()) or o.farmer_id = (select auth.uid())
        or (select public.current_app_role()) = 'admin')
  ));

alter table public.notifications add column if not exists source_event_key text;
create unique index if not exists notifications_source_event_key_unique
  on public.notifications (source_event_key) where source_event_key is not null;
create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_id, created_at desc) where read_at is null;
create unique index if not exists payments_provider_reference_unique
  on public.payments (provider, provider_reference)
  where provider is not null and provider_reference is not null;

revoke insert, update, delete on public.transport_requests, public.transport_events from authenticated;
revoke insert, update, delete on public.notifications, public.payments from authenticated;
grant select on public.transport_requests, public.transport_events, public.notifications, public.payments to authenticated;

create or replace function public.notify_recipient(target_id uuid, target_type text, target_message text, target_key text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (recipient_id, notification_type, message, source_event_key)
  select target_id, target_type, left(target_message, 240), target_key
  where target_id is not null and target_id is distinct from (select auth.uid())
  on conflict (source_event_key) where source_event_key is not null do nothing
$$;

create or replace function public.notify_offer_parties()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient uuid;
  notification_type text;
  notification_message text;
  event_key text;
begin
  if tg_op = 'INSERT' then
    recipient := new.farmer_id;
    notification_type := 'offer_received';
    notification_message := 'A buyer sent an offer for your crop listing.';
    event_key := 'offer:' || new.id::text || ':created:' || recipient::text;
  elsif new.status is distinct from old.status then
    if new.status = 'countered' then
      recipient := case when new.last_responded_by = new.buyer_id then new.farmer_id else new.buyer_id end;
      notification_type := 'counter_offer_received';
      notification_message := 'The other party sent a counter-offer.';
      event_key := 'offer:' || new.id::text || ':counter:' || new.updated_at::text || ':' || recipient::text;
    elsif new.status = 'rejected' then
      recipient := case when new.last_responded_by = new.buyer_id then new.farmer_id else new.buyer_id end;
      notification_type := 'offer_rejected';
      notification_message := 'The other party rejected the offer.';
      event_key := 'offer:' || new.id::text || ':rejected:' || recipient::text;
    else
      return new;
    end if;
  else
    return new;
  end if;
  perform public.notify_recipient(recipient, notification_type, notification_message, event_key);
  return new;
end;
$$;

create trigger notify_offer_parties_trigger
  after insert or update on public.offers
  for each row execute function public.notify_offer_parties();

create or replace function public.notify_order_parties()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.orders%rowtype;
  event_label text;
begin
  select * into target from public.orders where id = new.order_id;
  if not found then return new; end if;
  event_label := left(replace(new.event_type, '_', ' '), 100);
  insert into public.notifications (recipient_id, notification_type, message, source_event_key)
  select recipient_id,
    case when new.event_type = 'offer_accepted' then 'offer_accepted' else 'order_status' end,
    case when new.event_type = 'offer_accepted' then 'Your offer was accepted and an order was created.'
      else 'Order update: ' || event_label || '.' end,
    'order-event:' || new.id::text || ':' || recipient_id::text
  from (values (target.buyer_id), (target.farmer_id)) recipients(recipient_id)
  where recipient_id is distinct from new.actor_id
  on conflict (source_event_key) where source_event_key is not null do nothing;
  return new;
end;
$$;

create trigger notify_order_events_trigger
  after insert on public.order_events
  for each row execute function public.notify_order_parties();

create or replace function public.notify_transport_parties()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_order public.orders%rowtype;
begin
  select o.* into target_order
  from public.transport_requests tr
  join public.orders o on o.id = tr.order_id
  where tr.id = new.transport_request_id;
  if not found then return new; end if;
  insert into public.notifications (recipient_id, notification_type, message, source_event_key)
  select recipient_id, 'transport_status',
    'Delivery update: ' || replace(new.event_type, '_', ' ') || '.',
    'transport-event:' || new.id::text || ':' || recipient_id::text
  from (values (target_order.buyer_id), (target_order.farmer_id)) recipients(recipient_id)
  where recipient_id is distinct from new.actor_id
  on conflict (source_event_key) where source_event_key is not null do nothing;
  return new;
end;
$$;

create trigger notify_transport_events_trigger
  after insert on public.transport_events
  for each row execute function public.notify_transport_parties();

create or replace function public.cancel_unstarted_order_transport()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cancelled_transport record;
begin
  if new.status = 'cancelled' and old.status is distinct from new.status then
    for cancelled_transport in
      update public.transport_requests
      set status = 'cancelled', cancelled_at = now(), updated_at = now()
      where order_id = new.id and status in ('requested', 'accepted', 'issue')
      returning id
    loop
      insert into public.transport_events (transport_request_id, actor_id, event_type, details)
      values (cancelled_transport.id, auth.uid(), 'cancelled', jsonb_build_object('reason', 'order_cancelled'));
    end loop;
  end if;
  return new;
end;
$$;

create trigger cancel_unstarted_order_transport_trigger
  after update of status on public.orders
  for each row execute function public.cancel_unstarted_order_transport();

create or replace function public.notify_requirement_parties()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  listing_farmer uuid;
begin
  if tg_op = 'INSERT' and new.status = 'open' then
    for listing_farmer in
      select distinct c.farmer_id
      from public.crop_listings c
      where c.status = 'available'
        and c.available_quantity >= new.quantity
        and lower(c.crop_type) = lower(new.crop_type)
        and c.unit = new.unit
        and c.harvest_date <= new.required_date
        and (new.required_variety is null or lower(coalesce(c.variety, '')) = lower(new.required_variety))
    loop
      insert into public.notifications (recipient_id, notification_type, message, source_event_key)
      values (listing_farmer, 'procurement_match', 'A buyer requirement may match one of your crop listings.',
        'requirement:' || new.id::text || ':farmer:' || listing_farmer::text)
      on conflict (source_event_key) where source_event_key is not null do nothing;
    end loop;
    return new;
  end if;
  if tg_op = 'UPDATE' and (new.status is distinct from old.status or new.updated_at is distinct from old.updated_at) then
    insert into public.notifications (recipient_id, notification_type, message, source_event_key)
    values (new.buyer_id, 'procurement_updated', 'Your procurement requirement was updated.',
      'requirement:' || new.id::text || ':updated:' || new.updated_at::text)
    on conflict (source_event_key) where source_event_key is not null do nothing;
  end if;
  return new;
end;
$$;

create trigger notify_buyer_requirements_trigger
  after insert or update on public.buyer_requirements
  for each row execute function public.notify_requirement_parties();

create or replace function public.notify_fpo_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  administrator_id uuid;
  farmer_id_value uuid;
  event_key text;
begin
  if tg_table_name = 'fpo_memberships' then
    select f.authorized_admin_id into administrator_id from public.fpo_profiles f where f.id = new.fpo_id;
    if tg_op = 'INSERT' then
      perform public.notify_recipient(administrator_id, 'membership_request',
        'A farmer requested FPO membership with consent.',
        'membership:' || new.id::text || ':requested:' || administrator_id::text);
    elsif new.status is distinct from old.status then
      perform public.notify_recipient(new.farmer_id, 'membership_status',
        'Your FPO membership request status changed.',
        'membership:' || new.id::text || ':status:' || new.status);
    end if;
  elsif tg_table_name = 'fpo_allocations' then
    select f.authorized_admin_id into administrator_id from public.fpo_profiles f where f.id = new.fpo_id;
    if tg_op = 'INSERT' then
      perform public.notify_recipient(administrator_id, 'allocation_consent',
        'A farmer consented to contribute crop quantity to an FPO campaign.',
        'allocation:' || new.id::text || ':created:' || administrator_id::text);
    elsif new.status is distinct from old.status then
      perform public.notify_recipient(new.farmer_id, 'allocation_status',
        'Your FPO crop allocation status changed.',
        'allocation:' || new.id::text || ':status:' || new.status);
    end if;
  end if;
  return new;
end;
$$;

create trigger notify_fpo_memberships_trigger
  after insert or update on public.fpo_memberships
  for each row execute function public.notify_fpo_events();
create trigger notify_fpo_allocations_trigger
  after insert or update on public.fpo_allocations
  for each row execute function public.notify_fpo_events();

create or replace function public.request_order_transport(
  target_order_id uuid,
  requested_provider text,
  requested_pickup text,
  requested_destination text,
  requested_date date,
  requested_cost numeric,
  requested_payer text,
  request_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target public.orders%rowtype;
  prior public.transport_requests%rowtype;
  transport_id uuid;
  route_value jsonb;
begin
  if actor is null or request_id is null then raise exception 'Authentication and a request ID are required'; end if;
  if requested_payer is null or requested_payer not in ('buyer', 'farmer', 'third_party', 'none') then
    raise exception 'Choose a valid transport payer';
  end if;
  select * into target from public.orders where id = target_order_id for update;
  if not found or actor not in (target.buyer_id, target.farmer_id) then raise exception 'Order not found or not authorized'; end if;
  if not exists (select 1 from public.profiles p where p.id = actor and p.account_status = 'active'
    and ((actor = target.buyer_id and p.role = 'buyer') or (actor = target.farmer_id and p.role = 'farmer'))) then
    raise exception 'Active order party required';
  end if;
  if target.status not in ('confirmed', 'awaiting_pickup') then raise exception 'Transport can only be arranged before transit'; end if;
  if requested_date is null or requested_date < current_date then raise exception 'Requested delivery date must be today or later'; end if;
  if nullif(trim(requested_pickup), '') is null or char_length(trim(requested_pickup)) > 240
    or nullif(trim(requested_destination), '') is null or char_length(trim(requested_destination)) > 240 then
    raise exception 'Pickup and destination are required (240 characters maximum)';
  end if;
  if requested_cost is null or requested_cost < 0 or round(requested_cost, 2) <> requested_cost then
    raise exception 'Transport cost must be a non-negative amount with at most two decimal places';
  end if;
  route_value := jsonb_build_object('pickup', trim(requested_pickup), 'destination', trim(requested_destination));
  select * into prior from public.transport_requests
    where requester_id = actor and client_request_id = request_id;
  if found then
    if prior.order_id <> target_order_id or prior.provider is distinct from nullif(trim(requested_provider), '')
      or prior.route <> route_value or prior.requested_date is distinct from requested_date
      or prior.agreed_cost <> requested_cost or prior.payer <> requested_payer then
      raise exception 'Request ID was already used for different transport terms';
    end if;
    return prior.id;
  end if;

  if target.transport_method = 'buyer_pickup' then
    if requested_cost <> 0 or requested_payer <> 'none' or nullif(trim(requested_provider), '') is not null then
      raise exception 'Buyer pickup has no separate transport provider or charge';
    end if;
  else
    if requested_cost <> target.transport_cost or requested_payer <> target.transport_payer then
      raise exception 'Transport terms must match the agreed order snapshot; renegotiation is unavailable';
    end if;
    if target.transport_method = 'third_party'
      and nullif(trim(requested_provider), '') is distinct from target.transport_provider then
      raise exception 'Use the third-party provider recorded in the accepted offer';
    end if;
    if target.transport_method <> 'third_party' and nullif(trim(requested_provider), '') is not null then
      raise exception 'A transport provider can only be recorded for third-party transport';
    end if;
  end if;
  if requested_provider is not null and char_length(trim(requested_provider)) > 200 then raise exception 'Provider name is too long'; end if;
  insert into public.transport_requests (
    order_id, provider, route, agreed_cost, payer, status, requester_id, client_request_id, requested_date
  ) values (
    target_order_id, nullif(trim(requested_provider), ''), route_value, requested_cost, requested_payer,
    'requested', actor, request_id, requested_date
  ) returning id into transport_id;
  insert into public.transport_events (transport_request_id, actor_id, event_type, details)
  values (transport_id, actor, 'requested', jsonb_build_object('requested_date', requested_date));
  return transport_id;
end;
$$;

create or replace function public.transition_order_transport(target_transport_id uuid, requested_action text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  transport public.transport_requests%rowtype;
  target public.orders%rowtype;
  next_status text;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  select * into transport from public.transport_requests where id = target_transport_id;
  if not found then raise exception 'Transport request not found'; end if;
  select * into target from public.orders where id = transport.order_id for update;
  if not found or actor not in (target.buyer_id, target.farmer_id) then raise exception 'Order party required'; end if;
  select * into transport from public.transport_requests
    where id = target_transport_id and order_id = target.id for update;
  if not found then raise exception 'Transport request no longer exists for this order'; end if;
  if target.status not in ('confirmed', 'awaiting_pickup', 'in_transit', 'delivered')
    or (target.status = 'delivered' and requested_action <> 'delivered') then
    raise exception 'Transport cannot change after the order is completed, cancelled, or disputed';
  end if;
  if not exists (select 1 from public.profiles p where p.id = actor and p.account_status = 'active'
    and ((actor = target.buyer_id and p.role = 'buyer') or (actor = target.farmer_id and p.role = 'farmer'))) then
    raise exception 'Active order party required';
  end if;

  if requested_action = 'accept' and transport.status = 'requested' and actor <> transport.requester_id then
    next_status := 'accepted';
  elsif requested_action = 'pickup' and transport.status = 'accepted' and actor = target.farmer_id then
    next_status := 'pickup';
  elsif requested_action = 'in_transit' and transport.status = 'pickup' and actor = target.farmer_id
    and target.transport_method <> 'buyer_pickup' then
    next_status := 'in_transit';
  elsif requested_action = 'delivered' and actor = target.buyer_id and (
    transport.status = 'in_transit' or (target.transport_method = 'buyer_pickup' and transport.status in ('accepted', 'pickup'))
  ) then
    next_status := 'delivered';
  elsif requested_action = 'issue' and transport.status in ('requested', 'accepted', 'pickup', 'in_transit') then
    next_status := 'issue';
  elsif requested_action = 'cancel' and transport.status in ('requested', 'accepted', 'issue')
    and (transport.status <> 'requested' or actor = transport.requester_id) then
    next_status := 'cancelled';
  else
    raise exception 'Transport action is not allowed for this party or current status';
  end if;

  update public.transport_requests set
    status = next_status,
    accepted_at = case when next_status = 'accepted' then now() else accepted_at end,
    picked_up_at = case when next_status = 'pickup' then now() else picked_up_at end,
    delivered_at = case when next_status = 'delivered' then now() else delivered_at end,
    cancelled_at = case when next_status = 'cancelled' then now() else cancelled_at end,
    updated_at = now()
    where id = target_transport_id;
  insert into public.transport_events (transport_request_id, actor_id, event_type, details)
  values (target_transport_id, actor, next_status, jsonb_build_object('previous_status', transport.status));
  return next_status;
end;
$$;

create or replace function public.mark_notification_read(target_notification_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  result timestamptz;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.notifications set read_at = coalesce(read_at, now())
    where id = target_notification_id and recipient_id = auth.uid()
    returning read_at into result;
  if result is null then raise exception 'Notification not found or not owned by this account'; end if;
  return result;
end;
$$;

revoke all on function public.notify_recipient(uuid,text,text,text) from public, anon, authenticated;
revoke all on function public.notify_offer_parties() from public, anon, authenticated;
revoke all on function public.notify_order_parties() from public, anon, authenticated;
revoke all on function public.notify_transport_parties() from public, anon, authenticated;
revoke all on function public.notify_requirement_parties() from public, anon, authenticated;
revoke all on function public.notify_fpo_events() from public, anon, authenticated;
revoke all on function public.cancel_unstarted_order_transport() from public, anon, authenticated;
revoke all on function public.request_order_transport(uuid,text,text,text,date,numeric,text,uuid) from public, anon;
grant execute on function public.request_order_transport(uuid,text,text,text,date,numeric,text,uuid) to authenticated;
revoke all on function public.transition_order_transport(uuid,text) from public, anon;
grant execute on function public.transition_order_transport(uuid,text) to authenticated;
revoke all on function public.mark_notification_read(uuid) from public, anon;
grant execute on function public.mark_notification_read(uuid) to authenticated;

do $$
begin
  if has_table_privilege('authenticated', 'public.transport_requests', 'INSERT')
    or has_table_privilege('authenticated', 'public.transport_requests', 'UPDATE')
    or has_table_privilege('authenticated', 'public.transport_events', 'INSERT')
    or has_table_privilege('authenticated', 'public.notifications', 'UPDATE')
    or has_table_privilege('authenticated', 'public.payments', 'INSERT')
    or has_table_privilege('authenticated', 'public.payments', 'UPDATE') then
    raise exception 'Transport, notifications and payment state must use trusted operations';
  end if;
  if not has_function_privilege('authenticated', 'public.request_order_transport(uuid,text,text,text,date,numeric,text,uuid)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.transition_order_transport(uuid,text)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.mark_notification_read(uuid)', 'EXECUTE') then
    raise exception 'Transport and notification RPCs are unavailable';
  end if;
end;
$$;
