-- PHASE 1: Kamrup Rural Schools Database Schema
-- This migration creates tables for school verification and teacher authentication

-- 1) Schools master table (Kamrup Rural subset from SEBA)
create table if not exists public.schools (
  id           uuid primary key default gen_random_uuid(),
  district     text not null,                         -- e.g., 'KAMRUP RURAL'
  school_code  text not null unique,                  -- SEBA code
  school_name  text not null,
  block        text,                                  -- optional: block/cluster if available
  address      text,                                  -- optional
  created_at   timestamptz default now()
);

-- 2) Staff PIN credentials per school (hashed)
create table if not exists public.school_staff_credentials (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references public.schools(id) on delete cascade,
  pin_hash       text not null,                       -- bcrypt/argon2 hash of PIN
  rotated_at     timestamptz,
  created_at     timestamptz default now(),
  unique (school_id)
);

-- 3) Teacher profile (minimal now, extend later)
create table if not exists public.teacher_profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  school_id      uuid not null references public.schools(id) on delete restrict,
  name           text not null,
  phone          text,                                -- optional
  subject        text,                                -- optional
  school_code    text not null,                       -- denormalized for easy reads
  created_at     timestamptz default now()
);

-- 4) Student profile (optional - will be added in future migration)
-- Note: student_profiles table will be created later when needed
-- For now, students are tracked via auth.users and enrollments table

-- Helpful indexes
create index if not exists idx_schools_code on public.schools(school_code);
create index if not exists idx_schools_district on public.schools(district);
create index if not exists idx_teacher_profiles_school on public.teacher_profiles(school_id);

-- RLS policies
alter table public.schools enable row level security;
alter table public.school_staff_credentials enable row level security;
alter table public.teacher_profiles enable row level security;

-- Schools are readable to all signed-in users (no secrets here)
create policy "schools_read" on public.schools
  for select using ( auth.role() = 'authenticated' );

-- Staff credentials: never readable by clients (server-side only)
create policy "staff_creds_deny_select" on public.school_staff_credentials
  for select using ( false );

-- Teachers can read only their own profile
create policy "teacher_self_read" on public.teacher_profiles
  for select using ( user_id = auth.uid() );

-- Teachers can update only their own profile
create policy "teacher_self_update" on public.teacher_profiles
  for update using ( user_id = auth.uid() );

-- Teachers can insert their own profile (during registration)
create policy "teacher_self_insert" on public.teacher_profiles
  for insert with check ( user_id = auth.uid() );

-- Note: Student profile RLS policies already exist from previous migrations
-- We only add the school_id foreign key above
