# Learn Page Redesign - Design Specification

## Overview

Redesign the Learn page to introduce a Unit hierarchy, unify content delivery to AI-only mode, and provide robust offline download capabilities with language selection. The goal is to create a seamless learning experience for secondary school students in rural India, whether online or offline.

## Problem Statement

Current issues:
1. **Flat topic structure** - No logical grouping; 10 topics per module is overwhelming
2. **Dual content modes** - Confusing "Static" vs "AI Mode" toggle
3. **Limited offline support** - Pre-caching exists but no explicit user-controlled download
4. **Language fallback issues** - Silently falls back to English, confusing for non-English users
5. **No offline activity sync** - Progress made offline doesn't sync when online

## Goals

1. Add **Module → Units → Topics** hierarchy for better cognitive chunking
2. Remove static mode; use **AI-generated content only**
3. Provide **explicit download UI** per topic with language selection
4. Enable **offline activity sync** when connectivity returns
5. Make **TTS download optional** to save data

---

## Proposed Architecture

### Content Hierarchy

```
Module (M1-M5)
  └── Unit (U1.1, U1.2, U1.3)
        └── Topic (T1.1.1, T1.1.2)
              └── AI-Generated Lesson
                    ├── Concept chunks
                    ├── Example chunks
                    ├── Practice questions
                    └── Checkpoint quizzes
```

**Example:**
```
M1: Computer Basics
├── U1.1: What is a Computer?
│   ├── T1.1.1: The Four Jobs of a Computer
│   └── T1.1.2: Input and Output Devices
├── U1.2: Hardware Components
│   ├── T1.2.1: CPU and Memory
│   └── T1.2.2: Storage Devices
└── U1.3: Software Basics
    ├── T1.3.1: Operating Systems Overview
    └── T1.3.2: Applications vs System Software
```

---

## Page Flow

### 1. Learn Dashboard (`/app/learn`)

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard          [EN] [हिं] [অস]              │
├─────────────────────────────────────────────────────────────┤
│  Your Learning Path                                         │
│  Master digital literacy, one module at a time              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │ 0%       │ │ 260      │ │ 1        │                    │
│  │ Progress │ │ Points   │ │ Day Streak│                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
├─────────────────────────────────────────────────────────────┤
│  AI Recommendations for You                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Continue: "The Four Jobs of a Computer" → [Start]   │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Modules                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💻 Computer Basics              3 Units | 0/6 done  │   │
│  │ कंप्यूटर की मूल बातें                               │   │
│  │ [Start Module]                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🖥️ Operating Systems 🔒          3 Units | 0/6 done │   │
│  │ Complete Module 1 to unlock                          │   │
│  └─────────────────────────────────────────────────────┘   │
│  [... More modules ...]                                     │
└─────────────────────────────────────────────────────────────┘
```

**Key Changes:**
- Shows unit count instead of topic count in module card
- Language selector affects all displayed text
- Locked modules show clear unlock requirement

---

### 2. Module View (`/app/learn/[moduleId]`)

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Learning Path       [EN] [हिं] [অস]             │
├─────────────────────────────────────────────────────────────┤
│  💻 Computer Basics                                         │
│  कंप्यूटर की मूल बातें                                     │
│  Learn about computers, hardware, and software fundamentals │
│                                                             │
│  [Download All for Offline ↓]    Progress: 2/6 topics      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📖 Unit 1: What is a Computer?                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✅ T1.1.1: Four Jobs of a Computer    [↓] [→]      │   │
│  │    Mastered • 5 min                                  │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 🔵 T1.1.2: Input & Output Devices     [↓] [→]      │   │
│  │    In Progress • 5 min                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📖 Unit 2: Hardware Components                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⚪ T1.2.1: CPU and Memory             [↓] [→]      │   │
│  │    Not Started • 5 min                               │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ⚪ T1.2.2: Storage Devices            [↓] [→]      │   │
│  │    Not Started • 5 min                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📖 Unit 3: Software Basics                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⚪ T1.3.1: Operating Systems Overview [↓] [→]      │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ⚪ T1.3.2: Applications vs System     [↓] [→]      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Legend:
  [↓] = Download for offline
  [→] = Go to lesson
  ✅ = Mastered (score ≥ 70%)
  🔵 = In Progress
  ⚪ = Not Started
```

