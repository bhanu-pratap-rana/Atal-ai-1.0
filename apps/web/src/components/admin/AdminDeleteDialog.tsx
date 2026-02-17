"use client";

import { useCallback, useState } from "react";
import { deleteAdminAccount } from "@/app/actions/admin-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, X } from "lucide-react";
import { FormMessage } from "@/components/ui/FormMessage";
import { toast } from "sonner";
import { FORM_TIMING } from "@/lib/constants/ui-timings";
import { clientLogger } from "@/lib/client-logger";

interface AdminDeleteDialogProps {
  readonly adminId: string;
  readonly adminEmail: string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

/**
 * Get delete button content based on loading state
 */
function getDeleteButtonContent(isLoading: boolean): React.ReactNode {
  if (isLoading) {
    return (
      <>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Deleting...
      </>
    );
  }
  return "Delete Admin";
}

/**
 * AdminDeleteDialog - Modal for confirming admin account deletion
 */
export function AdminDeleteDialog({
  adminId,
  adminEmail,
  isOpen,
  onClose,
  onSuccess,
}: AdminDeleteDialogProps) {
  const [emailConfirmation, setEmailConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isConfirmed =
    emailConfirmation.toLowerCase() === adminEmail.toLowerCase();

  const handleDelete = useCallback(async () => {
    if (!isConfirmed) {
      setMessage({
        type: "error",
        text: "Please enter the email address correctly",
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const result = await deleteAdminAccount(adminId);

      if (result.success) {
        setMessage({
          type: "success",
          text: "Admin account deleted successfully",
        });
        toast.success("Admin account deleted");

        setTimeout(() => {
          setEmailConfirmation("");
          onClose();
          if (onSuccess) {
            onSuccess();
          }
        }, FORM_TIMING.successCallback);
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to delete admin account",
        });
        toast.error(result.error || "Failed to delete admin account");
      }
    } catch (error) {
      clientLogger.error(
        "[AdminDeleteDialog] Error deleting admin",
        error instanceof Error ? error : { error: String(error) },
      );
      const errorMsg =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setMessage({ type: "error", text: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [isConfirmed, adminId, onClose, onSuccess]);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setEmailConfirmation("");
      setMessage(null);
      onClose();
    }
  }, [isLoading, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text">Delete Admin Account</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-text-secondary hover:text-text disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning */}
        <div className="bg-error-light border border-error/30 rounded-lg p-4 mb-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            <p className="text-sm text-error">
              <strong>This action cannot be undone.</strong> All access for this
              admin will be permanently removed.
            </p>
          </div>
        </div>

        {/* Email Confirmation */}
        <div className="space-y-3 mb-4">
          <p className="text-sm text-text-secondary">
            To confirm deletion, please enter the admin email address:
          </p>
          <p className="font-mono text-sm bg-surface p-2 rounded border border-border">
            {adminEmail}
          </p>

          <div className="space-y-2">
            <Label htmlFor="email-confirm" className="text-sm font-semibold">
              Confirm Email
            </Label>
            <Input
              id="email-confirm"
              type="text"
              placeholder="Enter email to confirm"
              value={emailConfirmation}
              onChange={(e) => setEmailConfirmation(e.target.value)}
              disabled={isLoading}
              className="focus:ring-error focus:border-error"
            />
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className="mb-4">
            <FormMessage
              type={message.type === "success" ? "success" : "error"}
              text={message.text}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleClose}
            disabled={isLoading}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isLoading || !isConfirmed}
            className="flex-1 bg-error hover:bg-error/90"
          >
            {getDeleteButtonContent(isLoading)}
          </Button>
        </div>
      </div>
    </div>
  );
}
