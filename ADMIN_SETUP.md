# Admin User Setup Guide

## Initial Admin User Creation

To create the first admin user for the ATAL AI system, you have two options:

### Option 1: Using Supabase Dashboard (Recommended for First Admin)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication → Users**
3. Click **Create a new user**
4. Fill in the following details:

```
Email:           atal.app.ai@gmail.com
Password:        b8h9a7n9@AI
Confirm Password: b8h9a7n9@AI
Auto confirm email: ✓ (checked)
```

5. Once created, update the user's metadata:
   - Go to user details
   - Set `app_metadata` to:
   ```json
   {
     "role": "admin"
   }
   ```

### Option 2: Using Server Action (Once First Admin Exists)

The `createAdminUser()` server action in `apps/web/src/app/actions/school.ts` can be used to create additional admin users programmatically:

```typescript
import { createAdminUser } from '@/app/actions/school'

// Create a new admin user (must be called by existing admin)
const result = await createAdminUser(
  'admin2.email@gmail.com',
  'securePassword123'
)

if (result.success) {
  console.log(`Admin created with ID: ${result.userId}`)
} else {
  console.log(`Error: ${result.error}`)
}
```

### Option 3: Using Supabase CLI

If you have the Supabase CLI configured:

```bash
# Create admin user via CLI
supabase auth admin create-user \
  --email atal.app.ai@gmail.com \
  --password b8h9a7n9@AI \
  --skip-confirmation

# Update user metadata (via SQL)
supabase sql execute - <<EOF
UPDATE auth.users
SET app_metadata = jsonb_set(
  COALESCE(app_metadata, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'atal.app.ai@gmail.com';
EOF
```

---

## Important Security Notes

### Password Requirements
- Minimum 8 characters (enforced by validation)
- Should contain uppercase, lowercase, numbers, and special characters
- The provided password `b8h9a7n9@AI` meets these requirements

### Access Control
The `createAdminUser()` function includes built-in security:
- ✅ Only authenticated users can call it
- ✅ Only existing admins can create new admins
- ✅ Input validation with Zod schemas
- ✅ Email verification (auto-confirmed for admins)
- ✅ All actions are logged

### Adding More Admins

Once the first admin is created, you can add more admins using the server action:

```typescript
// Admin panel endpoint (to be created)
export async function addNewAdmin(email: string, password: string) {
  // This would be exposed via an API route or admin panel
  return await createAdminUser(email, password)
}
```

---

## User Management Instructions

### For Creating Multiple Admin Users

When you need to add more admin users, simply use the `createAdminUser()` function with their credentials:

```typescript
await createAdminUser('admin1@school.edu', 'AdminPass@123')
await createAdminUser('admin2@school.edu', 'AdminPass@456')
await createAdminUser('admin3@school.edu', 'AdminPass@789')
```

### Verifying Admin Access

After creating an admin user:

1. Login with the admin credentials
2. Navigate to `/app/admin/schools`
3. If authorization check passes, you'll see the PIN management interface
4. If denied, the user doesn't have `app_metadata.role = 'admin'`

### Troubleshooting Admin Creation

| Issue | Solution |
|-------|----------|
| "Email already registered" | User already exists. Delete from Supabase Auth first, or use different email |
| "Admin access required" | Caller is not an admin. Only existing admins can create new admins |
| Password validation error | Password must be 8+ characters and pass strength requirements |
| Access denied to admin page | Verify `app_metadata.role` is set to `'admin'` in Supabase |

---

## Initial Credentials

```
First Admin User:
├─ Email: atal.app.ai@gmail.com
├─ Password: b8h9a7n9@AI
└─ Role: admin

Login URL: https://your-app-domain.com/login
Admin Panel: https://your-app-domain.com/app/admin/schools
```

**⚠️ Important:**
- Store credentials securely
- Change password after first login (if password reset feature is available)
- Never share credentials via email or chat
- Enable MFA if available in Supabase

---

## Architecture Overview

The admin system works as follows:

```
┌─────────────────────────────────────────┐
│ Supabase Auth (auth.users)              │
│                                         │
│ ┌──────────────────────────────────┐  │
│ │ User: atal.app.ai@gmail.com      │  │
│ │ Password: [bcrypt hashed]        │  │
│ │ app_metadata: {                  │  │
│ │   "role": "admin"                │  │
│ │ }                                │  │
│ └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ Session/JWT Token                       │
│                                         │
│ Contains app_metadata from Supabase      │
│ Decoded by: getCurrentUser()             │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ Authorization Checks                    │
│                                         │
│ checkAdminAuth() verifies:              │
│ - User is authenticated                 │
│ - app_metadata.role === 'admin'         │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ Admin Features Unlocked                 │
│                                         │
│ ✓ PIN Management (/app/admin/schools)  │
│ ✓ Create New Admins (createAdminUser) │
│ ✓ View Audit Logs (future feature)      │
└─────────────────────────────────────────┘
```

---

**Document Version:** 1.0
**Date:** November 24, 2025
**Last Updated:** After P0 fixes implementation
