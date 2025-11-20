-- =====================================================
-- Add Anonymous User Support to RLS Policies
-- =====================================================
-- This migration enhances existing RLS policies to properly
-- handle anonymous users while maintaining security.
--
-- IMPORTANT: Anonymous users use the 'authenticated' role,
-- but have is_anonymous=true in their JWT.
--
-- Date: 2025-11-12
-- Related: INVITE_LINK_PHASE1.md
-- =====================================================

-- =====================================================
-- ENROLLMENTS TABLE - Allow Anonymous Students
-- =====================================================

-- Drop existing student enrollment insert policy if it exists
drop policy if exists "enrollments_student_insert" on enrollments;

-- Policy: Allow students (including anonymous) to enroll themselves
-- This enables the join class flow for anonymous users
create policy "enrollments_student_insert" on enrollments
for insert
to authenticated
with check (
  student_id = auth.uid()
  -- Students can only enroll themselves
  -- Both permanent and anonymous users can enroll
);

-- =====================================================
-- USERS TABLE - Allow Anonymous User Records
-- =====================================================

-- Drop existing user insert policy if it exists
drop policy if exists "users_self_insert" on users;

-- Policy: Users can create their own user record
-- Required for anonymous users to create profile after sign-in
create policy "users_self_insert" on users
for insert
to authenticated
with check (
  auth.uid() = id
);

-- =====================================================
-- CLASSES TABLE - Anonymous Users Read Access
-- =====================================================

-- Policy: Allow authenticated users to read class details when joining
-- This allows students to see class info during the join flow
create policy "classes_public_read_on_join" on classes
for select
to authenticated
using (
  -- Allow reading class details if user knows the code and PIN
  -- This is validated in the application layer before enrollment
  true
);

-- Note: The actual validation of class code and PIN happens
-- in the application layer via the joinClass server action.
-- This policy just ensures authenticated users can read
-- class details after validation.

-- =====================================================
-- RESTRICTIVE POLICIES FOR SENSITIVE OPERATIONS
-- =====================================================

-- Policy: Only permanent users can create classes
create policy "classes_permanent_users_only_insert" on classes
as restrictive
for insert
to authenticated
with check (
  (select (auth.jwt()->>'is_anonymous')::boolean) is false
);

-- Policy: Only permanent users can update classes
create policy "classes_permanent_users_only_update" on classes
as restrictive
for update
to authenticated
using (
  (select (auth.jwt()->>'is_anonymous')::boolean) is false
);

-- Policy: Only permanent users can delete classes
create policy "classes_permanent_users_only_delete" on classes
as restrictive
for delete
to authenticated
using (
  (select (auth.jwt()->>'is_anonymous')::boolean) is false
);

-- =====================================================
-- HELPFUL VIEWS FOR ANONYMOUS USER DETECTION
-- =====================================================

-- View: Show anonymous vs permanent user counts
create or replace view anonymous_user_stats as
select
  count(*) filter (where is_anonymous = true) as anonymous_users,
  count(*) filter (where is_anonymous = false or is_anonymous is null) as permanent_users,
  count(*) as total_users
from auth.users;

-- Grant access to authenticated users
grant select on anonymous_user_stats to authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

comment on policy "enrollments_student_insert" on enrollments is
  'Students (including anonymous users) can enroll themselves in classes';

comment on policy "users_self_insert" on users is
  'Allow users to create their own profile record (required for anonymous users)';

comment on policy "classes_public_read_on_join" on classes is
  'Allow authenticated users to read class details during join flow';

comment on policy "classes_permanent_users_only_insert" on classes is
  'RESTRICTIVE: Only permanent users can create classes (no anonymous)';

comment on policy "classes_permanent_users_only_update" on classes is
  'RESTRICTIVE: Only permanent users can update classes (no anonymous)';

comment on policy "classes_permanent_users_only_delete" on classes is
  'RESTRICTIVE: Only permanent users can delete classes (no anonymous)';

comment on view anonymous_user_stats is
  'Statistics showing count of anonymous vs permanent users';

-- =====================================================
-- CLEANUP FUNCTION FOR OLD ANONYMOUS USERS
-- =====================================================

-- Function to clean up anonymous users older than specified days
create or replace function cleanup_old_anonymous_users(days_old int default 30)
returns table (deleted_count bigint) as $$
declare
  deleted bigint;
begin
  delete from auth.users
  where is_anonymous is true
  and created_at < now() - (days_old || ' days')::interval;

  get diagnostics deleted = row_count;
  return query select deleted;
end;
$$ language plpgsql security definer;

comment on function cleanup_old_anonymous_users is
  'Delete anonymous users older than specified days (default: 30). Run via cron job.';

-- Example usage:
-- SELECT * FROM cleanup_old_anonymous_users(30);
