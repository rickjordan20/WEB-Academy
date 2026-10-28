-- Execute em novas instâncias. Implantado no Supabase de produção em 2026-10-28.
CREATE TABLE IF NOT EXISTS public.achievement_rule_overrides(
 class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
 achievement_id text NOT NULL,
 name text NOT NULL CHECK(char_length(name) BETWEEN 3 AND 100),
 description text NOT NULL CHECK(char_length(description) BETWEEN 5 AND 500),
 icon text NOT NULL CHECK(char_length(icon) BETWEEN 1 AND 24),
 active boolean NOT NULL DEFAULT true,
 rule jsonb NOT NULL,
 updated_by uuid NOT NULL REFERENCES auth.users(id),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(class_id,achievement_id),
 CONSTRAINT achievement_rule_schema CHECK(
  jsonb_typeof(rule)='object' AND rule->>'type' IN ('mission_count','phase_count','mission_complete','phase_complete','guild_completion')
  AND (CASE rule->>'type'
    WHEN 'mission_count' THEN (rule->>'count') ~ '^[1-9][0-9]{0,2}$'
    WHEN 'phase_count' THEN (rule->>'count') ~ '^[1-9][0-9]{0,2}$'
    WHEN 'mission_complete' THEN (rule->>'mission_id') ~ '^(R[1-9][0-9]?|[1-9][0-9]?[AB])$'
    WHEN 'phase_complete' THEN (rule->>'phase') ~ '^[1-9][0-9]?$'
    WHEN 'guild_completion' THEN true ELSE false END)
 )
);
ALTER TABLE public.achievement_rule_overrides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS achievement_rules_read ON public.achievement_rule_overrides;
CREATE POLICY achievement_rules_read ON public.achievement_rule_overrides FOR SELECT TO authenticated USING (
 EXISTS(SELECT 1 FROM public.class_members m WHERE m.class_id=achievement_rule_overrides.class_id AND m.user_id=(SELECT auth.uid()) AND m.status='active')
 OR EXISTS(SELECT 1 FROM public.classes c WHERE c.id=achievement_rule_overrides.class_id AND c.instructor_id=(SELECT auth.uid()))
);
DROP POLICY IF EXISTS achievement_rules_write ON public.achievement_rule_overrides;
CREATE POLICY achievement_rules_write ON public.achievement_rule_overrides FOR ALL TO authenticated USING (
 EXISTS(SELECT 1 FROM public.classes c WHERE c.id=achievement_rule_overrides.class_id AND c.instructor_id=(SELECT auth.uid()))
) WITH CHECK (
 updated_by=(SELECT auth.uid()) AND EXISTS(SELECT 1 FROM public.classes c WHERE c.id=achievement_rule_overrides.class_id AND c.instructor_id=(SELECT auth.uid()))
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.achievement_rule_overrides TO authenticated;
