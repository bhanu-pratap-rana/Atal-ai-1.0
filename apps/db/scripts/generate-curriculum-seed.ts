/**
 * Curriculum Content Seed Generator
 *
 * This script parses curriculum markdown files, generates embeddings via
 * Google text-embedding-004, and outputs a SQL migration file for seeding
 * the curriculum_content table.
 *
 * Usage:
 *   npx tsx apps/db/scripts/generate-curriculum-seed.ts
 *
 * Environment Variables Required:
 *   GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY
 *
 * Output:
 *   apps/db/migrations/138_seed_curriculum_content.sql
 */

import * as fs from "fs";
import * as path from "path";

// Configuration
const CONFIG = {
  inputFiles: {
    en: "docs/curriculum/markdown/ATAL_Digital_Empowerment_Curriculum_Level_1_Complete.md",
    hi: "docs/curriculum/markdown/ATAL_Digital_Empowerment_Curriculum_Complete.md",
    as: "docs/curriculum/markdown/ATAL_Digital_Empowerment_Curriculum_Assamese_Complete.md",
  },
  outputFile: "apps/db/migrations/134_seed_curriculum_content.sql",
  embeddingModel: "text-embedding-004",
  embeddingDimensions: 768,
  maxChunkLength: 2000, // characters per chunk
  rateLimitDelayMs: 100, // delay between API calls
};

// Content type mappings based on section headers
const CONTENT_TYPE_PATTERNS: Record<string, RegExp[]> = {
  curriculum: [
    /Simple Explanation/i,
    /Learning Outcome/i,
    /Module Overview/i,
    /Unit \d+:/i,
  ],
  example: [
    /Step-by-Step Example/i,
    /Visual Guide/i,
    /Example/i,
  ],
  exercise: [
    /Quick Practice/i,
    /Low-Tech Option/i,
    /Assessment \(MCQ\)/i,
    /Formative check/i,
  ],
  cultural_context: [
    /Cultural Analogy/i,
    /Cultural Context/i,
  ],
  definition: [
    /Common Mistakes & Tips/i,
    /Privacy & Safety Context/i,
  ],
};

// Topic ID patterns for different languages
const TOPIC_PATTERNS = {
  en: /\*\*Topic (\d+\.\d+):/i,
  hi: /(?:\*\*)?(?:विषय|टॉपिक|Topic)\s*(\d+\.\d+)/i,
  as: /(?:\*\*)?(?:টপিক|বিষয়|Topic)\s*(\d+\.\d+)/i,
};

// Module ID patterns
const MODULE_PATTERNS = {
  en: /\*\*(?:ATAL )?Module (\d+):/i,
  hi: /(?:\*\*)?(?:मॉड्यूल|Module)\s*(\d+)/i,
  as: /(?:\*\*)?(?:মডিউল|Module)\s*(\d+)/i,
};

interface ContentChunk {
  moduleId: string;
  topicId: string;
  language: string;
  contentType: string;
  title: string;
  content: string;
  embedding?: number[];
}

interface Stats {
  totalChunks: number;
  chunksPerLanguage: Record<string, number>;
  chunksPerType: Record<string, number>;
  embeddingsGenerated: number;
  errors: string[];
}

const stats: Stats = {
  totalChunks: 0,
  chunksPerLanguage: { en: 0, hi: 0, as: 0 },
  chunksPerType: {},
  embeddingsGenerated: 0,
  errors: [],
};

/**
 * Get embedding from Google text-embedding-004 API
 */
