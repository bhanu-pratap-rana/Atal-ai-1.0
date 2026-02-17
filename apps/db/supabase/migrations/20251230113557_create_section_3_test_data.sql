
-- Create test classes for teacher (ranabhanu514@gmail.com)
INSERT INTO classes (id, name, teacher_id, subject, class_code, join_pin)
VALUES 
  (gen_random_uuid(), 'Class 1 - Digital Literacy', '26c2eca8-b810-4a53-9cb0-e18917e3549b', 'Digital Literacy', 'TC1DL1', '1001'),
  (gen_random_uuid(), 'Class 2 - Basic Computing', '26c2eca8-b810-4a53-9cb0-e18917e3549b', 'Computing', 'TC1BC2', '1002'),
  (gen_random_uuid(), 'Class 3 - Internet Skills', '26c2eca8-b810-4a53-9cb0-e18917e3549b', 'Internet', 'TC1IS3', '1003');

-- Get the class IDs we just created (for enrollment)
-- We'll use a subquery to get them

-- Create test student users
INSERT INTO users (id, email, role)
VALUES 
  (gen_random_uuid(), 'section3.student1@atalai.com', 'student'),
  (gen_random_uuid(), 'section3.student2@atalai.com', 'student'),
  (gen_random_uuid(), 'section3.student3@atalai.com', 'student');

-- Enroll students in classes
INSERT INTO enrollments (class_id, student_id)
SELECT c.id, s.id 
FROM classes c, users s 
WHERE c.teacher_id = '26c2eca8-b810-4a53-9cb0-e18917e3549b'
  AND s.email LIKE 'section3.student%'
  AND NOT EXISTS (
    SELECT 1 FROM enrollments e 
    WHERE e.class_id = c.id AND e.student_id = s.id
  );
;
