/**
 * Student Conversation History Page
 *
 * Displays all past AI tutor conversations for the student.
 * Allows viewing full conversations and continuing past sessions.
 *
 * Data source: ai_tutor_interactions table
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { Card, CardContent } from "@/components/ui/card";
import { ConversationHistory } from "@/components/tutor/ConversationHistory";
import { authLogger } from "@/lib/auth-logger";

export default async function ConversationHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student/start");
  }

  // Fetch all conversations grouped by session
  const { data: interactions, error } = await supabase
    .from("ai_tutor_interactions")
    .select("id, session_id, topic_id, message_role, message_content, input_mode, language, created_at")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    authLogger.error("[ConversationHistory] Error fetching interactions:", error);
  }

  // Group interactions by session_id
  const sessionMap = new Map<string, {
    session_id: string;
    topic_id: string | null;
    language: string;
    messages: Array<{
      id: string;
      role: string;
      content: string;
      input_mode: string;
      created_at: string;
    }>;
    first_message_at: string;
    last_message_at: string;
    message_count: number;
  }>();

  interactions?.forEach((interaction) => {
    const existing = sessionMap.get(interaction.session_id);

    if (existing) {
      existing.messages.push({
        id: interaction.id,
        role: interaction.message_role,
        content: interaction.message_content,
        input_mode: interaction.input_mode || "text",
        created_at: interaction.created_at || "",
      });
      existing.message_count++;
      // Update first/last message times
      if (interaction.created_at && interaction.created_at < existing.first_message_at) {
        existing.first_message_at = interaction.created_at;
      }
      if (interaction.created_at && interaction.created_at > existing.last_message_at) {
        existing.last_message_at = interaction.created_at;
      }
    } else {
      sessionMap.set(interaction.session_id, {
        session_id: interaction.session_id,
        topic_id: interaction.topic_id,
        language: interaction.language || "en",
        messages: [{
          id: interaction.id,
          role: interaction.message_role,
          content: interaction.message_content,
          input_mode: interaction.input_mode || "text",
          created_at: interaction.created_at || "",
        }],
        first_message_at: interaction.created_at || "",
        last_message_at: interaction.created_at || "",
        message_count: 1,
      });
    }
  });

  // Convert to array and sort by most recent
  const sessions = Array.from(sessionMap.values())
    .map((session) => ({
      ...session,
      // Sort messages chronologically within each session
      messages: session.messages.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    }))
    .sort((a, b) =>
      new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );

  const totalConversations = sessions.length;
  const totalMessages = interactions?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-surface page-layout">
      <div className="container-responsive max-w-4xl">
        {/* Header */}
        <div className="mb-responsive text-center sm:text-left">
          <Link
            href="/app/ai-tools"
            className="text-primary hover:text-primary-dark mb-4 inline-flex items-center gap-1 text-sm md:text-base touch-target"
          >
            ← Back to AI Tools
          </Link>
          <h1 className="heading-1 text-primary mb-2">💬 Conversation History</h1>
          <p className="text-text-secondary text-sm md:text-base">
            View your past conversations with the AI Tutor
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-responsive mb-responsive">
          <Card className="card-responsive">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{totalConversations}</p>
                <p className="text-sm text-text-secondary">Conversations</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-responsive">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-accent-dark">{totalMessages}</p>
                <p className="text-sm text-text-secondary">Total Messages</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversations List */}
        {sessions.length > 0 ? (
          <ConversationHistory sessions={sessions} />
        ) : (
          <Card className="card-responsive">
            <CardContent className="py-12">
              <div className="text-center">
                <div className="text-5xl mb-4">🤖</div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  No conversations yet
                </h3>
                <p className="text-text-secondary mb-6 max-w-md mx-auto">
                  Start a conversation with the AI Tutor to get help with your learning.
                  Your chat history will appear here.
                </p>
                <Link
                  href="/app/ai-tools/tutor"
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
                >
                  Start a Conversation
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
