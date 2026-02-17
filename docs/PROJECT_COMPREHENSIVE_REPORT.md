# ATAL AI - Comprehensive Project Report

**Document Version:** 1.0
**Date:** February 7, 2026
**Project:** ATAL AI - Digital Literacy Educational Platform

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Database Design](#5-database-design)
6. [Authentication & Security](#6-authentication--security)
7. [Learning Module System](#7-learning-module-system)
8. [AI Tutoring System](#8-ai-tutoring-system)
9. [Voice & Text-to-Speech](#9-voice--text-to-speech)
10. [Assessment System](#10-assessment-system)
11. [Gamification System](#11-gamification-system)
12. [Teacher Features](#12-teacher-features)
13. [Admin Features](#13-admin-features)
14. [Offline Capabilities](#14-offline-capabilities)
15. [Performance Optimizations](#15-performance-optimizations)
16. [Security Measures](#16-security-measures)
17. [Future Scope](#17-future-scope)

---

## 1. Executive Summary

ATAL AI is a comprehensive **digital literacy educational platform** designed specifically for secondary school students in rural Northeast India. The platform combines modern web technologies with culturally-aware AI tutoring to deliver personalized, adaptive learning experiences in three languages: **English**, **Hindi (हिंदी)**, and **Assamese (অসমীয়া)**.

### Key Highlights

| Aspect | Details |
|--------|---------|
| **Target Audience** | Rural Indian secondary school students (Classes 6-12) |
| **Languages Supported** | English, Hindi, Assamese |
| **Core Technology** | Next.js 16, Supabase, Google Gemini AI |
| **Deployment** | Progressive Web App (PWA) with offline support |
| **Learning Approach** | Adaptive microlearning with AI tutoring |
| **Cultural Focus** | Assamese heritage-themed badges and content |

### Platform Statistics

- **5 Learning Modules** covering digital literacy fundamentals
- **19 Units** with progressive difficulty
- **50 Topics** with multilingual content
- **750 Curriculum Content Rows** (RAG-enabled)
- **300+ IRT-Calibrated Assessment Items**
- **10 Cultural Badges** celebrating Assamese heritage
- **30 Database Tables** with comprehensive RLS policies

---

## 2. Project Overview

### 2.1 Mission Statement

ATAL AI aims to bridge the digital divide in rural India by providing accessible, culturally-relevant digital literacy education through AI-powered personalized learning.

### 2.2 Target Users

| User Type | Description | Key Features |
|-----------|-------------|--------------|
| **Students** | Rural secondary school students | Learn digital skills, take assessments, earn badges |
| **Teachers** | School teachers managing classes | Monitor progress, share materials, view analytics |
| **Admins** | School administrators | Manage PINs, oversee system, monitor performance |

### 2.3 Core Value Propositions

1. **Accessibility**: Works offline after initial download (PWA)
2. **Multilingual**: Full support for English, Hindi, Assamese
3. **Adaptive**: AI adjusts content based on learning style and mastery
4. **Cultural**: Celebrates Assamese heritage through badges and examples
5. **Voice-First**: Voice input/output for students with limited typing skills
6. **Socratic Method**: AI uses guided questions rather than direct answers

### 2.4 Project Structure

```
Atal-ai-1.0/
├── apps/
│   ├── web/                    # Next.js 16 web application
│   │   ├── src/
│   │   │   ├── app/           # App Router pages & API routes
│   │   │   ├── components/    # React components (19 folders)
│   │   │   ├── lib/           # Utilities & services (42 files)
│   │   │   ├── hooks/         # Custom React hooks (18 hooks)
│   │   │   └── types/         # TypeScript definitions
│   │   └── tests/             # Playwright E2E tests
│   └── db/                    # Database migrations (157 files)
├── docs/                      # Documentation
├── specs/                     # Design specifications
├── supabase/                  # Local Supabase config
└── scripts/                   # Build & deployment scripts
```

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 16 App (React 19)                                      │
│  ├── App Router (Server Components + Client Components)         │
│  ├── PWA with Service Worker (Offline Support)                  │
│  ├── IndexedDB (Dexie) for local storage                        │
│  └── Web Speech API (Voice Input/Output)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  Next.js API Routes + Server Actions                            │
│  ├── Authentication Middleware                                   │
│  ├── Rate Limiting (Distributed Token Bucket)                   │
│  ├── Input Validation (Zod Schemas)                             │
│  └── Error Handling & Logging                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SERVICE LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  ├── AI Service (Gemini, Groq fallback)                         │
│  ├── RAG Service (pgvector similarity search)                   │
│  ├── Gamification Service (badges, points, streaks)             │
│  ├── TTS Service (Google Cloud + Browser fallback)              │
│  └── Adaptive Learning Service (VARK + Knowledge State)         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  Supabase PostgreSQL                                            │
│  ├── 30 Tables with Row-Level Security (RLS)                    │
│  ├── 57 Database Functions (12 Triggers + 45 RPCs)              │
│  ├── pgvector Extension (768-dim embeddings)                    │
│  ├── Real-time Subscriptions                                    │
│  └── 2 Storage Buckets (lesson-assets)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│  ├── Google Gemini 2.5 Flash (Primary AI)                       │
│  ├── Groq (Fallback AI)                                         │
│  ├── Google Cloud TTS (Voice Synthesis)                         │
│  ├── Google Vertex AI (Image Generation)                        │
│  └── Sentry (Error Monitoring)                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Request Flow

```
User Action
    │
    ▼
┌─────────────────┐
│ Next.js Client  │──► Service Worker (if offline)
└────────┬────────┘              │
         │                       ▼
         │              IndexedDB Cache
         ▼                       │
┌─────────────────┐              │
│  API Route or   │◄─────────────┘
│  Server Action  │
└────────┬────────┘
         │
         ├──► Authentication Check (getCurrentUser)
         ├──► Rate Limiting Check
         ├──► Input Validation (Zod)
         │
         ▼
┌─────────────────┐
│ Business Logic  │
│   (Services)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Supabase      │
│   Database      │
└─────────────────┘
```

---

## 4. Technology Stack

### 4.1 Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.10 | React framework with App Router |
| **React** | 19.2.1 | UI library |
| **TypeScript** | 5.9.3 | Type-safe JavaScript |
| **Tailwind CSS** | 4.x | Utility-first styling |
| **shadcn/ui** | Latest | Pre-built accessible components |
| **Framer Motion** | 12.23.24 | Animations |
| **Radix UI** | Various | Accessible primitives |
| **Lucide React** | Latest | Icon library |
| **React Hook Form** | 7.66.0 | Form management |
| **Zod** | 3.24.0 | Schema validation |

### 4.2 Backend Technologies

| Technology | Purpose |
|------------|---------|
| **Supabase** | Database, Auth, Storage, Realtime |
| **PostgreSQL** | Primary database (via Supabase) |
| **pgvector** | Vector similarity search for RAG |
| **Edge Functions** | Serverless compute |

### 4.3 AI & ML Technologies

| Technology | Purpose |
|------------|---------|
| **Google Gemini 2.5 Flash** | Primary AI model for tutoring |
| **Groq (Llama 3.3 70B)** | Fallback AI provider |
| **Vercel AI SDK** | Streaming AI responses |
| **Google text-embedding-004** | Text embeddings for RAG |
| **Google Vertex AI** | Image generation (Imagen 3) |

### 4.4 Voice Technologies

| Technology | Purpose |
|------------|---------|
| **Web Speech API** | Browser-native speech recognition |
| **Google Cloud TTS** | High-quality voice synthesis |
| **SpeechSynthesis API** | Browser fallback for TTS |

### 4.5 DevOps & Quality

| Technology | Purpose |
|------------|---------|
| **Playwright** | End-to-end testing |
| **Jest** | Unit testing |
| **ESLint** | Code linting |
| **SonarQube** | Code quality analysis |
| **Sentry** | Error monitoring |
| **Turbopack** | Fast builds (Next.js bundler) |

---

## 5. Database Design

### 5.1 Database Statistics

| Metric | Value |
|--------|-------|
| **Total Tables** | 30 |
| **Total Rows** | ~1,037 |
| **Applied Migrations** | 157 |
| **RLS Policies** | 92 public + 3 storage |
| **Database Functions** | 57 (12 triggers + 45 RPCs) |
| **Active Extensions** | 8 |

### 5.2 Core Database Tables

#### User & Authentication Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `users` | Core auth linked to Supabase | id, email, role |
| `student_profiles` | Student demographics | user_id, name, school_name, class_name |
| `teacher_profiles` | Teacher details | user_id, school_id, subject |
| `schools` | Assam school registry (393 schools) | school_code, school_name, district |
| `school_staff_credentials` | PIN-based authentication | school_id, pin_hash |

#### Curriculum Tables

| Table | Rows | Purpose |
|-------|------|---------|
| `modules` | 5 | Core curriculum modules (M1-M5) |
| `units` | 19 | Learning subdivisions |
| `topics` | 50 | Individual lesson topics |
| `curriculum_content` | 750 | RAG content with vector embeddings |
| `practice_questions` | 450 | In-lesson MCQ questions |
| `irt_item_bank` | 300 | IRT-calibrated assessment items |

#### Progress & Assessment Tables

| Table | Purpose |
|-------|---------|
| `student_knowledge_state` | Per-topic mastery tracking |
| `learning_style_profile` | VARK preferences |
| `assessment_sessions` | Assessment lifecycle |
| `assessment_responses` | Individual Q&A responses |
| `formative_responses` | Practice question responses |

#### Gamification Tables

| Table | Purpose |
|-------|---------|
| `badges` | 10 badge definitions |
| `student_badges` | Earned badges per student |
| `points_history` | Points transaction ledger |

### 5.3 Entity Relationship Overview

```
USERS
  │
  ├──► student_profiles ──► enrollments ──► classes ◄── teacher_profiles
  │         │                                  │
  │         ▼                                  ▼
  │    student_knowledge_state          class_announcements
  │    learning_style_profile           class_materials
  │    student_badges
  │    points_history
  │    ai_tutor_interactions
  │
  └──► assessment_sessions ──► assessment_responses

CURRICULUM
  modules ──► units ──► topics ──► curriculum_content (750 RAG rows)
                          │
                          ├──► practice_questions
                          ├──► generated_lessons
                          └──► irt_item_bank
```

### 5.4 Key Database Functions (RPCs)

| Function | Purpose |
|----------|---------|
| `match_curriculum_content_simple` | RAG vector similarity search |
| `submit_assessment` | Atomic assessment submission |
| `update_progress_atomic` | Race-condition-free progress updates |
| `get_class_leaderboard` | Optimized leaderboard query |
| `get_student_total_points` | Efficient points aggregation |
| `batch_check_and_award_badges` | Batch badge verification |

---

## 6. Authentication & Security

### 6.1 User Types & Authentication Methods

| User Type | Auth Methods | Special Features |
|-----------|--------------|------------------|
| **Students** | Email OTP, Phone OTP, Anonymous | Class joining via PIN+Code |
| **Teachers** | Email OTP, School code verification | PIN-based staff auth |
| **Admins** | Email + Password | Super admin elevation |

### 6.2 Authentication Flow

```
STUDENT REGISTRATION:
1. Enter Email/Phone
2. Receive OTP (6-digit, 10-min expiry)
3. Verify OTP
4. Set Password (NIST 2025 compliant)
5. Create Profile
6. Join Class (PIN + 6-char Code)

TEACHER REGISTRATION:
1. Email OTP verification
2. School code verification (from registry)
3. Create profile with school affiliation
4. Receive staff PIN from admin
```

### 6.3 Security Measures

| Security Layer | Implementation |
|----------------|----------------|
| **Rate Limiting** | Distributed token bucket algorithm |
| **Input Validation** | Zod schemas on all endpoints |
| **Row-Level Security** | 92 RLS policies across all tables |
| **PIN Security** | bcrypt hashing, secure RNG |
| **Session Management** | Supabase SSR with HttpOnly cookies |
| **CORS/CSRF** | Server action signature validation |
| **Sensitive Data Masking** | Automatic masking in logs |

### 6.4 Role-Based Access Control

```typescript
Roles:
- super_admin: All operations
- admin: School PIN management
- teacher: Class and student management
- student: Learning features only

Authorization Checks:
- verifyAdminAuth() → Requires admin or super_admin
- verifySuperAdminAuth() → Requires super_admin only
- verifyTeacherAuth() → Checks teacher_profiles
- verifyStudentAuth() → Checks student_profiles
- verifyClassOwnership() → Ensures teacher owns class
```

---

## 7. Learning Module System

### 7.1 Curriculum Structure

```
MODULE (5 total: M1-M5)
├── Digital Device Fundamentals
├── Internet & Web Basics
├── Digital Content Creation
├── Online Safety & Security
└── Digital Citizenship

Each Module contains:
├── 3-4 Units
└── 8-12 Topics per module

Each Topic contains:
├── Microlearning lesson (5-7 chunks, 15-25 min)
├── Practice questions
├── AI tutor context
└── Progress tracking
```

### 7.2 Learning Flow

```
1. User enters /app/learn
   ├── View all modules with progress bars
   ├── Progressive unlock (complete M1 → unlock M2)
   └── See overall stats (points, streak, completion %)

2. User clicks module → /app/learn/[moduleId]
   ├── View all units (collapsible accordions)
   ├── See topics with mastery scores
   └── Download for offline access

3. User clicks topic → /app/learn/[moduleId]/[topicId]
   ├── Dynamic AI-generated lesson OR
   ├── Static curriculum content (fallback)
   ├── Practice questions with explanations
   ├── AI tutor sidebar (text/voice)
   └── Progress saved on completion
```

### 7.3 AI Lesson Generation

```
POST /api/lesson/generate
├── Authentication + Rate limiting (20/10min)
├── Cache check (7-day expiry, version checking)
├── RAG content retrieval (vector search)
├── AI generation (Gemini with streaming)
├── Zod validation of AI response
├── Fallback tiers if AI fails
└── Cache storage with onConflict handling

Response Structure:
{
  moduleId, topicId, language,
  title, description, totalDuration,
  chunks: [
    { type: "concept", duration: "3 min", heading, content },
    { type: "example", duration: "2 min", ... },
    { type: "practice", duration: "3 min", ... },
    { type: "checkpoint", checkpointQuestion: { ... } }
  ]
}
```

### 7.4 RAG (Retrieval-Augmented Generation)

```
CURRICULUM_CONTENT Table (750 rows):
├── 50 topics × 5 content types × 3 languages
├── Content types: definition, curriculum, cultural_context, example, exercise
├── 768-dimensional vector embeddings (text-embedding-004)
└── pgvector similarity search

Search Methods:
1. Vector Similarity: <#> inner product for normalized embeddings
2. Direct Topic Query: When topic known (faster)
3. Hybrid Search: Vector + keyword matching
4. Cross-lingual Fallback: If language unavailable, use English
```

### 7.5 Progress Tracking

```
STUDENT_KNOWLEDGE_STATE Table:
├── student_id + module_id + topic_id (unique)
├── mastery_score: 0-100 (Bayesian calculation)
├── confidence_level: low/medium/high
├── attempts: Total tries
├── time_spent_seconds
├── status: not_started → in_progress → completed → mastered

Mastery Thresholds:
- ≥70%: Topic considered "completed"
- ≥85%: Topic considered "mastered"
- <40%: Student flagged as "at-risk"
```

---

## 8. AI Tutoring System

### 8.1 Socratic Method Implementation

The AI tutor uses a **research-backed Socratic approach** (5x engagement vs direct answers):

```
BAD Response (Direct Answer):
"A computer is an electronic device that processes data..."

GOOD Response (Socratic):
"Great question! Let me ask you something first.

Have you ever used a mobile phone or seen a calculator?
What can they do?

Now, imagine a device that's like a super-smart combination
of both, that can do millions of things in seconds. What do
you think its name might be? 🤔"
```

### 8.2 Trilingual System Prompts

| Language | Key Requirements |
|----------|------------------|
| **English** | Use local Northeast India context (tea gardens, Brahmaputra) |
| **Hindi** | **Devanagari script mandatory** - कंप्यूटर not "Computer" |
| **Assamese** | **অসমীয়া script mandatory** - কম্পিউটাৰ not "Computer" |

### 8.3 Adaptive Learning Integration

```
VARK Model (Learning Style):
├── visual_score: Images, diagrams preference
├── text_score: Reading, written explanations
├── auditory_score: Listening, voice preference
└── preferred_style: Automatically calculated

Content Adaptation:
├── showImages: true if visual_score ≥ 35
├── enableVoice: true if auditory_score ≥ 35
├── textComplexity: simple/detailed based on text_score
└── suggestedPace: slow/normal/fast based on mastery
```

### 8.4 AI Model Configuration

```
Primary: Google Gemini 2.5 Flash
├── 1M context window
├── Temperature: 0.7 (creative but coherent)
├── Max tokens: 1024

Fallback Chain:
1. Gemini 2.5 Flash (primary)
2. HuggingFace PRO ($9/month)
3. Groq Llama 3.3 70B (free tier)

Circuit Breaker Protection:
├── Failure threshold: 5
├── Timeout: 60 seconds
└── Prevents cascading failures
```

---

## 9. Voice & Text-to-Speech

### 9.1 Voice Input (Speech Recognition)

```
Technology: Web Speech API (Browser Native)

Recognition Settings:
├── Language: en-IN (English India) - most reliable
├── Continuous: false (stop after pause)
├── Interim Results: true (show live transcript)

Language Detection Strategy:
├── Always use en-IN for recognition
├── AI detects actual language from content
├── Romanized Hindi/Assamese transcribed correctly
└── AI responds in detected/selected language
```

### 9.2 Text-to-Speech Output

```
Primary: Google Cloud TTS
├── English: en-IN-Neural2-A (Indian English)
├── Hindi: hi-IN-Neural2-A (Hindi)
├── Assamese: bn-IN-Standard-A (Bengali fallback)

Fallback: Browser SpeechSynthesis API
├── Voice priority: Google → Microsoft Neural → Any
├── Automatic quality adjustment
└── Always available

Features:
├── Emotion support: friendly, encouraging, calm, neutral
├── Speed adjustment per language
├── 1-hour private cache for responses
└── Rate limited: 50 requests/hour
```

### 9.3 Voice Chat Modes

| Mode | Description |
|------|-------------|
| **One-shot** | Single question → answer → stop |
| **Conversational** | Continuous back-and-forth, auto-resume mic |

---

## 10. Assessment System

### 10.1 IRT (Item Response Theory) Model

ATAL AI uses the **3-Parameter Logistic (3PL) IRT Model**:

```
P(correct) = c + (1-c) / (1 + exp(-a*(θ-b)))

Parameters:
├── θ (theta): Student ability estimate (-4 to +4)
├── a (discrimination): Item quality (0.5 to 2.5)
├── b (difficulty): Item difficulty (-3 to +3)
└── c (guessing): Random guess probability (0 to 0.5)
```

### 10.2 Adaptive Question Selection

```
Algorithm: a-Stratified Maximum Fisher Information (MFI)

Process:
1. Filter answered questions
2. Enforce category balance (min 4 per category)
3. Apply a-stratification (3 layers by discrimination)
4. Select from middle stratum
5. Choose item with Maximum Fisher Information

Categories (5 Digital Literacy Areas):
├── Digital Device Familiarity
├── Internet & Web Awareness
├── Digital Content Creation
├── Problem Solving Aptitude
└── Contextual Application
```

### 10.3 Assessment Flow

```
1. Student starts assessment → Create session
2. System fetches 30 adaptive questions (6 per category)
3. Questions shuffled (Fisher-Yates with crypto.getRandomValues)
4. Options shuffled per question
5. Student answers → Real-time θ estimation
6. Submit → Atomic RPC transaction
7. Calculate IRT scores per category
8. Display results with proficiency levels

Proficiency Levels:
├── θ ≥ 1.5: Advanced
├── θ ≥ 0.5: Proficient
├── θ ≥ -0.5: Developing
├── θ ≥ -1.5: Basic
└── θ < -1.5: Beginner
```

### 10.4 Scoring System

```
Database Scoring:
├── Atomic transaction (prevents race conditions)
├── Insert all responses in batch
├── Calculate: (correct / total) × 100

IRT Scoring:
├── Overall θ estimation (Newton-Raphson MLE)
├── Per-category θ estimation
├── Standard Error calculation
├── Convert θ to percentage: (θ + 3) / 6 × 100
```

---

## 11. Gamification System

### 11.1 Cultural Badge System (10 Badges)

| Badge | Icon | Rarity | Points | Criteria |
|-------|------|--------|--------|----------|
| First Steps | 👣 | Common | 50 | Complete 1 lesson |
| Muga Silk Master | 🪙 | Common | 100 | 10 lessons at 70%+ |
| Voice Learner | 🎤 | Common | 75 | 10 voice interactions |
| Night Owl | 🦉 | Common | 50 | Study after 8 PM |
| Early Bird | 🐦 | Common | 50 | Study before 7 AM |
| Gamosa Graduate | 🧣 | Uncommon | 200 | 90%+ on assessment |
| Bihu Dancer | 💃 | Uncommon | 150 | 3 lessons in 1 week |
| Curious Mind | 💡 | Uncommon | 150 | 20 AI tutor questions |
| Brahmaputra Scholar | 🌊 | Rare | 500 | 85%+ mastery in all 5 modules |
| Perfect Score | ⭐ | Legendary | 1000 | 100% on any assessment |

### 11.2 Points System

| Activity | Points | Bonus |
|----------|--------|-------|
| Lesson Completion | 10 | +5 if score ≥90% |
| Badge Earned | 50-1000 | Based on rarity |
| Question Asked | 5 | Per question |
| Voice Interaction | 15 | Per interaction |
| Assessment Completion | 20 | Variable |
| Daily Login | 10 | Once daily |

### 11.3 Leaderboard

```
Features:
├── Real-time class rankings
├── Trophy icons for top 3 (🥇🥈🥉)
├── Current user highlighting
├── Supabase real-time subscriptions
└── Single optimized RPC query

Performance:
├── Database-level aggregation (O(1) vs O(n))
├── Single JOIN query (vs 3 separate queries)
└── 3x faster than client-side calculation
```

### 11.4 Streak Tracking

```
Activity Sources:
├── Assessment sessions
├── AI tutor conversations
└── Lesson attempts

Algorithm:
├── Normalize dates to local timezone
├── Check consecutive days from today
├── Allow today to be missing (grace period)
├── Break on first missed day
└── Return streak count
```

---

## 12. Teacher Features

### 12.1 Teacher Dashboard

```
Metrics Overview:
├── Total classes managed
├── Total students enrolled
├── Active students (last 7 days)
├── At-risk students (mastery < 40%)

Features:
├── Real-time progress monitoring
├── AI tutor interaction logs
├── Student activity indicators
└── At-risk student highlighting
```

### 12.2 Class Management

```
Create Class:
├── Name and subject fields
├── Auto-generated class code (6 chars)
├── Auto-generated join PIN (4 digits)

Manage Roster:
├── Add students by email/ID
├── View student profiles
├── Remove students with confirmation
├── Real-time roster updates
```

### 12.3 Communication Features

```
Announcements:
├── Title + body (5000 char limit)
├── Priority levels (Low/Normal/High/Urgent)
├── Pin to top option
├── Read status tracking

Materials:
├── File/link uploads
├── Type categorization (Documents/Videos/Links/Images)
├── Topic/module association
├── Download/view tracking
```

### 12.4 Analytics

```
Question Analytics (/app/teacher/analytics/questions):
├── Success rate per question
├── Total attempts and correct answers
├── Average response times
├── AI hint usage patterns
├── Top 5 difficult questions
├── Top 5 well-mastered questions
```

---

## 13. Admin Features

### 13.1 PIN Management System

```
School Finder:
├── Search by code or name
├── District → Block → School hierarchy
├── Auto-population from registry

PIN Operations:
├── Check existing PIN status
├── Create new PIN (bcrypt hashed)
├── Rotate PIN (old becomes invalid)
├── One-time secure display
└── Rate limited to prevent abuse
```

### 13.2 Performance Monitoring

```
Metrics Dashboard:
├── Total query count
├── Success/failure rates
├── Slow query detection (>1s)
├── P95/P99 durations

Connection Pool:
├── Active connections
├── Max connection limits
├── Utilization percentage
├── Color-coded status bars

Alerts:
├── Critical, error, warning levels
├── Recent alert history
├── Alert timestamps
```

### 13.3 Admin User Management

```
Operations:
├── Create admin accounts
├── Assign roles (admin/super_admin)
├── Remove admin access
└── Super admin required for sensitive ops
```

---

## 14. Offline Capabilities

### 14.1 PWA Features

```
Service Worker:
├── Cache strategies per content type
├── Network-first for API calls
├── Cache-first for static assets
├── Background sync for mutations

Cache Configuration:
├── Supabase API: NetworkFirst (24h expiry)
├── Images: CacheFirst (7-day expiry)
├── Fonts: CacheFirst (30-day expiry)
├── Google Fonts: CacheFirst (1-year expiry)
```

### 14.2 Offline Storage

```
IndexedDB (Dexie):
├── Downloaded lessons with metadata
├── Practice questions per lesson
├── TTS audio (optional base64)
├── Sync queue for mutations
├── Download progress tracking
```

### 14.3 Offline Learning Flow

```
Download:
1. User clicks download button
2. Fetch lesson + questions from API
3. Store in IndexedDB with metadata
4. Show "downloaded" checkmark

Offline Use:
1. Detect network status
2. Load from IndexedDB
3. Show offline indicator
4. Queue progress updates
5. Sync when back online
```

---

## 15. Performance Optimizations

### 15.1 Database Optimizations

| Optimization | Improvement |
|--------------|-------------|
| Module-topic counting batch query | 90% faster module load |
| Single-pass progress aggregation | Avoid N+1 queries |
| Promise.all for parallel queries | 60% latency reduction |
| Database-level SUM for points | O(1) vs O(n) |
| Leaderboard single JOIN RPC | 3x faster |

### 15.2 Client-Side Optimizations

| Optimization | Improvement |
|--------------|-------------|
| React.memo for badge components | Prevent re-renders |
| Map lookups vs array.find | O(1) vs O(n) |
| Message limiting (last 20) | Reduce DOM size |
| Request deduplication | Prevent duplicate API calls |
| Module-level locks | Prevent race conditions |

### 15.3 API Optimizations

| Optimization | Improvement |
|--------------|-------------|
| Direct pgvector queries | 40% faster than LangChain |
| Cache headers (private, 1h) | Reduce server load |
| ETag support | Conditional requests |
| Streaming AI responses | Real-time feedback |
| Circuit breaker pattern | Prevent cascading failures |

---

## 16. Security Measures

### 16.1 Authentication Security

| Measure | Implementation |
|---------|----------------|
| Password hashing | bcrypt with proper salt |
| OTP security | 6-digit, 10-minute expiry |
| PIN hashing | bcrypt, one-time display |
| Session management | HttpOnly, Secure, SameSite cookies |
| NIST 2025 compliance | Password strength validation |

### 16.2 API Security

| Measure | Implementation |
|---------|----------------|
| Rate limiting | Distributed token bucket |
| Input validation | Zod schemas on all endpoints |
| Error sanitization | No internal details exposed |
| CORS protection | Origin/referer validation |
| DoS prevention | Message/character limits |

### 16.3 Database Security

| Measure | Implementation |
|---------|----------------|
| Row-Level Security | 92 policies across 30 tables |
| Service role isolation | Never exposed to client |
| Atomic transactions | RPC functions for consistency |
| Exclusive locks | Prevent concurrent conflicts |
| Audit logging | Track sensitive operations |

### 16.4 Sensitive Data Handling

```
Automatic Masking:
├── maskEmail() → "jo***@example.com"
├── maskPhone() → "***3210"
├── maskToken() → "abcd12345..."
├── maskUserId() → "abc12345..."
└── maskSensitiveData() → Recursive object masking
```

---

## 17. Future Scope

### 17.1 Potential Enhancements

| Area | Enhancement |
|------|-------------|
| **Languages** | Add more regional languages (Bengali, Odia) |
| **Content** | Expand curriculum beyond digital literacy |
| **AI** | Implement multimodal learning (video generation) |
| **Assessment** | Add practical skill assessments |
| **Gamification** | Multiplayer challenges and team badges |
| **Analytics** | Advanced learning analytics dashboards |
| **Accessibility** | Screen reader optimization, high contrast |

### 17.2 Technical Improvements

| Area | Improvement |
|------|-------------|
| **Performance** | Edge caching with CDN |
| **Scalability** | Multi-region deployment |
| **Monitoring** | Advanced APM integration |
| **Testing** | Increase test coverage to 80%+ |
| **Documentation** | Interactive API documentation |

---

## Appendix A: Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI Services
GEMINI_API_KEY=xxx
GROQ_API_KEY=xxx
GOOGLE_CLOUD_PROJECT=xxx
GOOGLE_CLOUD_TTS_API_KEY=xxx

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=sntrys_...

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_ENABLE_PWA=true
```

## Appendix B: Build Commands

```bash
# Development
npm run dev                    # Start dev server

# Production
npm run build                  # Build for production
npm start                      # Start production server

# Testing
npm run test                   # Jest unit tests
npm run test:e2e               # Playwright E2E tests

# Quality
npm run lint                   # ESLint
npm run sonar                  # SonarQube analysis
```

---

**Document prepared for ATAL AI Project Report**

*This document provides a comprehensive overview of the ATAL AI educational platform, covering all technical aspects, features, and implementation details.*
