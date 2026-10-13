-- Phase 9: cover guild_tasks.created_by foreign key for maintenance and instructor queries.
create index if not exists guild_tasks_created_by_idx on public.guild_tasks(created_by);
