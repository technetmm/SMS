"use client";

import { useEffect, useRef, useState } from "react";
import { DayOfWeek } from "@/app/generated/prisma/enums";
import {
  getTimetableSlotStartsInMinutes,
  isTimetableSlotStartingSoon,
} from "@/lib/teacher-timetable-highlight";
import { useTimetableNowContext } from "@/hooks/use-timetable-now-context";
import { useTranslations } from "next-intl";

type ReminderSlot = {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  section: {
    name: string;
    class: { name: string };
  };
};

const REMINDER_STORAGE_KEY = "teacher_reminder_notified_keys_v1";

function playReminderSound() {
  if (typeof window === "undefined") {
    return;
  }

  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor) {
    return;
  }

  const context = new AudioContextCtor();
  const now = context.currentTime;
  const notes = [880, 988];

  for (let i = 0; i < notes.length; i += 1) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = notes[i] ?? 880;
    gain.gain.setValueAtTime(0.0001, now + i * 0.18);
    gain.gain.exponentialRampToValueAtTime(0.16, now + i * 0.18 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.16);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now + i * 0.18);
    oscillator.stop(now + i * 0.18 + 0.17);
  }

  void context.close();
}

function vibrateReminderPattern() {
  if (typeof window === "undefined" || !("vibrate" in navigator)) {
    return;
  }
  navigator.vibrate([200, 100, 200]);
}

function getLocalDateKey(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function readStoredReminderKeys() {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const raw = window.localStorage.getItem(REMINDER_STORAGE_KEY);
    if (!raw) {
      return new Set<string>();
    }

    const parsed = JSON.parse(raw) as { keys?: string[] };
    return new Set(parsed.keys ?? []);
  } catch {
    return new Set<string>();
  }
}

function writeStoredReminderKeys(keys: Set<string>) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      REMINDER_STORAGE_KEY,
      JSON.stringify({ keys: Array.from(keys) }),
    );
  } catch {
    // Ignore localStorage failures.
  }
}

export function TeacherReminderListener({ role }: { role: string }) {
  const [slots, setSlots] = useState<ReminderSlot[]>([]);
  const nowContext = useTimetableNowContext();
  const t = useTranslations("TeacherSite.dashboard.timetable");
  const notifiedSlotKeysRef = useRef(new Set<string>());

  useEffect(() => {
    if (role !== "TEACHER" || typeof window === "undefined") {
      return;
    }

    const fetchSlots = async () => {
      try {
        const response = await fetch("/api/teacher/reminder-slots", {
          cache: "no-store",
        });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { items?: ReminderSlot[] };
        setSlots(data.items ?? []);
      } catch {
        // Ignore fetch failures and try again on next interval.
      }
    };

    const onVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void fetchSlots();
      }
    };

    void fetchSlots();
    const intervalId = window.setInterval(fetchSlots, 15_000);
    window.addEventListener("focus", onVisibilityOrFocus);
    document.addEventListener("visibilitychange", onVisibilityOrFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onVisibilityOrFocus);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
    };
  }, [role]);

  useEffect(() => {
    if (role !== "TEACHER" || !nowContext || typeof window === "undefined") {
      return;
    }

    if (!("Notification" in window)) {
      return;
    }

    const isUserActiveInSystem =
      typeof document !== "undefined" &&
      document.visibilityState === "visible" &&
      document.hasFocus();
    if (!isUserActiveInSystem) {
      return;
    }

    const soonSlots = slots.filter((slot) => isTimetableSlotStartingSoon(slot, nowContext));
    if (soonSlots.length === 0) {
      return;
    }

    const dateKey = getLocalDateKey(new Date());
    const storedKeys = readStoredReminderKeys();
    const todayKeyPrefix = `${dateKey}:`;
    const persistedKeys = new Set<string>(
      Array.from(storedKeys).filter((key) => key.startsWith(todayKeyPrefix)),
    );

    for (const slot of soonSlots) {
      const reminderKey = `${dateKey}:${nowContext.dayOfWeek}:${slot.id}:${slot.startTime}`;
      if (notifiedSlotKeysRef.current.has(reminderKey) || persistedKeys.has(reminderKey)) {
        continue;
      }

      const startsInMinutes = getTimetableSlotStartsInMinutes(slot, nowContext);
      if (startsInMinutes == null) {
        continue;
      }

      if (Notification.permission === "default") {
        void Notification.requestPermission();
      }
      if (Notification.permission !== "granted") {
        continue;
      }

      const options: NotificationOptions & { vibrate?: number[] } = {
        body: t("desktopReminderBody", {
          section: slot.section.name,
          className: slot.section.class.name,
          minutes: startsInMinutes,
        }),
        tag: reminderKey,
        silent: false,
        requireInteraction: true,
        vibrate: [200, 100, 200],
      };

      new Notification(t("desktopReminderTitle"), {
        ...options,
      });
      playReminderSound();
      vibrateReminderPattern();
      notifiedSlotKeysRef.current.add(reminderKey);
      persistedKeys.add(reminderKey);
    }

    writeStoredReminderKeys(persistedKeys);
  }, [nowContext, role, slots, t]);

  return null;
}
