-- Complemento local: valida o responsavel na criacao de tarefas da Guilda.
-- Nao modifica a migracao 20261014215135 ja aplicada.
create or replace function public.guild_tasks_insert_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.responsible_user_id is not null
     and not exists (
       select 1
       from public.guild_members gm
       join public.guilds g on g.id = gm.guild_id
       join public.class_members cm
         on cm.class_id = g.class_id
        and cm.user_id = gm.user_id
        and cm.status = 'active'
       where gm.guild_id = new.guild_id
         and gm.user_id = new.responsible_user_id
     )
  then
    raise exception 'O responsavel deve ser integrante ativo da Guilda'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists guild_tasks_insert_guard_trigger on public.guild_tasks;

create trigger guild_tasks_insert_guard_trigger
before insert on public.guild_tasks
for each row
execute function public.guild_tasks_insert_guard();

revoke all on function public.guild_tasks_insert_guard() from public, anon;
