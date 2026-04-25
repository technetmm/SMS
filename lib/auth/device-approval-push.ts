import { UserRole } from "@/app/generated/prisma/enums";
import { Prisma, PrismaClient } from "@/app/generated/prisma/client";
import { deliverPushPayloadToSubscriptions } from "@/lib/push/delivery";

type DeviceApprovalPushClient = {
  user: PrismaClient["user"];
  pushSubscription: PrismaClient["pushSubscription"];
};

function getApproverWhere(input: { role: UserRole; schoolId: string | null }) {
  if (
    input.role === UserRole.SCHOOL_SUPER_ADMIN ||
    input.role === UserRole.SCHOOL_ADMIN
  ) {
    return { role: UserRole.SUPER_ADMIN };
  }

  if (
    (input.role === UserRole.TEACHER || input.role === UserRole.STUDENT) &&
    input.schoolId
  ) {
    return {
      role: {
        in: [UserRole.SCHOOL_SUPER_ADMIN, UserRole.SCHOOL_ADMIN],
      },
      schoolId: input.schoolId,
    };
  }

  return null;
}

function getTargetUrlByRole(role: UserRole) {
  if (role === UserRole.SUPER_ADMIN) {
    return "/platform/device-approvals";
  }

  if (role === UserRole.SCHOOL_SUPER_ADMIN || role === UserRole.SCHOOL_ADMIN) {
    return "/school/device-approvals";
  }

  if (role === UserRole.TEACHER) {
    return "/teacher/dashboard";
  }

  if (role === UserRole.STUDENT) {
    return "/student/dashboard";
  }

  return "/login";
}

export async function sendDeviceApprovalRequestPushNotifications(
  db: DeviceApprovalPushClient,
  input: {
    requestId: string;
    requestedByUserId: string;
    requestedByUserRole: UserRole;
    requestedBySchoolId: string | null;
  },
) {
  const recipients = new Map<string, UserRole>();
  recipients.set(input.requestedByUserId, input.requestedByUserRole);

  const approverWhere = getApproverWhere({
    role: input.requestedByUserRole,
    schoolId: input.requestedBySchoolId,
  }) as Prisma.UserWhereInput | null;

  if (approverWhere) {
    const approvers = await db.user.findMany({
      where: approverWhere,
      select: { id: true, role: true },
    });

    for (const approver of approvers) {
      recipients.set(approver.id, approver.role);
    }
  }

  const recipientsByUrl = new Map<string, string[]>();
  for (const [userId, role] of recipients.entries()) {
    const url = getTargetUrlByRole(role);
    const existing = recipientsByUrl.get(url);
    if (existing) {
      existing.push(userId);
    } else {
      recipientsByUrl.set(url, [userId]);
    }
  }

  let sentCount = 0;
  let removedCount = 0;
  let failedCount = 0;

  for (const [url, userIds] of recipientsByUrl) {
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId: { in: userIds } },
      select: {
        endpoint: true,
        p256dh: true,
        auth: true,
      },
    });

    if (subscriptions.length === 0) {
      continue;
    }

    const delivered = await deliverPushPayloadToSubscriptions(db, {
      subscriptions,
      payload: {
        title: "Device approval required",
        body: "A new device login is waiting for approval.",
        url,
        tag: `device-approval-request:${input.requestId}`,
        type: "device-approval-requested",
        metadata: {
          requestId: input.requestId,
        },
      },
    });

    sentCount += delivered.sentCount;
    removedCount += delivered.removedCount;
    failedCount += delivered.failedCount;
  }

  return {
    recipientCount: recipients.size,
    sentCount,
    removedCount,
    failedCount,
  };
}
