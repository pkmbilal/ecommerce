alter table public.profiles
  add column if not exists avatar_url text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_avatar_url_https'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_avatar_url_https
      check (avatar_url is null or avatar_url ~ '^https://');
  end if;
end;
$$;

grant update (avatar_url) on table public.profiles to authenticated;
