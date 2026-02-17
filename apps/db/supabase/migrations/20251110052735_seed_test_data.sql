-- Create test teacher
insert into users (id, email, role)
values
  ('00000000-0000-0000-0000-000000000001', 'teacher@atalai.com', 'teacher')
on conflict (id) do nothing;

-- Create test students
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
on conflict (class_id, student_id) do nothing;;
