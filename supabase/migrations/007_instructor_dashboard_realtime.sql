-- Phase 9: realtime updates for the instructor dashboard.
do $$ begin alter publication supabase_realtime add table public.student_states; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.guilds; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.guild_members; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.class_members; exception when duplicate_object then null; end $$;
