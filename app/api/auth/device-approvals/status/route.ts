import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json({ status: "INVALID" }, { status: 400 });
  }

  const approvalRequest = await prisma.loginApprovalRequest.findUnique({
    where: { publicToken: token },
    select: {
      status: true,
    },
  });

  if (!approvalRequest) {
    return NextResponse.json({ status: "INVALID" }, { status: 404 });
  }

  return NextResponse.json({ status: approvalRequest.status });
}
