create or replace function public.place_cod_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_idempotency_key text := nullif(trim(payload->>'idempotency_key'), '');
  v_profile_id uuid := nullif(trim(payload->>'profile_id'), '')::uuid;
  v_customer_name text := nullif(trim(payload #>> '{customer,name}'), '');
  v_customer_phone text := nullif(trim(payload #>> '{customer,phone}'), '');
  v_delivery_address text := nullif(trim(payload #>> '{delivery,address}'), '');
  v_city_region text := nullif(trim(payload #>> '{delivery,city_region}'), '');
  v_notes text := nullif(trim(payload->>'notes'), '');
  v_items jsonb := payload->'items';
  v_existing_order_id uuid;
  v_existing_public_order_id text;
  v_customer_id uuid;
  v_order_id uuid;
  v_subtotal integer := 0;
  v_vat integer := 0;
  v_shipping integer := 0;
  v_total integer := 0;
  v_item jsonb;
  v_product record;
  v_quantity integer;
  v_available integer;
begin
  if v_idempotency_key is null or length(v_idempotency_key) < 16 then
    raise exception 'A valid idempotency key is required' using errcode = '22023';
  end if;

  if v_profile_id is not null and not exists (
    select 1 from public.profiles where id = v_profile_id
  ) then
    raise exception 'Profile not found' using errcode = '22023';
  end if;

  if v_customer_name is null or length(v_customer_name) < 2 then
    raise exception 'Customer name is required' using errcode = '22023';
  end if;

  if v_customer_phone is null or v_customer_phone !~ '^(\+966|966|0)?5[0-9]{8}$' then
    raise exception 'A valid Saudi phone number is required' using errcode = '22023';
  end if;

  if v_delivery_address is null or length(v_delivery_address) < 8 then
    raise exception 'Delivery address is required' using errcode = '22023';
  end if;

  if v_city_region is null or length(v_city_region) < 2 then
    raise exception 'City or region is required' using errcode = '22023';
  end if;

  if jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) = 0 then
    raise exception 'Cart items are required' using errcode = '22023';
  end if;

  select order_id into v_existing_order_id
  from public.idempotency_keys
  where key = v_idempotency_key and scope = 'cod_checkout';

  if v_existing_order_id is not null then
    select public_order_id into v_existing_public_order_id
    from public.orders
    where id = v_existing_order_id;

    return jsonb_build_object(
      'orderId', v_existing_order_id,
      'publicOrderId', v_existing_public_order_id,
      'status', 'already_created'
    );
  end if;

  insert into public.idempotency_keys (key, scope, request_hash)
  values (v_idempotency_key, 'cod_checkout', md5(payload::text))
  on conflict (key) do nothing;

  select order_id into v_existing_order_id
  from public.idempotency_keys
  where key = v_idempotency_key and scope = 'cod_checkout'
  for update;

  if v_existing_order_id is not null then
    select public_order_id into v_existing_public_order_id
    from public.orders
    where id = v_existing_order_id;

    return jsonb_build_object(
      'orderId', v_existing_order_id,
      'publicOrderId', v_existing_public_order_id,
      'status', 'already_created'
    );
  end if;

  for v_item in select value from jsonb_array_elements(v_items)
  loop
    v_quantity := nullif(v_item->>'quantity', '')::integer;

    if v_quantity is null or v_quantity < 1 or v_quantity > 99 then
      raise exception 'Invalid item quantity' using errcode = '22023';
    end if;

    select
      p.id,
      p.slug,
      p.sku,
      p.title_en,
      p.price_halalas,
      p.vat_rate_bps,
      i.stock_on_hand,
      i.reserved_quantity
    into v_product
    from public.products p
    join public.inventory_items i on i.product_id = p.id
    where p.slug = v_item->>'productId'
      and p.is_active = true
    for update of i;

    if v_product.id is null then
      raise exception 'A cart item is no longer available' using errcode = '22023';
    end if;

    v_available := v_product.stock_on_hand - v_product.reserved_quantity;

    if v_available < v_quantity then
      raise exception 'Insufficient inventory for %', v_product.slug using errcode = '22023';
    end if;

    v_subtotal := v_subtotal + (v_product.price_halalas * v_quantity);
    v_vat := v_vat + round((v_product.price_halalas * v_quantity) * v_product.vat_rate_bps::numeric / 10000)::integer;
  end loop;

  v_shipping := case
    when v_subtotal >= 25000 then 0
    else 2500
  end;
  v_total := v_subtotal + v_vat + v_shipping;

  insert into public.customers (full_name, phone)
  values (v_customer_name, v_customer_phone)
  returning id into v_customer_id;

  insert into public.orders (
    profile_id,
    customer_id,
    customer_name,
    customer_phone,
    delivery_address,
    city_region,
    notes,
    subtotal_halalas,
    vat_halalas,
    shipping_halalas,
    total_halalas
  ) values (
    v_profile_id,
    v_customer_id,
    v_customer_name,
    v_customer_phone,
    v_delivery_address,
    v_city_region,
    v_notes,
    v_subtotal,
    v_vat,
    v_shipping,
    v_total
  )
  returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(v_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;

    select
      p.id,
      p.slug,
      p.sku,
      p.title_en,
      p.price_halalas,
      p.vat_rate_bps
    into v_product
    from public.products p
    where p.slug = v_item->>'productId'
      and p.is_active = true;

    insert into public.order_items (
      order_id,
      product_id,
      product_slug,
      product_sku,
      product_title_en,
      quantity,
      unit_price_halalas,
      vat_rate_bps,
      line_subtotal_halalas
    ) values (
      v_order_id,
      v_product.id,
      v_product.slug,
      v_product.sku,
      v_product.title_en,
      v_quantity,
      v_product.price_halalas,
      v_product.vat_rate_bps,
      v_product.price_halalas * v_quantity
    );

    update public.inventory_items
    set reserved_quantity = reserved_quantity + v_quantity
    where product_id = v_product.id;

    insert into public.inventory_movements (
      product_id,
      order_id,
      movement_type,
      quantity_delta,
      reason
    ) values (
      v_product.id,
      v_order_id,
      'reservation',
      -v_quantity,
      'COD checkout inventory reservation'
    );
  end loop;

  update public.idempotency_keys
  set order_id = v_order_id
  where key = v_idempotency_key and scope = 'cod_checkout';

  select public_order_id into v_existing_public_order_id
  from public.orders
  where id = v_order_id;

  return jsonb_build_object(
    'orderId', v_order_id,
    'publicOrderId', v_existing_public_order_id,
    'status', 'created',
    'totals', jsonb_build_object(
      'subtotalHalalas', v_subtotal,
      'vatHalalas', v_vat,
      'shippingHalalas', v_shipping,
      'totalHalalas', v_total
    )
  );
end;
$$;

revoke execute on function public.place_cod_order(jsonb) from public, anon, authenticated;
grant execute on function public.place_cod_order(jsonb) to service_role;
