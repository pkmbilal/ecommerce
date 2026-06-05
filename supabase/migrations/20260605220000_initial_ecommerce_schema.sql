create type public.order_status as enum (
  'pending_confirmation',
  'confirmed',
  'out_for_delivery',
  'delivered',
  'cancelled'
);

create type public.inventory_movement_type as enum (
  'seed',
  'reservation',
  'release',
  'adjustment',
  'sale'
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_ar text,
  description_en text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  slug text not null unique,
  sku text not null unique,
  title_en text not null,
  title_ar text,
  description_en text,
  price_halalas integer not null,
  compare_at_price_halalas integer,
  vat_rate_bps integer not null default 1500,
  rating numeric(2,1) not null default 0,
  review_count integer not null default 0,
  badge text,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint products_price_nonnegative check (price_halalas >= 0),
  constraint products_compare_price_valid check (compare_at_price_halalas is null or compare_at_price_halalas >= price_halalas),
  constraint products_vat_rate_valid check (vat_rate_bps between 0 and 10000),
  constraint products_rating_valid check (rating between 0 and 5),
  constraint products_review_count_nonnegative check (review_count >= 0)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt_en text not null,
  alt_ar text,
  position integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint product_images_position_nonnegative check (position >= 0),
  constraint product_images_url_http check (url ~ '^https?://')
);

create unique index product_images_one_primary_per_product_idx
  on public.product_images(product_id)
  where is_primary;

create table public.inventory_items (
  product_id uuid primary key references public.products(id) on delete cascade,
  stock_on_hand integer not null default 0,
  reserved_quantity integer not null default 0,
  low_stock_threshold integer not null default 5,
  updated_at timestamptz not null default now(),
  constraint inventory_stock_nonnegative check (stock_on_hand >= 0),
  constraint inventory_reserved_nonnegative check (reserved_quantity >= 0),
  constraint inventory_reserved_not_above_stock check (reserved_quantity <= stock_on_hand),
  constraint inventory_low_stock_nonnegative check (low_stock_threshold >= 0)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_phone_sa check (phone ~ '^(\+966|966|0)?5[0-9]{8}$')
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  public_order_id text not null unique default ('COD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  customer_id uuid references public.customers(id) on delete set null,
  status public.order_status not null default 'pending_confirmation',
  customer_name text not null,
  customer_phone text not null,
  delivery_address text not null,
  city_region text not null,
  notes text,
  subtotal_halalas integer not null,
  vat_halalas integer not null default 0,
  shipping_halalas integer not null default 0,
  total_halalas integer not null,
  currency_code char(3) not null default 'SAR',
  payment_method text not null default 'cash_on_delivery',
  delivered_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_customer_phone_sa check (customer_phone ~ '^(\+966|966|0)?5[0-9]{8}$'),
  constraint orders_money_nonnegative check (
    subtotal_halalas >= 0 and vat_halalas >= 0 and shipping_halalas >= 0 and total_halalas >= 0
  ),
  constraint orders_total_matches_parts check (total_halalas = subtotal_halalas + vat_halalas + shipping_halalas),
  constraint orders_currency_sar check (currency_code = 'SAR'),
  constraint orders_payment_cod check (payment_method = 'cash_on_delivery')
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_slug text not null,
  product_sku text not null,
  product_title_en text not null,
  quantity integer not null,
  unit_price_halalas integer not null,
  vat_rate_bps integer not null default 1500,
  line_subtotal_halalas integer not null,
  created_at timestamptz not null default now(),
  constraint order_items_quantity_positive check (quantity > 0),
  constraint order_items_money_nonnegative check (unit_price_halalas >= 0 and line_subtotal_halalas >= 0),
  constraint order_items_subtotal_matches check (line_subtotal_halalas = quantity * unit_price_halalas),
  constraint order_items_vat_rate_valid check (vat_rate_bps between 0 and 10000)
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  order_id uuid references public.orders(id) on delete set null,
  movement_type public.inventory_movement_type not null,
  quantity_delta integer not null,
  reason text not null,
  created_at timestamptz not null default now(),
  constraint inventory_movements_quantity_nonzero check (quantity_delta <> 0)
);

create table public.idempotency_keys (
  key text primary key,
  scope text not null,
  order_id uuid references public.orders(id) on delete set null,
  request_hash text,
  locked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint idempotency_key_not_blank check (length(trim(key)) >= 16),
  constraint idempotency_scope_not_blank check (length(trim(scope)) > 0)
);

create index products_category_active_idx on public.products(category_id, is_active, created_at desc);
create index products_featured_active_idx on public.products(is_featured, is_active, created_at desc);
create index product_images_product_position_idx on public.product_images(product_id, position);
create index orders_status_created_idx on public.orders(status, created_at desc);
create index orders_customer_phone_idx on public.orders(customer_phone);
create index order_items_order_idx on public.order_items(order_id);
create index inventory_movements_product_created_idx on public.inventory_movements(product_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger inventory_items_set_updated_at
  before update on public.inventory_items
  for each row execute function public.set_updated_at();

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.inventory_items enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.idempotency_keys enable row level security;

revoke all on table public.categories from anon, authenticated;
revoke all on table public.products from anon, authenticated;
revoke all on table public.product_images from anon, authenticated;
revoke all on table public.inventory_items from anon, authenticated;
revoke all on table public.customers from anon, authenticated;
revoke all on table public.orders from anon, authenticated;
revoke all on table public.order_items from anon, authenticated;
revoke all on table public.inventory_movements from anon, authenticated;
revoke all on table public.idempotency_keys from anon, authenticated;

grant select on table public.categories to anon, authenticated;
grant select on table public.products to anon, authenticated;
grant select on table public.product_images to anon, authenticated;

grant select, insert, update, delete on table public.categories to service_role;
grant select, insert, update, delete on table public.products to service_role;
grant select, insert, update, delete on table public.product_images to service_role;
grant select, insert, update, delete on table public.inventory_items to service_role;
grant select, insert, update, delete on table public.customers to service_role;
grant select, insert, update, delete on table public.orders to service_role;
grant select, insert, update, delete on table public.order_items to service_role;
grant select, insert, update, delete on table public.inventory_movements to service_role;
grant select, insert, update, delete on table public.idempotency_keys to service_role;

grant execute on function public.set_updated_at() to service_role;

create policy "Public can read active categories"
  on public.categories for select
  to anon, authenticated
  using (is_active = true);

create policy "Public can read active products"
  on public.products for select
  to anon, authenticated
  using (is_active = true);

create policy "Public can read active product images"
  on public.product_images for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.products
      where products.id = product_images.product_id
        and products.is_active = true
    )
  );

