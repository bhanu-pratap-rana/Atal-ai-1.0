# Admin User Management Reference

## Quick Start: Creating Admin Users

### Method 1: First Admin (Using Supabase Dashboard)

Since there's no first admin yet, use the Supabase dashboard:

1. Open Supabase Console for your project
2. Go to **Authentication → Users**
3. Click **Create a new user**
4. Enter:
   ```
   Email:    atal.app.ai@gmail.com
   Password: b8h9a7n9@AI
   ```
5. Check **Auto confirm email**
6. Click **Create user**
7. Click on the user to open details
8. Scroll to **User Metadata** section
9. Set `app_metadata`:
   ```json
   {
     "role": "admin"
   }
   ```
10. Save and close

---

### Method 2: Additional Admins (Using Server Action)

Once you have the first admin, use the `createAdminUser()` function:

**Via Next.js API Route:**

Create `apps/web/src/app/api/admin/create-user/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createAdminUser } from '@/app/actions/school'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    // Create admin user (will verify caller is admin)
    const result = await createAdminUser(email, password)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        userId: result.userId,
        email: result.email,
        message: result.message,
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    )
  }
}
```

**Example Usage:**

```bash
curl -X POST http://localhost:3000/api/admin/create-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "email": "admin2@atal-ai.edu",
    "password": "SecureAdminPass@123"
  }'
```

---

## Admin User Database Structure

Admin users are stored in Supabase `auth.users` table:

```sql
SELECT
  id,
  email,
  created_at,
  app_metadata->'role' as role
FROM auth.users
WHERE app_metadata->>'role' = 'admin';
```

### User Record Example

```json
{
  "id": "uuid-here",
  "email": "atal.app.ai@gmail.com",
  "email_confirmed_at": "2025-11-24T10:00:00Z",
  "encrypted_password": "[bcrypt hash]",
  "app_metadata": {
    "role": "admin"
  },
  "user_metadata": {},
  "created_at": "2025-11-24T10:00:00Z"
}
```

---

## Admin User List (Template)

Use this template to track your admin users:

| Email | Password | Created | Status | Notes |
|-------|----------|---------|--------|-------|
| atal.app.ai@gmail.com | b8h9a7n9@AI | 2025-11-24 | ✅ Active | First admin |
| | | | | |
| | | | | |

---

## Common Admin Operations

### List All Admins

```sql
SELECT
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE app_metadata->>'role' = 'admin'
ORDER BY created_at DESC;
```

### Reset Admin Password

**Via Supabase Dashboard:**
1. Go to **Authentication → Users**
2. Find the admin user
3. Click the user to open details
4. Scroll to **User Password**
5. Click **Reset Password** (sends password reset email)

**Via SQL:**
```sql
UPDATE auth.users
SET encrypted_password = crypt('NewPassword123!', gen_salt('bf', 12))
WHERE email = 'admin.email@example.com';
```

### Disable Admin User

```sql
UPDATE auth.users
SET app_metadata = jsonb_set(
  app_metadata,
  '{role}',
  '"disabled"'
)
WHERE email = 'admin.email@example.com';
```

### Delete Admin User

**Via Supabase Dashboard:**
1. Go to **Authentication → Users**
2. Find the admin user
3. Click **Delete user**
4. Confirm deletion

**Via SQL:**
```sql
DELETE FROM auth.users
WHERE email = 'admin.email@example.com'
AND app_metadata->>'role' = 'admin';
```

---

## Admin Access Control

### Checking Admin Status

The `checkAdminAuth()` function verifies:

```typescript
export async function checkAdminAuth() {
  const user = await getCurrentUser()
  return user.app_metadata?.role === 'admin'
}
```

### Protected Admin Pages

- `/app/admin/schools` - PIN management (requires admin role)

### Admin Features

| Feature | Endpoint | Auth Required |
|---------|----------|---------------|
| School PIN Management | `/app/admin/schools` | ✅ Admin |
| Create New Admin | `createAdminUser()` | ✅ Admin |
| View Auth Logs | (future) | ✅ Admin |

---

## Password Policy

Enforce these password requirements for admin accounts:

- ✅ Minimum 8 characters
- ✅ Maximum 128 characters
- ✅ Should contain uppercase letters
- ✅ Should contain lowercase letters
- ✅ Should contain numbers
- ✅ Should contain special characters (@, #, $, %, etc.)

**Example Strong Password:** `AdminPass@2024#Secure`

---

## Audit & Security

All admin operations are logged via `authLogger`:

```typescript
authLogger.success('[createAdminUser] Admin user created successfully', {
  userId: newUser.user.id,
  email: validatedEmail,
})

authLogger.warn('[createAdminUser] Non-admin user attempted to create admin', {
  userId: user.id,
})

authLogger.error('[createAdminUser] Failed to create admin user', createError)
```

**View logs in:** `apps/web/src/lib/auth-logger.ts`

---

## Troubleshooting

### Problem: "Email already registered"

**Cause:** User already exists in Supabase auth

**Solution:**
```sql
-- Check if email exists
SELECT email FROM auth.users WHERE email = 'test@example.com';

-- Delete user if it's a test account
DELETE FROM auth.users WHERE email = 'test@example.com';

-- Try creating again
```

### Problem: "Admin access required"

**Cause:** Caller doesn't have admin role

**Solution:**
```sql
-- Verify the caller's role
SELECT email, app_metadata->>'role' as role FROM auth.users
WHERE email = 'caller@example.com';

-- Update role to admin if missing
UPDATE auth.users
SET app_metadata = jsonb_set(
  COALESCE(app_metadata, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'caller@example.com';
```

### Problem: Can't login to admin panel

**Cause:** Missing or incorrect `app_metadata.role`

**Solution:**
1. Verify the user exists:
   ```sql
   SELECT id, email, app_metadata FROM auth.users WHERE email = 'admin@example.com';
   ```

2. Check the `app_metadata.role` field is exactly `"admin"` (case-sensitive)

3. If missing, update it:
   ```sql
   UPDATE auth.users
   SET app_metadata = jsonb_set(
     COALESCE(app_metadata, '{}'::jsonb),
     '{role}',
     '"admin"'
   )
   WHERE email = 'admin@example.com';
   ```

4. Clear browser cache and login again

---

## Next Steps

1. **Create First Admin**
   - Use Supabase dashboard method above
   - Verify login to `/app/admin/schools`

2. **Add More Admins**
   - Use `createAdminUser()` via API route
   - Create additional admins as needed

3. **Secure Credentials**
   - Store passwords in secure password manager
   - Never share via email/chat
   - Use strong, unique passwords

4. **Monitor Access**
   - Check logs regularly for unauthorized attempts
   - Review admin user list periodically
   - Remove inactive admin accounts

---

**Document Version:** 1.0
**Date:** November 24, 2025
**Related Files:**
- `ADMIN_SETUP.md` - Initial setup guide
- `apps/web/src/app/actions/school.ts` - `createAdminUser()` implementation
- `apps/web/src/app/app/admin/schools/page.tsx` - Admin panel
