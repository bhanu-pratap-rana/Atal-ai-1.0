/**
 * Shared Lesson AI Response Parser
 *
 * DUP-2 FIX: Extracted from lesson/generate and lesson/download routes
 * to eliminate duplication of JSON cleaning and validation logic.
 */

import { authLogger } from "@/lib/auth-logger";
import { AIResponseSchema, LessonChunkSchema, type ValidatedAIResponse } from "./lesson-schemas";

/**
 * Clean raw AI text: strip markdown fences, normalize Unicode, fix quotes.
 */
function cleanAIText(response: string): string {
  let cleaned = response.trim();

  // Remove markdown code blocks if present
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  }
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  // Normalize Unicode (important for Assamese/Hindi combining characters)
  cleaned = cleaned.normalize("NFC");

  // Replace smart quotes and typographic characters that break JSON
  cleaned = cleaned
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/[\u2013\u2014]/g, "-");

  // Extract JSON object if surrounded by other text
  if (!cleaned.startsWith("{")) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      cleaned = match[0];
    }
  }

  return cleaned;
}

/**
 * Try to parse JSON, with control character repair as fallback.
 */
function tryParseJSON(cleaned: string): unknown {
  try {
    return JSON.parse(cleaned);
  } catch {
    // Attempt repair: fix unescaped control characters
    const repaired = cleaned.replace(/[\x00-\x1F\x7F]/g, (ch) => {
      if (ch === "\n" || ch === "\r" || ch === "\t") return ch;
      return "";
    });
    return JSON.parse(repaired);
  }
}

/**
 * Salvage valid chunks from a truncated JSON response.
 * When AI output is cut off mid-JSON, extract complete chunk objects
 * that appear before the truncation point.
 */
function salvageChunksFromTruncated(cleaned: string): ValidatedAIResponse | null {
  // Find all complete JSON objects that look like chunks
  // Match objects with at least type, heading, and content fields
  const chunkPattern = /\{[^{}]*"type"\s*:\s*"[^"]+?"[^{}]*"heading"\s*:\s*"[^"]*?"[^{}]*"content"\s*:\s*"(?:[^"\\]|\\.)*?"[^{}]*\}/g;
  const matches = cleaned.match(chunkPattern);

  if (!matches || matches.length === 0) return null;

  const validChunks = [];
  for (const match of matches) {
    try {
      const parsed = JSON.parse(match);
      const result = LessonChunkSchema.safeParse(parsed);
      if (result.success) {
        validChunks.push(result.data);
      }
    } catch {
      // Skip malformed chunk
    }
  }

  if (validChunks.length === 0) return null;

  authLogger.debug("[parseAIResponseJSON] Salvaged chunks from truncated response", {
    found: matches.length,
    valid: validChunks.length,
  });

  return { chunks: validChunks };
}

/**
 * Clean and parse AI-generated JSON response.
 *
 * Handles: markdown code fences, Unicode normalization,
 * smart quotes, control characters, JSON extraction,
 * and truncated response salvaging.
 *
 * @returns Validated response conforming to AIResponseSchema
 * @throws Error if JSON parsing or schema validation fails
 */
export function parseAIResponseJSON(response: string): ValidatedAIResponse {
  const cleaned = cleanAIText(response);

  // Try full JSON parse first
  let rawParsed: unknown;
  try {
    rawParsed = tryParseJSON(cleaned);
  } catch (parseError) {
    // JSON is broken (likely truncated) — try to salvage valid chunks
    authLogger.warn("[parseAIResponseJSON] JSON parse failed, attempting chunk salvage", {
      snippet: response.slice(0, 500),
      length: response.length,
    });

    const salvaged = salvageChunksFromTruncated(cleaned);
    if (salvaged) return salvaged;

    authLogger.error("[parseAIResponseJSON] JSON parse failed:", parseError);
    throw new Error("Failed to parse AI response as JSON");
  }

  // Validate AI response structure with Zod schema
  const validationResult = AIResponseSchema.safeParse(rawParsed);
  if (!validationResult.success) {
    authLogger.warn("[parseAIResponseJSON] Schema validation failed, attempting chunk salvage:", {
      errors: validationResult.error.errors,
    });

    // Schema validation failed — try salvaging individual chunks
    // This handles cases where the top-level structure is fine but some chunks are malformed
    const salvaged = salvageChunksFromTruncated(cleaned);
    if (salvaged) return salvaged;

    throw new Error("AI response failed schema validation");
  }

  return validationResult.data;
}
