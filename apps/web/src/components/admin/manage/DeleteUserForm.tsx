/**
 * DeleteUserForm Component
 * Displays form for deleting a user account
 */

import { AlertCircle, CheckCircle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteUserFormProps {
  readonly email: string;
  readonly isLoading: boolean;
  readonly message: {
    readonly type: "success" | "error";
    readonly text: string;
  } | null;
  readonly onEmailChange: (email: string) => void;
  // SEC-002 FIX: Updated to accept sync function (opens confirmation dialog)
  readonly onDelete: () => void;
}

export function DeleteUserForm({
  email,
  isLoading,
  message,
  onEmailChange,
  onDelete,
}: DeleteUserFormProps) {
  return (
    <>
      {/* Warning Box */}
      <div className="bg-error-light border border-error/30 rounded-lg p-4">
        <p className="text-sm text-error">
          <strong>⚠️ Warning:</strong>
          <br />
          <span className="text-xs">
            Deleting a user is permanent and cannot be undone. Make sure
            you want to delete this account.
          </span>
        </p>
      </div>

      {/* Email Input */}
      <div className="space-y-2">
        <Label htmlFor="delete-email" className="text-sm font-semibold">
          Email to Delete
        </Label>
        <Input
          id="delete-email"
          type="email"
          placeholder="atal.app.ai@gmail.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={isLoading}
          className="focus:ring-primary focus:border-primary"
        />
        <p className="text-xs text-text-secondary">
          Enter the email of the user account to delete
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`flex gap-3 p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-success-light border-success/30"
              : "bg-error-light border-error/30"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
          )}
          <span
            className={
              message.type === "success" ? "text-success" : "text-error"
            }
          >
            {message.text}
          </span>
        </div>
      )}

      {/* Delete Button */}
      <Button
        onClick={onDelete}
        disabled={isLoading || !email.trim()}
        className="w-full bg-error hover:bg-error/90"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Deleting...
          </>
        ) : (
          <>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete User
          </>
        )}
      </Button>
    </>
  );
}
