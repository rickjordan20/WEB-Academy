create type public.app_role as enum ('student','instructor');
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '',
 email text,
 role public.app_role not null default 'student',
 created_at timestamptz not null default now()
);
create table public.classes (
 id uuid primary key default gen_random_uuid(),
 code text not null unique,
 name text not null,
 uc text not null,
 instructor_id uuid not null references public.profiles(id),
 created_at timestamptz not null default now()
);
create table public.class_members (
 class_id uuid not null references public.classes(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 status text not null default 'active' check(status in ('active','inactive')),
 primary key(class_id,user_id)
);
create table public.guilds (
 id uuid primary key default gen_random_uuid(),
 class_id uuid not null references public.classes(id) on delete cascade,
 name text not null,
 repository text not null default '',
 created_by uuid not null references public.profiles(id),
 unique(class_id,name)
);
create table public.guild_members (
 guild_id uuid not null references public.guilds(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 role text not null default 'member' check(role in ('member','leader')),
 primary key(guild_id,user_id)
);
create table public.student_states (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 state jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.guilds enable row level security;
alter table public.guild_members enable row level security;
alter table public.student_states enable row level security;
create policy profiles_self_select on public.profiles for select to authenticated using(id=auth.uid());
create policy profiles_self_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy states_self_all on public.student_states for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy classes_member_select on public.classes for select to authenticated using(instructor_id=auth.uid() or exists(select 1 from public.class_members cm where cm.class_id=id and cm.user_id=auth.uid() and cm.status='active'));
create policy classes_instructor_all on public.classes for all to authenticated using(instructor_id=auth.uid()) with check(instructor_id=auth.uid());
create policy members_class_select on public.class_members for select to authenticated using(user_id=auth.uid() or exists(select 1 from public.classes c where c.id=class_id and c.instructor_id=auth.uid()));
create policy members_instructor_all on public.class_members for all to authenticated using(exists(select 1 from public.classes c where c.id=class_id and c.instructor_id=auth.uid())) with check(exists(select 1 from public.classes c where c.id=class_id and c.instructor_id=auth.uid()));
create policy guilds_class_select on public.guilds for select to authenticated using(exists(select 1 from public.class_members cm where cm.class_id=class_id and cm.user_id=auth.uid()) or exists(select 1 from public.classes c where c.id=class_id and c.instructor_id=auth.uid()));
create policy guilds_instructor_all on public.guilds for all to authenticated using(exists(select 1 from public.classes c where c.id=class_id and c.instructor_id=auth.uid())) with check(exists(select 1 from public.classes c where c.id=class_id and c.instructor_id=auth.uid()));
create policy guild_members_select on public.guild_members for select to authenticated using(user_id=auth.uid() or exists(select 1 from public.guilds g join public.classes c on c.id=g.class_id where g.id=guild_id and c.instructor_id=auth.uid()));
create policy guild_members_instructor_all on public.guild_members for all to authenticated using(exists(select 1 from public.guilds g join public.classes c on c.id=g.class_id where g.id=guild_id and c.instructor_id=auth.uid())) with check(exists(select 1 from public.guilds g join public.classes c on c.id=g.class_id where g.id=guild_id and c.instructor_id=auth.uid()));
create policy states_instructor_select on public.student_states for select to authenticated using(exists(select 1 from public.class_members cm join public.classes c on c.id=cm.class_id where cm.user_id=student_states.user_id and c.instructor_id=auth.uid()));
create index class_members_user_idx on public.class_members(user_id);
create index guilds_class_idx on public.guilds(class_id);
create index guild_members_user_idx on public.guild_members(user_id);
