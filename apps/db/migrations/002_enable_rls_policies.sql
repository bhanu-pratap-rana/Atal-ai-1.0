-- =====================================================
-- Enable Row-Level Security (RLS)
-- =====================================================
-- This migration enables RLS on all tables and creates
-- security policies to protect user data.

-- Enable RLS on all tables
alter table users enable row level security;
alter table classes enable row level security;
alter table enrollments enable row level security;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Policy: Users can read their own row
create policy "users_self_read" on users
for select using (auth.uid() = id);

-- Policy: Users can update their own row
create policy "users_self_update" on users
for update using (auth.uid() = id);

-- =====================================================
-- CLASSES TABLE POLICIES
-- =====================================================

-- Policy: Teachers can perform all operations on their own classes
create policy "classes_teacher_crud" on classes
for all using (auth.uid() = teacher_id)
with check (auth.uid() = teacher_id);

-- Policy: Enrolled students can read classes they're enrolled in
create policy "classes_student_read" on classes
for select using (
  exists (
    select 1 from enrollments e
    where e.class_id = classes.id
    and e.student_id = auth.uid()
  )
);

-- =====================================================
-- ENROLLMENTS TABLE POLICIES
-- =====================================================

-- Policy: Teachers can manage enrollments for their classes
create policy "enrollments_teacher_manage" on enrollments
for all using (
  exists (
    select 1 from classes c
    where c.id = enrollments.class_id
    and c.teacher_id = auth.uid()
  )
) with check (
  exists (
    select 1 from classes c
    where c.id = enrollments.class_id
    and c.teacher_id = auth.uid()
  )
);

-- Policy: Students can read their own enrollments
create policy "enrollments_student_read" on enrollments
for select using (student_id = auth.uid());

-- =====================================================
-- COMMENTS
-- =====================================================

comment on policy "users_self_read" on users is
  'Users can view their own profile data';

comment on policy "users_self_update" on users is
  'Users can update their own profile data';

comment on policy "classes_teacher_crud" on classes is
  'Teachers have full CRUD access to their own classes';

comment on policy "classes_student_read" on classes is
  'Students can view classes they are enrolled in';

comment on policy "enrollments_teacher_manage" on enrollments is
  'Teachers can manage enrollments for their classes';

comment on policy "enrollments_student_read" on enrollments is
  'Students can view their own enrollments';
