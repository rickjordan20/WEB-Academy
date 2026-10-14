-- Central catalog of curriculum indicators for each class.
create table if not exists public.curriculum_indicators (
 id uuid primary key default gen_random_uuid(),
 class_id uuid not null references public.classes(id) on delete cascade,
 code text not null,
 name text not null,
 description text not null,
 sort_order integer not null default 0,
 created_by uuid references public.profiles(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(class_id,code),
 check (length(trim(code)) > 0),
 check (length(trim(name)) > 0)
);
alter table public.curriculum_indicators enable row level security;
create policy curriculum_indicators_class_select on public.curriculum_indicators for select to authenticated
using(private.is_class_instructor(class_id) or private.is_active_class_member(class_id));
create policy curriculum_indicators_instructor_all on public.curriculum_indicators for all to authenticated
using(private.is_class_instructor(class_id)) with check(private.is_class_instructor(class_id));
grant select on public.curriculum_indicators to authenticated;
grant insert,update,delete on public.curriculum_indicators to authenticated;
create index if not exists curriculum_indicators_class_idx on public.curriculum_indicators(class_id);

-- Indicators are now dynamic. Keep mission links as references by code, without a fixed I1-I6 constraint.
alter table public.mission_curriculum_links
 drop constraint if exists mission_curriculum_links_indicator_codes_check;
