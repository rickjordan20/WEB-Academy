create or replace function public.create_guild_manual_task(
  p_guild_id uuid, p_title text, p_description text, p_phase integer, p_responsible_user_id uuid default null
) returns public.guild_tasks language plpgsql security definer set search_path='' as $$
declare v_task public.guild_tasks; v_name text := '';
begin
 if not (private.is_guild_leader(p_guild_id) or private.is_instructor_of_guild(p_guild_id)) then raise exception 'Somente o líder da Guilda ou o instrutor pode criar tarefas manuais.'; end if;
 if nullif(btrim(p_title),'') is null or nullif(btrim(p_description),'') is null then raise exception 'Informe o título e a descrição da tarefa.'; end if;
 if p_phase<1 or p_phase>14 then raise exception 'A fase deve estar entre 1 e 14.'; end if;
 if p_responsible_user_id is not null then
  if not exists(select 1 from public.guild_members gm where gm.guild_id=p_guild_id and gm.user_id=p_responsible_user_id) then raise exception 'O responsável precisa pertencer à Guilda.'; end if;
  select coalesce(p.full_name,'') into v_name from public.profiles p where p.id=p_responsible_user_id;
 end if;
 insert into public.guild_tasks(guild_id,mission_id,source,title,description,phase,status,responsible,responsible_user_id,competencies,evidence,history,created_by)
 values(p_guild_id,null,'manual',btrim(p_title),btrim(p_description),p_phase,'todo',v_name,p_responsible_user_id,'{}'::text[],'',jsonb_build_array(jsonb_build_object('from',null,'to','todo','at',now(),'responsible',v_name)),(select auth.uid()))
 returning * into v_task;
 return v_task;
end $$;
revoke all on function public.create_guild_manual_task(uuid,text,text,integer,uuid) from public,anon;
grant execute on function public.create_guild_manual_task(uuid,text,text,integer,uuid) to authenticated;