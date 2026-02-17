-- Migration: 036_add_missing_foreign_key_indexes
-- Description: Add missing foreign key indexes for performance optimization
-- Priority: P1-HIGH

-- Create index on classes.teacher_id for efficient teacher class lookups
-- This improves performance when querying classes by teacher
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id
ON public.classes(teacher_id)
WHERE teacher_id IS NOT NULL;

-- Create index on enrollments.student_id for efficient student enrollment lookups
-- This improves performance when querying enrollments by student
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id
ON public.enrollments(student_id)
WHERE student_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON INDEX idx_classes_teacher_id IS
  'Index for efficient lookup of classes by teacher_id. Speeds up teacher dashboard queries.';

COMMENT ON INDEX idx_enrollments_student_id IS
  'Index for efficient lookup of enrollments by student_id. Speeds up student class list queries.';;
