import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { SESSION_LOCK_TTL_MS } from "@/lib/auth/session-lock";

const requestSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(["approve", "deny"]),
});

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request });
  const userId = typeof token?.id === "string" ? token.id : null;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const now = new Date();
  const approvalRequest = await prisma.loginApprovalRequest.findFirst({
    where: {
      id: parsed.data.requestId,
      userId,
    },
    select: {
      id: true,
      status: true,
      currentSessionId: true,
      requestedSessionId: true,
      expiresAt: true,
    },
  });

  if (!approvalRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (approvalRequest.status !== "PENDING") {
    return NextResponse.json({ error: "Request already handled", status: approvalRequest.status }, { status: 409 });
  }

  if (approvalRequest.expiresAt.getTime() <= now.getTime()) {
    await prisma.loginApprovalRequest.update({
      where: { id: approvalRequest.id },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json({ error: "Request expired", status: "EXPIRED" }, { status: 410 });
  }

  if (parsed.data.action === "deny") {
    await prisma.loginApprovalRequest.update({
      where: { id: approvalRequest.id },
      data: {
        status: "DENIED",
        deniedAt: now,
      },
    });

    return NextResponse.json({ status: "DENIED" });
  }

  const transferred = await prisma.$transaction(async (tx) => {
    const lockResult = await tx.user.updateMany({
      where: {
        id: userId,
        activeSessionId: approvalRequest.currentSessionId,
      },
      data: {
        activeSessionId: approvalRequest.requestedSessionId,
        activeSessionExpiresAt: new Date(now.getTime() + SESSION_LOCK_TTL_MS),
      },
    });

    if (lockResult.count === 0) {
      return false;
    }

    await tx.loginApprovalRequest.update({
      where: { id: approvalRequest.id },
      data: {
        status: "APPROVED",
        approvedAt: now,
      },
    });

    return true;
  });

  if (!transferred) {
    return NextResponse.json({ error: "Current session is no longer active" }, { status: 409 });
  }

  return NextResponse.json({ status: "APPROVED" });
}
