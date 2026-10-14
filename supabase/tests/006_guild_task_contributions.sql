-- RLS tests for individual guild task contributions. Synthetic data is rolled back.
begin;
select plan(6);

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,created_at,updated_at)
values
 ('f0000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','guild-contrib-instructor@test.invalid','',now(),now()),
 ('f0000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','guild-contrib-leader@test.invalid','',now(),now()),
 ('f0000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','guild-contrib-member@test.invalid','',now(),now()),
 ('f0000000-0000-4000-8000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','guild-contrib-outsider@test.invalid','',now(),now());

insert into public.profiles(id,full_name,role)
values
 ('f0000000-0000-4000-8000-000000000001','Contribution test instructor','instructor'::public.app_role),
 ('f0000000-0000-4000-8000-000000000002','Contribution test leader','student'::public.app_role),
 ('f0000000-0000-4000-8000-000000000003','Contribution test member','student'::public.app_role),
 ('f0000000-0000-4000-8000-000000000004','Contribution test outsider','student'::public.app_role);

insert into public.classes(id,code,name,uc,instructor_id)
values('f1000000-0000-4000-8000-000000000001','TEST-GUILD-CONTRIB-006','Contribution RLS test','UC7','f0000000-0000-4000-8000-000000000001');

insert into public.class_members(class_id,user_id,status)
values
 ('f1000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','active'),
 ('f1000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000003','active');

insert into public.guilds(id,class_id,name,created_by)
values('f2000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000001','Contribution RLS test','f0000000-0000-4000-8000-000000000001');

insert into public.guild_members(guild_id,user_id,role)
values
 ('f2000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','leader'),
 ('f2000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000003','member');

insert into public.guild_tasks(id,guild_id,title,phase,status,created_by,source,responsible_user_id)
values('f3000000-0000-4000-8000-000000000001','f2000000-0000-4000-8000-000000000001','Contribution test task',1,'todo','f0000000-0000-4000-8000-000000000002','manual','f0000000-0000-4000-8000-000000000003');

set local role authenticated;
select set_config('request.jwt.claim.sub','f0000000-0000-4000-8000-000000000003',true);

select lives_ok($$insert into public.guild_task_contributions(task_id,guild_id,author_id,summary)
 values('f3000000-0000-4000-8000-000000000001','f2000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000003','Minha contribuição de teste')$$,
 'Active member can record their own contribution');

select is((select count(*)::integer from public.guild_task_contributions where task_id='f3000000-0000-4000-8000-000000000001'),1,
 'Guild member can read the contribution');

select throws_ok($$insert into public.guild_task_contributions(task_id,guild_id,author_id,summary)
 values('f3000000-0000-4000-8000-000000000001','f2000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','Forged author')$$,
 '42501',null,'Member cannot create a contribution in another user name');

select set_config('request.jwt.claim.sub','f0000000-0000-4000-8000-000000000004',true);
select is((select count(*)::integer from public.guild_task_contributions where task_id='f3000000-0000-4000-8000-000000000001'),0,
 'External user cannot read guild contributions');

select set_config('request.jwt.claim.sub','f0000000-0000-4000-8000-000000000002',true);
select lives_ok($$delete from public.guild_task_contributions where task_id='f3000000-0000-4000-8000-000000000001'$$,
 'Guild leader can delete a task contribution');

select is((select count(*)::integer from public.guild_task_contributions where task_id='f3000000-0000-4000-8000-000000000001'),0,
 'Deleted contribution is no longer visible');

select * from finish();
rollback;
