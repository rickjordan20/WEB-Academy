-- Mission curriculum traceability by class and project.
create table if not exists public.mission_curriculum_links (
 id uuid primary key default gen_random_uuid(),
 class_id uuid not null references public.classes(id) on delete cascade,
 mission_id text not null,
 project_id uuid not null references public.learning_projects(id) on delete cascade,
 requirement_codes text[] not null default '{}',
 indicator_codes text[] not null default '{}',
 implementation_note text not null default '',
 updated_by uuid references public.profiles(id),
 updated_at timestamptz not null default now(),
 unique(class_id, mission_id),
 constraint mission_curriculum_links_mission_id_check check (mission_id ~ '^[0-9]{1,2}[AB]$')
);
alter table public.mission_curriculum_links enable row level security;
create policy mission_curriculum_class_select on public.mission_curriculum_links for select to authenticated
using (public.is_class_instructor(class_id) or public.is_active_class_member(class_id));
create policy mission_curriculum_instructor_all on public.mission_curriculum_links for all to authenticated
using (public.is_class_instructor(class_id)) with check (public.is_class_instructor(class_id));
grant select, insert, update, delete on public.mission_curriculum_links to authenticated;
create index if not exists mission_curriculum_class_idx on public.mission_curriculum_links(class_id);
create index if not exists mission_curriculum_project_idx on public.mission_curriculum_links(project_id);
