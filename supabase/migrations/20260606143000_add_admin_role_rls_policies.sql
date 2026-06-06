create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.current_user_is_admin() to authenticated;

grant select, insert, update, delete on table public.categories to authenticated;
grant select, insert, update, delete on table public.products to authenticated;
grant select, insert, update, delete on table public.product_images to authenticated;
grant select, insert, update, delete on table public.inventory_items to authenticated;
grant select, insert, update, delete on table public.inventory_movements to authenticated;
grant select, insert, update, delete on table public.customers to authenticated;
grant select, insert, update, delete on table public.orders to authenticated;
grant select, insert, update, delete on table public.order_items to authenticated;
grant select, insert, update, delete on table public.idempotency_keys to authenticated;

create policy "Admins can manage categories"
  on public.categories for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "Admins can manage products"
  on public.products for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "Admins can manage product images"
  on public.product_images for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "Admins can manage inventory items"
  on public.inventory_items for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "Admins can manage inventory movements"
  on public.inventory_movements for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "Admins can manage customers"
  on public.customers for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "Admins can manage orders"
  on public.orders for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "Admins can manage order items"
  on public.order_items for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "Admins can manage idempotency keys"
  on public.idempotency_keys for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

grant execute on function public.transition_cod_order_status(uuid, public.order_status)
  to authenticated;
grant execute on function public.adjust_product_inventory(uuid, integer, text)
  to authenticated;
