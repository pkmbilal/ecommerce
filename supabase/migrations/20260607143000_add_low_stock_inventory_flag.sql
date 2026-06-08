alter table public.inventory_items
  add column if not exists is_low_stock boolean
  generated always as (stock_on_hand <= low_stock_threshold) stored;

create index if not exists inventory_items_low_stock_idx
  on public.inventory_items(is_low_stock, stock_on_hand);
