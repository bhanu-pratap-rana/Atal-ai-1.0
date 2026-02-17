/**
 * Imagen Image Generation API
 *
 * Endpoint to generate or retrieve cached educational images.
 * Uses Vertex AI Imagen 3 for generation, Supabase Storage for caching.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateImage, getImageFromCache, TOPIC_IMAGE_PROMPTS, type ImagenParams } from "@/lib/ai/services/imagen-service";
import { getCurrentUser } from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";
import { checkRateLimit } from "@/lib/rate-limiter-distributed";
import { RATE_LIMITS } from "@/lib/constants/rate-limits";

export const runtime = "nodejs";
export const maxDuration = 30; // 30 seconds for image generation

/**
 * Request validation schema
 * Validates prompt length and enum values
 */
const ImagenRequestSchema = z.object({
  // Increased limit to 1500 chars to allow detailed AI-generated visual descriptions
  prompt: z.string().min(1, "Prompt is required").max(1500, "Prompt must be 1500 characters or less"),
  language: z.enum(["en", "hi", "as"]).default("en"),
  imageType: z.enum(["diagram", "concept", "example", "cultural", "icon"]).default("concept"),
  topicId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authentication check - CRITICAL
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // SEC-014 FIX: Rate limit to prevent Imagen API cost explosion
    const isAllowed = await checkRateLimit(`imagen:${user.id}`, RATE_LIMITS.imageGeneration);
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before generating another image." },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = ImagenRequestSchema.safeParse(body);

    if (!validation.success) {
      // Log validation error details for debugging
      authLogger.error("[Imagen API] Validation failed", {
        errors: validation.error.issues,
        receivedBody: {
          promptLength: body?.prompt?.length ?? "undefined",
          promptPreview: body?.prompt?.slice?.(0, 50) ?? "undefined",
          language: body?.language ?? "undefined",
          imageType: body?.imageType ?? "undefined",
        },
      });
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const { prompt, language, imageType, topicId } = validation.data;

    // Use pre-defined English prompt for known topics (guaranteed high-quality)
    const topicPrompt = topicId ? TOPIC_IMAGE_PROMPTS[topicId] : undefined;

    // Build params for image generation
    const params: ImagenParams = topicPrompt
      ? { ...topicPrompt, language, size: "512x512", style: "educational" }
      : { prompt, language, imageType, size: "512x512", style: "educational" };

    // Check cache first
    const cached = await getImageFromCache(params);
    if (cached) {
      // Cached images can be cached for 30 days
      return NextResponse.json({
        url: cached.url,
        imageId: cached.imageId,
        cached: true,
      }, {
        headers: {
          // SEC-013 FIX: Use private cache for authenticated content
          "Cache-Control": "private, max-age=2592000, stale-while-revalidate=86400",
        },
      });
    }

    // Generate new image
    const result = await generateImage(params);

    // Newly generated images can also be cached
    return NextResponse.json({
      url: result.url,
      imageId: result.imageId,
      cached: result.cached,
    }, {
      headers: {
        // SEC-013 FIX: Use private cache for authenticated content
        "Cache-Control": "private, max-age=2592000, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    // Log detailed error server-side only
    authLogger.error(
      "[Imagen API] Generation failed",
      {
        error: error instanceof Error ? error.message : String(error),
        // Only include stack in development
        stack: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
      }
    );

    // Return generic error to client - don't expose internal details
    return NextResponse.json({
      url: null,
      error: "Image generation failed",
      fallback: true,
    }, { status: 500 });
  }
}
