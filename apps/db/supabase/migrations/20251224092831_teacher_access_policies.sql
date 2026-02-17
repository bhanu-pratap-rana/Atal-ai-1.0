-- =====================================================
-- Teacher Access Policies (via SECURITY DEFINER functions)
-- =====================================================

-- Function to check if a teacher has access to a student
CREATE OR REPLACE FUNCTION teacher_has_student_access(p_teacher_id UUID, p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM enrollments e
    JOIN classes c ON e.class_id = c.id
    WHERE e.student_id = p_student_id
    AND c.teacher_id = p_teacher_id
  );
END;
$$;

-- Teachers can view their enrolled students' knowledge state
CREATE POLICY "teachers_view_student_knowledge" ON student_knowledge_state
  FOR SELECT USING (
    teacher_has_student_access(auth.uid(), student_id)
  );

-- Teachers can view their enrolled students' AI interactions
CREATE POLICY "teachers_view_student_interactions" ON ai_tutor_interactions
  FOR SELECT USING (
    teacher_has_student_access(auth.uid(), student_id)
  );

-- Teachers can view their enrolled students' formative responses
CREATE POLICY "teachers_view_student_formative" ON formative_responses
  FOR SELECT USING (
    teacher_has_student_access(auth.uid(), student_id)
  );

-- Teachers can view their enrolled students' summative results
CREATE POLICY "teachers_view_student_summative" ON summative_results
  FOR SELECT USING (
    teacher_has_student_access(auth.uid(), student_id)
  );

-- Teachers can view their enrolled students' badges
CREATE POLICY "teachers_view_student_badges" ON student_badges
  FOR SELECT USING (
    teacher_has_student_access(auth.uid(), student_id)
  );

-- Teachers can view their enrolled students' points
CREATE POLICY "teachers_view_student_points" ON points_history
  FOR SELECT USING (
    teacher_has_student_access(auth.uid(), student_id)
  );;
