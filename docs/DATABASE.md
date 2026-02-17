# ATAL AI Database Documentation

> **Last Updated:** February 16, 2026 (via Supabase MCP - live verification)
> **Status:** PRODUCTION READY - 30 public tables + 2 storage buckets, RLS 100% enabled
> **Database:** Supabase PostgreSQL 17.6.1.038 (Project: hnlsqznoviwnyrkskfay, Region: ap-southeast-1)
> **Project Status:** ACTIVE_HEALTHY
> **Database Host:** db.hnlsqznoviwnyrkskfay.supabase.co
> **Created:** November 7, 2025
> **Curriculum:** 750 rows (50 topics × 5 content types × 3 languages: en/hi/as)

---

## Quick Stats (Live from Supabase MCP - February 15, 2026)

| Metric | Value | Status |
|--------|-------|--------|
| **Tables** | 30 public + 2 storage buckets | All RLS enabled |
| **Total Rows** | 2,491 | curriculum_content: 750, practice_questions: 450, schools: 393, etc. |
| **Migrations** | 7 applied (via Supabase) | Latest: remove_dead_rls_write_policies_modules_topics |
| **RLS Policies** | 84 public + 3 storage = 87 total | All tables protected (6 dead policies removed Feb 15) |
| **Functions** | 62 | 11 trigger + 51 RPC |
| **Extensions** | 8 active | pgcrypto 1.3, vector 0.8.0, pg_trgm 1.6, uuid-ossp 1.1, pg_stat_statements 1.11, pg_graphql 1.5.11, supabase_vault 0.3.1, plpgsql 1.0 |

### Live Row Counts (February 15, 2026)

| Table | Rows | Table | Rows |
|-------|------|-------|------|
| curriculum_content | 750 | student_badges | 6 |
| practice_questions | 450 | school_staff_credentials | 5 |
| schools | 393 | feature_flags | 5 |
| irt_item_bank | 300 | generated_lessons | 6 |
| ai_tutor_interactions | 156 | modules | 5 |
| assessment_sessions | 108 | class_materials | 5 |
| enrollments | 85 | class_announcements | 4 |
| topics | 50 | announcement_reads | 3 |
| classes | 44 | student_profiles | 2 |
| assessment_responses | 26 | learning_style_profile | 1 |
| points_history | 35 | teacher_profiles | 2 |
| units | 15 | usernames | 1 |
| badges | 10 | sync_log | 0 |
| formative_responses | 9 | summative_results | 0 |
| student_knowledge_state | 7 | users | 8 |

---

### Security Design Notes

- **Admin operations:** The `users` table CHECK constraint only allows `role IN ('student', 'teacher')`. All admin operations use `service_role` (which bypasses RLS entirely). RLS policies on `badges`, `practice_questions`, and `feature_flags` that check `u.role = 'admin'` exist as defense-in-depth but are effectively unreachable. If admin users are needed in the future, add `'admin'` to the users role CHECK constraint.
- **User deletion:** There are no user-level DELETE policies on `student_profiles`, `teacher_profiles`, or `users`. This is intentional — user/account deletion is admin-only via `service_role`. If self-service account deletion is needed (e.g. GDPR), add self-delete RLS policies.
- **Curriculum write access:** Write operations on `modules` and `topics` are `service_role` only (no RLS write policies for authenticated users). Content is managed via migrations and admin tools.

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AUTHENTICATION                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐      ┌──────────────────┐      ┌───────────────────┐          │
│  │  users  │──────│ student_profiles │      │ teacher_profiles  │          │
│  │  (auth) │      │                  │      │                   │          │
│  └────┬────┘      └────────┬─────────┘      └─────────┬─────────┘          │
│       │                    │                          │                     │
│       │           ┌────────┴────────────────┬─────────┴───────┐            │
│       │           │                         │                 │            │
│  ┌────┴────┐  ┌───┴───┐              ┌──────┴──────┐   ┌──────┴──────┐    │
│  │usernames│  │schools│──────────────│school_staff │   │   classes   │    │
│  └─────────┘  └───────┘              │ credentials │   └──────┬──────┘    │
│                                      └─────────────┘          │            │
│                                                        ┌──────┴──────┐    │
│                                                        │ enrollments │    │
│                                                        └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              CURRICULUM                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌───────────────────┐  │
│  │ modules │──────│  units  │──────│ topics  │──────│ curriculum_content│  │
│  │  (M1-5) │      │ (U1-19) │      │(T1.1-   │      │  (750 rows, RAG)  │  │
│  └─────────┘      └─────────┘      │ T19.2)  │      └───────────────────┘  │
│                                    └────┬────┘                              │
│                                         │                                   │
│                   ┌─────────────────────┼─────────────────────┐            │
│                   │                     │                     │            │
│           ┌───────┴───────┐    ┌────────┴────────┐   ┌────────┴────────┐  │
│           │   practice    │    │    generated    │   │   irt_item_bank │  │
│           │   questions   │    │     lessons     │   │   (assessments) │  │
│           └───────────────┘    └─────────────────┘   └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         LEARNING & PROGRESS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────┐    ┌────────────────────┐                       │
│  │ student_knowledge_    │    │ learning_style_    │                       │
│  │       state           │    │     profile        │                       │
│  │ (per-topic mastery)   │    │ (VARK preferences) │                       │
│  └───────────────────────┘    └────────────────────┘                       │
│                                                                             │
│  ┌───────────────────────┐    ┌────────────────────┐                       │
│  │  assessment_sessions  │────│ assessment_        │                       │
│  │                       │    │    responses       │                       │
│  └───────────────────────┘    └────────────────────┘                       │
│                                                                             │
│  ┌───────────────────────┐    ┌────────────────────┐                       │
│  │  formative_responses  │    │ summative_results  │                       │
│  │ (practice questions)  │    │ (module scores)    │                       │
│  └───────────────────────┘    └────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           GAMIFICATION                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐      ┌────────────────┐      ┌───────────────┐                │
│  │ badges  │──────│ student_badges │      │ points_history│                │
│  │  (10)   │      │   (earned)     │      │  (ledger)     │                │
│  └─────────┘      └────────────────┘      └───────────────┘                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI & COMMUNICATION                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐    ┌───────────────────┐    ┌──────────────────┐  │
│  │ ai_tutor_           │    │ class_            │    │ announcement_    │  │
│  │   interactions      │    │   announcements   │────│    reads         │  │
│  │ (chat history)      │    └───────────────────┘    └──────────────────┘  │
│  └─────────────────────┘                                                    │
│                              ┌───────────────────┐                          │
│                              │  class_materials  │                          │
│                              │ (shared resources)│                          │
│                              └───────────────────┘                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              SYSTEM                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐      ┌──────────┐                                          │
│  │feature_flags│      │ sync_log │                                          │
│  │ (rollouts)  │      │ (offline)│                                          │
│  └─────────────┘      └──────────┘                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tables

