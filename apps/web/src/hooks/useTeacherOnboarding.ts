"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase-browser";
// PERF-011 FIX: Removed static zxcvbn import (700KB+)
// Now dynamically imported only when password strength check is needed
import {
  sendEmailOtp,
  verifyEmailOtp,
  setPassword as setUserPassword,
  saveTeacherProfile,
} from "@/app/actions/teacher-onboard";
import {
  sendForgotPasswordOtp,
  resetPasswordWithOtp,
} from "@/app/actions/auth";
import { verifyTeacher } from "@/app/actions/school";
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateOptionalPhone,
} from "@/lib/validation-utils";
import { authLogger } from "@/lib/auth-logger";
import type { Gender } from "@/hooks/useAuthState";

type Step =
  | "choice"
  | "login"
  | "forgot-password"
  | "reset-password"
  | "auth"
  | "set-password"
  | "verify-school"
  | "profile"
  | "complete";

/**
 * Unified state interface for teacher onboarding flow
 * Groups all form inputs by feature/step
 */
export interface TeacherOnboardingState {
  // Flow state
  step: Step;
  loading: boolean;
  signupMethod: "email" | "phone";
  authChecked: boolean;

  // Login flow
  loginEmail: string;
  loginPassword: string;
  loginError: string;

  // Forgot password flow
  forgotEmail: string;
  forgotOtp: string;
  forgotOtpSent: boolean;
  forgotNewPassword: string;
  forgotConfirmPassword: string;

  // Email OTP signup
  email: string;
  emailError: string;
  emailSuggestion: string;
  otp: string;
  otpSent: boolean;

  // Phone OTP signup
  phoneNumber: string;
  phoneError: string;
  phoneOtp: string;
  phoneOtpSent: boolean;

  // Password creation
  password: string;
  passwordConfirm: string;
  passwordStrength: number;

  // School verification
  schoolCode: string;
  staffPin: string;
  verifiedSchoolName: string;
  verifiedSchoolId: string;

  // Teacher profile
  teacherName: string;
  teacherGender: Gender;
  phone: string;
  village: string;
}

/**
 * Initial state constant for teacher onboarding
 * Eliminates 49-line duplication between useState and resetAll
 */
export const INITIAL_TEACHER_ONBOARDING_STATE: TeacherOnboardingState = {
  // Flow state
  step: "choice",
  loading: false,
  signupMethod: "email",
  authChecked: false,

  // Login
  loginEmail: "",
  loginPassword: "",
  loginError: "",

  // Forgot password
  forgotEmail: "",
  forgotOtp: "",
  forgotOtpSent: false,
  forgotNewPassword: "",
  forgotConfirmPassword: "",

  // Email OTP signup
  email: "",
  emailError: "",
  emailSuggestion: "",
  otp: "",
  otpSent: false,

  // Phone OTP signup
  phoneNumber: "",
  phoneError: "",
  phoneOtp: "",
  phoneOtpSent: false,

  // Password
  password: "",
  passwordConfirm: "",
  passwordStrength: 0,

  // School verification
  schoolCode: "",
  staffPin: "",
  verifiedSchoolName: "",
  verifiedSchoolId: "",

  // Profile
  teacherName: "",
  teacherGender: "",
  phone: "",
  village: "",
};

/**
 * Unified actions interface for all state mutations
 * Organized by feature/step
 */
export interface TeacherOnboardingActions {
  // Flow control
  setStep: (step: Step) => void;
  setLoading: (loading: boolean) => void;
  setSignupMethod: (method: "email" | "phone") => void;
  setAuthChecked: (checked: boolean) => void;

  // Login flow
  setLoginEmail: (email: string) => void;
  setLoginPassword: (password: string) => void;
  setLoginError: (error: string) => void;

  // Forgot password flow
  setForgotEmail: (email: string) => void;
  setForgotOtp: (otp: string) => void;
  setForgotOtpSent: (sent: boolean) => void;
  setForgotNewPassword: (password: string) => void;
  setForgotConfirmPassword: (password: string) => void;

  // Email OTP signup
  setEmail: (email: string) => void;
  setEmailError: (error: string) => void;
  setEmailSuggestion: (suggestion: string) => void;
  setOtp: (otp: string) => void;
  setOtpSent: (sent: boolean) => void;

