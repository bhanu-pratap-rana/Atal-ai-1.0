"use client";

/**
 * Voice Chat Component
 *
 * Provides voice input using Web Speech API with support for:
 * - English (en-IN)
 * - Hindi (hi-IN)
 * - Assamese (as-IN)
 *
 * Features:
 * - Real-time speech recognition with interim results
 * - Visual feedback during listening
 * - Error handling and browser compatibility checks
 * - Automatic transcript callback
 * - Optional TTS (Text-to-Speech) via useTTS hook
 */

import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { Button } from "@/components/ui/button";
import { clientLogger } from "@/lib/client-logger";

// Language display names mapping
const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  en: "English",
  hi: "हिंदी",
  as: "অসমীয়া",
};

export type Language = "en" | "hi" | "as";

// Speech Recognition types (Web Speech API)
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

interface VoiceChatProps {
  readonly language: Language;
  readonly onTranscript: (transcript: string) => void;
  readonly disabled?: boolean;
  /** Show interim (real-time) transcript while speaking */
  readonly showInterimTranscript?: boolean;
}

export const VoiceChat = memo(function VoiceChat({
  language,
  onTranscript,
  disabled = false,
  showInterimTranscript = true,
}: VoiceChatProps) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Compute browser support (stable - no browser changes at runtime)
  const isSupported = useMemo(() => {
    if (typeof globalThis === "undefined") return false;
    const global = globalThis as typeof globalThis & {
      SpeechRecognition?: new () => SpeechRecognition;
      webkitSpeechRecognition?: new () => SpeechRecognition;
    };
    return Boolean(global.SpeechRecognition || global.webkitSpeechRecognition);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || disabled) return;

    setError(null);
    setInterimTranscript("");

    const global = globalThis as typeof globalThis & {
      SpeechRecognition?: new () => SpeechRecognition;
      webkitSpeechRecognition?: new () => SpeechRecognition;
    };
    const SpeechRecognitionConstructor =
      global.SpeechRecognition || global.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setError("Speech Recognition API is not supported in your browser");
      return;
    }

    const recognition = new SpeechRecognitionConstructor();

    // Configure recognition
    // IMPORTANT: Always use English recognition for reliability
    // Browser support for Hindi/Assamese is inconsistent
    // AI will detect language from transcript and respond appropriately
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = showInterimTranscript;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      setInterimTranscript(interim);

      if (final) {
        clientLogger.debug("[VoiceChat] Transcript received:", {
          transcript: final,
          language,
        });
        onTranscript(final);
        setInterimTranscript("");
        setError(null);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      clientLogger.error("[VoiceChat] Recognition error:", {
        error: event.error,
      });
      setIsListening(false);

      // User-friendly error messages
      switch (event.error) {
        case "no-speech":
          setError("No speech detected. Please try again.");
          break;
        case "audio-capture":
          setError("Microphone not accessible. Please check permissions.");
          break;
        case "not-allowed":
          setError(
            "Microphone permission denied. Please enable it in browser settings."
          );
          break;
        case "network":
          setError("Network error. Please check your connection.");
          break;
        default:
          setError("Speech recognition error. Please try again.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      clientLogger.debug("[VoiceChat] Started listening", { language });
    } catch (err) {
      clientLogger.error(
        "[VoiceChat] Error starting recognition:",
        err instanceof Error ? err : undefined
      );
      setError("Failed to start voice recognition.");
    }
  }, [language, onTranscript, disabled, isSupported, showInterimTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        clientLogger.debug("[VoiceChat] Stopped listening");
      } catch (err) {
        clientLogger.error(
          "[VoiceChat] Error stopping recognition:",
          err instanceof Error ? err : undefined
        );
      }
    }
    setIsListening(false);
  }, []);

  // Browser not supported
  if (!isSupported) {
    return (
      <div className="text-center p-4 bg-warning/10 border border-warning/30 rounded-lg">
        <p className="text-sm text-warning-dark">
          Voice input is not supported in this browser.
        </p>
        <p className="text-xs text-text-secondary mt-1">
          Please use Chrome, Edge, or Safari for voice features.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Voice Button */}
      <div className="flex items-center justify-center">
        <Button
          type="button"
          onClick={isListening ? stopListening : startListening}
          disabled={disabled}
          className={`relative ${
            isListening
              ? "bg-error hover:bg-error-dark animate-pulse"
              : "bg-primary hover:bg-primary-dark"
          }`}
          size="lg"
        >
          {isListening ? (
            <>
              <span className="mr-2">⏹️</span>
              <span>Stop Listening</span>
            </>
          ) : (
            <>
              <span className="mr-2">🎤</span>
              <span>Speak</span>
            </>
          )}
        </Button>
      </div>

      {/* Status Message - Accessible to screen readers */}
      {isListening && (
        <div className="text-center" aria-live="polite" aria-atomic="true">
          <span className="sr-only">Voice input active. Listening for speech.</span>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" aria-hidden="true" />
            <span className="text-sm text-primary font-medium">
              Listening... Speak now
            </span>
          </div>
        </div>
      )}

      {/* Interim Transcript - Real-time feedback for screen readers */}
      {showInterimTranscript && interimTranscript && (
        <div className="text-center" aria-live="polite" aria-atomic="true">
          <p className="text-sm text-text-secondary italic max-w-xs mx-auto">
            &quot;{interimTranscript}&quot;
          </p>
        </div>
      )}

      {/* Error Message - A11Y-005 FIX: Added aria-live for screen reader announcements */}
      {error && (
        <div
          className="text-center p-3 bg-error/10 border border-error/30 rounded-lg"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-sm text-error-dark">{error}</p>
        </div>
      )}

      {/* Language Indicator */}
      <div className="text-center text-xs text-text-secondary">
        Language: {LANGUAGE_DISPLAY_NAMES[language] || "অসমীয়া"}
      </div>
    </div>
  );
});

