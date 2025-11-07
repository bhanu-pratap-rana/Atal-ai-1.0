-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- users table
create table users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  role text check (role in ('student', 'teacher')) not null,
  created_at timestamp default now()
);

-- classes table
create table classes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  teacher_id uuid references users(id) on delete cascade,
  created_at timestamp default now()
);

-- enrollments table
create table enrollments (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid references classes(id) on delete cascade,
  student_id uuid references users(id) on delete cascade,
  created_at timestamp default now(),
  unique(class_id, student_id)
);
