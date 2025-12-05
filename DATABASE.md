# ATAL AI Database Documentation

> **Last Updated:** December 5, 2025 (28 migrations)
> **Database:** Supabase (PostgreSQL)
> **Project ID:** hnlsqznoviwnyrkskfay

## Table of Contents

- [Overview](#overview)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Tables](#tables)
  - [users](#users)
  - [student_profiles](#student_profiles)
  - [teacher_profiles](#teacher_profiles)
  - [schools](#schools)
  - [school_staff_credentials](#school_staff_credentials)
  - [classes](#classes)
  - [enrollments](#enrollments)
  - [assessment_sessions](#assessment_sessions)
  - [assessment_responses](#assessment_responses)
- [Row Level Security (RLS) Policies](#row-level-security-rls-policies)
- [Database Functions](#database-functions)
- [Indexes](#indexes)
- [Security Model](#security-model)

---

## Overview

The ATAL AI database supports an educational assessment platform with the following key features:

> **⚠️ Important Schema Note:** The `teacher_profiles` and `student_profiles` tables use `user_id` as their primary key (NOT `id`). When querying these tables, always use `.select('user_id')` or `.eq('user_id', ...)` - never `.select('id')` which will cause column not found errors.

- **Anonymous & Email Sign-in**: Students can sign in anonymously (no email required) or with email+OTP
- **Teacher Management**: Teachers sign in with email/phone and manage classes
- **Class Enrollment**: Students join classes using class code + PIN
- **Assessment Tracking**: Track assessment sessions and individual responses

### Current Statistics

| Table | Row Count |
|-------|-----------|
| users | 4 |
| student_profiles | 0 |
| teacher_profiles | 1 |
| schools | 393 |
| school_staff_credentials | 5 |
| classes | 1 |
| enrollments | 2 |
| assessment_sessions | 0 |
| assessment_responses | 0 |

---

## Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   auth.users    │     │     schools     │     │school_staff_    │
│   (Supabase)    │     │                 │     │credentials      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │◄────│ school_id (FK)  │
│ email           │     │ school_code     │     │ pin_hash        │
│ ...             │     │ school_name     │     │ rotated_at      │
└────────┬────────┘     │ district        │     └─────────────────┘
         │              │ block           │
         │              │ address         │
         │              └────────┬────────┘
         │                       │
    ┌────┴────┐                  │
    │         │                  │
    ▼         ▼                  │
┌─────────┐ ┌─────────────┐      │
│ student │ │  teacher    │      │
│_profiles│ │ _profiles   │◄─────┘
├─────────┤ ├─────────────┤
│user_id  │ │ user_id(PK) │
│ (PK,FK) │ │ school_id   │
│name     │ │ (FK)        │
│phone    │ │ name        │
│school_id│ │ phone       │
│(FK)     │ │ school_code │
│gender   │ │ gender      │
│village  │ │ village     │
└────┬────┘ └──────┬──────┘
     │             │
     │             │ teacher_id
     │             ▼
     │      ┌─────────────┐
     │      │   classes   │
     │      ├─────────────┤
     │      │ id (PK)     │
     │      │ name        │
     │      │ subject     │
     │      │ class_code  │
     │      │ join_pin    │
     │      │ teacher_id  │
     │      │ (FK)        │
     │      └──────┬──────┘
     │             │
     │    ┌────────┴────────┐
     │    │                 │
     │    ▼                 ▼
     │ ┌─────────────┐ ┌─────────────────┐
     │ │ enrollments │ │assessment_      │
     │ ├─────────────┤ │sessions         │
     │ │ id (PK)     │ ├─────────────────┤
     └─┤ student_id  │ │ id (PK)         │
       │ (FK)        │ │ user_id (FK)    │
       │ class_id    │ │ class_id (FK)   │
       │ (FK)        │ │ started_at      │
       └─────────────┘ │ submitted_at    │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │assessment_      │
                       │responses        │
                       ├─────────────────┤
                       │ id (PK)         │
                       │ session_id (FK) │
                       │ item_id         │
                       │ module          │
                       │ chosen_option   │
                       │ is_correct      │
                       │ rt_ms           │
                       └─────────────────┘
```

---

## Tables

### users

> **Purpose:** Legacy users table for role tracking. Main auth handled by `auth.users`.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | PRIMARY KEY | User ID |
| `email` | `text` | NO | - | UNIQUE | User email |
| `role` | `text` | NO | - | CHECK (role IN ('student', 'teacher')) | User role |
| `created_at` | `timestamp` | YES | `now()` | - | Creation timestamp |

**RLS Enabled:** ✅ Yes

---

### student_profiles

> **Purpose:** Stores profile details for all students (anonymous and email-authenticated). This is mandatory data collected after sign-in.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `user_id` | `uuid` | NO | - | PRIMARY KEY, FK → auth.users | User ID |
| `name` | `text` | NO | - | - | Student's full name |
| `phone` | `text` | YES | - | - | Phone number (records only, no OTP) |
| `roll_number` | `text` | YES | - | - | School roll number |
| `school_id` | `uuid` | YES | - | FK → schools | Reference to schools table |
| `school_name` | `text` | YES | - | - | Denormalized school name (fallback) |
| `class_name` | `text` | YES | - | - | Class level (e.g., "Class 5") |
| `village` | `text` | YES | - | - | Village or location name |
| `gender` | `text` | NO | - | CHECK (gender IN ('male', 'female')) | Student gender |
| `created_at` | `timestamptz` | YES | `now()` | - | Creation timestamp |
| `updated_at` | `timestamptz` | YES | `now()` | - | Last update timestamp |

**RLS Enabled:** ✅ Yes
**Index:** `idx_student_profiles_school_id` on `school_id`

---

### teacher_profiles

> **Purpose:** Stores profile details for teachers. Only permanent users (email/phone authenticated) can have teacher profiles.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `user_id` | `uuid` | NO | - | PRIMARY KEY, FK → auth.users | User ID |
| `school_id` | `uuid` | NO | - | FK → schools | School reference |
| `name` | `text` | NO | - | - | Teacher's full name |
| `phone` | `text` | YES | - | - | Phone number |
| `subject` | `text` | YES | - | - | Subject taught |
| `school_code` | `text` | NO | - | - | School code |
| `gender` | `text` | YES | - | CHECK (gender IN ('male', 'female')) | Teacher gender |
| `village` | `text` | YES | - | - | Village or location name |
| `created_at` | `timestamptz` | YES | `now()` | - | Creation timestamp |
| `updated_at` | `timestamptz` | YES | `now()` | - | Last update timestamp |

**RLS Enabled:** ✅ Yes

---

### schools

> **Purpose:** Master list of schools (393 schools from Kamrup Rural district).

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PRIMARY KEY | School ID |
| `school_code` | `text` | NO | - | UNIQUE | Unique school code |
| `school_name` | `text` | NO | - | - | School name |
| `district` | `text` | NO | - | - | District name |
| `block` | `text` | YES | - | - | Block name |
| `address` | `text` | YES | - | - | School address |
| `created_at` | `timestamptz` | YES | `now()` | - | Creation timestamp |

**RLS Enabled:** ✅ Yes

---

### school_staff_credentials

> **Purpose:** Stores hashed PINs for school staff authentication. Only accessible via service role (server-side).

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PRIMARY KEY | Credential ID |
| `school_id` | `uuid` | NO | - | UNIQUE, FK → schools | School reference |
| `pin_hash` | `text` | NO | - | - | Bcrypt hashed PIN (4-8 digits) |
| `rotated_at` | `timestamptz` | YES | - | - | Last PIN rotation timestamp |
| `created_at` | `timestamptz` | YES | `now()` | - | Creation timestamp |
| `updated_at` | `timestamptz` | YES | `now()` | - | Last update timestamp |
| `deleted_at` | `timestamptz` | YES | - | - | Soft delete timestamp |

**RLS Enabled:** ✅ Yes
**Security:** Only accessible via `service_role` (server actions)

---

### classes

> **Purpose:** Classes created by teachers. Students join via class code + PIN.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | PRIMARY KEY | Class ID |
| `name` | `text` | NO | - | - | Class name |
| `subject` | `text` | YES | - | - | Subject taught |
| `teacher_id` | `uuid` | YES | - | FK → users | Teacher who created the class |
| `class_code` | `text` | YES | - | UNIQUE | 6-character alphanumeric code |
| `join_pin` | `text` | YES | - | - | 4-digit PIN for joining |
| `created_at` | `timestamp` | YES | `now()` | - | Creation timestamp |

**RLS Enabled:** ✅ Yes
**Auto-generated:** `class_code` and `join_pin` are auto-generated on insert via trigger

---

### enrollments

> **Purpose:** Links students to classes they've joined.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | PRIMARY KEY | Enrollment ID |
| `class_id` | `uuid` | YES | - | FK → classes | Class reference |
| `student_id` | `uuid` | YES | - | FK → users | Student reference |
| `created_at` | `timestamp` | YES | `now()` | - | Enrollment timestamp |

**RLS Enabled:** ✅ Yes
**Unique Constraint:** `(class_id, student_id)` - Student can only enroll once per class

---

### assessment_sessions

> **Purpose:** Tracks assessment attempts by students.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PRIMARY KEY | Session ID |
| `user_id` | `uuid` | NO | - | FK → users | Student taking the assessment |
| `class_id` | `uuid` | YES | - | FK → classes | Class context (optional) |
| `started_at` | `timestamptz` | NO | `now()` | - | When assessment started |
| `submitted_at` | `timestamptz` | YES | - | - | When assessment was submitted |
| `created_at` | `timestamptz` | NO | `now()` | - | Creation timestamp |
| `updated_at` | `timestamptz` | NO | `now()` | - | Last update timestamp |

**RLS Enabled:** ✅ Yes

---

### assessment_responses

> **Purpose:** Individual question responses within an assessment session.

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PRIMARY KEY | Response ID |
| `session_id` | `uuid` | NO | - | FK → assessment_sessions | Session reference |
| `item_id` | `text` | NO | - | - | Question identifier |
| `module` | `text` | NO | - | - | Assessment module name |
| `chosen_option` | `text` | YES | - | - | Selected answer option |
| `is_correct` | `boolean` | YES | - | - | Whether answer was correct |
| `rt_ms` | `integer` | YES | - | - | Response time in milliseconds |
| `focus_blur_count` | `integer` | YES | `0` | - | Tab switch count (anti-cheat) |
| `created_at` | `timestamptz` | NO | `now()` | - | Response timestamp |

**RLS Enabled:** ✅ Yes

---

## Row Level Security (RLS) Policies

### users

| Policy | Command | Role | Condition |
|--------|---------|------|-----------|
| `users_self_read` | SELECT | authenticated | `id = auth.uid()` |
| `users_self_update` | UPDATE | authenticated | `id = auth.uid()` |

### student_profiles

| Policy | Command | Role | Condition |
|--------|---------|------|-----------|
| `student_profile_select` | SELECT | authenticated | Own profile OR teacher viewing enrolled student |
| `student_profile_self_insert` | INSERT | authenticated | `user_id = auth.uid()` |
| `student_profile_self_update` | UPDATE | authenticated | `user_id = auth.uid()` |

### teacher_profiles

| Policy | Command | Role | Condition |
|--------|---------|------|-----------|
| `teacher_self_read` | SELECT | authenticated | `user_id = auth.uid()` |
| `teacher_self_insert` | INSERT | authenticated | `user_id = auth.uid()` |
| `teacher_self_update` | UPDATE | authenticated | `user_id = auth.uid()` |

### schools

| Policy | Command | Role | Condition |
|--------|---------|------|-----------|
| `schools_read` | SELECT | authenticated | `true` (all authenticated users can read) |

### school_staff_credentials

| Policy | Command | Role | Condition |
|--------|---------|------|-----------|
| `staff_creds_read_service_only` | SELECT | public | `auth.jwt()->>'role' = 'service_role'` |
| `staff_creds_insert_service_only` | INSERT | public | `auth.jwt()->>'role' = 'service_role'` |
| `staff_creds_update_service_only` | UPDATE | public | `auth.jwt()->>'role' = 'service_role'` |

### classes

| Policy | Command | Role | Condition |
|--------|---------|------|-----------|
| `classes_select` | SELECT | authenticated | Teacher owns class OR student enrolled |
| `classes_insert` | INSERT | authenticated | Teacher owns class AND has teacher_profile |
| `classes_update` | UPDATE | authenticated | Teacher owns class AND has teacher_profile |
| `classes_delete` | DELETE | authenticated | Teacher owns class AND has teacher_profile |

### enrollments

| Policy | Command | Role | Condition |
|--------|---------|------|-----------|
| `enrollments_select` | SELECT | authenticated | Own enrollment OR teacher of class |
| `enrollments_insert` | INSERT | authenticated | Self-enroll OR teacher of class (with profile) |
| `enrollments_update` | UPDATE | authenticated | Teacher of class (with profile) |
| `enrollments_delete` | DELETE | authenticated | Teacher of class (with profile) |

### assessment_sessions

| Policy | Command | Role | Condition |
|--------|---------|------|-----------|
| `assessment_sessions_select` | SELECT | authenticated | Own session OR teacher of class |
| `assessment_sessions_insert` | INSERT | authenticated | `user_id = auth.uid()` |
| `assessment_sessions_update` | UPDATE | authenticated | `user_id = auth.uid()` |

### assessment_responses

| Policy | Command | Role | Condition |
|--------|---------|------|-----------|
| `assessment_responses_select` | SELECT | authenticated | Own response OR teacher of class |
| `assessment_responses_insert` | INSERT | authenticated | Session belongs to user |

---

## Database Functions

### Trigger Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `auto_generate_class_credentials()` | trigger | Auto-generates `class_code` and `join_pin` on class insert |
| `create_user_on_teacher_profile()` | trigger | Creates user record when teacher profile is created |
| `update_assessment_session_updated_at()` | trigger | Updates `updated_at` timestamp on session changes |
| `update_student_profile_updated_at()` | trigger | Updates `updated_at` timestamp on student profile changes |
| `update_teacher_profile_updated_at()` | trigger | Updates `updated_at` timestamp on teacher profile changes |

### Utility Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `generate_class_code()` | text | Generates 6-character alphanumeric class code |
| `generate_join_pin()` | text | Generates 4-digit numeric PIN |
| `check_email_exists(email)` | record | Checks if email exists in auth.users |

### Security Functions (SECURITY DEFINER)

| Function | Returns | Description |
|----------|---------|-------------|
| `verify_staff_pin(school_id, pin)` | record | Verifies PIN against stored hash (service_role only) |
| `rotate_staff_pin(school_id, new_pin)` | TABLE(success, error_message) | Rotates/creates PIN for school (service_role only) |
| `get_user_enrolled_class_ids(user_id)` | SETOF UUID | Returns class IDs for enrolled student (bypasses RLS) |
| `get_teacher_class_ids(user_id)` | SETOF UUID | Returns class IDs owned by teacher (bypasses RLS) |

#### Required Extensions

| Extension | Purpose | Required By |
|-----------|---------|-------------|
| `pgcrypto` | Bcrypt password hashing | `rotate_staff_pin`, `verify_staff_pin` |

> **Note:** The `pgcrypto` extension provides `gen_salt('bf', 10)` and `crypt()` functions for secure bcrypt password hashing with cost factor 10.

#### rotate_staff_pin Function Details

```sql
-- Function signature
rotate_staff_pin(p_school_id UUID, p_new_pin TEXT)
RETURNS TABLE(success BOOLEAN, error_message TEXT)

-- Example usage (service_role only)
SELECT * FROM rotate_staff_pin('school-uuid', '1234');
-- Returns: { success: true, error_message: null }
```

**Security:**
- SECURITY DEFINER: Runs with owner privileges
- Requires `service_role` to execute (not `authenticated`)
- PIN is hashed using bcrypt with cost factor 10 before storage

---

## Indexes

| Table | Index Name | Column(s) | Description |
|-------|------------|-----------|-------------|
| `student_profiles` | `idx_student_profiles_school_id` | `school_id` | Fast school lookups |
| `schools` | (auto) | `school_code` | Unique constraint index |
| `classes` | (auto) | `class_code` | Unique constraint index |
| `enrollments` | (auto) | `(class_id, student_id)` | Unique constraint index |
| `school_staff_credentials` | (auto) | `school_id` | Unique constraint index |

---

## Security Model

### User Types

| Type | Authentication | Can Create Profile | Can Manage Classes | Can Take Assessments |
|------|----------------|-------------------|-------------------|---------------------|
| Anonymous Student | Anonymous sign-in | ✅ student_profiles | ❌ | ✅ |
| Email Student | Email + OTP | ✅ student_profiles | ❌ | ✅ |
| Teacher | Email/Phone + OTP | ✅ teacher_profiles | ✅ | ❌ |

### Access Control Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Authentication (Supabase Auth)                              │
│     ├── Anonymous sign-in → Students only                       │
│     ├── Email + OTP → Students & Teachers                       │
│     └── Phone + OTP → Teachers only                             │
│                                                                 │
│  2. Authorization (RLS Policies)                                │
│     ├── teacher_profiles existence → Teacher privileges         │
│     ├── enrollments → Class membership verification             │
│     └── service_role → Server-side operations only              │
│                                                                 │
│  3. Data Access                                                 │
│     ├── Students: Own profile, enrolled classes, own sessions   │
│     ├── Teachers: Own profile, own classes, enrolled students   │
│     └── Service: PIN verification, credential management        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Security Features

1. **No anonymous teachers**: Only users with `teacher_profiles` can create/manage classes
2. **PIN protection**: Class PINs stored in plaintext (for sharing), school staff PINs stored as bcrypt hashes
3. **Bcrypt hashing**: School staff PINs use pgcrypto's `crypt()` with `gen_salt('bf', 10)` (cost factor 10)
4. **Service role isolation**: `school_staff_credentials` only accessible via server actions
5. **Self-enrollment**: Students can enroll themselves using class code + PIN
6. **Teacher verification**: All class management operations require `teacher_profiles` existence

---

## Migration History

| Version | Timestamp | Name | Description |
|---------|-----------|------|-------------|
| 001 | 20251107083407 | create_initial_schema | users, classes, enrollments tables |
| 002 | 20251110052725 | enable_rls_policies | Basic RLS policies |
| 003 | 20251110052735 | seed_test_data | Test data |
| 004 | 20251110055402 | add_class_code_and_pin | Class joining credentials |
| 005 | 20251110060032 | auto_generate_class_codes | Auto-generate trigger |
| 006 | 20251110062446 | create_assessment_schema | Assessment tables |
| 007 | 20251114115321 | kamrup_rural_schools_phase1 | School data imports |
| 008 | 20251119063048 | fix_staff_credentials_rls | Fix staff credentials RLS |
| 009 | 20251119090214 | auto_create_user_on_teacher_profile | Auto create user trigger |
| 010 | 20251119092416 | add_subject_to_classes | Add subject to classes |
| 011 | 20251121162024 | create_check_email_exists_function | Email check function |
| 012 | 20251123154956 | update_kamrup_rural_schools_with_blocks | Add blocks to schools |
| 013 | 20251202071044 | add_missing_staff_credentials_columns | Add staff credential columns |
| 014 | 20251202072838 | create_rotate_staff_pin_function | PIN rotation function |
| 015 | 20251204041914 | create_verify_staff_pin_function | PIN verification function |
| 016 | 20251204041953 | fix_function_search_path_security | Function security fix |
| 017 | 20251204045458 | fix_rls_initplan_performance | Performance optimization |
| 018 | 20251204045726 | fix_remaining_rls_initplan_v3 | RLS performance fix v3 |
| 019 | 20251204045903 | fix_staff_creds_rls_initplan | Staff creds RLS fix |
| 020 | 20251204050300 | fix_anonymous_access_and_permissive_policies | Anonymous student workflow |
| 021 | 20251204051010 | fix_anonymous_student_workflow | Anonymous workflow fix |
| 022 | 20251204051102 | fix_initplan_for_is_anonymous_checks | Anonymous check fix |
| 023 | 20251204051336 | fix_initplan_with_proper_wrapping | Init plan wrapping fix |
| 024 | 20251204052309 | create_student_profiles_table | Student profiles table |
| 025 | 20251204052415 | add_gender_and_location_to_teacher_profiles | Teacher profile fields |
| 026 | 20251204052650 | fix_all_advisor_warnings | Security & performance fixes |
| 027 | 20251205062712 | fix_classes_rls_infinite_recursion | Fix RLS circular dependency (attempt 1) |
| 028 | 20251205063154 | fix_rls_recursion_v2 | Fix RLS with SECURITY DEFINER helper functions |

### Helper Functions (Added in Migration 028)

| Function | Purpose |
|----------|---------|
| `get_user_enrolled_class_ids(UUID)` | Returns class IDs for enrolled student (bypasses RLS) |
| `get_teacher_class_ids(UUID)` | Returns class IDs owned by teacher (bypasses RLS) |

### Local Migrations (Not Applied to Remote)

| Version | Name | Description |
|---------|------|-------------|
| 025 | enable_pgcrypto_extension | Enable pgcrypto for bcrypt hashing |
| 026 | fix_create_user_trigger | Fix trigger column names |
| 027 | fix_classes_rls_infinite_recursion | Local copy of migration 027 |

---

## Common Queries

### Check if user has teacher profile
```sql
SELECT EXISTS(
  SELECT 1 FROM teacher_profiles
  WHERE user_id = auth.uid()
);
```

### Get classes for enrolled student
```sql
SELECT c.* FROM classes c
JOIN enrollments e ON e.class_id = c.id
WHERE e.student_id = auth.uid();
```

### Get students in a teacher's class
```sql
SELECT sp.* FROM student_profiles sp
JOIN enrollments e ON e.student_id = sp.user_id
JOIN classes c ON c.id = e.class_id
WHERE c.teacher_id = auth.uid();
```

### Verify class code and PIN (client-side)
```sql
SELECT id FROM classes
WHERE class_code = $1 AND join_pin = $2;
```

---

## Security Advisories

The following advisories are reported by Supabase. Most are expected based on the app's anonymous student support:

### Warnings (Expected Behavior)

| Advisory | Table | Reason |
|----------|-------|--------|
| Anonymous Access Policies | `schools` | Students need to read schools list |
| Anonymous Access Policies | `student_profiles` | Anonymous students create profiles |
| Anonymous Access Policies | `classes` | Anonymous students join classes |
| Anonymous Access Policies | `enrollments` | Anonymous students can enroll |
| Anonymous Access Policies | `assessment_*` | Anonymous students take assessments |
| pgcrypto in public schema | Extension | Required for bcrypt hashing |

### Recommendations

1. **Enable Leaked Password Protection**: Enable in Supabase Auth settings
2. **Add missing indexes**:
   - `classes.teacher_id` (foreign key)
   - `enrollments.student_id` (foreign key)

---

## Performance Notes

The following indexes exist but haven't been used yet (will be used once app has more data):

- `idx_classes_class_code`
- `idx_assessment_sessions_submitted`
- `idx_assessment_responses_session_id`
- `idx_assessment_responses_module`
- `idx_assessment_responses_item_id`
- `idx_student_profiles_school_id`
- `idx_schools_district`
- `idx_school_staff_credentials_rotated_at`

---

*This documentation is auto-generated and should be updated when database schema changes.*
