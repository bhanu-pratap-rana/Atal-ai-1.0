
-- Migration: Add missing foreign key indexes for performance
-- Fixes Supabase performance advisor warnings for unindexed foreign keys

-- Add index on classes.teacher_id (foreign key to users.id)
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes (teacher_id);

-- Add index on enrollments.student_id (foreign key to users.id)
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments (student_id);

-- Comment explaining the indexes
COMMENT ON INDEX idx_classes_teacher_id IS 'Index for foreign key lookups on classes.teacher_id -> users.id';
COMMENT ON INDEX idx_enrollments_student_id IS 'Index for foreign key lookups on enrollments.student_id -> users.id';
;
