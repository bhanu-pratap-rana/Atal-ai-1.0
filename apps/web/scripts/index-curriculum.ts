/**
 * Curriculum Indexing Script
 *
 * Indexes curriculum content into Supabase with embeddings for RAG.
 * Uses Google text-embedding-004 (768 dimensions).
 *
 * Usage:
 *   npx tsx scripts/index-curriculum.ts
 *
 * Required environment variables:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY)
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

// Curriculum files to index
// Complete Level 1 curriculum files (Modules 1-5) in 3 languages
// Located in docs/curriculum/markdown/ folder
const CURRICULUM_FILES = [
  {
    path: 'docs/curriculum/markdown/ATAL_Digital_Empowerment_Curriculum_Level_1_Complete.md',
    language: 'en',
    description: 'English - Complete Level 1 curriculum (Modules 1-5)',
  },
  {
    path: 'docs/curriculum/markdown/ATAL_Digital_Empowerment_Curriculum_Complete.md',
    language: 'hi',
    description: 'Hindi - पूर्ण स्तर 1 पाठ्यक्रम (मॉड्यूल 1-5)',
  },
  {
    path: 'docs/curriculum/markdown/ATAL_Digital_Empowerment_Curriculum_Assamese_Complete.md',
    language: 'as',
    description: 'Assamese - সম্পূৰ্ণ স্তৰ ১ পাঠ্যক্ৰম (মডিউল ১-৫)',
  },
];

// Embedding configuration
const EMBEDDING_MODEL = 'text-embedding-004';
const _EMBEDDING_DIMENSIONS = 768;
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

/**
 * Simple text splitter
 */
function splitText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let chunk = text.slice(start, end);

    // Try to end at a sentence boundary
    if (end < text.length) {
      const lastPeriod = chunk.lastIndexOf('.');
      const lastNewline = chunk.lastIndexOf('\n');
      const boundary = Math.max(lastPeriod, lastNewline);

      if (boundary > chunkSize * 0.5) {
        chunk = chunk.slice(0, boundary + 1);
      }
    }

    chunks.push(chunk.trim());
    start += chunk.length - overlap;

    if (start >= text.length - overlap) break;
  }

  return chunks.filter((c) => c.length > 50);
}

/**
 * Get embedding for text using Google API
 */
async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
        taskType: 'RETRIEVAL_DOCUMENT',
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.embedding.values;
}

/**
 * Extract module and topic from chunk content
 * Supports English, Hindi, and Assamese patterns
 *
 * IMPROVED: Better regex patterns to handle:
 * - Assamese numerals (১২৩৪৫)
 * - Hindi numerals (१२३४५)
 * - Markdown formatting like {.mark}
 * - Various header styles
 */
