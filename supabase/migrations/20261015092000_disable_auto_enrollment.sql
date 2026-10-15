-- Remove a matrícula automática herdada da UC7.
-- Novos estudantes devem solicitar ingresso e aguardar aprovação do instrutor.
drop trigger if exists profiles_auto_enroll_uc7 on public.profiles;
drop function if exists public.auto_enroll_uc7_student();
