/**
 * Client-side TTS Utility
 *
 * Provides natural-sounding text-to-speech using:
 * 1. Primary: Server API (/api/voice/tts) → Google Cloud TTS Neural2 voices
 * 2. Fallback: Browser SpeechSynthesis
 *
 * Supports: English, Hindi, Assamese (via Bengali Neural2)
 */

import { clientLogger } from "@/lib/client-logger";

export type TTSLanguage = "en" | "hi" | "as";

interface TTSOptions {
  /** Language for TTS */
  language: TTSLanguage;
  /** Emotion/style of speech */
  emotion?: "neutral" | "friendly" | "encouraging" | "calm";
  /** Callback when speech starts */
  onStart?: () => void;
  /** Callback when speech ends */
  onEnd?: () => void;
  /** Callback on error */
  onError?: (error: string) => void;
}

// AudioContext for API-based TTS playback (survives autoplay restrictions)
let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
// Track current utterance for browser TTS
let _currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Initialize AudioContext on user gesture (click/tap).
 * Must be called from a user interaction handler (e.g., mic button click)
 * to bypass browser autoplay restrictions.
 */
export function initTTSAudioContext(): void {
  if (typeof window === "undefined") return;

  if (!audioContext || audioContext.state === "closed") {
    audioContext = new AudioContext();
    clientLogger.debug("[ClientTTS] AudioContext created");
  }

  // Resume if suspended (required after page load before user gesture)
  if (audioContext.state === "suspended") {
    audioContext.resume().then(() => {
      clientLogger.debug("[ClientTTS] AudioContext resumed");
    }).catch(() => {
      // Ignore - will retry on next user gesture
    });
  }
}

// Language codes for browser SpeechSynthesis fallback
const BROWSER_TTS_LANG: Record<TTSLanguage, string> = {
  en: "en-IN",
  hi: "hi-IN",
  as: "as-IN",
};

/**
 * Stop any currently playing TTS audio
 */
export function stopTTS(): void {
  // Stop AudioContext-based audio (server TTS)
  if (currentSource) {
    try {
      currentSource.stop();
    } catch {
      // Ignore - may already be stopped
    }
    currentSource = null;
  }

  // Stop browser TTS
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  _currentUtterance = null;
}

/**
 * Check if TTS is currently playing
 */
export function isTTSPlaying(): boolean {
  const contextPlaying = currentSource !== null;
  const browserPlaying =
    typeof window !== "undefined" &&
    window.speechSynthesis &&
    window.speechSynthesis.speaking;
  return Boolean(contextPlaying || browserPlaying);
}

/**
 * Speak text using server API (Google Cloud TTS) with browser fallback
 *
 * Priority:
 * 1. Server API (/api/voice/tts) - Google Cloud TTS Neural2 voices (high quality)
 * 2. Browser SpeechSynthesis - fallback when server is unavailable
 *
 * @param text - Text to speak
 * @param options - TTS options
 * @returns Promise that resolves when speech completes
 */