function extractMetadata(chunk: string, _language: string): { moduleId: string; topicId: string; title: string } {
  // First, normalize the chunk by removing markdown formatting artifacts
  const normalizedChunk = chunk
    .replaceAll('{.mark}', '')
    .replaceAll(/\[\s*/g, '')
    .replaceAll(/\s*\]/g, '')
    .replaceAll('**', '');

  // Try to extract module number (multilingual patterns)
  // Order matters - most specific patterns first
  const modulePatterns = [
    /ATAL\s*Module\s*(\d+)/i,             // ATAL Module 1
    /ATAL\s*मॉड्यूल\s*(\d+)/i,             // ATAL मॉड्यूल 1
    /ATAL\s*মডিউল\s*([০-৯\d]+)/i,          // ATAL মডিউল ১
    /Module\s*(\d+)/i,                     // Module 1
    /मॉड्यूल\s*(\d+)/i,                     // मॉड्यूल 1
    /মডিউল\s*([০-৯\d]+)/i,                  // মডিউল ১ (with Assamese numerals)
    /মডিউল\s*(\d+)/i,                       // মডিউল 1 (with Arabic numerals)
    /অধযায়\s*([০-৯\d]+)/i,                  // অধযায় ১ (Chapter)
    /मूल्यांकन.*मॉड्यूल\s*(\d+)/i,          // मूल्यांकन ... मॉड्यूल 1
    /মূলযায়ন.*মডিউল\s*([০-৯\d]+)/i,         // মূলযায়ন ... মডিউল ১
  ];

  let moduleId = 'general';
  for (const pattern of modulePatterns) {
    const match = normalizedChunk.match(pattern);
    if (match) {
      // Convert Assamese/Hindi numerals to Arabic if needed
      const num = convertToArabicNumeral(match[1]);
      // Validate module number is 1-5
      const moduleNum = parseInt(num, 10);
      if (moduleNum >= 1 && moduleNum <= 5) {
        moduleId = `M${moduleNum}`;
        break;
      }
    }
  }

  // Try to extract topic number (multilingual patterns)
  const topicPatterns = [
    /Topic\s*(\d+\.\d+)/i,                // English: Topic 1.1
    /Lesson\s*(\d+\.\d+)/i,               // English: Lesson 1.1
    /विषय\s*(\d+\.\d+)/i,                  // Hindi: विषय 1.1
    /टॉपिक\s*(\d+\.\d+)/i,                 // Hindi: टॉपिक 1.1
    /বিষয়\s*([০-৯\d]+\.[০-৯\d]+)/i,        // Assamese: বিষয় ১৪.১ (correct spelling)
    /বিষয়\s*(\d+\.\d+)/i,                  // Assamese: বিষয় 14.1 (with Arabic numerals)
    /ডিষয়\s*([০-৯\d]+\.[০-৯\d]+)/i,        // Assamese: ডিষয় ১.১ (alternate spelling)
    /ডিষয়\s*(\d+\.\d+)/i,                  // Assamese: ডিষয় 1.1
    /(\d+\.\d+)\s*[:：]/,                  // Generic: 1.1: or 1.1：
  ];

  let topicId = 'general';
  for (const pattern of topicPatterns) {
    const match = normalizedChunk.match(pattern);
    if (match) {
      const num = convertToArabicNumeral(match[1]);
      topicId = `T${num}`;
      break;
    }
  }

  // Try to extract title (first meaningful line or header)
  const lines = chunk.split('\n').filter((l) => l.trim() && l.trim().length > 5);
  let title = 'Untitled Section';

  for (const line of lines.slice(0, 5)) {
    // Check for markdown headers (## or ###)
    const headerMatch = line.match(/^#{1,3}\s*(.+)/);
    if (headerMatch) {
      // Clean up the header
      const headerText = headerMatch[1]
        .replaceAll('{.mark}', '')
        .replaceAll(/\[\s*/g, '')
        .replaceAll(/\s*\]/g, '')
        .replaceAll('**', '')
        .trim();
      if (headerText.length >= 5) {
        title = headerText.slice(0, 80);
        break;
      }
    }
    // Check for meaningful first line (not a bullet point)
    if (line.length >= 10 && line.length <= 100 && !line.trim().startsWith('-') && !line.trim().startsWith('•')) {
      title = line.trim().slice(0, 80);
      break;
    }
  }

  return { moduleId, topicId, title };
}

/**
 * Convert Assamese/Hindi numerals to Arabic numerals
 */
function convertToArabicNumeral(str: string): string {
  const numeralMap: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  };

  return str.split('').map(char => numeralMap[char] || char).join('');
}

/**
 * Determine content type from chunk (multilingual support)
 */
function determineContentType(
  chunk: string
): 'definition' | 'curriculum' | 'example' | 'exercise' | 'cultural_context' {
  const lowerChunk = chunk.toLowerCase();

  // Definition patterns (EN/HI/AS)
  if (
    lowerChunk.includes('definition:') ||
    lowerChunk.includes('what is') ||
    lowerChunk.includes('means') ||
    chunk.includes('परिभाषा') ||           // Hindi: definition
    chunk.includes('সংজ্ঞা') ||             // Assamese: definition
    chunk.includes('ব্যাখ্যা')              // Assamese: explanation
  ) {
    return 'definition';
  }

  // Example patterns (EN/HI/AS)
  if (
    lowerChunk.includes('example:') ||
    lowerChunk.includes('for example') ||
    lowerChunk.includes('such as') ||
    chunk.includes('उदाहरण') ||            // Hindi: example
    chunk.includes('উদ্াহৰণ') ||            // Assamese: example
    chunk.includes('পদ্টক্ষটপ')             // Assamese: step by step
  ) {
    return 'example';
  }

  // Exercise patterns (EN/HI/AS)
  if (
    lowerChunk.includes('exercise') ||
    lowerChunk.includes('practice') ||
    lowerChunk.includes('try this') ||
    chunk.includes('अभ्यास') ||            // Hindi: exercise
    chunk.includes('অনুশীলন') ||           // Assamese: practice
    chunk.includes('MCQ') ||
    chunk.includes('प्रश्न') ||              // Hindi: question
    chunk.includes('প্ৰশ্ন')                // Assamese: question
  ) {
    return 'exercise';
  }

  // Cultural context patterns (EN/HI/AS)
  if (
    lowerChunk.includes('assam') ||
    lowerChunk.includes('bihu') ||
    lowerChunk.includes('brahmaputra') ||
    chunk.includes('মুগা') ||              // Muga silk
    chunk.includes('অসম') ||               // Assam
    chunk.includes('বিহু') ||               // Bihu
    chunk.includes('ব্রহ্মপুত্র') ||          // Brahmaputra
    chunk.includes('गाँव') ||               // Hindi: village
    chunk.includes('গাঁও') ||               // Assamese: village
    chunk.includes('সাংস্কৃডতক') ||         // Assamese: cultural
    chunk.includes('सांस्कृतिक')            // Hindi: cultural
  ) {
    return 'cultural_context';
  }

  return 'curriculum';
}

