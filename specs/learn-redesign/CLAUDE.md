# Learn Redesign - Claude Instructions

## Quick Start

Before working on this feature:
1. Read `/specs/learn-redesign/design.md` - Full specification
2. Read `/specs/learn-redesign/implementation.md` - Current progress
3. Check `/specs/learn-redesign/decisions.md` - Design decisions made

## Key Files

| Area | Files |
|------|-------|
| **Learn Dashboard** | `apps/web/src/app/app/learn/page.tsx` |
| **Module View** | `apps/web/src/app/app/learn/[moduleId]/page.tsx` |
| **Lesson Page** | `apps/web/src/app/app/learn/[moduleId]/[topicId]/page.tsx` |
| **Offline System** | `apps/web/src/lib/offline/` |
| **Components** | `apps/web/src/components/learn/` |
| **DB Migrations** | `apps/db/migrations/` |

## Architecture Summary

```
Module → Units → Topics → AI-Generated Lesson
                              ↓
                    Download to IndexedDB
                              ↓
                    View Offline (same UI)
                              ↓
                    Sync Progress When Online
```

## Critical Rules

1. **No static mode** - All content is AI-generated
2. **No English fallback** - If language missing, show "Coming soon" message
3. **Offline-first mindset** - Always consider offline experience
4. **Per-topic downloads** - User controls what they download

## Common Tasks

### Adding a new unit

1. Add to `units` table via migration
2. Update topic `unit_id` references
3. Add translations for all 3 languages (en, hi, as)

### Modifying download behavior

1. Check `useOfflineLesson` hook in `hooks/useOfflineLesson.ts`
2. Check `DownloadModal` component
3. Check IndexedDB schema in `lib/offline/database.ts`

### Testing offline flow

1. Download a topic (use DevTools → Application → Storage to verify)
2. Go offline (DevTools → Network → Offline)
3. Navigate to downloaded topic
4. Complete lesson and quiz
5. Go online
6. Verify sync happens automatically

## Don't

- Don't add fallback to English when translation missing
- Don't allow lesson viewing without download when offline
- Don't bypass the unit hierarchy
- Don't store sensitive data unencrypted in IndexedDB
