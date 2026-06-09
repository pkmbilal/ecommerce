create table if not exists public.customer_carts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_carts_profile_id_key unique (profile_id)
);

create table if not exists public.customer_cart_items (
  cart_id uuid not null references public.customer_carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (cart_id, product_id),
  constraint customer_cart_items_quantity_positive check (quantity > 0 and quantity <= 99)
);

create index if not exists customer_cart_items_product_id_idx
  on public.customer_cart_items(product_id);

create trigger customer_carts_set_updated_at
  before update on public.customer_carts
  for each row execute function public.set_updated_at();

create trigger customer_cart_items_set_updated_at
  before update on public.customer_cart_items
  for each row execute function public.set_updated_at();

alter table public.customer_carts enable row level security;
alter table public.customer_cart_items enable row level security;

revoke all on table public.customer_carts from anon, authenticated;
revoke all on table public.customer_cart_items from anon, authenticated;

grant select, insert, update, delete on table public.customer_carts to authenticated;
grant select, insert, update, delete on table public.customer_cart_items to authenticated;
grant select, insert, update, delete on table public.customer_carts to service_role;
grant select, insert, update, delete on table public.customer_cart_items to service_role;

create policy "Customers can manage their cart"
  on public.customer_carts for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "Customers can read their cart items"
  on public.customer_cart_items for select
  to authenticated
  using (
    exists (
      select 1
      from public.customer_carts
      where customer_carts.id = customer_cart_items.cart_id
        and customer_carts.profile_id = auth.uid()
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
        and customer_carts.profile_id = auth.uid()
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
        and customer_carts.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.customer_carts
      where customer_carts.id = customer_cart_items.cart_id
        and customer_carts.profile_id = auth.uid()
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
        and customer_carts.profile_id = auth.uid()
    )
  );
