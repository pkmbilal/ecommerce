create or replace function public.transition_cod_order_status(
  order_id_input uuid,
  next_status public.order_status
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_order record;
  v_item record;
begin
  select id, public_order_id, status
  into v_order
  from public.orders
  where id = order_id_input
  for update;

  if v_order.id is null then
    raise exception 'Order not found' using errcode = '22023';
  end if;

  if v_order.status = next_status then
    return jsonb_build_object(
      'orderId', v_order.id,
      'publicOrderId', v_order.public_order_id,
      'status', v_order.status
    );
  end if;

  if v_order.status = 'cancelled' or v_order.status = 'delivered' then
    raise exception 'Finalized orders cannot be changed' using errcode = '22023';
  end if;

  if next_status = 'confirmed' and v_order.status <> 'pending_confirmation' then
    raise exception 'Only pending orders can be confirmed' using errcode = '22023';
  end if;

  if next_status = 'out_for_delivery' and v_order.status <> 'confirmed' then
    raise exception 'Only confirmed orders can be sent out for delivery' using errcode = '22023';
  end if;

  if next_status = 'delivered' and v_order.status <> 'out_for_delivery' then
    raise exception 'Only out for delivery orders can be delivered' using errcode = '22023';
  end if;

  if next_status = 'pending_confirmation' then
    raise exception 'Orders cannot move back to pending confirmation' using errcode = '22023';
  end if;

  if next_status = 'cancelled' then
    for v_item in
      select product_id, quantity
      from public.order_items
      where order_id = v_order.id and product_id is not null
    loop
      update public.inventory_items
      set reserved_quantity = greatest(reserved_quantity - v_item.quantity, 0)
      where product_id = v_item.product_id;

      insert into public.inventory_movements (
        product_id,
        order_id,
        movement_type,
        quantity_delta,
        reason
      ) values (
        v_item.product_id,
        v_order.id,
        'release',
        v_item.quantity,
        'COD order cancellation inventory release'
      );
    end loop;

    update public.orders
    set status = next_status,
        cancelled_at = now()
    where id = v_order.id;
  elsif next_status = 'delivered' then
    update public.orders
    set status = next_status,
        delivered_at = now()
    where id = v_order.id;
  else
    update public.orders
    set status = next_status
    where id = v_order.id;
  end if;

  return jsonb_build_object(
    'orderId', v_order.id,
    'publicOrderId', v_order.public_order_id,
    'status', next_status
  );
end;
$$;

revoke execute on function public.transition_cod_order_status(uuid, public.order_status) from public, anon, authenticated;
grant execute on function public.transition_cod_order_status(uuid, public.order_status) to service_role;
