"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function ActivityTracker() {
  const { data: session, update } = useSession();

  useEffect(() => {
    if (!session?.user) return;

    // Track user activity events
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    let lastUpdate = Date.now();
    const UPDATE_INTERVAL = 5 * 60 * 1000; // Update every 5 minutes of activity

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastUpdate >= UPDATE_INTERVAL) {
        lastUpdate = now;
        // Trigger session update to refresh token and update last activity
        update().catch(console.error);
      }
    };

    // Add event listeners for activity tracking
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup event listeners
    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [session, update]);

  // This component doesn't render anything visible
  return null;
}
