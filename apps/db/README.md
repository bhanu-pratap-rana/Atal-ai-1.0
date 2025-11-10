# ATAL AI Database - Supabase

PostgreSQL database schema and migrations for the ATAL AI Digital Empowerment Platform.

## 📊 Database Schema

### Tables

#### **users**
Stores user profiles linked to Supabase Auth.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key, matches `auth.uid()` |
| `email` | text | User email address (unique) |
| `role` | text | User role: `student` or `teacher` |
| `created_at` | timestamp | Account creation timestamp |

#### **classes**
Stores classes created by teachers.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Class name |
| `teacher_id` | uuid | Foreign key to `users.id` |
| `created_at` | timestamp | Class creation timestamp |

#### **enrollments**
Maps students to classes (many-to-many relationship).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `class_id` | uuid | Foreign key to `classes.id` |
| `student_id` | uuid | Foreign key to `users.id` |
| `created_at` | timestamp | Enrollment timestamp |

**Constraints:**
- Unique constraint on `(class_id, student_id)` - prevents duplicate enrollments
- Cascade delete: Deleting a class removes all enrollments

## 🔒 Row-Level Security (RLS)

All tables have RLS enabled with the following policies:

### **users** Table Policies

| Policy Name | Command | Description |
|-------------|---------|-------------|
| `users_self_read` | SELECT | Users can read their own profile |
| `users_self_update` | UPDATE | Users can update their own profile |

**Security:** Users cannot view other users' data. No INSERT policy (users created via Auth).

### **classes** Table Policies

| Policy Name | Command | Description |
|-------------|---------|-------------|
| `classes_teacher_crud` | ALL | Teachers have full CRUD access to their own classes |
| `classes_student_read` | SELECT | Students can view classes they're enrolled in |

**Security:**
- Only class owners (teachers) can modify their classes
- Students can only see classes where they have an enrollment record

### **enrollments** Table Policies

| Policy Name | Command | Description |
|-------------|---------|-------------|
| `enrollments_teacher_manage` | ALL | Teachers can manage enrollments for their classes |
| `enrollments_student_read` | SELECT | Students can view their own enrollments |

**Security:**
- Teachers can enroll/unenroll students only in their own classes
- Students can see which classes they're enrolled in but cannot modify enrollments
- Students cannot view other students' enrollments

## 📁 Migrations

Migrations are located in [`/migrations`](./migrations/) and applied in order:

| File | Description | Status |
|------|-------------|--------|
| `001_create_initial_schema.sql` | Create tables with foreign keys | ✅ Applied |
| `002_enable_rls_policies.sql` | Enable RLS and create security policies | ✅ Applied |
| `003_seed_test_data.sql` | Insert test users and classes | ✅ Applied |

### Applying Migrations

Migrations are applied automatically via Supabase MCP or can be run manually:

```bash
# Using Supabase CLI
supabase db push

# Or via Supabase Dashboard
# Navigate to SQL Editor → Run migration file
```

## 🧪 Testing RLS Policies

### Test Data

The seed migration creates:
- 1 teacher: `teacher@atalai.com`
- 2 students: `student1@atalai.com`, `student2@atalai.com`
- 1 class: "Digital Literacy 101"
- 2 enrollments (both students in the class)

### RLS Test Scenarios

#### ✅ Should Succeed

```sql
-- Teacher creates their own class
-- (Run as: 00000000-0000-0000-0000-000000000001)
insert into classes (name, teacher_id)
values ('New Class', auth.uid());

-- Teacher views their own classes
select * from classes where teacher_id = auth.uid();

-- Student views enrolled classes
-- (Run as: 00000000-0000-0000-0000-000000000002)
select * from classes c
join enrollments e on e.class_id = c.id
where e.student_id = auth.uid();

-- Teacher enrolls student in their class
insert into enrollments (class_id, student_id)
values ('[class_id]', '[student_id]');

-- User updates their own profile
update users set email = 'newemail@atalai.com'
where id = auth.uid();
```

#### ❌ Should Fail (RLS Blocks)

```sql
-- Student tries to view all classes (not just enrolled ones)
select * from classes; -- Returns only enrolled classes

-- Student tries to create a class
insert into classes (name, teacher_id)
values ('Unauthorized Class', auth.uid()); -- Policy violation

-- Student tries to enroll themselves
insert into enrollments (class_id, student_id)
values ('[class_id]', auth.uid()); -- Policy violation

-- User tries to view another user's profile
select * from users where id != auth.uid(); -- Returns empty

-- Teacher tries to modify another teacher's class
update classes set name = 'Hacked'
where teacher_id != auth.uid(); -- Policy violation
```

### Testing with Real Users

**Important:** The seed data uses placeholder UUIDs. For realistic RLS testing:

1. **Sign up users via the app** (`/login` → OTP email)
2. **Get their auth.uid():**
   ```sql
   select id, email from auth.users;
   ```
3. **Create corresponding user profiles:**
   ```sql
   insert into users (id, email, role)
   values ('[auth.uid from step 2]', '[email]', 'teacher');
   ```
4. **Test queries as that user** in Supabase SQL Editor using "Run as user" feature

## 🔧 Development Workflow

### Creating New Tables

When adding new tables:

1. Create migration file: `004_your_migration_name.sql`
2. Enable RLS: `alter table your_table enable row level security;`
3. Create policies matching your security requirements
4. Apply migration via MCP or Supabase Dashboard
5. Test policies thoroughly with different user roles

### Security Best Practices

- ✅ **Always enable RLS** on user-facing tables
- ✅ **Test policies** with multiple user scenarios
- ✅ **Use `auth.uid()`** to reference the current authenticated user
- ✅ **Principle of least privilege** - grant minimum necessary access
- ✅ **Validate with Supabase Advisors** - check for security issues
- ❌ **Never disable RLS** on production tables
- ❌ **Don't hardcode UUIDs** in production code (seed data only)

## 📞 Troubleshooting

### "Permission denied for table X"
- **Cause:** RLS is enabled but no policy allows the operation
- **Fix:** Create appropriate RLS policy or check if user has correct role

### "Row violates row-level security policy"
- **Cause:** Trying to insert/update data that doesn't match policy `WITH CHECK` clause
- **Fix:** Ensure `teacher_id`, `student_id`, etc. match `auth.uid()` where required

### "Function auth.uid() does not exist"
- **Cause:** Not running query in authenticated context
- **Fix:** Use Supabase client or SQL Editor with "Run as user" option

## 🔗 Resources

- [Supabase Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)

---

**Database Version:** PostgreSQL 17.6
**Project:** ATAL AI 1.0 (hnlsqznoviwnyrkskfay)
**Last Updated:** 2025-11-10
