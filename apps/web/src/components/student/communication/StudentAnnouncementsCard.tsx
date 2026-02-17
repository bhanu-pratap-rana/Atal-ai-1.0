"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils/format-date";
import { markAnnouncementRead, type Announcement } from "@/app/actions/teacher";
import { clientLogger } from "@/lib/client-logger";

interface AnnouncementWithReadStatus extends Announcement {
  is_read?: boolean;
}

interface StudentAnnouncementsCardProps {
  readonly announcements: AnnouncementWithReadStatus[];
  readonly className?: string;
  readonly showEmpty?: boolean;
}

const priorityConfig = {
  low: { label: "Low", className: "bg-info/10 text-info" },
  normal: { label: "Normal", className: "bg-success/10 text-success" },
  high: { label: "High", className: "bg-warning/10 text-warning" },
  urgent: { label: "Urgent", className: "bg-error/10 text-error" },
};

export function StudentAnnouncementsCard({
  announcements,
  className,
  showEmpty = true,
}: StudentAnnouncementsCardProps) {
  const [_isPending, startTransition] = useTransition();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Mark announcements as read when they come into view
  useEffect(() => {
    const unreadAnnouncements = announcements.filter(
      (a) => !a.is_read && !readIds.has(a.id)
    );

    if (unreadAnnouncements.length > 0) {
      // Mark all unread as read after a short delay (user has seen them)
      const timeout = setTimeout(() => {
        unreadAnnouncements.forEach((announcement) => {
          startTransition(async () => {
            try {
              const result = await markAnnouncementRead(announcement.id);
              if (result.success) {
                setReadIds((prev) => new Set([...prev, announcement.id]));
              }
            } catch (error) {
              clientLogger.error(
                "[StudentAnnouncementsCard] Error marking as read",
                error instanceof Error ? error : { error: String(error) }
              );
            }
          });
        });
      }, 2000); // Mark as read after 2 seconds of viewing

      return () => clearTimeout(timeout);
    }
  }, [announcements, readIds]);

  const unreadCount = announcements.filter(
    (a) => !a.is_read && !readIds.has(a.id)
  ).length;

  if (announcements.length === 0 && !showEmpty) {
    return null;
  }

  // Sort: pinned first, then by created_at
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <span>📢</span> Announcements
          </span>
          {unreadCount > 0 && (
            <Badge variant="error" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {announcements.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📭</span>
            </div>
            <p className="text-text-secondary text-sm">
              No announcements from your teacher yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAnnouncements.map((announcement) => {
              const isUnread = !announcement.is_read && !readIds.has(announcement.id);
              return (
                <div
                  key={announcement.id}
                  className={`p-4 rounded-lg border ${
                    announcement.is_pinned
                      ? "border-primary/30 bg-primary/5"
                      : isUnread
                      ? "border-info/30 bg-info/5"
                      : "border-border bg-surface"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {announcement.is_pinned && (
                        <span className="text-sm" title="Pinned">📌</span>
                      )}
                      {isUnread && (
                        <span className="w-2 h-2 bg-info rounded-full" title="New" />
                      )}
                      <h4 className="font-semibold text-text-primary">
                        {announcement.title}
                      </h4>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${priorityConfig[announcement.priority].className}`}
                    >
                      {priorityConfig[announcement.priority].label}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap mb-2">
                    {announcement.body}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {formatRelativeTime(announcement.created_at)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
