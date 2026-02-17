/**
 * TTS Service - Multi-Provider Text-to-Speech
 *
 * Priority order:
 * 1. Google Cloud TTS (high quality, 1M chars/month free)
 * 2. Browser Speech Synthesis (fallback, always free)
 *
 * Supported Languages:
 * - English (en) - Excellent support on all providers
 * - Hindi (hi) - Google Cloud Neural2 voices, browser TTS in Chrome
 * - Assamese (as) - Falls back to Bengali (similar script/pronunciation)
 *
 * Setup for Google Cloud TTS:
 * 1. Enable Cloud Text-to-Speech API in Google Cloud Console
 * 2. Set GOOGLE_CLOUD_TTS_API_KEY or GOOGLE_APPLICATION_CREDENTIALS
 */

import { authLogger } from "@/lib/auth-logger";
import { googleCloudTTS, type GoogleTTSOptions } from "./google-cloud-tts";

/**
 * Supported TTS languages with Assamese priority
 */
export type TTSLanguage = "en" | "hi" | "as";

/**
 * Voice configuration for each language
 */
export interface VoiceConfig {
  voice: string;
  emotion?: "neutral" | "friendly" | "encouraging" | "calm";
  speed?: number;
}

/**
 * TTS synthesis options
 */
export interface TTSOptions {
  emotion?: "neutral" | "friendly" | "encouraging" | "calm";
  speed?: number;
}

/**
 * NOTE: HuggingFace Inference API discontinued TTS support in 2025 (410 Gone).
 * These URLs are kept for reference but no longer work.
 * The service now returns an error to trigger client-side browser TTS fallback.
 */
const TTS_MODEL_URLS: Record<TTSLanguage, string> = {
  en: "disabled",
  hi: "disabled",
  as: "disabled",
};

/**
 * Language codes mapping for TTS
 */
const LANGUAGE_VOICE_MAP: Record<TTSLanguage, VoiceConfig> = {
  en: {
    voice: "default",
    emotion: "friendly",
    speed: 1,
  },
  hi: {
    voice: "default",
    emotion: "friendly",
    speed: 1,
  },
  as: {
    voice: "default",
    emotion: "friendly",
    speed: 0.95,
  },
};

/**
 * Multi-Model TTS Service
 * Uses HuggingFace Inference API with language-specific models
 */
export class TTSService {
  private readonly renderFallbackUrl = process.env.TTS_FALLBACK_URL || "";

  /**
   * Get the HuggingFace model URL for a language
   */
  private getModelUrl(language: TTSLanguage): string {
    return TTS_MODEL_URLS[language] || TTS_MODEL_URLS.en;
  }

  /**
   * Synthesize speech from text
   *
   * Uses Google Cloud TTS if configured, otherwise signals browser TTS fallback.
   *
   * @param text - Text to convert to speech
   * @param language - Target language (en, hi, as)
   * @param options - Optional TTS settings
   * @returns Audio as ArrayBuffer (WAV format) or throws for browser fallback
   */
  async synthesize(
    text: string,
    language: TTSLanguage,
    options: TTSOptions = {},
  ): Promise<ArrayBuffer> {
    if (!text || text.trim().length === 0) {
      throw new Error("Text is required for TTS synthesis");
    }

    // Try Google Cloud TTS first (high quality)
    if (googleCloudTTS.isConfigured()) {
      try {
        authLogger.info("[TTS] Using Google Cloud TTS", {
          language,
          textLength: text.length,
        });

        const googleOptions: GoogleTTSOptions = {
          speakingRate: options.speed || 1.0,
          useWaveNet: true, // Use high-quality voices
        };

        // Map emotion to speaking rate/pitch adjustments
        if (options.emotion === "friendly") {
          googleOptions.pitch = 1.0; // Slightly higher pitch
          googleOptions.speakingRate = 1.05;
        } else if (options.emotion === "encouraging") {
          googleOptions.pitch = 2.0;
          googleOptions.speakingRate = 1.1;
        } else if (options.emotion === "calm") {
          googleOptions.pitch = -1.0; // Slightly lower pitch
          googleOptions.speakingRate = 0.95;
        }

        return await googleCloudTTS.synthesize(text, language, googleOptions);
      } catch (error) {
        authLogger.warn("[TTS] Google Cloud TTS failed, falling back to browser TTS", {
          error: error instanceof Error ? error.message : String(error),
          language,
        });

        // If it's a quota error, still try browser fallback
        if (error instanceof Error && error.message.includes("quota")) {
          throw new Error("USE_BROWSER_TTS: Google Cloud TTS quota exceeded. Please use browser Speech Synthesis.");
        }

        // For other errors, also fall back to browser TTS
        throw new Error("USE_BROWSER_TTS: Server TTS failed. Please use browser Speech Synthesis.");
      }
    }

    // No server TTS configured, signal browser fallback
    authLogger.info("[TTS] No server TTS configured, using browser TTS", {
      language,
      textLength: text.length,
    });

    throw new Error("USE_BROWSER_TTS: Server-side TTS is not configured. Please use browser Speech Synthesis.");
  }

