-- UC7: entregas e avaliações independentes do progresso gamificado.
create table if not exists public.mission_submissions (
 id uuid primary key default gen_random_uuid(),
 class_id uuid not null references public.classes(id),
 student_id uuid not null references auth.users(id),
 mission_id text not null check (mission_id ~ '^[0-9]{1,2}[AB]$'),
 answers jsonb not null default '{}'::jsonb,
 evidence jsonb not null default '[]'::jsonb,
 status text not null default 'submitted' check (status in ('submitted','changes_requested','evaluated')),
 submitted_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by uuid references auth.users(id),
 feedback text not null default '',
 grades jsonb not null default '{}'::jsonb,
 constraint mission_submission_unique unique(class_id,student_id,mission_id)
);
create index if not exists mission_submissions_class_status_idx on public.mission_submissions(class_id,status,submitted_at desc);
alter table public.mission_submissions enable row level security;
revoke all on public.mission_submissions from anon,authenticated;
grant select,insert,update on public.mission_submissions to authenticated;

create policy mission_submission_student_read on public.mission_submissions for select to authenticated
 using(student_id=(select auth.uid()) and exists(select 1 from public.class_members cm where cm.class_id=mission_submissions.class_id and cm.user_id=(select auth.uid()) and cm.status='active'));
create policy mission_submission_instructor_read on public.mission_submissions for select to authenticated
 using(exists(select 1 from public.classes c where c.id=mission_submissions.class_id and c.instructor_id=(select auth.uid())));
create policy mission_submission_student_insert on public.mission_submissions for insert to authenticated
 with check(student_id=(select auth.uid()) and status='submitted' and reviewed_at is null and reviewed_by is null and feedback='' and grades='{}'::jsonb and exists(select 1 from public.class_members cm where cm.class_id=mission_submissions.class_id and cm.user_id=(select auth.uid()) and cm.status='active'));
-- Updates go through security-definer RPCs with explicit ownership and state transitions.
revoke update on public.mission_submissions from authenticated;

create or replace function public.submit_mission_work(p_class_id uuid,p_mission_id text,p_answers jsonb,p_evidence jsonb)
returns public.mission_submissions language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid();v_row public.mission_submissions;
begin
 if v_uid is null or not exists(select 1 from public.class_members cm where cm.class_id=p_class_id and cm.user_id=v_uid and cm.status='active') then raise exception 'Matrícula ativa necessária';end if;
 if p_mission_id !~ '^[0-9]{1,2}[AB]$' or jsonb_typeof(p_answers)<>'object' or jsonb_typeof(p_evidence)<>'array' then raise exception 'Dados de entrega inválidos';end if;
 if pg_column_size(p_answers)>131072 or pg_column_size(p_evidence)>65536 then raise exception 'Entrega excede o limite';end if;
 insert into public.mission_submissions(class_id,student_id,mission_id,answers,evidence)
 values(p_class_id,v_uid,p_mission_id,p_answers,p_evidence)
 on conflict(class_id,student_id,mission_id) do update
 set answers=excluded.answers,evidence=excluded.evidence,status='submitted',submitted_at=now(),reviewed_at=null,reviewed_by=null,feedback='',grades='{}'::jsonb
 where mission_submissions.status='changes_requested'
 returning * into v_row;
 if not found then raise exception 'Entrega já enviada. Aguarde avaliação ou solicitação de ajustes';end if;
 return v_row;
end $$;

create or replace function public.review_mission_work(p_submission_id uuid,p_status text,p_grades jsonb,p_feedback text)
returns public.mission_submissions language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid();v_row public.mission_submissions;v_key text;v_val text;
begin
 select * into v_row from public.mission_submissions where id=p_submission_id for update;
 if not found or v_uid is null or not exists(select 1 from public.classes c where c.id=v_row.class_id and c.instructor_id=v_uid) then raise exception 'Entrega inexistente ou sem permissão';end if;
 if v_row.status<>'submitted' then raise exception 'Esta entrega não está pendente de avaliação';end if;
 if p_status not in ('evaluated','changes_requested') or length(coalesce(p_feedback,''))>5000 or jsonb_typeof(p_grades)<>'object' then raise exception 'Avaliação inválida';end if;
 for v_key,v_val in select key,value from jsonb_each_text(p_grades) loop
  if v_key not in ('I1','I2','I3','I4','I5','I6') or v_val not in ('A','PA','NA') then raise exception 'Menção inválida';end if;
 end loop;
 if p_status='changes_requested' and length(trim(coalesce(p_feedback,'')))=0 then raise exception 'Informe os ajustes necessários';end if;
 update public.mission_submissions set status=p_status,grades=p_grades,feedback=coalesce(p_feedback,''),reviewed_by=v_uid,reviewed_at=now()
 where id=p_submission_id returning * into v_row;
 return v_row;
end $$;
revoke all on function public.submit_mission_work(uuid,text,jsonb,jsonb) from public;
revoke all on function public.review_mission_work(uuid,text,jsonb,text) from public;
grant execute on function public.submit_mission_work(uuid,text,jsonb,jsonb) to authenticated;
grant execute on function public.review_mission_work(uuid,text,jsonb,text) to authenticated;
