-- Teste isolado de colaboradores: dados sinteticos e rollback automatico.
begin;
select plan(7);

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,created_at,updated_at)
select id,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
       'guild-collab-' || n || '@test.invalid','',now(),now()
from (values
 ('e0000000-0000-4000-8000-000000000001'::uuid,1),
 ('e0000000-0000-4000-8000-000000000002'::uuid,2),
 ('e0000000-0000-4000-8000-000000000003'::uuid,3),
 ('e0000000-0000-4000-8000-000000000004'::uuid,4)) v(id,n);

insert into public.profiles(id,full_name,role)
select id,'Collab test '||n,case when n=1 then 'instructor'::public.app_role else 'student'::public.app_role end
from (values
 ('e0000000-0000-4000-8000-000000000001'::uuid,1),
 ('e0000000-0000-4000-8000-000000000002'::uuid,2),
 ('e0000000-0000-4000-8000-000000000003'::uuid,3),
 ('e0000000-0000-4000-8000-000000000004'::uuid,4)) v(id,n)
on conflict(id) do update set full_name=excluded.full_name,role=excluded.role;

insert into public.classes(id,code,name,uc,instructor_id)
values('e1000000-0000-4000-8000-000000000001','TEST-GUILD-COLLAB-005','Collaborator test','UC7','e0000000-0000-4000-8000-000000000001');
insert into public.class_members(class_id,user_id,status)
select 'e1000000-0000-4000-8000-000000000001',id,'active'
from (values
 ('e0000000-0000-4000-8000-000000000002'::uuid),
 ('e0000000-0000-4000-8000-000000000003'::uuid),
 ('e0000000-0000-4000-8000-000000000004'::uuid)) v(id);
insert into public.guilds(id,class_id,name,created_by)
values('e2000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','Guild collab test','e0000000-0000-4000-8000-000000000001');
insert into public.guild_members(guild_id,user_id,role)
values
('e2000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000002','leader'),
('e2000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000003','member'),
('e2000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000004','member');
insert into public.guild_tasks(id,guild_id,title,phase,status,created_by,source,responsible_user_id)
values('e3000000-0000-4000-8000-000000000001','e2000000-0000-4000-8000-000000000001','Tarefa de colaboracao',1,'todo','e0000000-0000-4000-8000-000000000002','manual','e0000000-0000-4000-8000-000000000003');

set local role authenticated;
select set_config('request.jwt.claim.sub','e0000000-0000-4000-8000-000000000004',true);
select throws_ok($$insert into public.guild_task_collaborators(task_id,user_id) values('e3000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000004')$$,'42501',null,'Integrante comum nao adiciona colaborador');
select throws_ok($$select public.update_guild_task_collaboration('e3000000-0000-4000-8000-000000000001',p_status=>'doing')$$,'Sem permissao para alterar esta tarefa.','Nao colaborador nao altera status');

select set_config('request.jwt.claim.sub','e0000000-0000-4000-8000-000000000002',true);
select lives_ok($$insert into public.guild_task_collaborators(task_id,user_id) values('e3000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000004')$$,'Lider adiciona colaborador');
select is((select count(*)::integer from public.guild_task_collaborators where task_id='e3000000-0000-4000-8000-000000000001'),1,'Colaborador adicionado e visivel');

select set_config('request.jwt.claim.sub','e0000000-0000-4000-8000-000000000004',true);
select lives_ok($$select public.update_guild_task_collaboration('e3000000-0000-4000-8000-000000000001',p_evidence=>'Evidencia colaborador',p_set_evidence=>true)$$,'Colaborador registra evidencia');

select set_config('request.jwt.claim.sub','e0000000-0000-4000-8000-000000000002',true);
select lives_ok($$delete from public.guild_task_collaborators where task_id='e3000000-0000-4000-8000-000000000001' and user_id='e0000000-0000-4000-8000-000000000004'$$,'Lider remove colaborador');
select is((select count(*)::integer from public.guild_task_collaborators where task_id='e3000000-0000-4000-8000-000000000001'),0,'Colaborador removido');

select * from finish();
rollback;
