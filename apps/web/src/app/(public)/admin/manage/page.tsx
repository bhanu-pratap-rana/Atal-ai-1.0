"use client";
export const dynamic = "force-dynamic";

import { useAdminManagement } from "@/hooks/useAdminManagement";
import { AdminLoadingState } from "@/components/admin/manage/AdminLoadingState";
import { AdminUnauthorizedState } from "@/components/admin/manage/AdminUnauthorizedState";
import { StepIndicator } from "@/components/admin/manage/StepIndicator";
import { DeleteUserForm } from "@/components/admin/manage/DeleteUserForm";
import { CreateAdminForm } from "@/components/admin/manage/CreateAdminForm";
import { DialogContainer } from "@/components/ui/DialogContainer";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth/AuthCard";

export default function AdminManagePage() {
  const {
    authStatus,
    step,
    showPassword,
    isLoading,
    completed,
    email,
    password,
    confirmPassword,
    message,
    pendingDeletion, // SEC-002: State for confirmation dialog
    setStep,
    setEmail,
    setPassword,
    setConfirmPassword,
    setShowPassword,
    requestDeleteUser, // SEC-002: Opens confirmation dialog
    confirmDeleteUser, // SEC-002: Executes deletion
    cancelDeleteUser, // SEC-002: Cancels deletion
    handleCreateAdmin,
  } = useAdminManagement();

  // Show loading while checking auth status
  if (authStatus === "checking") {
    return <AdminLoadingState />;
  }

  // Show access denied if not super admin
  if (authStatus === "unauthorized") {
    return <AdminUnauthorizedState />;
  }

  const redirectToLogin = () => {
    globalThis.location.href = "/admin/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <Button
          onClick={redirectToLogin}
          variant="outline"
          size="sm"
          className="text-sm border-primary text-primary hover:bg-primary/10"
        >
          ← Back
        </Button>
      </div>

      <AuthCard
        title="Admin Account Management"
        description="Delete existing admin and create a fresh account"
      >
        <div className="space-y-6">
          {/* Step Indicator */}
          <StepIndicator
            currentStep={step}
            completed={completed}
            onStepChange={setStep}
          />

          {/* STEP 1: DELETE USER */}
          {step === "delete" && (
            <DeleteUserForm
              email={email}
              isLoading={isLoading}
              message={message}
              onEmailChange={setEmail}
              onDelete={requestDeleteUser}
            />
          )}

          {/* SEC-002 FIX: Accessible confirmation dialog for destructive actions */}
          <DialogContainer
            open={pendingDeletion}
            title="Confirm User Deletion"
            onClose={cancelDeleteUser}
            size="sm"
          >
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                Are you sure you want to <strong className="text-error">permanently delete</strong> the user:
              </p>
              <p className="text-lg font-semibold text-text-primary break-all bg-surface p-2 rounded">
                {email}
              </p>
              <p className="text-xs text-error">
                ⚠️ This action cannot be undone. All user data will be permanently removed.
              </p>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={cancelDeleteUser}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-error hover:bg-error/90"
                  onClick={confirmDeleteUser}
                >
                  Delete User
                </Button>
              </div>
            </div>
          </DialogContainer>

          {/* STEP 2: CREATE USER */}
          {step === "create" && (
            <CreateAdminForm
              email={email}
              password={password}
              confirmPassword={confirmPassword}
              showPassword={showPassword}
              isLoading={isLoading}
              completed={completed}
              message={message}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onShowPasswordChange={setShowPassword}
              onCreate={handleCreateAdmin}
              onNavigateToLogin={redirectToLogin}
            />
          )}

          {/* Instructions Box */}
          <div className="bg-cyan-lightest border border-cyan/30 rounded-lg p-4">
            <p className="text-sm text-cyan-darkest font-semibold mb-2">
              📋 How It Works:
            </p>
            <ol className="text-xs text-cyan-dark space-y-1 list-decimal list-inside">
              <li>Delete the old admin user account</li>
              <li>Create a new admin account with email and password</li>
              <li>Go to /admin/login and login with your new credentials</li>
              <li>Access the admin panel</li>
            </ol>
          </div>
        </div>
      </AuthCard>
    </div>
  );
}
