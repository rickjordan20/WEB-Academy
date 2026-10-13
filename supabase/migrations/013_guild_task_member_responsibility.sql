-- Phase 9: assign Kanban tasks to real Guild members.
alter table public.guild_tasks
  add column if not exists responsible_user_id uuid references public.profiles(id) on delete set null;
create index if not exists guild_tasks_responsible_user_id_idx
  on public.guild_tasks(responsible_user_id);