  /**
   * Call HuggingFace Inference API with language-specific model
   * Uses MMS-TTS for all languages (Meta's Massively Multilingual Speech)
   */
  private async callHuggingFace(
    text: string,
    language: TTSLanguage,
  ): Promise<ArrayBuffer> {
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    if (!apiKey) {
      authLogger.error(
        "[TTS/HF] Missing HUGGINGFACE_API_KEY configuration",
        {},
      );
      throw new Error("HUGGINGFACE_API_KEY is required for TTS");
    }

    const modelUrl = this.getModelUrl(language);

    authLogger.debug("[TTS/HF] Calling HuggingFace API", {
      url: modelUrl,
      language,
      textLength: text.length,
    });

    // MMS-TTS uses simple input format: { inputs: "text to speak" }
    const response = await fetch(modelUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      authLogger.error("[TTS/HF] API error response", {
        status: response.status,
        error: errorText,
      });

      // Handle model loading state (common on HuggingFace)
      if (response.status === 503) {
        authLogger.warn("[TTS/HF] Model loading (503), retry needed", {});
        throw new Error("TTS model is loading, please retry");
      }

      throw new Error(
        `HuggingFace TTS error: ${response.status} - ${errorText}`,
      );
    }

    authLogger.debug("[TTS/HF] API call successful, returning audio buffer", {
      status: response.status,
    });
    return response.arrayBuffer();
  }

  /**
   * Call Render.com fallback API
   */
  private async callRenderFallback(
    text: string,
    config: VoiceConfig,
  ): Promise<ArrayBuffer> {
    if (!this.renderFallbackUrl) {
      throw new Error("No TTS fallback URL configured");
    }

    const response = await fetch(this.renderFallbackUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        voice: config.voice,
        emotion: config.emotion || "neutral",
        speed: config.speed || 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Render TTS error: ${response.status} - ${errorText}`);
    }

    return response.arrayBuffer();
  }

  /**
   * Get voice configuration for language
   */
  private getVoiceConfig(
    language: TTSLanguage,
    options: TTSOptions = {},
  ): VoiceConfig {
    const baseConfig = LANGUAGE_VOICE_MAP[language] || LANGUAGE_VOICE_MAP.en;

    return {
      ...baseConfig,
      emotion: options.emotion || baseConfig.emotion,
      speed: options.speed || baseConfig.speed,
    };
  }

  /**
   * Helper: Check HuggingFace API availability
   */
  private async checkHuggingFaceAvailability(): Promise<
    { available: true; provider: "huggingface" } | null
  > {
    if (!process.env.HUGGINGFACE_API_KEY) {
      authLogger.warn("[TTS] HUGGINGFACE_API_KEY not configured", {});
      return null;
    }

    authLogger.info("[TTS] Checking HuggingFace API availability", {
      models: Object.values(TTS_MODEL_URLS),
    });

    try {
      // Test with short English text
      await this.callHuggingFace("test", "en");
      authLogger.info(
        "[TTS] HuggingFace MMS-TTS API is AVAILABLE and responding",
        {},
      );
      return { available: true, provider: "huggingface" };
    } catch (error) {
      authLogger.warn("[TTS] HuggingFace API check failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Helper: Check Render fallback availability
   */
  private async checkRenderFallbackAvailability(): Promise<
    { available: true; provider: "render" } | null
  > {
    if (!this.renderFallbackUrl) {
      authLogger.debug(
        "[TTS] No Render fallback configured (TTS_FALLBACK_URL not set)",
        {},
      );
      return null;
    }

    authLogger.info("[TTS] Checking Render fallback availability", {
      url: this.renderFallbackUrl,
    });

    try {
      const response = await fetch(`${this.renderFallbackUrl}/health`);
      if (response.ok) {
        authLogger.info("[TTS] Render fallback is AVAILABLE", {});
        return { available: true, provider: "render" };
      }
      return null;
    } catch (error) {
      authLogger.warn("[TTS] Render fallback check failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Check if TTS service is available
   * Checks Google Cloud TTS first, falls back to browser TTS.
   */
  async isAvailable(): Promise<{
    available: boolean;
    provider: "google-cloud" | "huggingface" | "render" | "browser" | "none";
    error?: string;
  }> {
    // Check Google Cloud TTS first
    if (googleCloudTTS.isConfigured()) {
      try {
        const status = await googleCloudTTS.isAvailable();
        if (status.available) {
          authLogger.info("[TTS] Google Cloud TTS is available", {});
          return {
            available: true,
            provider: "google-cloud",
          };
        }
      } catch (error) {
        authLogger.warn("[TTS] Google Cloud TTS check failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Fall back to browser TTS (always available client-side)
    authLogger.info("[TTS] Using browser Speech Synthesis as fallback", {});
    return {
      available: true,
      provider: "browser",
      error: "Server TTS not configured, using browser Speech Synthesis",
    };
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): TTSLanguage[] {
    return ["en", "hi", "as"];
  }

  /**
   * Get language display name
   */
  getLanguageName(language: TTSLanguage): string {
    const names: Record<TTSLanguage, string> = {
      en: "English",
      hi: "Hindi",
      as: "Assamese",
    };
    return names[language] || "Unknown";
  }

  /**
   * Estimate audio duration based on text length
   * Useful for UI timing
   */
  estimateDuration(text: string, language: TTSLanguage): number {
    // Average speaking rate: ~150 words per minute
    // Adjust for language complexity
    const wordsPerSecond = {
      en: 2.5,
      hi: 2.3,
      as: 2.2, // Slightly slower for Assamese
    };

    const wordCount = text.split(/\s+/).length;
    const rate = wordsPerSecond[language] || 2.5;

    return Math.ceil(wordCount / rate);
  }
}

// Export singleton instance
export const ttsService = new TTSService();
