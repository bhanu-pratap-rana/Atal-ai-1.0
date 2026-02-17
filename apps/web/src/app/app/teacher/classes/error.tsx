"use client";

import { ErrorFallback } from "@/components/errors/ErrorFallback";

export default function TeacherClassesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} context="teacher-classes" />;
}
