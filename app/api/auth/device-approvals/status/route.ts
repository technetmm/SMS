import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { finalizeDeviceApprovalRequest } from "@/lib/auth/device-approval-lifecycle";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json({ status: "INVALID" }, { status: 400 });
  }

  const approvalRequest = await prisma.loginApprovalRequest.findUnique({
    where: { publicToken: token },
    select: {
      id: true,
      userId: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!approvalRequest) {
    return NextResponse.json({ status: "INVALID" }, { status: 404 });
  }

  const now = new Date();
  if (approvalRequest.status === "PENDING" && approvalRequest.expiresAt.getTime() <= now.getTime()) {
    await finalizeDeviceApprovalRequest(prisma, {
      requestId: approvalRequest.id,
      userId: approvalRequest.userId,
      outcome: "EXPIRED",
      now,
    });
    return NextResponse.json({ status: "EXPIRED" });
  }

  return NextResponse.json({ status: approvalRequest.status });
}
