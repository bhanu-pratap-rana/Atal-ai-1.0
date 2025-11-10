-- =====================================================
-- Add Class Code and Join PIN for Student Self-Enrollment
-- =====================================================
-- This migration adds class_code and join_pin columns to enable
-- students to join classes without email, using only:
-- - Class Code (6-character code shared by teacher)
-- - Roll Number (student identifier)
-- - PIN (4-digit security code)

-- Add columns for class code and join PIN
alter table classes add column if not exists class_code text unique;
alter table classes add column if not exists join_pin text;

-- Create index for faster lookups when students join
create index if not exists idx_classes_class_code on classes(class_code);

-- Backfill codes for existing classes
-- class_code: 6-character uppercase alphanumeric
-- join_pin: 4-digit numeric code
update classes
set
  class_code = upper(substring(md5(id::text) for 6)),
  join_pin = substring(md5(teacher_id::text || id::text) for 4)
where class_code is null;

-- Add comments for documentation
comment on column classes.class_code is
  'Unique 6-character code for students to join the class';

comment on column classes.join_pin is
  '4-digit PIN for class security';

-- =====================================================
-- USAGE NOTES
-- =====================================================
-- Teachers will share:
-- 1. Class Code (e.g., "A3F7E2")
-- 2. Join PIN (e.g., "1234")
--
-- Students will provide:
-- 1. Class Code
-- 2. Roll Number (stored in enrollments or users)
-- 3. Join PIN
--
-- This enables offline enrollment without email verification,
-- suitable for schools with limited internet access.
