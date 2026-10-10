create extension if not exists pgcrypto;

create type public.user_role as enum ('reporter', 'staff', 'admin');
create type public.report_status as enum ('new', 'assigned', 'in_progress', 'resolved', 'reopened');
create type public.report_priority as enum ('low', 'medium', 'high', 'urgent');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.user_role not null default 'reporter',
  created_at timestamptz not null default now()
);
create table public.areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references public.areas(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (parent_id, name)
);
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true
);
create table public.staff_area_memberships (
  user_id uuid not null references public.profiles(id) on delete cascade,
  area_id uuid not null references public.areas(id) on delete cascade,
  primary key (user_id, area_id)
);
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reference text generated always as ('CF-' || upper(substr(replace(id::text, '-', ''), 1, 8))) stored unique,
  reporter_id uuid not null references public.profiles(id),
  area_id uuid not null references public.areas(id),
  location_detail text,
  description text not null check (char_length(description) between 10 and 5000),
  status public.report_status not null default 'new',
  priority public.report_priority,
  category_id uuid references public.categories(id),
  assigned_to uuid references public.profiles(id),
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.report_events (
  id bigint generated always as identity primary key,
  report_id uuid not null references public.reports(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.ai_suggestions (
  id bigint generated always as identity primary key,
  report_id uuid not null references public.reports(id) on delete cascade,
  category_id uuid references public.categories(id),
  priority public.report_priority,
  needs_review boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.duplicate_suggestions (
  report_id uuid not null references public.reports(id) on delete cascade,
  candidate_report_id uuid not null references public.reports(id) on delete cascade,
  score real,
  confirmed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (report_id, candidate_report_id),
  check (report_id <> candidate_report_id)
);

create index reports_reporter_created on public.reports (reporter_id, created_at desc);
create index reports_area_status_created on public.reports (area_id, status, created_at desc);
create index notifications_user_created on public.notifications (user_id, created_at desc);

create function public.is_staff_for_area(target_area uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
    or exists (select 1 from public.staff_area_memberships m where m.user_id = (select auth.uid()) and m.area_id = target_area);
$$;
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin');
$$;

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name) values (new.id, new.raw_user_meta_data ->> 'name');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create function public.create_report(p_area_id uuid, p_description text, p_location_detail text default null)
returns public.reports language plpgsql security definer set search_path = '' as $$
declare result public.reports;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if not exists (select 1 from public.areas where id = p_area_id and active) then raise exception 'Invalid area' using errcode = '22023'; end if;
  insert into public.reports (reporter_id, area_id, description, location_detail)
  values (auth.uid(), p_area_id, btrim(p_description), nullif(btrim(p_location_detail), '')) returning * into result;
  insert into public.report_events (report_id, actor_id, event_type) values (result.id, auth.uid(), 'created');
  return result;
end;
$$;

create function public.update_report(p_report_id uuid, p_status public.report_status default null,
  p_priority public.report_priority default null, p_category_id uuid default null, p_assigned_to uuid default null)
returns public.reports language plpgsql security definer set search_path = '' as $$
declare current_report public.reports; result public.reports; changes jsonb := '{}'::jsonb;
begin
  select * into current_report from public.reports where id = p_report_id for update;
  if not found or not public.is_staff_for_area(current_report.area_id) then raise exception 'Report not found' using errcode = '42501'; end if;
  if p_status is not null and p_status <> current_report.status and not (
    (current_report.status = 'new' and p_status = 'assigned') or
    (current_report.status = 'assigned' and p_status in ('in_progress', 'resolved')) or
    (current_report.status = 'in_progress' and p_status = 'resolved') or
    (current_report.status = 'resolved' and p_status = 'reopened') or
    (current_report.status = 'reopened' and p_status in ('assigned', 'in_progress', 'resolved'))
  ) then raise exception 'Invalid status transition' using errcode = '22023'; end if;
  if p_assigned_to is not null and not exists (
    select 1 from public.staff_area_memberships m where m.user_id = p_assigned_to and m.area_id = current_report.area_id
  ) then raise exception 'Assignee is not assigned to this area' using errcode = '22023'; end if;
  update public.reports set status = coalesce(p_status, status), priority = coalesce(p_priority, priority),
    category_id = coalesce(p_category_id, category_id), assigned_to = coalesce(p_assigned_to, assigned_to), updated_at = now()
  where id = p_report_id returning * into result;
  if p_status is distinct from current_report.status then changes := changes || jsonb_build_object('status', jsonb_build_object('from', current_report.status, 'to', p_status)); end if;
  if p_priority is not null and p_priority is distinct from current_report.priority then changes := changes || jsonb_build_object('priority', p_priority); end if;
  if p_category_id is not null and p_category_id is distinct from current_report.category_id then changes := changes || jsonb_build_object('category_id', p_category_id); end if;
  if p_assigned_to is not null and p_assigned_to is distinct from current_report.assigned_to then changes := changes || jsonb_build_object('assigned_to', p_assigned_to); end if;
  if changes <> '{}'::jsonb then
    insert into public.report_events (report_id, actor_id, event_type, details) values (p_report_id, auth.uid(), 'updated', changes);
    if p_status is not null and p_status is distinct from current_report.status then
      insert into public.notifications (user_id, report_id, message) values (current_report.reporter_id, p_report_id, 'Your report status changed to ' || replace(p_status::text, '_', ' '));
    end if;
    if p_assigned_to is not null and p_assigned_to is distinct from current_report.assigned_to then
      insert into public.notifications (user_id, report_id, message) values (p_assigned_to, p_report_id, 'A campus report was assigned to you');
    end if;
  end if;
  return result;
end;
$$;
revoke all on function public.create_report(uuid, text, text) from public, anon;
grant execute on function public.create_report(uuid, text, text) to authenticated;
revoke all on function public.update_report(uuid, public.report_status, public.report_priority, uuid, uuid) from public, anon;
grant execute on function public.update_report(uuid, public.report_status, public.report_priority, uuid, uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.areas enable row level security;
alter table public.categories enable row level security;
alter table public.staff_area_memberships enable row level security;
alter table public.reports enable row level security;
alter table public.report_events enable row level security;
alter table public.notifications enable row level security;
alter table public.ai_suggestions enable row level security;
alter table public.duplicate_suggestions enable row level security;

create policy "Profiles visible to self or admin" on public.profiles for select using (id = (select auth.uid()) or public.is_admin());
create policy "Active areas readable" on public.areas for select using (active or public.is_admin());
create policy "Categories readable" on public.categories for select using (active or public.is_admin());
create policy "Membership readable by self or admin" on public.staff_area_memberships for select using (user_id = (select auth.uid()) or public.is_admin());
create policy "Reports readable by owner or area staff" on public.reports for select using (reporter_id = (select auth.uid()) or public.is_staff_for_area(area_id));
create policy "Reports created by self" on public.reports for insert with check (reporter_id = (select auth.uid()));
create policy "Events readable by owner or area staff" on public.report_events for select using (exists (select 1 from public.reports r where r.id = report_id and (r.reporter_id = (select auth.uid()) or public.is_staff_for_area(r.area_id))));
create policy "Notifications readable by recipient" on public.notifications for select using (user_id = (select auth.uid()));
create policy "Notifications marked read by recipient" on public.notifications for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "AI suggestions staff only" on public.ai_suggestions for select using (exists (select 1 from public.reports r where r.id = report_id and public.is_staff_for_area(r.area_id)));
create policy "Duplicate suggestions staff only" on public.duplicate_suggestions for select using (exists (select 1 from public.reports r where r.id = report_id and public.is_staff_for_area(r.area_id)));

-- Keep privileges and workflow writes behind the checked RPCs.
revoke insert, update, delete on public.profiles, public.areas, public.categories, public.staff_area_memberships,
  public.reports, public.report_events, public.notifications, public.ai_suggestions, public.duplicate_suggestions from anon, authenticated;
grant select on public.profiles, public.areas, public.categories, public.staff_area_memberships,
  public.reports, public.report_events, public.notifications, public.ai_suggestions, public.duplicate_suggestions to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant usage, select on sequence public.report_events_id_seq, public.notifications_id_seq,
  public.ai_suggestions_id_seq to authenticated;

do $$
declare campus_id uuid;
begin
  insert into public.areas (name) values ('NIT Hamirpur Campus') on conflict (parent_id, name) do update set name = excluded.name returning id into campus_id;
  insert into public.areas (name, parent_id) values
    ('Kailash Boys Hostel', campus_id), ('Himgiri Boys Hostel', campus_id), ('Udaygiri Boys Hostel', campus_id), ('Neelkanth Boys Hostel', campus_id),
    ('Dhauladhar Boys Hostel', campus_id), ('Vindhyachal Boys Hostel', campus_id), ('Shivalik Boys Hostel', campus_id), ('Ambika Girls Hostel', campus_id),
    ('Parvati Girls Hostel', campus_id), ('Mani-Mahesh Girls Hostel', campus_id), ('Aravali Girls Hostel', campus_id), ('Satpura Hostel', campus_id), ('Himadri Boys Hostel', campus_id),
    ('Admin Block', campus_id), ('Civil Department', campus_id), ('Mechanical Department', campus_id), ('Electrical Department', campus_id), ('Computer Department', campus_id),
    ('Computer Centre', campus_id), ('New Computer Centre', campus_id), ('E-Classroom', campus_id), ('Architecture Department', campus_id), ('Electronics and Communication Engineering Department', campus_id),
    ('Applied Science Department', campus_id), ('Modern Lecture Hall', campus_id), ('Central Block (IRC)', campus_id), ('Estate Office/Bank/Post Office/Construction Section', campus_id),
    ('Central Workshop', campus_id), ('Auditorium', campus_id), ('Open Air Theatre (OAT)', campus_id), ('Central Library', campus_id), ('Health Centre', campus_id),
    ('Guest House', campus_id), ('Canteen', campus_id), ('Student Activity Centre (SAC)', campus_id), ('Ground and Stadium', campus_id), ('Gate No. 1', campus_id), ('Gate No. 2', campus_id),
    ('Substation I', campus_id), ('Substation II', campus_id), ('Substation III', campus_id)
  on conflict (parent_id, name) do nothing;
end;
$$;
insert into public.categories (name) values ('Electrical'), ('Plumbing'), ('Building and infrastructure'), ('Sanitation'), ('Roads and pathways'), ('Safety'), ('Other') on conflict (name) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-photos', 'report-photos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "Report photos readable by owner or scoped staff" on storage.objects for select using (
  bucket_id = 'report-photos' and exists (
    select 1 from public.reports r where r.photo_path = name and (r.reporter_id = (select auth.uid()) or public.is_staff_for_area(r.area_id))
  )
);
create policy "Reporters upload photos to own folder" on storage.objects for insert with check (
  bucket_id = 'report-photos' and (storage.foldername(name))[1] = (select auth.uid())::text
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);
