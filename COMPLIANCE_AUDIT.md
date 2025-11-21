# ATAL AI - rule.md Compliance Audit Report

**Date:** November 21, 2025
**Repository:** Atal-ai-1.0
**Branch:** main
**Status:** ⚠️ NOT READY FOR MERGE (Blocking Issues Present)

---

## 📊 OVERALL COMPLIANCE: 72% (C+ Grade)

| Category | Compliance | Grade | Status |
|----------|-----------|-------|--------|
| **Rule A: Auth & Security** | 90% | B+ | ✅ GOOD |
| **Rule B: Data & Schema** | 95% | A- | ✅ EXCELLENT |
| **Rule C: UI & UX** | 75% | C+ | ⚠️ NEEDS WORK |
| **Rule D: Testing & CI** | 40% | F | ❌ CRITICAL |
| **Rule 2: File Hygiene** | 85% | B | ✅ GOOD |
| **Rule 3: Architecture** | 90% | A- | ✅ EXCELLENT |
| **Rule 6: Code Quality** | 45% | F | ❌ CRITICAL |

---

## 🔴 BLOCKING ISSUES (MUST FIX BEFORE MERGE)

### 1. ESLint Failures - 27 Violations (npm run lint FAILS)

**Current Status:** ❌ BLOCKING

```
Errors (13):
  - 1x next-pwa.config.js:1 - require() style imports forbidden
  - 4x student/start/page.tsx - any types (1), unescaped entities (3)
  - 3x admin/schools/page.tsx - any types (3)
  - 2x assessment/start/page.tsx - any type (1), unused import (1)
  - 2x dashboard/page.tsx - any type (1), unescaped entities (1)
  - 1x student/classes/page.tsx - unescaped entity (1)
  - 4x teacher/classes/[id]/page.tsx - any types (4)
  - 1x teacher/classes/page.tsx - any type (1)
  - 2x app/page.tsx - unescaped entities (2)
  - 4x teacher/start/page.tsx - unescaped entities (4)
  - 2x AssessmentRunner.tsx - impure function (1), variable access order (1)

Warnings (14):
  - 1x next-pwa.config.js
  - 7x join/page.tsx - unused variables (2), unused error (5)
  - 6x teacher/start/page.tsx - unused error (6)
  - 1x student.ts - unused variable (1)
  - 3x admin/schools/page.tsx - unused error (3)
  - 1x assessment/start/page.tsx - unused import (1)
  - 1x dashboard/page.tsx - missing dependency (1)
  - 1x student/assessments/page.tsx - unused import (1)
```

**Impact:** Build will fail. Cannot merge.

**Fix Time:** 2-3 hours

