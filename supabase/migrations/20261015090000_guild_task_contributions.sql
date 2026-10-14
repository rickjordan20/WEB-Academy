-- Registro simples e persistente das contribuicoes individuais nas tarefas da Guilda.
-- O quadro continua leve: nao exige subdividir cada tarefa em subtarefas.
create table if not exists public.guild_task_contributions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.guild_tasks(id) on delete cascade,
  guild_id uuid not null references public.guilds(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  summary text not null check (length(trim(summary)) between 1 and 1200),
  evidence_url text,
  created_at timestamptz not null default now(),
  constraint guild_task_contributions_evidence_url_check
    check (evidence_url is null or evidence_url ~* '^https?://')
);
create index if not exists guild_task_contributions_guild_task_date_idx
  on public.guild_task_contributions(guild_id, task_id, created_at desc);
create index if not exists guild_task_contributions_author_idx
  on public.guild_task_contributions(author_id, created_at desc);

alter table public.guild_task_contributions enable row level security;
revoke all on public.guild_task_contributions from anon, authenticated;
grant select, insert, delete on public.guild_task_contributions to authenticated;

drop policy if exists guild_task_contributions_select on public.guild_task_contributions;
create policy guild_task_contributions_select on public.guild_task_contributions
for select to authenticated using (
  private.is_instructor_of_guild(guild_id)
  or private.is_active_guild_member(guild_id, auth.uid())
);

drop policy if exists guild_task_contributions_insert on public.guild_task_contributions;
create policy guild_task_contributions_insert on public.guild_task_contributions
for insert to authenticated with check (
  author_id = auth.uid()
  and private.is_active_guild_member(guild_id, auth.uid())
  and exists (
    select 1 from public.guild_tasks t
    where t.id = guild_task_contributions.task_id and t.guild_id = guild_task_contributions.guild_id
  )
);

drop policy if exists guild_task_contributions_delete on public.guild_task_contributions;
create policy guild_task_contributions_delete on public.guild_task_contributions
for delete to authenticated using (
  author_id = auth.uid()
  or private.can_manage_guild_task(task_id)
);
