# 🧠 SUPER-AGENT BEHAVIOR PROTOCOLS & RULES

# (Authorized MCPs: Context7, Supabase, Git, Filesystem, Memory, Sequential-Thinking, Playwright, Brave)

## 1. 🛑 NO PATCHWORK & ROOT CAUSE FIRST (CRITICAL)

* **Zero Patchwork Policy:** You are FORBIDDEN from suggesting "band-aid" fixes (e.g., wrapping code in `try/catch` or adding `if (data)` checks) without understanding *why* the error occurred.
* **Root Cause Protocol:**

  1. Identify the error.
  2. Use `sequential-thinking` to trace the data flow.
  3. Explain the *exact* reason for the failure.
* **Ask Before Guessing:** If you lack information (e.g., you don't know the shape of an API response or an environment variable value), you MUST STOP and ASK the user for that information. **DO NOT ASSUME or HALLUCINATE data.**

## 2. 📂 STRICT FILE HYGIENE & NO DUPLICATION

* **No Unnecessary Files:** Do not create new files (e.g., `UserHelper.ts`, `DateUtils.ts`) if a file with similar responsibilities already exists. This causes file sprawl and confusion.
* **Mandatory Filesystem Scan:** Before proposing a new file or function:

  1. Use the `filesystem` MCP to scan the project for existing utilities or components.
  2. If a similar logic exists, you MUST refactor or import it.
  3. **Goal:** Zero redundancy. Logic should exist in exactly one place.

## 3. 🏗️ ARCHITECTURAL INTEGRITY

* **Regression Check (Git):** Before fixing a bug, use the `git` MCP to check `git diff` or history. specific code changes often cause bugs; verify if recent changes broke the logic.
* **Schema Truth (Supabase):** Never write SQL or Supabase client code based on memory. You MUST use the `supabase` MCP to verify table columns and relationships before writing queries.
* **Memory Usage:** Check the `memory` tool for established patterns before coding. If we established a pattern (e.g., "Use React Query for fetching"), follow it.

## 4. 🧪 VERIFICATION & SELF-CORRECTION

* **Test Your Work:** After implementing logic, ask: "Shall I use Playwright to verify this works?" or "Should we run a quick validation script?"
* **Sequential Thinking:** Use the `sequential-thinking` tool to critique your own plan *before* writing code. Look for edge cases where your logic might fail.

## 5. 📚 DOCUMENTATION & KNOWLEDGE

* **External Docs:** If using a library (Supabase, Stripe, etc.), use `context7` to fetch the LATEST docs. Do not rely on internal training data which may be outdated.
* **Search:** Use `brave_search` for error codes or architectural patterns, not for basic syntax guessing.

## 6. 📝 CODING STANDARDS

* **Strict TypeScript:** No `any`.
* **Comments:** Explain the "Why" (business logic), not the "What" (syntax).
* **Clean Code:** Delete unused imports and dead code immediately. Do not leave commented-out code blocks.

---

# Additional Project-Specific Rules for ATAL AI

These extend the general super-agent rules above and tailor them to the ATAL AI project requirements and constraints.

## A. ✅ Authentication & Security

1. **Auth Truth Source:** Always check Supabase `auth.users` and `public.teacher_profiles` for user role/status before granting any UI-level capabilities.
2. **Role Elevation:** Role changes (student → teacher) must be executed only via server actions that use the `SUPABASE_SERVICE_ROLE_KEY` and must update `app_metadata.role` on the user record. Never allow the client to write `app_metadata`.
3. **Staff PINs:** Staff PIN verification MUST happen on the server and compare against `school_staff_credentials.pin_hash` using bcrypt. Client must never receive or be able to query PIN hashes.
4. **RLS First:** Before adding any server action that will read or modify sensitive tables, confirm RLS policies are present and tested. Use `supabase` MCP to list policies if uncertain.

## B. ✅ Data & Schema Practices

1. **Migrations Only:** All schema changes must be expressed as migrations and committed under `apps/db/migrations/` with clear semantic names (e.g., `007_add_teacher_profiles.sql`).
2. **No Ad-Hoc SQL:** Never modify production schema via the Supabase SQL editor without creating a matching migration file in the repo first.
3. **Indexes:** If you add a new query that scans tables, add an index migration in the same PR.
4. **DATABASE.md Sync:** After any database change, update `DATABASE.md` in the root directory to reflect new tables, columns, RLS policies, or functions.

## B2. ✅ DATABASE COMPLIANCE CHECK (CRITICAL)

> **Reference:** Always consult `DATABASE.md` in the root directory for current schema, RLS policies, and functions.

### Before Writing ANY Database-Related Code:

1. **Table & Column Verification:**
   - [ ] Verify table exists in `DATABASE.md`
   - [ ] Verify ALL column names match exactly (case-sensitive)
   - [ ] Verify column types match (uuid, text, timestamptz, etc.)
   - [ ] Verify nullable constraints (required vs optional fields)
   - [ ] Verify foreign key relationships

2. **RLS Policy Compliance:**
   - [ ] Check which RLS policies apply to your operation (SELECT/INSERT/UPDATE/DELETE)
   - [ ] Verify your code respects the policy conditions
   - [ ] For SELECT: User can only see data they're authorized to see
   - [ ] For INSERT: User can only insert data with their own user_id
   - [ ] For UPDATE/DELETE: User can only modify their own data or data they manage

3. **User Type Restrictions:**
   | User Type | Can Access |
   |-----------|------------|
   | Anonymous Student | Own profile, enrolled classes, own assessments |
   | Email Student | Own profile, enrolled classes, own assessments |
   | Teacher (with profile) | Own profile, own classes, enrolled students' data |
   | Service Role | school_staff_credentials (server-side only) |

4. **Function Usage:**
   - [ ] Use `verify_staff_pin()` for PIN verification (service_role only)
   - [ ] Use `rotate_staff_pin()` for PIN rotation (service_role only)
   - [ ] Use `check_email_exists()` for email validation
   - [ ] Never call SECURITY DEFINER functions from client

### Database Tables Quick Reference:

| Table | Primary Key | Key Foreign Keys | RLS |
|-------|-------------|------------------|-----|
| `users` | `id` | - | ✅ |
| `student_profiles` | `user_id` | → auth.users, → schools | ✅ |
| `teacher_profiles` | `user_id` | → auth.users, → schools | ✅ |
| `schools` | `id` | - | ✅ |
| `school_staff_credentials` | `id` | → schools | ✅ (service_role only) |
| `classes` | `id` | → users (teacher_id) | ✅ |
| `enrollments` | `id` | → classes, → users | ✅ |
| `assessment_sessions` | `id` | → users, → classes | ✅ |
| `assessment_responses` | `id` | → assessment_sessions | ✅ |

### Common RLS Violations to Avoid:

```typescript
// ❌ WRONG: Trying to read other users' data
const { data } = await supabase
  .from('student_profiles')
  .select('*')  // Will fail - can only see own profile or enrolled students

// ✅ CORRECT: Reading own profile
const { data } = await supabase
  .from('student_profiles')
  .select('*')
  .eq('user_id', userId)  // Must match auth.uid()

// ❌ WRONG: Client trying to access staff credentials
const { data } = await supabase
  .from('school_staff_credentials')
  .select('*')  // Will return 0 rows - service_role only

// ✅ CORRECT: Use server action with service role
const adminClient = createAdminClient()
const { data } = await adminClient
  .from('school_staff_credentials')
  .select('*')

// ❌ WRONG: Anonymous user trying to create a class
const { data } = await supabase
  .from('classes')
  .insert({ name: 'My Class', teacher_id: userId })
  // Will fail - requires teacher_profiles existence

// ✅ CORRECT: Only teachers with profiles can create classes
// First ensure user has teacher_profile, then create class
```

### Profile Field Requirements:

**student_profiles (Required for all students):**
- `user_id` (required) - From auth.uid()
- `name` (required) - Student's full name
- `gender` (required) - 'male' or 'female'
- `phone` (optional) - For records only
- `roll_number` (optional)
- `school_id` OR `school_name` (optional)
- `class_name` (optional) - e.g., "Class 5"
- `village` (optional)

**teacher_profiles (Required for teachers):**
- `user_id` (required) - From auth.uid()
- `name` (required)
- `school_id` (required) - Must reference valid school
- `school_code` (required)
- `phone` (optional)
- `subject` (optional)
- `gender` (optional) - 'male' or 'female'
- `village` (optional)

## C. ✅ UI & UX Consistency

1. **Design Tokens:** Use the shared `COLORS` and `GRADIENTS` object stored in `packages/ui/theme.ts` (if present). If not present, add to `packages/ui` and reuse across components.
2. **Accessibility:** All new components must support keyboard navigation, `aria-*` attributes, and `prefers-reduced-motion`.
3. **Animations:** Use Framer Motion for page and key interactions. Respect reduced-motion users.

## D. ✅ Testing & CI

1. **Playwright First:** For any critical user path (login, create class, join class, take assessment), add at least one Playwright E2E test.
2. **Unit Coverage:** New server actions require unit-style tests (integration via test database), even if brief.
3. **Pre-merge Checks:** PRs must pass `npm run lint`, `npm run test`, and `npm run build` before merge.

## E. ✅ Cursor Agent Behavior

1. **Agent Role Mapping:** When issuing tasks to specific agents (Claude Code, Cursor DB, Codex), include:

   * Goal: one-sentence outcome
   * Input: exact file paths or DB names
   * Expected output: file created / migration applied / PR opened
   * Validation: Playwright test name or SQL query to verify
2. **Idempotency:** Agents must write idempotent code. If a function writes DB seed data, it must be safe to re-run.

---

# Operational Procedures

## 1. Branch & PR Workflow

* Branch naming: `feature/<short-desc>` or `fix/<short-desc>`.
* PR title: `Type: Short description` (e.g., `Add: Teacher registration flow`).
* PR body must include: what changed, why, how to test locally (commands), and risk assessment.
* Always request at least one reviewer before merging.

## 2. Database Migration Process

1. Create SQL migration in `apps/db/migrations/` with timestamp prefix.
2. Run `supabase db diff` locally and `supabase db push` to staging.
3. Add migration to PR and include `psql` snippet for rollback.
4. After merge, run migration in production during a maintenance window.

## 3. Secrets & Env

* `.env.example` in repo must list required env vars without values.
* Never store `SUPABASE_SERVICE_ROLE_KEY` in `.env` committed to Git. Use Vercel/Netlify env UI.
* If a secret is rotated, update the `.env.example` comment and notify the team via Slack.

## 4. Incident Response

* If production RLS or auth breaks, follow these steps:

  1. Immediately open a PR with the rollback migration.
  2. Notify stakeholders (Slack/Email) with incident tag.
  3. Run Playwright smoke tests after rollback.

---

# Sequential Thinking Checklist (Pre-change)

**REQUIRED BEFORE EVERY COMMIT** - Expected time: 10-15 minutes

## Phase 1: Understand the Problem (Root Cause)

Before writing ANY code:

1. **Root Cause Analysis** - Use this template for EVERY change:
   ```
   ERROR: [What went wrong?]
   SYMPTOM: [What does user observe?]
   DATA FLOW TRACE:
     1. User action: [What did they do?]
     2. Code path: [src/file.ts → Function → Line #]
     3. External dependency: [API call/DB query/etc]
     4. Response: [What was returned?]
     5. Where it failed: [Exact location]
   ROOT CAUSE: [Why it actually happened - NOT just what]
   FIX: [Solution addressing root cause, not symptom]
   TEST: [How to verify fix works]
   ```

2. **Problem Verification**
   - [ ] Reproduced the issue locally
   - [ ] Traced the data flow end-to-end
   - [ ] Identified exact line of code causing issue
   - [ ] Confirmed this is ROOT CAUSE, not a symptom
   - [ ] Checked if similar issues exist elsewhere

## Phase 2: Code Review Before Writing

3. **Similarity Check**
   ```bash
   grep -r "similar_pattern" src/ --include="*.ts" --include="*.tsx"
   ```
   - [ ] Searched for existing logic
   - [ ] Found existing patterns to follow
   - [ ] Confirmed can't reuse existing code
   - [ ] Documented why reuse wouldn't work

4. **Architecture Check**
   - [ ] Does this fit existing architecture?
   - [ ] Are there existing utilities I should use?
   - [ ] Does this require changes to multiple files?
   - [ ] Am I following established patterns?

5. **For Auth/RLS Changes - SPECIAL REQUIREMENTS**
   - [ ] `git log --oneline -- src/lib/auth* src/app/actions/auth* | head -10`
   - [ ] Check Supabase dashboard for current RLS policies
   - [ ] Review auth-constants.ts for all constants
   - [ ] Draft Playwright test BEFORE writing code
   - [ ] Verify backward compatibility
   - [ ] Test with Supabase (not mocks)

6. **For Database Changes - MIGRATIONS REQUIRED**
   - [ ] Created migration file (NOT ad-hoc SQL)
   - [ ] Migration includes UP and DOWN (rollback)
   - [ ] Tested migration rollback locally: `supabase db reset`
   - [ ] No data loss from migration
   - [ ] Indexed new filter columns
   - [ ] RLS policies exist on new tables
   - [ ] Updated `DATABASE.md` with new schema/policies

7. **DATABASE COMPLIANCE CHECK (For ALL DB-related code)**
   - [ ] Read `DATABASE.md` before writing any query
   - [ ] Verified table name exists exactly as documented
   - [ ] Verified ALL column names match (no typos)
   - [ ] Verified column types match expected values
   - [ ] Checked RLS policies for the operation type (SELECT/INSERT/UPDATE/DELETE)
   - [ ] Confirmed user type can perform this operation
   - [ ] For teachers: Verified teacher_profiles existence check
   - [ ] For students: Verified enrollment or self-ownership check
   - [ ] For service operations: Using createAdminClient()
   - [ ] No hardcoded IDs or UUIDs
   - [ ] Foreign key references are valid

## Phase 3: Validation & Error Handling

8. **Input Validation**
   - [ ] All user inputs validated
   - [ ] Email: format + domain + typo detection + disposable check
   - [ ] Password: length + character variety + no patterns
   - [ ] Phone: format + country code validation
   - [ ] Used validation functions (not inline checks)

9. **Error Handling**
   - [ ] No bare try/catch blocks
   - [ ] All errors logged with context
   - [ ] User-facing errors are friendly
   - [ ] Error messages are actionable (tell user what to do)

## Phase 4: Testing Requirements

10. **Unit Tests**
   ```bash
   npm run test
   ```
   - [ ] Tests for happy path
   - [ ] Tests for edge cases (null, undefined, empty, 0, false)
   - [ ] Tests for errors and boundary values
   - [ ] Min coverage: normal + error + edge case

11. **Integration/E2E Tests**
    - [ ] For critical flows (signup, login, join class): Playwright test
    - [ ] Test full user journey
    - [ ] Test error scenarios
    - [ ] Test mobile viewport

12. **Manual Testing**
    - [ ] Tested in browser (Chrome, Firefox, Safari)
    - [ ] Tested on mobile (iOS + Android)
    - [ ] Tested with real Supabase (not mocks)

## Phase 5: Security Checklist

13. **Authentication & Authorization**
    - [ ] No passwords logged/exposed
    - [ ] No sensitive data in URL
    - [ ] Session tokens refreshed properly
    - [ ] RLS policies match auth flow
    - [ ] Users can't access others' data

14. **Secrets & Env**
    - [ ] No secrets in code
    - [ ] No secrets in git history
    - [ ] `.env` file in `.gitignore`
    - [ ] Service role key only in Vercel (not .env)

## Phase 6: Code Quality

15. **Linting & Types**
    ```bash
    npm run lint          # 0 errors
    npm run type-check    # 0 errors
    npm run test          # All pass
    npm run build         # 0 errors
    ```
    - [ ] No ESLint errors
    - [ ] No implicit `any` types
    - [ ] No unused imports
    - [ ] No console.log in production

16. **Code Style**
    - [ ] Follows existing patterns
    - [ ] Clear variable names
    - [ ] Comments explain WHY not WHAT
    - [ ] Functions < 50 lines
    - [ ] Files < 500 lines

## Phase 7: Git & Deployment

17. **Pre-push Verification**
    ```bash
    git status
    git diff --cached
    npm run lint && npm run test && npm run build
    ```
    - [ ] Only intended files staged
    - [ ] No debug code committed
    - [ ] No .env files committed
    - [ ] Commit message clear and descriptive

18. **Commit Message Format**
    ```
    [type]: [description]

    [detailed explanation]

    Fixes: #[issue-number]
    Testing: [how to test]
    ```
    Types: feat, fix, refactor, test, docs, chore, perf

19. **Core MCPs Required Before Commit**
    - [ ] `git log --oneline` — find related commits
    - [ ] `filesystem` search for existing utilities to reuse
    - [ ] `supabase` MCP: verify schema and RLS policies
    - [ ] `memory` MCP: check established patterns
    - [ ] Draft Playwright smoke test for critical paths
    - [ ] **DATABASE.md compliance check** — verify code matches documented schema

20. **DATABASE.md Sync Check**
    - [ ] If schema changed: Updated `DATABASE.md` tables section
    - [ ] If RLS changed: Updated `DATABASE.md` policies section
    - [ ] If functions changed: Updated `DATABASE.md` functions section
    - [ ] If migration added: Updated `DATABASE.md` migration history

# Example Agent Prompt Template (for Cursor)

```
Agent: Claude Code
Goal: Implement server action `verifyTeacher()`
Input:
 - File: apps/web/src/app/actions/teacher-onboard.ts
 - DB tables: public.schools, public.school_staff_credentials
 - Supabase Admin client: use createAdminClient()
Expected Output:
 - server action that verifies school code, verifies bcrypt PIN, creates teacher_profile, sets app_metadata.role='teacher'
 - returns structured result { success: boolean, error?: string }
Validation:
 - Playwright test `teacher-registration.spec.ts` should pass
```

---

# Naming & Style Conventions

* TypeScript files: `kebab-case` under `src/` for components and `snake_case` for server SQL files.
* Server actions: `apps/web/src/app/actions/*.ts`.
* UI components: `apps/web/src/components/*`.
* Exports: default export only for React components, named exports for utilities.
* No `console.log` in production; use structured logging via `logger.debug/info/error`.

---

# Approval & Governance

* Major architectural changes need 2 approvals (1 dev lead + 1 security lead).
* Changes to authentication/RLS require an explicit security review and a staging deploy with smoke tests.

---

# Extension Hooks (for future automation)

1. **Auto-checker:** Add a CI job that runs `supabase` MCP queries to ensure critical RLS policies exist.
2. **Agent Linter:** Build a quick script that validates agent prompts for the required fields (Goal/Input/Expected/Validation) before running.
3. **Migration Linter:** CI job that checks for `-- TODO` or commented-out SQL in migration files.
4. **DATABASE.md Validator:** CI job that compares `DATABASE.md` against actual Supabase schema and fails if out of sync.
5. **RLS Policy Checker:** Pre-commit hook that verifies new queries comply with documented RLS policies in `DATABASE.md`.

---
