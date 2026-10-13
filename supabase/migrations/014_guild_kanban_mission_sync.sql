-- Phase 9: synchronize Guild Kanban cards with released Guild missions.
alter table public.guild_tasks add column if not exists mission_id text;
alter table public.guild_tasks add column if not exists source text not null default 'manual';
alter table public.guild_tasks drop constraint if exists guild_tasks_source_check;
alter table public.guild_tasks add constraint guild_tasks_source_check
  check (source in ('manual','mission'));
create unique index if not exists guild_tasks_guild_mission_uidx
  on public.guild_tasks(guild_id,mission_id) where mission_id is not null;
