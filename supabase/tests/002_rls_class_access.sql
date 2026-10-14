-- Behavioral RLS checks with synthetic local identities. All writes roll back.
begin;
select plan(8);
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,created_at,updated_at)
values
 ('a0000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls-instructor@test.invalid','',now(),now()),
 ('a0000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls-student@test.invalid','',now(),now()),
 ('a0000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls-outsider@test.invalid','',now(),now());
-- O cadastro em auth.users pode criar automaticamente o perfil.
insert into public.profiles (id, full_name, role)
values
  ('a0000000-0000-4000-8000-000000000001', 'RLS instructor', 'instructor'),
  ('a0000000-0000-4000-8000-000000000002', 'RLS student', 'student'),
  ('a0000000-0000-4000-8000-000000000003', 'RLS outsider', 'student')
on conflict (id) do update
set
  full_name = excluded.full_name,
  role = excluded.role;
insert into public.classes(id,code,name,uc,instructor_id)
values ('b0000000-0000-4000-8000-000000000001','TEST-RLS-001','RLS test class','UC7','a0000000-0000-4000-8000-000000000001');
insert into public.class_members(class_id,user_id,status)
values ('b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000002','active');
insert into public.learning_projects(id,class_id,name,slug,project_type,created_by)
values ('c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','RLS project','test-rls-project','guided','a0000000-0000-4000-8000-000000000001');

set local role authenticated;
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000002',true);
select is((select count(*)::integer from public.classes where id='b0000000-0000-4000-8000-000000000001'),1,'Active member can read class');
select is((select count(*)::integer from public.learning_projects where id='c0000000-0000-4000-8000-000000000001'),1,'Active member can read project');
select is((select count(*)::integer from public.project_requirements where project_id='c0000000-0000-4000-8000-000000000001'),0,'No project requirements initially');
select is((select count(*)::integer from public.classes where id='b0000000-0000-4000-8000-000000000001' and private.is_class_instructor(id)),0,'Student is not instructor');
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000003',true);
select is((select count(*)::integer from public.classes where id='b0000000-0000-4000-8000-000000000001'),0,'Outsider cannot read class');
select is((select count(*)::integer from public.learning_projects where id='c0000000-0000-4000-8000-000000000001'),0,'Outsider cannot read project');
select is((select count(*)::integer from public.mission_curriculum_links where class_id='b0000000-0000-4000-8000-000000000001'),0,'Outsider cannot see curriculum links');
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000001',true);
select is((select count(*)::integer from public.learning_projects where id='c0000000-0000-4000-8000-000000000001'),1,'Instructor can read class project');
select * from finish();
rollback;
