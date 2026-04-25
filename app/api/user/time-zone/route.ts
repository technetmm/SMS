import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma/client";
import { normalizeTimeZone } from "@/lib/time-zone";

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request });
  const userId = typeof token?.id === "string" ? token.id : null;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { timeZone?: unknown } = {};
  try {
    payload = (await request.json()) as { timeZone?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const incomingTimeZone =
    typeof payload.timeZone === "string" ? payload.timeZone : null;
  const timeZone = normalizeTimeZone(incomingTimeZone);

  if (!timeZone) {
    return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
  }

  const result = await prisma.user.updateMany({
    where: {
      id: userId,
      OR: [{ timeZone: null }, { timeZone: { not: timeZone } }],
    },
    data: { timeZone },
  });

  return NextResponse.json({
    success: true,
    updated: result.count > 0,
    timeZone,
  });
}