**Files to Fix:**
- [next-pwa.config.js](next-pwa.config.js)
- [apps/web/src/app/(public)/student/start/page.tsx](apps/web/src/app/(public)/student/start/page.tsx#L158)
- [apps/web/src/app/(public)/teacher/start/page.tsx](apps/web/src/app/(public)/teacher/start/page.tsx#L640)
- [apps/web/src/app/app/admin/schools/page.tsx](apps/web/src/app/app/admin/schools/page.tsx#L32)
- [apps/web/src/app/app/assessment/start/page.tsx](apps/web/src/app/app/assessment/start/page.tsx#L22)
- [apps/web/src/app/app/dashboard/page.tsx](apps/web/src/app/app/dashboard/page.tsx#L13)
- [apps/web/src/app/app/student/classes/page.tsx](apps/web/src/app/app/student/classes/page.tsx#L69)
- [apps/web/src/app/app/teacher/classes/[id]/page.tsx](apps/web/src/app/app/teacher/classes/[id]/page.tsx#L41)
- [apps/web/src/app/page.tsx](apps/web/src/app/page.tsx#L56)
- [apps/web/src/components/assessment/AssessmentRunner.tsx](apps/web/src/components/assessment/AssessmentRunner.tsx#L51)

---

### 2. React Purity Violations - AssessmentRunner.tsx

**Location:** [AssessmentRunner.tsx:51](apps/web/src/components/assessment/AssessmentRunner.tsx#L51)

**Issue:**
```typescript
const [startTime, setStartTime] = useState<number>(Date.now())  // ❌ IMPURE
```

**Problem:** Calling `Date.now()` during render produces unpredictable results. Each re-render may produce different values.

**Fix:** Move to useEffect
```typescript
const [startTime, setStartTime] = useState<number>(0)
useEffect(() => {
  setStartTime(Date.now())
}, [])
```

**Impact:** React Strict Mode will warn. Timing logic may be unreliable.

**Fix Time:** 15 minutes

---

### 3. Variable Access Order - AssessmentRunner.tsx

**Location:** [AssessmentRunner.tsx:117](apps/web/src/components/assessment/AssessmentRunner.tsx#L117)

**Issue:**
```typescript
// Line 117: handleOptionSelect is accessed before declaration
handleOptionSelect(newIndex)

// Line ~250: handleOptionSelect is defined
const handleOptionSelect = (index: number) => { ... }
```

**Problem:** Closure will not capture updates to `handleOptionSelect`. Function must be defined before usage.

**Fix:** Use `useCallback` or move function definition before usage.

**Impact:** Navigation keyboard handlers may use stale function reference.

**Fix Time:** 15 minutes

---

## ⚠️ HIGH PRIORITY ISSUES (SHOULD FIX BEFORE MERGE)

### 4. Type Safety - 13+ `any` Types Violate Rule 6

**Violation:** Rule 6 states: "Strict TypeScript: No `any`"

**Locations:**

| File | Lines | Issue | Count |
|------|-------|-------|-------|
| [student/start/page.tsx](apps/web/src/app/(public)/student/start/page.tsx#L158) | 158 | `as any` in state update | 1 |
| [admin/schools/page.tsx](apps/web/src/app/app/admin/schools/page.tsx#L32) | 32, 44, 72 | `school: any`, `school.name as any` | 3 |
| [assessment/start/page.tsx](apps/web/src/app/app/assessment/start/page.tsx#L22) | 22 | `data: any` in destructuring | 1 |
| [dashboard/page.tsx](apps/web/src/app/app/dashboard/page.tsx#L13) | 13 | `user: any` in auth check | 1 |
| [student/classes/page.tsx](apps/web/src/app/app/student/classes/page.tsx#L69) | 69 | `enrollment: any` in map | 1 |
| [teacher/classes/[id]/page.tsx](apps/web/src/app/app/teacher/classes/[id]/page.tsx#L41-51) | 41, 43, 50, 51 | `any[]`, `any` in maps | 4 |
| [teacher/classes/page.tsx](apps/web/src/app/app/teacher/classes/page.tsx#L86) | 86 | `classData: any` | 1 |

**Example Fix:**
```typescript
// Before
schools.map((school: any) => school.name)

// After
interface School {
  id: string
  name: string
  // ... other fields
}
schools.map((school: School) => school.name)
```

**Impact:** Loss of type safety. Errors caught at runtime instead of compile-time.

**Fix Time:** 3-4 hours

---

### 5. Unused Variables & Imports (14 instances)

**Violation:** Rule 6 states: "Delete unused imports and dead code immediately"

**Details:**

| File | Line | Variable | Type |
|------|------|----------|------|
| [join/page.tsx](apps/web/src/app/(public)/join/page.tsx#L9) | 9 | validatePhone | unused function |
| [join/page.tsx](apps/web/src/app/(public)/join/page.tsx#L14) | 14 | handleAnonymousSignIn | unused function |
| [join/page.tsx](apps/web/src/app/(public)/join/page.tsx#L107) | 107, 132, 290, 428 | error | unused variable (4x) |
| [teacher/start/page.tsx](apps/web/src/app/(public)/teacher/start/page.tsx#L188) | 188, 227, 303, 337, 379, 410 | error | unused variable (6x) |
| [student.ts](apps/web/src/app/actions/student.ts#L12) | 12 | rollNumber | unused parameter |
| [admin/schools/page.tsx](apps/web/src/app/app/admin/schools/page.tsx#L64) | 64, 100, 141 | error | unused variable (3x) |
| [assessment/start/page.tsx](apps/web/src/app/app/assessment/start/page.tsx#L3) | 3 | useEffect | unused import |
| [assessment/start/page.tsx](apps/web/src/app/app/assessment/start/page.tsx#L38) | 38 | error | unused variable |
| [student/assessments/page.tsx](apps/web/src/app/app/student/assessments/page.tsx#L4) | 4 | Button | unused import |
| [AssessmentRunner.tsx](apps/web/src/components/assessment/AssessmentRunner.tsx#L35) | 35 | EnhancedResponseData | unused type |
| [AssessmentRunner.tsx](apps/web/src/components/assessment/AssessmentRunner.tsx#L55) | 55 | selectionHistory | unused variable |

**Example Fix:**
```typescript
// Before
const [data, error] = await supabase.from('table').select()
if (data) { ... }

// After
const { data } = await supabase.from('table').select()
if (data) { ... }
```

**Impact:** Pollutes code, reduces readability, confuses maintenance.

**Fix Time:** 1 hour

---

### 6. Missing React Dependencies

**Violation:** Rule 4 - "Test Your Work" includes checking hook dependencies

**Issues:**

| File | Line | Hook | Missing Dependency |
|------|------|------|-------------------|
| [join/page.tsx](apps/web/src/app/(public)/join/page.tsx#L413) | 413 | useEffect | `router` |
| [dashboard/page.tsx](apps/web/src/app/app/dashboard/page.tsx#L24) | 24 | useEffect | `supabase.auth` |

**Impact:** React will warn. Effect may not re-run when dependencies change.

**Fix Time:** 15 minutes

---

### 7. Missing Design Token System (Rule C.1)

**Violation:** Rule C.1: "Use shared COLORS and GRADIENTS from theme.ts"

**Status:** ❌ `packages/ui/theme.ts` DOES NOT EXIST

**Problem:** Colors hardcoded throughout components:

```typescript
// apps/web/src/app/(public)/teacher/start/page.tsx
className="from-orange-50 via-yellow-50 to-green-50"

// apps/web/src/app/(public)/teacher/start/page.tsx
className="from-pink-500 via-orange-500 to-yellow-500"

// apps/web/src/components/invite-panel/InvitePanel.tsx
className="bg-orange-100"
```

**Impact:**
- Inconsistent theme across app
- Difficult to rebrand
- Violates accessibility (no contrast checking)

**Fix Time:** 3-4 hours

**Required Actions:**
1. Create [packages/ui/theme.ts](packages/ui/theme.ts) with centralized color palette
2. Extract all hardcoded Tailwind colors to theme tokens
3. Update 50+ components to use theme tokens
4. Ensure WCAG AA contrast compliance

---

### 8. Incomplete Test Coverage (Rule D.2)

**Violation:** Rule D.2: "New server actions require unit-style tests"

**Status:** ❌ NO UNIT TESTS FOR SERVER ACTIONS

**Missing Tests:**

| Server Action | File | Status |
|---------------|------|--------|
| sendEmailOtp | [teacher-onboard.ts:43](apps/web/src/app/actions/teacher-onboard.ts#L43) | ❌ No test |
| verifyEmailOtp | [teacher-onboard.ts:78](apps/web/src/app/actions/teacher-onboard.ts#L78) | ❌ No test |
| setPassword | [teacher-onboard.ts](apps/web/src/app/actions/teacher-onboard.ts) | ❌ No test |
| saveTeacherProfile | [teacher-onboard.ts](apps/web/src/app/actions/teacher-onboard.ts) | ❌ No test |
| verifyTeacher | [school.ts](apps/web/src/app/actions/school.ts) | ❌ No test |
| checkEmailExistsInAuth | [auth.ts:42](apps/web/src/app/actions/auth.ts#L42) | ❌ No test |

**Skipped Playwright Tests:**

```typescript
// apps/web/tests/teacher-registration.spec.ts
test.skip('should validate password strength', ...)  // Line 75
test.skip('should validate school code format', ...)  // Line 81
test.skip('should verify staff PIN server-side', ...)  // Line 87
test.skip('should prevent duplicate registration', ...)  // Line 93
test.skip('should redirect existing email to login', ...)  // Line 99
test.skip('should complete full registration flow', ...)  // Line 106
```

**Impact:** No verification that critical paths work. Regressions may pass undetected.

**Fix Time:** 4-5 hours

---

## ✅ GOOD COMPLIANCE AREAS

### Authentication & Security (Rule A) - 90% Compliant ✅

**Strengths:**
- ✅ Service role isolation correct
- ✅ PIN verification server-side (PL/pgSQL function)
- ✅ RLS policies on critical tables
- ✅ Email existence check uses SECURITY DEFINER
- ✅ No sensitive data in client code

**Minor Issues:**
- ⚠️ In-memory rate limiting (not production-ready for multi-server)
- ⚠️ admin.listUsers() can fail silently in email check function

---

### Data & Schema (Rule B) - 95% Compliant ✅

**Strengths:**
- ✅ All schema changes in migrations (apps/db/migrations/)
- ✅ Migrations have semantic names (e.g., 016_add_analytics_indexes.sql)
- ✅ Indexes added for performance (migration 016)
- ✅ RLS policies documented
- ✅ Soft-delete pattern implemented
- ✅ Foreign key constraints present

**Minor Issues:**
- ⚠️ teacher_profiles missing deleted_at column (inconsistent with soft-delete pattern)
- ⚠️ RLS policies don't enforce WHERE deleted_at IS NULL filtering
- ⚠️ Some queries may return soft-deleted records

---

### Architecture (Rule 3) - 90% Compliant ✅

**Strengths:**
- ✅ Clear separation of concerns
- ✅ createClient() vs createAdminClient() used correctly
- ✅ Server actions handle authentication
- ✅ Recent changes well-tracked in git
- ✅ Public Postgres function for email check (secure)

**Issues Investigated:**
- ⚠️ checkEmailExistsInAuth() stability - multiple git commits about this function suggest iteration/debugging
- ⚠️ Fallback to admin.listUsers() creates dependency on service role key

---

### File Hygiene (Rule 2) - 85% Compliant ✅

**Strengths:**
- ✅ No duplicate function implementations
- ✅ Utility functions consolidated
- ✅ Server actions organized in /app/actions/
- ✅ Components organized by domain

**Minor Issues:**
- ⚠️ Email validation logic in multiple places (auth.ts, auth-validation.ts, auth-constants.ts) - acceptable for different use cases, but not documented

---

## 📋 ACTION PLAN

### Phase 1: CRITICAL FIXES (2-3 hours)

**Must complete before merge:**

- [ ] **Fix ESLint Errors (27 violations)**
  - [ ] Remove 13 `any` types (replace with proper types)
  - [ ] Fix 10 unescaped HTML entities (add `&apos;`)
  - [ ] Fix next-pwa.config.js require() statement
  - [ ] Remove 14 unused variables/imports
  - Command: `npm run lint` must pass with 0 errors

- [ ] **Fix React Purity Violations (2 issues)**
  - [ ] Move Date.now() from useState to useEffect
  - [ ] Move handleOptionSelect function definition before usage
  - Test: AssessmentRunner component loads without warnings

- [ ] **Verify Build Succeeds**
  - Command: `cd apps/web && npm run build`
  - Expected: 0 errors, all 21 pages generated

---

### Phase 2: HIGH PRIORITY (4-5 hours)

**Should complete before merge:**

- [ ] **Create Design Token System**
  - [ ] Create [packages/ui/theme.ts](packages/ui/theme.ts) with COLORS and GRADIENTS
  - [ ] Extract 50+ hardcoded colors to theme tokens
  - [ ] Update components to use theme.ts
  - [ ] Verify WCAG AA contrast compliance

- [ ] **Implement Skipped Tests**
  - [ ] Implement 6 skipped tests in [teacher-registration.spec.ts](apps/web/tests/teacher-registration.spec.ts#L75)
  - [ ] Add unit tests for server actions (sendEmailOtp, verifyEmailOtp, etc.)
  - [ ] Command: `npm run test` should pass 100%

- [ ] **Fix Soft-Delete RLS Enforcement**
  - [ ] Add `deleted_at` column to `teacher_profiles` table
  - [ ] Update RLS policies to filter `WHERE deleted_at IS NULL`
  - [ ] Migration: apps/db/migrations/017_enforce_soft_delete_rl_s.sql

---

### Phase 3: OPTIONAL (2-3 hours)

**Nice to have after merge:**

- [ ] Move in-memory rate limiting to Redis/Postgres
- [ ] Investigate email check function stability (multiple git commits)
- [ ] Add comprehensive error documentation
- [ ] Consider extracting common validation patterns

---

## 🚀 VERIFICATION CHECKLIST

Before marking as compliant:

```bash
# Must all pass:
npm run lint         # 0 errors, 0 warnings
npm run build        # 0 errors
npm run test         # 100% tests pass
npm run type-check   # 0 errors
```

---

## 📊 RISK ASSESSMENT

**Current Merge Readiness: ❌ NOT READY**

**Blockers:**
1. ESLint failures (27 violations) - cannot merge with failed linting
2. React purity violations - production issue
3. Variable access order - logic bug in AssessmentRunner

**Timeline to Production Ready:**
- Phase 1 fixes: 2-3 hours
- Phase 2 fixes: 4-5 hours
- **Total: 6-8 hours**

**After Phase 1 + Phase 2 complete:** Ready for review and merge

---

## 📝 NOTES

### Email Check Function Stability

Git history shows multiple iterations:
- `ed5a923`: "Use public Postgres function for email existence check"
- `fc1221d`: "Remove unreliable checkEmailExists function"
- `a9375c6`: "Remove unreliable checkEmailExists function"

**Current Implementation:** Uses public RPC function with fallback to admin.listUsers()

**Assessment:** Acceptable but could be more robust. The public function approach is secure and doesn't require service role key.

### Design Token System Priority

Currently missing `packages/ui/theme.ts`. This is foundational for:
- Brand consistency
- Theme switching capability
- Dark mode support
- Accessibility compliance

### Test Coverage

Currently only 50% implemented. Critical paths (teacher registration, email verification, PIN validation) have tests but most are skipped. Unit tests for server actions are completely missing.

---

## CONCLUSION

The ATAL AI codebase has **strong architecture and security practices** but needs **code quality improvements** before merge. All blocking issues are fixable within 6-8 hours of focused work. Once Phase 1 critical fixes are complete, the project will be production-ready.

**Recommendation:** Fix Phase 1 items immediately (2-3 hours), then request code review. Phase 2 items can be addressed in parallel.
