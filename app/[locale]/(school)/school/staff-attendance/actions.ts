"use server";

import { revalidateLocalizedPath } from "@/lib/revalidate";
import { prisma } from "@/lib/prisma/client";
import { formDataToObject } from "@/lib/form-utils";
import { paginateQuery } from "@/lib/pagination";
import { requireSchoolAdminAccess, requireTenant } from "@/lib/rbac";
import { staffAttendanceSchema } from "@/lib/validators";
import { containsInsensitive } from "@/lib/table-filters";

export type StaffAttendanceActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  msgID?: number;
};

export type StaffAttendanceTableFilters = {
  q?: string;
  status?: "PRESENT" | "ABSENT" | "LATE" | "LEAVE";
  dateFrom?: Date;
  dateTo?: Date;
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

export async function getPaginatedStaffAttendance({
  page,
  filters,
}: {
  page: number;
  filters?: StaffAttendanceTableFilters;
}) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();
  const where: Record<string, unknown> = { schoolId };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.dateFrom || filters?.dateTo) {
    where.date = {
      ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
      ...(filters.dateTo ? { lte: filters.dateTo } : {}),
    };
  }

  if (filters?.q) {
    where.OR = [
      { staff: { name: containsInsensitive(filters.q) } },
      { section: { name: containsInsensitive(filters.q) } },
      { section: { class: { name: containsInsensitive(filters.q) } } },
    ];
  }

  return paginateQuery({
    page,
    count: () => prisma.staffAttendance.count({ where }),
    query: ({ skip, take }) =>
      prisma.staffAttendance.findMany({
        where,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        skip,
        take,
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
          remark: true,
          createdAt: true,
        },
      }),
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
    return {
      status: "error",
      message: parsed.error.errors[0]?.message,
      msgID: Date.now(),
    };
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

  if (!staff)
    return {
      status: "error",
      message: "Selected staff is invalid.",
      msgID: Date.now(),
    };
  if (!section)
    return {
      status: "error",
      message: "Selected section is invalid.",
      msgID: Date.now(),
    };
  if (!mapping) {
    return {
      status: "error",
      message:
        "Staff must be assigned to the section before marking attendance.",
      msgID: Date.now(),
    };
  }

  const existingAttendance = await prisma.staffAttendance.findFirst({
    where: {
      staffId: parsed.data.staffId,
      sectionId: parsed.data.sectionId,
      date: parsed.data.date,
    },
    select: { id: true },
  });

  if (existingAttendance) {
    return {
      status: "error",
      message: "Attendance already marked for this staff and section.",
      msgID: Date.now(),
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
        remark: parsed.data.remark,
      },
      update: {
        status: parsed.data.status,
        remark: parsed.data.remark,
      },
    });
  } catch {
    return {
      status: "error",
      message: "Unable to save staff attendance.",
      msgID: Date.now(),
    };
  }

  revalidateLocalizedPath("/school/staff-attendance");
  return {
    status: "success",
    message: "Staff attendance saved.",
    msgID: Date.now(),
  };
}

export async function getSectionsByStaffAndDay(
  staffId: string,
  dayOfWeek: string,
) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  // Get timetables for this staff on the specified day of week
  const timetables = await prisma.timetable.findMany({
    where: {
      staffId,
      dayOfWeek: dayOfWeek as any, // Cast to any to handle enum type
    },
    select: {
      sectionId: true,
    },
  });

  if (timetables.length === 0) {
    return [];
  }

  // Get unique section IDs
  const sectionIds = [...new Set(timetables.map((t) => t.sectionId))];

  // Get sections details
  const sections = await prisma.section.findMany({
    where: {
      id: { in: sectionIds },
      schoolId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  return sections;
}

export async function deleteStaffAttendance(
  _prev: StaffAttendanceActionState,
  formData: FormData,
): Promise<StaffAttendanceActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const attendanceId = formData.get("id") as string;
  if (!attendanceId) {
    return {
      status: "error",
      message: "Attendance ID is required.",
      msgID: Date.now(),
    };
  }

  // Verify the attendance record belongs to the school
  const existingAttendance = await prisma.staffAttendance.findFirst({
    where: {
      id: attendanceId,
      schoolId,
    },
    select: { id: true },
  });

  if (!existingAttendance) {
    return {
      status: "error",
      message: "Attendance record not found.",
      msgID: Date.now(),
    };
  }

  try {
    await prisma.staffAttendance.delete({
      where: { id: attendanceId },
    });
  } catch {
    return {
      status: "error",
      message: "Unable to delete staff attendance.",
      msgID: Date.now(),
    };
  }

  revalidateLocalizedPath("/school/staff-attendance");
  return {
    status: "success",
    message: "Staff attendance deleted successfully.",
    msgID: Date.now(),
  };
}

export async function getAssignedStaffs() {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const staff = await prisma.staff.findMany({
    where: {
      schoolId,
      sections: {
        some: { staffId: { not: "" } },
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  return staff;
}
