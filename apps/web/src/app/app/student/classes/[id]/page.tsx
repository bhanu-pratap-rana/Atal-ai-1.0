import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getCurrentUser } from "@/lib/supabase-server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authLogger } from "@/lib/auth-logger";
import {
  StudentAnnouncementsCard,
  StudentMaterialsCard,
} from "@/components/student/communication";
import {
  getStudentClassAnnouncements,
  getStudentClassMaterials,
  type Announcement,
  type Material,
} from "@/app/actions/teacher";

interface ClassInfo {
  id: string;
  name: string;
  class_code: string;
  subject: string | null;
  teacher_id: string;
}

interface TeacherInfo {
  user_id: string;
  name: string | null;
}

interface ClassWithTeacher {
  class: ClassInfo;
  teacher: TeacherInfo | null;
  enrolledAt: string;
}

async function getStudentClassDetails(
  classId: string,
  userId: string
): Promise<ClassWithTeacher | null> {
  try {
    const supabase = await createClient();

    // Fetch enrollment with class details
    const { data: enrollment, error: enrollmentError } = await supabase
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
      `
      )
      .eq("class_id", classId)
      .eq("student_id", userId)
      .maybeSingle();

    if (enrollmentError) {
      authLogger.error(
        "[getStudentClassDetails] Error fetching enrollment",
        enrollmentError
      );
      return null;
    }

    if (!enrollment || !enrollment.class) {
      return null;
    }

    const classData = Array.isArray(enrollment.class)
      ? enrollment.class[0]
      : enrollment.class;

    // Fetch teacher info
    let teacher: TeacherInfo | null = null;
    if (classData?.teacher_id) {
      const { data: teacherProfile } = await supabase
        .from("teacher_profiles")
        .select("user_id, name")
        .eq("user_id", classData.teacher_id)
        .maybeSingle();

      if (teacherProfile) {
        teacher = teacherProfile;
      }
    }

    return {
      class: classData as ClassInfo,
      teacher,
      enrolledAt: enrollment.created_at,
    };
  } catch (error) {
    authLogger.error("[getStudentClassDetails] Unexpected error", error);
    return null;
  }
}

export default async function StudentClassDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/student/start");
  }

  const classDetails = await getStudentClassDetails(id, user.id);

  if (!classDetails) {
    redirect("/app/student/classes");
  }

  // Fetch announcements and materials
  const [announcementsResult, materialsResult] = await Promise.all([
    getStudentClassAnnouncements(id),
    getStudentClassMaterials(id),
  ]);

  // Transform announcements to include is_read for UI
  const announcements = announcementsResult.success
    ? (announcementsResult.data as (Announcement & { is_read?: boolean })[])
    : [];

  const materials = materialsResult.success
    ? (materialsResult.data as Material[])
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-surface to-cyan-lightest page-layout">
      <div className="container-responsive max-w-4xl">
        {/* Header */}
        <div className="mb-responsive">
          <Link href="/app/student/classes">
            <Button variant="ghost" className="mb-4 touch-target">
              ← Back to My Classes
            </Button>
          </Link>

          <Card className="card-responsive">
            <CardHeader>
              <div className="text-center sm:text-left">
                <CardTitle className="flex items-center justify-center sm:justify-start gap-2 text-xl md:text-3xl">
                  <span>📚</span>
                  <span className="bg-gradient-to-r from-primary via-primary-dark to-cyan bg-clip-text text-transparent">
                    {classDetails.class.name}
                  </span>
                </CardTitle>
                <CardDescription className="mt-2">
                  <span className="block sm:inline">
                    Teacher: {classDetails.teacher?.name || "Not available"}
                  </span>
                  {classDetails.class.subject && (
                    <span className="block sm:inline sm:ml-4">
                      Subject: {classDetails.class.subject}
                    </span>
                  )}
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-responsive">
          <Card className="card-responsive">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">📢</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">
                {announcements.length}
              </p>
              <p className="text-sm text-text-secondary">Announcements</p>
            </CardContent>
          </Card>
          <Card className="card-responsive">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-cyan/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">📁</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">
                {materials.length}
              </p>
              <p className="text-sm text-text-secondary">Materials</p>
            </CardContent>
          </Card>
        </div>

        {/* Announcements */}
        <div className="mb-responsive">
          <StudentAnnouncementsCard announcements={announcements} />
        </div>

        {/* Materials */}
        <div className="mb-responsive">
          <StudentMaterialsCard materials={materials} />
        </div>

        {/* Quick Actions */}
        <Card className="card-responsive">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/app/learn">
                <Button variant="outline" className="w-full">
                  <span className="mr-2">📖</span> Continue Learning
                </Button>
              </Link>
              <Link href="/app/ai-tools/tutor">
                <Button variant="outline" className="w-full">
                  <span className="mr-2">🤖</span> AI Tutor
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
