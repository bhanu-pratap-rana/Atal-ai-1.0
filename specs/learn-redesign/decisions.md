# Learn Redesign - Decisions Log

## ADR-001: Add Unit Hierarchy

**Date:** 2026-01-28
**Status:** Accepted

### Context
The current flat topic structure (Module → 10 Topics) is overwhelming for secondary school students. Users need logical groupings to understand their progress.

### Decision
Add a Unit layer: Module → Units (3 per module) → Topics (2-3 per unit)

### Rationale
- Better cognitive chunking for students
- Natural break points for study sessions
- Allows unit-level download (download all topics in a unit)
- Matches typical textbook structure students are familiar with

### Consequences
- Need new `units` database table
- Need to update all existing topics with `unit_id`
- Module page layout changes significantly

---

## ADR-002: Remove Static Mode

**Date:** 2026-01-28
**Status:** Accepted

### Context
Current system has dual modes: "Static" (from `curriculum_content` table) and "AI Mode" (dynamically generated). This is confusing for users.

### Decision
Remove static mode entirely. All content will be AI-generated.

### Rationale
- Simpler UX - no confusing toggle
- Consistent experience across all lessons
- AI content is more adaptive to student needs
- Static content becomes RAG source, not direct display

### Consequences
- Must ensure AI generation is reliable (fallback chain)
- Pre-generate and cache lessons for performance
- Need robust error handling if AI fails

---

## ADR-003: Keep Sequential Module Unlock

**Date:** 2026-01-28
**Status:** Accepted

### Context
User requested to keep the current sequential unlock system where all topics in a module must be mastered to unlock the next module.

### Decision
Keep sequential unlock. User must master all topics (score ≥ 70%) in Module N to unlock Module N+1.

### Rationale
- Ensures foundational knowledge before advancing
- Provides clear learning path
- Prevents students from skipping important basics
- Matches pedagogical best practices for sequential learning

### Consequences
- Students must complete all topics, no shortcuts
- May frustrate advanced students (future consideration: placement tests)

---

## ADR-004: Per-Topic Download with Language Selection

**Date:** 2026-01-28
**Status:** Accepted

### Context
Users need offline access to lessons. Need to decide download granularity and language handling.

### Decision
- Allow per-topic downloads (not just entire modules)
- Show language selection modal before download
- Make TTS audio optional to save data

### Rationale
- Per-topic gives users control over storage usage
- Language selection ensures user gets content in their preferred language
- Optional TTS is critical for rural users with limited data plans

### Consequences
- More complex download UI
- Need to track download status per topic per language
- Storage management becomes important feature

---

## ADR-005: No English Fallback for Translations

**Date:** 2026-01-28
**Status:** Accepted

### Context
Current system silently falls back to English when Hindi/Assamese content is missing. This confuses non-English speaking users.

### Decision
No silent fallback. If content is not available in selected language, show a clear message: "Content coming soon in [language]"

### Rationale
- Transparency with users
- Avoids confusion when content suddenly appears in English
- Incentivizes proper translation coverage
- Respects user's language preference

### Consequences
- Must ensure all content has translations before launch
- Need content coverage monitoring dashboard
- May need to accelerate translation efforts

---

## ADR-006: IndexedDB for Offline Storage

**Date:** 2026-01-28
**Status:** Accepted

### Context
Need to store downloaded lessons and progress data for offline use.

### Decision
Use Dexie.js with IndexedDB as primary storage, with Cache API as fallback for static assets.

### Rationale
- IndexedDB has larger storage limits than localStorage
- Dexie provides a cleaner API than raw IndexedDB
- Cache API works well for static assets (images, audio)
- Both are standard web APIs, widely supported

### Consequences
- Need to handle storage quota exceeded
- Need to provide storage management UI
- Data migration strategy needed for schema changes

---

## Future Decisions to Make

1. **Background Sync** - Should we use Service Worker for background sync?
2. **Content Updates** - How to notify users when newer content is available?
3. **Peer Sharing** - Should downloaded content be shareable via Bluetooth/WiFi Direct?
4. **Placement Tests** - Should advanced students be able to test out of modules?
