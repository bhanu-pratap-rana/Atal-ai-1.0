import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getCurrentUser } from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InviteStudentDialog } from "@/components/teacher/InviteStudentDialog";
import { RosterTable } from "@/components/teacher/RosterTable";
import { InvitePanel } from "@/components/teacher/InvitePanel";
import { AnalyticsTiles } from "@/components/teacher/AnalyticsTiles";
import { StudentProgressGrid } from "@/components/teacher/StudentProgressGrid";
import { AIInteractionsLog } from "@/components/teacher/AIInteractionsLog";
import { CommunicationSection } from "@/components/teacher/communication";
import {
  getClassAnalytics,
  getClassAnnouncements,
  getClassMaterials,
  type Announcement,
  type Material,
} from "@/app/actions/teacher";

interface StudentInfo {
  user_id: string;
  name: string | null;
  phone: string | null;
  roll_number: string | null;
  class_name: string | null;
}

interface EnrollmentRow {
  id: string;
  created_at: string;
  student_id: string;
}

interface Enrollment extends EnrollmentRow {
  student: StudentInfo | null;
}

interface RosterRow {
  enrollment_id: string;
  student_id: string;
  student_name: string | null;
  student_phone: string | null;
  roll_number: string | null;
  class_name: string | null;
  enrolled_at: string;
}

interface ClassWithRoster {
  class: {
    id: string;
    name: string;
    class_code: string;
    teacher_id: string;
    created_at: string;
    join_pin?: string;
    [key: string]: unknown;
  };
  enrollments: Enrollment[];
}

async function getClassWithRoster(
  classId: string,
  userId: string,
): Promise<ClassWithRoster | null> {
  try {
    const supabase = await createClient();

    // Fetch class details - use .maybeSingle() since class may not exist
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id, name, class_code, teacher_id, created_at, join_pin")
      .eq("id", classId)
      .eq("teacher_id", userId)
      .maybeSingle();

    if (classError) {
      authLogger.error("[getClassWithRoster] Error fetching class", classError);
      return null;
    }

    if (!classData) {
      return null;
    }

    // Use SECURITY DEFINER function to get roster with student profiles
    // This bypasses RLS restrictions that would otherwise block teacher access to student_profiles
    const { data: rosterData, error: rosterError } = await supabase.rpc(
      "get_class_roster",
      { p_class_id: classId },
    );

    if (rosterError) {
      authLogger.error(
        "[getClassWithRoster] Error fetching roster via RPC",
        rosterError,
      );

      // Fallback to direct query if RPC fails (e.g., function not yet deployed)
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select("id, created_at, student_id")
        .eq("class_id", classId);

      if (enrollmentsError) {
        authLogger.error(
          "[getClassWithRoster] Fallback error fetching enrollments",
          enrollmentsError,
        );
        return { class: classData, enrollments: [] };
      }

      // Try to get student profiles (may fail due to RLS)
      let enrollmentsWithStudents: Enrollment[] = [];
      if ((enrollmentsData?.length ?? 0) > 0) {
        const studentIds = enrollmentsData.map(
          (e: EnrollmentRow) => e.student_id,
        );
        const { data: students } = await supabase
          .from("student_profiles")
          .select("user_id, name, phone, roll_number, class_name")
          .in("user_id", studentIds);

        const studentMap = new Map(
          (students || []).map((s: StudentInfo) => [s.user_id, s]),
        );
        enrollmentsWithStudents = enrollmentsData.map((enrollment) => ({
          ...enrollment,
          student: studentMap.get(enrollment.student_id) || null,
        }));
      }

      return { class: classData, enrollments: enrollmentsWithStudents };
    }

    // Transform RPC result to Enrollment format
    const enrollmentsWithStudents: Enrollment[] = (rosterData || []).map(
      (row: RosterRow) => ({
        id: row.enrollment_id,
        created_at: row.enrolled_at,
        student_id: row.student_id,
        student: {
          user_id: row.student_id,
          name: row.student_name,
          phone: row.student_phone,
          roll_number: row.roll_number,
          class_name: row.class_name,
        },
      }),
    );

    return {
      class: classData,
      enrollments: enrollmentsWithStudents,
    };
  } catch (error) {
    authLogger.error("[getClassWithRoster] Unexpected error", error);
    return null;
  }
}

