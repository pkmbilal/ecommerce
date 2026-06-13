create or replace function public.prevent_product_review_owner_change()
returns trigger
language plpgsql
set search_path = public
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

revoke execute on function public.recalculate_product_review_summary(uuid)
  from public, anon, authenticated;
revoke execute on function public.recalculate_product_review_summary_trigger()
  from public, anon, authenticated;
revoke execute on function public.prevent_product_review_owner_change()
  from public, anon;

grant execute on function public.recalculate_product_review_summary(uuid)
  to service_role;
grant execute on function public.recalculate_product_review_summary_trigger()
  to service_role;
grant execute on function public.prevent_product_review_owner_change()
  to authenticated, service_role;

drop policy if exists "Public can read published product reviews"
  on public.product_reviews;
drop policy if exists "Users can read own product reviews"
  on public.product_reviews;
drop policy if exists "Admins can read product reviews"
  on public.product_reviews;
drop policy if exists "Users can update own published reviews for progressed orders"
  on public.product_reviews;
drop policy if exists "Admins can update product review status"
  on public.product_reviews;

create policy "Anonymous can read published product reviews"
  on public.product_reviews for select
  to anon
  using (
    status = 'published'
    and exists (
      select 1
      from public.products
      where products.id = product_reviews.product_id
        and products.is_active = true
    )
  );

create policy "Authenticated can read permitted product reviews"
  on public.product_reviews for select
  to authenticated
  using (
    public.current_user_is_admin()
    or (select auth.uid()) = profile_id
    or (
      status = 'published'
      and exists (
        select 1
        from public.products
        where products.id = product_reviews.product_id
          and products.is_active = true
      )
    )
  );

create policy "Authenticated can update permitted product reviews"
  on public.product_reviews for update
  to authenticated
  using (
    public.current_user_is_admin()
    or ((select auth.uid()) = profile_id and status = 'published')
  )
  with check (
    public.current_user_is_admin()
    or (
      (select auth.uid()) = profile_id
      and status = 'published'
      and public.order_item_can_be_reviewed(order_item_id, product_id, profile_id)
    )
  );