**Key Features:**
- Topics grouped by Unit
- Per-topic download button
- "Download All" button for entire module
- Progress shown per topic
- All text in selected language

---

### 3. Download Modal

When user clicks download button:

```
┌─────────────────────────────────────────────────────────┐
│  Download: "The Four Jobs of a Computer"                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Select language:                                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                   │
│  │ English │ │  हिंदी  │ │ অসমীয়া │                   │
│  │   ✓     │ │         │ │         │                   │
│  └─────────┘ └─────────┘ └─────────┘                   │
│                                                         │
│  Include voice audio? (uses more storage)               │
│  ┌──────────────────────────────────────────┐          │
│  │ ☐ Yes, include TTS audio (~5 MB extra)  │          │
│  └──────────────────────────────────────────┘          │
│                                                         │
│  Estimated download size: ~2 MB                         │
│                                                         │
│  ┌────────────┐  ┌────────────┐                        │
│  │  Cancel    │  │  Download  │                        │
│  └────────────┘  └────────────┘                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 4. Lesson Page (`/app/learn/[moduleId]/[topicId]`)

No dual mode. Always AI-generated content:

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Module    T1.1.1: Four Jobs    [🔊 Voice] [↓]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────┐ ┌───────┐ │
│  │                                             │ │ AI    │ │
│  │   AI-Generated Lesson Content               │ │ Tutor │ │
│  │                                             │ │       │ │
│  │   [Concept] → [Example] → [Practice]        │ │ Ask   │ │
│  │                                             │ │ me    │ │
│  │   ━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━           │ │ any-  │ │
│  │   Progress: 3/5 chunks                      │ │ thing │ │
│  │                                             │ │       │ │
│  │   "A computer has four main jobs..."        │ │       │ │
│  │                                             │ │       │ │
│  │   [← Previous]          [Next →]            │ │       │ │
│  │                                             │ └───────┘ │
│  └─────────────────────────────────────────────┘           │
│                                                             │
│  [Complete & Quiz →]                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Offline System

### Download Flow

```
User clicks Download
       │
       ▼
┌─────────────────────┐
│ Show language modal │
│ + TTS option        │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Generate AI lesson  │ ← If not already cached
│ (or fetch cached)   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Generate TTS audio  │ ← If user selected TTS
│ (or skip)           │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Store in IndexedDB: │
│ - Lesson JSON       │
│ - Practice questions│
│ - Images (base64)   │
│ - TTS audio (opt)   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Show success toast  │
│ "Available offline" │
└─────────────────────┘
```

### Offline Data Structure (IndexedDB)

```typescript
// lib/offline/database.ts - Enhanced

interface OfflineLesson {
  // Keys
  id: string; // `${moduleId}:${topicId}:${language}`
  moduleId: string;
  topicId: string;
  unitId: string;
  language: SupportedLanguage;

  // Content
  lesson: GeneratedLesson;
  practiceQuestions: PracticeQuestion[];
  images: Map<string, string>; // description → base64

  // Optional
  ttsAudio?: ArrayBuffer;

  // Metadata
  downloadedAt: Date;
  version: string; // For future content updates
}

interface OfflineProgress {
  id: string; // `${topicId}:${studentId}`
  topicId: string;
  studentId: string;

  // Progress data
  lessonProgress: {
    currentChunk: number;
    completedChunks: number[];
    startedAt: Date;
  };

  quizProgress: {
    answers: Map<string, number>; // questionId → selectedIndex
    score?: number;
    completedAt?: Date;
  };

  // Sync status
  needsSync: boolean;
  lastSynced?: Date;
}

interface SyncQueue {
  id: number;
  type: 'lesson_complete' | 'quiz_submit' | 'progress_update';
  payload: Record<string, unknown>;
  createdAt: Date;
  retries: number;
  lastError?: string;
}
```

### Sync Flow (When Online)

```
App comes online
       │
       ▼