async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY environment variable is required");
  }

  // Truncate text if too long (API has limits)
  const truncatedText = text.slice(0, 10000);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${CONFIG.embeddingModel}:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${CONFIG.embeddingModel}`,
        content: { parts: [{ text: truncatedText }] },
        taskType: "RETRIEVAL_DOCUMENT",
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Embedding API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();

  if (!data.embedding?.values || data.embedding.values.length !== CONFIG.embeddingDimensions) {
    throw new Error(`Invalid embedding response: expected ${CONFIG.embeddingDimensions} dimensions`);
  }

  return data.embedding.values;
}

/**
 * Detect content type from section text
 */
function detectContentType(text: string): string {
  for (const [type, patterns] of Object.entries(CONTENT_TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return type;
      }
    }
  }
  return "curriculum"; // default
}

/**
 * Extract title from section
 */
function extractTitle(text: string): string {
  // Look for bold text at the start
  const boldMatch = text.match(/^\*\*([^*]+)\*\*/);
  if (boldMatch) {
    return boldMatch[1].slice(0, 100);
  }

  // Take first line as title
  const firstLine = text.split("\n")[0].replace(/\*+/g, "").trim();
  return firstLine.slice(0, 100) || "Untitled";
}

/**
 * Parse a markdown file into content chunks
 */
function parseMarkdownFile(filePath: string, language: string): ContentChunk[] {
  const absolutePath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    stats.errors.push(`File not found: ${filePath}`);
    console.error(`File not found: ${absolutePath}`);
    return [];
  }

  const rawContent = fs.readFileSync(absolutePath, "utf-8");
  // Normalize line endings (Windows \r\n -> Unix \n)
  const content = rawContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const chunks: ContentChunk[] = [];

  let currentModule = "M1";
  let currentTopic = "";

  // Split by topic headers
  const topicPattern = TOPIC_PATTERNS[language as keyof typeof TOPIC_PATTERNS] || TOPIC_PATTERNS.en;
  const modulePattern = MODULE_PATTERNS[language as keyof typeof MODULE_PATTERNS] || MODULE_PATTERNS.en;

  // Split content into sections by double newlines
  const sections = content.split(/\n{2,}/);

  for (const section of sections) {
    const trimmedSection = section.trim();
    if (!trimmedSection || trimmedSection.length < 20) continue;

    // Check for module change
    const moduleMatch = trimmedSection.match(modulePattern);
    if (moduleMatch) {
      currentModule = `M${moduleMatch[1]}`;
    }

    // Check for topic change
    const topicMatch = trimmedSection.match(topicPattern);
    if (topicMatch) {
      currentTopic = `T${topicMatch[1]}`;
    }

    // Skip sections without a topic context
    if (!currentTopic) continue;

    // Detect content type and extract title
    const contentType = detectContentType(trimmedSection);
    const title = extractTitle(trimmedSection);

    // Clean content (remove excessive markdown formatting)
    const cleanedContent = trimmedSection
      .replace(/\*\*/g, "")
      .replace(/\\$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // Skip very short content
    if (cleanedContent.length < 50) continue;

    // Split long content into smaller chunks
    if (cleanedContent.length > CONFIG.maxChunkLength) {
      const subChunks = splitIntoChunks(cleanedContent, CONFIG.maxChunkLength);
      for (let i = 0; i < subChunks.length; i++) {
        chunks.push({
          moduleId: currentModule,
          topicId: currentTopic,
          language,
          contentType,
          title: subChunks.length > 1 ? `${title} (Part ${i + 1})` : title,
          content: subChunks[i],
        });
      }
    } else {
      chunks.push({
        moduleId: currentModule,
        topicId: currentTopic,
        language,
        contentType,
        title,
        content: cleanedContent,
      });
    }
  }

  return chunks;
}

/**
 * Split long text into smaller chunks
 */
function splitIntoChunks(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);

  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length + 2 <= maxLength) {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Escape SQL string
 */
function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

/**
 * Format embedding as SQL vector literal
 */
function formatEmbedding(embedding: number[]): string {
  return `'[${embedding.join(",")}]'::vector(${CONFIG.embeddingDimensions})`;
}

/**
 * Generate SQL migration file
 */
async function generateSqlMigration(chunks: ContentChunk[]): Promise<string> {
  const header = `-- =====================================================
-- Migration 134: Seed Curriculum Content
-- =====================================================
--
-- Auto-generated by apps/db/scripts/generate-curriculum-seed.ts
-- Generated at: ${new Date().toISOString()}
--
-- This migration populates the curriculum_content table with
-- curriculum data parsed from markdown files and embeddings
-- generated via Google text-embedding-004.
--
-- Total chunks: ${chunks.length}
-- Languages: en, hi, as
--
-- =====================================================

-- Clear existing curriculum content (optional - uncomment if needed)
-- TRUNCATE TABLE curriculum_content;

`;

  const inserts: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    // Generate embedding
    try {
      console.log(`Generating embedding ${i + 1}/${chunks.length}: ${chunk.topicId} (${chunk.language})`);

      chunk.embedding = await getEmbedding(chunk.content);
      stats.embeddingsGenerated++;

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, CONFIG.rateLimitDelayMs));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      stats.errors.push(`Embedding failed for ${chunk.topicId} (${chunk.language}): ${errorMsg}`);
      console.error(`Embedding failed: ${errorMsg}`);
      // Continue without embedding
      chunk.embedding = undefined;
    }

    const embeddingValue = chunk.embedding
      ? formatEmbedding(chunk.embedding)
      : "NULL";

    const sql = `INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content, embedding)