### 1. User & Authentication (6 tables)

#### users
Core user accounts linked to Supabase Auth.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| email | text | NO | - | User email |
| role | text | NO | - | 'student', 'teacher' (CHECK constraint) |
| created_at | timestamp | YES | now() | Creation timestamp |

**Code Usage:** Auth system, role verification

---

#### student_profiles
Student details and demographics.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| user_id | uuid | NO | - | FK to users.id |
| name | text | NO | - | Full name |
| phone | text | YES | - | Contact number |
| roll_number | text | YES | - | School roll number |
| school_id | uuid | YES | - | FK to schools.id |
| school_name | text | YES | - | School name (denormalized) |
| class_name | text | YES | - | Class/grade |
| village | text | YES | - | Village/location |
| gender | text | NO | - | 'male', 'female' (CHECK constraint) |
| curriculum_completed | boolean | NO | false | All 5 categories mastered (>=70%) |
| curriculum_completed_at | timestamptz | YES | - | When curriculum was completed |
| created_at | timestamptz | YES | now() | - |
| updated_at | timestamptz | YES | now() | - |

**Code Usage:** [apps/web/src/app/actions/student.ts](apps/web/src/app/actions/student.ts) - saveStudentProfile(), [apps/web/src/app/actions/assessment/assessment-status.ts](apps/web/src/app/actions/assessment/assessment-status.ts) - getAssessmentStatus()

---

#### teacher_profiles
Teacher details and school affiliation.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| user_id | uuid | NO | - | FK to users.id |
| school_id | uuid | NO | - | FK to schools.id |
| name | text | NO | - | Full name |
| phone | text | YES | - | Contact number |
| subject | text | YES | - | Teaching subject |
| school_code | text | NO | - | School code for verification |
| gender | text | YES | - | 'male', 'female' (CHECK constraint) |
| village | text | YES | - | Location |
| created_at | timestamptz | YES | now() | - |
| updated_at | timestamptz | YES | now() | - |

**Code Usage:** [apps/web/src/app/actions/teacher-onboard.ts](apps/web/src/app/actions/teacher-onboard.ts)

---

#### schools
School registry for Assam.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| district | text | NO | - | District name |
| school_code | text | NO | - | Unique school code |
| school_name | text | NO | - | School name |
| block | text | YES | - | Block/subdivision |
| address | text | YES | - | Full address |
| created_at | timestamptz | YES | now() | - |

**Row Count:** 393
**Code Usage:** [apps/web/src/app/actions/school-finder.ts](apps/web/src/app/actions/school-finder.ts)

---

#### school_staff_credentials
PIN-based staff authentication.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| school_id | uuid | NO | - | FK to schools.id |
| pin_hash | text | NO | - | Hashed PIN |
| rotated_at | timestamptz | YES | - | Last rotation |
| created_at | timestamptz | YES | now() | - |
| updated_at | timestamptz | YES | now() | - |
| deleted_at | timestamptz | YES | - | Soft delete |

**Code Usage:** [apps/web/src/app/actions/school/staff-pin-management.ts](apps/web/src/app/actions/school/staff-pin-management.ts)

---

#### usernames
Username-based login for students without email.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | uuid | NO | - | FK to auth.users |
| username | text | NO | - | Unique username |
| created_at | timestamptz | YES | now() | - |

**Code Usage:** [apps/web/src/app/actions/auth/auth-username.ts](apps/web/src/app/actions/auth/auth-username.ts)

---

### 2. Class Management (2 tables)

#### classes
Teacher-created classes.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| name | text | NO | - | Class name |
| teacher_id | uuid | YES | - | FK to users.id |
| class_code | text | YES | - | Auto-generated join code |
| join_pin | text | YES | - | 6-digit PIN |
| subject | text | YES | - | Subject/course |
| created_at | timestamp | YES | now() | - |

**Row Count:** 44
**Code Usage:** [apps/web/src/app/actions/teacher/teacher-class.ts](apps/web/src/app/actions/teacher/teacher-class.ts)

---

#### enrollments
Student-class relationships.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| class_id | uuid | YES | - | FK to classes.id |
| student_id | uuid | YES | - | FK to users.id |
| enrolled_at | timestamptz | YES | now() | Enrollment time |
| created_at | timestamp | YES | now() | - |

