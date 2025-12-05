-- Initialize Super Admin Role
-- This migration ensures the super admin (atal.app.ai@gmail.com) has the super_admin role
-- This runs once during deployment to set up the initial admin account

-- Check if atal.app.ai@gmail.com exists in auth.users and set role if not already set
-- NOTE: This is a reference migration. The actual user creation should be done via:
-- 1. Supabase Auth UI (manual account creation)
-- 2. Admin setup page (/admin/create or /admin/setup)
-- 3. Server action (createAdminUser)

-- This migration documents the role that should be assigned
-- Actual role assignment happens through Supabase client library

-- Comment: In Supabase, user roles are stored in auth.users.app_metadata as JSON
-- The app_metadata.role field should be set to 'super_admin' for atal.app.ai@gmail.com
--
-- This can be done via:
-- 1. Supabase Dashboard: Auth > Users > Select user > Edit > Update metadata
-- 2. Supabase Admin API: PATCH /admin/users/:id with app_metadata { "role": "super_admin" }
-- 3. Server action: createAdminUser or setAdminRole with role: 'super_admin'
--
-- The role-based access control is enforced at the application layer via:
-- - app/actions/admin-management.ts (server actions)
-- - app/actions/admin-roles.ts (role utilities)
-- - components/admin/RoleGuard.tsx (client-side authorization)

-- Example of what happens when the super admin user is created:
-- User email: atal.app.ai@gmail.com
-- User role (app_metadata.role): super_admin
-- Capabilities:
--   - canManageAdmins: true
--   - canManageSchools: true
--   - canManagePins: true
--   - canViewDashboard: true
--   - canResetPasswords: true
--   - canDeleteAdmins: true
