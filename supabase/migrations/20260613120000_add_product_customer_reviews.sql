create type public.product_review_status as enum (
  'published',
  'hidden'
);

create table public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete restrict,
  rating integer not null,
  title text,
  body text,
  status public.product_review_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_reviews_rating_valid check (rating between 1 and 5),
  constraint product_reviews_title_length check (title is null or length(trim(title)) between 2 and 120),
  constraint product_reviews_body_length check (body is null or length(trim(body)) between 3 and 1200),
  constraint product_reviews_one_per_customer_product unique (profile_id, product_id)
);

create index product_reviews_product_status_created_idx
  on public.product_reviews(product_id, status, created_at desc);

create index product_reviews_profile_product_idx
  on public.product_reviews(profile_id, product_id);

create index product_reviews_order_item_idx
  on public.product_reviews(order_item_id);

create trigger product_reviews_set_updated_at
  before update on public.product_reviews
  for each row execute function public.set_updated_at();

create or replace function public.prevent_product_review_owner_change()
returns trigger
language plpgsql
as $$
begin
  if old.product_id <> new.product_id
    or old.profile_id <> new.profile_id
    or old.order_item_id <> new.order_item_id then
    raise exception 'Review ownership fields cannot be changed' using errcode = '22023';
  end if;

  return new;
end;
$$;

create trigger product_reviews_prevent_owner_change
  before update on public.product_reviews
  for each row execute function public.prevent_product_review_owner_change();

create or replace function public.order_item_can_be_reviewed(
  order_item_id_input uuid,
  product_id_input uuid,
  profile_id_input uuid
)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.id = order_item_id_input
      and oi.product_id = product_id_input
      and o.profile_id = profile_id_input
      and o.status in ('confirmed', 'out_for_delivery', 'delivered')
  );
$$;

create or replace function public.recalculate_product_review_summary(
  product_id_input uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
  set
    rating = coalesce((
      select round(avg(product_reviews.rating)::numeric, 1)
      from public.product_reviews
      where product_reviews.product_id = product_id_input
        and product_reviews.status = 'published'
    ), 0),
    review_count = (
      select count(*)::integer
      from public.product_reviews
      where product_reviews.product_id = product_id_input
        and product_reviews.status = 'published'
    )
  where id = product_id_input;
end;
$$;

create or replace function public.recalculate_product_review_summary_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_product_review_summary(old.product_id);
    return old;
  end if;

  perform public.recalculate_product_review_summary(new.product_id);

  if tg_op = 'UPDATE' and old.product_id <> new.product_id then
    perform public.recalculate_product_review_summary(old.product_id);
  end if;

  return new;
end;
$$;

create trigger product_reviews_recalculate_product_summary
  after insert or update or delete on public.product_reviews
  for each row execute function public.recalculate_product_review_summary_trigger();

alter table public.product_reviews enable row level security;

revoke all on table public.product_reviews from anon, authenticated;
grant select on table public.product_reviews to anon;
grant select, insert, update on table public.product_reviews to authenticated;
grant select, insert, update, delete on table public.product_reviews to service_role;

grant execute on function public.order_item_can_be_reviewed(uuid, uuid, uuid)
  to authenticated, service_role;
grant execute on function public.recalculate_product_review_summary(uuid)
  to service_role;
grant execute on function public.recalculate_product_review_summary_trigger()
  to service_role;
grant execute on function public.prevent_product_review_owner_change()
  to authenticated, service_role;

create policy "Public can read published product reviews"
  on public.product_reviews for select
  to anon, authenticated
  using (
    status = 'published'
    and exists (
      select 1
      from public.products
      where products.id = product_reviews.product_id
        and products.is_active = true
    )
  );

create policy "Users can read own product reviews"
  on public.product_reviews for select
  to authenticated
  using ((select auth.uid()) = profile_id);

create policy "Users can create reviews for progressed orders"
  on public.product_reviews for insert
  to authenticated
  with check (
    (select auth.uid()) = profile_id
    and status = 'published'
    and public.order_item_can_be_reviewed(order_item_id, product_id, profile_id)
  );

create policy "Users can update own published reviews for progressed orders"
  on public.product_reviews for update
  to authenticated
  using ((select auth.uid()) = profile_id and status = 'published')
  with check (
    (select auth.uid()) = profile_id
    and status = 'published'
    and public.order_item_can_be_reviewed(order_item_id, product_id, profile_id)
  );

create policy "Admins can read product reviews"
  on public.product_reviews for select
  to authenticated
  using (public.current_user_is_admin());

create policy "Admins can update product review status"
  on public.product_reviews for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

update public.products
set rating = 0,
    review_count = 0;
