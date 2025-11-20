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

Before making any change that touches auth, DB, or RLS:

1. `git log --oneline` — find the commit that last changed related files.
2. `filesystem` search for existing helpers/components to reuse.
3. `supabase` MCP: list table schema and RLS policies relevant to the change.
4. `memory` MCP: check if a previous pattern exists and follow it.
5. Draft a Playwright smoke test that will validate post-change.
6. Run `npm run lint` and `npm run test` locally.

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

---

# Final Note

This rulebook is authoritative for all Cursor agents working on the ATAL AI project. Agents that do not follow these rules will be paused and reviewed. Any proposed deviation must be discussed in a PR and accepted by the project leads.