insert into public.categories (slug, name_en, description_en, sort_order) values
  ('abayas', 'Abayas', 'Modest layers and everyday abayas.', 10),
  ('bags', 'Bags', 'Structured bags and daily carry pieces.', 20),
  ('tops', 'Tops', 'Clean shirts and breathable tops.', 30),
  ('scarves', 'Scarves', 'Soft scarves and refined accessories.', 40),
  ('sets', 'Sets', 'Coordinated pieces for travel and weekends.', 50),
  ('footwear', 'Footwear', 'Minimal sandals and easy footwear.', 60);

insert into public.products (
  category_id,
  slug,
  sku,
  title_en,
  description_en,
  price_halalas,
  compare_at_price_halalas,
  rating,
  review_count,
  badge,
  is_featured
) values
  ((select id from public.categories where slug = 'abayas'), 'linen-abaya-black', 'SAHA-ABY-001', 'Linen Blend Everyday Abaya', 'A breathable black abaya designed for daily Saudi routines.', 24900, 31900, 4.8, 128, 'New', true),
  ((select id from public.categories where slug = 'bags'), 'woven-tote-sand', 'SAHA-BAG-001', 'Structured Woven Tote', 'A neutral woven tote with a structured shape for daily carry.', 17900, null, 4.7, 74, null, true),
  ((select id from public.categories where slug = 'tops'), 'cotton-shirt-ivory', 'SAHA-TOP-001', 'Relaxed Cotton Poplin Shirt', 'A crisp ivory cotton shirt with a relaxed modest fit.', 13900, 16900, 4.6, 96, null, true),
  ((select id from public.categories where slug = 'scarves'), 'satin-scarf-olive', 'SAHA-SCF-001', 'Soft Satin Square Scarf', 'A smooth satin scarf with a refined olive finish.', 6900, null, 4.9, 211, 'Best seller', true),
  ((select id from public.categories where slug = 'sets'), 'pleated-set-charcoal', 'SAHA-SET-001', 'Pleated Travel Co-ord Set', 'A charcoal pleated co-ord made for travel and easy styling.', 28900, 34900, 4.8, 142, null, true),
  ((select id from public.categories where slug = 'footwear'), 'leather-sandals-tan', 'SAHA-FOT-001', 'Minimal Leather Sandals', 'Tan leather sandals with a minimal profile for warm days.', 15900, null, 4.5, 58, null, false);

insert into public.product_images (product_id, url, alt_en, position, is_primary) values
  ((select id from public.products where slug = 'linen-abaya-black'), 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=85', 'Black modest outerwear styled on a neutral fashion set', 0, true),
  ((select id from public.products where slug = 'woven-tote-sand'), 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=85', 'Structured neutral handbag on a clean studio background', 0, true),
  ((select id from public.products where slug = 'cotton-shirt-ivory'), 'https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=900&q=85', 'Ivory cotton shirt styled with minimal accessories', 0, true),
  ((select id from public.products where slug = 'satin-scarf-olive'), 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=900&q=85', 'Folded satin scarf with a refined olive finish', 0, true),
  ((select id from public.products where slug = 'pleated-set-charcoal'), 'https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=900&q=85', 'Charcoal co-ord outfit arranged for a fashion catalog', 0, true),
  ((select id from public.products where slug = 'leather-sandals-tan'), 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=85', 'Tan leather sandals photographed on a light surface', 0, true);

insert into public.inventory_items (product_id, stock_on_hand, reserved_quantity, low_stock_threshold) values
  ((select id from public.products where slug = 'linen-abaya-black'), 35, 0, 5),
  ((select id from public.products where slug = 'woven-tote-sand'), 22, 0, 5),
  ((select id from public.products where slug = 'cotton-shirt-ivory'), 40, 0, 6),
  ((select id from public.products where slug = 'satin-scarf-olive'), 65, 0, 10),
  ((select id from public.products where slug = 'pleated-set-charcoal'), 18, 0, 4),
  ((select id from public.products where slug = 'leather-sandals-tan'), 25, 0, 5);

insert into public.inventory_movements (product_id, movement_type, quantity_delta, reason)
select id, 'seed', stock_on_hand, 'Initial seed inventory'
from public.products
join public.inventory_items on inventory_items.product_id = products.id;
