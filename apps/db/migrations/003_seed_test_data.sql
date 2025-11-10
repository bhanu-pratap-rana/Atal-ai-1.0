-- =====================================================
-- Seed Test Data
-- =====================================================
-- This migration creates test users, classes, and enrollments
-- for development and testing purposes.
--
-- IMPORTANT: This seed data uses hardcoded UUIDs.
-- In production, users will be created via Supabase Auth,
-- which automatically generates UUIDs and links them to auth.users.
--
-- For testing RLS policies, you need to:
-- 1. Sign up actual users via the app
-- 2. Copy their auth.uid() from Supabase Auth dashboard
-- 3. Insert corresponding rows in the users table with matching IDs
-- =====================================================

-- Create test teacher (UUID will need to match a real auth user)
-- Replace this UUID with actual auth.uid() from Supabase Auth
insert into users (id, email, role)
values
  ('00000000-0000-0000-0000-000000000001', 'teacher@atalai.com', 'teacher')
on conflict (id) do nothing;

-- Create test students (UUIDs will need to match real auth users)
-- Replace these UUIDs with actual auth.uid() from Supabase Auth
insert into users (id, email, role)
values
  ('00000000-0000-0000-0000-000000000002', 'student1@atalai.com', 'student'),
  ('00000000-0000-0000-0000-000000000003', 'student2@atalai.com', 'student')
on conflict (id) do nothing;

-- Create test class
insert into classes (id, name, teacher_id)
values
  ('10000000-0000-0000-0000-000000000001', 'Digital Literacy 101', '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- Enroll students in the class
insert into enrollments (class_id, student_id)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003')
on conflict (class_id, student_id) do nothing;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify the seed data:

-- 1. Check all users
-- select * from users;

-- 2. Check all classes
-- select * from classes;

-- 3. Check all enrollments with details
-- select
--   e.id,
--   c.name as class_name,
--   t.email as teacher_email,
--   s.email as student_email
-- from enrollments e
-- join classes c on c.id = e.class_id
-- join users t on t.id = c.teacher_id
-- join users s on s.id = e.student_id;

-- =====================================================
-- RLS TESTING NOTES
-- =====================================================
-- To test RLS policies properly:
--
-- 1. Create real users via the /login page (OTP email auth)
-- 2. Get their auth.uid() from: select * from auth.users;
-- 3. Insert matching rows in users table:
--    insert into users (id, email, role)
--    values ('[auth.uid from step 2]', '[email]', 'teacher' or 'student');
-- 4. Use Supabase SQL Editor with "Run as user" feature
-- 5. Or query via the app while logged in as that user
--
-- Example test scenarios:
-- - Teacher creates a class → should succeed
-- - Teacher views their class → should succeed
-- - Student1 views their enrolled class → should succeed
-- - Student2 views Student1's enrollments → should fail (RLS blocks)
-- - Teacher enrolls students in their class → should succeed
-- - Student tries to enroll themselves → should fail (RLS blocks)
