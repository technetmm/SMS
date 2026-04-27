import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole } from "@/app/generated/prisma/enums";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { SESSION_LOCK_TTL_MS } from "@/lib/auth/session-lock";
import { finalizeDeviceApprovalRequest } from "@/lib/auth/device-approval-lifecycle";
import { canApproveDeviceRequest } from "@/lib/auth/device-approval-queue";

const requestSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(["approve", "deny"]),
});

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request });
  const approverId = typeof token?.id === "string" ? token.id : null;
  const approverSessionId =
    typeof token?.sessionId === "string" ? token.sessionId : null;
  const approverRole = token?.role;
  const approverSchoolId =
    typeof token?.schoolId === "string" ? token.schoolId : null;

  if (!approverId || typeof approverRole !== "string") {
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
    },
    select: {
      id: true,
      userId: true,
      status: true,
      currentSessionId: true,
      requestedSessionId: true,
      user: {
        select: {
          role: true,
          schoolId: true,
        },
      },
    },
  });

  if (!approvalRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const canSelfApproveCurrentSession =
    approvalRequest.userId === approverId &&
    Boolean(approverSessionId) &&
    approverSessionId === approvalRequest.currentSessionId;

  const canRoleApprove = canApproveDeviceRequest(
    {
      role: approverRole as UserRole,
      schoolId: approverSchoolId,
    },
    {
      role: approvalRequest.user.role,
      schoolId: approvalRequest.user.schoolId,
    },
  );

  if (!canSelfApproveCurrentSession && !canRoleApprove) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (approvalRequest.status !== "PENDING") {
    return NextResponse.json(
      { error: "Request already handled", status: approvalRequest.status },
      { status: 409 },
    );
  }

  if (parsed.data.action === "deny") {
    await finalizeDeviceApprovalRequest(prisma, {
      requestId: approvalRequest.id,
      userId: approvalRequest.userId,
      outcome: "DENIED",
      now,
    });

    return NextResponse.json({ status: "DENIED" });
  }

  const transferred = await prisma.$transaction(async (tx) => {
    const lockResult = await tx.user.updateMany({
      where: {
        id: approvalRequest.userId,
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
      userId: approvalRequest.userId,
      outcome: "APPROVED",
      now,
    });

    return finalized;
  });

  if (!transferred) {
    return NextResponse.json(
      { error: "Current session is no longer active" },
      { status: 409 },
    );
  }

  return NextResponse.json({ status: "APPROVED" });
}
