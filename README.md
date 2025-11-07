# Database Schema - ATAL AI 1.0

## Overview
This directory contains the Supabase database schema, migrations, and RLS policies for the ATAL AI 1.0 application.

## Database Structure

### Tables

#### `users`
Stores user information for both students and teachers.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (auto-generated) |
| email | text | Unique email address (required) |
| role | text | User role: 'student' or 'teacher' (required) |
| created_at | timestamp | Account creation timestamp |

#### `classes`
Stores class/course information created by teachers.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (auto-generated) |
| name | text | Class name (required) |
| teacher_id | uuid | Foreign key to users table |
| created_at | timestamp | Class creation timestamp |

#### `enrollments`
Manages student enrollments in classes.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (auto-generated) |
| class_id | uuid | Foreign key to classes table |
| student_id | uuid | Foreign key to users table |
| created_at | timestamp | Enrollment timestamp |

**Constraints:**
- Unique constraint on (class_id, student_id) - prevents duplicate enrollments

## Migrations

Migrations are stored in the `migrations/` directory and should be run in order:

1. `001_create_initial_schema.sql` - Creates users, classes, and enrollments tables

## Supabase Project

- **Project Name:** ATAL AI 1.0
- **Project ID:** hnlsqznoviwnyrkskfay
- **Region:** ap-southeast-1
- **Database Version:** PostgreSQL 17.6.1.038

## Environment Variables

Required environment variables in `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=https://hnlsqznoviwnyrkskfay.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Next Steps

- [ ] Add Row Level Security (RLS) policies
- [ ] Create seed data for testing
- [ ] Add indexes for performance optimization
- [ ] Implement real-time subscriptions
