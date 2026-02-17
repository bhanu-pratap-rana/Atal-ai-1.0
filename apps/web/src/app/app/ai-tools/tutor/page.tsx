"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
// NOSONAR S1874: useChat is marked deprecated but still functional in AI SDK 4.x
// Migration to AI SDK 5.0+ would require a major refactor - keeping for now
import { useChat } from "ai/react"; // NOSONAR
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { VoiceChat } from "@/components/voice/VoiceChat";
import { ConversationalVoiceChat } from "@/components/voice/ConversationalVoiceChat";

/**
 * Helper: Get language display name
 */
function getLanguageName(lang: "en" | "hi" | "as"): string {
  switch (lang) {
    case "en":
      return "English";
    case "hi":
      return "हिंदी";
    case "as":
      return "অসমীয়া";
  }
}

/**
 * Get selector button styling based on active state
 */
function getSelectorButtonClass(isActive: boolean): string {
  if (isActive) {
    return "bg-primary text-white";
  }
  return "bg-white text-text-secondary hover:bg-primary-light";
}

export default function AITutorPage() {
  const { user: _user, loading: isAuthChecking } = useRequireAuth("/student/start");
  const [language, setLanguage] = useState<"en" | "hi" | "as">("en");
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [voiceMode, setVoiceMode] = useState<"one-shot" | "conversational">("conversational");
  const [autoTTS, setAutoTTS] = useState(true); // Enable by default for voice mode
  // NOTE: Auto-detect is NOT used for voice input
  // Reason: Voice produces Romanized text (e.g., "mujhe batao" instead of "मुझे बताओ")
  // Unicode/keyword detection doesn't work reliably for Romanized voice transcripts
  // Users should use the UI language selector above to set their preferred response language
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSpokenIdRef = useRef<string | null>(null);
  const [textToSpeak, setTextToSpeak] = useState<string | null>(null);
  // PERF-007 FIX: Limit rendered messages for performance
  const [showAllMessages, setShowAllMessages] = useState(false);
  const VISIBLE_MESSAGE_LIMIT = 20;

  // Use Vercel AI SDK's useChat hook for streaming (NOSONAR S1874 - deprecated but functional)
  const { messages, input, handleInputChange, handleSubmit, status, error, append } =
    useChat({ // NOSONAR
      api: "/api/tutor/chat",
      body: {
        language,
        sessionId,
        inputMode,
      },
    });

  // Derive loading state from status
  const isLoading = status === "submitted" || status === "streaming";

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-TTS for conversational voice mode
  // Checks for new AI messages and triggers speech when streaming completes
  useEffect(() => {
    if (messages.length === 0 || status === "streaming") return;
    const last = messages[messages.length - 1];
    if (
      last.role === "assistant" &&
      last.id !== lastSpokenIdRef.current &&
      autoTTS &&
      inputMode === "voice" &&
      voiceMode === "conversational" &&
      last.content
    ) {
      lastSpokenIdRef.current = last.id;
      // Use queueMicrotask to avoid synchronous setState in effect body
      const content = last.content;
      queueMicrotask(() => setTextToSpeak(content));
    }
  }, [messages, status, autoTTS, inputMode, voiceMode]);

  // Clear text to speak after it's been processed
  const handleSpokenComplete = useCallback(() => {
    setTextToSpeak(null);
  }, []);

  // PERF-007 FIX: Memoize visible messages to avoid rendering all messages
  const visibleMessages = useMemo(() => {
    if (showAllMessages || messages.length <= VISIBLE_MESSAGE_LIMIT) {
      return messages;
    }
    // Show only the last N messages
    return messages.slice(-VISIBLE_MESSAGE_LIMIT);
  }, [messages, showAllMessages, VISIBLE_MESSAGE_LIMIT]);

  const hasHiddenMessages = messages.length > VISIBLE_MESSAGE_LIMIT && !showAllMessages;
  const hiddenMessageCount = messages.length - VISIBLE_MESSAGE_LIMIT;

  const suggestedQuestions = useMemo(() => {
    // Language-specific suggestions
    if (language === "hi") {
      return [
        "कंप्यूटर क्या है?",
        "इंटरनेट कैसे काम करता है?",
        "ईमेल क्या है?",
        "ऑनलाइन सुरक्षित कैसे रहें?",
      ];
    }
    if (language === "as") {
      return [
        "কম্পিউটাৰ কি?",
        "ইণ্টাৰনেট কেনেকৈ কাম কৰে?",
        "ইমেইল কি?",
        "অনলাইনত কেনেকৈ সুৰক্ষিত থাকিব?",
      ];
    }
    return [
      "What is a computer?",
      "How does the internet work?",
      "What is email?",
      "How to stay safe online?",
    ];
  }, [language]);

  // Show loading while checking auth
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream page-layout">
      <div className="container-responsive max-w-4xl">
        {/* Header */}
        <div className="mb-4">
          <Link
            href="/app/ai-tools"
            className="text-primary hover:text-primary-dark mb-4 inline-flex items-center gap-1 text-sm touch-target"
          >
            ← Back to AI Tools
          </Link>
          <h1 className="heading-2 text-primary mb-1">💬 AI Tutor</h1>
          <p className="text-text-secondary text-sm">
            Ask questions about digital literacy and get personalized help
          </p>
        </div>

        {/* Language & Input Mode Selectors */}
        <div className="flex flex-wrap gap-4 mb-4">
          {/* Language Selector */}
          <div className="flex gap-2">
            {(["en", "hi", "as"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${getSelectorButtonClass(language === lang)}`}
              >
                {getLanguageName(lang)}
              </button>
            ))}
          </div>

          {/* Input Mode Toggle */}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setInputMode("text")}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${getSelectorButtonClass(inputMode === "text")}`}
            >
              📝 Text
            </button>
            <button
              onClick={() => setInputMode("voice")}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${getSelectorButtonClass(inputMode === "voice")}`}
            >
              🎤 Voice
            </button>
          </div>
        </div>

        {/* Voice Mode Options - Only show when voice mode is active */}
        {inputMode === "voice" && (
          <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-white rounded-lg border border-border">
            {/* Voice Mode Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">Mode:</span>
              <button
                onClick={() => setVoiceMode("one-shot")}
                className={`px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
                  voiceMode === "one-shot"
                    ? "bg-primary text-white"
                    : "bg-surface-dark text-text-secondary hover:bg-surface-dark"
                }`}
              >
                One-shot
              </button>
              <button
                onClick={() => setVoiceMode("conversational")}
                className={`px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
                  voiceMode === "conversational"
                    ? "bg-primary text-white"
                    : "bg-surface-dark text-text-secondary hover:bg-surface-dark"
                }`}
              >
                Conversational
              </button>
            </div>

            {/* Language Info - Speak any language hint */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">
                Response: <strong className="text-primary">{getLanguageName(language)}</strong>
              </span>
              <span className="text-xs text-success" title="Speak in any language (English, Hindi, Assamese) - AI will understand and adapt">
                🎤 Speak any language
              </span>
            </div>

            {/* Auto-TTS Toggle */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-text-secondary">Auto-speak:</span>
              <button
                onClick={() => setAutoTTS(!autoTTS)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  autoTTS ? "bg-primary" : "bg-surface-dark"
                }`}
                aria-label={autoTTS ? "Disable auto-TTS" : "Enable auto-TTS"}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                    autoTTS ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Card className="mb-4 border-error bg-error/10">
            <CardContent className="p-4">
              <p className="text-sm text-error">
                ⚠️ {error.message || "An error occurred. Please try again."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Chat Area */}
        <Card className="mb-4">
          <CardContent className="p-4">
            {/* Messages Display */}
            <div className="h-[calc(100vh-450px)] sm:h-[400px] lg:h-[500px] overflow-y-auto space-y-4 mb-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-text-secondary mb-4">
                    {inputMode === "voice"
                      ? "Tap the microphone to start a voice conversation!"
                      : "Start a conversation with your AI tutor!"}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestedQuestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          if (inputMode === "voice") {
                            append({ role: "user", content: q });
                          } else {
                            handleInputChange({
                              target: { value: q },
                            } as React.ChangeEvent<HTMLInputElement>);
                          }
                        }}
                        className="px-3 py-2 bg-primary-light text-primary rounded-lg text-sm hover:bg-primary-lighter transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* PERF-007 FIX: Show "Load more" button when there are hidden messages */}
                  {hasHiddenMessages && (
                    <div className="text-center mb-4">
                      <button
                        onClick={() => setShowAllMessages(true)}
                        className="px-3 py-1 text-xs bg-surface-dark text-text-secondary rounded-full hover:bg-surface-dark transition-colors"
                      >
                        ↑ Show {hiddenMessageCount} earlier message{hiddenMessageCount !== 1 ? 's' : ''}
                      </button>
                    </div>
                  )}
                  {visibleMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-3 ${
                          message.role === "user"
                            ? "bg-primary text-white rounded-br-md"
                            : "bg-white border border-border rounded-bl-md"
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-border rounded-2xl rounded-bl-md p-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.1s]" />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form - Conditional based on mode */}
            {inputMode === "voice" ? (
              voiceMode === "conversational" ? (
                <ConversationalVoiceChat
                  language={language}
                  onTranscript={(transcript) => {
                    // Send transcript to AI - response language is controlled by UI selector
                    // Voice auto-detect is disabled because Romanized text detection is unreliable
                    if (transcript.trim()) {
                      append({
                        role: "user",
                        content: transcript,
                      });
                    }
                  }}
                  disabled={isLoading}
                  speakText={autoTTS ? textToSpeak : null}
                  onSpokenComplete={handleSpokenComplete}
                  // Auto-detect disabled - unreliable for voice (Romanized text)
                  autoDetectLanguage={false}
                />
              ) : (
                <VoiceChat
                  language={language}
                  onTranscript={(transcript) => {
                    if (transcript.trim()) {
                      append({
                        role: "user",
                        content: transcript,
                      });
                    }
                  }}
                  disabled={isLoading}
                />
              )
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder={
                    language === "hi"
                      ? "एक प्रश्न पूछें..."
                      : language === "as"
                        ? "এটা প্ৰশ্ন সোধক..."
                        : "Ask a question..."
                  }
                  className="flex-1 px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  {isLoading ? "..." : "Send"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Tips - Only show in text mode */}
        {inputMode === "text" && (
          <Card className="bg-primary-light border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-primary">
                💡 Tips for better answers
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="text-xs text-text-secondary space-y-1">
                <li>• Ask specific questions about digital literacy topics</li>
                <li>• Include context about what you&apos;re trying to learn</li>
                <li>• Feel free to ask follow-up questions</li>
                <li>• Watch responses appear in real-time with streaming! ⚡</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
