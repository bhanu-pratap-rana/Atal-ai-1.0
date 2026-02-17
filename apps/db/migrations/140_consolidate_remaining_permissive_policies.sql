-- =====================================================
-- Migration 140: Consolidate Remaining Permissive Policies
-- =====================================================
--
-- Fixes remaining multiple_permissive_policies warnings for:
-- 1. class_announcements - students_read + teachers_manage (FOR ALL includes SELECT)
-- 2. class_materials - students_read + teachers_manage (FOR ALL includes SELECT)
-- 3. classes - classes_authenticated_select + classes_join_lookup
--
-- =====================================================

-- =====================================================
-- 1. FIX class_announcements policies
-- =====================================================
-- Issue: teachers_manage_own_announcements (FOR ALL) includes SELECT
--        students_read_class_announcements (FOR SELECT)
-- Solution: Split teacher policy into INSERT/UPDATE/DELETE, keep SELECT separate

DROP POLICY IF EXISTS "teachers_manage_own_announcements" ON class_announcements;
DROP POLICY IF EXISTS "students_read_class_announcements" ON class_announcements;

-- Consolidated SELECT policy for all users
CREATE POLICY "class_announcements_select"
  ON class_announcements
  FOR SELECT
  TO authenticated
  USING (
    -- Teachers see their own class announcements
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_announcements.class_id
      AND c.teacher_id = (select auth.uid())
    )
    OR
    -- Students see announcements for classes they're enrolled in
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.class_id = class_announcements.class_id
      AND e.student_id = (select auth.uid())
    )
  );

-- Teacher INSERT policy
CREATE POLICY "teachers_insert_announcements"
  ON class_announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_announcements.class_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- Teacher UPDATE policy
CREATE POLICY "teachers_update_announcements"
  ON class_announcements
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_announcements.class_id
      AND c.teacher_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_announcements.class_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- Teacher DELETE policy
CREATE POLICY "teachers_delete_announcements"
  ON class_announcements
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_announcements.class_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- =====================================================
-- 2. FIX class_materials policies
-- =====================================================
-- Same pattern as class_announcements

DROP POLICY IF EXISTS "teachers_manage_own_materials" ON class_materials;
DROP POLICY IF EXISTS "students_read_class_materials" ON class_materials;

-- Consolidated SELECT policy for all users
CREATE POLICY "class_materials_select"
  ON class_materials
  FOR SELECT
  TO authenticated
  USING (
    -- Teachers see all their class materials
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_materials.class_id
      AND c.teacher_id = (select auth.uid())
    )
    OR
    -- Students see visible materials for classes they're enrolled in
    (
      is_visible = true AND
      EXISTS (
        SELECT 1 FROM enrollments e
        WHERE e.class_id = class_materials.class_id
        AND e.student_id = (select auth.uid())
      )
    )
  );

-- Teacher INSERT policy
CREATE POLICY "teachers_insert_materials"
  ON class_materials
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_materials.class_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- Teacher UPDATE policy
CREATE POLICY "teachers_update_materials"
  ON class_materials
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_materials.class_id
      AND c.teacher_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_materials.class_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- Teacher DELETE policy
CREATE POLICY "teachers_delete_materials"
  ON class_materials
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_materials.class_id
      AND c.teacher_id = (select auth.uid())
    )
  );

-- =====================================================
-- 3. FIX classes policies
-- =====================================================
-- Issue: classes_authenticated_select + classes_join_lookup both for SELECT

DROP POLICY IF EXISTS "classes_authenticated_select" ON classes;
DROP POLICY IF EXISTS "classes_join_lookup" ON classes;

-- Consolidated SELECT policy
CREATE POLICY "classes_select"
  ON classes
  FOR SELECT
  TO authenticated
  USING (
    -- Teachers see their own classes
    teacher_id = (select auth.uid())
    OR
    -- Students see classes they're enrolled in
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.class_id = classes.id
      AND e.student_id = (select auth.uid())
    )
    OR
    -- Anyone can lookup a class by class code (for joining)
    -- This is needed for the join flow before enrollment
    class_code IS NOT NULL
  );

-- =====================================================
-- RELOAD SCHEMA CACHE
-- =====================================================

NOTIFY pgrst, 'reload schema';
