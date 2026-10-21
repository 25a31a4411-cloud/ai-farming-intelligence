do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'farmer_profiles', 'buyer_profiles', 'fpo_profiles',
    'crop_listings', 'quality_assessments', 'market_prices',
    'buyer_requirements', 'offers', 'orders', 'order_events',
    'payments', 'transport_requests', 'fpo_memberships',
    'fpo_allocations', 'notifications', 'audit_logs'
  ] loop
    if not (select c.relrowsecurity from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = table_name) then
      raise exception 'RLS must be enabled for public.%', table_name;
    end if;
  end loop;

  if has_table_privilege('authenticated', 'public.offers', 'UPDATE') then
    raise exception 'Authenticated clients must not update offers directly';
  end if;
  if has_table_privilege('authenticated', 'public.orders', 'INSERT')
    or has_table_privilege('authenticated', 'public.orders', 'UPDATE')
    or has_table_privilege('authenticated', 'public.orders', 'DELETE') then
    raise exception 'Authenticated clients must not mutate orders directly';
  end if;
  if has_table_privilege('authenticated', 'public.payments', 'INSERT')
    or has_table_privilege('authenticated', 'public.payments', 'UPDATE')
    or has_table_privilege('authenticated', 'public.payments', 'DELETE') then
    raise exception 'Authenticated clients must not mutate payment verification directly';
  end if;
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'accept_offer'
  ) then
    raise exception 'Transactional offer acceptance function is missing';
  end if;
  if not has_function_privilege('authenticated', 'public.accept_offer(uuid)', 'EXECUTE')
    or has_function_privilege('anon', 'public.accept_offer(uuid)', 'EXECUTE') then
    raise exception 'Offer acceptance RPC must be executable by authenticated users only';
  end if;
  if not exists (select 1 from storage.buckets where id = 'quality-evidence' and public = false) then
    raise exception 'Quality evidence bucket must remain private';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'quality_images_owner_read')
    or not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'quality_images_owner_insert')
    or not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'quality_images_owner_delete') then
    raise exception 'Owner-restricted quality evidence storage policies are incomplete';
  end if;
end;
$$;
