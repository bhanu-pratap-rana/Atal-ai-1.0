-- Enable RLS on all tables
alter table users enable row level security;
alter table classes enable row level security;
alter table enrollments enable row level security;

-- USERS TABLE POLICIES
create policy "users_self_read" on users
for select using (auth.uid() = id);

create policy "users_self_update" on users
for update using (auth.uid() = id);

-- CLASSES TABLE POLICIES
create policy "classes_teacher_crud" on classes
for all using (auth.uid() = teacher_id)
with check (auth.uid() = teacher_id);

create policy "classes_student_read" on classes
for select using (
  exists (
    select 1 from enrollments e
    where e.class_id = classes.id
    and e.student_id = auth.uid()
  )
);

-- ENROLLMENTS TABLE POLICIES
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

create policy "enrollments_student_read" on enrollments
for select using (student_id = auth.uid());;
