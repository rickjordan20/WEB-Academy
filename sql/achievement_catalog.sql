-- Catálogo de conquistas personalizadas da WEB Academy.
-- Aplicado no Supabase em 2026-10-28. Execute somente em ambientes novos.
CREATE TABLE IF NOT EXISTS public.achievement_catalog (
 id text PRIMARY KEY CHECK (id ~ '^custom-[a-z0-9-]{3,60}$'),
 name text NOT NULL CHECK (char_length(name) BETWEEN 3 AND 100),
 description text NOT NULL CHECK (char_length(description) BETWEEN 5 AND 500),
 icon text NOT NULL DEFAULT '🏅' CHECK (char_length(icon) BETWEEN 1 AND 24),
 class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
 active boolean NOT NULL DEFAULT true,
 created_by uuid NOT NULL REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.achievement_grants (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 achievement_id text NOT NULL REFERENCES public.achievement_catalog(id) ON DELETE CASCADE,
 student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 granted_by uuid NOT NULL REFERENCES auth.users(id),
 granted_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (achievement_id,student_id)
);
ALTER TABLE public.achievement_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_grants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS achievement_catalog_read ON public.achievement_catalog;
CREATE POLICY achievement_catalog_read ON public.achievement_catalog FOR SELECT TO authenticated USING (
 EXISTS (SELECT 1 FROM public.class_members cm WHERE cm.class_id=achievement_catalog.class_id AND cm.user_id=(SELECT auth.uid()) AND cm.status='active')
 OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id=achievement_catalog.class_id AND c.instructor_id=(SELECT auth.uid()))
);
DROP POLICY IF EXISTS achievement_catalog_instructor_write ON public.achievement_catalog;
CREATE POLICY achievement_catalog_instructor_write ON public.achievement_catalog FOR ALL TO authenticated USING (
 EXISTS (SELECT 1 FROM public.classes c WHERE c.id=achievement_catalog.class_id AND c.instructor_id=(SELECT auth.uid()))
) WITH CHECK (
 created_by=(SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id=achievement_catalog.class_id AND c.instructor_id=(SELECT auth.uid()))
);
DROP POLICY IF EXISTS achievement_grants_read ON public.achievement_grants;
CREATE POLICY achievement_grants_read ON public.achievement_grants FOR SELECT TO authenticated USING (
 student_id=(SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.achievement_catalog a JOIN public.classes c ON c.id=a.class_id WHERE a.id=achievement_grants.achievement_id AND c.instructor_id=(SELECT auth.uid()))
);
DROP POLICY IF EXISTS achievement_grants_insert ON public.achievement_grants;
CREATE POLICY achievement_grants_insert ON public.achievement_grants FOR INSERT TO authenticated WITH CHECK (
 granted_by=(SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.achievement_catalog a JOIN public.classes c ON c.id=a.class_id JOIN public.class_members m ON m.class_id=c.id AND m.user_id=achievement_grants.student_id AND m.status='active' WHERE a.id=achievement_grants.achievement_id AND a.active=true AND c.instructor_id=(SELECT auth.uid()))
);
GRANT SELECT,INSERT,UPDATE ON public.achievement_catalog TO authenticated;
GRANT SELECT,INSERT ON public.achievement_grants TO authenticated;
