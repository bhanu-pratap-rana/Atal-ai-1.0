"use client";

import { ErrorFallback } from "@/components/errors/ErrorFallback";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} context="learning-style" />;
}
