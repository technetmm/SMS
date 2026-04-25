"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  fetchNotificationsPage,
  fetchUnreadNotificationsCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/lib/notifications/client";
import {
  isRealtimeStreamSupported,
  subscribeRealtimeSnapshots,
} from "@/lib/realtime/client";

const POLL_INTERVAL_MS = 15000;

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function NotificationBell() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  const notificationsHref = useMemo(() => {
    const root = pathname.split("/").filter(Boolean)[0];
    if (root === "platform") return "/platform/notifications";
    if (root === "teacher") return "/teacher/notifications";
    if (root === "student") return "/student/notifications";
    return "/school/notifications";
  }, [pathname]);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await fetchUnreadNotificationsCount();
      setUnreadCount(count);
    } catch {
      // Ignore transient network errors from polling.
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await fetchNotificationsPage({ limit: 10, offset: 0 });
      setNotifications(data.notifications ?? []);
    } catch {
      toast.error("Unable to load notifications.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  const markOneRead = useCallback(async (id: string) => {
    try {
      await markNotificationRead(id);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      toast.error("Unable to update notification.");
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();

      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true })),
      );
      setUnreadCount(0);
    } catch {
      toast.error("Unable to update notifications.");
    }
  }, []);

  useEffect(() => {
    void refreshUnreadCount();

    if (isRealtimeStreamSupported()) {
      return subscribeRealtimeSnapshots((snapshot) => {
        setUnreadCount(snapshot.unreadCount);
      });
    }

    const intervalId = window.setInterval(refreshUnreadCount, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (!open) return;

    void refreshNotifications();
    void refreshUnreadCount();
  }, [open, refreshNotifications, refreshUnreadCount]);

  const hasUnread = unreadCount > 0;
  const unreadBadgeText = useMemo(
    () => (unreadCount > 99 ? "99+" : String(unreadCount)),
    [unreadCount],
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label="Notifications"
        >
          <BellIcon className="size-4" />
          {hasUnread ? (
            <span className="absolute -right-1 -top-1 min-w-[1.1rem] rounded-full bg-destructive px-1 text-[10px] leading-4 text-white">
              {unreadBadgeText}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-88 max-w-[90vw]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={!notifications.some((item) => !item.isRead)}
            onClick={() => void markAllRead()}
          >
            Mark all as read
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loadingList ? (
          <div className="px-2 py-4 text-sm text-muted-foreground">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="px-2 py-4 text-sm text-muted-foreground">
            No notifications yet.
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex flex-col items-start gap-1 py-2"
              onSelect={(event) => {
                event.preventDefault();
                if (!notification.isRead) {
                  void markOneRead(notification.id);
                }
              }}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <span
                  className={notification.isRead ? "text-sm" : "text-sm font-semibold"}
                >
                  {notification.title}
                </span>
                {!notification.isRead ? (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">{notification.message}</p>
              <p className="text-[11px] text-muted-foreground">
                {formatTimestamp(notification.createdAt)}
              </p>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={notificationsHref}>View all notifications</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
