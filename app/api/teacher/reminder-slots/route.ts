import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });
  const userId = typeof token?.id === "string" ? token.id : null;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      schoolId: true,
    },
  });

  if (!user || user.role !== UserRole.TEACHER || !user.schoolId) {
    return NextResponse.json({ items: [] });
  }

  const staff = await prisma.staff.findFirst({
    where: {
      userId,
      schoolId: user.schoolId,
    },
    select: { id: true },
  });

  if (!staff) {
    return NextResponse.json({ items: [] });
  }

  const items = await prisma.timetable.findMany({
    where: {
      schoolId: user.schoolId,
      staffId: staff.id,
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    select: {
      id: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      section: {
        select: {
          name: true,
          class: {
            select: { name: true },
          },
        },
      },
    },
  });

  return NextResponse.json({ items });
}
