create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  recipient_name text not null,
  phone text not null,
  city_region text not null,
  delivery_address text not null,
  notes text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_addresses_label_not_blank check (length(trim(label)) >= 2),
  constraint customer_addresses_recipient_not_blank check (length(trim(recipient_name)) >= 2),
  constraint customer_addresses_phone_sa check (phone ~ '^(\+966|966|0)?5[0-9]{8}$'),
  constraint customer_addresses_city_not_blank check (length(trim(city_region)) >= 2),
  constraint customer_addresses_address_not_blank check (length(trim(delivery_address)) >= 8)
);

create unique index if not exists customer_addresses_one_default_per_profile_idx
  on public.customer_addresses(profile_id)
  where is_default;

create index if not exists customer_addresses_profile_created_idx
  on public.customer_addresses(profile_id, created_at desc);

drop trigger if exists customer_addresses_set_updated_at on public.customer_addresses;

create trigger customer_addresses_set_updated_at
  before update on public.customer_addresses
  for each row execute function public.set_updated_at();

create table if not exists public.product_favorites (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, product_id)
);

create index if not exists product_favorites_profile_created_idx
  on public.product_favorites(profile_id, created_at desc);

alter table public.orders
  add column if not exists profile_id uuid references public.profiles(id) on delete set null;

create index if not exists orders_profile_created_idx
  on public.orders(profile_id, created_at desc);

alter table public.customer_addresses enable row level security;
alter table public.product_favorites enable row level security;

revoke all on table public.customer_addresses from anon, authenticated;
revoke all on table public.product_favorites from anon, authenticated;

grant select, insert, update, delete on table public.customer_addresses to authenticated;
grant select, insert, delete on table public.product_favorites to authenticated;
grant select, insert, update, delete on table public.customer_addresses to service_role;
grant select, insert, update, delete on table public.product_favorites to service_role;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'customer_addresses'
      and policyname = 'Users can manage own addresses'
  ) then
    create policy "Users can manage own addresses"
      on public.customer_addresses for all
      to authenticated
      using ((select auth.uid()) = profile_id)
      with check ((select auth.uid()) = profile_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'product_favorites'
      and policyname = 'Users can manage own favorites'
  ) then
    create policy "Users can manage own favorites"
      on public.product_favorites for all
      to authenticated
      using ((select auth.uid()) = profile_id)
      with check ((select auth.uid()) = profile_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'orders'
      and policyname = 'Users can read own orders'
  ) then
    create policy "Users can read own orders"
      on public.orders for select
      to authenticated
      using ((select auth.uid()) = profile_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'order_items'
      and policyname = 'Users can read own order items'
  ) then
    create policy "Users can read own order items"
      on public.order_items for select
      to authenticated
      using (
        exists (
          select 1
          from public.orders
          where orders.id = order_items.order_id
            and orders.profile_id = (select auth.uid())
        )
      );
  end if;
end;
$$;

notify pgrst, 'reload schema';
