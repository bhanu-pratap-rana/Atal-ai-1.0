"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { saveStudentProfile } from "@/app/actions/student";
import {
  validateOptionalPhone,
  sanitizeProfilePhone,
} from "@/lib/validation-utils";
import { PROFILE_TIMING } from "@/lib/constants/ui-timings";
import { clientLogger } from "@/lib/client-logger";
import { Pencil, Check, X } from "lucide-react";

/**
 * StudentProfile interface matching student_profiles table schema
 * NOTE: user_id is the PRIMARY KEY (not id) - see DATABASE.md
 */
interface StudentProfile {
  readonly user_id: string; // PRIMARY KEY - references auth.users
  readonly name: string;
  readonly gender: "male" | "female";
  readonly phone?: string | null;
  readonly roll_number?: string | null;
  readonly school_name?: string | null;
  readonly class_name?: string | null;
  readonly village?: string | null;
  readonly created_at?: string;
  readonly updated_at?: string;
}

interface StudentProfileEditorProps {
  readonly profile: StudentProfile | null;
  readonly userEmail: string;
  readonly isUsernameAuth?: boolean;
  readonly username?: string;
}

export function StudentProfileEditor({
  profile,
  userEmail,
  isUsernameAuth,
  username,
}: StudentProfileEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [name, setName] = useState(profile?.name || "");
  const [gender, setGender] = useState<"male" | "female" | "">(
    profile?.gender || "",
  );
  const [phone, setPhone] = useState(profile?.phone || "");
  const [rollNumber, setRollNumber] = useState(profile?.roll_number || "");
  const [schoolName, setSchoolName] = useState(profile?.school_name || "");
  const [className, setClassName] = useState(profile?.class_name || "");
  const [village, setVillage] = useState(profile?.village || "");

  const handleSave = async () => {
    if (!name || !gender) {
      setError("Name and gender are required");
      return;
    }

    // Validate phone number if provided
    const phoneValidation = validateOptionalPhone(phone);
    if (!phoneValidation.valid) {
      setError(phoneValidation.error || "Invalid phone number");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await saveStudentProfile({
        name,
        gender,
        phone: phone || undefined,
        rollNumber: rollNumber || undefined,
        schoolName: schoolName || undefined,
        className: className || undefined,
        village: village || undefined,
      });

      if (result.success) {
        setSuccess(true);
        setIsEditing(false);
        setTimeout(() => setSuccess(false), PROFILE_TIMING.successMessage);
      } else {
        setError(result.error || "Failed to save profile");
      }
    } catch (error) {
      clientLogger.error(
        "[StudentProfileEditor] Failed to save profile",
        error instanceof Error ? error : { error: String(error) },
      );
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setName(profile?.name || "");
    setGender(profile?.gender || "");
    setPhone(profile?.phone || "");
    setRollNumber(profile?.roll_number || "");
    setSchoolName(profile?.school_name || "");
    setClassName(profile?.class_name || "");
    setVillage(profile?.village || "");
    setIsEditing(false);
    setError(null);
  };

  if (!profile && !isEditing) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Student Profile</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-2"
            >
              <Pencil className="w-4 h-4" />
              Create Profile
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-text-secondary text-sm">
            You haven&apos;t set up your student profile yet. Click &quot;Create
            Profile&quot; to add your information.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Student Profile</span>
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={saving}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="gap-2 bg-primary hover:bg-primary-dark"
              >
                <Check className="w-4 h-4" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-2"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-error-light border border-error rounded-xl text-error-dark text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-success-light border border-success rounded-xl text-success-dark text-sm">
            Profile updated successfully!
          </div>
        )}

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="student-name"
              className="text-sm font-medium text-text-secondary"
            >
              Name *
            </label>
            {isEditing ? (
              <input
                id="student-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your name"
              />
            ) : (
              <p className="text-text-primary">{name || "Not set"}</p>
            )}
          </div>

          {/* Gender */}
          <div>
            <span
              id="gender-group"
              className="text-sm font-medium text-text-secondary"
            >
              Gender *
            </span>
            {isEditing ? (
              <div
                className="flex gap-4 mt-1"
                role="radiogroup"
                aria-labelledby="gender-group"
              >
                {(["male", "female"] as const).map((g) => (
                  <label
                    key={g}
                    htmlFor={`gender-${g}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      id={`gender-${g}`}
                      type="radio"
                      name="gender"
                      value={g}
                      checked={gender === g}
                      onChange={(e) =>
                        setGender(e.target.value as "male" | "female")
                      }
                      className="text-primary focus:ring-primary"
                    />
                    <span className="capitalize">{g}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-text-primary capitalize">
                {gender || "Not set"}
              </p>
            )}
          </div>

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
              <p className="text-text-primary">{userEmail || "Not set"}</p>
            </div>
          )}

          {/* Phone */}
          <div>
            <label
              htmlFor="student-phone"
              className="text-sm font-medium text-text-secondary"
            >
              Phone
            </label>
            {isEditing ? (
              <>
                <input
                  id="student-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(sanitizeProfilePhone(e.target.value))
                  }
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  aria-describedby="student-phone-helper"
                />
                <p
                  id="student-phone-helper"
                  className="text-xs text-text-secondary mt-1"
                >
                  Enter 10-digit Indian mobile number
                </p>
                {Boolean((phone?.length ?? 0) > 0 && (phone?.length ?? 0) < 10) && (
                  <p className="text-xs text-warning">
                    {10 - phone.length} more digits needed
                  </p>
                )}
              </>
            ) : (
              <p className="text-text-primary">{phone || "Not set"}</p>
            )}
          </div>

          {/* Roll Number */}
          <div>
            <label
              htmlFor="student-rollnumber"
              className="text-sm font-medium text-text-secondary"
            >
              Roll Number
            </label>
            {isEditing ? (
              <input
                id="student-rollnumber"
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., 101, ST2024001"
              />
            ) : (
              <p className="text-text-primary">{rollNumber || "Not set"}</p>
            )}
          </div>

          {/* School Name */}
          <div>
            <label
              htmlFor="student-schoolname"
              className="text-sm font-medium text-text-secondary"
            >
              School Name
            </label>
            {isEditing ? (
              <input
                id="student-schoolname"
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your school name"
              />
            ) : (
              <p className="text-text-primary">{schoolName || "Not set"}</p>
            )}
          </div>

          {/* Class Name */}
          <div>
            <label
              htmlFor="student-class"
              className="text-sm font-medium text-text-secondary"
            >
              Class
            </label>
            {isEditing ? (
              <input
                id="student-class"
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your class"
              />
            ) : (
              <p className="text-text-primary">{className || "Not set"}</p>
            )}
          </div>

          {/* Village */}
          <div>
            <label
              htmlFor="student-village"
              className="text-sm font-medium text-text-secondary"
            >
              Village/Location
            </label>
            {isEditing ? (
              <input
                id="student-village"
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your village or location"
              />
            ) : (
              <p className="text-text-primary">{village || "Not set"}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
