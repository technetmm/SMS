export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type NotificationsResponse = {
  notifications?: NotificationItem[];
  nextOffset?: number | null;
};

type UnreadCountResponse = {
  unreadCount?: number;
};

async function parseJsonOrThrow<T>(response: Response) {
  if (!response.ok) {
    throw new Error(`Notification API error: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchUnreadNotificationsCount() {
  const response = await fetch("/api/notifications/unread-count", {
    cache: "no-store",
    credentials: "include",
  });
  const data = await parseJsonOrThrow<UnreadCountResponse>(response);
  return Number(data.unreadCount ?? 0);
}

export async function fetchNotificationsPage(input: {
  limit: number;
  offset: number;
}) {
  const response = await fetch(
    `/api/notifications?limit=${input.limit}&offset=${input.offset}`,
    {
      cache: "no-store",
      credentials: "include",
    },
  );
  const data = await parseJsonOrThrow<NotificationsResponse>(response);
  return {
    notifications: data.notifications ?? [],
    nextOffset: data.nextOffset ?? null,
  };
}

export async function markNotificationRead(id: string) {
  const response = await fetch(`/api/notifications/${id}/read`, {
    method: "POST",
    credentials: "include",
  });
  await parseJsonOrThrow<{ status: string }>(response);
}

export async function markAllNotificationsRead() {
  const response = await fetch("/api/notifications/read-all", {
    method: "POST",
    credentials: "include",
  });
  await parseJsonOrThrow<{ updated: number }>(response);
}