VALUES ('${escapeSql(chunk.moduleId)}', '${escapeSql(chunk.topicId)}', '${escapeSql(chunk.language)}', '${escapeSql(chunk.contentType)}', '${escapeSql(chunk.title)}', '${escapeSql(chunk.content)}', ${embeddingValue});`;

    inserts.push(sql);

    // Update stats
    stats.totalChunks++;
    stats.chunksPerLanguage[chunk.language] = (stats.chunksPerLanguage[chunk.language] || 0) + 1;
    stats.chunksPerType[chunk.contentType] = (stats.chunksPerType[chunk.contentType] || 0) + 1;
  }

  const footer = `

-- =====================================================
-- Statistics
-- =====================================================
-- Total chunks inserted: ${stats.totalChunks}
-- English chunks: ${stats.chunksPerLanguage.en || 0}
-- Hindi chunks: ${stats.chunksPerLanguage.hi || 0}
-- Assamese chunks: ${stats.chunksPerLanguage.as || 0}
-- Embeddings generated: ${stats.embeddingsGenerated}
-- Errors: ${stats.errors.length}
--
-- Content types:
${Object.entries(stats.chunksPerType).map(([type, count]) => `--   ${type}: ${count}`).join("\n")}
-- =====================================================

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
`;

  return header + inserts.join("\n\n") + footer;
}

/**
 * Main execution
 */
async function main() {
  console.log("=".repeat(60));
  console.log("Curriculum Content Seed Generator");
  console.log("=".repeat(60));
  console.log();

  // Check for API key
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error("ERROR: GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY environment variable is required");
    console.log();
    console.log("Set it before running:");
    console.log("  export GEMINI_API_KEY=your-api-key");
    console.log("  npx tsx apps/db/scripts/generate-curriculum-seed.ts");
    process.exit(1);
  }

  console.log("API key found. Starting parse...");
  console.log();

  // Parse all language files
  const allChunks: ContentChunk[] = [];

  for (const [language, filePath] of Object.entries(CONFIG.inputFiles)) {
    console.log(`Parsing ${language}: ${filePath}`);
    const chunks = parseMarkdownFile(filePath, language);
    console.log(`  Found ${chunks.length} content chunks`);
    allChunks.push(...chunks);
  }

  console.log();
  console.log(`Total chunks to process: ${allChunks.length}`);
  console.log();

  if (allChunks.length === 0) {
    console.error("ERROR: No content chunks found. Check file paths and content.");
    process.exit(1);
  }

  // Generate SQL migration with embeddings
  console.log("Generating embeddings and SQL migration...");
  console.log("(This may take a few minutes due to API rate limits)");
  console.log();

  const sqlContent = await generateSqlMigration(allChunks);

  // Write output file
  const outputPath = path.resolve(process.cwd(), CONFIG.outputFile);
  fs.writeFileSync(outputPath, sqlContent, "utf-8");

  console.log();
  console.log("=".repeat(60));
  console.log("COMPLETE");
  console.log("=".repeat(60));
  console.log();
  console.log(`Output: ${CONFIG.outputFile}`);
  console.log();
  console.log("Statistics:");
  console.log(`  Total chunks: ${stats.totalChunks}`);
  console.log(`  English: ${stats.chunksPerLanguage.en || 0}`);
  console.log(`  Hindi: ${stats.chunksPerLanguage.hi || 0}`);
  console.log(`  Assamese: ${stats.chunksPerLanguage.as || 0}`);
  console.log(`  Embeddings generated: ${stats.embeddingsGenerated}`);
  console.log(`  Errors: ${stats.errors.length}`);
  console.log();
  console.log("Content types:");
  for (const [type, count] of Object.entries(stats.chunksPerType)) {
    console.log(`  ${type}: ${count}`);
  }

  if (stats.errors.length > 0) {
    console.log();
    console.log("Errors encountered:");
    for (const error of stats.errors.slice(0, 10)) {
      console.log(`  - ${error}`);
    }
    if (stats.errors.length > 10) {
      console.log(`  ... and ${stats.errors.length - 10} more`);
    }
  }

  console.log();
  console.log("Next steps:");
  console.log("  1. Review the generated SQL file");
  console.log("  2. Apply the migration:");
  console.log("     supabase db push");
  console.log("  3. Verify data:");
  console.log("     SELECT COUNT(*) FROM curriculum_content;");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
