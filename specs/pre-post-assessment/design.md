# Pre/Post Assessment System

## Overview

Add a **pre-assessment** (diagnostic) and **post-assessment** (summative) flow to measure student learning improvement across the curriculum. New students take a pre-assessment to determine their starting level; after completing the curriculum, they take a post-assessment to measure growth.

## Problem Statement

Currently:
1. All assessments are the same type — no distinction between diagnostic and summative
2. New students have no recommended starting point based on their existing knowledge
3. There is no way to measure learning improvement after curriculum completion
4. The `assessment_sessions` table has no `session_type` column

## Goals

1. Detect new students and prompt them to take a pre-assessment
2. Use pre-assessment results to recommend a starting lesson/level
3. Detect curriculum completion and prompt a post-assessment
4. Compare pre vs post scores to show learning improvement
5. Reuse existing IRT item bank and assessment infrastructure

---

## Database Changes

### Migration: Add `session_type` to `assessment_sessions`

```sql
-- Add session_type column with backward-compatible default
ALTER TABLE assessment_sessions
  ADD COLUMN session_type TEXT NOT NULL DEFAULT 'adaptive'
  CHECK (session_type IN ('pre', 'adaptive', 'post'));

-- Index for querying pre/post sessions per user
CREATE INDEX idx_assessment_sessions_type
  ON assessment_sessions(user_id, session_type);

-- Backfill: All 108 existing sessions become 'adaptive'
-- (default handles this automatically, no UPDATE needed)
```

### Migration: Add `curriculum_completed` to `student_profiles`

```sql
ALTER TABLE student_profiles
  ADD COLUMN curriculum_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN curriculum_completed_at TIMESTAMPTZ;
```

### No new tables needed

The existing `assessment_sessions`, `assessment_responses`, `irt_item_bank`, and `student_knowledge_state` tables handle everything.

---

## Flow Design

### Pre-Assessment Flow

```
New Student Registers
  → Dashboard detects: assessmentsCount === 0 && classesCount === 0
  → Show PreAssessmentPrompt modal
  → Student clicks "Start Assessment"
  → Navigate to /app/assessment/start?type=pre
  → Assessment page creates session with session_type='pre'
  → Student completes 20-30 adaptive IRT questions (5 categories)
  → submit_assessment RPC scores + updates student_knowledge_state
  → Results page shows scores per category + recommended starting level
  → Redirect to recommended lesson
```

### Post-Assessment Flow

```
Student completes curriculum (all 5 modules mastered or threshold %)
  → Mark curriculum_completed=true in student_profiles
  → Dashboard detects: curriculum_completed && no post-assessment exists
  → Show PostAssessmentPrompt modal
  → Student clicks "Take Final Assessment"
  → Navigate to /app/assessment/start?type=post
  → Assessment page creates session with session_type='post'
  → Student completes same 20-30 adaptive IRT questions
  → submit_assessment RPC scores + updates student_knowledge_state
  → Results page shows: pre vs post comparison per category
  → Show improvement metrics + certificate-style summary
```

### Curriculum Completion Detection

A student has "completed the curriculum" when:

```sql
-- Option A: All 5 categories have mastery_score >= 70
SELECT COUNT(*) = 5
FROM student_knowledge_state
WHERE student_id = $1
  AND topic_id IN (
    'contextual_application',
    'digital_content_creation',
    'digital_device_familiarity',
    'internet_web_awareness',
    'problem_solving_aptitude'
  )
  AND mastery_score >= 70;

-- Option B: 80% of all lessons completed (simpler threshold)
-- This depends on lesson tracking being in place
```

Recommendation: **Option A** — mastery-based, aligns with existing IRT model.

---

## API Changes

### Modify `submit_assessment` RPC

No changes needed to the core RPC. The `session_type` column is metadata on the session, not on submission logic. The RPC already:
- Inserts responses atomically
- Calculates per-module breakdown
- Updates `student_knowledge_state`
- Returns score + module breakdown

### New RPC: `get_assessment_comparison`

