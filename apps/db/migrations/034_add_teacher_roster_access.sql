-- Migration: 034_add_teacher_roster_access
-- Purpose: Allow teachers to view student profiles for students enrolled in their classes
--
-- Problem: The current student_profiles RLS only allows students to see their own profile.
-- Teachers need to see student names, roll numbers, etc. for roster management.
--
-- Solution: Create SECURITY DEFINER functions that safely return student data for teachers

-- ============================================================
-- STEP 1: Create helper function to check if user is a teacher
-- ============================================================

CREATE OR REPLACE FUNCTION is_teacher()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM teacher_profiles
    WHERE user_id = (SELECT auth.uid())
  )
$$;

-- ============================================================
-- STEP 2: Create function to get student IDs enrolled in teacher's classes
-- ============================================================

CREATE OR REPLACE FUNCTION get_teacher_student_ids()
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT DISTINCT e.student_id
  FROM enrollments e
  INNER JOIN classes c ON c.id = e.class_id
  WHERE c.teacher_id = (SELECT auth.uid())
$$;

-- ============================================================
-- STEP 3: Create comprehensive roster function for teachers
-- This function returns full roster data for a specific class
-- ============================================================

CREATE OR REPLACE FUNCTION get_class_roster(p_class_id UUID)
RETURNS TABLE (
  enrollment_id UUID,
  student_id UUID,
  student_name TEXT,
  student_phone TEXT,
  roll_number TEXT,
  class_name TEXT,
  enrolled_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Verify the current user is the teacher of this class
  IF NOT EXISTS (
    SELECT 1 FROM classes
    WHERE id = p_class_id
    AND teacher_id = (SELECT auth.uid())
  ) THEN
    -- Return empty result if not the class teacher
    RETURN;
  END IF;

  -- Return roster data
  RETURN QUERY
  SELECT
    e.id AS enrollment_id,
    e.student_id,
    sp.name AS student_name,
    sp.phone AS student_phone,
    sp.roll_number,
    sp.class_name,
    e.created_at AS enrolled_at
  FROM enrollments e
  LEFT JOIN student_profiles sp ON sp.user_id = e.student_id
  WHERE e.class_id = p_class_id
  ORDER BY sp.name NULLS LAST, e.created_at;
END;
$$;

-- ============================================================
-- STEP 4: Create function to search students by name/phone for teachers
-- Used by the invite/search functionality
-- ============================================================

CREATE OR REPLACE FUNCTION search_students_for_teacher(
  p_search_query TEXT,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  phone TEXT,
  roll_number TEXT,
  class_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Verify the current user is a teacher
  IF NOT is_teacher() THEN
    RETURN;
  END IF;

  -- Search students by name or phone
  RETURN QUERY
  SELECT
    sp.user_id,
    sp.name,
    sp.phone,
    sp.roll_number,
    sp.class_name
  FROM student_profiles sp
  WHERE (
    sp.name ILIKE '%' || p_search_query || '%'
    OR sp.phone ILIKE '%' || p_search_query || '%'
  )
  LIMIT p_limit;
END;
$$;

-- ============================================================
-- STEP 5: Add RLS policy for teachers to view enrolled students
-- ============================================================

-- Drop existing teacher select policy if exists
DROP POLICY IF EXISTS "student_profile_teacher_select" ON student_profiles;

-- Teachers can view profiles of students enrolled in their classes
CREATE POLICY "student_profile_teacher_select" ON student_profiles
FOR SELECT USING (
  is_teacher() AND user_id IN (SELECT get_teacher_student_ids())
);

-- ============================================================
-- STEP 6: Grant execute permissions
-- ============================================================

GRANT EXECUTE ON FUNCTION is_teacher() TO authenticated;
GRANT EXECUTE ON FUNCTION get_teacher_student_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION get_class_roster(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_students_for_teacher(TEXT, INT) TO authenticated;

-- ============================================================
-- STEP 7: Add comments for documentation
-- ============================================================

COMMENT ON FUNCTION is_teacher() IS
  'Checks if the current user is a teacher. SECURITY DEFINER to bypass RLS.';

COMMENT ON FUNCTION get_teacher_student_ids() IS
  'Returns student IDs enrolled in any of the current teacher''s classes. SECURITY DEFINER to bypass RLS.';

COMMENT ON FUNCTION get_class_roster(UUID) IS
  'Returns full roster for a class including student profiles. Only works for the class teacher.';

COMMENT ON FUNCTION search_students_for_teacher(TEXT, INT) IS
  'Allows teachers to search for students by name or phone for invitation purposes.';

-- ============================================================
-- STEP 8: Reload PostgREST schema cache
-- ============================================================

NOTIFY pgrst, 'reload schema';
