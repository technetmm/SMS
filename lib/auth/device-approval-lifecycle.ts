import { prisma } from "@/lib/prisma/client";
import { createNotification, type NotificationClient } from "@/lib/notifications/notifications";

export type DeviceApprovalOutcome = "APPROVED" | "DENIED" | "EXPIRED";

type DeviceApprovalClient = NotificationClient & {
  loginApprovalRequest: {
    updateMany: (args: {
      where: { id: string; userId: string; status: "PENDING" };
      data: {
        status: DeviceApprovalOutcome;
        approvedAt?: Date;
        deniedAt?: Date;
      };
    }) => Promise<{ count: number }>;
    findMany: (args: {
      where: {
        userId: string;
        status: "PENDING";
        currentSessionId?: string;
      };
      select: { id: true };
    }) => Promise<Array<{ id: string }>>;
  };
};

const DEVICE_APPROVAL_NOTIFICATION_MAP: Record<
  DeviceApprovalOutcome,
  { type: string; title: string; message: string }
> = {
  APPROVED: {
    type: "device_approval.approved",
    title: "Device login approved",
    message: "New device login approved; previous device signed out.",
  },
  DENIED: {
    type: "device_approval.denied",
    title: "Device login denied",
    message: "New device login was denied.",
  },
  EXPIRED: {
    type: "device_approval.expired",
    title: "Device login request expired",
    message: "A device login request expired without approval.",
  },
};

export function buildDeviceApprovalNotificationSourceKey(
  requestId: string,
  outcome: DeviceApprovalOutcome,
) {
  return `device-approval:${requestId}:${outcome}`;
}

export async function finalizeDeviceApprovalRequest(
  db: DeviceApprovalClient,
  input: {
    requestId: string;
    userId: string;
    outcome: DeviceApprovalOutcome;
    now?: Date;
  },
) {
  const now = input.now ?? new Date();
  const data: {
    status: DeviceApprovalOutcome;
    approvedAt?: Date;
    deniedAt?: Date;
  } = { status: input.outcome };

  if (input.outcome === "APPROVED") {
    data.approvedAt = now;
  }

  if (input.outcome === "DENIED") {
    data.deniedAt = now;
  }

  const result = await db.loginApprovalRequest.updateMany({
    where: {
      id: input.requestId,
      userId: input.userId,
      status: "PENDING",
    },
    data,
  });

  if (result.count === 0) {
    return false;
  }

  const notification = DEVICE_APPROVAL_NOTIFICATION_MAP[input.outcome];

  try {
    await createNotification(db, {
      userId: input.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      sourceKey: buildDeviceApprovalNotificationSourceKey(
        input.requestId,
        input.outcome,
      ),
      metadata: {
        requestId: input.requestId,
        outcome: input.outcome,
        happenedAt: now.toISOString(),
      },
    });
  } catch (error) {
    // Do not block auth/session transfer if notifications infrastructure is unavailable.
    console.error("Failed to persist notification", {
      userId: input.userId,
      requestId: input.requestId,
      outcome: input.outcome,
      error,
    });
  }

  return true;
}

export async function expirePendingDeviceApprovalsForUser(
  userId: string,
  options?: { currentSessionId?: string; now?: Date },
) {
  const now = options?.now ?? new Date();

  const requests = await prisma.loginApprovalRequest.findMany({
    where: {
      userId,
      status: "PENDING",
      ...(options?.currentSessionId
        ? { currentSessionId: options.currentSessionId }
        : {}),
    },
    select: { id: true },
  });

  for (const request of requests) {
    await finalizeDeviceApprovalRequest(prisma, {
      requestId: request.id,
      userId,
      outcome: "EXPIRED",
      now,
    });
  }

  return requests.length;
}

export async function clearPendingDeviceApprovalsForUser(
  userId: string,
  options?: { currentSessionId?: string; now?: Date },
) {
  const now = options?.now ?? new Date();

  const requests = await prisma.loginApprovalRequest.findMany({
    where: {
      userId,
      status: "PENDING",
      ...(options?.currentSessionId
        ? { currentSessionId: options.currentSessionId }
        : {}),
    },
    select: { id: true },
  });

  for (const request of requests) {
    await finalizeDeviceApprovalRequest(prisma, {
      requestId: request.id,
      userId,
      outcome: "EXPIRED",
      now,
    });
  }

  return requests.length;
}
