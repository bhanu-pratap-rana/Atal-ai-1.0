import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";
import { CreateClassDialog } from "@/components/teacher/CreateClassDialog";
import { ClassCard } from "@/components/teacher/ClassCard";
import { ProfileButton } from "@/components/teacher/ProfileButton";
import { SignOutButton } from "@/components/teacher/SignOutButton";

interface Class {
  id: string;
  name: string;
  class_code: string;
  teacher_id: string;
  created_at: string;
}

interface TeacherData {
  classes: Class[];
}

async function getTeacherData(userId: string): Promise<TeacherData> {
  try {
    const supabase = await createClient();

    // PERF-004 FIX: Select only needed columns instead of SELECT *
    const { data: classes, error } = await supabase
      .from("classes")
      .select("id, name, class_code, teacher_id, created_at")
      .eq("teacher_id", userId)
      .order("created_at", { ascending: false });

    if (error && Object.keys(error).length > 0) {
      authLogger.error("[getTeacherData] Failed to fetch classes", error);
    }

    return {
      classes: classes || [],
    };
  } catch (error) {
    authLogger.error("[getTeacherData] Unexpected error", error);
    return {
      classes: [],
    };
  }
}

export default async function TeacherClassesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/teacher/start");
  }

  const { classes } = await getTeacherData(user.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-surface to-cyan-lightest page-layout">
      <div className="container-responsive max-w-7xl">
        {/* Header - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-responsive">
          <div className="text-center sm:text-left">
            <h1 className="heading-1 bg-gradient-to-r from-primary via-primary-dark to-cyan bg-clip-text text-transparent">
              My Classes
            </h1>
            <p className="text-text-secondary mt-2 text-sm md:text-base">
              Manage your classes and students
            </p>
          </div>
          <div className="flex items-center justify-center sm:justify-end gap-3 sm:gap-4">
            <CreateClassDialog />
            <ProfileButton />
            <SignOutButton />
          </div>
        </div>

        {/* Classes Grid */}
        {classes.length === 0 ? (
          <div className="text-center py-12 md:py-16 px-4">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl md:text-5xl">📚</span>
            </div>
            <h2 className="heading-2 text-text-primary mb-2">No classes yet</h2>
            <p className="text-text-secondary mb-6 text-sm md:text-base">
              Create your first class to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-responsive">
            {classes.map((classItem: Class) => (
              <ClassCard key={classItem.id} classData={classItem} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
