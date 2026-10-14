-- Atomic compare-and-swap for student state writes.
-- A stale device cannot overwrite a newer cloud version.
create or replace function public.save_student_state_cas(
 p_state jsonb, p_expected_updated_at timestamptz default null
) returns table(saved boolean, cloud_state jsonb, cloud_updated_at timestamptz)
language plpgsql security invoker set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_row public.student_states%rowtype; v_inserted boolean := false;
begin
 if v_uid is null then raise exception 'Authentication required'; end if;
 insert into public.student_states(user_id,state,updated_at)
 values(v_uid,p_state,clock_timestamp())
 on conflict(user_id) do nothing
 returning true into v_inserted;
 select * into v_row from public.student_states where user_id=v_uid for update;
 if p_expected_updated_at is null then
   -- Initial insert succeeds only if its exact content was inserted above.
   saved := coalesce(v_inserted,false);
 elsif v_row.updated_at = p_expected_updated_at then
   update public.student_states set state=p_state,updated_at=clock_timestamp()
   where user_id=v_uid returning * into v_row;
   saved := true;
 else
   saved := false;
 end if;
 cloud_state:=v_row.state;cloud_updated_at:=v_row.updated_at;return next;
end; $$;
revoke all on function public.save_student_state_cas(jsonb,timestamptz) from public;
grant execute on function public.save_student_state_cas(jsonb,timestamptz) to authenticated;