export async function speakText(
  text: string,
  options: TTSOptions
): Promise<void> {
  if (!text.trim()) {
    return;
  }

  const { language, emotion, onStart, onEnd, onError } = options;

  // Stop any current playback
  stopTTS();

  // Try server-side TTS first (Google Cloud Neural2 - high quality)
  try {
    clientLogger.debug("[ClientTTS] Trying server TTS API", { language });
    await speakWithServerAPI(text, language, emotion, onStart, onEnd);
    clientLogger.debug("[ClientTTS] Server TTS completed");
    return;
  } catch (apiError) {
    clientLogger.debug("[ClientTTS] Server TTS unavailable, falling back to browser", {
      error: apiError instanceof Error ? apiError.message : String(apiError),
    });
  }

  // Fallback to browser TTS
  try {
    clientLogger.debug("[ClientTTS] Using browser TTS fallback", { language });
    await speakWithBrowser(text, language, onStart, onEnd);
    clientLogger.debug("[ClientTTS] Browser TTS completed");
  } catch (browserError) {
    const errorMsg = "Speech synthesis failed";
    clientLogger.error("[ClientTTS] Browser TTS failed", {
      error: browserError instanceof Error ? browserError.message : String(browserError),
    });
    onError?.(errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Speak using server-side TTS API (Google Cloud TTS)
 * Uses AudioContext for playback to bypass browser autoplay restrictions.
 * AudioContext must be initialized via initTTSAudioContext() on user gesture first.
 */
async function speakWithServerAPI(
  text: string,
  language: TTSLanguage,
  emotion?: string,
  onStart?: () => void,
  onEnd?: () => void,
): Promise<void> {
  // AudioContext must be initialized on user gesture before this is called
  if (!audioContext || audioContext.state === "closed") {
    throw new Error("AudioContext not initialized - call initTTSAudioContext() on user gesture first");
  }

  // Resume if needed (should already be resumed from user gesture)
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  const response = await fetch("/api/voice/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language, emotion }),
  });

  if (!response.ok) {
    throw new Error(`Server TTS error: ${response.status}`);
  }

  // Check if server signals browser TTS fallback
  const contentType = response.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    const data = await response.json();
    if (data.useBrowserTTS) {
      throw new Error("Server signaled browser TTS fallback");
    }
    throw new Error("Unexpected JSON response from TTS API");
  }

  // Decode and play the audio buffer via AudioContext
  const rawBuffer = await response.arrayBuffer();
  if (rawBuffer.byteLength === 0) {
    throw new Error("Empty audio response from server");
  }

  const decodedBuffer = await audioContext.decodeAudioData(rawBuffer);

  return new Promise((resolve, reject) => {
    if (!audioContext) {
      reject(new Error("AudioContext closed"));
      return;
    }

    const source = audioContext.createBufferSource();
    source.buffer = decodedBuffer;
    source.connect(audioContext.destination);
    currentSource = source;

    onStart?.();

    source.onended = () => {
      currentSource = null;
      onEnd?.();
      resolve();
    };

    try {
      source.start(0);
    } catch (err) {
      currentSource = null;
      reject(err);
    }
  });
}

/**
 * Get the best available voice for a language
 */
function getBestVoice(language: TTSLanguage): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();

  // Language code mapping for voice search
  // Priority order for each language (more specific first, then similar languages)
  const langCodes: Record<TTSLanguage, string[]> = {
    en: ["en-IN", "en-US", "en-GB", "en"],
    hi: ["hi-IN", "hi"],
    // Assamese: Try Assamese → Bengali → Hindi (closer than English) → English
    as: ["as-IN", "bn-IN", "bn", "as", "hi-IN", "hi"],
  };

  // Log available voices for debugging TTS issues
  if (voices.length > 0) {
    const availableLangs = [...new Set(voices.map(v => v.lang))];
    clientLogger.debug("[ClientTTS] Available voice languages", {
      requestedLang: language,
      availableLangs: availableLangs.slice(0, 10).join(", ")
    });
  }

  const targetLangs = langCodes[language];

  // Priority 1: Google voices (best quality on Chrome)
  for (const lang of targetLangs) {
    const googleVoice = voices.find(
      (v) => v.lang.startsWith(lang.split("-")[0]) && v.name.toLowerCase().includes("google")
    );
    if (googleVoice) {
      clientLogger.debug("[ClientTTS] Using Google voice", { name: googleVoice.name, lang: googleVoice.lang });
      return googleVoice;
    }
  }

  // Priority 2: Microsoft Online/Neural voices (good on Edge)
  for (const lang of targetLangs) {
    const msVoice = voices.find(
      (v) => v.lang.startsWith(lang.split("-")[0]) &&
        (v.name.toLowerCase().includes("microsoft") &&
         (v.name.toLowerCase().includes("online") || v.name.toLowerCase().includes("neural")))
    );
    if (msVoice) {
      clientLogger.debug("[ClientTTS] Using Microsoft Neural voice", { name: msVoice.name, lang: msVoice.lang });
      return msVoice;
    }
  }

  // Priority 3: Any Microsoft voice
  for (const lang of targetLangs) {
    const msVoice = voices.find(
      (v) => v.lang.startsWith(lang.split("-")[0]) && v.name.toLowerCase().includes("microsoft")
    );
    if (msVoice) {
      clientLogger.debug("[ClientTTS] Using Microsoft voice", { name: msVoice.name, lang: msVoice.lang });
      return msVoice;
    }
  }

  // Priority 4: Any voice for the language
  for (const lang of targetLangs) {
    const anyVoice = voices.find((v) => v.lang.startsWith(lang.split("-")[0]));
    if (anyVoice) {
      clientLogger.debug("[ClientTTS] Using fallback voice", { name: anyVoice.name, lang: anyVoice.lang });
      return anyVoice;
    }
  }

  // Priority 5: Default English voice
  const defaultVoice = voices.find((v) => v.lang.startsWith("en"));
  if (defaultVoice) {
    clientLogger.debug("[ClientTTS] Using default English voice", { name: defaultVoice.name, lang: defaultVoice.lang });
    return defaultVoice;
  }

  return null;
}

