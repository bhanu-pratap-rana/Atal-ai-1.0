import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getCurrentUser } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authLogger } from "@/lib/auth-logger";
import { ChevronRight } from "lucide-react";

interface TeacherInfo {
  name: string | null;
  user_id: string;
}

interface ClassInfo {
  id: string;
  name: string;
  class_code: string;
  subject: string | null;
  teacher_id: string;
}

interface Enrollment {
  id: string;
  created_at: string;
  class: ClassInfo;
  teacher: TeacherInfo | null;
}

/**
 * Fetch student's enrolled classes using authenticated Supabase client
 * Uses proper JWT authentication so RLS can verify auth.uid() = student_id
 */
async function getStudentClasses(userId: string): Promise<Enrollment[]> {
  try {
    const supabase = await createClient();

    // Fetch enrollments with class details
    const { data: enrollments, error: enrollmentError } = await supabase
      .from("enrollments")
      .select(
        `
        id,
        created_at,
        class:classes(
          id,
          name,
          class_code,
          subject,
          teacher_id
        )
      `,
      )
      .eq("student_id", userId)
      .order("created_at", { ascending: false });

    if (enrollmentError) {
      authLogger.error(
        "[getStudentClasses] Error fetching enrollments",
        enrollmentError,
      );
      return [];
    }

    if (!enrollments || enrollments.length === 0) {
      return [];
    }

    // Helper to extract class from Supabase response (handles both array and single object)
    const getClassFromEnrollment = (
      e: (typeof enrollments)[0],
    ): ClassInfo | null => {
      if (!e.class) return null;
      // Supabase types can return array for relations, but single FK returns single object
      const classData = Array.isArray(e.class) ? e.class[0] : e.class;
      return classData as ClassInfo;
    };

    // Fetch teacher names for each class
    const teacherIds = [
      ...new Set(
        enrollments
          .map((e) => getClassFromEnrollment(e)?.teacher_id)
          .filter(Boolean),
      ),
    ];

    let teacherMap = new Map<string, TeacherInfo>();

    if (teacherIds.length > 0) {
      const { data: teachers } = await supabase
        .from("teacher_profiles")
        .select("user_id, name")
        .in("user_id", teacherIds);

      if (teachers) {
        teacherMap = new Map(teachers.map((t) => [t.user_id, t]));
      }
    }

    // Combine enrollments with teacher info
    return enrollments.map((enrollment) => {
      const classData = getClassFromEnrollment(enrollment);
      return {
        id: enrollment.id,
        created_at: enrollment.created_at,
        class: classData as ClassInfo,
        teacher: classData?.teacher_id
          ? teacherMap.get(classData.teacher_id) || null
          : null,
      };
    });
  } catch (error) {
    authLogger.error("[getStudentClasses] Unexpected error", error);
    return [];
  }
}

export default async function StudentClassesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/student/start");
  }

  const enrollments = await getStudentClasses(user.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-surface page-layout">
      <div className="container-responsive max-w-4xl">
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-responsive">
          <div className="text-center sm:text-left">
            <h1 className="heading-1 bg-gradient-to-r from-primary to-cyan bg-clip-text text-transparent">
              My Classes
            </h1>
            <p className="text-text-secondary mt-2 text-sm md:text-base">
              Classes you&apos;re enrolled in
            </p>
          </div>
          <Link href="/app/dashboard">
            <Button variant="outline" className="w-full sm:w-auto">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>

        {enrollments.length === 0 ? (
          <Card className="text-center py-10 md:py-12">
            <CardContent>
              <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl md:text-4xl">📚</span>
              </div>
              <h3 className="heading-3 text-text-primary mb-2">
                No classes yet
              </h3>
              <p className="text-text-secondary mb-6 text-sm md:text-base px-4">
                Ask your teacher for a class code to get started
              </p>
              <Link href="/join">
                <Button className="btn-mobile-full sm:w-auto">
                  Join a Class
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-responsive">
            {enrollments.map((enrollment: Enrollment) => (
              <Link
                key={enrollment.id}
                href={`/app/student/classes/${enrollment.class.id}`}
              >
                <Card className="hover:shadow-lg hover:border-primary/50 transition card-responsive cursor-pointer group">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base md:text-lg">
                      <span className="flex items-center gap-2">
                        <span>📚</span>
                        <span className="truncate">{enrollment.class.name}</span>
                      </span>
                      <ChevronRight className="w-5 h-5 text-text-tertiary group-hover:text-primary transition" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-text-secondary truncate">
                        <span className="font-medium">Teacher:</span>{" "}
                        {enrollment.teacher?.name || "Not available"}
                      </p>
                      {enrollment.class.subject && (
                        <p className="text-sm text-text-secondary truncate">
                          <span className="font-medium">Subject:</span>{" "}
                          {enrollment.class.subject}
                        </p>
                      )}
                      <p className="text-sm text-text-secondary">
                        <span className="font-medium">Joined:</span>{" "}
                        {new Date(enrollment.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-primary mt-2 group-hover:underline">
                        View announcements & materials →
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
