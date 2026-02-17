"use client";

/**
 * Conversation History Component
 *
 * Displays a list of past AI tutor conversation sessions.
 * Each session can be expanded to view the full conversation.
 */

import { useState } from "react";
import { SessionCard } from "./SessionCard";

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

interface ConversationHistoryProps {
  sessions: Session[];
}

export function ConversationHistory({ sessions }: ConversationHistoryProps) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const toggleSession = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <SessionCard
          key={session.session_id}
          session={session}
          isExpanded={expandedSession === session.session_id}
          onToggle={() => toggleSession(session.session_id)}
        />
      ))}
    </div>
  );
}
