# Dynamic RAG-Powered Content Delivery System

## Overview

Transform the static lesson pages into dynamic, AI-generated microlearning experiences that adapt to each student's language, learning style, and progress.

## Problem Statement

Current issues:
1. `curriculum_content` table contains raw/assessment data, not formatted lessons
2. Content not properly filtered by language
3. No visual elements (images, diagrams)
4. No microlearning structure (lessons too long)
5. Offline mode limited to cached raw content

## Proposed Architecture

### Content Flow

```
Student Request → RAG Retrieval → AI Generation → Microlearning UI → Offline Cache
```

### 1. RAG Retrieval Layer

**Purpose:** Fetch relevant curriculum content using vector similarity search.

```typescript
// apps/web/src/lib/rag/content-retrieval.ts

interface ContentRetrievalParams {
  moduleId: string;
  topicId: string;
  language: SupportedLanguage;
  learningStyle?: 'visual' | 'text' | 'auditory';
}

async function retrieveTopicContent(params: ContentRetrievalParams) {
  // 1. Get topic embedding
  const topicEmbedding = await generateEmbedding(`${params.moduleId} ${params.topicId}`);

  // 2. Similarity search in curriculum_content
  const { data: content } = await supabase.rpc('match_curriculum_content', {
    query_embedding: topicEmbedding,
    match_threshold: 0.7,
    match_count: 10,
    filter_module: params.moduleId,
    filter_topic: params.topicId,
    filter_language: params.language
  });

  // 3. Include cultural context
  const { data: cultural } = await supabase
    .from('curriculum_content')
    .select('*')
    .eq('module_id', params.moduleId)
    .eq('content_type', 'cultural_context')
    .eq('language', params.language);

  return { content, cultural };
}
```

### 2. AI Content Generation Layer

**Purpose:** Transform raw content into structured microlearning lessons.

```typescript
// apps/web/src/lib/rag/lesson-generator.ts

interface GeneratedLesson {
  title: string;
  duration: string; // "5 min"
  chunks: LessonChunk[];
}

interface LessonChunk {
  type: 'concept' | 'example' | 'practice' | 'checkpoint';
  duration: string; // "2 min"
  content: {
    heading: string;
    explanation: string;
    visualDescription?: string; // For AI image generation
    videoQuery?: string; // For YouTube search
    interactiveElement?: QuizQuestion | DragDropExercise;
  };
}

async function generateLesson(
  ragContent: RAGContent,
  studentProfile: StudentProfile
): Promise<GeneratedLesson> {
  const systemPrompt = `
    You are an expert educational content designer for rural Indian students.
    Create microlearning content in ${ragContent.language} that is:
    - Culturally relevant (use local examples)
    - Visually oriented (describe diagrams/images to generate)
    - Interactive (include checkpoint questions)
    - Brief (2-7 minutes per chunk)

    Student learning style preference: ${studentProfile.preferredStyle}
    Student mastery level: ${studentProfile.masteryScore}%
  `;

  // Call AI to structure content
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    system: systemPrompt,
    messages: [{ role: 'user', content: JSON.stringify(ragContent) }]
  });

  return parseLessonResponse(response);
}
```

### 3. Microlearning UI Components

**Purpose:** Present content in bite-sized, interactive chunks.

```
apps/web/src/components/microlearning/
├── LessonPlayer.tsx       # Main player with progress bar
├── ConceptChunk.tsx       # Explains a concept (1-2 min)
├── ExampleChunk.tsx       # Shows real-world example (2-3 min)
├── PracticeChunk.tsx      # Interactive exercise (2 min)
├── CheckpointQuiz.tsx     # Mini-quiz every 2-3 chunks
├── VisualElement.tsx      # AI-generated image/diagram
├── VideoEmbed.tsx         # YouTube/local video
└── ProgressIndicator.tsx  # Shows chunk progress
```

#### LessonPlayer Component

```tsx
// apps/web/src/components/microlearning/LessonPlayer.tsx

interface LessonPlayerProps {
  lesson: GeneratedLesson;
  onComplete: () => void;
  voiceEnabled?: boolean;
}

export function LessonPlayer({ lesson, onComplete, voiceEnabled }: LessonPlayerProps) {
  const [currentChunk, setCurrentChunk] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const { speak } = useTTS();

  return (
    <div className="lesson-player">
      {/* Progress bar */}
      <ProgressIndicator
        current={currentChunk}
        total={lesson.chunks.length}
        completed={completed}
      />

      {/* Current chunk */}
      <AnimatePresence mode="wait">
        <ChunkRenderer
          chunk={lesson.chunks[currentChunk]}
          voiceEnabled={voiceEnabled}
          onComplete={() => {
            setCompleted(prev => new Set([...prev, currentChunk]));
            if (currentChunk < lesson.chunks.length - 1) {
              setCurrentChunk(prev => prev + 1);
            } else {
              onComplete();
            }
          }}
        />
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-4">
        <Button
          onClick={() => setCurrentChunk(prev => prev - 1)}
          disabled={currentChunk === 0}
        >
          ← Previous
        </Button>
        <Button
          onClick={() => setCurrentChunk(prev => prev + 1)}
          disabled={currentChunk === lesson.chunks.length - 1}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
```

