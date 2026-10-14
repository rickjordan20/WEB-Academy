-- Restore project tables required by mission curriculum links.
-- Schema and access model mirror the existing cloud database; local only until deployment.
create table if not exists public.learning_projects (
 id uuid primary key default gen_random_uuid(),
 class_id uuid not null references public.classes(id) on delete cascade,
 name text not null,
 slug text not null,
 project_type text not null check (project_type in ('guided','guild')),
 client_name text,
 context text not null default '',
 problem text not null default '',
 target_audience text not null default '',
 objective text not null default '',
 scope text not null default '',
 technologies text[] not null default '{}',
 constraints text not null default '',
 deliverables text not null default '',
 active boolean not null default true,
 is_template boolean not null default false,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(class_id,slug)
);
alter table public.learning_projects enable row level security;
grant select,insert,update,delete on public.learning_projects to authenticated;
create policy learning_projects_select on public.learning_projects for select to authenticated
 using(private.is_class_instructor(class_id) or private.is_active_class_member(class_id));
create policy learning_projects_insert on public.learning_projects for insert to authenticated
 with check(private.is_class_instructor(class_id) and created_by=(select auth.uid()));
create policy learning_projects_update on public.learning_projects for update to authenticated
 using(private.is_class_instructor(class_id)) with check(private.is_class_instructor(class_id));
create policy learning_projects_delete on public.learning_projects for delete to authenticated
 using(private.is_class_instructor(class_id));
create index if not exists learning_projects_class_idx on public.learning_projects(class_id);

create table if not exists public.project_requirements (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.learning_projects(id) on delete cascade,
 code text not null,
 requirement_type text not null default 'functional' check (requirement_type in ('functional','non_functional')),
 title text not null,
 description text not null default '',
 acceptance_criteria text[] not null default '{}',
 indicators text[] not null default '{}',
 sort_order integer not null default 0,
 active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(project_id,code)
);
alter table public.project_requirements enable row level security;
grant select,insert,update,delete on public.project_requirements to authenticated;
create policy project_requirements_select on public.project_requirements for select to authenticated
 using(exists(select 1 from public.learning_projects p where p.id=project_id and (private.is_class_instructor(p.class_id) or private.is_active_class_member(p.class_id))));
create policy project_requirements_insert on public.project_requirements for insert to authenticated
 with check(exists(select 1 from public.learning_projects p where p.id=project_id and private.is_class_instructor(p.class_id)));
create policy project_requirements_update on public.project_requirements for update to authenticated
 using(exists(select 1 from public.learning_projects p where p.id=project_id and private.is_class_instructor(p.class_id)))
 with check(exists(select 1 from public.learning_projects p where p.id=project_id and private.is_class_instructor(p.class_id)));
create policy project_requirements_delete on public.project_requirements for delete to authenticated
 using(exists(select 1 from public.learning_projects p where p.id=project_id and private.is_class_instructor(p.class_id)));
create index if not exists project_requirements_project_idx on public.project_requirements(project_id);

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
using (private.is_class_instructor(class_id) or private.is_active_class_member(class_id));
create policy mission_curriculum_instructor_all on public.mission_curriculum_links for all to authenticated
using (private.is_class_instructor(class_id)) with check (private.is_class_instructor(class_id));
grant select, insert, update, delete on public.mission_curriculum_links to authenticated;
create index if not exists mission_curriculum_class_idx on public.mission_curriculum_links(class_id);
create index if not exists mission_curriculum_project_idx on public.mission_curriculum_links(project_id);
