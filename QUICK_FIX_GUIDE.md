# Quick Fix Guide - rule.md Compliance Issues

## 🔴 CRITICAL (BLOCKING) - Fix Time: 3 hours

### 1. ESLint - Fix all 27 violations
Command: `cd apps/web && npm run lint`

#### 1.1 Fix `any` Types (13 instances)

**File:** `src/app/(public)/student/start/page.tsx:158`
```typescript
// BEFORE
setTeacherSignInData(prev => ({ ...prev, userData: val as any }))

// AFTER
interface TeacherSignInData {
  userName?: string
  schoolName?: string
  userRole?: string
  userData?: string  // or appropriate type
}
setTeacherSignInData(prev => ({ ...prev, userData: val }))
```

**File:** `src/app/app/admin/schools/page.tsx:32,44,72`
```typescript
// BEFORE
schools.map((school: any) => ...)
school.name as any

// AFTER
interface School {
  id: string
  name: string
  code?: string
  address?: string
  // Add other fields from DB
}
schools.map((school: School) => ...)
school.name  // remove 'as any'
```

**File:** `src/app/app/assessment/start/page.tsx:22`
```typescript
// BEFORE
const { data: any } = await ...

// AFTER
interface AssessmentData {
  id: string
  title: string
  // ... other fields
}
const { data } = await ... as { data: AssessmentData }
```

**File:** `src/app/app/dashboard/page.tsx:13`
```typescript
// BEFORE
const { user: any } = session

// AFTER
const user = session?.user  // Already typed by Supabase
```

**File:** `src/app/app/student/classes/page.tsx:69`
```typescript
// BEFORE
enrollments.map((enrollment: any) => enrollment.class_id)

// AFTER
interface Enrollment {
  id: string
  class_id: string
  student_id: string
}
enrollments.map((enrollment: Enrollment) => enrollment.class_id)
```

**File:** `src/app/app/teacher/classes/[id]/page.tsx:41,43,50,51`
```typescript
// BEFORE
let enrollmentsWithStudents: any[] = []
const studentIds = enrollmentsData.map((e: any) => e.student_id)
const studentsMap = students.reduce((acc: any, s: any) => ...)

// AFTER
interface EnrollmentWithStudent {
  id: string
  student_id: string
  // ... other fields
}
let enrollmentsWithStudents: EnrollmentWithStudent[] = []

interface Student {
  id: string
  name: string
  // ... other fields
}
const studentIds = enrollmentsData.map((e: Enrollment) => e.student_id)
const studentsMap = students.reduce((acc: Map<string, Student>, s: Student) => ...)
```

**File:** `src/app/app/teacher/classes/page.tsx:86`
```typescript
// BEFORE
const classData: any = JSON.parse(classString)

// AFTER
interface ClassData {
  id: string
  name: string
  subject?: string
}
const classData: ClassData = JSON.parse(classString)
```

#### 1.2 Fix Unescaped HTML Entities (10 instances)

**Files to fix:**
- `src/app/(public)/teacher/start/page.tsx:640,707,1090,1227`
- `src/app/(public)/student/start/page.tsx:592,663,859`
- `src/app/app/dashboard/page.tsx:91,96`
- `src/app/page.tsx:56,71`

```typescript
// BEFORE
"Don't have an account?"
"Why's this here?"
"It's important"

// AFTER
"Don&apos;t have an account?"
"Why&apos;s this here?"
"It&apos;s important"
```

#### 1.3 Fix next-pwa.config.js

**File:** `next-pwa.config.js:1`
```javascript
// BEFORE
const withPWA = require('next-pwa')({

// AFTER
import withPWA from 'next-pwa'

export default withPWA({
  // ... rest of config
})
```

#### 1.4 Remove Unused Variables (14 instances)

**File:** `src/app/(public)/join/page.tsx`
```typescript
// Line 9: Remove unused function
- import { validatePhone } from '@/lib/auth-validation'

// Line 14: Remove unused function
- const handleAnonymousSignIn = async () => { ... }

// Lines 107, 132, 290, 428: Remove unused error variable
- const { data, error } = await ...
+ const { data } = await ...
```

**File:** `src/app/(public)/teacher/start/page.tsx`
```typescript
// Lines 188, 227, 303, 337, 379, 410: Remove unused error
- const { data, error } = ...
+ const { data } = ...
```

**File:** `src/app/actions/student.ts:12`
```typescript
// BEFORE
export async function createClass(name: string, rollNumber: string) {

// AFTER
export async function createClass(name: string) {
```

**File:** `src/app/app/admin/schools/page.tsx`
```typescript
// Lines 64, 100, 141: Remove unused error
- const { data, error } = ...
+ const { data } = ...
```

**File:** `src/app/app/assessment/start/page.tsx:3`
```typescript
// Line 3: Remove unused import
- import { useEffect } from 'react'
```

**File:** `src/app/app/student/assessments/page.tsx:4`
```typescript
// Line 4: Remove unused import
- import { Button } from '@/components/ui/button'
```

**File:** `src/components/assessment/AssessmentRunner.tsx`
```typescript
// Line 35: Remove unused type
- type EnhancedResponseData = ...

// Line 55: Remove unused variable
- let selectionHistory: ...
```

---

### 2. React Purity Violations (2 issues)

**File:** `src/components/assessment/AssessmentRunner.tsx:51`
```typescript
// BEFORE
const [startTime, setStartTime] = useState<number>(Date.now())

// AFTER
const [startTime, setStartTime] = useState<number>(0)

useEffect(() => {
  setStartTime(Date.now())
}, [])
```

