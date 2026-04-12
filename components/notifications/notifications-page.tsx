"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchNotificationsPage,
  fetchUnreadNotificationsCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/lib/notifications/client";

const DEFAULT_PAGE_SIZE = 20;

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await fetchUnreadNotificationsCount();
      setUnreadCount(count);
    } catch {
      // Ignore and let list loading communicate errors.
    }
  }, []);

  const loadPage = useCallback(
    async (offset: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const data = await fetchNotificationsPage({
          limit: DEFAULT_PAGE_SIZE,
          offset,
        });
        setNotifications((prev) =>
          append ? [...prev, ...data.notifications] : data.notifications,
        );
        setNextOffset(data.nextOffset);
      } catch {
        toast.error("Unable to load notifications.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    void Promise.all([loadPage(0, false), refreshUnreadCount()]);
  }, [loadPage, refreshUnreadCount]);

  const onMarkOneRead = useCallback(
    async (id: string) => {
      setUpdating(true);
      try {
        await markNotificationRead(id);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isRead: true } : item,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        toast.error("Unable to update notification.");
      } finally {
        setUpdating(false);
      }
    },
    [],
  );

  const onMarkAllRead = useCallback(async () => {
    setUpdating(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true })),
      );
      setUnreadCount(0);
    } catch {
      toast.error("Unable to update notifications.");
    } finally {
      setUpdating(false);
    }
  }, []);

  const hasUnread = useMemo(
    () => notifications.some((item) => !item.isRead),
    [notifications],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>All Notifications</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Unread: {unreadCount}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void onMarkAllRead()}
            disabled={!hasUnread || updating}
          >
            Mark all as read
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="rounded-md border p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p
                  className={
                    notification.isRead
                      ? "text-sm"
                      : "text-sm font-semibold"
                  }
                >
                  {notification.title}
                </p>
                {!notification.isRead ? (
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    disabled={updating}
                    onClick={() => void onMarkOneRead(notification.id)}
                  >
                    Mark read
                  </Button>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {notification.message}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatTimestamp(notification.createdAt)}
              </p>
            </div>
          ))
        )}
        {nextOffset != null && notifications.length > 0 ? (
          <div className="pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadPage(nextOffset, true)}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "Load more"}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
