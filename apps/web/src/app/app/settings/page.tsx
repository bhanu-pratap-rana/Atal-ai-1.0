import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { isTeacherOrHigher } from "@/lib/auth/role-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentProfileEditor } from "@/components/settings/StudentProfileEditor";
import { TeacherProfileEditor } from "@/components/settings/TeacherProfileEditor";
import { DeleteAccountButton } from "@/components/settings/DeleteAccountButton";
import Link from "next/link";

/**
 * Navigation details based on user role
 */
interface BackNavigation {
  readonly href: string;
  readonly label: string;
}

/**
 * Get back navigation based on user role
 */
function getBackNavigation(isTeacherOrAdmin: boolean): BackNavigation {
  if (isTeacherOrAdmin) {
    return {
      href: "/app/teacher/classes",
      label: "Back to Classes",
    };
  }

  return {
    href: "/app/dashboard",
    label: "Back to Dashboard",
  };
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student/start");
  }

  // Check app_metadata.role (set during teacher registration via admin API)
  // This is reliable as it's set server-side and cannot be modified by client
  const appRole = user.app_metadata?.role;
  const isTeacherOrAdmin = isTeacherOrHigher(appRole);

  // Check if user signed up with username (Quick Start)
  const authType = user.user_metadata?.auth_type;
  const isUsernameAuth = authType === "username";
  const username = user.user_metadata?.username as string | undefined;

  // Determine display role - teachers promoted to admin show both roles
  // Super admin is unique (only atal.app.ai@gmail.com)
  const ROLE_DISPLAY_MAP: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Teacher, Admin",
    teacher: "Teacher",
  };
  const userRole = ROLE_DISPLAY_MAP[appRole] || "Student";

  // Fetch student profile if user is a student
  let studentProfile = null;
  if (!isTeacherOrAdmin) {
    // OPTIMIZATION: Select only needed columns instead of *
    const { data: profile } = await supabase
      .from("student_profiles")
      .select(
        "user_id, name, gender, phone, roll_number, school_id, school_name, class_name, village, created_at, updated_at",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    studentProfile = profile;
  }

  // Fetch teacher profile if user is a teacher/admin
  let teacherProfile: {
    user_id: string;
    name: string;
    phone: string | null;
    school_id: string;
    school_code: string;
    gender: "male" | "female" | null;
    subject: string | null;
    village: string | null;
    created_at: string;
    updated_at: string;
  } | null = null;
  if (isTeacherOrAdmin) {
    // OPTIMIZATION: Select only needed columns instead of *
    const { data: profile } = await supabase
      .from("teacher_profiles")
      .select(
        "user_id, name, phone, school_id, school_code, gender, subject, village, created_at, updated_at",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    teacherProfile = profile;
  }

  return (
    <div className="min-h-screen bg-cream page-layout">
      <div className="container-responsive max-w-4xl">
        {/* Header */}
        <div className="mb-responsive">
          {(() => {
            const nav = getBackNavigation(isTeacherOrAdmin);
            return (
              <Link
                href={nav.href}
                className="text-primary hover:text-primary-dark mb-4 inline-flex items-center gap-1 text-sm md:text-base touch-target"
              >
                ← {nav.label}
              </Link>
            );
          })()}
          <h1 className="heading-1 text-primary mb-2">Profile</h1>
          <p className="text-text-secondary text-sm md:text-base">
            View and manage your profile information
          </p>
        </div>

        {/* Account Info */}
        <Card className="mb-4 md:mb-6 card-responsive">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Show Username for Quick Start users, Email for others */}
            {isUsernameAuth ? (
              <div>
                <span className="text-sm font-medium text-text-secondary">
                  Username
                </span>
                <p className="text-text-primary font-mono">
                  {username || "Not set"}
                </p>
              </div>
            ) : (
              <div>
                <span className="text-sm font-medium text-text-secondary">
                  Email
                </span>
                <p className="text-text-primary break-all">
                  {user.email || "Not set"}
                </p>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-text-secondary">
                User ID
              </span>
              <p className="text-text-primary font-mono text-xs md:text-sm break-all">
                {user.id}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-text-secondary">
                Role
              </span>
              <p className="text-text-primary">{userRole}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-text-secondary">
                Account Created
              </span>
              <p className="text-text-primary">
                {new Date(user.created_at || "").toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Student Profile Section - Only show for students */}
        {!isTeacherOrAdmin && (
          <StudentProfileEditor
            profile={studentProfile}
            userEmail={user.email || ""}
            isUsernameAuth={isUsernameAuth}
            username={username}
          />
        )}

        {/* Teacher Profile Section - Only show for teachers/admins */}
        {isTeacherOrAdmin && teacherProfile && (
          <TeacherProfileEditor
            profile={teacherProfile}
            userEmail={user.email || ""}
          />
        )}

        {/* Preferences - Only show for students */}
        {!isTeacherOrAdmin && (
          <Card className="mb-4 md:mb-6 card-responsive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <span>Preferences</span>
                <span className="px-2 py-0.5 bg-warning-light text-warning-dark rounded-full text-xs">
                  Coming Soon
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 opacity-60">
                  <div>
                    <p className="font-medium text-text-primary">
                      Language Preference
                    </p>
                    <p className="text-sm text-text-secondary">
                      Choose your preferred language for assessments
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-surface-dark text-text-tertiary rounded-full text-sm w-fit">
                    English
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 opacity-60">
                  <div>
                    <p className="font-medium text-text-primary">
                      Assessment Reminders
                    </p>
                    <p className="text-sm text-text-secondary">
                      Get reminders for upcoming assessments
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-surface-dark text-text-tertiary rounded-full text-sm w-fit">
                    Not Set
                  </span>
                </div>
                <p className="text-xs text-text-tertiary pt-2">
                  Preference settings will be available in a future update.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Danger Zone */}
        <Card className="border-error/30 bg-error-light/50 card-responsive">
          <CardHeader>
            <CardTitle className="text-error-dark text-lg md:text-xl">
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary mb-4">
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
            <DeleteAccountButton userEmail={user.email || "your account"} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
