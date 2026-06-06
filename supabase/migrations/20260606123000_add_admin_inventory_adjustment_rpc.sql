create or replace function public.adjust_product_inventory(
  product_id_input uuid,
  target_stock_on_hand integer,
  reason_input text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_inventory record;
  v_reason text := nullif(trim(reason_input), '');
  v_delta integer;
begin
  if target_stock_on_hand is null or target_stock_on_hand < 0 then
    raise exception 'Target stock must be a non-negative integer' using errcode = '22023';
  end if;

  if v_reason is null or length(v_reason) < 3 then
    raise exception 'Inventory adjustment reason is required' using errcode = '22023';
  end if;

  select product_id, stock_on_hand, reserved_quantity
  into v_inventory
  from public.inventory_items
  where product_id = product_id_input
  for update;

  if v_inventory.product_id is null then
    raise exception 'Inventory item not found' using errcode = '22023';
  end if;

  if target_stock_on_hand < v_inventory.reserved_quantity then
    raise exception 'Target stock cannot be below reserved quantity' using errcode = '22023';
  end if;

  v_delta := target_stock_on_hand - v_inventory.stock_on_hand;

  update public.inventory_items
  set stock_on_hand = target_stock_on_hand
  where product_id = product_id_input;

  if v_delta <> 0 then
    insert into public.inventory_movements (
      product_id,
      movement_type,
      quantity_delta,
      reason
    ) values (
      product_id_input,
      'adjustment',
      v_delta,
      v_reason
    );
  end if;

  return jsonb_build_object(
    'productId', product_id_input,
    'stockOnHand', target_stock_on_hand,
    'reservedQuantity', v_inventory.reserved_quantity,
    'quantityDelta', v_delta
  );
end;
$$;

revoke execute on function public.adjust_product_inventory(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.adjust_product_inventory(uuid, integer, text) to service_role;
