-- Guard instructor-owned assessment data and keep prior feedback on resubmission.
-- Deploy only after validating with authenticated student and instructor sessions.
create table if not exists public.mission_submission_review_history (
 id bigint generated always as identity primary key,
 submission_id uuid not null references public.mission_submissions(id) on delete cascade,
 prior_status text not null,
 prior_grades jsonb not null,
 prior_feedback text not null,
 prior_reviewed_at timestamptz,
 prior_reviewed_by uuid,
 archived_at timestamptz not null default now()
);
alter table public.mission_submission_review_history enable row level security;
revoke all on public.mission_submission_review_history from anon, authenticated;
grant select on public.mission_submission_review_history to authenticated;
create policy "history student read" on public.mission_submission_review_history
 for select to authenticated using (exists(
 select 1 from public.mission_submissions s where s.id=submission_id and s.student_id=(select auth.uid())
));
create policy "history instructor read" on public.mission_submission_review_history
 for select to authenticated using (exists(
 select 1 from public.mission_submissions s join public.classes c on c.id=s.class_id
 where s.id=submission_id and c.instructor_id=(select auth.uid())
));
create or replace function public.protect_mission_submission_review()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid(); v_is_instructor boolean;
begin
 if tg_op='INSERT' then return new; end if;
 v_is_instructor:=exists(select 1 from public.classes c where c.id=old.class_id and c.instructor_id=v_uid);
 if not v_is_instructor then
  if old.status not in ('submitted','changes_requested') or new.status<>'submitted'
   or new.student_id is distinct from old.student_id
   or new.class_id is distinct from old.class_id
   or new.mission_id is distinct from old.mission_id
   or new.id is distinct from old.id then
   raise exception 'Alteração de entrega não autorizada';
  end if;
  if old.status='submitted' and (
    new.grades is distinct from old.grades or new.feedback is distinct from old.feedback
    or new.reviewed_by is distinct from old.reviewed_by or new.reviewed_at is distinct from old.reviewed_at
  ) then raise exception 'Campos avaliativos protegidos'; end if;
  if old.status='changes_requested' then
   if new.grades is distinct from '{}'::jsonb or new.feedback is distinct from ''
     or new.reviewed_by is not null or new.reviewed_at is not null then
     raise exception 'Reenvio deve reiniciar avaliação'; end if;
   insert into public.mission_submission_review_history
    (submission_id,prior_status,prior_grades,prior_feedback,prior_reviewed_at,prior_reviewed_by)
   values(old.id,old.status,old.grades,old.feedback,old.reviewed_at,old.reviewed_by);
  end if;
 end if;
 return new;
end; $$;
drop trigger if exists protect_mission_submission_review_trigger on public.mission_submissions;
create trigger protect_mission_submission_review_trigger before update on public.mission_submissions
 for each row execute function public.protect_mission_submission_review();
revoke all on function public.protect_mission_submission_review() from public,anon,authenticated;
