# Creating Admin User - CORRECTED SQL

The error indicates the column structure is different. Here's the corrected approach:

## Method 1: Update Existing User (EASIEST IF USER EXISTS)

If you already created the user `atal.app.ai@gmail.com` in the Dashboard, use this:

```sql
UPDATE auth.users
SET raw_app_meta_data = jsonb_build_object('role', 'admin')
WHERE email = 'atal.app.ai@gmail.com';
```

**Verify it worked:**
```sql
SELECT email, raw_app_meta_data FROM auth.users WHERE email = 'atal.app.ai@gmail.com';
```

---

## Method 2: Create User with Correct Schema (IF NO USER EXISTS YET)

First, check what columns actually exist:

```sql
-- Check the actual table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'auth'
ORDER BY ordinal_position;
```

Copy the output and share it, OR just try this simpler method:

```sql
-- Create user and then update metadata in separate steps
-- Step 1: User should be created via Dashboard first
-- Step 2: Then run this to add admin role

UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
WHERE email = 'atal.app.ai@gmail.com';
```

---

## Method 3: Using Supabase RPC Function (Most Reliable)

Supabase has built-in functions. Try this:

```sql
-- Create admin user using Supabase auth
SELECT
  auth.uid() as user_id,
  raw_app_meta_data
FROM auth.users
WHERE email = 'atal.app.ai@gmail.com';

-- Then update the metadata
UPDATE auth.users
SET raw_app_meta_data = '{"role":"admin"}'::jsonb
WHERE email = 'atal.app.ai@gmail.com';
```

---

## Quick Fix (Copy & Paste This)

Since we got an error about `app_metadata`, the correct column is likely `raw_app_meta_data`.

**Try this SQL in your SQL Editor:**

```sql
UPDATE auth.users
SET raw_app_meta_data = jsonb_build_object('role', 'admin')
WHERE email = 'atal.app.ai@gmail.com';
```

If that works, verify with:

```sql
SELECT email, raw_app_meta_data FROM auth.users WHERE email = 'atal.app.ai@gmail.com';
```

You should see:
```
email                    | raw_app_meta_data
-------------------------|------------------
atal.app.ai@gmail.com    | {"role": "admin"}
```

---

## If User Doesn't Exist Yet

You'll need to create the user via Dashboard first:
1. Dashboard → Authentication → Users
2. Click "Create a new user"
3. Enter:
   - Email: `atal.app.ai@gmail.com`
   - Password: `b8h9a7n9@AI`
   - Check "Auto confirm email"
4. Click "Create user"

Then run the UPDATE SQL above.

---

## Test Admin Access

After updating the metadata:

1. Login with:
   - Email: `atal.app.ai@gmail.com`
   - Password: `b8h9a7n9@AI`

2. Go to `/app/admin/schools`

3. Check:
   - ✅ You see the PIN management interface
   - ❌ You get "Access Denied"

If denied, the role metadata wasn't set correctly.

---

## Troubleshooting

**Error: "column app_metadata does not exist"**
→ Use `raw_app_meta_data` instead

**Error: "No column raw_app_meta_data"**
→ Run the column check query above to see actual column names

**Can login but no admin access**
→ The role wasn't set. Check with:
```sql
SELECT raw_app_meta_data FROM auth.users WHERE email = 'atal.app.ai@gmail.com';
```

If it shows `null` or `{}`, run the UPDATE again.

---

## For Multiple Admins

Once you get one admin working, create more with:

```sql
-- Create multiple admin users at once
UPDATE auth.users
SET raw_app_meta_data = jsonb_build_object('role', 'admin')
WHERE email IN (
  'admin1@school.edu',
  'admin2@school.edu',
  'admin3@school.edu'
);
```

---

**Try the corrected SQL above. If it still fails, please run:**

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'auth'
ORDER BY ordinal_position;
```

And share the output so I can give you the exact correct column name.

