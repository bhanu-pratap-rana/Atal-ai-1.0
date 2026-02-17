-- =====================================================
-- Migration 145: Fix Database Security & Performance Issues
-- =====================================================
--
-- Issues addressed from Supabase Security & Performance Advisors:
--
-- CRITICAL:
-- 1. DB1: Missing INSERT policy for points_history
--    - gamificationService.awardPoints() silently fails!
--    - Student activity points NOT being saved
--
-- 2. DB2: generated_lessons INSERT/UPDATE use WITH CHECK (true)
--    - Anyone can insert/update cached lessons
--
-- PERFORMANCE:
-- 3. DB3/DB4: modules_service_role_all and topics_service_role_all
--    - auth.role() re-evaluates per row (should use SELECT wrapper)
--
-- =====================================================

-- =====================================================
-- FIX 1: Add INSERT policy for points_history (CRITICAL)
-- =====================================================
-- This allows gamificationService.awardPoints() to work!
-- Previously only SELECT policy existed, so INSERT failed silently.

CREATE POLICY points_history_student_insert ON points_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND student_id = (SELECT auth.uid())
  );

COMMENT ON POLICY points_history_student_insert ON points_history IS
  'Allow authenticated students to insert their own points. Added in migration 145 to fix missing INSERT policy.';

-- =====================================================
-- FIX 2: Restrict generated_lessons INSERT/UPDATE (CRITICAL)
-- =====================================================
-- The original policies used WITH CHECK (true) which allows anyone!

DROP POLICY IF EXISTS "generated_lessons_insert_policy" ON generated_lessons;
DROP POLICY IF EXISTS "generated_lessons_update_policy" ON generated_lessons;

-- Only authenticated users can insert (for personalized lessons or caching)
CREATE POLICY generated_lessons_authenticated_insert ON generated_lessons
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
  );

COMMENT ON POLICY generated_lessons_authenticated_insert ON generated_lessons IS
  'Restrict lesson cache inserts to authenticated users only. Fixed in migration 145.';

-- Only authenticated users can update their own personalized lessons
-- Or update shared lessons (student_id IS NULL) - for API caching
CREATE POLICY generated_lessons_authenticated_update ON generated_lessons
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND (student_id IS NULL OR student_id = (SELECT auth.uid()))
  );

COMMENT ON POLICY generated_lessons_authenticated_update ON generated_lessons IS
  'Restrict lesson cache updates to authenticated users. Fixed in migration 145.';

-- =====================================================
-- FIX 3 & 4: Fix modules/topics service_role policies (PERFORMANCE)
-- =====================================================
-- The original policies use auth.role() without SELECT wrapper,
-- causing per-row re-evaluation which is inefficient.

DROP POLICY IF EXISTS "modules_service_role_all" ON public.modules;
DROP POLICY IF EXISTS "topics_service_role_all" ON public.topics;

-- Recreate with SELECT wrapper for performance optimization
CREATE POLICY modules_service_role_all ON public.modules
  FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

COMMENT ON POLICY modules_service_role_all ON public.modules IS
  'Allow service_role full access to modules. Performance-optimized with SELECT wrapper in migration 145.';

CREATE POLICY topics_service_role_all ON public.topics
  FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

COMMENT ON POLICY topics_service_role_all ON public.topics IS
  'Allow service_role full access to topics. Performance-optimized with SELECT wrapper in migration 145.';

-- =====================================================
-- Documentation
-- =====================================================
COMMENT ON TABLE points_history IS
  'Audit log of all points earned by students for gamification. Migration 145 added INSERT policy.';

COMMENT ON TABLE generated_lessons IS
  'Cache for AI-generated microlearning lessons. Migration 145 restricted INSERT/UPDATE to authenticated users.';

-- =====================================================
-- Notify PostgREST to reload schema cache
-- =====================================================
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- Verification Queries (run after migration)
-- =====================================================
-- 1. Verify points_history has INSERT policy:
--    SELECT * FROM pg_policies WHERE tablename = 'points_history';
--
-- 2. Verify generated_lessons policies are restricted:
--    SELECT * FROM pg_policies WHERE tablename = 'generated_lessons';
--
-- 3. Verify modules/topics policies use SELECT wrapper:
--    SELECT polname, polqual FROM pg_policy
--    WHERE polrelid IN ('public.modules'::regclass, 'public.topics'::regclass);
--
-- 4. Test points insertion (as authenticated user):
--    INSERT INTO points_history (student_id, points, source, description)
--    VALUES (auth.uid(), 10, 'lesson', 'Test point');
-- =====================================================
