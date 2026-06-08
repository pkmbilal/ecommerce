drop policy if exists "Public can read active categories" on public.categories;
drop policy if exists "Public can read active products" on public.products;
drop policy if exists "Public can read active product images" on public.product_images;

drop policy if exists "Admins can manage categories" on public.categories;
drop policy if exists "Admins can manage products" on public.products;
drop policy if exists "Admins can manage product images" on public.product_images;

drop policy if exists "No public access to customers" on public.customers;
drop policy if exists "No public access to orders" on public.orders;
drop policy if exists "No public access to order items" on public.order_items;
drop policy if exists "No public access to inventory items" on public.inventory_items;
drop policy if exists "No public access to inventory movements" on public.inventory_movements;
drop policy if exists "No public access to idempotency keys" on public.idempotency_keys;

create policy "Anon can read active categories"
  on public.categories for select
  to anon
  using (is_active = true);

create policy "Authenticated can read active categories or admin categories"
  on public.categories for select
  to authenticated
  using (is_active = true or public.current_user_is_admin());

create policy "Admins can insert categories"
  on public.categories for insert
  to authenticated
  with check (public.current_user_is_admin());

create policy "Admins can update categories"
  on public.categories for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "Admins can delete categories"
  on public.categories for delete
  to authenticated
  using (public.current_user_is_admin());

create policy "Anon can read active products"
  on public.products for select
  to anon
  using (is_active = true);

create policy "Authenticated can read active products or admin products"
  on public.products for select
  to authenticated
  using (is_active = true or public.current_user_is_admin());

create policy "Admins can insert products"
  on public.products for insert
  to authenticated
  with check (public.current_user_is_admin());

create policy "Admins can update products"
  on public.products for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "Admins can delete products"
  on public.products for delete
  to authenticated
  using (public.current_user_is_admin());

create policy "Anon can read active product images"
  on public.product_images for select
  to anon
  using (
    exists (
      select 1
      from public.products
      where products.id = product_images.product_id
        and products.is_active = true
    )
  );

create policy "Authenticated can read active product images or admin images"
  on public.product_images for select
  to authenticated
  using (
    public.current_user_is_admin()
    or exists (
      select 1
      from public.products
      where products.id = product_images.product_id
        and products.is_active = true
    )
  );

create policy "Admins can insert product images"
  on public.product_images for insert
  to authenticated
  with check (public.current_user_is_admin());

create policy "Admins can update product images"
  on public.product_images for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "Admins can delete product images"
  on public.product_images for delete
  to authenticated
  using (public.current_user_is_admin());
