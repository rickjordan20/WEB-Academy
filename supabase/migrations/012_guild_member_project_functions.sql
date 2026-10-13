-- Phase 9: project responsibilities inside each Guild.
-- Permission role (leader/member) remains separate from the student's project function.
alter table public.guild_members add column if not exists project_function text not null default 'not_defined';
alter table public.guild_members drop constraint if exists guild_members_project_function_check;
alter table public.guild_members add constraint guild_members_project_function_check
check (project_function in ('not_defined','frontend','backend','database','qa','fullstack'));
