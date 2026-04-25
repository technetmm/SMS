import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole } from "@/app/generated/prisma/enums";
import { getPendingDeviceApprovalRows } from "@/lib/auth/device-approval-queue";
import { prisma } from "@/lib/prisma/client";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });
  const scope = request.nextUrl.searchParams.get("scope");
  const userId = typeof token?.id === "string" ? token.id : null;
  const sessionId = typeof token?.sessionId === "string" ? token.sessionId : null;
  const role = token?.role;
  const schoolId =
    typeof token?.schoolId === "string" ? token.schoolId : null;

  if (!userId || typeof role !== "string") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const selfRequests = sessionId
    ? await prisma.loginApprovalRequest.findMany({
        where: {
          userId,
          status: "PENDING",
          currentSessionId: sessionId,
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

  if (scope === "self") {
    return NextResponse.json({
      requests: selfRequests.map((request) => ({
        id: request.id,
        createdAt: request.createdAt.toISOString(),
        expiresAt: request.expiresAt.toISOString(),
        requestedIp: request.requestedIp,
        requestedUserAgent: request.requestedUserAgent,
        status: "PENDING" as const,
        requester: null,
      })),
    });
  }

  const approvableRequests = await getPendingDeviceApprovalRows({
    role: role as UserRole,
    schoolId,
  });

  const requests = [
    ...selfRequests.map((request) => ({
      id: request.id,
      createdAt: request.createdAt.toISOString(),
      expiresAt: request.expiresAt.toISOString(),
      requestedIp: request.requestedIp,
      requestedUserAgent: request.requestedUserAgent,
      status: "PENDING" as const,
      requester: null,
    })),
    ...approvableRequests,
  ];

  return NextResponse.json({ requests });
}
