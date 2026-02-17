"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAnnouncement } from "@/app/actions/teacher";
import { clientLogger } from "@/lib/client-logger";
import type { AnnouncementPriority } from "@/lib/validation-schemas";

interface CreateAnnouncementDialogProps {
  readonly classId: string;
  readonly className?: string;
}

export function CreateAnnouncementDialog({
  classId,
  className,
}: CreateAnnouncementDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<AnnouncementPriority>("normal");
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetForm = useCallback(() => {
    setTitle("");
    setBody("");
    setPriority("normal");
    setIsPinned(false);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        const result = await createAnnouncement({
          classId,
          title,
          body,
          priority,
          isPinned,
        });

        if (result?.success) {
          toast.success("Announcement created successfully!");
          resetForm();
          setOpen(false);
          router.refresh();
        } else if ("error" in result) {
          toast.error(result?.error || "Failed to create announcement");
        } else {
          toast.error("Failed to create announcement");
        }
      } catch (error) {
        clientLogger.error(
          "[CreateAnnouncementDialog] Failed to create announcement",
          error instanceof Error ? error : { error: String(error) },
        );
        toast.error("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    },
    [classId, title, body, priority, isPinned, resetForm, router],
  );

  const priorityOptions = [
    { value: "low", label: "🔵 Low" },
    { value: "normal", label: "🟢 Normal" },
    { value: "high", label: "🟡 High" },
    { value: "urgent", label: "🔴 Urgent" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={className}>
          <span className="mr-2">📢</span>
          <span>New Announcement</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
            <DialogDescription>
              Send an announcement to all students in this class.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="announcement-title">Title</Label>
              <Input
                id="announcement-title"
                placeholder="e.g., Homework Due Tomorrow"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="announcement-body">Message</Label>
              <textarea
                id="announcement-body"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Write your announcement here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                disabled={loading}
                maxLength={5000}
                rows={4}
              />
              <p className="text-xs text-text-tertiary text-right">
                {body.length}/5000
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin-toggle">Pin to Top</Label>
                <div className="flex items-center gap-2 h-10">
                  <input
                    type="checkbox"
                    id="pin-toggle"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    disabled={loading}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text-secondary">
                    {isPinned ? "Pinned" : "Not pinned"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title || !body}>
              {loading ? "Sending..." : "Send Announcement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
