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

create or replace function public.is_class_instructor(p_class_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.classes c where c.id=p_class_id and c.instructor_id=auth.uid()) $$;
create or replace function public.is_active_class_member(p_class_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.class_members cm where cm.class_id=p_class_id and cm.user_id=auth.uid() and cm.status='active') $$;
create or replace function public.is_instructor_of_student(p_user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.class_members cm join public.classes c on c.id=cm.class_id where cm.user_id=p_user_id and cm.status='active' and c.instructor_id=auth.uid()) $$;
create or replace function public.is_instructor_of_guild(p_guild_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.guilds g join public.classes c on c.id=g.class_id where g.id=p_guild_id and c.instructor_id=auth.uid()) $$;
revoke all on function public.is_class_instructor(uuid) from public;
revoke all on function public.is_active_class_member(uuid) from public;
revoke all on function public.is_instructor_of_student(uuid) from public;
revoke all on function public.is_instructor_of_guild(uuid) from public;
revoke execute on function public.is_class_instructor(uuid) from public;
revoke execute on function public.is_active_class_member(uuid) from public;
revoke execute on function public.is_instructor_of_student(uuid) from public;
revoke execute on function public.is_instructor_of_guild(uuid) from public;

create or replace function public.protect_profile_role()
returns trigger language plpgsql set search_path=public as $$
begin
 if new.role is distinct from old.role and auth.uid() = old.id then
   raise exception 'role cannot be changed by the profile owner';
 end if;
 return new;
end $$;
create trigger profiles_protect_role before update of role on public.profiles
for each row execute function public.protect_profile_role();

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.guilds enable row level security;
alter table public.guild_members enable row level security;
alter table public.student_states enable row level security;

create policy profiles_self_insert on public.profiles for insert to authenticated with check(id=auth.uid() and role='student');
create policy profiles_self_select on public.profiles for select to authenticated using(id=auth.uid());
create policy profiles_instructor_select on public.profiles for select to authenticated using(public.is_instructor_of_student(id));
create policy profiles_self_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());

create policy states_self_all on public.student_states for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy states_instructor_select on public.student_states for select to authenticated using(public.is_instructor_of_student(user_id));

create policy classes_member_select on public.classes for select to authenticated using(instructor_id=auth.uid() or public.is_active_class_member(id));
create policy classes_instructor_all on public.classes for all to authenticated using(instructor_id=auth.uid()) with check(instructor_id=auth.uid());

create policy members_class_select on public.class_members for select to authenticated using(user_id=auth.uid() or public.is_class_instructor(class_id));
create policy members_instructor_all on public.class_members for all to authenticated using(public.is_class_instructor(class_id)) with check(public.is_class_instructor(class_id));

create policy guilds_class_select on public.guilds for select to authenticated using(public.is_active_class_member(class_id) or public.is_class_instructor(class_id));
create policy guilds_instructor_all on public.guilds for all to authenticated using(public.is_class_instructor(class_id)) with check(public.is_class_instructor(class_id));

create policy guild_members_select on public.guild_members for select to authenticated using(user_id=auth.uid() or public.is_instructor_of_guild(guild_id));
create policy guild_members_instructor_all on public.guild_members for all to authenticated using(public.is_instructor_of_guild(guild_id)) with check(public.is_instructor_of_guild(guild_id));

create index classes_instructor_idx on public.classes(instructor_id);
create index class_members_user_idx on public.class_members(user_id);
create index guilds_class_idx on public.guilds(class_id);
create index guilds_created_by_idx on public.guilds(created_by);
create index guild_members_user_idx on public.guild_members(user_id);
