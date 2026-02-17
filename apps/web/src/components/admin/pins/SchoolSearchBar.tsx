/**
 * SchoolSearchBar Component
 * Handles school search and suggestions
 */

import { Search, Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { SchoolListItem } from "@/app/actions/admin-pin-management";

interface SchoolSearchBarProps {
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly filteredSchools: SchoolListItem[];
  readonly showSuggestions: boolean;
  readonly onSelectSchool: (school: SchoolListItem) => Promise<void>;
  readonly loadingSchoolDetails: boolean;
  readonly searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export function SchoolSearchBar({
  searchQuery,
  onSearchChange,
  filteredSchools,
  showSuggestions,
  onSelectSchool,
  loadingSchoolDetails,
  searchInputRef,
}: SchoolSearchBarProps) {
  const visibleSchools = showSuggestions ? filteredSchools.slice(0, 10) : [];

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Search by school name or code..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
          disabled={loadingSchoolDetails}
        />
        {loadingSchoolDetails && (
          <Loader className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" />
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && visibleSchools.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
          {visibleSchools.map((school) => (
            <button
              key={school.schoolId}
              onClick={() => onSelectSchool(school)}
              className="w-full text-left px-4 py-3 hover:bg-surface-dark transition-colors border-b border-border last:border-b-0"
              disabled={loadingSchoolDetails}
            >
              <p className="font-medium text-text">{school.schoolName}</p>
              <p className="text-xs text-text-secondary">
                Code: {school.schoolCode}
                {school.districtName && ` • ${school.districtName}`}
              </p>
            </button>
          ))}
          {filteredSchools.length > 10 && (
            <div className="px-4 py-2 text-xs text-text-secondary text-center border-t border-border">
              {filteredSchools.length - 10} more schools...
            </div>
          )}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && filteredSchools.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-lg shadow-lg z-10 px-4 py-3 text-sm text-text-secondary">
          No schools found
        </div>
      )}
    </div>
  );
}
