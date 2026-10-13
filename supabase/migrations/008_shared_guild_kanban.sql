-- Phase 9: shared, realtime Kanban for each Guild.
create table if not exists public.guild_tasks (
 id uuid primary key default gen_random_uuid(),
 guild_id uuid not null references public.guilds(id) on delete cascade,
 title text not null check (char_length(trim(title)) between 1 and 160),
 description text not null default '',
 phase integer not null default 1 check (phase between 1 and 14),
 status text not null default 'todo' check (status in ('todo','doing','review','done')),
 responsible text not null default '',
 competencies text[] not null default '{}',
 evidence text not null default '',
 history jsonb not null default '[]'::jsonb,
 created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.guild_tasks enable row level security;
grant select,insert,update,delete on public.guild_tasks to authenticated;
drop policy if exists guild_tasks_select on public.guild_tasks;
create policy guild_tasks_select on public.guild_tasks for select to authenticated using(private.is_member_of_guild(guild_id) or private.is_instructor_of_guild(guild_id));
drop policy if exists guild_tasks_insert on public.guild_tasks;
create policy guild_tasks_insert on public.guild_tasks for insert to authenticated with check((private.is_member_of_guild(guild_id) or private.is_instructor_of_guild(guild_id)) and created_by=(select auth.uid()));
drop policy if exists guild_tasks_update on public.guild_tasks;
create policy guild_tasks_update on public.guild_tasks for update to authenticated using(private.is_member_of_guild(guild_id) or private.is_instructor_of_guild(guild_id)) with check(private.is_member_of_guild(guild_id) or private.is_instructor_of_guild(guild_id));
drop policy if exists guild_tasks_delete on public.guild_tasks;
create policy guild_tasks_delete on public.guild_tasks for delete to authenticated using(private.is_member_of_guild(guild_id) or private.is_instructor_of_guild(guild_id));
create index if not exists guild_tasks_guild_id_idx on public.guild_tasks(guild_id);
do $$ begin alter publication supabase_realtime add table public.guild_tasks; exception when duplicate_object then null; end $$;
