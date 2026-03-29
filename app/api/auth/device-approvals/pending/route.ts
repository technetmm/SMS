import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma/client";
import { expirePendingDeviceApprovalsForUser } from "@/lib/auth/device-approval-lifecycle";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });
  const userId = typeof token?.id === "string" ? token.id : null;
  const sessionId = typeof token?.sessionId === "string" ? token.sessionId : null;

  if (!userId || !sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  await expirePendingDeviceApprovalsForUser(userId, {
    currentSessionId: sessionId,
    now,
  });

  const requests = await prisma.loginApprovalRequest.findMany({
    where: {
      userId,
      currentSessionId: sessionId,
      status: "PENDING",
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      expiresAt: true,
      requestedIp: true,
      requestedUserAgent: true,
    },
  });

  return NextResponse.json({ requests });
}
