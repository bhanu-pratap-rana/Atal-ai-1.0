"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/utils/format-date";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteAnnouncement, type Announcement } from "@/app/actions/teacher";
import { clientLogger } from "@/lib/client-logger";

interface AnnouncementListProps {
  readonly announcements: Announcement[];
  readonly classId: string;
}

const priorityConfig = {
  low: { label: "Low", className: "bg-info/10 text-info" },
  normal: { label: "Normal", className: "bg-success/10 text-success" },
  high: { label: "High", className: "bg-warning/10 text-warning" },
  urgent: { label: "Urgent", className: "bg-error/10 text-error" },
};

export function AnnouncementList({
  announcements,
  classId: _classId,
}: AnnouncementListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (announcementId: string) => {
    setDeletingId(announcementId);
    try {
      const result = await deleteAnnouncement(announcementId);
      if (result.success) {
        toast.success("Announcement deleted");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete announcement");
      }
    } catch (error) {
      clientLogger.error("[AnnouncementList] Delete error", error instanceof Error ? error : { error: String(error) });
      toast.error("An unexpected error occurred");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  if (announcements.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📢</span>
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          No announcements yet
        </h3>
        <p className="text-text-secondary text-sm">
          Create your first announcement to communicate with students.
        </p>
      </div>
    );
  }

  // Sort: pinned first, then by created_at
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-4">
      {sortedAnnouncements.map((announcement) => (
        <Card
          key={announcement.id}
          className={`${
            announcement.is_pinned
              ? "border-primary/30 bg-primary/5"
              : "border-border"
          }`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {announcement.is_pinned && (
                    <span className="text-lg" title="Pinned">
                      📌
                    </span>
                  )}
                  <CardTitle className="text-lg truncate">
                    {announcement.title}
                  </CardTitle>
                </div>
                <CardDescription className="mt-1">
                  {formatRelativeTime(announcement.created_at)}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge
                  variant="secondary"
                  className={priorityConfig[announcement.priority].className}
                >
                  {priorityConfig[announcement.priority].label}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDeleteId(announcement.id)}
                  disabled={deletingId === announcement.id}
                  className="text-text-tertiary hover:text-error"
                >
                  {deletingId === announcement.id ? "..." : "🗑️"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary whitespace-pre-wrap">
              {announcement.body}
            </p>
          </CardContent>
        </Card>
      ))}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Announcement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this announcement? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
              disabled={deletingId === confirmDeleteId}
            >
              {deletingId === confirmDeleteId ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