**Row Count:** 85

**Code Usage:** Class roster, leaderboard filtering

---

### 3. Curriculum & Content (7 tables)

#### modules
5 curriculum modules (M1-M5).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | text | NO | - | 'M1', 'M2', etc. |
| name_en | text | NO | - | English name |
| name_hi | text | NO | - | Hindi name |
| name_as | text | NO | - | Assamese name |
| description_en | text | YES | - | English description |
| description_hi | text | YES | - | Hindi description |
| description_as | text | YES | - | Assamese description |
| icon | text | YES | '📚' | Emoji icon |
| color_gradient | text | YES | 'from-primary to-primary-dark' | CSS gradient |
| cultural_note_en | text | YES | - | Cultural context |
| cultural_note_hi | text | YES | - | - |
| cultural_note_as | text | YES | - | - |
| display_order | integer | NO | 0 | Sort order |
| is_active | boolean | YES | true | Visibility |
| created_at | timestamptz | YES | now() | - |
| updated_at | timestamptz | YES | now() | - |

**Row Count:** 5
**Code Usage:** [apps/web/src/lib/services/curriculum-service.ts](apps/web/src/lib/services/curriculum-service.ts)

---

#### units
19 units within modules.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | text | NO | - | 'U1', 'U2', etc. |
| module_id | text | NO | - | FK to modules.id |
| name_en | text | NO | - | English name |
| name_hi | text | NO | - | Hindi name |
| name_as | text | NO | - | Assamese name |
| description_en | text | YES | - | - |
| description_hi | text | YES | - | - |
| description_as | text | YES | - | - |
| display_order | integer | NO | 0 | Sort order |
| is_active | boolean | NO | true | Visibility |
| created_at | timestamptz | YES | now() | - |
| updated_at | timestamptz | YES | now() | - |

**Row Count:** 15

---

#### topics
50 topics (T1.1 through T19.2).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | text | NO | - | 'T1.1', 'T1.2', etc. |
| module_id | text | NO | - | FK to modules.id |
| unit_id | text | YES | - | FK to units.id |
| name_en | text | NO | - | English name |
| name_hi | text | NO | - | Hindi name |
| name_as | text | NO | - | Assamese name |
| description_en | text | YES | - | - |
| description_hi | text | YES | - | - |
| description_as | text | YES | - | - |
| duration_minutes | integer | YES | 15 | Estimated time |
| display_order | integer | NO | 0 | Sort order |
| is_active | boolean | YES | true | Visibility |
| created_at | timestamptz | YES | now() | - |
| updated_at | timestamptz | YES | now() | - |

**Row Count:** 50
**Code Usage:** Lesson navigation, curriculum service

---

#### curriculum_content
Main content table with RAG embeddings. **750 rows** (50 topics x 5 content types x 3 languages).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| module_id | text | NO | - | 'M1'-'M5' |
| topic_id | text | NO | - | 'T1.1'-'T19.2' |
| language | text | NO | - | 'en', 'hi', 'as' |
| content_type | text | NO | - | See below |
| title | text | YES | - | Content title |
| content | text | NO | - | Main text content |
| embedding | vector(1536) | YES | - | OpenAI embeddings for RAG |
| metadata | jsonb | YES | '{}' | Additional data |
| created_at | timestamptz | YES | now() | - |

**Content Types:**
| Type | Source from Markdown |
|------|---------------------|
| `definition` | Learning Outcome + Simple Explanation |
| `curriculum` | Visual Guide + Common Mistakes & Tips + Privacy/Safety Context |
| `cultural_context` | Cultural Analogy section |
| `example` | Step-by-Step Example + Quick Practice + Low-Tech Option |
| `exercise` | Assessment MCQ + Formative Check + Answer Key + Badge Progress |

**Row Count:** 750
**Code Usage:** [apps/web/src/lib/rag/content-retrieval.ts](apps/web/src/lib/rag/content-retrieval.ts) - AI tutor RAG context

---

#### practice_questions
In-lesson practice MCQs.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| topic_id | text | NO | - | FK to topics.id |
| module_id | text | NO | - | FK to modules.id |
| question | text | NO | - | Question text |
| options | jsonb | NO | '[]' | Answer options |
| correct_index | integer | NO | - | Correct option index (CHECK: 0-3, **0-based**) |
| explanation | text | YES | - | Answer explanation |
| difficulty | text | YES | 'medium' | 'easy', 'medium', 'hard' |
| order_index | integer | YES | 0 | Display order |
| language | text | YES | 'en' | Language code |
| created_at | timestamptz | YES | now() | - |

**Row Count:** 450

---

#### generated_lessons
AI-generated personalized lessons (cached).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| module_id | text | NO | - | FK to modules.id |
| topic_id | text | NO | - | FK to topics.id |
| language | text | NO | - | 'en', 'hi', 'as' |
| student_id | uuid | YES | - | NULL for generic lessons |
| lesson_json | jsonb | NO | - | Full lesson content |
| cache_version | text | YES | '1.0' | Cache invalidation |
| created_at | timestamptz | YES | now() | - |
| expires_at | timestamptz | YES | now() + 7 days | Cache expiry |

**Row Count:** 6
**Code Usage:** [apps/web/src/app/api/lesson/generate/route.ts](apps/web/src/app/api/lesson/generate/route.ts)

---