  // Phone OTP signup
  setPhoneNumber: (number: string) => void;
  setPhoneError: (error: string) => void;
  setPhoneOtp: (otp: string) => void;
  setPhoneOtpSent: (sent: boolean) => void;

  // Password creation
  setPassword: (password: string) => void;
  setPasswordConfirm: (password: string) => void;
  setPasswordStrength: (strength: number) => void;

  // School verification
  setSchoolCode: (code: string) => void;
  setStaffPin: (pin: string) => void;
  setVerifiedSchoolName: (name: string) => void;
  setVerifiedSchoolId: (id: string) => void;

  // Teacher profile
  setTeacherName: (name: string) => void;
  setTeacherGender: (gender: "male" | "female" | "") => void;
  setPhone: (phone: string) => void;
  setVillage: (village: string) => void;

  // Handlers
  handleTeacherLogin: (e: React.FormEvent) => Promise<void>;
  handleForgotPasswordOtp: (e: React.FormEvent) => Promise<void>;
  handleResetPassword: (e: React.FormEvent) => Promise<void>;
  handleSendOTP: (e: React.FormEvent) => Promise<void>;
  handleVerifyOTP: (e: React.FormEvent) => Promise<void>;
  handleSetPassword: (e: React.FormEvent) => Promise<void>;
  handlePasswordChange: (password: string) => void;
  handleSchoolVerification: (e: React.FormEvent) => Promise<void>;
  handleProfileSubmit: (e: React.FormEvent) => Promise<void>;

  // Utility
  resetForgotPassword: () => void;
  resetSignupEmail: () => void;
  resetAll: () => void;
}

/**
 * Custom hook for managing complete teacher onboarding flow
 * Consolidates 32+ state variables and 10+ handlers into unified interface
 * Reduces TeacherStartPage cognitive complexity from 23 to <12
 *
 * @returns Object with state and actions
 *
 * @example
 * ```typescript
 * export default function TeacherStartPage() {
 *   const { state, actions } = useTeacherOnboarding()
 *
 *   if (state.step === 'choice') {
 *     return <ChoiceStep actions={actions} />
 *   }
 *   // ... render other steps
 * }
 * ```
 */
