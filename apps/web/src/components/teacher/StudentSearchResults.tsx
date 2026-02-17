"use client";

import { Label } from "@/components/ui/label";

interface StudentResult {
  readonly id: string;
  readonly email: string;
}

interface StudentSearchResultsProps {
  readonly results: StudentResult[];
  readonly selectedStudent: StudentResult | null;
  readonly onSelectStudent: (student: StudentResult) => void;
  readonly isLoading?: boolean;
}

export function StudentSearchResults({
  results,
  selectedStudent,
  onSelectStudent,
  isLoading = false,
}: StudentSearchResultsProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="student-list" className="text-sm font-medium">
        Select Student
      </Label>
      <ul
        id="student-list"
        className="border rounded-lg space-y-1 max-h-48 overflow-y-auto"
        aria-label="Student search results"
      >
        {results.map((student) => (
          <li key={student.id}>
            <button
              type="button"
              onClick={() => onSelectStudent(student)}
              disabled={isLoading}
              aria-pressed={selectedStudent?.id === student.id}
              className={`w-full text-left px-3 py-2 hover:bg-primary/10 border-b last:border-b-0 transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${selectedStudent?.id === student.id ? "bg-primary/10" : ""}`}
              aria-label={`Select student: ${student.email} (ID: ${student.id})`}
            >
              <p className="font-medium text-sm">{student.email}</p>
              <p className="text-xs text-text-secondary">
                {student.id}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