#### irt_item_bank
IRT-calibrated assessment items.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| item_code | varchar | NO | - | Unique item code |
| category | varchar | NO | - | Topic category |
| level | varchar | NO | 'basic' | 'basic', 'intermediate', 'advanced' |
| question_text | text | NO | - | Question text |
| options | jsonb | NO | - | Answer options |
| correct_answer | integer | NO | - | Correct index (CHECK: 1-4, **1-based** — differs from practice_questions.correct_index which is 0-based) |
| difficulty | numeric | NO | 0 | IRT difficulty (b) |
| discrimination | numeric | NO | 1 | IRT discrimination (a) |
| guessing | numeric | NO | 0.25 | IRT guessing (c) |
| language | varchar | NO | 'en' | Language code |
| source_language | varchar | YES | 'en' | Original language |
| cultural_context | varchar | YES | 'northeast_india' | Cultural context |
| times_administered | integer | YES | 0 | Usage count |
| times_correct | integer | YES | 0 | Correct responses |
| point_biserial | numeric | YES | - | Item correlation |
| estimated_time_seconds | integer | YES | 30 | Time estimate |
| min_time_ms | integer | YES | 3000 | Min response time |
| is_active | boolean | YES | true | Active status |
| review_state | varchar | YES | 'approved' | Review status |
| created_at | timestamptz | YES | now() | - |
| updated_at | timestamptz | YES | now() | - |
| created_by | uuid | YES | - | Creator |
| updated_by | uuid | YES | - | Last updater |

**Row Count:** 300
**Code Usage:** [apps/web/src/app/actions/assessment/adaptive-selection.ts](apps/web/src/app/actions/assessment/adaptive-selection.ts)

---

### 4. Assessment & Progress (6 tables)

#### assessment_sessions
Assessment lifecycle tracking. Supports pre-assessment (diagnostic), adaptive (in-course), and post-assessment (summative) session types.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | uuid | NO | - | FK to users.id |
| class_id | uuid | YES | - | FK to classes.id |
| session_type | text | NO | 'adaptive' | 'pre', 'adaptive', 'post' (CHECK constraint) |
| started_at | timestamptz | NO | now() | Start time |
| submitted_at | timestamptz | YES | - | Submit time |
| created_at | timestamptz | NO | now() | - |
| updated_at | timestamptz | NO | now() | - |

**Indexes:** `idx_assessment_sessions_type` on `(user_id, session_type)`
**Row Count:** 108 (all existing sessions defaulted to 'adaptive')
**Code Usage:** [apps/web/src/app/actions/assessment/assessment-submission.ts](apps/web/src/app/actions/assessment/assessment-submission.ts)

---

#### assessment_responses
Individual question responses.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| session_id | uuid | NO | - | FK to assessment_sessions.id |
| user_id | uuid | YES | - | FK to users.id |
| item_id | text | NO | - | FK to irt_item_bank |
| module | text | NO | - | Module ID |
| is_correct | boolean | YES | - | Correct/incorrect |
| rt_ms | integer | YES | - | Response time (ms) |
| focus_blur_count | integer | YES | 0 | Tab switches |
| chosen_option | text | YES | - | Selected answer |
| created_at | timestamptz | NO | now() | - |

**Row Count:** 26

---

#### student_knowledge_state
Per-topic mastery tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| student_id | uuid | YES | - | FK to users.id |
| module_id | text | NO | - | FK to modules.id |
| topic_id | text | NO | - | FK to topics.id |
| mastery_score | numeric | YES | 0 | 0-100 mastery score |
| confidence_level | text | YES | 'low' | 'low', 'medium', 'high' |
| attempts | integer | YES | 0 | Number of attempts |
| time_spent_seconds | integer | YES | 0 | Total time |
| last_attempt_at | timestamptz | YES | - | Last activity |
| status | text | YES | 'not_started' | 'not_started', 'in_progress', 'mastered' |
| created_at | timestamptz | YES | now() | - |
| updated_at | timestamptz | YES | now() | - |

**Row Count:** 7
**Code Usage:** [apps/web/src/lib/ai/services/adaptive-service.ts](apps/web/src/lib/ai/services/adaptive-service.ts)

---

#### learning_style_profile
VARK learning preferences.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| student_id | uuid | YES | - | FK to users.id |
| visual_score | numeric | YES | 33.33 | Visual preference % |
| text_score | numeric | YES | 33.33 | Reading preference % |
| auditory_score | numeric | YES | 33.33 | Audio preference % |
| preferred_style | text | YES | - | **GENERATED ALWAYS** — computed as: visual if visual_score highest, auditory if auditory_score highest, else 'text' |
| images_viewed | integer | YES | 0 | Images viewed count |
| voice_replays | integer | YES | 0 | Audio replays |
| text_read_time_seconds | integer | YES | 0 | Reading time |
| updated_at | timestamptz | YES | now() | - |

**Row Count:** 1
**Code Usage:** [apps/web/src/lib/database/learning-profile-queries.ts](apps/web/src/lib/database/learning-profile-queries.ts)

---

#### formative_responses
Practice question responses (low-stakes).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| student_id | uuid | YES | - | FK to users.id |
| topic_id | text | NO | - | FK to topics.id |
| question_id | text | NO | - | Question identifier |
| is_correct | boolean | YES | - | Correct/incorrect |
| response_time_ms | integer | YES | - | Response time |
| ai_hint_requested | boolean | YES | false | Used AI hint |
| created_at | timestamptz | YES | now() | - |

**Row Count:** 9

---

