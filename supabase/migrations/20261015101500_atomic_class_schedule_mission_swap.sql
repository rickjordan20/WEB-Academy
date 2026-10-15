create or replace function public.swap_class_schedule_missions(p_source_id uuid,p_target_id uuid)
returns void language plpgsql security definer set search_path=public
as $$
declare a public.class_schedule%rowtype; b public.class_schedule%rowtype;
begin
 if p_source_id is null or p_target_id is null or p_source_id=p_target_id then raise exception 'Selecione duas aulas diferentes.'; end if;
 perform 1 from public.class_schedule where id in (p_source_id,p_target_id) order by id for update;
 select * into a from public.class_schedule where id=p_source_id;
 select * into b from public.class_schedule where id=p_target_id;
 if a.id is null or b.id is null then raise exception 'Aula não encontrada.'; end if;
 if not exists(select 1 from public.classes c join public.profiles p on p.id=c.instructor_id where c.id=a.class_id and c.instructor_id=auth.uid() and p.role='instructor') then raise exception 'Somente o instrutor responsável pode trocar missões.'; end if;
 if a.class_id<>b.class_id or a.uc<>b.uc or a.execution_mode<>b.execution_mode then raise exception 'A troca exige a mesma turma, UC e modalidade.'; end if;
 update public.class_schedule set mission_id=null where id in (a.id,b.id);
 update public.class_schedule set mission_id=b.mission_id where id=a.id;
 update public.class_schedule set mission_id=a.mission_id where id=b.id;
end $$;
revoke all on function public.swap_class_schedule_missions(uuid,uuid) from public,anon;
grant execute on function public.swap_class_schedule_missions(uuid,uuid) to authenticated;