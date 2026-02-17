"use client";

/**
 * AI Interactions Log
 *
 * Shows recent AI tutor conversations for teacher visibility.
 * Real-time updates using Supabase subscriptions.
 *
 * Teachers can:
 * - See what students are asking
 * - Monitor AI response quality
 * - Identify common questions/struggles
 */

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";
import type { SupportedLanguage } from "@/types/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clientLogger } from "@/lib/client-logger";

/** Message role type for AI interactions */
type MessageRole = "user" | "assistant" | "system";

/** Input mode type for AI interactions */
type InputMode = "text" | "voice";

interface AIInteraction {
  readonly id: string;
  readonly student_id: string;
  readonly student_name?: string;
  readonly session_id: string;
  readonly topic_id?: string;
  readonly message_role: MessageRole;
  readonly message_content: string;
  readonly input_mode: InputMode;
  readonly language: SupportedLanguage;
  readonly tokens_used: number;
  readonly response_time_ms: number;
  readonly created_at: string;
}

interface AIInteractionsLogProps {
  readonly classId: string;
  readonly limit?: number;
}

export function AIInteractionsLog({
  classId,
  limit = 20,
}: AIInteractionsLogProps) {
  const [interactions, setInteractions] = useState<AIInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInteractions = useCallback(async () => {
    try {
      const supabase = createClient();

      // Get enrolled students first
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("student_id")
        .eq("class_id", classId);

      const studentIds = enrollments?.map((e) => e.student_id) || [];

      if (studentIds.length === 0) {
        setInteractions([]);
        setLoading(false);
        return;
      }

      // Get recent AI interactions for these students
      // OPTIMIZATION: Select only needed columns instead of *
      const { data, error: fetchError } = await supabase
        .from("ai_tutor_interactions")
        .select(
          "id, student_id, session_id, topic_id, message_role, message_content, input_mode, language, tokens_used, created_at",
        )
        .in("student_id", studentIds)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      setInteractions((data || []) as AIInteraction[]);
      setLoading(false);
    } catch (error) {
      clientLogger.error(
        "[AIInteractionsLog] Error:",
        error instanceof Error ? error : undefined,
      );
      setError("Failed to load AI interactions");
      setLoading(false);
    }
  }, [classId, limit]);

  useEffect(() => {
    fetchInteractions();

    const supabase = createClient();

    // Subscribe to new interactions
    const channel = supabase
      .channel(`ai-interactions-${classId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ai_tutor_interactions",
        },
        (payload) => {
          // Add new interaction if it belongs to an enrolled student
          const newInteraction = payload.new as AIInteraction;
          setInteractions((prev) => [newInteraction, ...prev].slice(0, limit));
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, limit]); // Only depend on classId and limit to avoid subscription recreation

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Card key={`interaction-skeleton-${i}`} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-surface rounded w-1/4 mb-2" />
              <div className="h-3 bg-surface rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-error">
        <p>{error}</p>
      </div>
    );
  }

  if (interactions.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <p>No AI tutor interactions yet.</p>
        <p className="text-sm mt-1">
          Interactions will appear here when students use the AI tutor.
        </p>
      </div>
    );
  }

  // Group by session for better readability
  const sessions = groupBySession(interactions);

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <SessionCard key={session.sessionId} session={session} />
      ))}
    </div>
  );
}

interface Session {
  sessionId: string;
  studentId: string;
  language: string;
  topicId?: string;
  messages: AIInteraction[];
  startTime: string;
  totalTokens: number;
}

function groupBySession(interactions: AIInteraction[]): Session[] {
  const sessionMap = new Map<string, Session>();

  for (const interaction of interactions) {
    if (!sessionMap.has(interaction.session_id)) {
      sessionMap.set(interaction.session_id, {
        sessionId: interaction.session_id,
        studentId: interaction.student_id,
        language: interaction.language,
        topicId: interaction.topic_id,
        messages: [],
        startTime: interaction.created_at,
        totalTokens: 0,
      });
    }

    const session = sessionMap.get(interaction.session_id);
    if (session) {
      session.messages.push(interaction);
      session.totalTokens += interaction.tokens_used || 0;
    }
  }

  // Sort sessions by start time (newest first)
  return Array.from(sessionMap.values())
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    )
    .slice(0, 10);
}

/**
 * Get CSS classes for message box based on role
 */
function getMessageBoxClass(messageRole: MessageRole): string {
  switch (messageRole) {
    case "user":
      return "bg-primary/10 ml-8";
    case "assistant":
      return "bg-surface mr-8";
    case "system":
      return "bg-warning/10 text-xs";
  }
}

/**
 * Get label and emoji for message role
 */
function getMessageRoleLabel(messageRole: MessageRole): string {
  switch (messageRole) {
    case "user":
      return "🧑‍🎓 Student";
    case "assistant":
      return "🤖 ATAL AI";
    case "system":
      return "⚙️ System";
  }
}

function SessionCard({ session }: { readonly session: Session }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const languageEmoji = {
    en: "🇬🇧",
    hi: "🇮🇳",
    as: "🏔️",
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const firstUserMessage = session.messages.find(
    (m) => m.message_role === "user",
  );
  const firstQuestion = firstUserMessage?.message_content || "No messages";

  return (
    <Card className="overflow-hidden">
      <CardHeader
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? "Collapse" : "Expand"} conversation: ${truncate(firstQuestion, 40)}`}
        className="py-3 cursor-pointer hover:bg-surface-dark/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">
              {languageEmoji[session.language as keyof typeof languageEmoji] ||
                "💬"}
            </span>
            <div>
              <CardTitle className="text-sm font-medium">
                {truncate(firstQuestion, 60)}
              </CardTitle>
              <p className="text-xs text-text-secondary">
                {formatTime(session.startTime)} • {session.messages.length}{" "}
                messages • {session.totalTokens} tokens
              </p>
            </div>
          </div>
          <span className="text-text-secondary" aria-hidden="true">
            {isExpanded ? "▲" : "▼"}
          </span>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="py-2 border-t">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {session.messages
              .toSorted(
                (a, b) =>
                  new Date(a.created_at).getTime() -
                  new Date(b.created_at).getTime(),
              )
              .map((message) => (
                <div
                  key={message.id}
                  className={`p-2 rounded-lg text-sm ${getMessageBoxClass(message.message_role)}`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <span className="font-medium text-xs">
                      {getMessageRoleLabel(message.message_role)}
                    </span>
                    {message.input_mode === "voice" && (
                      <span className="text-xs text-text-secondary">🎤</span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap break-words">
                    {truncate(message.message_content, 300)}
                  </p>
                </div>
              ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}