#### summative_results
Module completion scores.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| student_id | uuid | YES | - | FK to users.id |
| module_id | text | NO | - | FK to modules.id |
| practical_score | integer | YES | 0 | Practical section (CHECK: 0-60) |
| mcq_score | integer | YES | 0 | MCQ section (CHECK: 0-25) |
| reflection_score | integer | YES | 0 | Reflection section (CHECK: 0-15) |
| total_score | integer | YES | - | **GENERATED ALWAYS** — `practical_score + mcq_score + reflection_score` |
| passed | boolean | YES | - | **GENERATED ALWAYS** — `practical >= 42 AND mcq >= 18 AND reflection >= 11 AND total >= 70` |
| badge_level | text | YES | - | **GENERATED ALWAYS** — 'distinction' (≥95), 'merit' (≥85), 'pass' (≥70), 'incomplete' (<70) |
| completed_at | timestamptz | YES | now() | - |

**Row Count:** 0

---

### 5. Gamification (3 tables)

#### badges
Badge definitions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | text | NO | - | Badge ID |
| name_en | text | NO | - | English name |
| name_hi | text | NO | - | Hindi name |
| name_as | text | NO | - | Assamese name |
| description | text | NO | - | Description |
| icon | text | NO | - | Emoji icon |
| unlock_criteria | jsonb | NO | - | Unlock conditions |
| cultural_note | text | YES | - | Cultural context |
| rarity | text | YES | 'common' | 'common', 'uncommon', 'rare', 'legendary' (CHECK constraint) |
| points_value | integer | YES | 100 | Points awarded |

**Row Count:** 10
**Code Usage:** [apps/web/src/lib/services/gamification-service.ts](apps/web/src/lib/services/gamification-service.ts)

---

#### student_badges
Earned badges per student.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| student_id | uuid | YES | - | FK to users.id |
| badge_id | text | YES | - | FK to badges.id |
| earned_at | timestamptz | YES | now() | When earned |

**Row Count:** 6

---

#### points_history
Points transaction ledger.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| student_id | uuid | YES | - | FK to users.id |
| points | integer | NO | - | Points awarded |
| source | text | NO | - | CHECK: 'assessment_complete', 'badge_earned', 'streak_bonus', 'lesson_complete', 'voice_practice', 'daily_login', 'lesson', 'question', 'assessment', 'voice', 'high_score_bonus', 'bonus', 'referral', 'achievement' |
| description | text | YES | - | Details |
| created_at | timestamptz | YES | now() | - |

**Row Count:** 24
**Code Usage:** awardPoints(), getClassLeaderboard()

---

### 6. AI & Communication (4 tables)

#### ai_tutor_interactions
Chat history with AI tutor.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| student_id | uuid | YES | - | FK to users.id |
| session_id | uuid | NO | - | Chat session ID |
| topic_id | text | YES | - | Current topic |
| message_role | text | NO | - | 'user', 'assistant', 'system' (CHECK constraint) |
| message_content | text | NO | - | Message text |
| input_mode | text | YES | 'text' | 'text' or 'voice' |
| language | text | YES | 'en' | Language used |
| tokens_used | integer | YES | 0 | Token count |
| response_time_ms | integer | YES | - | Response time |
| created_at | timestamptz | YES | now() | - |

**Row Count:** 134
**Code Usage:** [apps/web/src/lib/ai/services/tutor-service.ts](apps/web/src/lib/ai/services/tutor-service.ts)

---

#### class_announcements
Teacher announcements.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| class_id | uuid | NO | - | FK to classes.id |
| teacher_id | uuid | NO | - | FK to users.id |
| title | text | NO | - | Announcement title |
| body | text | NO | - | Content |
| priority | text | YES | 'normal' | 'low', 'normal', 'high', 'urgent' (CHECK constraint) |
| is_pinned | boolean | YES | false | Pinned status |
| created_at | timestamptz | YES | now() | - |
| updated_at | timestamptz | YES | now() | - |

**Row Count:** 4
**Code Usage:** [apps/web/src/app/actions/teacher/teacher-communication.ts](apps/web/src/app/actions/teacher/teacher-communication.ts)

---

#### announcement_reads
Read tracking for announcements.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| announcement_id | uuid | NO | - | FK to class_announcements.id |
| student_id | uuid | NO | - | FK to users.id |
| read_at | timestamptz | YES | now() | When read |

**Row Count:** 3

---

#### class_materials
Shared learning resources.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| class_id | uuid | NO | - | FK to classes.id |
| teacher_id | uuid | NO | - | FK to users.id |
| title | text | NO | - | Material title |
| description | text | YES | - | Description |
| material_type | text | NO | - | 'file', 'link', 'video', 'document', 'worksheet', 'image', 'other' (CHECK constraint) |
| storage_path | text | YES | - | Storage location |
| external_url | text | YES | - | External link |
| file_url | text | YES | - | File URL |
| topic_id | text | YES | - | Related topic |
| module_id | text | YES | - | Related module |
| file_name | text | YES | - | Original filename |
| file_size | integer | YES | - | Size in bytes |
| mime_type | text | YES | - | MIME type |
| download_count | integer | YES | 0 | Downloads |
| view_count | integer | YES | 0 | Views |
| is_visible | boolean | YES | true | Visibility |
| created_at | timestamptz | YES | now() | - |
| updated_at | timestamptz | YES | now() | - |

**Row Count:** 5
**CHECK:** `material_source_required` — at least one of `file_url`, `external_url`, or `storage_path` must be NOT NULL

---

### 7. System (2 tables)

#### feature_flags
Feature toggles and rollouts.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | text | NO | - | Flag ID |
| name | text | NO | - | Flag name |
| description | text | YES | - | Description |
| enabled | boolean | YES | false | Global enabled |
| rollout_percentage | integer | YES | 0 | Percentage rollout |
| whitelist_user_ids | uuid[] | YES | '{}' | Whitelisted users |
| created_at | timestamptz | YES | now() | - |
| updated_at | timestamptz | YES | now() | - |

