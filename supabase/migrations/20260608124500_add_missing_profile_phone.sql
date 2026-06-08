alter table public.profiles
  add column if not exists phone text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_phone_sa'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_phone_sa
      check (phone is null or phone ~ '^(\+966|966|0)?5[0-9]{8}$');
  end if;
end;
$$;

grant update (phone) on table public.profiles to authenticated;
