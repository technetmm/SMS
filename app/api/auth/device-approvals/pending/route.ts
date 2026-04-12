import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole } from "@/app/generated/prisma/enums";
import { getPendingDeviceApprovalRows } from "@/lib/auth/device-approval-queue";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });
  const userId = typeof token?.id === "string" ? token.id : null;
  const role = token?.role;
  const schoolId =
    typeof token?.schoolId === "string" ? token.schoolId : null;

  if (!userId || typeof role !== "string") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await getPendingDeviceApprovalRows({
    role: role as UserRole,
    schoolId,
  });

  return NextResponse.json({ requests });
}