/**
 * useTTS Hook - Text-to-Speech functionality
 *
 * Uses the TTS API endpoint to convert text to speech.
 * Falls back to browser Speech Synthesis if API unavailable.
 *
 * FIX: Removed isSpeaking from useCallback deps to prevent infinite loop.
 * Uses ref to track speaking state without causing re-renders.
 * FIX: Added cleanup on unmount and language change to prevent orphaned audio.
 * FIX: Added AbortController to cancel pending requests on language change.
 */
export function useTTS(language: Language) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // FIX: Use ref to track speaking state without causing callback recreation
  const isSpeakingRef = useRef(false);
  // Track previous language for cleanup on change
  const prevLanguageRef = useRef<Language>(language);
  // AbortController to cancel pending TTS requests
  const abortControllerRef = useRef<AbortController | null>(null);
  // Request ID to track which request is current
  const requestIdRef = useRef(0);

  // Stop function needs to be defined before useEffect
  const stopInternal = useCallback(() => {
    clientLogger.debug("[useTTS] stopInternal called");

    // Abort any pending fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Increment request ID to invalidate any in-flight responses
    requestIdRef.current++;

    // Stop API-based audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    // Stop browser speech synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
    setIsSpeaking(false);
  }, []);

  // Cleanup on unmount - critical for preventing orphaned audio
  useEffect(() => {
    return () => {
      clientLogger.debug("[useTTS] Cleanup on unmount");
      stopInternal();
    };
  }, [stopInternal]);

  // Stop TTS when language changes to prevent multiple audio streams
  useEffect(() => {
    if (prevLanguageRef.current !== language) {
      clientLogger.debug("[useTTS] Language changed, stopping current TTS", {
        from: prevLanguageRef.current,
        to: language,
      });
      stopInternal();
      prevLanguageRef.current = language;
    }
  }, [language, stopInternal]);

  const speak = useCallback(
    async (text: string) => {
      // FIX: Check ref instead of state to avoid stale closure
      if (!text || isSpeakingRef.current) return;

      // Stop any current playback first
      stopInternal();

      // Create new AbortController for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Track this request's ID
      const thisRequestId = ++requestIdRef.current;

      isSpeakingRef.current = true;
      setIsSpeaking(true);

      try {
        const response = await fetch("/api/voice/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language }),
          signal: abortController.signal,
        });

        // Check if this request is still valid (not superseded by language change)
        if (thisRequestId !== requestIdRef.current) {
          clientLogger.debug("[useTTS] Request superseded, ignoring response", {
            thisRequestId,
            currentRequestId: requestIdRef.current,
          });
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          return;
        }

        // Check if the response indicates browser TTS should be used
        // API returns 200 JSON with useBrowserTTS: true when server TTS unavailable
        const contentType = response.headers.get("Content-Type") || "";
        const isJsonResponse = contentType.includes("application/json");

        let shouldUseBrowserTTS = !response.ok;

        if (response.ok && isJsonResponse) {
          try {
            const jsonData = await response.json();
            shouldUseBrowserTTS = jsonData.useBrowserTTS === true;
          } catch {
            // If JSON parse fails, treat as audio response
            shouldUseBrowserTTS = false;
          }
        }

        // Check again if request is still valid
        if (thisRequestId !== requestIdRef.current) {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          return;
        }

        if (shouldUseBrowserTTS) {
          // Use browser Speech Synthesis as primary TTS method
          // Server TTS is disabled, browser TTS works well in Chrome/Edge
          clientLogger.debug("[useTTS] Using browser Speech Synthesis");
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            // Import and use the enhanced speakText function dynamically
            const { speakText } = await import("@/lib/utils/client-tts");
            await speakText(text, {
              language,
              emotion: "friendly",
              onStart: () => {
                clientLogger.debug("[useTTS] Browser TTS started");
              },
              onEnd: () => {
                isSpeakingRef.current = false;
                setIsSpeaking(false);
              },
              onError: () => {
                isSpeakingRef.current = false;
                setIsSpeaking(false);
              },
            });
            return;
          }
          throw new Error("TTS failed and no browser fallback available");
        }

        const audioBlob = await response.blob();

        // Final check before playing
        if (thisRequestId !== requestIdRef.current) {
          clientLogger.debug("[useTTS] Request superseded before playback");
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          return;
        }

        const audioUrl = URL.createObjectURL(audioBlob);

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };

        audio.onerror = () => {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };

        await audio.play();
      } catch (error) {
        // Ignore abort errors - these are expected when stopping/switching languages
        if (error instanceof Error && error.name === "AbortError") {
          clientLogger.debug("[useTTS] Request aborted (expected on language change)");
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          return;
        }
        clientLogger.error(
          "[useTTS] TTS error:",
          error instanceof Error ? error : undefined
        );
        isSpeakingRef.current = false;
        setIsSpeaking(false);
      }
    },
    [language, stopInternal] // Added stopInternal to deps
  );

  const stop = useCallback(() => {
    stopInternal();
  }, [stopInternal]);

  return { speak, stop, isSpeaking };
}
