import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { SESSION_LOCK_TTL_MS } from "@/lib/auth/session-lock";
import { finalizeDeviceApprovalRequest } from "@/lib/auth/device-approval-lifecycle";

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
    await finalizeDeviceApprovalRequest(prisma, {
      requestId: approvalRequest.id,
      userId,
      outcome: "EXPIRED",
      now,
    });
    return NextResponse.json({ error: "Request expired", status: "EXPIRED" }, { status: 410 });
  }

  if (parsed.data.action === "deny") {
    await finalizeDeviceApprovalRequest(prisma, {
      requestId: approvalRequest.id,
      userId,
      outcome: "DENIED",
      now,
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

    const finalized = await finalizeDeviceApprovalRequest(tx, {
      requestId: approvalRequest.id,
      userId,
      outcome: "APPROVED",
      now,
    });

    return finalized;
  });

  if (!transferred) {
    return NextResponse.json({ error: "Current session is no longer active" }, { status: 409 });
  }

  return NextResponse.json({ status: "APPROVED" });
}
