-- Solicitação de ingresso em turmas; migração recuperada da estrutura em produção.
create table if not exists public.class_join_requests (
 id uuid primary key default gen_random_uuid(),
 class_id uuid not null references public.classes(id) on delete cascade,
 student_id uuid not null references public.profiles(id) on delete cascade,
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 requested_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by uuid references public.profiles(id),
 unique (class_id,student_id)
);
create index if not exists class_join_requests_instructor_idx on public.class_join_requests(class_id,status);
alter table public.class_join_requests enable row level security;
drop policy if exists class_join_requests_read on public.class_join_requests;
create policy class_join_requests_read on public.class_join_requests for select to authenticated
using (student_id=(select auth.uid()) or exists (select 1 from public.classes c where c.id=class_id and c.instructor_id=(select auth.uid())));
grant select on public.class_join_requests to authenticated;

create or replace function public.available_classes_for_join()
returns table(id uuid,code text,name text,uc text)
language sql stable security definer set search_path=''
as $$
 select c.id,c.code,c.name,c.uc from public.classes c order by c.code
$$;
revoke all on function public.available_classes_for_join() from public;
grant execute on function public.available_classes_for_join() to anon,authenticated;

create or replace function public.request_class_join(p_class_id uuid)
returns text language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=(select auth.uid()); v_role text;
begin
 if v_uid is null then raise exception 'Autenticação necessária'; end if;
 select role into v_role from public.profiles where id=v_uid;
 if v_role is distinct from 'student' then raise exception 'Solicitação disponível somente para estudantes'; end if;
 if not exists(select 1 from public.classes where id=p_class_id) then raise exception 'Turma não encontrada'; end if;
 if exists(select 1 from public.class_members where class_id=p_class_id and user_id=v_uid and status='active') then return 'active'; end if;
 insert into public.class_join_requests(class_id,student_id,status,requested_at,reviewed_at,reviewed_by)
 values(p_class_id,v_uid,'pending',now(),null,null)
 on conflict(class_id,student_id) do update set status='pending',requested_at=now(),reviewed_at=null,reviewed_by=null;
 return 'pending';
end $$;
revoke all on function public.request_class_join(uuid) from public;
grant execute on function public.request_class_join(uuid) to authenticated;

create or replace function public.review_class_join(p_request_id uuid,p_approve boolean)
returns text language plpgsql security definer set search_path=''
as $$
declare v_req public.class_join_requests%rowtype; v_uid uuid:=(select auth.uid());
begin
 select * into v_req from public.class_join_requests where id=p_request_id for update;
 if not found then raise exception 'Solicitação não encontrada'; end if;
 if not exists(select 1 from public.classes c join public.profiles p on p.id=c.instructor_id where c.id=v_req.class_id and c.instructor_id=v_uid and p.role='instructor') then raise exception 'Sem permissão para avaliar esta turma'; end if;
 if v_req.status<>'pending' then raise exception 'Solicitação já avaliada'; end if;
 update public.class_join_requests set status=case when p_approve then 'approved' else 'rejected' end,reviewed_at=now(),reviewed_by=v_uid where id=p_request_id;
 if p_approve then
  insert into public.class_members(class_id,user_id,status) values(v_req.class_id,v_req.student_id,'active')
  on conflict(class_id,user_id) do update set status='active';
 end if;
 return case when p_approve then 'approved' else 'rejected' end;
end $$;
revoke all on function public.review_class_join(uuid,boolean) from public;
grant execute on function public.review_class_join(uuid,boolean) to authenticated;

create or replace function public.instructor_pending_join_requests()
returns table(request_id uuid,class_id uuid,class_code text,student_name text,student_email text,requested_at timestamptz)
language sql stable security definer set search_path=''
as $$
 select r.id,r.class_id,c.code,p.full_name,p.email,r.requested_at
 from public.class_join_requests r
 join public.classes c on c.id=r.class_id
 join public.profiles p on p.id=r.student_id
 where c.instructor_id=(select auth.uid()) and r.status='pending'
 and exists(select 1 from public.profiles me where me.id=(select auth.uid()) and me.role='instructor')
 order by r.requested_at
$$;
revoke all on function public.instructor_pending_join_requests() from public;
grant execute on function public.instructor_pending_join_requests() to authenticated;
