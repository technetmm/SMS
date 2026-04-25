"use client";

import { useEffect } from "react";

const PUSH_ENABLED_ROLES = new Set([
  "SUPER_ADMIN",
  "SCHOOL_SUPER_ADMIN",
  "SCHOOL_ADMIN",
  "TEACHER",
  "STUDENT",
]);

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replaceAll("-", "+").replaceAll("_", "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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

export function PushSubscriptionListener({ role }: { role: string }) {
  useEffect(() => {
    if (!PUSH_ENABLED_ROLES.has(role)) {
      return;
    }

    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      return;
    }

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string } | undefined;
      if (data?.type !== "teacher-reminder-alert") {
        return;
      }
      playReminderSound();
      vibrateReminderPattern();
    };

    const setupPushSubscription = async () => {
      try {
        const keyResponse = await fetch("/api/push/public-key", {
          cache: "no-store",
        });
        if (!keyResponse.ok) {
          return;
        }

        const keyData = (await keyResponse.json()) as { publicKey?: string };
        const publicKey = keyData.publicKey?.trim();
        if (!publicKey) {
          return;
        }

        await navigator.serviceWorker.register("/push-sw.js");
        const registration = await navigator.serviceWorker.ready;
        void registration.update();
        let permission = Notification.permission;
        if (permission === "default") {
          permission = await Notification.requestPermission();
        }
        if (permission !== "granted") {
          return;
        }

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });
        }

        await fetch("/api/push/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
        });
      } catch {
        // Ignore push registration failures and keep dashboard usable.
      }
    };

    const onVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void setupPushSubscription();
      }
    };

    navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    void setupPushSubscription();
    window.addEventListener("focus", onVisibilityOrFocus);
    document.addEventListener("visibilitychange", onVisibilityOrFocus);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
      window.removeEventListener("focus", onVisibilityOrFocus);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
    };
  }, [role]);

  return null;
}