**Row Count:** 5
**Code Usage:** [apps/web/src/lib/feature-flags.ts](apps/web/src/lib/feature-flags.ts)

---

#### sync_log
Offline sync tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| student_id | uuid | NO | - | FK to users.id |
| idempotency_key | text | NO | - | Deduplication key |
| sync_type | text | NO | - | Type of sync |
| synced_at | timestamptz | NO | now() | Sync time |

**Row Count:** 0
**Code Usage:** [apps/web/src/app/api/progress/sync/route.ts](apps/web/src/app/api/progress/sync/route.ts)

---

## Database Functions (59 total)

### Trigger Functions (11)

| Function | Return Type | Description |
|----------|-------------|-------------|
| auto_generate_class_credentials | trigger | Auto-generate class_code and join_pin |
| create_user_on_student_profile | trigger | Create user record on student profile insert |
| create_user_on_teacher_profile | trigger | Create user record on teacher profile insert |
| ensure_user_exists_for_enrollment | trigger | Validate user exists before enrollment |
| set_assessment_response_user_id | trigger | Set user_id on assessment response |
| update_announcement_updated_at | trigger | Update timestamp on announcements |
| update_assessment_session_updated_at | trigger | Update timestamp on sessions |
| update_irt_item_bank_updated_at | trigger | Update timestamp on IRT items |
| update_material_updated_at | trigger | Update timestamp on materials |
| update_student_profile_updated_at | trigger | Update timestamp on student profiles |
| update_teacher_profile_updated_at | trigger | Update timestamp on teacher profiles |

### Utility Functions (8)

| Function | Return Type | Description |
|----------|-------------|-------------|
| generate_class_code | text | Generate unique class code |
| generate_join_pin | text | Generate 6-digit PIN |
| is_class_teacher | boolean | Check if user is class teacher |
| is_enrolled_in_class | boolean | Check enrollment status |
| is_teacher | boolean | Check if user is teacher |
| teacher_has_student_access | boolean | Validate teacher-student access |
| get_teacher_class_ids | uuid | Get teacher's class IDs |
| get_teacher_student_ids | uuid | Get teacher's student IDs |

### Authentication & Profile RPCs (6)

| Function | Return Type | Description |
|----------|-------------|-------------|
| check_email_exists | record | Check if email is registered |
| check_username_available | boolean | Check username availability |
| get_user_id_by_username | uuid | Get user ID from username |
| upsert_student_profile | jsonb | Create or update student profile |
| verify_staff_pin | record | Verify school staff PIN |
| rotate_staff_pin | record | Rotate staff PIN |

### Curriculum RPCs (8)

| Function | Return Type | Description |
|----------|-------------|-------------|
| get_modules_with_counts | record | Get modules with topic counts |
| get_module_topics | record | Get topics for a module |
| get_module_units_with_topics | record | Get units and topics for module |
| get_module_unit_count | integer | Get unit count for module |
| get_topic | record | Get single topic details |
| get_topic_context | record | Get topic with curriculum context |
| cleanup_expired_lessons | void | Remove expired generated lessons |
| upsert_generated_lesson | void | Upsert shared lesson cache (uses partial index) |

### RAG Functions (4)

| Function | Return Type | Description |
|----------|-------------|-------------|
| match_curriculum | record | Vector similarity search |
| match_curriculum_cosine | record | Cosine similarity search |
| match_curriculum_hybrid | record | Hybrid search (vector + keyword) |
| match_curriculum_content_simple | text | Simple text match for RAG |

### Assessment RPCs (6)

| Function | Return Type | Description |
|----------|-------------|-------------|
| submit_assessment | jsonb | Submit and score assessment |
| update_knowledge_state | jsonb | Update topic mastery |
| update_progress_atomic | jsonb | Atomic progress update |
| get_assessment_comparison | jsonb | Compare pre vs post assessment scores per module |
| check_curriculum_completion | jsonb | Check if all 5 categories mastered (>=70%), auto-marks `student_profiles.curriculum_completed` |
| has_assessment_type | boolean | Check if student has completed a specific assessment type ('pre'/'post') |

### Gamification RPCs (3)

| Function | Return Type | Description |
|----------|-------------|-------------|
| batch_check_and_award_badges | record | Check and award multiple badges |
| get_student_total_points | integer | Get student's total points |
| get_class_leaderboard | record | Get class leaderboard |

### Teacher RPCs (8)

| Function | Return Type | Description |
|----------|-------------|-------------|
| get_class_roster | record | Get class student roster |
| get_class_student_progress | record | Get student progress for class |
| get_class_materials | record | Get materials for class |
| get_announcements_with_reads | record | Get announcements with read counts |
| get_announcement_read_count | integer | Get read count for announcement |
| get_unread_announcements | record | Get unread announcements |
| get_user_enrolled_class_ids | uuid | Get student's enrolled class IDs |
| search_students_for_teacher | record | Search students in teacher's classes |

### Analytics & Monitoring RPCs (4)

| Function | Return Type | Description |
|----------|-------------|-------------|
| get_school_metrics | record | Get school-level metrics |
| get_connection_stats | record | Get PostgreSQL connection pool utilization |
| increment_material_download | void | Increment material download counter |
| increment_material_view | void | Increment material view counter |

### Learning Style RPCs (3)

| Function | Return Type | Description |
|----------|-------------|-------------|
| increment_visual_score | void | Increment visual preference |
| increment_text_score | void | Increment text preference |
| increment_auditory_score | void | Increment auditory preference |

