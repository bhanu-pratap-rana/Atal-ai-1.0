"use client";

import { useEffect, useState, memo, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { authLogger } from "@/lib/auth-logger";
import { isTeacherOrHigher } from "@/lib/auth/role-utils";
import type { User } from "@supabase/supabase-js";
import { LogOut } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  getDashboardStats,
  type DashboardStats,
} from "@/app/actions/dashboard-stats";
import { getAssessmentStatus, type AssessmentStatus } from "@/app/actions/assessment";
import { SyncStatusIndicator } from "@/components/offline/SyncStatusIndicator";
import { BadgesDisplay } from "@/components/gamification/BadgesDisplay";
import { LeaderboardCompact } from "@/components/gamification/Leaderboard";
import { PointsSummary } from "@/components/gamification/PointsHistory";
import { PreAssessmentPrompt } from "@/components/assessment/PreAssessmentPrompt";
import { PostAssessmentPrompt } from "@/components/assessment/PostAssessmentPrompt";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import { LanguageSelector } from "@/components/learn/LanguageSelector";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Get display name with fallback chain
 */
function getUserDisplayName(
  profileName: string | null,
  user: User | null,
): string {
  return (
    profileName ||
    user?.user_metadata?.full_name ||
    user?.app_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User"
  );
}

/**
 * Get welcome messages based on user role
 */
interface WelcomeMessages {
  readonly greeting: string;
  readonly description: string;
}

function getWelcomeMessages(
  isTeacherOrAdmin: boolean,
  userName: string,
  t: (key: string, values?: Record<string, string | number>) => string,
): WelcomeMessages {
  if (isTeacherOrAdmin) {
    return {
      greeting: t("dashboard.welcome", { name: userName }),
      description: t("dashboard.welcomeTeacher"),
    };
  }

  return {
    greeting: t("dashboard.welcome", { name: userName }),
    description: t("dashboard.welcomeStudent"),
  };
}

// Feature card data
const getFeatureCards = (
  isTeacher: boolean,
  t: (key: string) => string
) => [
  {
    title: t("nav.learn"),
    description: t("dashboard.featureLearnDesc"),
    emoji: "📖",
    href: "/app/learn",
  },
  {
    title: t("nav.classes"),
    description: t("dashboard.featureClassesDesc"),
    emoji: "👥",
    href: isTeacher ? "/app/teacher/classes" : "/app/student/classes",
  },
  {
    title: t("dashboard.featureProgress"),
    description: t("dashboard.featureProgressDesc"),
    emoji: "📊",
    href: "/app/progress",
  },
  {
    title: t("dashboard.featureAiTools"),
    description: t("dashboard.featureAiToolsDesc"),
    emoji: "🤖",
    href: "/app/ai-tools",
  },
  {
    title: t("nav.assessments"),
    description: t("dashboard.featureAssessmentsDesc"),
    emoji: "📝",
    href: isTeacher ? "/app/teacher/assessments" : "/app/student/assessments",
  },
  {
    title: t("nav.profile"),
    description: t("dashboard.featureProfileDesc"),
    emoji: "👤",
    href: "/app/settings",
  },
];

// REACT-001 FIX: Stat Card Component wrapped with React.memo for performance
const StatCard = memo(function StatCard({
  icon,
  value,
  label,
}: Readonly<{
  icon: string;
  value: string | number;
  label: string;
}>) {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-2xl p-5 shadow-[var(--shadow-md)] border border-border-light flex items-center gap-4"
    >
      <div className="w-12 h-12 bg-primary-lightest rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <p className="text-sm text-text-secondary">{label}</p>
      </div>
    </motion.div>
  );
});

// REACT-001 FIX: Feature Card Component wrapped with React.memo for performance
// PERFORMANCE: Uses Link with prefetch instead of router.push for faster navigation
const FeatureCard = memo(function FeatureCard({
  title,
  description,
  emoji,
  href,
}: Readonly<{
  title: string;
  description: string;
  emoji: string;
  href: string;
}>) {
  return (
    <Link href={href} prefetch={true}>
      <motion.div
        variants={itemVariants}
        whileHover={{ y: -4, boxShadow: "var(--shadow-primary)" }}
        className="p-[3px] rounded-2xl bg-gradient-primary shadow-[var(--shadow-primary-sm)] cursor-pointer h-full"
      >
        <div className="bg-white rounded-xl p-5 h-full">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary-lightest rounded-lg flex items-center justify-center text-xl">
              {emoji}
            </div>
            <h3 className="text-lg font-bold text-text-primary">{title}</h3>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            {description}
          </p>
        </div>
      </motion.div>
    </Link>
  );
});

