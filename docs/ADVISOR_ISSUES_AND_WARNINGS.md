# Supabase Database Advisor — Issues & Warnings

> **Project:** ATAL AI 1.0 (`hnlsqznoviwnyrkskfay`)  
> **Source:** Supabase MCP `get_advisors` (security + performance)  
> **Date:** January 30, 2026

---

## Security advisor (type: security)

**Total:** 31 items — all **WARN** (no critical/error).

### 1. Anonymous access policies (30 × WARN)

**Lint:** `auth_allow_anonymous_sign_ins`  
**Description:** RLS policies allow access to anonymous users.  
**Detail:** [Database Advisors – Anonymous Access](https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins)

| # | Schema   | Table / entity        | Policies mentioned |
|---|----------|------------------------|-------------------|
| 1 | auth     | users                 | users_self_read, users_self_update |
| 2 | public   | ai_tutor_interactions | ai_tutor_interactions_authenticated_select |
| 3 | public   | announcement_reads    | announcement_reads_select |
| 4 | public   | assessment_responses  | assessment_responses_select |
| 5 | public   | assessment_sessions   | assessment_sessions_select, assessment_sessions_update |
| 6 | public   | badges               | badges_admin_delete, badges_admin_update, badges_consolidated_select |
| 7 | public   | class_announcements   | class_announcements_select, teachers_delete_announcements, teachers_update_announcements |
| 8 | public   | class_materials      | class_materials_select, teachers_delete_materials, teachers_update_materials |
| 9 | public   | classes              | classes_delete, classes_select, classes_update |
| 10| public   | curriculum_content   | curriculum_public_read |
| 11| public   | enrollments         | enrollments_delete, enrollments_select, enrollments_update |
| 12| public   | feature_flags       | feature_flags_admin_delete, feature_flags_admin_update, feature_flags_consolidated_select |
| 13| public   | formative_responses | formative_responses_authenticated_select |
| 14| public   | generated_lessons   | generated_lessons_authenticated_update, generated_lessons_select_policy |
| 15| public   | irt_item_bank      | irt_item_bank_admin_delete, irt_item_bank_admin_update, irt_item_bank_authenticated_select |
| 16| public   | learning_style_profile | learning_style_profile_authenticated_select, students_own_profile_update |
| 17| public   | modules             | modules_public_read, modules_service_role_delete, modules_service_role_update |
| 18| public   | points_history      | points_history_authenticated_select |
| 19| public   | practice_questions   | practice_questions_admin_delete, practice_questions_admin_update, practice_questions_authenticated_select |
| 20| public   | schools             | schools_read |
| 21| public   | student_badges      | student_badges_authenticated_select |
| 22| public   | student_knowledge_state | student_knowledge_state_authenticated_select, students_own_knowledge_update |
| 23| public   | student_profiles    | student_profile_self_update, student_profiles_authenticated_select |
| 24| public   | summative_results   | summative_results_authenticated_select |
| 25| public   | sync_log            | sync_log_student_read |
| 26| public   | teacher_profiles    | teacher_self_read, teacher_self_update |
| 27| public   | topics              | topics_public_read, topics_service_role_delete, topics_service_role_update |
| 28| public   | units               | units_select |
| 29| public   | usernames           | usernames_authenticated_select |
| 30| public   | users               | users_self_read, users_self_update |
| 31| storage  | objects             | Authenticated update for lesson-assets, Public read access for lesson-assets |

**Remediation (per finding):** Table has policies enforced on roles that allow access to anonymous users.  
**Note:** Many of these are intentional (e.g. public read for curriculum, authenticated select). Treat as informational unless you want to lock down anonymous entirely.

---

### 2. Leaked password protection disabled (1 × WARN)

**Lint:** `auth_leaked_password_protection`  
**Title:** Leaked Password Protection Disabled  
**Description:** Leaked password protection is currently disabled.  
**Detail:** Supabase Auth can check passwords against HaveIBeenPwned.org.  
**Remediation:** [Password strength and leaked password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)  
**Metadata:** type: auth, entity: Auth

---

## Performance advisor (type: performance)

**Total:** 55 items — all **INFO** (unused indexes).

### Unused index (55 × INFO)

**Lint:** `unused_index`  
**Description:** Index has not been used and may be a candidate for removal.  
**Detail:** [Database Linter – Unused Index](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)

