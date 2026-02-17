-- =====================================================
-- RLS Policies for Adaptive Learning Tables
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE student_knowledge_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_style_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tutor_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE formative_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE summative_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_content ENABLE ROW LEVEL SECURITY;

-- Students can read/write their own knowledge state
CREATE POLICY "students_own_knowledge_select" ON student_knowledge_state
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "students_own_knowledge_insert" ON student_knowledge_state
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "students_own_knowledge_update" ON student_knowledge_state
  FOR UPDATE USING (student_id = auth.uid());

-- Students can read/write their own learning style
CREATE POLICY "students_own_learning_style_select" ON learning_style_profile
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "students_own_learning_style_insert" ON learning_style_profile
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "students_own_learning_style_update" ON learning_style_profile
  FOR UPDATE USING (student_id = auth.uid());

-- Students can read/write their own AI interactions
CREATE POLICY "students_own_interactions_select" ON ai_tutor_interactions
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "students_own_interactions_insert" ON ai_tutor_interactions
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- Students can read/write their own formative responses
CREATE POLICY "students_own_formative_select" ON formative_responses
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "students_own_formative_insert" ON formative_responses
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- Students can read their own summative results
CREATE POLICY "students_own_summative_select" ON summative_results
  FOR SELECT USING (student_id = auth.uid());

-- Everyone can read badges definitions
CREATE POLICY "badges_public_read" ON badges
  FOR SELECT USING (true);

-- Students can read their own earned badges
CREATE POLICY "students_own_badges_select" ON student_badges
  FOR SELECT USING (student_id = auth.uid());

-- Students can read their own points history
CREATE POLICY "students_own_points_select" ON points_history
  FOR SELECT USING (student_id = auth.uid());

-- Everyone can read curriculum content (for RAG)
CREATE POLICY "curriculum_public_read" ON curriculum_content
  FOR SELECT USING (true);;
