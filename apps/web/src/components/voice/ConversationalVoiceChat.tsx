"use client";

/**
 * ConversationalVoiceChat Component - V3
 *
 * A modern, ChatGPT/Gemini-like voice interface with:
 * - Large centered pulsing mic button
 * - Beautiful state-based animations
 * - Clean minimal design
 * - Auto-TTS for AI responses
 * - Continuous conversation flow
 *
 * Conversation Flow:
 * 1. User taps mic to start
 * 2. User speaks → message sent after 2s silence
 * 3. AI responds and speaks → mic stays CLOSED while AI speaks
 * 4. AI finishes speaking → mic auto-opens for user
 * 5. User can tap mic anytime to interrupt AI
 */

import { useEffect, useRef, useCallback, useState } from "react";
import {
  useConversationalVoice,
  VoiceState,
  Language,
} from "@/hooks/useConversationalVoice";
import { initTTSAudioContext } from "@/lib/utils/client-tts";

// Language display names
const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  hi: "हिंदी",
  as: "অসমীয়া",
};

interface ConversationalVoiceChatProps {
  readonly language: Language;
  readonly onTranscript: (text: string, detectedLang?: Language) => void;
  readonly disabled?: boolean;
  readonly className?: string;
  /** Called when AI response should be spoken */
  readonly speakText?: string | null;
  /** Clear the speak text after speaking */
  readonly onSpokenComplete?: () => void;
  /** Enable automatic language detection from voice input */
  readonly autoDetectLanguage?: boolean;
  /** Callback when language is detected */
  readonly onLanguageDetected?: (lang: Language) => void;
}

