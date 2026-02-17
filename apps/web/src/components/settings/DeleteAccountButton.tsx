"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { clientLogger } from "@/lib/client-logger";
import { deleteOwnAccount } from "@/app/actions/admin-delete";

interface DeleteAccountButtonProps {
  readonly userEmail: string;
}

export function DeleteAccountButton({ userEmail }: DeleteAccountButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmed = confirmText.toLowerCase() === "delete";

  async function handleDeleteAccount() {
    if (!isConfirmed) return;

    setIsDeleting(true);

    try {
      // Call server action to delete account and all associated data
      const result = await deleteOwnAccount();

      if (!result.success) {
        toast.error(result.error || "Failed to delete account. Please try again.");
        setIsDeleting(false);
        return;
      }

      // Sign out the user after successful deletion
      await supabase.auth.signOut();

      toast.success(
        "Your account and all associated data have been permanently deleted.",
      );
      setOpen(false);
      router.push("/");
    } catch (error) {
      clientLogger.error(
        "[DeleteAccount] Unexpected error",
        error instanceof Error ? error : { error },
      );
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="px-4 py-2 bg-error text-white rounded-xl hover:bg-error-dark transition-colors touch-target w-full sm:w-auto"
        >
          Delete Account
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-error-dark">Delete Account</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove all your data from our servers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-error-light/50 border border-error/30 rounded-lg p-3">
            <p className="text-sm text-error-dark">
              <strong>Warning:</strong> Deleting your account will:
            </p>
            <ul className="text-sm text-text-secondary mt-2 list-disc list-inside">
              <li>Remove all your profile data</li>
              <li>Unenroll you from all classes</li>
              <li>Delete all your assessment history</li>
              <li>Delete all your learning progress</li>
              <li>This cannot be reversed</li>
            </ul>
          </div>

          <div>
            <p className="text-sm text-text-secondary mb-2">
              Account: <strong>{userEmail}</strong>
            </p>
            <p className="text-sm text-text-secondary mb-2">
              Type <strong>delete</strong> to confirm:
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type 'delete' to confirm"
              disabled={isDeleting}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={!isConfirmed || isDeleting}
            loading={isDeleting}
            className="w-full sm:w-auto bg-error hover:bg-error-dark"
          >
            {isDeleting ? "Deleting..." : "Permanently Delete Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
