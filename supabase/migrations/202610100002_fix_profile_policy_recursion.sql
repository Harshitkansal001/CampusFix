create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin');
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "Profiles visible to self or admin" on public.profiles;
create policy "Profiles visible to self or admin" on public.profiles
  for select using (id = (select auth.uid()) or public.is_admin());

drop policy if exists "Active areas readable" on public.areas;
create policy "Active areas readable" on public.areas
  for select using (active or public.is_admin());

drop policy if exists "Categories readable" on public.categories;
create policy "Categories readable" on public.categories
  for select using (active or public.is_admin());

drop policy if exists "Membership readable by self or admin" on public.staff_area_memberships;
create policy "Membership readable by self or admin" on public.staff_area_memberships
  for select using (user_id = (select auth.uid()) or public.is_admin());

grant select on public.areas, public.categories to anon;