| # | Table                    | Index name |
|---|--------------------------|------------|
| 1 | classes                  | idx_classes_class_code |
| 2 | teacher_profiles         | idx_teacher_profiles_school_id |
| 3 | teacher_profiles         | idx_teacher_profiles_school |
| 4 | assessment_responses     | idx_assessment_responses_session_id |
| 5 | assessment_responses     | idx_assessment_responses_module |
| 6 | assessment_responses     | idx_assessment_responses_item_id |
| 7 | assessment_responses     | idx_assessment_responses_session_module |
| 8 | assessment_sessions      | idx_assessment_sessions_user_time |
| 9 | student_profiles         | idx_student_profiles_school_id |
| 10| generated_lessons        | idx_generated_lessons_student |
| 11| schools                  | idx_schools_code |
| 12| schools                  | idx_schools_district |
| 13| enrollments              | idx_enrollments_enrolled_at |
| 14| irt_item_bank            | idx_irt_item_bank_category |
| 15| irt_item_bank            | idx_irt_item_bank_language |
| 16| irt_item_bank            | idx_irt_item_bank_difficulty |
| 17| irt_item_bank            | idx_irt_item_bank_level |
| 18| irt_item_bank            | idx_irt_item_bank_active |
| 19| irt_item_bank            | idx_irt_item_bank_category_difficulty |
| 20| irt_item_bank            | idx_irt_item_bank_discrimination |
| 21| irt_item_bank            | idx_irt_item_bank_adaptive_query |
| 22| irt_item_bank            | idx_irt_item_bank_created_by |
| 23| irt_item_bank            | idx_irt_item_bank_updated_by |
| 24| school_staff_credentials| idx_school_staff_credentials_rotated_at |
| 25| school_staff_credentials| idx_school_staff_credentials_deleted_at |
| 26| school_staff_credentials| idx_school_staff_credentials_active |
| 27| student_knowledge_state  | idx_knowledge_state_topic |
| 28| student_knowledge_state  | idx_knowledge_state_module |
| 29| student_knowledge_state  | idx_student_knowledge_state_student_module |
| 30| student_knowledge_state  | idx_student_knowledge_state_student_id |
| 31| student_knowledge_state  | idx_student_knowledge_state_student_topic |
| 32| ai_tutor_interactions   | idx_ai_interactions_session |
| 33| ai_tutor_interactions   | idx_ai_tutor_interactions_student_id |
| 34| formative_responses     | idx_formative_student |
| 35| student_badges          | idx_student_badges_student |
| 36| student_badges          | idx_student_badges_badge_id |
| 37| usernames               | idx_usernames_username |
| 38| usernames               | idx_usernames_user_id |
| 39| curriculum_content       | idx_curriculum_embedding_hnsw |
| 40| curriculum_content       | idx_curriculum_content_trgm |
| 41| feature_flags           | idx_feature_flags_enabled |
| 42| practice_questions      | idx_practice_questions_module |
| 43| class_announcements     | idx_announcements_priority |
| 44| class_announcements     | idx_announcements_teacher |
| 45| class_announcements     | idx_announcements_created |
| 46| announcement_reads      | idx_announcement_reads_announcement |
| 47| announcement_reads      | idx_announcement_reads_student |
| 48| announcement_reads      | idx_announcement_reads_read_at |
| 49| class_materials         | idx_materials_teacher |
| 50| class_materials         | idx_materials_type |
| 51| class_materials         | idx_materials_created |
| 52| class_materials         | idx_materials_visible |
| 53| units                   | idx_units_module_id |
| 54| sync_log                | idx_sync_log_student |
| 55| sync_log                | idx_sync_log_synced_at |

**Remediation:** Consider dropping indexes that are never used (saves write cost and storage). Verify workload and query patterns before dropping; some may be used after more traffic or new features.

---

## Summary

| Category   | Level | Count | Notes |
|------------|-------|-------|------|
| Security   | WARN  | 31    | 30× anonymous access policies, 1× leaked password protection off |
| Performance| INFO  | 55    | All unused index; optional cleanup |

No **critical** or **error**-level advisor issues. Security items are warnings (anonymous RLS, auth setting); performance items are informational (unused indexes).

---

## Analysis & Actions Taken (February 2026)

### Security: Anonymous Access (Intentional by Design)

Per migration `022_fix_anonymous_access_and_permissive_policies.sql`, anonymous sign-in is an **intentional feature** for students:
- Students can use the app without email authentication
- Anonymous users have `auth.uid()` but `is_anonymous = true` in JWT
- Write operations to sensitive tables check `is_anonymous = false`

**Verdict:** These warnings are expected and can be acknowledged as intentional.

### Security: Leaked Password Protection

**Action Required:** Enable in Supabase Dashboard:
1. Authentication → Providers → Email
2. Enable "Leaked Password Protection"

### Performance: Unused Indexes

**Migration 153 created** to drop 4 clearly redundant indexes:
- `idx_teacher_profiles_school` (duplicate)
- `idx_announcement_reads_read_at` (timestamp-only)
- `idx_materials_created` (timestamp-only)
- `idx_announcements_created` (timestamp-only)

**Preserved indexes** for:
- Vector search (`idx_curriculum_embedding_hnsw`)
- Text search (`idx_curriculum_content_trgm`)
- Offline sync (`idx_sync_log_*`)
- Adaptive testing (`idx_irt_item_bank_*`)
- Core features (`idx_student_knowledge_state_*`)

**Deferred for review** after 30+ days of production usage: 47 indexes
