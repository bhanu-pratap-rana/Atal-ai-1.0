# Pre/Post Assessment — Implementation Status

## Status: IMPLEMENTED (pending migration run)

Design spec created: 2026-02-16
Implementation completed: 2026-02-16

---

## Phase 1: Database + Backend
- [x] Migration 161: Add `session_type` to `assessment_sessions` + `curriculum_completed` to `student_profiles`
- [x] Migration 162: RPCs — `get_assessment_comparison`, `check_curriculum_completion`, `has_assessment_type`
- [x] No RLS policy changes needed (existing policies cover new column)

## Phase 2: Pre-Assessment Flow
- [x] `PreAssessmentPrompt` modal component (`components/assessment/PreAssessmentPrompt.tsx`)
- [x] Assessment start page accepts `?type=pre|post` param
- [x] `startAssessment()` action accepts `sessionType` parameter + duplicate check
- [x] Assessment summary shows type-specific messaging (pre/post/adaptive)
- [x] Dashboard shows pre-assessment prompt for new students

## Phase 3: Post-Assessment Flow
- [x] `check_curriculum_completion` RPC (mastery >= 70% in all 5 categories)
- [x] `PostAssessmentPrompt` modal component (`components/assessment/PostAssessmentPrompt.tsx`)
- [x] Assessment start page handles `?type=post`
- [x] Dashboard shows post-assessment prompt when curriculum completed

## Phase 4: Comparison Dashboard
- [x] `get_assessment_comparison` RPC returns pre vs post module scores
- [x] `AssessmentSummary` shows comparison bars for post-assessments
- [x] Per-category pre vs post progress bars with diff indicators

## Phase 5: Dashboard Integration
- [x] `getAssessmentStatus()` server action checks pre/post/curriculum status
- [x] Dashboard loads assessment status in parallel with other data
- [x] localStorage-based dismiss tracking (per session)
- [x] Empty state CTA directs to `/app/assessment/start?type=pre`

---

## Files Modified
- `apps/db/migrations/161_add_session_type_and_curriculum_completed.sql` (NEW)
- `apps/db/migrations/162_assessment_comparison_rpc.sql` (NEW)
- `apps/web/src/app/actions/assessment/assessment-submission.ts` (modified `startAssessment`)
- `apps/web/src/app/actions/assessment/assessment-status.ts` (NEW)
- `apps/web/src/app/actions/assessment/index.ts` (updated exports)
- `apps/web/src/app/app/assessment/start/page.tsx` (added `?type` param support)
- `apps/web/src/app/app/assessment/summary/page.tsx` (fetch comparison, pass to component)
- `apps/web/src/app/app/dashboard/page.tsx` (assessment prompts integration)
- `apps/web/src/components/assessment/PreAssessmentPrompt.tsx` (NEW)
- `apps/web/src/components/assessment/PostAssessmentPrompt.tsx` (NEW)
- `apps/web/src/components/assessment/AssessmentSummary.tsx` (comparison UI, type-specific messaging)

## Pending
- Run migrations 161 and 162 on Supabase
- Seed `irt_item_bank` with more questions if needed (currently 300 items)
