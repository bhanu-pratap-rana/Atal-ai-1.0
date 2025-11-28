# Admin Login Guide - How to Access Admin Panel

**Status:** ✅ ADMIN LOGIN PAGE CREATED
**Route:** `/admin/login`
**Updated:** November 24, 2025

---

## 🚀 How to Login as Admin

### Step 1: Go to Admin Login Page

You have **3 ways** to access the admin login:

#### **Option A: Direct URL** (Fastest)
```
http://localhost:3000/admin/login
```

#### **Option B: From Home Page**
1. Go to: `http://localhost:3000`
2. Click **"Admin"** button (top-right corner with shield icon)
3. You'll be taken to `/admin/login`

#### **Option C: From Access Denied Screen**
1. Try to access admin panel: `http://localhost:3000/app/admin/schools`
2. If not logged in as admin, you'll see "Access Denied"
3. Click **"Admin Login"** button
4. You'll be taken to `/admin/login`

---

## 📝 Admin Login Form

Once on the admin login page, you'll see a form with:

- **Email field:** For admin email
- **Password field:** For admin password
- **Login button:** Submit credentials
- **Back button:** Return to home page

### Enter Your Credentials:

```
Email:    atal.app.ai@gmail.com
Password: b8h9a7n9@AI
```

---

## ✅ Expected Flow After Login

1. **Enter credentials** on `/admin/login`
2. **System verifies:**
   - Email and password match in Supabase auth
   - User has `app_metadata.role = "admin"`
3. **If successful:**
   - ✅ Login succeeds
   - ✅ Redirected to `/app/admin/schools`
   - ✅ You see the PIN Management interface
4. **If failed:**
   - ❌ Error message shown: "Invalid email or password"
   - ❌ Stay on login page
   - ❌ Can retry

---

## 🔍 What You'll See on Admin Panel

After successful login, you'll access `/app/admin/schools` which contains:

### **Step 1: Find School**
- Quick search by code or name
- OR Browse by District & Block (hierarchical finder)
- Click school to select it

### **Step 2: Check PIN Status**
- View if PIN exists
- See creation date
- See last rotation date

### **Step 3: Rotate/Create PIN**
- Enter new PIN (4-8 digits)
- Confirm PIN
- Click "Rotate" or "Create" PIN
- PIN is bcrypt hashed and stored securely

---

## 🆘 Troubleshooting

### Problem: Can't find admin login button

**Solution:**
1. Go directly to: `http://localhost:3000/admin/login`
2. OR from home page, look for shield icon (⛔) in top-right corner

---

### Problem: "Invalid email or password" error

**Causes:**
1. Email is incorrect
2. Password is incorrect
3. Account doesn't have admin role

**Solution:**
```
Verify credentials are:
Email:    atal.app.ai@gmail.com (exact match)
Password: b8h9a7n9@AI (exact match)
```

If still failing, check database:
```sql
SELECT email, raw_app_meta_data FROM auth.users
WHERE email = 'atal.app.ai@gmail.com';
```

Expected: Row with `{"role": "admin"}` in metadata

---

### Problem: Login works but access denied to `/app/admin/schools`

**Cause:** User doesn't have admin role in app_metadata

**Solution:** Update metadata in database:
```sql
UPDATE auth.users
SET raw_app_meta_data = jsonb_build_object('role', 'admin')
WHERE email = 'atal.app.ai@gmail.com';

-- Verify
SELECT raw_app_meta_data FROM auth.users
WHERE email = 'atal.app.ai@gmail.com';
```

Then logout and login again.

---

### Problem: "This account does not have admin access" error

**Cause:** Account exists but is not an admin

**Solution:** Either:
1. Use different admin account, OR
2. Add admin role to this user via SQL:
```sql
UPDATE auth.users
SET raw_app_meta_data = jsonb_build_object('role', 'admin')
WHERE email = 'your.email@domain.com';
```

---

## 🔐 Security Features

The admin login page includes:

- ✅ **Email validation** - Checks format
- ✅ **Password masking** - Password field shows dots
- ✅ **Error messages** - Helpful but not revealing
- ✅ **Role verification** - Checks `app_metadata.role`
- ✅ **Credentials in Supabase** - NOT hardcoded
- ✅ **Password hashing** - Bcrypt in database
- ✅ **Session management** - JWT via Supabase
- ✅ **Security notices** - Displayed on form

---

## 📱 Mobile & Desktop Access

The admin login page works on:
- ✅ Desktop browsers (Chrome, Firefox, Safari, Edge)
- ✅ Tablets
- ✅ Mobile devices

The responsive design adapts to all screen sizes.

---

## 🔄 Session Management

### Logout from Admin Panel

1. Go to any page in the app
2. Click **"Sign Out"** button (top-right)
3. Session ends
4. Redirected to home page

### Auto-Logout

If your session expires:
1. Click any button that requires auth
2. You'll be redirected to login page
3. Re-enter credentials

---

## 📊 Admin Routes

| Route | Purpose | Access |
|-------|---------|--------|
| `/admin/login` | Admin login page | Public |
| `/app/admin/schools` | PIN management panel | Admin only |
| `/app/admin/users` | User management (future) | Admin only |
| `/app/admin/logs` | Audit logs (future) | Admin only |

---

## ✨ New Features Added

**Admin Login Page:**
- Dedicated authentication interface
- Admin-specific error messages
- Security notices
- Info about default admin account
- Easy navigation (back to home)

**Home Page Updates:**
- Admin button added (top-right)
- Shield icon for easy identification
- Positioned next to logout button

**Admin Panel Updates:**
- Better error messages
- Direct link to admin login
- Clear authorization errors

---

## 🎯 Quick Reference

| Item | Value |
|------|-------|
| **Admin Login URL** | `http://localhost:3000/admin/login` |
| **Admin Email** | `atal.app.ai@gmail.com` |
| **Admin Password** | `b8h9a7n9@AI` |
| **Admin Panel URL** | `http://localhost:3000/app/admin/schools` |
| **Database Location** | Supabase auth.users table |
| **Stored Where** | Database (NOT hardcoded) |

---

## 📞 Support

For issues:
1. Check this guide (Troubleshooting section)
2. Verify database credentials (SQL queries provided)
3. Check browser console for errors
4. Review Supabase auth logs

---

**Document Version:** 1.0
**Status:** ACTIVE
**Last Updated:** November 24, 2025

