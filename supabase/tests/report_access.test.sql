begin;

create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
values
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'reporter-a@test.invalid', '', now(), '{}', '{}'),
  ('10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'staff@test.invalid', '', now(), '{}', '{}'),
  ('10000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'reporter-b@test.invalid', '', now(), '{}', '{}');

update public.profiles set role = 'staff' where id = '10000000-0000-4000-8000-000000000002';
insert into public.areas (id, name) values ('20000000-0000-4000-8000-000000000001', 'Test area');
insert into public.staff_area_memberships (user_id, area_id) values
  ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001');
insert into public.reports (id, reporter_id, area_id, description)
values ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'A test campus issue');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is(public.is_staff_for_area('20000000-0000-4000-8000-000000000001'), false, 'reporter membership does not grant staff access');
select throws_ok(
  $$select public.update_report('30000000-0000-4000-8000-000000000001', 'assigned')$$,
  '42501', 'Report not found', 'reporters cannot update reports'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select is((select count(*)::int from public.reports), 0, 'reporters cannot read another reporter report');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(public.is_staff_for_area('20000000-0000-4000-8000-000000000001'), true, 'staff membership grants scoped access');
select lives_ok(
  $$select public.update_report('30000000-0000-4000-8000-000000000001', 'assigned')$$,
  'authorized staff can update an area report'
);
select throws_ok(
  $$select public.update_report('30000000-0000-4000-8000-000000000001', null, null, null, '10000000-0000-4000-8000-000000000001')$$,
  '22023', 'Assignee is not assigned to this area', 'reporters cannot be report assignees'
);
select lives_ok(
  $$select public.update_report('30000000-0000-4000-8000-000000000001', null, null, null, '10000000-0000-4000-8000-000000000002')$$,
  'authorized area staff can be assigned'
);

select * from finish();
rollback;