/**
 * Ensure voices are loaded (they load asynchronously)
 */
async function ensureVoicesLoaded(): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return;
  }

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    return;
  }

  // Wait for voices to load
  return new Promise((resolve) => {
    let resolved = false;
    const done = () => {
      if (resolved) return;
      resolved = true;
      // Clean up event listener after use
      window.speechSynthesis.onvoiceschanged = null;
      clearTimeout(timeoutId);
      resolve();
    };

    const checkVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        done();
      }
    };

    window.speechSynthesis.onvoiceschanged = checkVoices;

    // Also check after a timeout in case event doesn't fire
    const timeoutId = setTimeout(done, 500);
  });
}

/**
 * Speak using browser's SpeechSynthesis (fallback)
 */
async function speakWithBrowser(
  text: string,
  language: TTSLanguage,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    throw new Error("Browser SpeechSynthesis not available");
  }

  // Ensure voices are loaded
  await ensureVoicesLoaded();

  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    _currentUtterance = utterance;

    utterance.lang = BROWSER_TTS_LANG[language];

    // Get the best voice for this language
    const bestVoice = getBestVoice(language);
    if (bestVoice) {
      utterance.voice = bestVoice;
      // Adjust rate based on voice type (neural voices sound better at normal speed)
      const isNeuralVoice = bestVoice.name.toLowerCase().includes("neural") ||
                           bestVoice.name.toLowerCase().includes("google") ||
                           bestVoice.name.toLowerCase().includes("online");
      utterance.rate = isNeuralVoice ? 1.0 : 0.9;
    } else {
      utterance.rate = 0.9;
    }

    utterance.pitch = 1;
    utterance.volume = 1;

    clientLogger.debug("[ClientTTS] Browser TTS starting", {
      language,
      voice: bestVoice?.name || "default",
      rate: utterance.rate
    });

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      _currentUtterance = null;
      onEnd?.();
      resolve();
    };

    utterance.onerror = (event) => {
      _currentUtterance = null;
      // Ignore 'interrupted' and 'canceled' errors as they're expected when stopping
      if (event.error === "interrupted" || event.error === "canceled") {
        resolve();
        return;
      }
      clientLogger.error("[ClientTTS] Browser TTS error", { error: event.error });
      reject(new Error(`Browser TTS error: ${event.error}`));
    };

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Check if TTS API is available
 */
export async function checkTTSAvailability(): Promise<{
  available: boolean;
  provider: "api" | "browser";
  error?: string;
}> {
  try {
    const response = await fetch("/api/voice/tts", {
      method: "GET",
    });

    if (response.ok) {
      const data = await response.json();
      if (data.available && data.provider !== "browser") {
        return { available: true, provider: "api" };
      }
    }
  } catch {
    // API not available
  }

  // Check browser fallback
  if (typeof window !== "undefined" && window.speechSynthesis) {
    return {
      available: true,
      provider: "browser",
      error: "Using browser TTS (may sound less natural)",
    };
  }

  return { available: false, provider: "browser", error: "No TTS available" };
}
