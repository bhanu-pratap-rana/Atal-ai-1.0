# Code Analysis Report — Database Alignment & CRUD Verification

> **Date:** January 30, 2026  
> **Scope:** Full codebase analysis using MCP (Supabase, filesystem); SonarQube excluded.  
> **Goals:** Verify alignment with `docs/DATABASE.md`, identify gaps/break points, and confirm CRUD correctness.

---

## Executive Summary

- **Database state:** Verified via Supabase MCP (`list_projects`, `list_tables`, `execute_sql`). All 30 public tables, RLS, row counts, migrations, and extensions match `DATABASE.md`.
- **Critical fixes applied:** Four code–schema mismatches were found and fixed (wrong table/columns). One RPC fallback was documented.
- **Auth/RLS:** Server actions and API routes use `createClient()` (user-scoped) or `createAdminClient()` only where required; `getCurrentUser()` is used consistently before mutations. Aligned with RLS design.
- **Missing RPCs fixed:** Two RPCs called by code but not in DB were added: `get_student_total_points` (migration 151), `match_curriculum_content_simple` (migration 152). Both had proper fallbacks; RPCs now used when available.
- **Remaining recommendations:** Review `.single()` vs `.maybeSingle()` where zero-row results are possible; no other blocking issues found.

---

## 1. Verification Method

| Tool / Source | Use |
|---------------|-----|
| **Supabase MCP** | `list_projects`, `list_tables`, `execute_sql` for live schema, RLS, row counts, extensions, functions. |
| **Codebase** | Grep and semantic search for `.from()`, `.rpc()`, `.select()`, table/column names, auth patterns. |
| **DATABASE.md** | Source of truth for tables, columns, RLS, and functions. |
| **docs/DATABASE.md** | Updated with verification summary and live stats (Jan 30, 2026). |

---

## 2. Database Alignment with DATABASE.md

### 2.1 Tables and Columns

- **Public tables:** All 30 tables in code match `DATABASE.md` (e.g. `student_profiles`, `teacher_profiles`, `classes`, `enrollments`, `curriculum_content`, `points_history`, `sync_log`, `units`, `class_announcements`, `announcement_reads`, `class_materials`, etc.).
- **Row counts:** Confirmed via MCP (e.g. `curriculum_content`: 2,654; `ai_tutor_interactions`: 134; others as in Quick Stats).
- **Migrations:** 152 in repo (151_add_get_student_total_points, 152_add_match_curriculum_content_simple); deploy to reach 152. Latest before that: 150_fix_rls_policies_robust.
- **RLS:** 95 policies (92 public + 3 storage); all 30 public tables have RLS enabled.
- **Functions:** 56 public functions after migrations 151–152 (get_student_total_points, match_curriculum_content_simple). RAG and curriculum RPCs verified.

### 2.2 CRUD and Table Usage

| Area | Tables / RPCs | Status |
|------|----------------|--------|
| Student profile | `student_profiles` | ✅ Fixed: was using non-existent `user_profiles` in gamification-service; selects corrected to `student_profiles` columns (`user_id`, `name`, `class_name`, `village`, etc.). |
| Teacher profile | `teacher_profiles` | ✅ Fixed: analytics questions page was `select("id")`; PK is `user_id` — updated to `select("user_id")`. |
| Settings / profile UI | `student_profiles` | ✅ Fixed: settings page and student actions now select only existing columns per `DATABASE.md` (e.g. `class_name`, `village`; removed `date_of_birth`, `location`, `medium`, `board`, `class`). |
| Gamification | `points_history`, `student_badges`, `badges` | ✅ Uses correct tables; leaderboard now reads from `student_profiles` with correct columns. |
| Curriculum / RAG | `curriculum_content`, RPCs | ✅ RAG uses `match_curriculum_content_simple` (migration 152) with text fallback; other RAG RPCs (match_curriculum, etc.) for vector search. |
| Admin / school | `school_staff_credentials`, `schools` | ✅ Admin actions use `createAdminClient()` for service_role-only access as intended. |
| Lessons / units | `units`, `generated_lessons`, `sync_log` | ✅ Referenced in code and in `DATABASE.md`. |
| Communication | `class_announcements`, `announcement_reads`, `class_materials` | ✅ Present in schema and code. |

---

## 3. Critical Issues Found and Fixed

### 3.1 Gamification service — wrong table and columns

