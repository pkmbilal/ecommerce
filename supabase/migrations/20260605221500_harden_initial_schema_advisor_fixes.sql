create policy "No public access to customers"
  on public.customers for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "No public access to inventory items"
  on public.inventory_items for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "No public access to orders"
  on public.orders for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "No public access to order items"
  on public.order_items for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "No public access to inventory movements"
  on public.inventory_movements for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "No public access to idempotency keys"
  on public.idempotency_keys for all
  to anon, authenticated
  using (false)
  with check (false);

alter function public.set_updated_at() set search_path = public, pg_catalog;

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

create index idempotency_keys_order_idx on public.idempotency_keys(order_id);
create index inventory_movements_order_idx on public.inventory_movements(order_id);
create index order_items_product_idx on public.order_items(product_id);
create index orders_customer_idx on public.orders(customer_id);
