-- Cronograma por turma e UC. Gestão exclusiva do instrutor da turma.
create table if not exists public.class_schedule (
 id uuid primary key default gen_random_uuid(),
 class_id uuid not null references public.classes(id) on delete cascade,
 uc text not null check (length(trim(uc)) between 2 and 80),
 lesson_number integer not null check (lesson_number between 1 and 999),
 lesson_date date not null,
 execution_mode text not null check (execution_mode in ('Presencial','Remota Assíncrona','Remota Síncrona','Híbrida')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(class_id,uc,lesson_number),
 unique(class_id,uc,lesson_date)
);
create index if not exists class_schedule_class_date_idx on public.class_schedule(class_id,lesson_date);
alter table public.class_schedule enable row level security;
drop policy if exists class_schedule_select on public.class_schedule;
create policy class_schedule_select on public.class_schedule for select to authenticated using (
 exists(select 1 from public.classes c where c.id=class_id and c.instructor_id=(select auth.uid()))
 or exists(select 1 from public.class_members m where m.class_id=class_id and m.user_id=(select auth.uid()) and m.status='active')
);
drop policy if exists class_schedule_insert on public.class_schedule;
create policy class_schedule_insert on public.class_schedule for insert to authenticated with check (
 exists(select 1 from public.classes c join public.profiles p on p.id=c.instructor_id where c.id=class_id and c.instructor_id=(select auth.uid()) and p.role='instructor')
);
drop policy if exists class_schedule_update on public.class_schedule;
create policy class_schedule_update on public.class_schedule for update to authenticated using (
 exists(select 1 from public.classes c join public.profiles p on p.id=c.instructor_id where c.id=class_id and c.instructor_id=(select auth.uid()) and p.role='instructor')
) with check (
 exists(select 1 from public.classes c join public.profiles p on p.id=c.instructor_id where c.id=class_id and c.instructor_id=(select auth.uid()) and p.role='instructor')
);
drop policy if exists class_schedule_delete on public.class_schedule;
create policy class_schedule_delete on public.class_schedule for delete to authenticated using (
 exists(select 1 from public.classes c join public.profiles p on p.id=c.instructor_id where c.id=class_id and c.instructor_id=(select auth.uid()) and p.role='instructor')
);
grant select,insert,update,delete on public.class_schedule to authenticated;
-- Cadastro inicial somente da turma 2026.36.8; não altera aulas existentes.
insert into public.class_schedule(class_id,uc,lesson_number,lesson_date,execution_mode)
select v.class_id::uuid,v.uc,v.lesson_number,v.lesson_date::date,v.execution_mode
from (values
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',1,'2026-10-15','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',2,'2026-10-19','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',3,'2026-10-20','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',4,'2026-10-21','Remota Assíncrona'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',5,'2026-10-22','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',6,'2026-10-26','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',7,'2026-10-27','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',8,'2026-10-28','Remota Assíncrona'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',9,'2026-10-29','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',10,'2026-11-03','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',11,'2026-11-04','Remota Assíncrona'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',12,'2026-11-05','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',13,'2026-11-09','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',14,'2026-11-10','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',15,'2026-11-11','Remota Assíncrona'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',16,'2026-11-12','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',17,'2026-11-16','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',18,'2026-11-17','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',19,'2026-11-18','Remota Assíncrona'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',20,'2026-11-19','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',21,'2026-11-23','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',22,'2026-11-24','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',23,'2026-11-25','Remota Assíncrona'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',24,'2026-11-26','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',25,'2026-12-01','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',26,'2026-12-02','Remota Assíncrona'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',27,'2026-12-03','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',28,'2026-12-07','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',29,'2026-12-08','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',30,'2026-12-09','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',31,'2026-12-10','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',32,'2026-12-14','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',33,'2026-12-15','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',34,'2026-12-16','Presencial'),
('3bbc7c5a-0d3f-47f5-9c01-f13e971ebe43','UC7',35,'2026-12-17','Presencial')
) as v(class_id,uc,lesson_number,lesson_date,execution_mode)
where exists(select 1 from public.classes c where c.id=v.class_id::uuid)
on conflict (class_id,uc,lesson_number) do nothing;