export function ConversationalVoiceChat({
  language,
  onTranscript,
  disabled = false,
  className = "",
  speakText,
  onSpokenComplete,
  autoDetectLanguage = false,
  onLanguageDetected,
}: ConversationalVoiceChatProps) {
  const lastSpokenTextRef = useRef<string | null>(null);
  const prevStateRef = useRef<VoiceState>("idle");
  // Track if AI just finished speaking to show "tap to reply" hint
  const [showTapHint, setShowTapHint] = useState(false);

  const {
    state,
    startListening,
    stopListening,
    interrupt,
    speak,
    interimTranscript,
    error,
    isSupported,
    detectedLanguage,
  } = useConversationalVoice({
    language,
    onTranscript,
    // AUTO-RESUME ENABLED: Continuous conversation flow
    // Mic auto-opens AFTER AI finishes speaking (not during)
    // User can tap mic to interrupt AI and start speaking
    autoResume: true,
    autoDetectLanguage,
    onLanguageDetected,
  });

  // Track state changes to show brief "resuming" hint after AI finishes speaking
  useEffect(() => {
    // When transitioning from speaking → idle, show the hint briefly
    if (prevStateRef.current === "speaking" && state === "idle") {
      queueMicrotask(() => setShowTapHint(true));
      // Hide hint quickly - mic will auto-open in ~800ms
      const timer = setTimeout(() => setShowTapHint(false), 1500);
      return () => clearTimeout(timer);
    }
    // Hide hint when user starts listening
    if (state === "listening") {
      queueMicrotask(() => setShowTapHint(false));
    }
    prevStateRef.current = state;
  }, [state]);

  // Speak AI response when speakText changes
  useEffect(() => {
    if (speakText && speakText !== lastSpokenTextRef.current && state !== "speaking") {
      lastSpokenTextRef.current = speakText;
      speak(speakText);
      onSpokenComplete?.();
    }
  }, [speakText, state, speak, onSpokenComplete]);

  const handleMainButtonClick = useCallback(() => {
    if (disabled) return;

    // Initialize AudioContext on user gesture for server TTS playback
    // This must happen inside a click handler to bypass autoplay restrictions
    initTTSAudioContext();

    switch (state) {
      case "idle":
        startListening();
        break;
      case "listening":
        stopListening();
        break;
      case "speaking":
        interrupt();
        break;
      case "processing":
        // Can't interrupt processing
        break;
    }
  }, [state, disabled, startListening, stopListening, interrupt]);

  // Fixed bar heights for voice visualizer (deterministic, no Math.random during render)
  const barHeights = [20, 28, 14, 24, 18];

  // Browser not supported
  if (!isSupported) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <div className="text-center p-6 bg-amber-50 border border-amber-200 rounded-2xl max-w-sm">
          <div className="text-4xl mb-3">🎤</div>
          <p className="text-amber-800 font-medium mb-2">Voice Not Supported</p>
          <p className="text-amber-600 text-sm">
            Please use Chrome, Edge, or Safari for voice features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      {/* Main Voice Button */}
      <div className="relative mb-6">
        {/* Pulsing rings for listening state */}
        {state === "listening" && (
          <>
            <div className="absolute inset-0 rounded-full bg-success animate-ping opacity-20" style={{ animationDuration: "1.5s" }} />
            <div className="absolute inset-[-8px] rounded-full bg-success animate-ping opacity-10" style={{ animationDuration: "2s" }} />
          </>
        )}

        {/* Speaking wave animation */}
        {state === "speaking" && (
          <div className="absolute inset-[-12px] rounded-full border-4 border-info animate-pulse opacity-50" />
        )}

        {/* Processing spinner */}
        {state === "processing" && (
          <div className="absolute inset-[-8px] rounded-full border-4 border-accent border-t-transparent animate-spin" />
        )}

        <button
          type="button"
          onClick={handleMainButtonClick}
          disabled={disabled || state === "processing"}
          className={`
            relative z-10 w-24 h-24 rounded-full flex items-center justify-center
            text-4xl shadow-lg transition-all duration-300 ease-out
            focus:outline-none focus:ring-4 focus:ring-offset-2
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105 active:scale-95"}
            ${state === "idle" ? "bg-gradient-to-br from-primary to-primary-dark text-white focus:ring-primary/50 hover:shadow-primary/30 hover:shadow-xl" : ""}
            ${state === "listening" ? "bg-gradient-to-br from-green-500 to-green-600 text-white focus:ring-green-500/50 shadow-green-500/30 shadow-xl" : ""}
            ${state === "processing" ? "bg-gradient-to-br from-orange-400 to-orange-500 text-white focus:ring-orange-400/50" : ""}
            ${state === "speaking" ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white focus:ring-blue-500/50 shadow-blue-500/30 shadow-xl" : ""}
          `}
          aria-label={getButtonLabel(state)}
        >
          {getButtonIcon(state)}
        </button>
      </div>

      {/* State Label */}
      <div className="text-center mb-4">
        <p className={`text-lg font-medium transition-colors duration-300 ${getStateTextColor(state)}`}>
          {getStateLabel(state)}
        </p>
        {state === "speaking" && (
          <p className="text-sm text-text-tertiary mt-1">Tap to interrupt</p>
        )}
        {/* Show hint that mic will auto-open after AI finishes */}
        {showTapHint && state === "idle" && (
          <p className="text-sm text-success mt-1 animate-pulse">
            🎤 Resuming...
          </p>
        )}
      </div>

      {/* Interim Transcript */}
      {interimTranscript && (
        <div className="w-full max-w-full sm:max-w-md px-4 mb-4">
          <div className="bg-surface-dark rounded-2xl px-4 py-3 sm:px-6 sm:py-4 text-center">
            <p className="text-sm sm:text-base text-text-primary italic break-words">&quot;{interimTranscript}&quot;</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="w-full max-w-md px-4 mb-4">
          <div className="bg-error/10 border border-error/30 rounded-2xl px-6 py-4 text-center">
            <p className="text-error text-sm">{error}</p>
            <button
              onClick={startListening}
              className="mt-3 px-6 py-2.5 min-h-[44px] text-sm sm:text-base bg-primary/10 text-primary font-medium rounded-lg hover:bg-primary/20 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Language Indicator */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-text-tertiary">
        <span className="w-2 h-2 rounded-full bg-success" />
        {autoDetectLanguage ? (
          <span>
            {detectedLanguage ? (
              <>Auto: <strong>{LANGUAGE_NAMES[detectedLanguage]}</strong></>
            ) : (
              "Auto-detect enabled"
            )}
          </span>
        ) : (
          <span>{LANGUAGE_NAMES[language]}</span>
        )}
      </div>

      {/* Voice Visualizer for speaking/listening */}
      {(state === "listening" || state === "speaking") && (
        <div className="flex items-center justify-center gap-1 mt-6 h-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                state === "listening" ? "bg-success" : "bg-info"
              }`}
              style={{
                height: `${barHeights[i]}px`,
                animation: `voiceBar 0.5s ease-in-out ${i * 0.1}s infinite alternate`,
              }}
            />
          ))}
        </div>
      )}

      {/* Add keyframe animation */}
      <style jsx>{`
        @keyframes voiceBar {
          from {
            height: 8px;
          }
          to {
            height: 32px;
          }
        }
      `}</style>
    </div>
  );
}

// Helper functions
function getButtonIcon(state: VoiceState): string {
  switch (state) {
    case "idle":
      return "🎤";
    case "listening":
      return "🎙️";
    case "processing":
      return "⏳";
    case "speaking":
      return "🔊";
  }
}

function getButtonLabel(state: VoiceState): string {
  switch (state) {
    case "idle":
      return "Start voice conversation";
    case "listening":
      return "Listening - tap to stop";
    case "processing":
      return "Processing your message";
    case "speaking":
      return "Speaking - tap to interrupt";
  }
}

function getStateLabel(state: VoiceState): string {
  switch (state) {
    case "idle":
      return "Tap to speak";
    case "listening":
      return "Listening...";
    case "processing":
      return "Processing...";
    case "speaking":
      return "Speaking...";
  }
}

function getStateTextColor(state: VoiceState): string {
  switch (state) {
    case "idle":
      return "text-text-secondary";
    case "listening":
      return "text-success";
    case "processing":
      return "text-accent";
    case "speaking":
      return "text-info";
  }
}
