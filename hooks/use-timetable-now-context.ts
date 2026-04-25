"use client";

import { useEffect, useState } from "react";
import {
  createTimetableNowContext,
  type TimetableNowContext,
} from "@/lib/teacher-timetable-highlight";

export function useTimetableNowContext(timeZone?: string) {
  const [nowContext, setNowContext] = useState<TimetableNowContext | null>(null);

  useEffect(() => {
    const syncNowContext = () => {
      setNowContext(createTimetableNowContext(new Date(), timeZone));
    };

    syncNowContext();
    const intervalId = window.setInterval(syncNowContext, 30_000);
    return () => window.clearInterval(intervalId);
  }, [timeZone]);

  return nowContext;
}
