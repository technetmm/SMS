"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma/client";
import { formDataToObject } from "@/lib/form-utils";
import { requireSchoolAdminAccess, requireTenant } from "@/lib/rbac";
import { staffAttendanceSchema } from "@/lib/validators";

export type StaffAttendanceActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function getStaffAttendance() {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  return prisma.staffAttendance.findMany({
    where: { schoolId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 200,
    select: {
      id: true,
      date: true,
      status: true,
      staff: { select: { id: true, name: true } },
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

export async function markStaffAttendance(
  _prev: StaffAttendanceActionState,
  formData: FormData,
): Promise<StaffAttendanceActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = staffAttendanceSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const [staff, section, mapping] = await Promise.all([
    prisma.staff.findFirst({
      where: { id: parsed.data.staffId, schoolId },
      select: { id: true },
    }),
    prisma.section.findFirst({
      where: { id: parsed.data.sectionId, schoolId },
      select: { id: true },
    }),
    prisma.sectionStaff.findFirst({
      where: {
        staffId: parsed.data.staffId,
        sectionId: parsed.data.sectionId,
      },
      select: { id: true },
    }),
  ]);

  if (!staff) return { status: "error", message: "Selected staff is invalid." };
  if (!section) return { status: "error", message: "Selected section is invalid." };
  if (!mapping) {
    return {
      status: "error",
      message: "Staff must be assigned to the section before marking attendance.",
    };
  }

  try {
    await prisma.staffAttendance.upsert({
      where: {
        staffId_sectionId_date: {
          staffId: parsed.data.staffId,
          sectionId: parsed.data.sectionId,
          date: parsed.data.date,
        },
      },
      create: {
        schoolId,
        staffId: parsed.data.staffId,
        sectionId: parsed.data.sectionId,
        date: parsed.data.date,
        status: parsed.data.status,
      },
      update: {
        status: parsed.data.status,
      },
    });
  } catch {
    return { status: "error", message: "Unable to save staff attendance." };
  }

  revalidatePath("/staff-attendance");
  return { status: "success", message: "Staff attendance saved." };
}

