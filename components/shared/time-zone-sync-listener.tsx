"use client";

import { useEffect } from "react";

const STORAGE_KEY = "tz_sync_v1";

export function TimeZoneSyncListener() {
  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone?.trim();
    if (!timeZone) {
      return;
    }

    try {
      new Intl.DateTimeFormat("en-US", { timeZone });
    } catch {
      return;
    }

    try {
      const previous = window.sessionStorage.getItem(STORAGE_KEY);
      if (previous === timeZone) {
        return;
      }
    } catch {
      // Ignore storage access errors.
    }

    void fetch("/api/user/time-zone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeZone }),
      keepalive: true,
    })
      .then((response) => {
        if (!response.ok) {
          return;
        }
        try {
          window.sessionStorage.setItem(STORAGE_KEY, timeZone);
        } catch {
          // Ignore storage access errors.
        }
      })
      .catch(() => {
        // Ignore sync errors and retry on next session load.
      });
  }, []);

  return null;
}
