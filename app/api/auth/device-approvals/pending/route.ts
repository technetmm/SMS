import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma/client";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });
  const userId = typeof token?.id === "string" ? token.id : null;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  await prisma.loginApprovalRequest.updateMany({
    where: {
      userId,
      status: "PENDING",
      expiresAt: { lte: now },
    },
    data: { status: "EXPIRED" },
  });

  const requests = await prisma.loginApprovalRequest.findMany({
    where: {
      userId,
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
