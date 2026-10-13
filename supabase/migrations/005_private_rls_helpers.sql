create schema if not exists private;

create or replace function private.is_class_instructor(p_class_id uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.classes c where c.id=p_class_id and c.instructor_id=(select auth.uid())) $$;
create or replace function private.is_active_class_member(p_class_id uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.class_members cm where cm.class_id=p_class_id and cm.user_id=(select auth.uid()) and cm.status='active') $$;
create or replace function private.is_instructor_of_student(p_user_id uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.class_members cm join public.classes c on c.id=cm.class_id where cm.user_id=p_user_id and cm.status='active' and c.instructor_id=(select auth.uid())) $$;
create or replace function private.is_instructor_of_guild(p_guild_id uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.guilds g join public.classes c on c.id=g.class_id where g.id=p_guild_id and c.instructor_id=(select auth.uid())) $$;

grant usage on schema private to authenticated;
grant execute on function private.is_class_instructor(uuid), private.is_active_class_member(uuid), private.is_instructor_of_student(uuid), private.is_instructor_of_guild(uuid) to authenticated;

drop policy members_delete on public.class_members; drop policy members_insert on public.class_members; drop policy members_select on public.class_members; drop policy members_update on public.class_members;
create policy members_delete on public.class_members for delete to authenticated using(private.is_class_instructor(class_id));
create policy members_insert on public.class_members for insert to authenticated with check(private.is_class_instructor(class_id));
create policy members_select on public.class_members for select to authenticated using(user_id=(select auth.uid()) or private.is_class_instructor(class_id));
create policy members_update on public.class_members for update to authenticated using(private.is_class_instructor(class_id)) with check(private.is_class_instructor(class_id));

drop policy classes_select on public.classes;
create policy classes_select on public.classes for select to authenticated using(instructor_id=(select auth.uid()) or private.is_active_class_member(id));

drop policy guilds_delete on public.guilds; drop policy guilds_insert on public.guilds; drop policy guilds_select on public.guilds; drop policy guilds_update on public.guilds;
create policy guilds_delete on public.guilds for delete to authenticated using(private.is_class_instructor(class_id));
create policy guilds_insert on public.guilds for insert to authenticated with check(private.is_class_instructor(class_id));
create policy guilds_select on public.guilds for select to authenticated using(private.is_active_class_member(class_id) or private.is_class_instructor(class_id));
create policy guilds_update on public.guilds for update to authenticated using(private.is_class_instructor(class_id)) with check(private.is_class_instructor(class_id));

drop policy guild_members_delete on public.guild_members; drop policy guild_members_insert on public.guild_members; drop policy guild_members_select on public.guild_members; drop policy guild_members_update on public.guild_members;
create policy guild_members_delete on public.guild_members for delete to authenticated using(private.is_instructor_of_guild(guild_id));
create policy guild_members_insert on public.guild_members for insert to authenticated with check(private.is_instructor_of_guild(guild_id));
create policy guild_members_select on public.guild_members for select to authenticated using(user_id=(select auth.uid()) or private.is_instructor_of_guild(guild_id));
create policy guild_members_update on public.guild_members for update to authenticated using(private.is_instructor_of_guild(guild_id)) with check(private.is_instructor_of_guild(guild_id));

drop policy profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using(id=(select auth.uid()) or private.is_instructor_of_student(id));
drop policy states_select on public.student_states;
create policy states_select on public.student_states for select to authenticated using(user_id=(select auth.uid()) or private.is_instructor_of_student(user_id));

drop function public.is_class_instructor(uuid);
drop function public.is_active_class_member(uuid);
drop function public.is_instructor_of_student(uuid);
drop function public.is_instructor_of_guild(uuid);