┌─────────────────────┐
│ Check sync queue    │
└─────────┬───────────┘
          │
          ▼ (for each queued item)
┌─────────────────────┐
│ POST to API:        │
│ - /api/progress/sync│
│ - /api/quiz/submit  │
└─────────┬───────────┘
          │
          ▼ (on success)
┌─────────────────────┐
│ Remove from queue   │
│ Update local cache  │
│ Award points        │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Show sync toast     │
│ "Progress synced!"  │
└─────────────────────┘
```

---

## Database Changes

### New Table: `units`

```sql
-- Migration: create_units_table.sql

CREATE TABLE units (
  id TEXT PRIMARY KEY, -- U1.1, U1.2, etc.
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

  -- Trilingual content
  name_en TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  name_as TEXT NOT NULL,
  description_en TEXT,
  description_hi TEXT,
  description_as TEXT,

  -- Metadata
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_unit_order UNIQUE (module_id, display_order)
);

-- Add unit_id to topics table
ALTER TABLE topics ADD COLUMN unit_id TEXT REFERENCES units(id);

-- Index for efficient queries
CREATE INDEX idx_units_module ON units(module_id, display_order);
CREATE INDEX idx_topics_unit ON topics(unit_id, display_order);

-- RLS policies
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Units are viewable by all authenticated users"
ON units FOR SELECT
TO authenticated
USING (is_active = true);
```

### Seed Data: Units

```sql
-- Seed: units_seed.sql

INSERT INTO units (id, module_id, name_en, name_hi, name_as, display_order) VALUES
-- Module 1: Computer Basics
('U1.1', 'M1', 'What is a Computer?', 'कंप्यूटर क्या है?', 'কম্পিউটাৰ কি?', 1),
('U1.2', 'M1', 'Hardware Components', 'हार्डवेयर घटक', 'হাৰ্ডৱেৰ উপাদান', 2),
('U1.3', 'M1', 'Software Basics', 'सॉफ्टवेयर की मूल बातें', 'চফটৱেৰৰ মৌলিক কথা', 3),

-- Module 2: Operating Systems
('U2.1', 'M2', 'Understanding Operating Systems', 'ऑपरेटिंग सिस्टम को समझना', 'অপাৰেটিং চিষ্টেম বুজা', 1),
('U2.2', 'M2', 'File Management', 'फाइल प्रबंधन', 'ফাইল পৰিচালনা', 2),
('U2.3', 'M2', 'System Settings', 'सिस्टम सेटिंग्स', 'চিষ্টেম ছেটিংছ', 3),

-- Module 3: Internet Basics
('U3.1', 'M3', 'How the Internet Works', 'इंटरनेट कैसे काम करता है', 'ইন্টাৰনেট কেনেকৈ কাম কৰে', 1),
('U3.2', 'M3', 'Web Browsing', 'वेब ब्राउज़िंग', 'ৱেব ব্ৰাউজিং', 2),
('U3.3', 'M3', 'Online Safety', 'ऑनलाइन सुरक्षा', 'অনলাইন সুৰক্ষা', 3),

