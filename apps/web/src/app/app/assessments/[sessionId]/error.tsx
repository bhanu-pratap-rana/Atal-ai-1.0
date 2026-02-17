"use client";

import { ErrorFallback } from "@/components/errors/ErrorFallback";

export default function AssessmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} context="assessment" />;
}
