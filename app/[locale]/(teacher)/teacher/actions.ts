"use server";

import { UserRole } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";
import { requireRole } from "@/lib/permissions";
import { paginateQuery } from "@/lib/pagination";
import { containsInsensitive } from "@/lib/table-filters";
import {
  createTimetableNowContext,
  getTimetableSlotState,
} from "@/lib/teacher-timetable-highlight";
import { emptyToNull, formDataToObject } from "@/lib/form-utils";
import { revalidateLocalizedPath } from "@/lib/revalidate";
import {
  enrollmentAttendanceSchema,
  enrollmentProgressSchema,
} from "@/lib/validators";

export type TeacherActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export type TeacherTimetableFilters = {
  q?: string;
  dayOfWeek?: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
};

export type TeacherAttendanceFilters = {
  q?: string;
  studentId?: string;
  sectionId?: string;
  status?: "PRESENT" | "ABSENT" | "LATE" | "LEAVE";
  date?: Date;
  dateFrom?: Date;
  dateTo?: Date;
};

export type TeacherStudentFilters = {
  q?: string;
  sectionId?: string;
  status?: "ACTIVE" | "COMPLETED" | "DROPPED";
};

type TeacherScope = {
  schoolId: string;
  userId: string;
  staffId: string | null;
  staffName: string | null;
};

async function getTeacherScope(): Promise<TeacherScope> {
  const session = await requireRole([UserRole.TEACHER]);
  const schoolId = session.user.schoolId;
  if (!schoolId) {
    return {
      schoolId: "",
      userId: session.user.id,
      staffId: null,
      staffName: null,
    };
  }

  const staffProfile = await prisma.staff.findFirst({
    where: { userId: session.user.id, schoolId },
    select: { id: true, name: true },
  });

  return {
    schoolId,
    userId: session.user.id,
    staffId: staffProfile?.id ?? null,
    staffName: staffProfile?.name ?? null,
  };
}

export async function requireTeacherAccess() {
  return getTeacherScope();
}