### Sync RPCs (1)

| Function | Return Type | Description |
|----------|-------------|-------------|
| cleanup_old_sync_logs | integer | Clean up old sync records |

---

## Row Level Security (RLS) Policies

### Summary by Table

| Table | SELECT | INSERT | UPDATE | DELETE | Policies |
|-------|--------|--------|--------|--------|----------|
| ai_tutor_interactions | 2 | 2 | 1 | 1 | 3 (1 ALL) |
| announcement_reads | 1 | 1 | - | - | 2 |
| assessment_responses | 1 | 1 | - | - | 2 |
| assessment_sessions | 1 | 1 | 1 | - | 3 |
| badges | 1 | 1 | 1 | 1 | 4 |
| class_announcements | 1 | 1 | 1 | 1 | 4 |
| class_materials | 1 | 1 | 1 | 1 | 4 |
| classes | 1 | 1 | 1 | 1 | 4 |
| curriculum_content | 1 | - | - | - | 1 |
| enrollments | 1 | 1 | 1 | 1 | 4 |
| feature_flags | 1 | 1 | 1 | 1 | 4 |
| formative_responses | 1 | 1 | - | - | 2 |
| generated_lessons | 1 | 1 | 1 | - | 3 |
| irt_item_bank | 2 | 2 | 2 | 2 | 5 (1 ALL) |
| learning_style_profile | 2 | 2 | 2 | 1 | 4 (1 ALL) |
| modules | 1 | - | - | - | 1 |
| points_history | 1 | 1 | - | - | 2 |
| practice_questions | 2 | 2 | 2 | 2 | 5 (1 ALL) |
| school_staff_credentials | 1 | 1 | 1 | - | 3 |
| schools | 1 | - | - | - | 1 |
| student_badges | 2 | 2 | 1 | 1 | 3 (1 ALL) |
| student_knowledge_state | 2 | 2 | 2 | 1 | 4 (1 ALL) |
| student_profiles | 1 | 1 | 1 | - | 3 |
| summative_results | 1 | - | - | - | 1 |
| sync_log | 1 | 1 | - | - | 2 |
| teacher_profiles | 1 | 1 | 1 | - | 3 |
| topics | 1 | - | - | - | 1 |
| units | 1 | 1 | 1 | 1 | 4 |
| usernames | 2 | 1 | 1 | 1 | 2 (1 ALL) |
| users | 1 | - | 1 | - | 2 |
| **Effective** | **35** | **30** | **24** | **16** | **84 distinct** |

> **Note:** Tables with `(1 ALL)` have a `service_role ALL` policy that applies to all commands. The SELECT/INSERT/UPDATE/DELETE columns count effective policies per command (including ALL). The Policies column counts distinct policies. 6 dead RLS write policies on `modules` and `topics` were removed on Feb 15 (they checked `auth.role() = 'service_role'` on `{authenticated}` role, which can never match).

### Key Policy Patterns

**Self-Access:** Users can only read/update their own records
```sql
user_id = auth.uid() OR student_id = auth.uid()
```

**Teacher-Student Access:** Teachers can view students in their classes (enrollment-based)
```sql
-- Used for assessment_sessions, assessment_responses, and other student data
-- NOTE: Uses enrollments table, NOT assessment_sessions.class_id (which is often NULL)
EXISTS (
  SELECT 1 FROM enrollments e
  JOIN classes c ON c.id = e.class_id
  WHERE e.student_id = target.student_id
  AND c.teacher_id = auth.uid()
)
```

**Public Read:** Some content is publicly readable
```sql
true  -- for badges, modules, topics, generated_lessons
```

**Service Role:** Server-side operations bypass RLS
```sql
auth.role() = 'service_role'
```

---

## Migration History (159 local migrations, 3 tracked in Supabase)

### Key Migrations by Category

#### Initial Schema (001-010)
- `001_create_initial_schema` - Users, classes, enrollments
- `002_enable_rls_policies` - Initial RLS setup
- `006_create_assessment_schema` - Assessment tables
- `009_seed_kamrup_rural_schools` - School data (393 schools)

#### Authentication (011-035)
- `013_auto_create_user_on_teacher_profile` - Trigger for teacher creation
- `023_create_student_profiles_and_update_teacher_profiles` - Profile tables
- `030_create_username_lookup_table` - Username-based auth
- `033_auto_create_user_on_student_profile` - Trigger for student creation

#### Adaptive Learning (042-080)
- `042_adaptive_learning_schema` - Knowledge state, learning style
- `043_enable_pgvector` - Vector extension for RAG
- `045_create_match_curriculum_function` - RAG functions
- `052_add_submit_assessment_rpc` - Assessment submission
- `053_add_update_knowledge_state_rpc` - Progress tracking

#### Performance Optimization (054-080)
- `054_fix_function_search_path_and_rls_optimization` - Security fixes
- `055_optimize_indexes` - Index optimization
- `056_optimize_rls_policies` - RLS performance
- `070_final_security_and_performance_fixes` - Comprehensive fixes

#### Gamification (122-132)
- `122_create_feature_flags` - Feature flag system
- `123_batch_check_award_badges` - Badge awarding
- `126_get_class_leaderboard` - Leaderboard function
- `132_fix_first_steps_badge` - Badge fix

