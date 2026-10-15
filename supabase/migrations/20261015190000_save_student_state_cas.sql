-- Atomic, authenticated compare-and-swap for student progress.
create or replace function public.save_student_state_cas(
 p_state jsonb,
 p_expected_updated_at timestamptz default null
)
returns table(saved boolean, cloud_state jsonb, cloud_updated_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare
 v_uid uuid := auth.uid();
 v_current_state jsonb;
 v_current_at timestamptz;
 v_new_at timestamptz;
begin
 if v_uid is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if p_state is null or jsonb_typeof(p_state) <> 'object' then
  raise exception 'Invalid progress state' using errcode='22023';
 end if;
 if pg_column_size(p_state)>1048576 then raise exception 'Progress state too large' using errcode='22023';end if;
 -- Serializes writes per authenticated user, including first-time inserts.
 perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 17071));
 select ss.state,ss.updated_at into v_current_state,v_current_at
 from public.student_states ss where ss.user_id=v_uid for update;
 if found then
  if p_expected_updated_at is distinct from v_current_at then
   return query select false,v_current_state,v_current_at;
   return;
  end if;
  v_new_at:=greatest(clock_timestamp(),v_current_at+interval '1 microsecond');
  update public.student_states ss set state=p_state,updated_at=v_new_at where ss.user_id=v_uid;
 else
  if p_expected_updated_at is not null then
   return query select false,null::jsonb,null::timestamptz;
   return;
  end if;
  v_new_at:=clock_timestamp();
  insert into public.student_states(user_id,state,updated_at) values(v_uid,p_state,v_new_at);
 end if;
 return query select true,p_state,v_new_at;
end;
$$;
revoke all on function public.save_student_state_cas(jsonb,timestamptz) from public;
grant execute on function public.save_student_state_cas(jsonb,timestamptz) to authenticated;
