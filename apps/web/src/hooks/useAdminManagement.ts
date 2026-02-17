"use client";

/**
 * useAdminManagement Custom Hook
 * Extracted from admin/manage/page.tsx to manage admin account management state and handlers
 * Handles user deletion and admin account creation with auth checking
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { deleteUserByEmail } from "@/app/actions/admin-delete";
import { createAdminUser } from "@/app/actions/admin-auth";
import { createClient } from "@/lib/supabase-browser";
import { toast } from "sonner";
import { clientLogger } from "@/lib/client-logger";
import { FORM_TIMING } from "@/lib/constants/ui-timings";

type Step = "delete" | "create";
type AuthStatus = "checking" | "authorized" | "unauthorized";

export interface UseAdminManagementReturn {
  // Auth & UI State
  authStatus: AuthStatus;
  step: Step;
  showPassword: boolean;
  isLoading: boolean;
  completed: boolean;
  currentUserEmail: string | null;

  // SEC-002 FIX: State-based confirmation for accessible modals
  pendingDeletion: boolean;

  // Form State
  email: string;
  password: string;
  confirmPassword: string;
  message: {
    type: "success" | "error";
    text: string;
  } | null;

  // State Setters
  setStep: (step: Step) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setConfirmPassword: (password: string) => void;
  setShowPassword: (show: boolean) => void;
  setCompleted: (completed: boolean) => void;

  // Handlers
  requestDeleteUser: () => void; // SEC-002: Opens confirmation dialog
  confirmDeleteUser: () => Promise<void>; // SEC-002: Executes deletion after confirmation
  cancelDeleteUser: () => void; // SEC-002: Cancels deletion
  handleCreateAdmin: () => Promise<void>;
}

/**
 * Validate email for deletion
 * SEC-005: Also checks for self-deletion attempts
 */
function validateEmailForDeletion(
  emailValue: string,
  currentUserEmail: string | null,
): { valid: true } | { valid: false; error: string } {
  if (!emailValue.trim()) {
    return { valid: false, error: "Please enter an email address" };
  }
  // SEC-005 FIX: Prevent self-deletion
  if (currentUserEmail && emailValue.trim().toLowerCase() === currentUserEmail.toLowerCase()) {
    return { valid: false, error: "You cannot delete your own account" };
  }
  return { valid: true };
}

/**
 * Validate admin creation form
 */
function validateAdminForm(
  emailValue: string,
  passwordValue: string,
  confirmPasswordValue: string,
): { valid: true } | { valid: false; error: string } {
  if (!emailValue.trim()) {
    return { valid: false, error: "Please enter an email address" };
  }
  if (!passwordValue) {
    return { valid: false, error: "Please enter a password" };
  }
  if (passwordValue.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }
  if (passwordValue !== confirmPasswordValue) {
    return { valid: false, error: "Passwords do not match" };
  }
  return { valid: true };
}

export function useAdminManagement(): UseAdminManagementReturn {
  // BUG-011 FIX: Track timers for cleanup on unmount
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auth & UI state
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [step, setStep] = useState<Step>("delete");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  // SEC-002 FIX: State-based confirmation instead of browser confirm()
  const [pendingDeletion, setPendingDeletion] = useState(false);

  // Form state
  // SEC-001 FIX: Removed hardcoded email - require explicit user input
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Check if user is super admin on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setAuthStatus("unauthorized");
          return;
        }

        // SEC-005: Store current user email for self-deletion check
        setCurrentUserEmail(user.email || null);

        const role = user.app_metadata?.role;
        if (role === "super_admin") {
          setAuthStatus("authorized");
        } else {
          setAuthStatus("unauthorized");
        }
      } catch (error) {
        clientLogger.error(
          "[useAdminManagement] Failed to check admin auth",
          error instanceof Error ? error : { error: String(error) },
        );
        setAuthStatus("unauthorized");
      }
    }
    checkAuth();
  }, []);

  // BUG-011 FIX: Cleanup timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  /**
   * Handle successful deletion
   */
  const handleDeletionSuccess = useCallback(() => {
    setMessage({
      type: "success",
      text: `✓ User deleted! You can now create a new admin account.`,
    });
    toast.success("User deleted successfully");
    // BUG-011 FIX: Store timer ref for cleanup on unmount
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setStep("create");
      setMessage(null);
    }, FORM_TIMING.nextStepsDelay);
  }, []);

  /**
   * Handle deletion error
   */
  const handleDeletionError = useCallback((error: string) => {
    setMessage({ type: "error", text: error });
    toast.error(error);
  }, []);

  /**
   * Handle successful admin creation
   */
  const handleAdminCreationSuccess = useCallback((emailValue: string) => {
    setMessage({
      type: "success",
      text: `✓ Admin account created!\n\nEmail: ${emailValue}\n\nTip: Use a password manager to securely store your credentials. Login at /admin/login`,
    });
    toast.success(`Admin account created for ${emailValue}`);
    setCompleted(true);
    setPassword("");
    setConfirmPassword("");
  }, []);

  /**
   * Handle admin creation error
   */
  const handleAdminCreationError = useCallback((error: string) => {
    setMessage({ type: "error", text: error });
    toast.error(error);
  }, []);

  /**
   * SEC-002 FIX: Request deletion - validates and opens confirmation dialog
   * Replaces browser confirm() with accessible state-based confirmation
   */
  const requestDeleteUser = useCallback(() => {
    const emailValidation = validateEmailForDeletion(email, currentUserEmail);
    if (!emailValidation.valid) {
      setMessage({ type: "error", text: emailValidation.error });
      return;
    }
    // Open confirmation dialog (component should render accessible modal)
    setPendingDeletion(true);
    setMessage(null);
  }, [email, currentUserEmail]);

  /**
   * SEC-002 FIX: Cancel deletion - closes confirmation dialog
   */
  const cancelDeleteUser = useCallback(() => {
    setPendingDeletion(false);
  }, []);

  /**
   * SEC-002 FIX: Confirm and execute deletion
   * Only called after user confirms via accessible modal
   */
  const confirmDeleteUser = useCallback(async () => {
    setPendingDeletion(false);
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await deleteUserByEmail(email.trim().toLowerCase());
      if (result.success) {
        handleDeletionSuccess();
      } else {
        handleDeletionError(result.error || "Failed to delete user");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "An unexpected error occurred";
      handleDeletionError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [email, handleDeletionSuccess, handleDeletionError]);

  /**
   * Create admin user
   */
  const handleCreateAdmin = useCallback(async () => {
    const validation = validateAdminForm(email, password, confirmPassword);
    if (!validation.valid) {
      setMessage({ type: "error", text: validation.error });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const result = await createAdminUser(
        email.trim().toLowerCase(),
        password,
      );
      if (result.success) {
        handleAdminCreationSuccess(email);
      } else {
        handleAdminCreationError(
          result.error || "Failed to create admin account",
        );
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "An unexpected error occurred";
      handleAdminCreationError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [email, password, confirmPassword, handleAdminCreationSuccess, handleAdminCreationError]);

  return {
    // Auth & UI state
    authStatus,
    step,
    showPassword,
    isLoading,
    completed,
    currentUserEmail,

    // SEC-002 FIX: State-based confirmation
    pendingDeletion,

    // Form state
    email,
    password,
    confirmPassword,
    message,

    // State setters
    setStep,
    setEmail,
    setPassword,
    setConfirmPassword,
    setShowPassword,
    setCompleted,

    // Handlers
    requestDeleteUser,
    confirmDeleteUser,
    cancelDeleteUser,
    handleCreateAdmin,
  };
}
