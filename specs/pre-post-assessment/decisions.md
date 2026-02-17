# Pre/Post Assessment — Decisions

## ADR-001: Extend `assessment_sessions` vs. new table

**Decision:** Add `session_type` column to existing `assessment_sessions` table.

**Alternatives considered:**
1. **New `pre_post_assessments` table** — Rejected. Would duplicate schema and require a parallel submission flow.
2. **Separate `assessment_type` lookup table** — Over-engineered for 3 values.

**Rationale:**
- Only 3 session types needed (`pre`, `adaptive`, `post`)
- Existing `submit_assessment` RPC works unchanged
- Default value `'adaptive'` preserves backward compatibility with 108 existing sessions
- Single index `(user_id, session_type)` handles all queries

---

## ADR-002: Curriculum completion detection — mastery-based

**Decision:** A student has "completed the curriculum" when all 5 IRT categories reach `mastery_score >= 70` in `student_knowledge_state`.

**Alternatives considered:**
1. **Lesson count threshold** (80% of lessons completed) — Requires accurate lesson tracking, which isn't fully in place.
2. **Time-based** (X hours of learning) — Doesn't measure actual learning.
3. **Teacher-triggered** — Adds manual overhead.

**Rationale:**
- Aligns with existing IRT model and `student_knowledge_state` table
- Objectively measurable
- Already tracked per-topic by the adaptive learning system
- 70% threshold matches "mastered" status convention

---

## ADR-003: Pre-assessment is skippable

**Decision:** Students can dismiss the pre-assessment prompt and start learning directly.

**Rationale:**
- Forcing an assessment before any learning may discourage new/anxious students
- If skipped, they simply start at the default beginner level
- "Skip for now" state stored in localStorage (not database) to avoid schema bloat
- Comparison view gracefully handles missing pre-assessment ("Take pre-assessment to see your starting level")
