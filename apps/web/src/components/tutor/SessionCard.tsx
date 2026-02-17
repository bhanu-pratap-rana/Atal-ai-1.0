"use client";

/**
 * Session Card Component
 *
 * Displays a single conversation session with expand/collapse functionality.
 * Shows message preview and full conversation when expanded.
 */

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown, ChevronUp, MessageCircle, Mic, Type, ExternalLink } from "lucide-react";

interface Message {
  id: string;
  role: string;
  content: string;
  input_mode: string;
  created_at: string;
}

interface Session {
  session_id: string;
  topic_id: string | null;
  language: string;
  messages: Message[];
  first_message_at: string;
  last_message_at: string;
  message_count: number;
}

interface SessionCardProps {
  session: Session;
  isExpanded: boolean;
  onToggle: () => void;
}

// Format date to readable string
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

// Truncate text for preview
function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

// Language labels
const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  as: "Assamese",
};

export function SessionCard({ session, isExpanded, onToggle }: SessionCardProps) {
  // Get first user message for preview
  const firstUserMessage = session.messages.find((m) => m.role === "user");
  const previewText = firstUserMessage?.content || "Conversation";

  // Count message types
  const _userMessages = session.messages.filter((m) => m.role === "user").length;
  const voiceMessages = session.messages.filter((m) => m.input_mode === "voice").length;

  return (
    <Card className="card-responsive overflow-hidden transition-all duration-300">
      {/* Header - Clickable */}
      <CardHeader
        className="cursor-pointer hover:bg-surface/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Preview text */}
            <p className="font-medium text-text-primary truncate">
              {truncateText(previewText, 80)}
            </p>
            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-text-secondary">
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {session.message_count} messages
              </span>
              {voiceMessages > 0 && (
                <span className="flex items-center gap-1 text-info">
                  <Mic className="w-4 h-4" />
                  {voiceMessages} voice
                </span>
              )}
              <span className="text-text-tertiary">
                {formatDate(session.last_message_at)}
              </span>
            </div>
          </div>
          {/* Expand/Collapse icon */}
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
              {LANGUAGE_LABELS[session.language] || session.language}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-text-secondary" />
            ) : (
              <ChevronDown className="w-5 h-5 text-text-secondary" />
            )}
          </div>
        </div>
      </CardHeader>

      {/* Expanded Content */}
      {isExpanded && (
        <CardContent className="pt-0 border-t border-border-light">
          {/* Action buttons */}
          <div className="flex gap-3 mb-4 pt-4">
            <Link
              href={`/app/ai-tools/tutor?session=${session.session_id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Continue Conversation
            </Link>
          </div>

          {/* Messages */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {session.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2.5 ${
                    message.role === "user"
                      ? "bg-primary text-white"
                      : message.role === "assistant"
                        ? "bg-surface border border-border-light text-text-primary"
                        : "bg-surface text-text-secondary text-sm italic"
                  }`}
                >
                  {/* Message header for user messages */}
                  {message.role === "user" && (
                    <div className="flex items-center gap-2 mb-1 text-xs opacity-80">
                      {message.input_mode === "voice" ? (
                        <Mic className="w-3 h-3" />
                      ) : (
                        <Type className="w-3 h-3" />
                      )}
                      <span>
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                  {/* Message content */}
                  <p className="whitespace-pre-wrap break-words text-sm">
                    {message.content}
                  </p>
                  {/* Timestamp for assistant messages */}
                  {message.role === "assistant" && (
                    <p className="text-xs text-text-tertiary mt-1">
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
