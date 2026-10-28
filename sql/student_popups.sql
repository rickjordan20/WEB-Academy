-- Comunicados em pop-up, por turma, administrados exclusivamente pelo instrutor.
create table if not exists public.student_popups (
 id uuid primary key default gen_random_uuid(),
 class_id uuid not null references public.classes(id) on delete cascade,
 title text not null check(char_length(title) between 3 and 120),
 subtitle text not null default '' check(char_length(subtitle)<=500),
 items jsonb not null default '[]'::jsonb check(jsonb_typeof(items)='array' and jsonb_array_length(items) between 1 and 12),
 starts_at timestamptz not null,
 ends_at timestamptz not null,
 active boolean not null default true,
 created_by uuid not null references auth.users(id),
 updated_at timestamptz not null default now(),
 constraint popup_dates_valid check(ends_at>starts_at),
 constraint popup_duration_limit check(ends_at<=starts_at+interval '90 days')
);
create index if not exists student_popups_class_dates on public.student_popups(class_id,starts_at,ends_at);
alter table public.student_popups enable row level security;
grant select,insert,update,delete on public.student_popups to authenticated;
drop policy if exists "popups_read_class" on public.student_popups;
create policy "popups_read_class" on public.student_popups for select to authenticated using (
 exists(select 1 from public.classes c where c.id=class_id and c.instructor_id=(select auth.uid()))
 or (active and exists(select 1 from public.class_members m where m.class_id=student_popups.class_id and m.user_id=(select auth.uid()) and m.status='active'))
);
drop policy if exists "popups_insert_instructor" on public.student_popups;
create policy "popups_insert_instructor" on public.student_popups for insert to authenticated with check (
 created_by=(select auth.uid()) and exists(select 1 from public.classes c where c.id=class_id and c.instructor_id=(select auth.uid()))
);
drop policy if exists "popups_update_instructor" on public.student_popups;
create policy "popups_update_instructor" on public.student_popups for update to authenticated using (
 exists(select 1 from public.classes c where c.id=class_id and c.instructor_id=(select auth.uid()))
) with check (
 exists(select 1 from public.classes c where c.id=class_id and c.instructor_id=(select auth.uid()))
);
drop policy if exists "popups_delete_instructor" on public.student_popups;
create policy "popups_delete_instructor" on public.student_popups for delete to authenticated using (
 exists(select 1 from public.classes c where c.id=class_id and c.instructor_id=(select auth.uid()))
);