### 4. Visual Generation Integration

**Purpose:** Generate culturally relevant images for visual learners.

Options:
1. **AI Image Generation** - Use DALL-E/Stable Diffusion for diagrams
2. **Pre-cached Images** - Store common visuals in Supabase Storage
3. **SVG Templates** - Parametric diagrams with dynamic data

```typescript
// apps/web/src/lib/visuals/image-service.ts

interface VisualRequest {
  description: string;
  style: 'diagram' | 'illustration' | 'icon';
  culturalContext: 'rural-india' | 'urban-india' | 'generic';
}

async function getVisual(request: VisualRequest): Promise<string> {
  // 1. Check cache first
  const cached = await checkImageCache(request.description);
  if (cached) return cached;

  // 2. Generate new image
  const imageUrl = await generateImage({
    prompt: `${request.description}, ${request.style} style,
             suitable for ${request.culturalContext} context,
             simple and clear, educational`,
    size: '512x512'
  });

  // 3. Cache for future use
  await cacheImage(request.description, imageUrl);

  return imageUrl;
}
```

### 5. Offline/Download System

**Purpose:** Generate static PDFs for offline access.

```typescript
// apps/web/src/lib/offline/pdf-generator.ts

interface PDFLessonOptions {
  lesson: GeneratedLesson;
  includeImages: boolean;
  language: SupportedLanguage;
}

async function generateOfflinePDF(options: PDFLessonOptions): Promise<Blob> {
  const doc = new jsPDF();

  // Title page
  doc.setFontSize(24);
  doc.text(options.lesson.title, 20, 30);

  for (const chunk of options.lesson.chunks) {
    doc.addPage();

    // Heading
    doc.setFontSize(18);
    doc.text(chunk.content.heading, 20, 20);

    // Explanation
    doc.setFontSize(12);
    doc.text(chunk.content.explanation, 20, 40, { maxWidth: 170 });

    // Image (if available and requested)
    if (options.includeImages && chunk.content.visualDescription) {
      const imageUrl = await getVisual({
        description: chunk.content.visualDescription,
        style: 'diagram',
        culturalContext: 'rural-india'
      });
      doc.addImage(imageUrl, 'PNG', 20, 80, 100, 100);
    }

    // Practice question (if checkpoint)
    if (chunk.type === 'checkpoint' && chunk.content.interactiveElement) {
      doc.setFontSize(14);
      doc.text('Practice Question:', 20, 200);
      doc.text(chunk.content.interactiveElement.question, 20, 210);
    }
  }

  return doc.output('blob');
}
```

## Database Changes

### New Tables

```sql
-- Cached generated lessons
CREATE TABLE generated_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  language TEXT NOT NULL,
  student_id UUID REFERENCES auth.users(id),
  lesson_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days'
);

-- Cached visuals
CREATE TABLE lesson_visuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description_hash TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Updated curriculum_content Usage

Instead of displaying `curriculum_content` directly, it becomes the RAG source:
- Content is retrieved via vector similarity
- AI transforms it into structured lessons
- Generated lessons are cached for performance

## API Endpoints

```
POST /api/lesson/generate
  Body: { moduleId, topicId, language, learningStyle }
  Returns: GeneratedLesson

GET /api/lesson/cached/:moduleId/:topicId/:language
  Returns: GeneratedLesson | null

POST /api/lesson/download
  Body: { moduleId, topicId, language, format: 'pdf' }
  Returns: PDF Blob

POST /api/visual/generate
  Body: { description, style, culturalContext }
  Returns: { imageUrl }
```

## Migration Path

### Phase 1: Add generation layer (keep existing UI)
1. Create RAG retrieval service
2. Create AI lesson generator
3. Add /api/lesson/generate endpoint
4. Test with one module

### Phase 2: New microlearning UI
1. Build LessonPlayer component
2. Build chunk components (Concept, Example, Practice)
3. Add visual generation
4. Replace existing lesson page

### Phase 3: Offline/Download
1. Add PDF generation
2. Update download button to generate PDFs
3. Add offline-first caching with service worker

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Lesson completion rate | ~40% | 70%+ |
| Knowledge retention (quiz scores) | ~50% | 75%+ |
| Time to complete topic | 15+ min | 5-10 min |
| Offline usage | <5% | 30%+ |

## References

- [RAG in Personalized Learning](https://www.makebot.ai/blog-en/the-impact-of-generative-ai-and-rag-on-personalized-learning)
- [Microlearning Best Practices 2026](https://disprz.ai/blog/what-is-microlearning)
- [AI-Powered Learning Platforms](https://www.absorblms.com/blog/top-ai-learning-platforms)
