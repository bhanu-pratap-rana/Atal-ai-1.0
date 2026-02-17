/**
 * Google Cloud Text-to-Speech Service
 *
 * High-quality TTS with excellent Hindi and regional language support.
 * Uses Google Cloud TTS API with WaveNet and Neural2 voices.
 *
 * Free Tier: 1 million characters/month (WaveNet), 4 million standard
 * Pricing: https://cloud.google.com/text-to-speech/pricing
 *
 * Supported Languages:
 * - English (en-IN) - Indian English voices
 * - Hindi (hi-IN) - Multiple WaveNet voices
 * - Assamese (as-IN) - Falls back to Bengali (bn-IN) with similar pronunciation
 *
 * Setup:
 * 1. Enable Cloud Text-to-Speech API in Google Cloud Console
 * 2. Create service account with Text-to-Speech User role
 * 3. Set GOOGLE_APPLICATION_CREDENTIALS to service account JSON path
 *    OR set GOOGLE_CLOUD_TTS_API_KEY for API key authentication
 */

import { authLogger } from "@/lib/auth-logger";

// ============================================================================
// TYPES
// ============================================================================

export type TTSLanguage = "en" | "hi" | "as";

export interface GoogleTTSOptions {
  /** Speaking rate: 0.25 to 4.0 (1.0 is normal) */
  speakingRate?: number;
  /** Pitch: -20.0 to 20.0 semitones (0.0 is default) */
  pitch?: number;
  /** Volume gain in dB: -96.0 to 16.0 */
  volumeGainDb?: number;
  /** Voice gender preference */
  gender?: "MALE" | "FEMALE" | "NEUTRAL";
  /** Use WaveNet voice if available (higher quality, uses more quota) */
  useWaveNet?: boolean;
}

interface VoiceConfig {
  languageCode: string;
  name: string;
  ssmlGender: "MALE" | "FEMALE" | "NEUTRAL";
}

interface SynthesizeRequest {
  input: { text: string } | { ssml: string };
  voice: VoiceConfig;
  audioConfig: {
    audioEncoding: "LINEAR16" | "MP3" | "OGG_OPUS";
    speakingRate?: number;
    pitch?: number;
    volumeGainDb?: number;
    sampleRateHertz?: number;
  };
}

interface SynthesizeResponse {
  audioContent: string; // Base64 encoded audio
}

// ============================================================================
// VOICE CONFIGURATION
// ============================================================================

/**
 * Voice mappings for each supported language
 * Using WaveNet/Neural2 voices for natural sound
 */
const VOICE_MAP: Record<TTSLanguage, VoiceConfig> = {
  en: {
    languageCode: "en-IN",
    name: "en-IN-Neural2-A", // Indian English, female, neural
    ssmlGender: "FEMALE",
  },
  hi: {
    languageCode: "hi-IN",
    name: "hi-IN-Neural2-A", // Hindi, female, neural
    ssmlGender: "FEMALE",
  },
  as: {
    // Assamese is not directly supported, use Bengali as closest alternative
    // Bengali and Assamese share script similarities
    // Note: Bengali doesn't have Neural2 voices, using Wavenet (high quality)
    languageCode: "bn-IN",
    name: "bn-IN-Wavenet-A", // Bengali, female, wavenet (high quality)
    ssmlGender: "FEMALE",
  },
};

/**
 * Alternative voices for fallback
 */