export default async function ClassDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/teacher/start");
  }

  const data = await getClassWithRoster(id, user.id);

  if (!data) {
    redirect("/app/teacher/classes");
  }

  const { class: classData, enrollments } = data;

  // Fetch analytics
  const analyticsResult = await getClassAnalytics(id);
  const analytics: {
    activeThisWeek: number;
    avgMinutesPerDay: number;
    atRiskCount: number;
  } = analyticsResult.success
    ? (analyticsResult.data as {
        activeThisWeek: number;
        avgMinutesPerDay: number;
        atRiskCount: number;
      })
    : {
        activeThisWeek: 0,
        avgMinutesPerDay: 0,
        atRiskCount: 0,
      };

  // Fetch announcements and materials for communication section
  const [announcementsResult, materialsResult] = await Promise.all([
    getClassAnnouncements(id),
    getClassMaterials(id),
  ]);
  const announcements: Announcement[] = announcementsResult.success
    ? (announcementsResult.data as Announcement[])
    : [];
  const materials: Material[] = materialsResult.success
    ? (materialsResult.data as Material[])
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-surface to-cyan-lightest page-layout">
      <div className="container-responsive max-w-6xl">
        {/* Header */}
        <div className="mb-responsive">
          <Link href="/app/teacher/classes">
            <Button variant="ghost" className="mb-4 touch-target">
              ← Back to Classes
            </Button>
          </Link>

          <Card className="card-responsive">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-center sm:text-left">
                  <CardTitle className="flex items-center justify-center sm:justify-start gap-2 text-xl md:text-3xl">
                    <span>📚</span>
                    <span className="bg-gradient-to-r from-primary via-primary-dark to-cyan bg-clip-text text-transparent line-clamp-2 break-words">
                      {classData.name}
                    </span>
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {enrollments.length}{" "}
                    {enrollments.length === 1 ? "student" : "students"} enrolled
                  </CardDescription>
                </div>
                <InviteStudentDialog classId={id} />
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Analytics Tiles */}
        {enrollments.length > 0 && (
          <div className="mb-responsive">
            <AnalyticsTiles
              activeThisWeek={analytics?.activeThisWeek || 0}
              avgMinutesPerDay={analytics?.avgMinutesPerDay || 0}
              atRiskCount={analytics?.atRiskCount || 0}
            />
          </div>
        )}

        {/* Invite Panel with QR Code */}
        <div className="mb-responsive">
          <InvitePanel
            classCode={classData.class_code}
            joinPin={classData.join_pin || ""}
            className={classData.name}
          />
        </div>

        {/* Real-time Student Progress Grid */}
        {enrollments.length > 0 && (
          <Card className="card-responsive mb-responsive">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <span>📊</span> Real-time Student Progress
              </CardTitle>
              <CardDescription>
                Live view of student learning progress and at-risk indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentProgressGrid classId={id} />
            </CardContent>
          </Card>
        )}

        {/* AI Tutor Interactions Log */}
        {enrollments.length > 0 && (
          <Card className="card-responsive mb-responsive">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <span>🤖</span> AI Tutor Activity
              </CardTitle>
              <CardDescription>
                Recent AI tutor conversations from your students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIInteractionsLog classId={id} limit={15} />
            </CardContent>
          </Card>
        )}

        {/* Teacher Communication: Announcements & Materials */}
        <div className="mb-responsive">
          <CommunicationSection
            classId={id}
            announcements={announcements}
            materials={materials}
          />
        </div>

        {/* Roster */}
        <Card className="card-responsive">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Class Roster</CardTitle>
            <CardDescription>
              View and manage students enrolled in this class
            </CardDescription>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl md:text-4xl">👥</span>
                </div>
                <h3 className="heading-3 text-text-primary mb-2">
                  No students enrolled yet
                </h3>
                <p className="text-text-secondary text-sm md:text-base px-4">
                  Use the Invite Student button above or share the class details
                  from the invitation section
                </p>
              </div>
            ) : (
              <RosterTable enrollments={enrollments} classId={id} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
