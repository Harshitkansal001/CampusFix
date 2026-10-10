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

create or replace function public.is_staff_for_area(target_area uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
    or exists (select 1 from public.staff_area_memberships m join public.profiles p on p.id = m.user_id
      where m.user_id = (select auth.uid()) and m.area_id = target_area and p.role = 'staff');
$$;

create or replace function public.validate_report_assignee() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.assigned_to is not null and not exists (
    select 1 from public.staff_area_memberships m join public.profiles p on p.id = m.user_id
    where m.user_id = new.assigned_to and m.area_id = new.area_id and p.role = 'staff'
  ) then
    raise exception 'Assignee is not assigned to this area' using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_report_assignee on public.reports;
create trigger validate_report_assignee before insert or update of assigned_to, area_id on public.reports
for each row execute function public.validate_report_assignee();