```sql
CREATE OR REPLACE FUNCTION get_assessment_comparison(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  pre_result JSONB;
  post_result JSONB;
BEGIN
  -- Get pre-assessment scores
  SELECT jsonb_build_object(
    'session_id', s.id,
    'submitted_at', s.submitted_at,
    'modules', (
      SELECT jsonb_object_agg(
        r.module,
        jsonb_build_object(
          'total', COUNT(*),
          'correct', COUNT(*) FILTER (WHERE r.is_correct),
          'score', ROUND(100.0 * COUNT(*) FILTER (WHERE r.is_correct) / NULLIF(COUNT(*), 0), 1)
        )
      )
      FROM assessment_responses r
      WHERE r.session_id = s.id
    )
  ) INTO pre_result
  FROM assessment_sessions s
  WHERE s.user_id = p_user_id
    AND s.session_type = 'pre'
    AND s.submitted_at IS NOT NULL
  ORDER BY s.submitted_at DESC
  LIMIT 1;

  -- Get post-assessment scores (same structure)
  SELECT jsonb_build_object(
    'session_id', s.id,
    'submitted_at', s.submitted_at,
    'modules', (
      SELECT jsonb_object_agg(
        r.module,
        jsonb_build_object(
          'total', COUNT(*),
          'correct', COUNT(*) FILTER (WHERE r.is_correct),
          'score', ROUND(100.0 * COUNT(*) FILTER (WHERE r.is_correct) / NULLIF(COUNT(*), 0), 1)
        )
      )
      FROM assessment_responses r
      WHERE r.session_id = s.id
    )
  ) INTO post_result
  FROM assessment_sessions s
  WHERE s.user_id = p_user_id
    AND s.session_type = 'post'
    AND s.submitted_at IS NOT NULL
  ORDER BY s.submitted_at DESC
  LIMIT 1;

  RETURN jsonb_build_object(
    'pre', COALESCE(pre_result, 'null'::jsonb),
    'post', COALESCE(post_result, 'null'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### New API Route: `GET /api/assessment/comparison`

Returns pre vs post scores for the current user. Used by the comparison dashboard component.

---

## UI Components

### 1. PreAssessmentPrompt (Modal on Dashboard)

**Location:** `apps/web/src/components/assessment/PreAssessmentPrompt.tsx`

**Trigger:** Dashboard detects `assessmentsCount === 0` for students.

**Content:**
- Title: "Welcome! Let's find your starting level"
- Description: "Take a quick 5-minute assessment so we can recommend the best lessons for you"
- Primary CTA: "Start Assessment" → `/app/assessment/start?type=pre`
- Secondary: "Skip for now" (dismisses, stores in localStorage)
- Shows only once per session if dismissed

### 2. PostAssessmentPrompt (Modal on Dashboard)

**Location:** `apps/web/src/components/assessment/PostAssessmentPrompt.tsx`

**Trigger:** Dashboard detects `curriculum_completed === true` AND no post-assessment session exists.

**Content:**
- Title: "Congratulations! You've completed the curriculum!"
- Description: "Take the final assessment to see how much you've improved"
- Primary CTA: "Take Final Assessment" → `/app/assessment/start?type=post`
- Secondary: "Remind me later"

### 3. AssessmentComparison (Results Component)

**Location:** `apps/web/src/components/assessment/AssessmentComparison.tsx`

**Shows:**
- Per-category bar chart (pre score vs post score)
- Overall improvement percentage
- Category-level improvement indicators (up/down arrows)
- Motivational message based on improvement level

### 4. Modified Assessment Start Page

**Location:** `apps/web/src/app/app/assessment/start/page.tsx` (existing)

**Changes:**
- Read `?type=pre|post` from URL search params
- Pass `session_type` when creating the assessment session
- After submission, route to appropriate results view:
  - Pre: Show recommended starting level + redirect to lessons
  - Post: Show comparison view (pre vs post)

---

## Recommended Starting Level Logic

After pre-assessment, recommend based on lowest-scoring category:

```typescript
function getRecommendedLevel(moduleBreakdown: Record<string, { score: number }>) {
  const categories = Object.entries(moduleBreakdown);

  // Sort by score ascending — weakest first
  categories.sort((a, b) => a[1].score - b[1].score);

  const weakest = categories[0];
  const avgScore = categories.reduce((sum, [, v]) => sum + v.score, 0) / categories.length;

  // Map average score to difficulty level
  if (avgScore < 30) return { level: 'beginner', startModule: weakest[0] };
  if (avgScore < 60) return { level: 'intermediate', startModule: weakest[0] };
  return { level: 'advanced', startModule: weakest[0] };
}
```

The student starts from their weakest category at the appropriate difficulty level.

---

## Implementation Order

### Phase 1: Database + Backend (1-2 PRs)
1. Migration: Add `session_type` to `assessment_sessions`
2. Migration: Add `curriculum_completed` to `student_profiles`
3. RPC: `get_assessment_comparison`
4. RPC: `check_curriculum_completion` (sets flag when all 5 categories mastered)
5. Update RLS policies if needed

### Phase 2: Pre-Assessment Flow (1-2 PRs)
1. `PreAssessmentPrompt` modal component
2. Modify assessment start page to accept `?type=pre`
3. Pre-assessment results page with recommended level
4. Dashboard integration (show prompt for new students)

### Phase 3: Post-Assessment Flow (1-2 PRs)
1. Curriculum completion trigger (after lesson/assessment completion)
2. `PostAssessmentPrompt` modal component
3. Modify assessment start page for `?type=post`
4. Dashboard integration (show prompt after curriculum completion)

### Phase 4: Comparison Dashboard (1 PR)
1. `AssessmentComparison` component
2. API route for comparison data
3. Integration in student progress page or dashboard

---

## Edge Cases

1. **Student skips pre-assessment**: Allow normal usage, but can't show comparison later. Show "Take pre-assessment" CTA in progress page.
2. **Student retakes pre-assessment**: Only latest pre-assessment session is used for comparison. (Limit to 1 pre-assessment with a check.)
3. **Student hasn't finished curriculum but wants post-assessment**: Don't show prompt. Post-assessment requires `curriculum_completed = true`.
4. **Category has 0 items answered**: Show "N/A" in comparison, not 0%.
5. **Pre and post use different number of questions**: Comparison uses percentage scores (not raw counts) for fairness.

## Constraints

- Must reuse existing `irt_item_bank` (300 items, 5 categories)
- Must reuse existing `submit_assessment` RPC (no breaking changes)
- Pre/post assessments use same adaptive IRT algorithm
- PR size: max 5-7 files, ~500 lines per PR (per CLAUDE.md guidelines)