export function useTeacherOnboarding() {
  const router = useRouter();
  const supabase = createClient();
  // BUG-011 FIX: Track navigation timer for cleanup on unmount
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // BUG-011 FIX: Cleanup navigation timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    };
  }, []);

  // UNIFIED STATE OBJECT - All form inputs grouped logically
  // Uses extracted constant to eliminate duplication with resetAll
  const [state, setState] = useState<TeacherOnboardingState>(
    INITIAL_TEACHER_ONBOARDING_STATE,
  );

  // Helper to update state (immutable pattern)
  const updateState = useCallback(
    (updates: Partial<TeacherOnboardingState>) => {
      setState((prev) => ({ ...prev, ...updates }));
    },
    [],
  );

  // FLOW CONTROL ACTIONS
  const setStep = useCallback(
    (step: Step) => updateState({ step }),
    [updateState],
  );
  const setLoading = useCallback(
    (loading: boolean) => updateState({ loading }),
    [updateState],
  );
  const setSignupMethod = useCallback(
    (method: "email" | "phone") => updateState({ signupMethod: method }),
    [updateState],
  );
  const setAuthChecked = useCallback(
    (checked: boolean) => updateState({ authChecked: checked }),
    [updateState],
  );

  // LOGIN FLOW ACTIONS
  const setLoginEmail = useCallback(
    (email: string) => updateState({ loginEmail: email }),
    [updateState],
  );
  const setLoginPassword = useCallback(
    (password: string) => updateState({ loginPassword: password }),
    [updateState],
  );
  const setLoginError = useCallback(
    (error: string) => updateState({ loginError: error }),
    [updateState],
  );

  // FORGOT PASSWORD FLOW ACTIONS
  const setForgotEmail = useCallback(
    (email: string) => updateState({ forgotEmail: email }),
    [updateState],
  );
  const setForgotOtp = useCallback(
    (otp: string) => updateState({ forgotOtp: otp }),
    [updateState],
  );
  const setForgotOtpSent = useCallback(
    (sent: boolean) => updateState({ forgotOtpSent: sent }),
    [updateState],
  );
  const setForgotNewPassword = useCallback(
    (password: string) => updateState({ forgotNewPassword: password }),
    [updateState],
  );
  const setForgotConfirmPassword = useCallback(
    (password: string) => updateState({ forgotConfirmPassword: password }),
    [updateState],
  );

  // EMAIL OTP SIGNUP ACTIONS
  const setEmail = useCallback(
    (email: string) => updateState({ email }),
    [updateState],
  );
  const setEmailError = useCallback(
    (error: string) => updateState({ emailError: error }),
    [updateState],
  );
  const setEmailSuggestion = useCallback(
    (suggestion: string) => updateState({ emailSuggestion: suggestion }),
    [updateState],
  );
  const setOtp = useCallback(
    (otp: string) => updateState({ otp }),
    [updateState],
  );
  const setOtpSent = useCallback(
    (sent: boolean) => updateState({ otpSent: sent }),
    [updateState],
  );

  // PHONE OTP SIGNUP ACTIONS
  const setPhoneNumber = useCallback(
    (number: string) => updateState({ phoneNumber: number }),
    [updateState],
  );
  const setPhoneError = useCallback(
    (error: string) => updateState({ phoneError: error }),
    [updateState],
  );
  const setPhoneOtp = useCallback(
    (otp: string) => updateState({ phoneOtp: otp }),
    [updateState],
  );
  const setPhoneOtpSent = useCallback(
    (sent: boolean) => updateState({ phoneOtpSent: sent }),
    [updateState],
  );

  // PASSWORD CREATION ACTIONS
  const setPassword = useCallback(
    (password: string) => updateState({ password }),
    [updateState],
  );
  const setPasswordConfirm = useCallback(
    (password: string) => updateState({ passwordConfirm: password }),
    [updateState],
  );
  const setPasswordStrength = useCallback(
    (strength: number) => updateState({ passwordStrength: strength }),
    [updateState],
  );

  // SCHOOL VERIFICATION ACTIONS
  const setSchoolCode = useCallback(
    (code: string) => updateState({ schoolCode: code }),
    [updateState],
  );
  const setStaffPin = useCallback(
    (pin: string) => updateState({ staffPin: pin }),
    [updateState],
  );
  const setVerifiedSchoolName = useCallback(
    (name: string) => updateState({ verifiedSchoolName: name }),
    [updateState],
  );
  const setVerifiedSchoolId = useCallback(
    (id: string) => updateState({ verifiedSchoolId: id }),
    [updateState],
  );

  // PROFILE ACTIONS
  const setTeacherName = useCallback(
    (name: string) => updateState({ teacherName: name }),
    [updateState],
  );
  const setTeacherGender = useCallback(
    (gender: "male" | "female" | "") => updateState({ teacherGender: gender }),
    [updateState],
  );
  const setPhone = useCallback(
    (phone: string) => updateState({ phone }),
    [updateState],
  );
  const setVillage = useCallback(
    (village: string) => updateState({ village }),
    [updateState],
  );

  // AUTHENTICATION CHECK - Runs on component mount (when step is 'choice')
  useEffect(() => {
    if (state.authChecked || state.step !== "choice") return;

    async function checkAuth() {
      setAuthChecked(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          const { data: profile, error: profileError } = await supabase
            .from("teacher_profiles")
            .select("*")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (profileError) {
            authLogger.error("[Teacher Auth Check] Profile fetch error", profileError);
          }

          if (profile) {
            // Already registered, redirect
            toast.success("You are already registered!");
            router.push("/app/teacher/classes");
          } else {
            // Has session but no profile - sign them out
            await supabase.auth.signOut();
          }
        }
      } catch (error) {
        authLogger.error(
          "[Teacher Auth Check] Exception",
          error instanceof Error ? error : { error },
        );
      }
    }

    checkAuth();
  }, [state.authChecked, state.step, supabase, router]); // eslint-disable-line react-hooks/exhaustive-deps
  // setAuthChecked omitted - it's stable via useCallback

  /**
   * Helper: Map login error to user-friendly message
   */
  const mapLoginError = (error: { message?: string }): string => {
    if (error.message?.includes("Invalid login credentials")) {
      return "Invalid email or password. Please check your credentials and try again.";
    }
    return error.message || "Invalid email or password";
  };

  /**
   * Helper: Verify teacher profile exists after successful login
   */
  const verifyTeacherProfile = useCallback(
    async (userId: string) => {
      try {
        const { data: profile, error: profileError } = await supabase
          .from("teacher_profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (profileError) {
          authLogger.error("[Teacher Login] Profile fetch error", profileError);
          return { success: false, error: profileError.message };
        }

        return { success: true, profile };
      } catch (error) {
        authLogger.error("[Teacher Login] Exception checking profile", error);
        return { success: false, error: "Error checking profile" };
      }
    },
    [supabase],
  );

  /**
   * Helper: Check if account is student profile
   */
  const checkStudentProfile = useCallback(
    async (userId: string) => {
      const { data: studentProfile, error } = await supabase
        .from("student_profiles")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        authLogger.error("[Teacher Onboarding] Student profile check error", error);
        return false;
      }

      return Boolean(studentProfile);
    },
    [supabase],
  );

  /**
   * Helper: Handle post-login profile verification
   */
  const handleProfileVerification = useCallback(
    async (userId: string) => {
      const profileResult = await verifyTeacherProfile(userId);

      if (!profileResult.success) {
        toast.error("Error checking profile: " + profileResult.error);
        await supabase.auth.signOut();
        setLoginError("Error checking profile");
        return;
      }

      if (profileResult.profile) {
        authLogger.success("[Teacher Login] Profile found, redirecting");
        toast.success("Login successful!");
        router.push("/app/teacher/classes");
        return;
      }

      // No teacher profile - check if student account
      const isStudent = await checkStudentProfile(userId);

      if (isStudent) {
        authLogger.error("[Teacher Login] This is a student account");
        const msg =
          "This email is registered as a student account. Please use the student login page.";
        setLoginError(msg);
        toast.error("This is a student account. Please use the student login page.");
      } else {
        authLogger.error(
          "[Teacher Login] Profile not found - incomplete registration",
        );
        const msg =
          "No teacher profile found. Please complete your registration first.";
        setLoginError(msg);
        toast.error("No teacher profile found. Please complete registration.");
      }

      await supabase.auth.signOut();
    },
    [verifyTeacherProfile, checkStudentProfile, supabase, router, setLoginError],
  );

  // HANDLER: Email/Password Login
  const handleTeacherLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError("");
      setLoading(true);

      try {
        authLogger.debug("[Teacher Login] Attempting login");

        const { data, error } = await supabase.auth.signInWithPassword({
          email: state.loginEmail.trim(),
          password: state.loginPassword,
        });

        if (error) {
          authLogger.error("[Teacher Login] Authentication failed", error);
          const errorMsg = mapLoginError(error);
          setLoginError(errorMsg);
          toast.error(errorMsg);
        } else if (data.user) {
          authLogger.debug("[Teacher Login] User authenticated");
          await handleProfileVerification(data.user.id);
        }
      } catch (error) {
        authLogger.error("[Teacher Login] Unexpected error", error);
        setLoginError("An unexpected error occurred");
        toast.error("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.loginEmail, state.loginPassword, supabase, router, handleProfileVerification],
    // setLoginError and setLoading are stable via updateState callback
  );

  // HANDLER: Send Forgot Password OTP
  const handleForgotPasswordOtp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        const result = await sendForgotPasswordOtp(state.forgotEmail);

        if (result.success) {
          toast.success("Recovery code sent to your email!");
          setForgotOtpSent(true);
        } else {
          toast.error(result.error || "Failed to send recovery code");
        }
      } catch (error) {
        authLogger.error("[Teacher Forgot Password] Error sending OTP", error);
        toast.error("Failed to send recovery code");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.forgotEmail],
    // setLoading and setForgotOtpSent are stable via updateState callback
  );

  // HANDLER: Reset Password with OTP
  const handleResetPassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const passwordValidation = validatePassword(state.forgotNewPassword);
      if (!passwordValidation.valid) {
        toast.error(passwordValidation.errors.join(", ") || "Invalid password");
        return;
      }

      const matchValidation = validatePasswordMatch(
        state.forgotNewPassword,
        state.forgotConfirmPassword,
      );
      if (!matchValidation.valid) {
        toast.error(matchValidation.error || "Passwords do not match");
        return;
      }

      setLoading(true);

      try {
        const result = await resetPasswordWithOtp(
          state.forgotEmail,
          state.forgotOtp,
          state.forgotNewPassword,
        );

        if (result.success) {
          toast.success("Password reset successfully! ✓");
          // Reset form and go back to login
          resetForgotPassword();
          setStep("login");
          setLoginEmail(state.forgotEmail);
        } else {
          toast.error(result.error || "Failed to reset password");
        }
      } catch (error) {
        authLogger.error("[Teacher Reset Password] Error", error);
        toast.error("Failed to reset password");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      state.forgotNewPassword,
      state.forgotConfirmPassword,
      state.forgotEmail,
      state.forgotOtp,
    ],
    // Setters (resetForgotPassword, setLoading, setLoginEmail, setStep) are stable via updateState callback
  );

  // HANDLER: Send Email OTP
  const handleSendOTP = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setEmailError("");
      setEmailSuggestion("");

      try {
        const emailValidation = validateEmail(state.email);

        if (!emailValidation.valid) {
          if (emailValidation.suggestion) {
            setEmailError(emailValidation.error || "Invalid email");
            setEmailSuggestion(emailValidation.suggestion);
            toast.error(emailValidation.error || "Invalid email");
          } else {
            setEmailError(emailValidation.error || "Invalid email");
            toast.error(emailValidation.error || "Invalid email");
          }
          setLoading(false);
          return;
        }

        const result = await sendEmailOtp(state.email);

        if (result.success) {
          toast.success("OTP sent to your email!");
          setOtpSent(true);
        } else if (result.exists) {
          toast.error(result.error || "This email is already registered");
          authLogger.debug(
            "[Teacher Signup] Email already exists, redirecting to login",
          );
          setLoginEmail(state.email);
          resetSignupEmail();
          setStep("login");
        } else {
          setEmailError(result.error || "Failed to send OTP");
          toast.error(result.error || "Failed to send OTP");
        }
      } catch (error) {
        authLogger.error("[Teacher Signup] Failed to send OTP", error);
        setEmailError("An unexpected error occurred");
        toast.error("Failed to send OTP");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.email],
    // Multiple setters are stable via updateState callback
  );

  // HANDLER: Verify Email OTP
  const handleVerifyOTP = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        const result = await verifyEmailOtp({
          email: state.email,
          token: state.otp,
        });

        if (result.success) {
          toast.success("Email verified! ✓");
          setStep("set-password");
        } else {
          toast.error(result.error || "Failed to verify OTP");
        }
      } catch (error) {
        authLogger.error("[Teacher Verify OTP] Error", error);
        toast.error("Failed to verify OTP");
      } finally {
        setLoading(false);
      }
    },
    [state.email, state.otp], // eslint-disable-line react-hooks/exhaustive-deps
    // setLoading and setStep omitted - they're stable via useCallback
  );

  // HANDLER: Set Password
  const handleSetPassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        const passwordValidation = validatePassword(state.password);
        if (!passwordValidation.valid) {
          toast.error(
            passwordValidation.errors.join(", ") || "Invalid password",
          );
          setLoading(false);
          return;
        }

        const matchValidation = validatePasswordMatch(
          state.password,
          state.passwordConfirm,
        );
        if (!matchValidation.valid) {
          toast.error(matchValidation.error || "Passwords do not match");
          setLoading(false);
          return;
        }

        const result = await setUserPassword(state.password);

        if (result.success) {
          toast.success("Password set successfully! ✓");
          setStep("verify-school");
        } else {
          toast.error(result.error || "Failed to set password");
        }
      } catch (error) {
        authLogger.error("[Teacher Set Password] Error", error);
        toast.error("Failed to set password");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.password, state.passwordConfirm],
    // setLoading and setStep are stable via updateState callback
  );

  // HANDLER: Password Change (updates strength)
  // PERF-011 FIX: Dynamic import of zxcvbn to reduce bundle size by ~700KB
  // zxcvbn is only loaded when user starts typing a password
  const handlePasswordChange = useCallback((password: string) => {
    setPassword(password);
    if (password.length > 0) {
      // Dynamic import - only loads zxcvbn when needed
      import("zxcvbn")
        .then((module) => {
          const zxcvbn = module.default;
          const result = zxcvbn(password);
          setPasswordStrength(result.score);
        })
        .catch(() => {
          setPasswordStrength(0);
        });
    } else {
      setPasswordStrength(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // HANDLER: School Verification
  const handleSchoolVerification = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        const result = await verifyTeacher({
          schoolCode: state.schoolCode.toUpperCase().trim(),
          staffPin: state.staffPin.trim(),
          teacherName: "",
          phone: "",
        });

        if (result.success && result.schoolId && result.schoolName) {
          setVerifiedSchoolName(result.schoolName);
          setVerifiedSchoolId(result.schoolId);
          toast.success(`School verified: ${result.schoolName}`);
          setStep("profile");
        } else {
          toast.error(result.error || "Verification failed");
        }
      } catch (error) {
        authLogger.error("[Teacher School Verification] Error", error);
        toast.error("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.schoolCode, state.staffPin],
    // setLoading and setStep are stable via updateState callback
  );

  // HANDLER: Profile Submit
  const handleProfileSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      if (!state.teacherGender) {
        toast.error("Please select your gender");
        setLoading(false);
        return;
      }

      const phoneValidation = validateOptionalPhone(state.phone);
      if (!phoneValidation.valid) {
        toast.error(phoneValidation.error || "Invalid phone number");
        setLoading(false);
        return;
      }

      try {
        const result = await saveTeacherProfile({
          name: state.teacherName.trim(),
          gender: state.teacherGender, // Type narrowed by validation check above
          phone: state.phone.trim() || undefined,
          village: state.village.trim() || undefined,
          schoolId: state.verifiedSchoolId,
          schoolCode: state.schoolCode.toUpperCase().trim(),
        });

        if (result.success) {
          toast.success("Teacher registration complete! 🎉");
          setStep("complete");

          try {
            const { error: refreshError } =
              await supabase.auth.refreshSession();
            if (refreshError) {
              authLogger.warn(
                "[Teacher Registration] Session refresh failed",
                refreshError,
              );
            }
          } catch (refreshError_) {
            authLogger.warn(
              "[Teacher Registration] Session refresh exception",
              refreshError_ instanceof Error ? refreshError_ : { error: refreshError_ },
            );
          }

          // BUG-011 FIX: Store timer ref for cleanup on unmount
          if (navTimerRef.current) clearTimeout(navTimerRef.current);
          navTimerRef.current = setTimeout(() => {
            router.push("/app/teacher/classes");
          }, 1500);
        } else {
          toast.error(result.error || "Profile creation failed");
        }
      } catch (error) {
        authLogger.error("[Teacher Profile Submit] Error", error);
        toast.error("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      state.teacherGender,
      state.phone,
      state.teacherName,
      state.village,
      state.verifiedSchoolId,
      state.schoolCode,
      supabase,
      router,
    ],
    // setLoading and setStep are stable via updateState callback
  );

  // UTILITY: Reset forgot password flow
  const resetForgotPassword = useCallback(() => {
    updateState({
      forgotEmail: "",
      forgotOtp: "",
      forgotOtpSent: false,
      forgotNewPassword: "",
      forgotConfirmPassword: "",
    });
  }, [updateState]);

  // UTILITY: Reset email signup flow
  const resetSignupEmail = useCallback(() => {
    updateState({
      email: "",
      emailError: "",
      emailSuggestion: "",
      otp: "",
      otpSent: false,
    });
  }, [updateState]);

  // UTILITY: Reset all state
  // Uses extracted constant to reduce duplication
  const resetAll = useCallback(() => {
    setState(INITIAL_TEACHER_ONBOARDING_STATE);
  }, []);

  // Build unified actions object
  const actions: TeacherOnboardingActions = {
    setStep,
    setLoading,
    setSignupMethod,
    setAuthChecked,
    setLoginEmail,
    setLoginPassword,
    setLoginError,
    setForgotEmail,
    setForgotOtp,
    setForgotOtpSent,
    setForgotNewPassword,
    setForgotConfirmPassword,
    setEmail,
    setEmailError,
    setEmailSuggestion,
    setOtp,
    setOtpSent,
    setPhoneNumber,
    setPhoneError,
    setPhoneOtp,
    setPhoneOtpSent,
    setPassword,
    setPasswordConfirm,
    setPasswordStrength,
    setSchoolCode,
    setStaffPin,
    setVerifiedSchoolName,
    setVerifiedSchoolId,
    setTeacherName,
    setTeacherGender,
    setPhone,
    setVillage,
    handleTeacherLogin,
    handleForgotPasswordOtp,
    handleResetPassword,
    handleSendOTP,
    handleVerifyOTP,
    handleSetPassword,
    handlePasswordChange,
    handleSchoolVerification,
    handleProfileSubmit,
    resetForgotPassword,
    resetSignupEmail,
    resetAll,
  };

  return {
    state,
    actions,
  };
}
