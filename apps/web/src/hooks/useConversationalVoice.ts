"use client";

/**
 * useConversationalVoice Hook - V3
 *
 * Provides a continuous conversation loop for voice interactions:
 * idle → listening → processing → speaking → listening (loop)
 *
 * Features:
 * - Web Speech API for speech-to-text
 * - Browser SpeechSynthesis for text-to-speech (no API needed)
 * - Auto-resume listening after AI speaks
 * - Interrupt capability
 * - Multilingual support: en-IN, hi-IN, as-IN
 * - Auto language detection from transcript
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { clientLogger } from "@/lib/client-logger";
import { detectLanguage } from "@/lib/utils/language-detection";
import { speakText, stopTTS } from "@/lib/utils/client-tts";

export type VoiceState = "idle" | "listening" | "processing" | "speaking";
export type Language = "en" | "hi" | "as";

// Speech Recognition types
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export interface UseConversationalVoiceOptions {
  language: Language;
  onTranscript: (text: string, detectedLang?: Language) => void;
  onStateChange?: (state: VoiceState) => void;
  onInterimTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  /** Auto-resume listening after TTS finishes */
  autoResume?: boolean;
  /** Auto-detect language from transcript (Hindi, English, Assamese) */
  autoDetectLanguage?: boolean;
  /** Callback when language is detected */
  onLanguageDetected?: (lang: Language) => void;
}

export interface UseConversationalVoiceReturn {
  state: VoiceState;
  startListening: () => void;
  stopListening: () => void;
  interrupt: () => void;
  speak: (text: string, overrideLang?: Language) => void;
  stopSpeaking: () => void;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  /** Last detected language from transcript */
  detectedLanguage: Language | null;
}

// Configuration for speech recognition timing
const SPEECH_CONFIG = {
  /** Delay (ms) after last speech before sending (gives user time to pause) */
  SILENCE_TIMEOUT: 2000,
  /** Delay (ms) before auto-resuming listening after TTS ends */
  AUTO_RESUME_DELAY: 800,
  /** Minimum transcript length to be considered valid */
  MIN_TRANSCRIPT_LENGTH: 2,
};

/**
 * Get helpful error message when language is not supported
 */
function getLanguageNotSupportedMessage(lang: Language): string {
  const langNames: Record<Language, string> = {
    en: "English",
    hi: "Hindi",
    as: "Assamese",
  };
  const langName = langNames[lang];

  if (lang === "as") {
    return `Assamese voice recognition has limited browser support. TIP: You can speak in English or Hindi - the AI will still respond in Assamese based on your language selection.`;
  }
  if (lang === "hi") {
    return `Hindi voice recognition may not work in all browsers. TIP: Try Chrome browser, or speak in English - the AI will respond in Hindi.`;
  }
  return `${langName} recognition may not be supported. Please try Chrome browser.`;
}

/**
 * Get helpful error message for unknown errors
 */
function getUnknownErrorMessage(lang: Language, errorCode: string): string {
  // Log the actual error code for debugging
  clientLogger.debug("[useConversationalVoice] Unknown error code", { errorCode, lang });

  if (lang === "as") {
    return "Assamese voice may not work in your browser. TIP: Speak in English - the AI will respond in Assamese based on your language selection above.";
  }
  if (lang === "hi") {
    return "Hindi voice recognition had an issue. TIP: Try Chrome browser, or speak in English - the AI will respond in Hindi.";
  }
  return "Voice recognition had an issue. Please try again or use a different browser.";
}