/**
 * Clear all existing curriculum data from database
 */
async function clearCurriculumData(supabase: ReturnType<typeof createClient>) {
  console.log('🗑️  Clearing old curriculum data...');

  // First, get count of existing records
  const { count: beforeCount } = await supabase
    .from('curriculum_content')
    .select('*', { count: 'exact', head: true });

  console.log(`   Found ${beforeCount || 0} existing records`);

  if (beforeCount && beforeCount > 0) {
    // Delete all existing curriculum content
    const { error } = await supabase
      .from('curriculum_content')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (neq with impossible UUID)

    if (error) {
      console.error('❌ Error clearing curriculum data:', error.message);
      throw error;
    }

    console.log(`   ✅ Deleted ${beforeCount} old records\n`);
  } else {
    console.log('   No existing data to clear\n');
  }
}

/**
 * Main indexing function
 */
async function indexCurriculum() {
  console.log('🚀 Starting curriculum indexing...\n');
  console.log('=' .repeat(60));

  // Validate environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  if (!apiKey) {
    console.error('❌ Missing GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY');
    process.exit(1);
  }

  console.log('✅ Environment validated');
  console.log(`   Supabase URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log(`   API Key: ${apiKey.substring(0, 10)}...`);
  console.log('');

  // Create Supabase client with service role
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Step 1: Clear old data
  await clearCurriculumData(supabase);

  let totalChunks = 0;
  let totalErrors = 0;
  const languageStats: Record<string, number> = { en: 0, hi: 0, as: 0 };
  const moduleStats: Record<string, number> = {};

  for (const file of CURRICULUM_FILES) {
    // Try multiple path resolutions for flexibility
    const possiblePaths = [
      path.resolve(process.cwd(), '..', '..', file.path),  // From apps/web/scripts
      path.resolve(process.cwd(), file.path),              // From project root
      path.resolve(process.cwd(), '..', file.path),        // From apps/web
    ];

    let filePath = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }

    if (!filePath) {
      console.warn(`⚠️  File not found: ${file.path}`);
      console.warn(`   Tried: ${possiblePaths.join(', ')}`);
      continue;
    }

    console.log(`📄 Processing: ${file.path}`);
    console.log(`   Language: ${file.language} - ${file.description}`);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const chunks = splitText(content, CHUNK_SIZE, CHUNK_OVERLAP);

      console.log(`   Found ${chunks.length} chunks`);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const { moduleId, topicId, title } = extractMetadata(chunk, file.language);
        const contentType = determineContentType(chunk);

        try {
          // Get embedding
          const embedding = await getEmbedding(chunk, apiKey);

          // Insert into database
          const { error } = await supabase.from('curriculum_content').insert({
            module_id: moduleId,
            topic_id: topicId,
            language: file.language,
            content_type: contentType,
            title,
            content: chunk,
            embedding,
            metadata: {
              source: file.path,
              chunk_index: i,
              chunk_total: chunks.length,
            },
          });

          if (error) {
            console.error(`   ❌ Error inserting chunk ${i}:`, error.message);
            totalErrors++;
          } else {
            totalChunks++;
            languageStats[file.language]++;
            moduleStats[moduleId] = (moduleStats[moduleId] || 0) + 1;
            process.stdout.write(`\r   Indexed: ${i + 1}/${chunks.length} [${moduleId}]`);
          }

          // Rate limit: wait 100ms between requests
          await new Promise((r) => setTimeout(r, 100));
        } catch (err) {
          console.error(`   ❌ Error processing chunk ${i}:`, err);
          totalErrors++;
        }
      }

      console.log('\n');
    } catch (err) {
      console.error(`❌ Error reading file ${file.path}:`, err);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Indexing complete!\n');

  console.log('📊 Summary Statistics:');
  console.log(`   Total chunks indexed: ${totalChunks}`);
  console.log(`   Total errors: ${totalErrors}`);
  console.log('');

  console.log('📚 By Language:');
  console.log(`   English (en): ${languageStats.en} chunks`);
  console.log(`   Hindi (hi): ${languageStats.hi} chunks`);
  console.log(`   Assamese (as): ${languageStats.as} chunks`);
  console.log('');

  console.log('📖 By Module:');
  const sortedModules = Object.entries(moduleStats).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [module, count] of sortedModules) {
    const moduleName = {
      'M1': 'Computer Basics',
      'M2': 'Operating Systems',
      'M3': 'Internet Basics',
      'M4': 'Digital Communication',
      'M5': 'Local Technology & Services',
      'general': 'General Content',
    }[module] || module;
    console.log(`   ${module}: ${count} chunks (${moduleName})`);
  }
  console.log('');

  if (totalErrors > 0) {
    console.log(`⚠️  ${totalErrors} errors occurred during indexing`);
  } else {
    console.log('🎉 All curriculum content indexed successfully!');
  }
}

// Run indexing
indexCurriculum().catch(console.error);