export async function getTeacherSections() {
  const scope = await getTeacherScope();
  if (!scope.schoolId || !scope.staffId) return [];
  const nowContext = createTimetableNowContext(new Date());

  const sections = await prisma.sectionStaff.findMany({
    where: {
      staffId: scope.staffId,
      section: { schoolId: scope.schoolId },
    },
    orderBy: [
      { section: { class: { name: "asc" } } },
      { section: { name: "asc" } },
    ],
    select: {
      section: {
        select: {
          id: true,
          name: true,
          room: true,
          capacity: true,
          meetingLink: true,
          class: { select: { name: true } },
          enrollments: {
            where: { status: "ACTIVE" },
            select: { id: true },
          },
          timetables: {
            where: { dayOfWeek: nowContext.dayOfWeek },
            select: {
              dayOfWeek: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      },
    },
  });

  return sections.map((item) => ({
    id: item.section.id,
    name: item.section.name,
    room: item.section.room,
    capacity: item.section.capacity,
    meetingLink: item.section.meetingLink,
    className: item.section.class.name,
    activeStudents: item.section.enrollments.length,
    isActiveNow: item.section.timetables.some(
      (slot) => getTimetableSlotState(slot, nowContext) === "active",
    ),
  }));
}

export async function getTeacherSectionDetail(sectionId: string) {
  const scope = await getTeacherScope();
  if (!scope.schoolId || !scope.staffId || !sectionId) return null;

  const mapping = await prisma.sectionStaff.findFirst({
    where: {
      staffId: scope.staffId,
      sectionId,
      section: { schoolId: scope.schoolId },
    },
    select: {
      section: {
        select: {
          id: true,
          name: true,
          room: true,
          capacity: true,
          meetingLink: true,
          class: { select: { name: true } },
          timetables: {
            orderBy: [
              { dayOfWeek: "asc" },
              { startTime: "asc" },
              { createdAt: "desc" },
            ],
            select: {
              id: true,
              dayOfWeek: true,
              startTime: true,
              endTime: true,
              room: true,
              staff: { select: { id: true, name: true } },
            },
          },
          enrollments: {
            orderBy: [{ status: "asc" }, { student: { name: "asc" } }],
            select: {
              id: true,
              status: true,
              student: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!mapping) return null;

  const section = mapping.section;
  const activeStudents = section.enrollments.filter(
    (row) => row.status === "ACTIVE",
  ).length;

  return {
    id: section.id,
    name: section.name,
    room: section.room,
    capacity: section.capacity,
    meetingLink: section.meetingLink,
    className: section.class.name,
    activeStudents,
    timetable: section.timetables,
    students: section.enrollments,
  };
}

export async function getTeacherTimetable({
  page,
  filters,
}: {
  page: number;
  filters?: TeacherTimetableFilters;
}) {
  const scope = await getTeacherScope();
  if (!scope.schoolId || !scope.staffId) {
    return {
      items: [],
      page,
      pageSize: 10,
      totalCount: 0,
      totalPages: 1,
    };
  }

  const where: Record<string, unknown> = {
    schoolId: scope.schoolId,
    staffId: scope.staffId,
    ...(filters?.dayOfWeek ? { dayOfWeek: filters.dayOfWeek } : {}),
  };

  if (filters?.q) {
    where.OR = [
      { section: { name: containsInsensitive(filters.q) } },
      { section: { class: { name: containsInsensitive(filters.q) } } },
      { room: containsInsensitive(filters.q) },
    ];
  }

  return paginateQuery({
    page,
    count: () => prisma.timetable.count({ where }),
    query: ({ skip, take }) =>
      prisma.timetable.findMany({
        where,
        orderBy: [
          { dayOfWeek: "asc" },
          { startTime: "asc" },
          { createdAt: "desc" },
        ],
        skip,
        take,
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          room: true,
          section: {
            select: {
              id: true,
              name: true,
              meetingLink: true,
              class: { select: { name: true } },
            },
          },
        },
      }),
  });
}

export async function getTeacherAttendanceFormOptions() {
  const scope = await getTeacherScope();
  if (!scope.schoolId || !scope.staffId) {
    return { enrollments: [], students: [], sections: [] };
  }

  const [enrollments, students, sections] = await Promise.all([
    prisma.enrollment.findMany({
      where: {
        schoolId: scope.schoolId,
        section: {
          staffMappings: {
            some: { staffId: scope.staffId },
          },
        },
      },
      orderBy: [
        { section: { class: { name: "asc" } } },
        { student: { name: "asc" } },
      ],
      select: {
        id: true,
        student: { select: { id: true, name: true } },
        section: {
          select: {
            id: true,
            name: true,
            class: { select: { name: true } },
          },
        },
      },
    }),
    prisma.student.findMany({
      where: {
        schoolId: scope.schoolId,
        enrollments: {
          some: {
            section: {
              staffMappings: {
                some: { staffId: scope.staffId },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.section.findMany({
      where: {
        schoolId: scope.schoolId,
        staffMappings: {
          some: { staffId: scope.staffId },
        },
      },
      orderBy: [{ class: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        class: { select: { name: true } },
      },
    }),
  ]);

  return {
    enrollments: enrollments.map((row) => ({
      id: row.id,
      label: `${row.student.name} • ${row.section.class.name} • ${row.section.name}`,
    })),
    students,
    sections: sections.map((section) => ({
      id: section.id,
      name: section.name,
      class: section.class,
    })),
  };
}

export async function markTeacherAttendance(
  _prevState: TeacherActionState,
  formData: FormData,
): Promise<TeacherActionState> {
  const scope = await getTeacherScope();
  if (!scope.schoolId || !scope.staffId) {
    return {
      status: "error",
      message: "Your staff profile is not linked yet.",
    };
  }

  const raw = formDataToObject(formData);
  const parsed = enrollmentAttendanceSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id: parsed.data.enrollmentId,
      schoolId: scope.schoolId,
      section: {
        staffMappings: {
          some: { staffId: scope.staffId },
        },
      },
    },
    select: { id: true },
  });

  if (!enrollment) {
    return {
      status: "error",
      message: "You can only mark attendance for assigned sections.",
    };
  }

  try {
    await prisma.attendance.upsert({
      where: {
        enrollmentId_date: {
          enrollmentId: parsed.data.enrollmentId,
          date: parsed.data.date,
        },
      },
      create: {
        schoolId: scope.schoolId,
        enrollmentId: parsed.data.enrollmentId,
        date: parsed.data.date,
        status: parsed.data.status,
      },
      update: {
        status: parsed.data.status,
      },
    });
  } catch {
    return { status: "error", message: "Unable to save attendance." };
  }

  revalidateLocalizedPath("/teacher/attendance");
  revalidateLocalizedPath("/teacher/students");
  revalidateLocalizedPath("/teacher/dashboard");
  return { status: "success", message: "Attendance saved." };
}

export async function getTeacherPaginatedAttendanceRecords({
  page,
  filters,
}: {
  page: number;
  filters?: TeacherAttendanceFilters;
}) {
  const scope = await getTeacherScope();
  if (!scope.schoolId || !scope.staffId) {
    return {
      items: [],
      page,
      pageSize: 10,
      totalCount: 0,
      totalPages: 1,
    };
  }

  const where: Record<string, unknown> = {
    schoolId: scope.schoolId,
    ...(filters?.status ? { status: filters.status } : {}),
    ...(filters?.date ? { date: filters.date } : {}),
    ...(filters?.dateFrom || filters?.dateTo
      ? {
          date: {
            ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
            ...(filters.dateTo ? { lte: filters.dateTo } : {}),
          },
        }
      : {}),
    enrollment: {
      ...(filters?.sectionId ? { sectionId: filters.sectionId } : {}),
      ...(filters?.studentId ? { studentId: filters.studentId } : {}),
      section: {
        staffMappings: {
          some: { staffId: scope.staffId },
        },
      },
    },
  };

  if (filters?.q) {
    where.OR = [
      { enrollment: { student: { name: containsInsensitive(filters.q) } } },
      { enrollment: { section: { name: containsInsensitive(filters.q) } } },
      {
        enrollment: {
          section: { class: { name: containsInsensitive(filters.q) } },
        },
      },
    ];
  }

  return paginateQuery({
    page,
    count: () => prisma.attendance.count({ where }),
    query: ({ skip, take }) =>
      prisma.attendance.findMany({
        where,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        skip,
        take,
        select: {
          id: true,
          date: true,
          status: true,
          enrollment: {
            select: {
              student: { select: { id: true, name: true } },
              section: {
                select: {
                  id: true,
                  name: true,
                  class: { select: { name: true } },
                },
              },
            },
          },
        },
      }),
  });
}

export async function getTeacherPaginatedStudents({
  page,
  filters,
}: {
  page: number;
  filters?: TeacherStudentFilters;
}) {
  const scope = await getTeacherScope();
  if (!scope.schoolId || !scope.staffId) {
    return {
      items: [],
      page,
      pageSize: 10,
      totalCount: 0,
      totalPages: 1,
    };
  }

  const where: Record<string, unknown> = {
    schoolId: scope.schoolId,
    ...(filters?.status ? { status: filters.status } : {}),
    ...(filters?.sectionId ? { sectionId: filters.sectionId } : {}),
    section: {
      staffMappings: {
        some: { staffId: scope.staffId },
      },
    },
  };

  if (filters?.q) {
    where.OR = [
      { student: { name: containsInsensitive(filters.q) } },
      { section: { name: containsInsensitive(filters.q) } },
      { section: { class: { name: containsInsensitive(filters.q) } } },
    ];
  }

  return paginateQuery({
    page,
    count: () => prisma.enrollment.count({ where }),
    query: ({ skip, take }) =>
      prisma.enrollment.findMany({
        where,
        orderBy: [{ student: { name: "asc" } }, { createdAt: "desc" }],
        skip,
        take,
        select: {
          id: true,
          status: true,
          student: {
            select: {
              id: true,
              name: true,
              gender: true,
              phone: true,
            },
          },
          section: {
            select: {
              id: true,
              name: true,
              class: { select: { name: true } },
            },
          },
          progress: {
            select: {
              progress: true,
              remark: true,
              updatedAt: true,
            },
            take: 1,
          },
        },
      }),
  });
}

export async function updateTeacherProgress(
  _prevState: TeacherActionState,
  formData: FormData,
): Promise<TeacherActionState> {
  const scope = await getTeacherScope();
  if (!scope.schoolId || !scope.staffId) {
    return {
      status: "error",
      message: "Your staff profile is not linked yet.",
    };
  }

  const raw = formDataToObject(formData);
  const parsed = enrollmentProgressSchema.safeParse({
    ...raw,
    remark: emptyToNull(raw.remark as string | undefined),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id: parsed.data.enrollmentId,
      schoolId: scope.schoolId,
      section: {
        staffMappings: {
          some: { staffId: scope.staffId },
        },
      },
    },
    select: { id: true },
  });

  if (!enrollment) {
    return {
      status: "error",
      message: "You can only update progress for assigned sections.",
    };
  }

  try {
    await prisma.progress.upsert({
      where: { enrollmentId: parsed.data.enrollmentId },
      create: {
        schoolId: scope.schoolId,
        enrollmentId: parsed.data.enrollmentId,
        progress: parsed.data.progress,
        remark: parsed.data.remark,
      },
      update: {
        progress: parsed.data.progress,
        remark: parsed.data.remark,
      },
    });
  } catch {
    return { status: "error", message: "Unable to save progress." };
  }

  revalidateLocalizedPath("/teacher/students");
  revalidateLocalizedPath("/teacher/dashboard");
  return { status: "success", message: "Progress updated." };
}
