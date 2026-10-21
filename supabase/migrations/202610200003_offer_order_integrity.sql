alter table public.offers
  add column if not exists client_request_id uuid;

create unique index if not exists offers_buyer_request_id_unique
  on public.offers (buyer_id, client_request_id)
  where client_request_id is not null;

drop policy if exists offers_buyer_insert on public.offers;

create or replace function public.create_offer(
  target_listing_id uuid,
  requested_quantity numeric,
  requested_unit_price numeric,
  requested_delivery_method text,
  requested_transport_provider text,
  requested_transport_cost numeric,
  requested_transport_payer text,
  requested_farmer_charges numeric,
  request_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actor_role public.app_role;
  listing public.crop_listings%rowtype;
  new_offer_id uuid;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  select p.role into actor_role
    from public.profiles p
    where p.id = actor and p.account_status = 'active';
  if actor_role is distinct from 'buyer' then raise exception 'Only active buyers can create offers'; end if;
  if request_id is null then raise exception 'An idempotency request ID is required'; end if;
  if requested_quantity is null or requested_quantity <= 0
    or requested_unit_price is null or requested_unit_price <= 0 then
    raise exception 'Offer quantity and unit price must be greater than zero';
  end if;
  if requested_delivery_method not in ('buyer_pickup', 'farmer_delivery', 'third_party') then
    raise exception 'Unsupported delivery method';
  end if;
  if requested_transport_cost is null or requested_transport_cost < 0
    or requested_farmer_charges is null or requested_farmer_charges < 0 then
    raise exception 'Transport and agreed farmer charges cannot be negative';
  end if;
  if requested_delivery_method = 'buyer_pickup' and requested_transport_cost <> 0 then
    raise exception 'Buyer pickup cannot include a separate transport charge';
  end if;
  if requested_delivery_method = 'buyer_pickup' and requested_transport_payer <> 'none' then
    raise exception 'Buyer pickup has no separate transport payer';
  end if;
  if requested_delivery_method = 'third_party'
    and (nullif(trim(requested_transport_provider), '') is null or requested_transport_payer = 'none') then
    raise exception 'Third-party transport requires a provider and agreed payer';
  end if;
  if requested_transport_payer not in ('buyer', 'farmer', 'third_party', 'none')
    or (requested_transport_cost > 0 and requested_transport_payer = 'none') then
    raise exception 'Choose who pays the agreed transport cost';
  end if;
  if round(requested_quantity * requested_unit_price, 2) < requested_farmer_charges
    + case when requested_delivery_method <> 'buyer_pickup' and requested_transport_payer = 'farmer'
      then requested_transport_cost else 0 end then
    raise exception 'Farmer deductions cannot exceed the gross crop value';
  end if;

  select o.id into new_offer_id from public.offers o
    where o.buyer_id = actor and o.client_request_id = request_id;
  if new_offer_id is not null then return new_offer_id; end if;

  select * into listing from public.crop_listings
    where id = target_listing_id
    for update;
  if not found or listing.status <> 'available' then raise exception 'Crop listing is unavailable'; end if;
  select o.id into new_offer_id from public.offers o
    where o.buyer_id = actor and o.client_request_id = request_id;
  if new_offer_id is not null then return new_offer_id; end if;
  if listing.farmer_id = actor then raise exception 'You cannot make an offer on your own crop listing'; end if;
  if listing.available_quantity < requested_quantity then raise exception 'Offer quantity exceeds available stock'; end if;
  if listing.available_quantity <= 0 then raise exception 'Crop listing has no available stock'; end if;

  insert into public.offers (
    buyer_id, farmer_id, listing_id, quantity, unit, unit_price,
    delivery_method, transport_provider, transport_cost, transport_payer,
    other_farmer_charges, last_responded_by, client_request_id
  ) values (
    actor, listing.farmer_id, listing.id, requested_quantity, listing.unit, requested_unit_price,
    requested_delivery_method, nullif(trim(requested_transport_provider), ''), requested_transport_cost,
    requested_transport_payer, requested_farmer_charges, actor, request_id
  ) returning id into new_offer_id;

  insert into public.audit_logs (actor_id, action, target_table, target_id, outcome)
  values (actor, 'create_offer', 'offers', new_offer_id, 'success');
  return new_offer_id;
end;
$$;

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
    insert into public.audit_logs (actor_id, action, target_table, target_id, outcome)
    values (actor, 'expire_offer', 'offers', target_offer_id, 'expired');
    return null;
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
  if target.expires_at is not null and target.expires_at <= now() then
    update public.offers set status = 'expired', updated_at = now() where id = target_offer_id;
    insert into public.audit_logs (actor_id, action, target_table, target_id, outcome)
    values (actor, 'expire_offer', 'offers', target_offer_id, 'expired');
    return;
  end if;
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

create or replace function public.transition_order(target_order_id uuid, requested_action text)
returns public.order_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actor_role public.app_role;
  target public.orders%rowtype;
  next_status public.order_status;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  select p.role into actor_role from public.profiles p where p.id = actor and p.account_status = 'active';
  if actor_role is null then raise exception 'Active profile required'; end if;
  select * into target from public.orders where id = target_order_id for update;
  if not found or (actor <> target.farmer_id and actor <> target.buyer_id) then raise exception 'Order not found'; end if;
  if actor = target.farmer_id and actor_role <> 'farmer' then raise exception 'Farmer role required'; end if;
  if actor = target.buyer_id and actor_role <> 'buyer' then raise exception 'Buyer role required'; end if;

  if requested_action = 'ready' and target.status = 'confirmed' and actor = target.farmer_id then
    next_status := 'awaiting_pickup';
  elsif requested_action = 'pickup' and target.status = 'awaiting_pickup' and actor = target.buyer_id then
    next_status := 'in_transit';
  elsif requested_action = 'delivered' and target.status = 'in_transit' and actor = target.buyer_id then
    next_status := 'delivered';
  elsif requested_action = 'cancel' and target.status in ('confirmed', 'awaiting_pickup') then
    next_status := 'cancelled';
  elsif requested_action = 'dispute' and target.status in ('confirmed', 'awaiting_pickup', 'in_transit', 'delivered') then
    next_status := 'disputed';
  else
    raise exception 'This order action is not allowed for the current status and account';
  end if;

  update public.orders set status = next_status, updated_at = now() where id = target_order_id;
  if next_status = 'cancelled' then
    update public.crop_listings set quantity = quantity, updated_at = now() where id = target.listing_id;
  end if;
  insert into public.order_events (order_id, actor_id, event_type, details)
  values (target_order_id, actor, requested_action, jsonb_build_object('from', target.status, 'to', next_status));
  insert into public.audit_logs (actor_id, action, target_table, target_id, outcome)
  values (actor, 'transition_order_' || requested_action, 'orders', target_order_id, 'success');
  return next_status;
end;
$$;

create or replace function public.submit_quality_assessment(
  target_listing_id uuid,
  target_image_path text,
  target_latitude numeric,
  target_longitude numeric,
  target_accuracy_m numeric,
  target_photo_captured_at timestamptz,
  target_gps_captured_at timestamptz,
  target_consent_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  new_assessment_id uuid := gen_random_uuid();
  listing_owner uuid;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  select c.farmer_id into listing_owner from public.crop_listings c
    where c.id = target_listing_id and c.status <> 'archived';
  if listing_owner is distinct from actor then raise exception 'Crop listing not found or not owned by this account'; end if;
  if target_image_path is null or target_image_path !~ ('^' || actor::text || '/[0-9a-fA-F-]{36}\.jpg$') then
    raise exception 'Evidence image path must be a private assessment image owned by this account';
  end if;
  if target_latitude is null or target_latitude < -90 or target_latitude > 90
    or target_longitude is null or target_longitude < -180 or target_longitude > 180 then
    raise exception 'GPS coordinates are invalid';
  end if;
  if target_accuracy_m is null or target_accuracy_m < 0 or target_accuracy_m > 100 then
    raise exception 'GPS accuracy must be within 100 meters';
  end if;
  if target_photo_captured_at is null or target_gps_captured_at is null or target_consent_at is null then
    raise exception 'Photo, GPS, and informed consent timestamps are required';
  end if;
  if target_photo_captured_at > now() + interval '5 minutes'
    or target_gps_captured_at > now() + interval '5 minutes'
    or target_photo_captured_at < now() - interval '10 minutes'
    or target_gps_captured_at < now() - interval '10 minutes' then
    raise exception 'Photo and GPS evidence must be recent';
  end if;
  if not exists (
    select 1 from storage.objects o
    where o.bucket_id = 'quality-evidence' and o.name = target_image_path
      and (storage.foldername(o.name))[1] = actor::text
  ) then raise exception 'Private evidence upload was not found'; end if;

  insert into public.quality_assessments (
    id, listing_id, farmer_id, image_path, latitude, longitude, gps_accuracy_m,
    photo_captured_at, gps_captured_at, submitted_at, consent_at,
    result, limitations
  ) values (
    new_assessment_id, target_listing_id, actor, target_image_path, target_latitude,
    target_longitude, target_accuracy_m, target_photo_captured_at, target_gps_captured_at,
    now(), target_consent_at,
    '{"grade":null,"confidence":null,"observations":[],"message":"No image-analysis model is configured."}'::jsonb,
    'Browser camera and GPS do not prove authenticity or establish internal moisture, pesticide residues, hidden defects, or laboratory-grade quality.'
  );
  insert into public.audit_logs (actor_id, action, target_table, target_id, outcome)
  values (actor, 'submit_quality_assessment', 'quality_assessments', new_assessment_id, 'success');
  return new_assessment_id;
end;
$$;

revoke insert on public.quality_assessments from authenticated;
revoke all on public.offers from authenticated;
grant select on public.offers to authenticated;
revoke all on function public.create_offer(uuid, numeric, numeric, text, text, numeric, text, numeric, uuid) from public, anon;
grant execute on function public.create_offer(uuid, numeric, numeric, text, text, numeric, text, numeric, uuid) to authenticated;
revoke all on function public.accept_offer(uuid) from public, anon;
grant execute on function public.accept_offer(uuid) to authenticated;
revoke all on function public.respond_to_offer(uuid, text, numeric) from public, anon;
grant execute on function public.respond_to_offer(uuid, text, numeric) to authenticated;
revoke all on function public.transition_order(uuid, text) from public, anon;
grant execute on function public.transition_order(uuid, text) to authenticated;
revoke all on function public.submit_quality_assessment(uuid, text, numeric, numeric, numeric, timestamptz, timestamptz, timestamptz) from public, anon;
grant execute on function public.submit_quality_assessment(uuid, text, numeric, numeric, numeric, timestamptz, timestamptz, timestamptz) to authenticated;

do $$
begin
  if has_table_privilege('authenticated', 'public.offers', 'INSERT')
    or has_table_privilege('authenticated', 'public.orders', 'INSERT')
    or has_table_privilege('authenticated', 'public.orders', 'UPDATE')
    or has_table_privilege('authenticated', 'public.quality_assessments', 'INSERT') then
    raise exception 'Marketplace writes must use authenticated RPCs';
  end if;
  if not has_function_privilege('authenticated', 'public.create_offer(uuid,numeric,numeric,text,text,numeric,text,numeric,uuid)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.accept_offer(uuid)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.respond_to_offer(uuid,text,numeric)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.transition_order(uuid,text)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.submit_quality_assessment(uuid,text,numeric,numeric,numeric,timestamptz,timestamptz,timestamptz)', 'EXECUTE') then
    raise exception 'Required authenticated marketplace RPC is not executable';
  end if;
  if has_function_privilege('anon', 'public.create_offer(uuid,numeric,numeric,text,text,numeric,text,numeric,uuid)', 'EXECUTE')
    or has_function_privilege('anon', 'public.transition_order(uuid,text)', 'EXECUTE')
    or has_function_privilege('anon', 'public.submit_quality_assessment(uuid,text,numeric,numeric,numeric,timestamptz,timestamptz,timestamptz)', 'EXECUTE') then
    raise exception 'Anonymous users must not execute marketplace or quality RPCs';
  end if;
  if exists (select 1 from storage.buckets where id = 'quality-evidence' and public) then
    raise exception 'Quality evidence bucket must remain private';
  end if;
end;
$$;