**File:** `src/components/assessment/AssessmentRunner.tsx:117`
```typescript
// BEFORE (function defined at line ~250)
useEffect(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      const newIndex = (selectedOption - 1 + shuffledOptions.length) % shuffledOptions.length
      handleOptionSelect(newIndex)  // ❌ WRONG: function not defined yet
    }
  }
}, [selectedOption, shuffledOptions])

const handleOptionSelect = (index: number) => {  // Line ~250
  setSelectedOption(index)
  // ...
}

// AFTER
const handleOptionSelect = useCallback((index: number) => {
  setSelectedOption(index)
  // ...
}, [])

useEffect(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      const newIndex = (selectedOption - 1 + shuffledOptions.length) % shuffledOptions.length
      handleOptionSelect(newIndex)  // ✅ CORRECT: function defined before use
    }
  }
  // ...
}, [selectedOption, shuffledOptions, handleOptionSelect])
```

---

### 3. Missing React Dependencies (2 issues)

**File:** `src/app/(public)/join/page.tsx:413`
```typescript
// BEFORE
useEffect(() => {
  router.push('/...')
}, [])  // ❌ Missing 'router' dependency

// AFTER
useEffect(() => {
  router.push('/...')
}, [router])  // ✅ Include router
```

**File:** `src/app/app/dashboard/page.tsx:24`
```typescript
// BEFORE
useEffect(() => {
  supabase.auth.getSession()
}, [])  // ❌ Missing 'supabase.auth' dependency

// AFTER
useEffect(() => {
  supabase.auth.getSession()
}, [supabase.auth])  // ✅ Include supabase.auth
```

---

## 🟡 HIGH PRIORITY (Should do before merge) - Fix Time: 4-5 hours

### 4. Create Design Token System

**File to create:** `packages/ui/theme.ts`
```typescript
export const COLORS = {
  // Primary
  primary: {
    50: '#fff7ed',
    100: '#fed7aa',
    200: '#fdba74',
    500: '#f97316',
    600: '#ea580c',
  },
  // Success
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  // Error
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
  // Neutral
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    500: '#737373',
    900: '#171717',
  },
}

export const GRADIENTS = {
  primary: 'from-orange-50 via-yellow-50 to-green-50',
  accent: 'from-pink-500 via-orange-500 to-yellow-500',
  // ... other gradients
}

export const ANIMATIONS = {
  pageTransition: { duration: 0.3, ease: 'easeInOut' },
  buttonHover: { scale: 1.05, transition: { duration: 0.2 } },
  // ...
}
```

Then update components:
```typescript
// BEFORE
<div className="from-orange-50 via-yellow-50 to-green-50">

// AFTER
import { GRADIENTS } from '@/lib/theme'
<div className={`bg-gradient-to-r ${GRADIENTS.primary}`}>
```

### 5. Implement Skipped Tests

**File:** `tests/teacher-registration.spec.ts`

Replace `.skip` with implementation:
```typescript
// Line 75
test('should validate password strength', async ({ page }) => {
  await page.goto('/teacher/start')
  await page.fill('[name="password"]', 'weak')
  await page.click('button:has-text("Continue")')
  await expect(page.getByText('Password too weak')).toBeVisible()
})

// Line 81
test('should validate school code format', async ({ page }) => {
  // Similar implementation
})

// Line 87
test('should verify staff PIN server-side', async ({ page }) => {
  // Test that PIN is verified server-side
})

// Line 93
test('should prevent duplicate registration', async ({ page }) => {
  // Test that email already registered message appears
})

// Line 99
test('should redirect existing email to login', async ({ page }) => {
  // Test that existing email redirects to login
})

// Line 106
test('should complete full registration flow', async ({ page }) => {
  // Full end-to-end test
})
```

### 6. Add Unit Tests for Server Actions

**File to create:** `tests/unit/auth.test.ts`
```typescript
import { checkEmailExistsInAuth, requestOtp } from '@/app/actions/auth'

describe('Auth Server Actions', () => {
  test('checkEmailExistsInAuth should return exists for registered email', async () => {
    const result = await checkEmailExistsInAuth('ranabhanu514@gmail.com')
    expect(result.exists).toBe(true)
  })

  test('checkEmailExistsInAuth should return not exists for new email', async () => {
    const result = await checkEmailExistsInAuth(`test-${Date.now()}@example.com`)
    expect(result.exists).toBe(false)
  })

  test('requestOtp should fail for existing email', async () => {
    const result = await requestOtp('ranabhanu514@gmail.com')
    expect(result.success).toBe(false)
    expect(result.exists).toBe(true)
  })
})
```

### 7. Enforce Soft-Delete in RLS

**File to create:** `apps/db/migrations/017_enforce_soft_delete_rls.sql`
```sql
-- Add deleted_at to teacher_profiles
ALTER TABLE public.teacher_profiles
ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- Update RLS policies to exclude soft-deleted records
CREATE POLICY "Users can read own teacher_profiles (not deleted)"
ON public.teacher_profiles
FOR SELECT
USING (
  auth.uid() = user_id
  AND (deleted_at IS NULL OR deleted_at > now())
);

-- Similar for other tables with soft delete
ALTER POLICY "assessments_select_policy"
ON public.assessments
USING (deleted_at IS NULL);
```

---

## ✅ Verification Commands

After fixing, run these to verify:

```bash
# Phase 1 (3 hours)
cd apps/web
npm run lint          # Must show 0 errors
npm run build         # Must show 21 pages generated
npm run type-check    # Must show 0 errors

# Phase 2 (4-5 hours)
npm run test          # Must pass all tests

# Overall status
npm run lint && npm run build && npm run test
```

---

## Summary

- **Phase 1:** 3 hours → npm run lint passes (0 errors)
- **Phase 2:** 4-5 hours → npm run test passes 100%
- **Total:** 7-8 hours to full compliance

After Phase 1 complete: Code review can begin
After Phase 2 complete: Ready to merge
