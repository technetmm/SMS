import { NextRequest, NextResponse } from "next/server";
import { DayOfWeek, UserRole } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";
import { timeToMinutes } from "@/lib/time";
import { createNotification } from "@/lib/notifications/notifications";
import { deliverPushPayloadToSubscriptions } from "@/lib/push/delivery";
import { APP_TIME_ZONE } from "@/lib/app-time";
import { resolveEffectiveTimeZone } from "@/lib/time-zone";

const WEEKDAY_SHORT_TO_DAY: Record<string, DayOfWeek> = {
  Sun: DayOfWeek.SUN,
  Mon: DayOfWeek.MON,
  Tue: DayOfWeek.TUE,
  Wed: DayOfWeek.WED,
  Thu: DayOfWeek.THU,
  Fri: DayOfWeek.FRI,
  Sat: DayOfWeek.SAT,
};

function getTargetScheduleContext(
  now: Date,
  leadMinutes: number,
  timeZone: string,
) {
  const target = new Date(now.getTime() + leadMinutes * 60_000);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(target);

  const weekdayShort =
    parts.find((part) => part.type === "weekday")?.value ?? "Mon";
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? "0",
  );

  return {
    dayOfWeek: WEEKDAY_SHORT_TO_DAY[weekdayShort] ?? DayOfWeek.MON,
    targetMinutes: hour * 60 + minute,
    dateKey: `${year}-${month}-${day}`,
  };
}

export async function POST(request: NextRequest) {
  const secret = process.env.PUSH_REMINDER_CRON_SECRET?.trim();
  const requestSecret = request.headers.get("x-cron-secret")?.trim();

  if (!secret) {
    return NextResponse.json(
      { error: "Missing PUSH_REMINDER_CRON_SECRET configuration." },
      { status: 500 },
    );
  }

  if (!requestSecret || requestSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leadMinutes = Number.parseInt(
    process.env.PUSH_REMINDER_LEAD_MINUTES ?? "2",
    10,
  );
  const effectiveLeadMinutes = Number.isFinite(leadMinutes)
    ? Math.max(1, leadMinutes)
    : 2;
  const now = new Date();
  const staffRows = await prisma.staff.findMany({
    where: {
      user: {
        role: UserRole.TEACHER,
      },
    },
    select: {
      id: true,
      user: {
        select: {
          timeZone: true,
        },
      },
    },
  });

  const staffIdsByTimeZone = new Map<string, string[]>();
  for (const row of staffRows) {
    const timeZone = resolveEffectiveTimeZone(row.user.timeZone);
    const existing = staffIdsByTimeZone.get(timeZone);
    if (existing) {
      existing.push(row.id);
    } else {
      staffIdsByTimeZone.set(timeZone, [row.id]);
    }
  }

  type DueSlot = {
    id: string;
    startTime: string;
    staffId: string;
    sectionId: string;
    dateKey: string;
    dayOfWeek: DayOfWeek;
    targetMinutes: number;
    timeZone: string;
  };

  const dueSlots: DueSlot[] = [];
  const evaluatedContexts: Array<{
    timeZone: string;
    dayOfWeek: DayOfWeek;
    targetMinutes: number;
    dateKey: string;
  }> = [];
  let scanned = 0;

  for (const [timeZone, staffIds] of staffIdsByTimeZone) {
    const context = getTargetScheduleContext(
      now,
      effectiveLeadMinutes,
      timeZone,
    );
    evaluatedContexts.push({
      timeZone,
      dayOfWeek: context.dayOfWeek,
      targetMinutes: context.targetMinutes,
      dateKey: context.dateKey,
    });

    const slots = await prisma.timetable.findMany({
      where: {
        staffId: { in: staffIds },
        dayOfWeek: context.dayOfWeek,
      },
      select: {
        id: true,
        startTime: true,
        staffId: true,
        sectionId: true,
      },
    });

    scanned += slots.length;

    for (const slot of slots) {
      if (timeToMinutes(slot.startTime) !== context.targetMinutes) {
        continue;
      }

      dueSlots.push({
        ...slot,
        dateKey: context.dateKey,
        dayOfWeek: context.dayOfWeek,
        targetMinutes: context.targetMinutes,
        timeZone,
      });
    }
  }

  const staffIds = [...new Set(dueSlots.map((slot) => slot.staffId))];
  const sectionIds = [...new Set(dueSlots.map((slot) => slot.sectionId))];

  const [staffDetailRows, sectionRows] = await Promise.all([
    prisma.staff.findMany({
      where: { id: { in: staffIds } },
      select: {
        id: true,
        name: true,
        userId: true,
      },
    }),
    prisma.section.findMany({
      where: { id: { in: sectionIds } },
      select: {
        id: true,
        name: true,
        class: { select: { name: true } },
      },
    }),
  ]);

  const staffById = new Map(staffDetailRows.map((staff) => [staff.id, staff]));
  const sectionById = new Map(
    sectionRows.map((section) => [section.id, section]),
  );

  let sentCount = 0;
  let skippedCount = 0;
  let removedSubscriptionCount = 0;
  let failedPushCount = 0;

  for (const slot of dueSlots) {
    const staff = staffById.get(slot.staffId);
    const section = sectionById.get(slot.sectionId);
    const userId = staff?.userId;

    if (!staff || !section) {
      skippedCount += 1;
      continue;
    }

    if (!userId) {
      skippedCount += 1;
      continue;
    }

    const sourceKey = `teacher-timetable-reminder:${slot.id}:${slot.dateKey}`;
    const exists = await prisma.notification.findUnique({
      where: { sourceKey },
      select: { id: true },
    });

    if (exists) {
      skippedCount += 1;
      continue;
    }

    const title = "Class reminder";
    const message = `${section.name} (${section.class.name}) starts in ${effectiveLeadMinutes} min.`;

    await createNotification(prisma, {
      userId,
      type: "TEACHER_TIMETABLE_REMINDER",
      title,
      message,
      sourceKey,
      metadata: {
        slotId: slot.id,
        sectionId: section.id,
        staffId: staff.id,
        dateKey: slot.dateKey,
      },
    });

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
      select: {
        endpoint: true,
        p256dh: true,
        auth: true,
      },
    });

    const delivery = await deliverPushPayloadToSubscriptions(prisma, {
      subscriptions,
      payload: {
        title,
        body: message,
        url: "/teacher/dashboard",
        tag: sourceKey,
        type: "teacher-timetable-reminder",
        metadata: {
          slotId: slot.id,
          sectionId: section.id,
          staffId: staff.id,
          dateKey: slot.dateKey,
        },
      },
    });
    sentCount += delivery.sentCount;
    removedSubscriptionCount += delivery.removedCount;
    failedPushCount += delivery.failedCount;
  }

  return NextResponse.json({
    success: true,
    scanned,
    dueSlots: dueSlots.length,
    sentCount,
    skippedCount,
    removedSubscriptionCount,
    failedPushCount,
    leadMinutes: effectiveLeadMinutes,
    timeZone: APP_TIME_ZONE,
    evaluatedTimeZones: staffIdsByTimeZone.size,
    evaluatedContexts,
  });
}
