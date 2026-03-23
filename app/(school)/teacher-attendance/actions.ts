"use server";

import { revalidatePath } from "next/cache";
import { Permission } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";
import { formDataToObject } from "@/lib/form-utils";
import { requirePermission, requireTenant } from "@/lib/rbac";
import { teacherAttendanceSchema } from "@/lib/validators";

export type TeacherAttendanceActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function getTeacherAttendance() {
  await requirePermission(Permission.MANAGE_TEACHERS);
  const tenantId = await requireTenant();

  return prisma.teacherAttendance.findMany({
    where: { tenantId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 200,
    select: {
      id: true,
      date: true,
      status: true,
      teacher: { select: { id: true, name: true } },
      section: {
        select: {
          id: true,
          name: true,
          class: { select: { id: true, name: true } },
        },
      },
      createdAt: true,
    },
  });
}

export async function markTeacherAttendance(
  _prev: TeacherAttendanceActionState,
  formData: FormData,
): Promise<TeacherAttendanceActionState> {
  await requirePermission(Permission.MANAGE_TEACHERS);
  const tenantId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = teacherAttendanceSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const [teacher, section, mapping] = await Promise.all([
    prisma.teacher.findFirst({
      where: { id: parsed.data.teacherId, tenantId },
      select: { id: true },
    }),
    prisma.section.findFirst({
      where: { id: parsed.data.sectionId, tenantId },
      select: { id: true },
    }),
    prisma.sectionTeacher.findFirst({
      where: {
        teacherId: parsed.data.teacherId,
        sectionId: parsed.data.sectionId,
      },
      select: { id: true },
    }),
  ]);

  if (!teacher) return { status: "error", message: "Selected teacher is invalid." };
  if (!section) return { status: "error", message: "Selected section is invalid." };
  if (!mapping) {
    return {
      status: "error",
      message: "Teacher must be assigned to the section before marking attendance.",
    };
  }

  try {
    await prisma.teacherAttendance.upsert({
      where: {
        teacherId_sectionId_date: {
          teacherId: parsed.data.teacherId,
          sectionId: parsed.data.sectionId,
          date: parsed.data.date,
        },
      },
      create: {
        tenantId,
        teacherId: parsed.data.teacherId,
        sectionId: parsed.data.sectionId,
        date: parsed.data.date,
        status: parsed.data.status,
      },
      update: {
        status: parsed.data.status,
      },
    });
  } catch {
    return { status: "error", message: "Unable to save teacher attendance." };
  }

  revalidatePath("/teacher-attendance");
  return { status: "success", message: "Teacher attendance saved." };
}