export function useConversationalVoice({
  language,
  onTranscript,
  onStateChange,
  onInterimTranscript,
  onError,
  // DEFAULT: autoResume is ON for continuous conversation
  // Mic auto-opens AFTER AI finishes speaking (not during)
  autoResume = true,
  autoDetectLanguage = false,
  onLanguageDetected,
}: UseConversationalVoiceOptions): UseConversationalVoiceReturn {
  const [state, setState] = useState<VoiceState>("idle");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<Language | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // Mounted ref prevents state updates after unmount
  const mountedRef = useRef(true);
  // autoResume controls whether mic auto-opens after AI finishes speaking
  // Mic stays CLOSED while AI is speaking - only opens AFTER AI finishes
  const autoResumeRef = useRef(autoResume);
  const shouldResumeRef = useRef(false);
  const autoDetectRef = useRef(autoDetectLanguage);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoResumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedTranscriptRef = useRef<string>("");

  // Callback refs to avoid stale closures in recognition/TTS callbacks
  const onTranscriptRef = useRef(onTranscript);
  const onInterimTranscriptRef = useRef(onInterimTranscript);
  const onErrorRef = useRef(onError);
  const onLanguageDetectedRef = useRef(onLanguageDetected);

  // Keep all refs in sync with latest props
  useEffect(() => { autoResumeRef.current = autoResume; }, [autoResume]);
  useEffect(() => { autoDetectRef.current = autoDetectLanguage; }, [autoDetectLanguage]);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { onInterimTranscriptRef.current = onInterimTranscript; }, [onInterimTranscript]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  useEffect(() => { onLanguageDetectedRef.current = onLanguageDetected; }, [onLanguageDetected]);

  // Check browser support
  const isSupported = typeof window !== "undefined" &&
    Boolean(
      (window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .webkitSpeechRecognition
    );

  // Update state and notify callback
  const updateState = useCallback(
    (newState: VoiceState) => {
      setState(newState);
      onStateChange?.(newState);
    },
    [onStateChange]
  );

  // Stop any TTS (API or browser)
  const stopSpeaking = useCallback(() => {
    stopTTS();
    setState((current) => (current === "speaking" ? "idle" : current));
  }, []);

  // Stop recognition and clear timeouts
  const stopRecognition = useCallback(() => {
    // Clear silence timeout
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }

    // Clear accumulated transcript
    accumulatedTranscriptRef.current = "";
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopRecognition();
      stopSpeaking();
      // Clear auto-resume timeout to prevent state updates after unmount
      if (autoResumeTimeoutRef.current) {
        clearTimeout(autoResumeTimeoutRef.current);
        autoResumeTimeoutRef.current = null;
      }
      // BUG-011 FIX: Also clear silence timeout to prevent state updates after unmount
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    };
  }, [stopRecognition, stopSpeaking]);

  // Start listening for voice input
  const startListening = useCallback(() => {
    if (!isSupported) {
      const errorMsg = "Speech recognition not supported in this browser. Use Chrome or Edge.";
      setError(errorMsg);
      onErrorRef.current?.(errorMsg);
      return;
    }

    // Stop any ongoing TTS
    stopSpeaking();

    // Stop any existing recognition
    stopRecognition();

    setError(null);
    setInterimTranscript("");

    const global = window as Window & {
      SpeechRecognition?: new () => SpeechRecognition;
      webkitSpeechRecognition?: new () => SpeechRecognition;
    };
    const SpeechRecognitionConstructor =
      global.SpeechRecognition || global.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      const errorMsg = "Speech Recognition API not available";
      setError(errorMsg);
      onErrorRef.current?.(errorMsg);
      return;
    }

    const recognition = new SpeechRecognitionConstructor();

    // IMPORTANT: Always use English recognition for voice input
    // Reason: Browser support for Hindi/Assamese recognition is unreliable
    // - Assamese (as-IN) has very poor browser support
    // - Hindi (hi-IN) works inconsistently across browsers
    // - English (en-IN) is the most reliable and can transcribe Romanized text
    // The AI will detect the language from transcript and respond appropriately
    // based on the intelligent hybrid approach in system prompts
    const recognitionLang = "en-IN";

    recognition.lang = recognitionLang;
    recognition.continuous = true;  // Keep listening for multiple phrases
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // Clear accumulated transcript on start
    accumulatedTranscriptRef.current = "";

    recognition.onstart = () => {
      updateState("listening");
      setInterimTranscript("");
      accumulatedTranscriptRef.current = "";
      clientLogger.debug("[useConversationalVoice] Started listening", { language, lang: recognition.lang });
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!mountedRef.current) return;

      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript;
        if (!transcript) continue;
        if (result.isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      // Clear any existing silence timeout (user is still speaking)
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }

      if (interim) {
        setInterimTranscript(accumulatedTranscriptRef.current + " " + interim);
        onInterimTranscriptRef.current?.(accumulatedTranscriptRef.current + " " + interim);
      }

      if (final) {
        // Accumulate final transcripts
        accumulatedTranscriptRef.current = (accumulatedTranscriptRef.current + " " + final).trim();
        setInterimTranscript(accumulatedTranscriptRef.current);
        onInterimTranscriptRef.current?.(accumulatedTranscriptRef.current);

        clientLogger.debug("[useConversationalVoice] Accumulated transcript", {
          accumulated: accumulatedTranscriptRef.current
        });

        // Start silence timeout - wait for user to finish speaking
        silenceTimeoutRef.current = setTimeout(() => {
          if (!mountedRef.current) return;
          const fullTranscript = accumulatedTranscriptRef.current.trim();

          if (fullTranscript.length >= SPEECH_CONFIG.MIN_TRANSCRIPT_LENGTH) {
            // Detect language from full transcript if auto-detect is enabled
            let langForTranscript: Language | undefined;
            if (autoDetectRef.current) {
              const detected = detectLanguage(fullTranscript);
              setDetectedLanguage(detected);
              langForTranscript = detected;
              onLanguageDetectedRef.current?.(detected);
              clientLogger.debug("[useConversationalVoice] Language detected", {
                detected,
                transcript: fullTranscript
              });
            }

            clientLogger.debug("[useConversationalVoice] Final transcript after silence", {
              transcript: fullTranscript,
              detectedLanguage: langForTranscript
            });

            // Stop recognition and send transcript
            stopRecognition();
            setInterimTranscript("");
            accumulatedTranscriptRef.current = "";
            updateState("processing");
            onTranscriptRef.current(fullTranscript, langForTranscript);
          }
        }, SPEECH_CONFIG.SILENCE_TIMEOUT);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Log at debug level for harmless browser quirks, error level for real issues
      const isHarmlessError = !event.error || event.error === "aborted";
      const logFn = isHarmlessError ? clientLogger.debug : clientLogger.error;
      logFn("[useConversationalVoice] Recognition error", {
        error: event.error || "(empty)",
        language: recognition.lang
      });

      if (!mountedRef.current) return;

      let errorMsg: string;
      switch (event.error) {
        case "no-speech":
          errorMsg = "No speech detected. Please speak louder or try again.";
          break;
        case "audio-capture":
          errorMsg = "Microphone not accessible. Please check permissions.";
          break;
        case "not-allowed":
          errorMsg = "Microphone permission denied. Please enable in browser settings.";
          break;
        case "network":
          errorMsg = "Network error. Please check your connection.";
          break;
        case "aborted":
          // Clean up recognition ref on abort
          recognitionRef.current = null;
          updateState("idle");
          return;
        case "language-not-supported":
          // Some browsers don't support certain languages
          errorMsg = getLanguageNotSupportedMessage(language);
          break;
        case "service-not-allowed":
          errorMsg = "Speech recognition service not available. Try using Chrome browser.";
          break;
        default:
          // For unknown errors (like empty {} error with Hindi/Assamese)
          // This often happens when browser doesn't support the language well
          errorMsg = getUnknownErrorMessage(language, event.error);
      }

      // Clean up recognition ref on error
      recognitionRef.current = null;
      setError(errorMsg);
      onErrorRef.current?.(errorMsg);
      updateState("idle");
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (!mountedRef.current) return;
      setState((current) => {
        if (current === "listening") {
          return "idle";
        }
        return current;
      });
      setInterimTranscript("");
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      clientLogger.error("[useConversationalVoice] Failed to start", err instanceof Error ? err : undefined);
      const errorMsg = "Failed to start voice recognition. Try again.";
      setError(errorMsg);
      onErrorRef.current?.(errorMsg);
      updateState("idle");
    }
  }, [language, isSupported, updateState, stopSpeaking, stopRecognition]);

  // Stop listening manually
  const stopListening = useCallback(() => {
    shouldResumeRef.current = false;
    stopRecognition();
    setInterimTranscript("");
    updateState("idle");
  }, [updateState, stopRecognition]);

  // Speak text using API TTS with browser fallback
  const speak = useCallback(
    (text: string, overrideLang?: Language) => {
      if (!text.trim()) return;

      // Stop any ongoing speech and recognition
      stopSpeaking();
      stopRecognition();

      updateState("speaking");
      shouldResumeRef.current = autoResumeRef.current;

      // Determine TTS language from the RESPONSE TEXT content (not user input)
      // This ensures Hindi/Assamese responses use the correct voice even when
      // the user spoke in English or the UI language selector is set to English
      const responseTextLang = detectLanguage(text);
      const langToUse = overrideLang || (responseTextLang !== "en" ? responseTextLang : null) || (autoDetectRef.current ? detectedLanguage : null) || language;
      clientLogger.debug("[useConversationalVoice] Speaking with language", { langToUse, responseTextLang, overrideLang, detectedLanguage, defaultLanguage: language });

      // Use the client TTS utility (API with browser fallback)
      speakText(text, {
        language: langToUse,
        emotion: "friendly",
        onStart: () => {
          clientLogger.debug("[useConversationalVoice] TTS started");
        },
        onEnd: () => {
          clientLogger.debug("[useConversationalVoice] TTS ended");
          if (!mountedRef.current) return;
          updateState("idle");

          // Auto-resume listening after speaking (with longer delay)
          if (shouldResumeRef.current) {
            // Store timeout ID to allow cleanup on unmount
            autoResumeTimeoutRef.current = setTimeout(() => {
              autoResumeTimeoutRef.current = null;
              if (!mountedRef.current) return;
              startListening();
            }, SPEECH_CONFIG.AUTO_RESUME_DELAY);
          }
        },
        onError: (error) => {
          clientLogger.error("[useConversationalVoice] TTS error", { error });
          if (!mountedRef.current) return;
          updateState("idle");
        },
      }).catch((error) => {
        clientLogger.error("[useConversationalVoice] TTS failed", { error: error instanceof Error ? error.message : String(error) });
        if (mountedRef.current) updateState("idle");
      });
    },
    [language, detectedLanguage, updateState, stopSpeaking, stopRecognition, startListening]
  );

  // Interrupt: stop everything
  const interrupt = useCallback(() => {
    shouldResumeRef.current = false;
    stopSpeaking();
    stopRecognition();
    updateState("idle");
  }, [stopSpeaking, stopRecognition, updateState]);

  return {
    state,
    startListening,
    stopListening,
    interrupt,
    speak,
    stopSpeaking,
    interimTranscript,
    error,
    isSupported,
    detectedLanguage,
  };
}
