/**
 * Learning Style Profile Dashboard
 *
 * Displays the student's learning style preferences based on their behavior.
 * Shows visual, text, and auditory scores with tips for each style.
 *
 * Data source: learning_style_profile table
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchLearningStyleProfile,
  createDefaultProfile,
} from "@/lib/database/learning-profile-queries";
import { LearningStyleCard } from "@/components/learning/LearningStyleCard";

// Learning style tips and descriptions
const STYLE_INFO = {
  visual: {
    icon: "👁️",
    title: "Visual Learner",
    description: "You learn best through images, diagrams, and visual representations.",
    tips: [
      "Use mind maps and diagrams to organize information",
      "Watch video tutorials and demonstrations",
      "Highlight key concepts with different colors",
      "Create visual flashcards for memorization",
    ],
  },
  text: {
    icon: "📖",
    title: "Text Learner",
    description: "You learn best through reading and written explanations.",
    tips: [
      "Take detailed notes while learning",
      "Read and re-read important materials",
      "Write summaries in your own words",
      "Create lists and outlines to organize content",
    ],
  },
  auditory: {
    icon: "🎧",
    title: "Auditory Learner",
    description: "You learn best through listening and verbal explanations.",
    tips: [
      "Use the voice feature when available",
      "Read content aloud to yourself",
      "Discuss topics with classmates or teachers",
      "Listen to explanations multiple times",
    ],
  },
};

export default async function LearningStylePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student/start");
  }

  // SECURITY: Learning Style page is teacher-only (for class management)
  // Students should not see this - it's for teachers to understand student learning preferences
  const role = user.app_metadata?.role;
  const isTeacher = role === "teacher" || role === "admin" || role === "super_admin";
  
  if (!isTeacher) {
    redirect("/app/dashboard");
  }

  // Fetch or create learning style profile
  let profile = await fetchLearningStyleProfile(user.id);
  if (!profile) {
    profile = await createDefaultProfile(user.id);
  }

  // Calculate percentages and determine dominant style
  const totalScore =
    (profile?.visual_score ?? 33.33) +
    (profile?.text_score ?? 33.33) +
    (profile?.auditory_score ?? 33.33);

  const visualPercent = Math.round(((profile?.visual_score ?? 33.33) / totalScore) * 100);
  const textPercent = Math.round(((profile?.text_score ?? 33.33) / totalScore) * 100);
  const auditoryPercent = Math.round(((profile?.auditory_score ?? 33.33) / totalScore) * 100);

  // Determine dominant style
  const dominantStyle = profile?.preferred_style ||
    (visualPercent >= textPercent && visualPercent >= auditoryPercent
      ? "visual"
      : textPercent >= auditoryPercent
        ? "text"
        : "auditory");

  const dominantInfo = STYLE_INFO[dominantStyle as keyof typeof STYLE_INFO] || STYLE_INFO.visual;

  // Activity stats
  const imagesViewed = profile?.images_viewed ?? 0;
  const voiceReplays = profile?.voice_replays ?? 0;
  const textReadTime = profile?.text_read_time_seconds ?? 0;
  const hasActivity = imagesViewed > 0 || voiceReplays > 0 || textReadTime > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-surface page-layout">
      <div className="container-responsive max-w-4xl">
        {/* Header */}
        <div className="mb-responsive text-center sm:text-left">
          <Link
            href="/app/dashboard"
            className="text-primary hover:text-primary-dark mb-4 inline-flex items-center gap-1 text-sm md:text-base touch-target"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="heading-1 text-primary mb-2">🧠 Your Learning Style</h1>
          <p className="text-text-secondary text-sm md:text-base">
            Discover how you learn best based on your interactions
          </p>
        </div>

        {/* Dominant Style Card */}
        <Card className="card-responsive mb-responsive bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl md:text-2xl">
              <span className="text-3xl">{dominantInfo.icon}</span>
              {dominantInfo.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary mb-4">{dominantInfo.description}</p>
            {!hasActivity && (
              <div className="bg-warning-light/50 border border-warning/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-warning-dark">
                  <strong>Note:</strong> Your learning style profile is still being calculated.
                  Continue using the AI Tutor and learning materials to get more accurate results.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Style Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-responsive mb-responsive">
          <LearningStyleCard
            style="visual"
            score={visualPercent}
            isActive={dominantStyle === "visual"}
            icon={STYLE_INFO.visual.icon}
            title="Visual"
            activityCount={imagesViewed}
            activityLabel="images viewed"
          />
          <LearningStyleCard
            style="text"
            score={textPercent}
            isActive={dominantStyle === "text"}
            icon={STYLE_INFO.text.icon}
            title="Text"
            activityCount={Math.round(textReadTime / 60)}
            activityLabel="minutes reading"
          />
          <LearningStyleCard
            style="auditory"
            score={auditoryPercent}
            isActive={dominantStyle === "auditory"}
            icon={STYLE_INFO.auditory.icon}
            title="Auditory"
            activityCount={voiceReplays}
            activityLabel="voice replays"
          />
        </div>

        {/* Tips Section */}
        <Card className="card-responsive">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">
              💡 Tips for {dominantInfo.title}s
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {dominantInfo.tips.map((tip, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3 bg-surface rounded-lg border border-border-light"
                >
                  <span className="text-primary font-bold">✓</span>
                  <span className="text-text-primary">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="card-responsive mt-responsive">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">
              📊 How Your Style Is Calculated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary mb-4">
              Your learning style is determined by tracking how you interact with content:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-surface rounded-lg border border-border-light">
                <span className="font-medium text-primary">Visual Score</span>
                <p className="text-text-tertiary mt-1">
                  Increases when you view images and diagrams
                </p>
              </div>
              <div className="p-3 bg-surface rounded-lg border border-border-light">
                <span className="font-medium text-primary">Text Score</span>
                <p className="text-text-tertiary mt-1">
                  Increases based on time spent reading content
                </p>
              </div>
              <div className="p-3 bg-surface rounded-lg border border-border-light">
                <span className="font-medium text-primary">Auditory Score</span>
                <p className="text-text-tertiary mt-1">
                  Increases when you use voice features
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