export default function DashboardPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [enrolledClassId, setEnrolledClassId] = useState<string | null>(null);
  const [_assessmentStatus, setAssessmentStatus] = useState<AssessmentStatus | null>(null);
  const [showPrePrompt, setShowPrePrompt] = useState(false);
  const [showPostPrompt, setShowPostPrompt] = useState(false);
  const supabase = createClient();

  // Check app_metadata.role (set during teacher registration via admin API)
  // This is reliable as it's set server-side and cannot be modified by client
  const appRole = user?.app_metadata?.role;
  const isTeacherOrAdmin = isTeacherOrHigher(appRole);

  // Use profile name if available, otherwise fall back to user metadata or email
  const userName = getUserDisplayName(profileName, user);

  useEffect(() => {
    async function getUserAndProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const role = user.app_metadata?.role;
        // Check for teacher, admin, AND super_admin roles
        const isTeacher = isTeacherOrHigher(role);

        // Fetch profile, enrollment, and stats in PARALLEL (eliminates waterfall)
        const profilePromise = isTeacher
          ? supabase
              .from("teacher_profiles")
              .select("name")
              .eq("user_id", user.id)
              .maybeSingle()
          : supabase
              .from("student_profiles")
              .select("name")
              .eq("user_id", user.id)
              .maybeSingle();

        const enrollmentPromise = !isTeacher
          ? supabase
              .from("enrollments")
              .select("class_id")
              .eq("student_id", user.id)
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null });

        const statsPromise = getDashboardStats();
        const assessmentStatusPromise = !isTeacher
          ? getAssessmentStatus()
          : Promise.resolve({ success: false } as const);

        // Execute all in parallel
        const [profileResult, enrollmentResult, statsResult, assessmentStatusResult] = await Promise.all([
          profilePromise,
          enrollmentPromise,
          statsPromise,
          assessmentStatusPromise,
        ]);

        // Set profile name
        if (profileResult.data?.name) {
          setProfileName(profileResult.data.name);
        }

        // Set enrollment (students only)
        if (!isTeacher && enrollmentResult.data?.class_id) {
          setEnrolledClassId(enrollmentResult.data.class_id);
        }

        // Set stats
        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data);
        }

        // Set assessment status and show appropriate prompt (students only)
        if (!isTeacher && assessmentStatusResult.success && assessmentStatusResult.data) {
          const status = assessmentStatusResult.data;
          setAssessmentStatus(status);

          // Show pre-assessment prompt if student hasn't taken one and hasn't dismissed it
          const dismissedPre = localStorage.getItem("dismissed_pre_assessment");
          if (!status.hasPreAssessment && !dismissedPre) {
            setShowPrePrompt(true);
          }

          // Show post-assessment prompt if curriculum completed but no post-assessment
          const dismissedPost = localStorage.getItem("dismissed_post_assessment");
          if (status.curriculumCompleted && !status.hasPostAssessment && !dismissedPost) {
            setShowPostPrompt(true);
          }
        }
      }

      setLoading(false);
    }
    getUserAndProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      router.refresh();
      router.push("/student/start");
    } catch (error) {
      authLogger.error("[Dashboard] Sign out failed", error);
    }
  }

  // REACT-002 FIX: Memoize feature cards - MUST be before any early returns
  // to comply with Rules of Hooks (hooks must be called in same order every render)
  const featureCards = useMemo(
    () => getFeatureCards(isTeacherOrAdmin, t),
    [isTeacherOrAdmin, t]
  );

  if (loading) {
    return (
      <LoadingSpinner message={t("common.loading")} size="lg" fullPage />
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-border-light sticky top-0 z-50">
        <div className="container-responsive max-w-7xl py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0">
                <Image
                  src="/assets/logo.png"
                  alt="ATAL AI Logo"
                  width={56}
                  height={56}
                  className="w-full h-full object-contain rounded-full"
                  style={{
                    boxShadow: `
                      0 0 0 2px white,
                      0 0 0 3px var(--color-primary),
                      0 2px 8px var(--shadow-primary-sm)
                    `,
                  }}
                  priority
                />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-text-primary">
                  {t("dashboard.title")}
                </h1>
                <p className="text-xs md:text-sm text-text-secondary">
                  {t("dashboard.subtitle")}
                </p>
              </div>
            </div>

            {/* Language Selector, Sync Status & Sign Out */}
            <div className="flex items-center gap-2 md:gap-3">
              <LanguageSelector variant="compact" className="hidden sm:block" />
              <SyncStatusIndicator compact />
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t("common.signOut")}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-responsive max-w-7xl py-6 md:py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Mobile Language Selector */}
          <motion.div variants={itemVariants} className="sm:hidden mb-4">
            <div className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm">
              <span className="text-sm text-text-secondary">{t("common.language")}</span>
              <LanguageSelector variant="compact" />
            </div>
          </motion.div>

          {/* Welcome Banner */}
          <motion.div
            variants={itemVariants}
            className="gradient-primary rounded-2xl p-6 md:p-8 mb-8 shadow-[var(--shadow-primary)]"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                {(() => {
                  const messages = getWelcomeMessages(isTeacherOrAdmin, userName, t);
                  return (
                    <>
                      <h2 className="text-2xl md:text-3xl font-bold mb-1 text-white drop-shadow-sm truncate">
                        {messages.greeting}
                      </h2>
                      <p className="text-sm md:text-base text-white/90">
                        {messages.description}
                      </p>
                    </>
                  );
                })()}
              </div>
              {isTeacherOrAdmin && (
                <Button
                  onClick={() => router.push("/app/teacher/classes")}
                  variant="secondary"
                  className="bg-white text-primary hover:bg-surface shrink-0"
                >
                  {t("dashboard.createClass")}
                </Button>
              )}
            </div>
          </motion.div>

          {/* Stats Grid - Real Data with Empty States */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon="📚"
              value={stats?.classesCount ?? 0}
              label={isTeacherOrAdmin ? t("dashboard.classesCreated") : t("dashboard.classesJoined")}
            />
            <StatCard
              icon="📝"
              value={stats?.assessmentsCount ?? 0}
              label={t("dashboard.assessments")}
            />
            <StatCard
              icon="🎯"
              value={
                stats?.averageScore == null ? "--" : `${stats.averageScore}%`
              }
              label={t("dashboard.avgScore")}
            />
            <StatCard
              icon="🔥"
              value={stats?.streakDays ?? 0}
              label={t("dashboard.dayStreak")}
            />
          </div>

          {/* Empty State Message for New Users */}
          {stats?.classesCount === 0 &&
            stats?.assessmentsCount === 0 && (
              <motion.div
                variants={itemVariants}
                className="bg-info-light border border-info/30 rounded-xl p-6 mb-8 text-center"
              >
                <p className="text-lg font-medium text-info-dark mb-2">
                  {isTeacherOrAdmin
                    ? t("dashboard.welcomeEmoji")
                    : t("dashboard.welcomeStudentEmoji")}
                </p>
                <p className="text-sm text-text-secondary mb-4">
                  {isTeacherOrAdmin
                    ? t("dashboard.getStartedTeacher")
                    : t("dashboard.getStartedStudent")}
                </p>
                <Button
                  onClick={() =>
                    router.push(
                      isTeacherOrAdmin
                        ? "/app/teacher/classes"
                        : "/app/assessment/start?type=pre",
                    )
                  }
                  variant="default"
                >
                  {isTeacherOrAdmin
                    ? t("dashboard.createFirstClass")
                    : t("dashboard.startAssessment")}
                </Button>
              </motion.div>
            )}

          {/* Gamification Section - Badges, Points & Leaderboard */}
          {!isTeacherOrAdmin && user && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Badges - takes 2/3 width on desktop to avoid cramped grid */}
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      🏆 {t("dashboard.yourBadges")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BadgesDisplay
                      studentId={user.id}
                      language={language}
                      showAll={true}
                    />
                  </CardContent>
                </Card>
              </motion.div>
              {/* Points + Leaderboard stacked in right 1/3 */}
              <div className="space-y-6">
                <motion.div variants={itemVariants}>
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        ⭐ {t("dashboard.points")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PointsSummary studentId={user.id} />
                    </CardContent>
                  </Card>
                </motion.div>
                {enrolledClassId && (
                  <motion.div variants={itemVariants}>
                    <LeaderboardCompact
                      classId={enrolledClassId}
                      currentUserId={user.id}
                      limit={5}
                    />
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* Feature Cards Grid */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">
              {t("dashboard.quickActions")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {featureCards.map((card) => (
                <FeatureCard
                  key={card.title}
                  title={card.title}
                  description={card.description}
                  emoji={card.emoji}
                  href={card.href}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </main>

      {/* Pre/Post Assessment Prompt Modals (students only) */}
      {!isTeacherOrAdmin && (
        <>
          <PreAssessmentPrompt
            open={showPrePrompt}
            onDismiss={() => {
              setShowPrePrompt(false);
              localStorage.setItem("dismissed_pre_assessment", "true");
            }}
          />
          <PostAssessmentPrompt
            open={showPostPrompt}
            onDismiss={() => {
              setShowPostPrompt(false);
              localStorage.setItem("dismissed_post_assessment", "true");
            }}
          />
        </>
      )}
    </div>
  );
}