-- Module 4: Digital Communication
('U4.1', 'M4', 'Email Basics', 'ईमेल की मूल बातें', 'ইমেইলৰ মৌলিক কথা', 1),
('U4.2', 'M4', 'Messaging Apps', 'मैसेजिंग ऐप्स', 'মেছেজিং এপছ', 2),
('U4.3', 'M4', 'Video Calls', 'वीडियो कॉल', 'ভিডিঅ' কল', 3),

-- Module 5: Local Technology
('U5.1', 'M5', 'Digital Payments', 'डिजिटल भुगतान', 'ডিজিটেল পেমেন্ট', 1),
('U5.2', 'M5', 'Government Services', 'सरकारी सेवाएं', 'চৰকাৰী সেৱা', 2),
('U5.3', 'M5', 'Local Apps', 'स्थानीय ऐप्स', 'স্থানীয় এপছ', 3);
```

### Update Topics with unit_id

```sql
-- Update existing topics to assign unit_id

-- Module 1 topics
UPDATE topics SET unit_id = 'U1.1' WHERE id IN ('T1.1', 'T1.2');
UPDATE topics SET unit_id = 'U1.2' WHERE id IN ('T1.3', 'T1.4');
UPDATE topics SET unit_id = 'U1.3' WHERE id IN ('T1.5', 'T1.6', 'T1.7');
-- ... continue for all topics
```

---

## API Endpoints

### New Endpoints

```typescript
// GET /api/modules/[moduleId]/units
// Returns all units with their topics for a module

interface UnitsResponse {
  module: ModuleWithTranslations;
  units: Array<{
    id: string;
    name: string; // In requested language
    description: string;
    topics: Array<{
      id: string;
      name: string;
      duration: number;
      status: 'not_started' | 'in_progress' | 'mastered';
      masteryScore?: number;
      isDownloaded: boolean;
    }>;
  }>;
}

// POST /api/lesson/download
// Generates and packages lesson for offline

interface DownloadRequest {
  moduleId: string;
  topicId: string;
  language: SupportedLanguage;
  includeTTS: boolean;
}

interface DownloadResponse {
  lesson: GeneratedLesson;
  practiceQuestions: PracticeQuestion[];
  images: Array<{ description: string; base64: string }>;
  ttsAudio?: string; // base64 encoded audio
  estimatedSize: number; // bytes
}

// POST /api/progress/sync
// Syncs offline progress to server

interface SyncRequest {
  items: Array<{
    type: 'lesson_complete' | 'quiz_submit';
    topicId: string;
    moduleId: string;
    data: {
      completedAt: string;
      score?: number;
      answers?: Record<string, number>;
    };
    timestamp: string;
  }>;
}

interface SyncResponse {
  synced: number;
  failed: Array<{ index: number; error: string }>;
  pointsAwarded: number;
  badgesEarned: Badge[];
}
```

---

## Component Structure

```
apps/web/src/components/learn/
├── LearnDashboard/
│   ├── LearnHeader.tsx
│   ├── ProgressStats.tsx
│   ├── ModuleCard.tsx           # Updated: shows unit count
│   └── AdaptiveRecommendations.tsx
│
├── ModuleView/
│   ├── ModuleHeader.tsx
│   ├── UnitAccordion.tsx        # NEW: expandable unit groups
│   ├── TopicRow.tsx             # NEW: topic with download/status
│   └── DownloadAllButton.tsx    # NEW: download entire module
│
├── Download/
│   ├── DownloadModal.tsx        # NEW: language + TTS selection
│   ├── DownloadProgress.tsx     # NEW: progress indicator
│   └── OfflineIndicator.tsx     # NEW: shows if topic available offline
│
├── Lesson/
│   ├── LessonPlayer.tsx         # Existing, remove static mode
│   ├── LessonChunk.tsx
│   ├── PracticeQuiz.tsx
│   └── OfflineBanner.tsx        # NEW: shows when viewing offline
│
└── shared/
    ├── LanguageSelector.tsx     # Existing
    └── SyncStatusBar.tsx        # NEW: shows sync status
```

---

## State Management

### Offline State Hook

```typescript
// hooks/useOfflineLesson.ts

interface UseOfflineLessonReturn {
  // Download
  downloadLesson: (options: DownloadOptions) => Promise<void>;
  downloadProgress: number; // 0-100
  isDownloading: boolean;

  // Check availability
  isAvailableOffline: (topicId: string, language: string) => boolean;
  getDownloadedLanguages: (topicId: string) => SupportedLanguage[];

  // Load offline content
  loadOfflineLesson: (topicId: string, language: string) => Promise<OfflineLesson | null>;

  // Sync
  pendingSyncCount: number;
  syncProgress: () => Promise<SyncResult>;
  isSyncing: boolean;

  // Delete
  deleteOfflineLesson: (topicId: string, language: string) => Promise<void>;
  clearAllOffline: () => Promise<void>;
  getStorageUsed: () => Promise<number>; // bytes
}

export function useOfflineLesson(): UseOfflineLessonReturn {
  // Implementation using Dexie + Cache API
}
```

### Online/Offline Detection

```typescript
// hooks/useNetworkStatus.ts

interface UseNetworkStatusReturn {
  isOnline: boolean;
  wasOffline: boolean; // True if was offline earlier in session
  connectionType: 'wifi' | 'cellular' | 'unknown';
}

export function useNetworkStatus(): UseNetworkStatusReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Trigger sync
        triggerBackgroundSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline, connectionType: getConnectionType() };
}
```

---

## Migration Plan

### Phase 1: Database & API (Week 1)

1. Create `units` table migration
2. Seed unit data for all 5 modules
3. Update existing topics with `unit_id`
4. Create `/api/modules/[moduleId]/units` endpoint
5. Update existing lesson generation to remove static mode check

### Phase 2: Module View Redesign (Week 2)

1. Build `UnitAccordion` component
2. Build `TopicRow` component
3. Update `/app/learn/[moduleId]/page.tsx` to use new components
4. Add download button to each topic row

### Phase 3: Download System (Week 3)

1. Build `DownloadModal` component
2. Implement `useOfflineLesson` hook
3. Create `/api/lesson/download` endpoint
4. Add offline storage using Dexie
5. Build `OfflineIndicator` component

### Phase 4: Offline Sync (Week 4)

1. Implement sync queue in IndexedDB
2. Create `/api/progress/sync` endpoint
3. Build `SyncStatusBar` component
4. Add automatic sync on network restore
5. Handle conflict resolution

### Phase 5: Polish & Testing (Week 5)

1. Add loading states and error handling
2. Implement "Download All" for modules
3. Add storage management UI
4. Test offline flow end-to-end
5. Performance optimization

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Offline usage rate | <5% | 30%+ |
| Download completion rate | N/A | 90%+ |
| Sync success rate | N/A | 99%+ |
| Average download size | N/A | <3 MB/topic |
| Time to download topic | N/A | <5 seconds on 3G |

---

## Edge Cases & Error Handling

### Download Errors

| Scenario | Handling |
|----------|----------|
| Network fails mid-download | Save partial, retry from last checkpoint |
| Storage full | Show clear message with "Manage Storage" link |
| AI generation fails | Retry 2x, then fallback to cached/static if available |
| TTS generation fails | Download without audio, notify user |

### Sync Errors

| Scenario | Handling |
|----------|----------|
| Server rejects stale data | Keep local, mark as conflict, notify user |
| Network timeout | Queue for retry with exponential backoff |
| Duplicate submission | Dedupe on server using idempotency key |

### Offline Mode

| Scenario | Handling |
|----------|----------|
| User opens un-downloaded topic offline | Show "Download required" message |
| AI Tutor not available offline | Show "Limited offline mode" banner |
| User completes quiz offline | Store locally, sync later |

---

## Security Considerations

1. **Downloaded content validation** - Verify integrity with checksums
2. **Sync authentication** - Refresh token if expired before sync
3. **Data encryption** - Encrypt sensitive data in IndexedDB (optional for MVP)
4. **Rate limiting** - Limit bulk downloads to prevent abuse

---

## Accessibility

1. **Download progress** - Announce via aria-live
2. **Offline indicator** - Clear visual + screen reader label
3. **Language selection** - Keyboard navigable
4. **Sync status** - Toast + persistent indicator for screen readers

---

## Future Considerations

1. **Background sync** - Use Service Worker for background sync
2. **Selective sync** - Smart sync based on network type
3. **Content updates** - Notify when newer content available
4. **Peer sharing** - Share downloaded content locally (Bluetooth/WiFi Direct)
5. **Compression** - Use GZIP for smaller downloads

---

## References

- [IndexedDB Best Practices](https://web.dev/indexeddb-best-practices/)
- [Offline-First Web Apps](https://offlinefirst.org/)
- [Service Worker Sync](https://developer.chrome.com/docs/workbox/modules/workbox-background-sync/)
- [Dexie.js Documentation](https://dexie.org/)
