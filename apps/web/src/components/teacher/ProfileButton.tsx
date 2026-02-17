"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Teacher Profile Button
 *
 * Links to the settings page where teachers can view and edit their profile.
 * Profile data stored in teacher_profiles table:
 * - name, gender, phone, subject, village, school_code
 * - RLS ensures teachers can only read/update their own profile
 */
export function ProfileButton() {
  return (
    <Link href="/app/settings">
      <Button
        variant="outline"
        size="sm"
        className="gap-2 border-cyan/30 text-cyan-dark hover:bg-cyan/10 hover:text-cyan-darkest hover:border-cyan"
      >
        <User className="w-4 h-4" />
        Profile
      </Button>
    </Link>
  );
}
