import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole } from "@/app/generated/prisma/enums";
import {
  getPendingDeviceApprovalRows,
  type DeviceApprovalQueueRow,
} from "@/lib/auth/device-approval-queue";
import { prisma } from "@/lib/prisma/client";
import type {
  RealtimePendingDeviceApprovalRequest,
  RealtimeReminderSlot,
  RealtimeSnapshot,
} from "@/lib/realtime/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const encoder = new TextEncoder();
const HEARTBEAT_MS = 25_000;
const TICK_MS = 3_000;
const SLOW_TASK_MS = 15_000;

const APPROVER_ROLES = new Set<UserRole>([
  UserRole.SUPER_ADMIN,
  UserRole.SCHOOL_SUPER_ADMIN,
  UserRole.SCHOOL_ADMIN,
]);

type SessionContext = {
  userId: string;
  sessionId: string | null;
  role: UserRole;
  schoolId: string | null;
};

function toSseEvent(name: string, payload: unknown) {
  return `event: ${name}\ndata: ${JSON.stringify(payload)}\n\n`;
}

async function fetchUnreadCount(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

async function fetchReminderSlots(
  context: SessionContext,
): Promise<RealtimeReminderSlot[]> {
  if (context.role !== UserRole.TEACHER || !context.schoolId) {
    return [];
  }

  const staff = await prisma.staff.findFirst({
    where: {
      userId: context.userId,
      schoolId: context.schoolId,
    },
    select: { id: true },
  });

  if (!staff) {
    return [];
  }

  return prisma.timetable.findMany({
    where: {
      schoolId: context.schoolId,
      staffId: staff.id,
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    select: {
      id: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      section: {
        select: {
          name: true,
          class: {
            select: { name: true },
          },
        },
      },
    },
  });
}

async function fetchPendingApprovals(
  context: SessionContext,
): Promise<RealtimePendingDeviceApprovalRequest[]> {
  const selfRequests = context.sessionId
    ? await prisma.loginApprovalRequest.findMany({
        where: {
          userId: context.userId,
          status: "PENDING",
          currentSessionId: context.sessionId,
        },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
          requestedIp: true,
          requestedUserAgent: true,
        },
      })
    : [];

  const mappedSelf = selfRequests.map((request) => ({
    id: request.id,
    createdAt: request.createdAt.toISOString(),
    expiresAt: request.expiresAt.toISOString(),
    requestedIp: request.requestedIp,
    requestedUserAgent: request.requestedUserAgent,
    status: "PENDING" as const,
    requester: null,
  }));

  if (!APPROVER_ROLES.has(context.role)) {
    return mappedSelf;
  }

  const approvableRequests: DeviceApprovalQueueRow[] =
    await getPendingDeviceApprovalRows({
      role: context.role,
      schoolId: context.schoolId,
    });

  return [...mappedSelf, ...approvableRequests];
}

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });
  const userId = typeof token?.id === "string" ? token.id : null;
  const role = token?.role;

  if (!userId || typeof role !== "string") {
    return new Response("Unauthorized", { status: 401 });
  }

  const context: SessionContext = {
    userId,
    role: role as UserRole,
    sessionId: typeof token?.sessionId === "string" ? token.sessionId : null,
    schoolId: typeof token?.schoolId === "string" ? token.schoolId : null,
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let inFlight = false;
      let slowTaskDueAt = 0;
      let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
      let tickTimer: ReturnType<typeof setInterval> | null = null;
      let unreadCount = 0;
      let reminderSlots: RealtimeReminderSlot[] = [];
      let pendingDeviceApprovals: RealtimePendingDeviceApprovalRequest[] = [];

      const cleanup = () => {
        if (closed) return;
        closed = true;
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (tickTimer) clearInterval(tickTimer);
      };

      const sendSnapshot = async (refreshSlow: boolean) => {
        if (closed || inFlight) return;
        inFlight = true;
        try {
          const pendingPromise = fetchPendingApprovals(context);
          const unreadPromise = refreshSlow
            ? fetchUnreadCount(context.userId)
            : Promise.resolve(unreadCount);
          const remindersPromise = refreshSlow
            ? fetchReminderSlots(context)
            : Promise.resolve(reminderSlots);

          const [nextPending, nextUnreadCount, nextReminderSlots] =
            await Promise.all([pendingPromise, unreadPromise, remindersPromise]);

          pendingDeviceApprovals = nextPending;
          unreadCount = nextUnreadCount;
          reminderSlots = nextReminderSlots;

          const payload: RealtimeSnapshot = {
            unreadCount,
            reminderSlots,
            pendingDeviceApprovals,
            generatedAt: new Date().toISOString(),
          };

          controller.enqueue(
            encoder.encode(toSseEvent("snapshot", payload)),
          );
        } catch {
          controller.enqueue(
            encoder.encode(
              toSseEvent("error", {
                message: "Failed to refresh realtime payload.",
              }),
            ),
          );
        } finally {
          inFlight = false;
        }
      };

      const tick = () => {
        const now = Date.now();
        const shouldRefreshSlow = now >= slowTaskDueAt;
        if (shouldRefreshSlow) {
          slowTaskDueAt = now + SLOW_TASK_MS;
        }
        void sendSnapshot(shouldRefreshSlow);
      };

      request.signal.addEventListener("abort", () => {
        cleanup();
        controller.close();
      });

      tick();
      heartbeatTimer = setInterval(() => {
        if (closed) return;
        controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
      }, HEARTBEAT_MS);
      tickTimer = setInterval(tick, TICK_MS);
    },
    cancel() {
      // No-op: cleanup is handled by request abort.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
