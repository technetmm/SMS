self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const payload = (() => {
    if (!event.data) {
      return {
        title: "Reminder",
        body: "You have a timetable reminder.",
        url: "/teacher/dashboard",
      };
    }

    try {
      return event.data.json();
    } catch {
      return {
        title: "Reminder",
        body: event.data.text(),
        url: "/teacher/dashboard",
      };
    }
  })();

  event.waitUntil(
    Promise.all([
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then((windowClients) => {
          for (const client of windowClients) {
            client.postMessage({ type: "teacher-reminder-alert" });
          }
        }),
      self.registration.showNotification(payload.title || "Reminder", {
        body: payload.body || "You have a timetable reminder.",
        icon: "/next.svg",
        badge: "/next.svg",
        tag: payload.tag || "teacher-timetable-reminder",
        renotify: true,
        requireInteraction: true,
        silent: false,
        vibrate: [200, 100, 200],
        data: {
          url: payload.url || "/teacher/dashboard",
        },
      }),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/teacher/dashboard";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }

        return undefined;
      }),
  );
});
