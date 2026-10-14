-- Testes locais de RLS para as tarefas do Projeto Restaurante.
-- Todos os registros sinteticos sao revertidos ao final.
begin;
select plan(9);

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,created_at,updated_at)
select id,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
       'guild-test-' || n || '@test.invalid','',now(),now()
from (values
 ('d0000000-0000-4000-8000-000000000001'::uuid,1),
 ('d0000000-0000-4000-8000-000000000002'::uuid,2),
 ('d0000000-0000-4000-8000-000000000003'::uuid,3),
 ('d0000000-0000-4000-8000-000000000004'::uuid,4),
 ('d0000000-0000-4000-8000-000000000005'::uuid,5)) v(id,n);

insert into public.profiles(id,full_name,role)
select id, 'Guild test ' || n, case when n=1 then 'instructor'::public.app_role else 'student'::public.app_role end
from (values
 ('d0000000-0000-4000-8000-000000000001'::uuid,1),
 ('d0000000-0000-4000-8000-000000000002'::uuid,2),
 ('d0000000-0000-4000-8000-000000000003'::uuid,3),
 ('d0000000-0000-4000-8000-000000000004'::uuid,4),
 ('d0000000-0000-4000-8000-000000000005'::uuid,5)) v(id,n)
on conflict(id) do update set full_name=excluded.full_name,role=excluded.role;

insert into public.classes(id,code,name,uc,instructor_id)
values('d1000000-0000-4000-8000-000000000001','TEST-GUILD-RLS-003','Guild permissions test','UC7','d0000000-0000-4000-8000-000000000001');
insert into public.class_members(class_id,user_id,status)
select 'd1000000-0000-4000-8000-000000000001',id,'active'
from (values
 ('d0000000-0000-4000-8000-000000000002'::uuid),
 ('d0000000-0000-4000-8000-000000000003'::uuid),
 ('d0000000-0000-4000-8000-000000000004'::uuid)) v(id);
insert into public.guilds(id,class_id,name,created_by)
values('d2000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000001','Guild RLS test','d0000000-0000-4000-8000-000000000001');
insert into public.guild_members(guild_id,user_id,role)
values
('d2000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000002','leader'),
('d2000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000003','member'),
('d2000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000004','member');

insert into public.guild_tasks(id,guild_id,title,phase,status,created_by,source,responsible_user_id)
values
('d3000000-0000-4000-8000-000000000001','d2000000-0000-4000-8000-000000000001','Tarefa manual de teste',1,'todo','d0000000-0000-4000-8000-000000000002','manual','d0000000-0000-4000-8000-000000000003'),
('d3000000-0000-4000-8000-000000000002','d2000000-0000-4000-8000-000000000001','Tarefa de missao de teste',1,'todo','d0000000-0000-4000-8000-000000000002','mission','d0000000-0000-4000-8000-000000000003');

insert into public.guild_task_collaborators(task_id,user_id)
values('d3000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000004');

set local role authenticated;
select set_config('request.jwt.claim.sub','d0000000-0000-4000-8000-000000000005',true);
select is((select count(*)::integer from public.guild_tasks where guild_id='d2000000-0000-4000-8000-000000000001'),0,'Usuario externo nao visualiza tarefas');

select set_config('request.jwt.claim.sub','d0000000-0000-4000-8000-000000000003',true);
select is((select count(*)::integer from public.guild_tasks where guild_id='d2000000-0000-4000-8000-000000000001'),2,'Responsavel visualiza tarefas da Guilda');
select lives_ok($$update public.guild_tasks set status='doing' where id='d3000000-0000-4000-8000-000000000001'$$,'Responsavel atualiza status');
select throws_ok($$update public.guild_tasks set title='Alteracao proibida' where id='d3000000-0000-4000-8000-000000000001'$$,'Only task managers may edit task definition or assignment','Responsavel nao altera titulo');

select set_config('request.jwt.claim.sub','d0000000-0000-4000-8000-000000000004',true);
select lives_ok($$update public.guild_tasks set evidence='Evidencia de teste' where id='d3000000-0000-4000-8000-000000000001'$$,'Colaborador atualiza evidencia');
select throws_ok($$update public.guild_tasks set responsible_user_id='d0000000-0000-4000-8000-000000000004' where id='d3000000-0000-4000-8000-000000000001'$$,'Only task managers may edit task definition or assignment','Colaborador nao troca responsavel');

select set_config('request.jwt.claim.sub','d0000000-0000-4000-8000-000000000002',true);
select throws_ok($$update public.guild_tasks set source='manual' where id='d3000000-0000-4000-8000-000000000002'$$,'Protected task identity fields cannot be modified','Lider nao altera origem da tarefa');
select is_empty(
  $$delete from public.guild_tasks
    where id = 'd3000000-0000-4000-8000-000000000002'
    returning id$$,
  'Lider nao exclui tarefa de missao'
);
select isnt_empty(
  $$delete from public.guild_tasks
    where id = 'd3000000-0000-4000-8000-000000000001'
    returning id$$,
  'Lider exclui tarefa manual'
);
select * from finish();
rollback;
