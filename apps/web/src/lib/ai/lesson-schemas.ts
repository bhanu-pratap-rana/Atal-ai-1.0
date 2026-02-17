/**
 * Shared Lesson Zod Schemas
 *
 * DUP-1 FIX: Extracted from lesson/generate and lesson/download routes
 * to eliminate duplication of validation schemas.
 */

import { z } from "zod";

/** Valid chunk types for the lesson player UI */
const VALID_CHUNK_TYPES = ["concept", "example", "practice", "checkpoint"] as const;
type ChunkType = (typeof VALID_CHUNK_TYPES)[number];

/** Map non-standard AI chunk types to valid ones so content is preserved */
const CHUNK_TYPE_MAP: Record<string, ChunkType> = {
  summary: "concept",
  introduction: "concept",
  intro: "concept",
  explanation: "concept",
  overview: "concept",
  review: "concept",
  definition: "concept",
  activity: "practice",
  exercise: "practice",
  quiz: "checkpoint",
  question: "checkpoint",
  assessment: "checkpoint",
  demonstration: "example",
  illustration: "example",
  scenario: "example",
};

/**
 * Accept any string type from AI, map to valid enum.
 * Prevents schema rejection when AI invents types like "summary".
 */
const ChunkTypeSchema = z.string().transform((val): ChunkType => {
  const lower = val.toLowerCase();
  if ((VALID_CHUNK_TYPES as readonly string[]).includes(lower)) return lower as ChunkType;
  return CHUNK_TYPE_MAP[lower] ?? "concept";
});

export const CheckpointQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).min(2).max(6),
  correctIndex: z.number().int().min(0),
  explanation: z.string(),
}).refine((data) => data.correctIndex < data.options.length, {
  message: "correctIndex must be less than options length",
  path: ["correctIndex"],
}).optional();

export const LessonChunkSchema = z.object({
  type: ChunkTypeSchema,
  duration: z.string(),
  heading: z.string(),
  content: z.string(),
  visualDescription: z.string().optional(),
  checkpointQuestion: CheckpointQuestionSchema,
});

export const AIResponseSchema = z.object({
  chunks: z.array(LessonChunkSchema).min(1, "At least one chunk required"),
});

export type ValidatedAIResponse = z.infer<typeof AIResponseSchema>;
