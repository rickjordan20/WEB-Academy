-- Testes de autorizacao da RPC, transacao revertida ao final.
begin;
select plan(6);
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
-- Externo nao pode modificar tarefa.
select set_config('request.jwt.claim.sub','d0000000-0000-4000-8000-000000000005',true);
select throws_ok($$select public.update_guild_task_collaboration('d3000000-0000-4000-8000-000000000001',p_status=>'doing')$$,'Sem permissao para alterar esta tarefa.','Externo bloqueado pela RPC');
-- Integrante comum nao pode alterar tarefa alheia sem colaboracao.
select set_config('request.jwt.claim.sub','d0000000-0000-4000-8000-000000000004',true);
select throws_ok($$select public.update_guild_task_collaboration('d3000000-0000-4000-8000-000000000002',p_status=>'doing')$$,'Sem permissao para alterar esta tarefa.','Integrante sem vinculo com tarefa bloqueado');
-- Colaborador pode registrar evidencia, mas nao trocar responsavel.
select lives_ok($$select public.update_guild_task_collaboration('d3000000-0000-4000-8000-000000000001',p_evidence=>'Teste RPC',p_set_evidence=>true)$$,'Colaborador registra evidencia');
select throws_ok($$select public.update_guild_task_collaboration('d3000000-0000-4000-8000-000000000001',p_responsible_user_id=>'d0000000-0000-4000-8000-000000000004',p_set_responsible=>true)$$,'Somente gestores podem alterar o responsavel.','Colaborador nao altera responsavel');
-- Responsavel pode alterar status.
select set_config('request.jwt.claim.sub','d0000000-0000-4000-8000-000000000003',true);
select lives_ok($$select public.update_guild_task_collaboration('d3000000-0000-4000-8000-000000000001',p_status=>'doing')$$,'Responsavel atualiza status via RPC');
-- Lider pode alterar atribuicao.
select set_config('request.jwt.claim.sub','d0000000-0000-4000-8000-000000000002',true);
select lives_ok($$select public.update_guild_task_collaboration('d3000000-0000-4000-8000-000000000001',p_responsible_user_id=>'d0000000-0000-4000-8000-000000000004',p_set_responsible=>true)$$,'Lider altera responsavel via RPC');
select * from finish();
rollback;
