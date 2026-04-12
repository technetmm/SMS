import { UserRole } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";
import { finalizeDeviceApprovalRequest } from "@/lib/auth/device-approval-lifecycle";
import { paginateQuery } from "@/lib/pagination";

export type DeviceApprovalApprover = {
  role: UserRole;
  schoolId?: string | null;
};

export type DeviceApprovalQueueRow = {
  id: string;
  createdAt: string;
  expiresAt: string;
  requestedIp: string | null;
  requestedUserAgent: string | null;
  status: "PENDING";
  requester: {
    id: string;
    name: string | null;
    email: string;
    role: UserRole;
    schoolName: string | null;
  };
};

function buildApproverUserFilter(approver: DeviceApprovalApprover) {
  if (approver.role === UserRole.SUPER_ADMIN) {
    return { role: { in: [UserRole.SCHOOL_SUPER_ADMIN, UserRole.SCHOOL_ADMIN] } };
  }

  if (
    (approver.role === UserRole.SCHOOL_SUPER_ADMIN ||
      approver.role === UserRole.SCHOOL_ADMIN) &&
    approver.schoolId
  ) {
    return {
      role: { in: [UserRole.TEACHER, UserRole.STUDENT] },
      schoolId: approver.schoolId,
    };
  }

  return null;
}

async function expirePendingRequests(
  approver: DeviceApprovalApprover,
  now: Date,
) {
  const userFilter = buildApproverUserFilter(approver);
  if (!userFilter) {
    return null;
  }

  const expired = await prisma.loginApprovalRequest.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lte: now },
      user: userFilter,
    },
    select: {
      id: true,
      userId: true,
    },
  });

  for (const request of expired) {
    await finalizeDeviceApprovalRequest(prisma, {
      requestId: request.id,
      userId: request.userId,
      outcome: "EXPIRED",
      now,
    });
  }

  return userFilter;
}

export function canApproveDeviceRequest(
  approver: DeviceApprovalApprover,
  requestUser: { role: UserRole; schoolId: string | null },
) {
  if (approver.role === UserRole.SUPER_ADMIN) {
    return (
      requestUser.role === UserRole.SCHOOL_SUPER_ADMIN ||
      requestUser.role === UserRole.SCHOOL_ADMIN
    );
  }

  if (
    approver.role === UserRole.SCHOOL_SUPER_ADMIN ||
    approver.role === UserRole.SCHOOL_ADMIN
  ) {
    return (
      approver.schoolId != null &&
      approver.schoolId === requestUser.schoolId &&
      (requestUser.role === UserRole.TEACHER ||
        requestUser.role === UserRole.STUDENT)
    );
  }

  return false;
}

export async function getPendingDeviceApprovalRows(
  approver: DeviceApprovalApprover,
  now = new Date(),
): Promise<DeviceApprovalQueueRow[]> {
  const userFilter = await expirePendingRequests(approver, now);
  if (!userFilter) {
    return [];
  }

  const requests = await prisma.loginApprovalRequest.findMany({
    where: {
      status: "PENDING",
      expiresAt: { gt: now },
      user: userFilter,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      expiresAt: true,
      requestedIp: true,
      requestedUserAgent: true,
      status: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          school: {
            select: { name: true },
          },
        },
      },
    },
  });

  return requests.map((request) => ({
    id: request.id,
    createdAt: request.createdAt.toISOString(),
    expiresAt: request.expiresAt.toISOString(),
    requestedIp: request.requestedIp,
    requestedUserAgent: request.requestedUserAgent,
    status: "PENDING",
    requester: {
      id: request.user.id,
      name: request.user.name,
      email: request.user.email,
      role: request.user.role,
      schoolName: request.user.school?.name ?? null,
    },
  }));
}

export async function getPaginatedPendingDeviceApprovalRows(
  approver: DeviceApprovalApprover,
  {
    page,
    now = new Date(),
    filters,
  }: {
    page: number;
    now?: Date;
    filters?: {
      q?: string;
      requesterRole?: UserRole;
      createdFrom?: Date;
      createdTo?: Date;
      expiresFrom?: Date;
      expiresTo?: Date;
    };
  },
) {
  const userFilter = await expirePendingRequests(approver, now);
  if (!userFilter) {
    return paginateQuery({
      page,
      count: async () => 0,
      query: async () => [],
    });
  }
  const where: Record<string, unknown> = {
    status: "PENDING",
    expiresAt: { gt: now },
    user: userFilter,
  };

  if (filters?.createdFrom || filters?.createdTo) {
    where.createdAt = {
      ...(filters.createdFrom ? { gte: filters.createdFrom } : {}),
      ...(filters.createdTo ? { lte: filters.createdTo } : {}),
    };
  }

  if (filters?.expiresFrom || filters?.expiresTo) {
    where.expiresAt = {
      ...(filters.expiresFrom ? { gte: filters.expiresFrom } : {}),
      ...(filters.expiresTo ? { lte: filters.expiresTo } : {}),
    };
  }

  if (filters?.requesterRole) {
    where.user = {
      ...userFilter,
      role: filters.requesterRole,
    };
  }

  if (filters?.q) {
    where.OR = [
      { requestedIp: { contains: filters.q, mode: "insensitive" } },
      { requestedUserAgent: { contains: filters.q, mode: "insensitive" } },
      {
        user: {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" } },
            { email: { contains: filters.q, mode: "insensitive" } },
            { school: { name: { contains: filters.q, mode: "insensitive" } } },
          ],
        },
      },
    ];
  }

  return paginateQuery({
    page,
    count: () =>
      prisma.loginApprovalRequest.count({
        where,
      }),
    query: ({ skip, take }) =>
      prisma.loginApprovalRequest
        .findMany({
          where,
          orderBy: { createdAt: "asc" },
          skip,
          take,
          select: {
            id: true,
            createdAt: true,
            expiresAt: true,
            requestedIp: true,
            requestedUserAgent: true,
            status: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                school: {
                  select: { name: true },
                },
              },
            },
          },
        })
        .then((requests) =>
          requests.map((request) => ({
            id: request.id,
            createdAt: request.createdAt.toISOString(),
            expiresAt: request.expiresAt.toISOString(),
            requestedIp: request.requestedIp,
            requestedUserAgent: request.requestedUserAgent,
            status: "PENDING" as const,
            requester: {
              id: request.user.id,
              name: request.user.name,
              email: request.user.email,
              role: request.user.role,
              schoolName: request.user.school?.name ?? null,
            },
          })),
        ),
  });
}