#### Curriculum & Content (133-157)
- `133_create_generated_lessons_cache` - Lesson caching
- `134_seed_curriculum_content` - Initial content seed
- `135-137` - Teacher communication tables
- `138_create_curriculum_metadata` - Modules, topics, units
- `147_create_units_table` - Units structure
- `148_create_sync_log_table` - Offline sync
- `151_add_get_student_total_points` - Points RPC
- `152_add_match_curriculum_content_simple` - Simple RAG
- `154_add_cache_version_to_generated_lessons` - Cache versioning
- `155_fix_knowledge_state_status` - Progress atomic updates
- `156_fix_badge_id_ambiguity` - Badge function fix
- `157_seed_missing_assamese_content` - Assamese content

### Recent Migrations (151-159)

| Migration | Date | Description |
|-----------|------|-------------|
| 151 | Feb 4 | Add get_student_total_points RPC |
| 152 | Feb 4 | Add match_curriculum_content_simple RPC |
| 153 | Feb 2 | Cleanup unused indexes |
| 154 | Feb 3 | Add cache_version to generated_lessons |
| 155 | Feb 4 | Fix knowledge state status + atomic updates |
| 156 | Feb 4 | Fix badge_id ambiguity in awarding function |
| 157 | Feb 4 | Seed missing Assamese content |
| 158 | Feb 10 | Add upsert_generated_lesson RPC (partial index fix) |
| 159 | Feb 10 | Apply get_connection_stats function (via Supabase MCP) |
| MCP-1 | Feb 15 | Fix storage UPDATE policy: lesson-assets requires authenticated |
| MCP-2 | Feb 15 | Add ATAL AI LOGO bucket restrictions (2MB, image MIME types) |
| MCP-3 | Feb 15 | Fix FK ON DELETE: topics.unit_id→CASCADE, profiles.school_id→SET NULL |
| MCP-4 | Feb 15 | Remove 6 dead RLS write policies on modules and topics |
| MCP-5 | Feb 15 | Fix teacher assessment RLS: enrollment-based access (replaces broken class_id JOIN) |
| 161 | Feb 16 | Add `session_type` to `assessment_sessions` + `curriculum_completed` to `student_profiles` |
| 162 | Feb 16 | RPCs: `get_assessment_comparison`, `check_curriculum_completion`, `has_assessment_type` |
| 163 | Feb 16 | Backfill oldest sessions as 'pre' + update `has_assessment_type` fallback for legacy students |

---

## Extensions (Live from Supabase MCP)

| Extension | Version | Purpose |
|-----------|---------|---------|
| pgcrypto | 1.3 | Password hashing, encryption |
| vector (pgvector) | 0.8.0 | Vector similarity for RAG embeddings |
| pg_trgm | 1.6 | Trigram text similarity |
| uuid-ossp | 1.1 | UUID generation |
| pg_stat_statements | 1.11 | Query performance monitoring |
| pg_graphql | 1.5.11 | GraphQL API |
| supabase_vault | 0.3.1 | Secrets management |
| plpgsql | 1.0 | Procedural language (required) |

---

## Storage (Live from Supabase MCP)

### Storage Buckets (2)

#### 1. lesson-assets

| Property | Value |
|----------|-------|
| ID | lesson-assets |
| Public | true |
| File Size Limit | 5,242,880 bytes (5 MB) |
| Allowed MIME Types | image/png, image/jpeg, image/webp |

#### 2. ATAL AI LOGO

| Property | Value |
|----------|-------|
| ID | ATAL AI LOGO |
| Public | true |
| File Size Limit | 2,097,152 bytes (2 MB) |
| Allowed MIME Types | image/png, image/jpeg, image/svg+xml |

### Storage RLS Policies (3)

1. **Public read access for lesson-assets** - SELECT (public read, no auth required)
2. **Authenticated upload for lesson-assets** - INSERT (`auth.role() = 'authenticated'`)
3. **Authenticated update for lesson-assets** - UPDATE (`auth.role() = 'authenticated'`, fixed Feb 15 — was previously `{public}` with no auth check)

---

## Code Integration

### Key Service Files

| Service | File | Tables Used |
|---------|------|-------------|
| Gamification | [gamification-service.ts](apps/web/src/lib/services/gamification-service.ts) | points_history, student_badges, student_knowledge_state |
| Curriculum | [curriculum-service.ts](apps/web/src/lib/services/curriculum-service.ts) | modules, units, topics |
| RAG | [content-retrieval.ts](apps/web/src/lib/rag/content-retrieval.ts) | curriculum_content |
| Adaptive | [adaptive-service.ts](apps/web/src/lib/ai/services/adaptive-service.ts) | student_knowledge_state, learning_style_profile |
| AI Tutor | [tutor-service.ts](apps/web/src/lib/ai/services/tutor-service.ts) | ai_tutor_interactions |

### TypeScript Types

All table types are defined in [apps/web/src/types/database.ts](apps/web/src/types/database.ts).

---

## Verification Summary

**Verified via Supabase MCP on February 15, 2026:**

| Check | Method | Result |
|-------|--------|--------|
| Project Status | `get_project` | ACTIVE_HEALTHY |
| PostgreSQL Version | `get_project` | 17.6.1.038 |
| Table Count | `list_tables` | 30 public tables |
| Functions | `information_schema.routines` | 62 (11 trigger + 51 RPC) |
| RLS Policies | `pg_policies` | 86 public + 3 storage = 89 total |
| Extensions | `pg_extension` | 8 active |
| Storage Buckets | `storage.buckets` | 2 buckets (both with restrictions) |

---

*Document updated: February 16, 2026 via Supabase MCP*
*Database: hnlsqznoviwnyrkskfay (ap-southeast-1)*
*Project: ATAL AI 1.0 | Status: ACTIVE_HEALTHY*
