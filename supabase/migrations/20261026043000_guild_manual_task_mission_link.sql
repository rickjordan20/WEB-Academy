-- Permite várias tarefas manuais associadas à mesma missão, sem alterar as existentes.
drop index if exists public.guild_tasks_guild_mission_uidx;
create unique index if not exists guild_tasks_auto_mission_uidx
 on public.guild_tasks(guild_id,mission_id)
 where mission_id is not null and source='mission';

create or replace function public.create_guild_manual_task_for_mission(
 p_guild_id uuid,p_title text,p_description text,p_phase integer,
 p_responsible_user_id uuid default null,p_mission_id text default null
) returns public.guild_tasks language plpgsql security definer set search_path='' as $$
declare v_task public.guild_tasks;v_name text:='';v_mission text:=nullif(btrim(p_mission_id),'');
begin
 if not (private.is_guild_leader(p_guild_id) or private.is_instructor_of_guild(p_guild_id))
 then raise exception 'Somente o líder ou o instrutor pode criar tarefas.';end if;
 if nullif(btrim(p_title),'') is null or nullif(btrim(p_description),'') is null
 then raise exception 'Informe título e descrição.';end if;
 if p_phase<1 or p_phase>14 then raise exception 'Fase inválida.';end if;
 if p_responsible_user_id is not null then
  if not exists(select 1 from public.guild_members where guild_id=p_guild_id and user_id=p_responsible_user_id)
  then raise exception 'Responsável não pertence à Guilda.';end if;
  select coalesce(full_name,'') into v_name from public.profiles where id=p_responsible_user_id;
 end if;
 if v_mission is not null and not exists(
  select 1 from public.guild_tasks t where t.guild_id=p_guild_id and t.mission_id=v_mission and t.source='mission'
 ) then raise exception 'A missão precisa estar liberada e sincronizada no Kanban antes da associação.';end if;
 insert into public.guild_tasks(guild_id,mission_id,source,title,description,phase,status,responsible,responsible_user_id,competencies,evidence,history,created_by)
 values(p_guild_id,v_mission,'manual',btrim(p_title),btrim(p_description),p_phase,'todo',v_name,p_responsible_user_id,'{}'::text[],'',jsonb_build_array(jsonb_build_object('from',null,'to','todo','at',now())),auth.uid())
 returning * into v_task;
 return v_task;
end $$;
revoke all on function public.create_guild_manual_task_for_mission(uuid,text,text,integer,uuid,text) from public,anon;
grant execute on function public.create_guild_manual_task_for_mission(uuid,text,text,integer,uuid,text) to authenticated;