const FALLBACK_VOICES: Record<TTSLanguage, VoiceConfig> = {
  en: {
    languageCode: "en-IN",
    name: "en-IN-Standard-A",
    ssmlGender: "FEMALE",
  },
  hi: {
    languageCode: "hi-IN",
    name: "hi-IN-Standard-A",
    ssmlGender: "FEMALE",
  },
  as: {
    languageCode: "bn-IN", // Fall back to Bengali Standard if Neural2 fails
    name: "bn-IN-Standard-A",
    ssmlGender: "FEMALE",
  },
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class GoogleCloudTTSService {
  private apiKey: string | undefined;
  private projectId: string | undefined;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    // Only use API key if it's actually set (not empty string)
    const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;
    this.apiKey = apiKey && apiKey.trim().length > 0 ? apiKey : undefined;
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT;

    // BP-8 FIX: Warn if TTS is not configured (helps diagnose deployment issues)
    if (!this.isConfigured()) {
      authLogger.warn("[GoogleCloudTTS] TTS not configured — missing GOOGLE_CLOUD_TTS_API_KEY and GOOGLE_APPLICATION_CREDENTIALS");
    }
  }

  /**
   * Check if Google Cloud TTS is configured
   */
  isConfigured(): boolean {
    // API key auth or service account auth
    return !!(this.apiKey || process.env.GOOGLE_APPLICATION_CREDENTIALS);
  }

  /**
   * Synthesize speech from text
   *
   * @param text - Text to convert to speech (max 5000 characters)
   * @param language - Target language (en, hi, as)
   * @param options - Optional TTS settings
   * @returns Audio as ArrayBuffer (WAV format)
   */
  async synthesize(
    text: string,
    language: TTSLanguage,
    options: GoogleTTSOptions = {},
  ): Promise<ArrayBuffer> {
    if (!this.isConfigured()) {
      throw new Error("Google Cloud TTS is not configured");
    }

    if (!text || text.trim().length === 0) {
      throw new Error("Text is required for TTS synthesis");
    }

    // Google Cloud TTS has a 5000 character limit per request
    if (text.length > 5000) {
      throw new Error("Text exceeds 5000 character limit. Please split into smaller chunks.");
    }

    const voice = options.useWaveNet !== false ? VOICE_MAP[language] : FALLBACK_VOICES[language];

    const request: SynthesizeRequest = {
      input: { text },
      voice: {
        languageCode: voice.languageCode,
        name: voice.name,
        ssmlGender: options.gender || voice.ssmlGender,
      },
      audioConfig: {
        audioEncoding: "LINEAR16", // WAV format
        speakingRate: options.speakingRate || 1.0,
        pitch: options.pitch || 0.0,
        volumeGainDb: options.volumeGainDb || 0.0,
        sampleRateHertz: 24000, // Good quality for speech
      },
    };

    try {
      const response = await this.callAPI(request);

      // Convert base64 to ArrayBuffer
      const binaryString = atob(response.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      authLogger.debug("[Google TTS] Synthesis successful", {
        language,
        textLength: text.length,
        audioSize: bytes.length,
      });

      return bytes.buffer;
    } catch (error) {
      // Try fallback voice if primary fails
      if (voice !== FALLBACK_VOICES[language]) {
        authLogger.warn("[Google TTS] Primary voice failed, trying fallback", {
          language,
          error: error instanceof Error ? error.message : String(error),
        });

        const fallbackVoice = FALLBACK_VOICES[language];
        request.voice = {
          languageCode: fallbackVoice.languageCode,
          name: fallbackVoice.name,
          ssmlGender: options.gender || fallbackVoice.ssmlGender,
        };

        const response = await this.callAPI(request);
        const binaryString = atob(response.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
      }

      throw error;
    }
  }

  /**
   * Call Google Cloud TTS API
   */
  private async callAPI(request: SynthesizeRequest): Promise<SynthesizeResponse> {
    let url: string;
    let headers: Record<string, string>;

    if (this.apiKey) {
      // API key authentication
      url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`;
      headers = {
        "Content-Type": "application/json",
      };
    } else {
      // Service account authentication
      const token = await this.getAccessToken();
      url = "https://texttospeech.googleapis.com/v1/text:synthesize";
      headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
    }

    authLogger.debug("[Google TTS] Calling API", {
      voice: request.voice.name,
      languageCode: request.voice.languageCode,
    });

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      authLogger.error("[Google TTS] API error", {
        status: response.status,
        error: errorData,
      });

      if (response.status === 429) {
        throw new Error("Google TTS quota exceeded. Please try again later.");
      }
      if (response.status === 403) {
        throw new Error("Google TTS access denied. Check API key or service account permissions.");
      }

      throw new Error(
        `Google TTS API error: ${response.status} - ${errorData.error?.message || "Unknown error"}`,
      );
    }

    return response.json();
  }

  /**
   * Get OAuth2 access token for service account authentication
   * Uses Google's metadata server or service account JSON
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Try to get token from Google metadata server (running on GCP)
    try {
      const metadataResponse = await fetch(
        "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
        {
          headers: { "Metadata-Flavor": "Google" },
        },
      );

      if (metadataResponse.ok) {
        const data = await metadataResponse.json();
        const token: string = data.access_token;
        this.accessToken = token;
        this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // Refresh 1 min early
        return token;
      }
    } catch {
      // Not running on GCP, try service account JSON
    }

    // Try to load service account credentials from GOOGLE_APPLICATION_CREDENTIALS
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credentialsPath) {
      throw new Error(
        "No Google Cloud credentials configured. Set GOOGLE_CLOUD_TTS_API_KEY or GOOGLE_APPLICATION_CREDENTIALS.",
      );
    }

    // For server-side Node.js, we need to use the Google Auth Library
    // In Vercel/serverless, GOOGLE_APPLICATION_CREDENTIALS should point to a JSON file
    // or the credentials should be in environment variables

    try {
      // Dynamic import to avoid bundling issues
      const { GoogleAuth } = await import("google-auth-library");
      const auth = new GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      });
      const client = await auth.getClient();
      const tokenResponse = await client.getAccessToken();

      if (!tokenResponse.token) {
        throw new Error("Failed to get access token from service account");
      }

      this.accessToken = tokenResponse.token;
      // Tokens typically expire in 1 hour
      this.tokenExpiry = Date.now() + 50 * 60 * 1000; // Refresh after 50 minutes
      return this.accessToken;
    } catch (error) {
      authLogger.error("[Google TTS] Failed to get access token", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error("Failed to authenticate with Google Cloud. Check your credentials.");
    }
  }

  /**
   * Check if service is available
   */
  async isAvailable(): Promise<{
    available: boolean;
    provider: "google-cloud";
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return {
        available: false,
        provider: "google-cloud",
        error: "Google Cloud TTS not configured",
      };
    }

    try {
      // Try a minimal synthesis to verify credentials work
      await this.synthesize("test", "en", { useWaveNet: false });
      return {
        available: true,
        provider: "google-cloud",
      };
    } catch (error) {
      return {
        available: false,
        provider: "google-cloud",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): TTSLanguage[] {
    return ["en", "hi", "as"];
  }

  /**
   * Get voice info for a language
   */
  getVoiceInfo(language: TTSLanguage): {
    languageCode: string;
    voiceName: string;
    quality: "neural" | "wavenet" | "standard";
  } {
    const voice = VOICE_MAP[language];
    let quality: "neural" | "wavenet" | "standard" = "standard";
    if (voice.name.includes("Neural")) quality = "neural";
    else if (voice.name.includes("Wavenet")) quality = "wavenet";

    return {
      languageCode: voice.languageCode,
      voiceName: voice.name,
      quality,
    };
  }
}

// Export singleton instance
export const googleCloudTTS = new GoogleCloudTTSService();
