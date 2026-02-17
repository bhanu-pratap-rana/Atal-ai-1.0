# CLAUDE.md — ATAL AI

## Global Rules

- Always respect `rule.md` at the repo root. If this file and `rule.md` conflict, **`rule.md` wins**.
- Use **spec‑first development**: no implementation without a design spec.

## Where Things Live

| What                    | Where                                            |
|-------------------------|--------------------------------------------------|
| Web app (Next.js)       | `apps/web/src`                                  |
| Database migrations     | `apps/db/migrations`                            |
| AI Tutor API            | `apps/web/src/app/api/tutor/chat/route.ts`      |
| Voice & TTS             | `apps/web/src/components/voice/`, `apps/web/src/app/api/voice/tts` |
| Gamification            | `apps/web/src/components/gamification/`, `apps/web/src/lib/services/gamification-service.ts` |
| Offline / caching       | `apps/web/src/lib/offline/`                     |
| Lessons                 | `apps/web/src/app/app/learn/`                   |
| Student dashboard       | `apps/web/src/app/app/dashboard/page.tsx`       |
| Specs (design docs)     | `specs/` (see below)                            |

## Specs Directory

- All feature‑level design lives under `specs/<feature>/`.
- Each feature folder contains:
  - `CLAUDE.md` — how to work on this feature.
  - `design.md` — source of truth for behavior and architecture.
  - `implementation.md` — what’s done / in progress / blocked.
  - `decisions.md` — decision traces / ADRs.
  - `prompts.md` — reusable prompts for Claude Code.
  - `future-work.md` — accepted but deferred work.

### Rules for Using Specs

1. **Before coding** a feature, read:
   - Root `CLAUDE.md`
   - `rule.md`
   - `specs/<feature>/design.md`
   - `specs/<feature>/implementation.md`
2. If no `design.md` exists, ask to create/extend it before implementation.
3. Keep `implementation.md` up to date as work progresses.
4. Record non‑obvious choices in `decisions.md`.

## PR / Change Size Guideline

Every change should be reviewable in **under 10 minutes**:

- Max 5–7 files changed (excluding tests/cookbooks).
- Max ~500 lines changed.
- One focused concern per change.

If a change is larger, split it into smaller, sequential pieces.

## Don’t

- Don’t implement features that aren’t described in a `design.md`.
- Don’t invent new patterns when an existing one fits; reuse hooks/services/components where possible.
- Don’t add new tables or RLS policies without updating `docs/DATABASE.md` and the relevant spec.

