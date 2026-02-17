/**
 * TTS API Route - AI4Bharat Text-to-Speech
 *
 * Converts text to speech with Assamese support.
 * Primary: HuggingFace Inference API
 * Fallback: Self-hosted on Render.com
 *
 * Supported Languages:
 * - English (en)
 * - Hindi (hi)
 * - Assamese (as) - Critical for ATAL AI
 */

import { z } from "zod";
import { ttsService } from "@/lib/ai/services/tts-service";
import { getCurrentUser } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limiter-distributed";
import { RATE_LIMITS } from "@/lib/constants/rate-limits";
import { AI_CONTENT_LIMITS } from "@/lib/constants/validation-limits";
import { authLogger } from "@/lib/auth-logger";

/**
 * Request validation schema for TTS POST
 * Validates text length, language enum, and optional emotion
 */
const TTSRequestSchema = z.object({
  text: z.string()
    .min(1, "Text is required")
    .max(AI_CONTENT_LIMITS.ttsMaxLength, `Text must be ${AI_CONTENT_LIMITS.ttsMaxLength} characters or less`),
  language: z.enum(["en", "hi", "as"]).default("en"),
  emotion: z.enum(["neutral", "friendly", "encouraging", "calm"]).optional(),
});

export async function POST(request: Request): Promise<Response> {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit check
    const isAllowed = await checkRateLimit(`tts:${user.id}`, RATE_LIMITS.tts);
    if (!isAllowed) {
      return Response.json(
        { error: "Rate limit exceeded. Please wait before making another TTS request." },
        { status: 429 },
      );
    }

    // Parse and validate request body with Zod
    const body = await request.json();
    const validation = TTSRequestSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        { error: validation.error.issues[0]?.message || "Invalid request" },
        { status: 400 },
      );
    }

    const { text, language, emotion } = validation.data;

    // API-002 FIX: Generate ETag from request parameters for efficient caching
    // Use a simple hash of the input to create a unique identifier
    const etagInput = `${text}:${language}:${emotion || "neutral"}`;
    const etagHash = Buffer.from(etagInput).toString("base64").slice(0, 32);
    const etag = `"tts-${etagHash}"`;

    // Try to synthesize speech
    try {
      const audioBuffer = await ttsService.synthesize(text, language, {
        emotion,
      });

      // Return audio as WAV with ETag for conditional requests
      return new Response(audioBuffer, {
        headers: {
          "Content-Type": "audio/wav",
          // SEC-013 FIX: Use private cache for authenticated content
          "Cache-Control": "private, max-age=3600", // Cache for 1 hour
          "Content-Length": String(audioBuffer.byteLength),
          "ETag": etag,
        },
      });
    } catch (synthesisError) {
      // Check if this is the expected "use browser TTS" signal
      if (synthesisError instanceof Error &&
          synthesisError.message.includes("USE_BROWSER_TTS")) {
        // Return 200 with JSON indicating browser TTS should be used
        // This avoids console 500 errors while still signaling the client
        return Response.json({
          useBrowserTTS: true,
          reason: "Server TTS unavailable, please use browser Speech Synthesis",
          supportedLanguages: ["en", "hi", "as"],
        }, {
          status: 200,
          headers: {
            // SEC-013 FIX: Use private cache for authenticated content
            "Cache-Control": "private, max-age=86400", // Cache for 24 hours
          },
        });
      }
      // Re-throw other errors
      throw synthesisError;
    }
  } catch (error) {
    authLogger.error("[TTS API] Error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("model is loading")) {
        return Response.json(
          { error: "TTS model is loading. Please try again in a few seconds." },
          { status: 503 },
        );
      }
    }

    return Response.json({ error: "TTS generation failed" }, { status: 500 });
  }
}

/**
 * Health check for TTS service
 * SECURITY: Requires authentication to prevent reconnaissance attacks
 */
export async function GET(): Promise<Response> {
  try {
    // SECURITY: Authenticate user to prevent unauthorized access to TTS provider info
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit check for health endpoint (less strict than synthesis)
    const isAllowed = await checkRateLimit(`tts:health:${user.id}`, RATE_LIMITS.ttsHealth);
    if (!isAllowed) {
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const status = await ttsService.isAvailable();

    return Response.json({
      available: status.available,
      provider: status.provider,
      supportedLanguages: ttsService.getSupportedLanguages(),
      // Don't expose detailed errors to client
      error: status.error ? "Service temporarily unavailable" : undefined,
    });
  } catch (error) {
    authLogger.error("[TTS API] Health check error:", error);
    return Response.json(
      {
        available: false,
        error: "Health check failed",
      },
      { status: 500 },
    );
  }
}