- **File:** `apps/web/src/lib/services/gamification-service.ts`
- **Issue:** Queried non-existent table `user_profiles` with columns `id`, `display_name`. `DATABASE.md` only has `student_profiles` (PK `user_id`, column `name`).
- **Fix:** Switched to `student_profiles`, selecting `user_id` and `name`, and using `user_id` in `.in()` for leaderboard and related logic.

### 3.2 Teacher analytics — wrong primary key

- **File:** `apps/web/src/app/app/teacher/analytics/questions/page.tsx`
- **Issue:** `teacher_profiles.select("id")` — `teacher_profiles` has no `id`; PK is `user_id`.
- **Fix:** Changed to `.select("user_id")`.

### 3.3 Student profile columns in actions and settings

- **Files:** `apps/web/src/app/actions/student.ts`, `apps/web/src/app/app/settings/page.tsx`
- **Issue:** Selecting non-existent columns: `date_of_birth`, `location`, `medium`, `board`, `class` from `student_profiles`. Actual columns include `class_name`, `village`, etc. (see `DATABASE.md` / `database.ts`).
- **Fix:** Updated selects to use only existing columns (`class_name`, `village`, etc.) and removed references to non-existent fields.

### 3.4 RPCs called but not in DB (fixed)

- **match_curriculum_content_simple** — **File:** `apps/web/src/lib/rag/content-retrieval.ts`. Code called this RPC; it was missing. Try/catch fell back to text search. **Fix:** Migration `152_add_match_curriculum_content_simple.sql` adds the RPC (text-based curriculum search). Comment in code updated.
- **get_student_total_points** — **File:** `apps/web/src/lib/services/gamification-service.ts`. Code called this RPC; it was missing. On error, code fell back to select + reduce in JS. **Fix:** Migration `151_add_get_student_total_points.sql` adds the RPC (SUM in DB). Fallback in code retained for robustness.

---

## 4. Auth and RLS Usage

- **Server client:** `createClient()` from `@/lib/supabase-server` uses cookie-based session and anon key; RLS applies with `auth.uid()`.
- **Admin client:** `createAdminClient()` (service_role) used only where required: `school_staff_credentials`, admin user management, PIN rotation, usernames, teacher verification. Comments in code explain service_role use.
- **Auth checks:** Server actions and API routes use `getCurrentUser()` or `verifyRoleAuth` / `verifyProfileAuth` before mutations; rate limiting and ownership checks are applied where relevant.
- **Conclusion:** Auth and RLS usage are aligned with `DATABASE.md` and the security model; no privilege escalation risks identified from this review.

---

## 5. Server Action Patterns

- **"use server":** Used in 26 action files under `apps/web/src/app/actions/` (student, teacher, admin, auth, school, gamification, assessment, etc.).
- **Pattern:** Actions obtain `createClient()` or `createAdminClient()`, then typically call `getCurrentUser()` or an auth helper, then perform Supabase queries. Consistent with Next.js server actions and RLS.

---

## 6. Recommendations (Non-blocking)

1. **`.single()` vs `.maybeSingle()`:** Several `.select().single()` calls may receive zero rows (e.g. profile lookups). Consider `.maybeSingle()` where “no row” is valid to avoid PGRST116 at runtime. `insert().select().single()` for “insert and return one” is fine.
2. **Types:** Keep `database.ts` in sync with `DATABASE.md` and regenerate with `npx supabase gen types typescript --linked` after schema changes.
3. **RAG:** `match_curriculum_content_simple` added in migration 152; code uses RPC with text fallback. Vector search continues to use match_curriculum / match_curriculum_cosine / match_curriculum_hybrid where embeddings are available.

---

## 7. Summary Table

| Check | Result |
|-------|--------|
| All tables in code exist in DB | ✅ (after fixing `user_profiles` → `student_profiles`) |
| All columns used match schema | ✅ (after fixing profile and teacher selects) |
| CRUD uses correct tables/columns | ✅ |
| RPCs used exist (or fallback documented) | ✅ (2 RPCs added in migrations 151–152) |
| Auth/RLS and admin client usage | ✅ |
| DATABASE.md vs live DB | ✅ Verified and doc updated |
| Critical break points | ✅ Addressed (4 fixes + 2 RPC migrations) |
| Module ID validation | ✅ UUID→regex in API (progress/sync, modules/[moduleId]/units) |
| No `as any` in critical paths | ✅ Verified (only comment in connection-pool-monitor) |

This report can be updated after future schema or auth changes by re-running Supabase MCP checks and the same code alignment steps.
