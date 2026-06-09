drop policy if exists "Customers can manage their cart" on public.customer_carts;
drop policy if exists "Customers can read their cart items" on public.customer_cart_items;
drop policy if exists "Customers can insert their cart items" on public.customer_cart_items;
drop policy if exists "Customers can update their cart items" on public.customer_cart_items;
drop policy if exists "Customers can delete their cart items" on public.customer_cart_items;

create policy "Customers can manage their cart"
  on public.customer_carts for all
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy "Customers can read their cart items"
  on public.customer_cart_items for select
  to authenticated
  using (
    exists (
      select 1
      from public.customer_carts
      where customer_carts.id = customer_cart_items.cart_id
        and customer_carts.profile_id = (select auth.uid())
    )
  );

create policy "Customers can insert their cart items"
  on public.customer_cart_items for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.customer_carts
      where customer_carts.id = customer_cart_items.cart_id
        and customer_carts.profile_id = (select auth.uid())
    )
  );

create policy "Customers can update their cart items"
  on public.customer_cart_items for update
  to authenticated
  using (
    exists (
      select 1
      from public.customer_carts
      where customer_carts.id = customer_cart_items.cart_id
        and customer_carts.profile_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.customer_carts
      where customer_carts.id = customer_cart_items.cart_id
        and customer_carts.profile_id = (select auth.uid())
    )
  );

create policy "Customers can delete their cart items"
  on public.customer_cart_items for delete
  to authenticated
  using (
    exists (
      select 1
      from public.customer_carts
      where customer_carts.id = customer_cart_items.cart_id
        and customer_carts.profile_id = (select auth.uid())
    )
  );
