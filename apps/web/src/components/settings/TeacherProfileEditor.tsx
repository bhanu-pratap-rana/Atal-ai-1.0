"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateTeacherProfile } from "@/app/actions/teacher-onboard";
import {
  validateOptionalPhone,
  sanitizeProfilePhone,
} from "@/lib/validation-utils";
import { PROFILE_TIMING } from "@/lib/constants/ui-timings";
import { clientLogger } from "@/lib/client-logger";
import { Pencil, Check, X, AlertTriangle } from "lucide-react";

/**
 * TeacherProfile interface matching teacher_profiles table schema
 * NOTE: user_id is the PRIMARY KEY (not id) - see DATABASE.md
 */
interface TeacherProfile {
  user_id: string; // PRIMARY KEY - references auth.users
  name: string;
  gender: "male" | "female" | null;
  phone?: string | null;
  subject?: string | null;
  village?: string | null;
  school_code: string;
  school_id: string;
  created_at?: string;
  updated_at?: string;
}

interface TeacherProfileEditorProps {
  readonly profile: TeacherProfile;
  readonly userEmail: string;
}

export function TeacherProfileEditor({
  profile,
  userEmail,
}: TeacherProfileEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [name, setName] = useState(profile.name || "");
  const [gender, setGender] = useState<"male" | "female" | "">(
    profile.gender || "",
  );
  const [phone, setPhone] = useState(profile.phone || "");
  const [subject, setSubject] = useState(profile.subject || "");
  const [village, setVillage] = useState(profile.village || "");

  // Check if profile is incomplete (missing required gender)
  const isProfileIncomplete = !profile.gender;

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
      const result = await updateTeacherProfile({
        name,
        gender: gender, // Type narrowed by validation check above
        phone: phone || undefined,
        subject: subject || undefined,
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
        "[TeacherProfileEditor] Failed to save profile",
        error instanceof Error ? error : { error: String(error) },
      );
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setName(profile.name || "");
    setGender(profile.gender || "");
    setPhone(profile.phone || "");
    setSubject(profile.subject || "");
    setVillage(profile.village || "");
    setIsEditing(false);
    setError(null);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Teacher Profile</span>
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
        {/* Warning for incomplete profile */}
        {isProfileIncomplete && !isEditing && (
          <div className="mb-4 p-3 bg-warning-light border border-warning rounded-xl flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-warning-dark flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-warning-dark font-medium text-sm">
                Profile Incomplete
              </p>
              <p className="text-warning-dark/80 text-xs">
                Please complete your profile by adding your gender. Click
                &quot;Edit&quot; to update.
              </p>
            </div>
          </div>
        )}

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
              htmlFor="teacher-name"
              className="text-sm font-medium text-text-secondary"
            >
              Name *
            </label>
            {isEditing ? (
              <input
                id="teacher-name"
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
              id="teacher-gender-group"
              className="text-sm font-medium text-text-secondary"
            >
              Gender *
            </span>
            {isEditing ? (
              <div
                className="flex gap-4 mt-1"
                role="radiogroup"
                aria-labelledby="teacher-gender-group"
              >
                {(["male", "female"] as const).map((g) => (
                  <label
                    key={g}
                    htmlFor={`teacher-gender-${g}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      id={`teacher-gender-${g}`}
                      type="radio"
                      name="teacher-gender"
                      value={g}
                      checked={gender === g}
                      onChange={(e) =>
                        setGender(e.target.value as "male" | "female")
                      }
                      className="text-primary focus:ring-primary"
                      aria-label={`Gender: ${g}`}
                    />
                    <span className="capitalize">{g}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p
                className={`${gender ? "text-text-primary capitalize" : "text-warning-dark"}`}
              >
                {gender || "Not set - Please update"}
              </p>
            )}
          </div>

          {/* Email (display only) */}
          <div>
            <span className="text-sm font-medium text-text-secondary">
              Email
            </span>
            <p className="text-text-primary">{userEmail || "Not set"}</p>
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="teacher-phone"
              className="text-sm font-medium text-text-secondary"
            >
              Phone
            </label>
            {isEditing ? (
              <>
                <input
                  id="teacher-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(sanitizeProfilePhone(e.target.value))
                  }
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  aria-describedby="teacher-phone-helper"
                />
                <p
                  id="teacher-phone-helper"
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

          {/* Subject */}
          <div>
            <label
              htmlFor="teacher-subject"
              className="text-sm font-medium text-text-secondary"
            >
              Subject
            </label>
            {isEditing ? (
              <input
                id="teacher-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your subject"
              />
            ) : (
              <p className="text-text-primary">{subject || "Not set"}</p>
            )}
          </div>

          {/* School Code (read-only) */}
          <div>
            <span className="text-sm font-medium text-text-secondary">
              School Code
            </span>
            <p className="text-text-primary font-mono">
              {profile.school_code || "Not set"}
            </p>
          </div>

          {/* Village */}
          <div>
            <label
              htmlFor="teacher-village"
              className="text-sm font-medium text-text-secondary"
            >
              Village/Location
            </label>
            {isEditing ? (
              <input
                id="teacher-village"
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
