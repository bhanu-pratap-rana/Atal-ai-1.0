"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { clientLogger } from "@/lib/client-logger";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { removeStudent } from "@/app/actions/teacher";

/** Shared date format options — reused across render cycles */
const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

function formatEnrollmentDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", DATE_FORMAT_OPTIONS);
}

interface StudentInfo {
  readonly user_id: string;
  readonly name: string | null;
  readonly phone: string | null;
  readonly roll_number: string | null;
  readonly class_name: string | null;
}

interface Enrollment {
  readonly id: string;
  readonly created_at: string;
  readonly student_id: string;
  readonly student: StudentInfo | null;
}

interface RosterTableProps {
  readonly enrollments: Enrollment[];
  readonly classId: string;
}

// Helper to get display name for student
function getStudentDisplayName(enrollment: Enrollment): string {
  return (
    enrollment.student?.name || `Student ${enrollment.student_id.slice(0, 8)}`
  );
}

// Helper to get student initial
function getStudentInitial(enrollment: Enrollment): string {
  const name = enrollment.student?.name;
  if (name) {
    return name[0].toUpperCase();
  }
  return "S";
}

/**
 * Remove button text states - S2301 compliance (no boolean params)
 */
const REMOVE_BUTTON_TEXT = {
  active: "Removing...",
  idle: "Remove",
} as const;

export function RosterTable({ enrollments, classId }: RosterTableProps) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleRemove(studentId: string, studentName: string) {
    if (!confirm(`Remove ${studentName} from this class?`)) {
      return;
    }

    setRemovingId(studentId);

    try {
      const result = await removeStudent(classId, studentId);

      if (result.success) {
        toast.success("Student removed successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to remove student");
      }
    } catch (error) {
      clientLogger.error(
        "[RosterTable] Failed to remove student",
        error instanceof Error ? error : { error: String(error) },
      );
      toast.error("An unexpected error occurred");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <Table
        role="table"
        aria-label="Class roster with student enrollment information"
      >
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Student</TableHead>
            <TableHead scope="col" className="hidden sm:table-cell">
              Roll No.
            </TableHead>
            <TableHead scope="col" className="hidden md:table-cell">
              Class
            </TableHead>
            <TableHead scope="col" className="hidden lg:table-cell">
              Phone
            </TableHead>
            <TableHead scope="col" className="hidden xl:table-cell">
              Enrolled
            </TableHead>
            <TableHead scope="col" className="text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrollments.map((enrollment) => {
            const enrolledDate = formatEnrollmentDate(enrollment.created_at);
            const displayName = getStudentDisplayName(enrollment);
            const initial = getStudentInitial(enrollment);

            return (
              <TableRow key={enrollment.id}>
                <TableCell>
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
                    <div className="flex items-center gap-2">
                      <div className="size-8 shrink-0 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {initial}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm md:text-base truncate max-w-[140px] sm:max-w-[200px]">
                          {displayName}
                        </span>
                        {/* Mobile-only: Show roll number and class inline */}
                        <div className="flex flex-wrap gap-2 text-xs text-text-secondary sm:hidden">
                          {enrollment.student?.roll_number && (
                            <span>#{enrollment.student.roll_number}</span>
                          )}
                          {enrollment.student?.class_name && (
                            <span>{enrollment.student.class_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-text-secondary xl:hidden ml-10 md:ml-0">
                      {enrolledDate}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-text-secondary">
                  {enrollment.student?.roll_number || "-"}
                </TableCell>
                <TableCell className="hidden md:table-cell text-text-secondary">
                  {enrollment.student?.class_name || "-"}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-text-secondary">
                  {enrollment.student?.phone || "-"}
                </TableCell>
                <TableCell className="hidden xl:table-cell text-text-secondary">
                  {enrolledDate}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleRemove(enrollment.student_id, displayName)
                    }
                    disabled={removingId === enrollment.student_id}
                    className="h-9 px-3"
                    aria-label={`Remove ${displayName} from class`}
                  >
                    {removingId === enrollment.student_id ? REMOVE_BUTTON_TEXT.active : REMOVE_BUTTON_TEXT.idle}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
