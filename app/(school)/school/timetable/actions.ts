"use server";

import { revalidatePath } from "next/cache";
import { DayOfWeek} from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";
import { formDataToObject } from "@/lib/form-utils";
import { paginateQuery } from "@/lib/pagination";
import { requireSchoolAdminAccess, requireTenant } from "@/lib/rbac";
import { timetableSlotSchema } from "@/lib/validators";
import { rangesOverlap } from "@/lib/time";

export type TimetableActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function getTimetable() {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  return prisma.timetable.findMany({
    where: { schoolId },
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
      section: { select: { id: true, name: true, class: { select: { id: true, name: true } } } },
      createdAt: true,
    },
  });
}

export async function getPaginatedTimetable({ page }: { page: number }) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  return paginateQuery({
    page,
    count: () => prisma.timetable.count({ where: { schoolId } }),
    query: ({ skip, take }) =>
      prisma.timetable.findMany({
        where: { schoolId },
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
      }),
  });
}

async function assertNoStaffConflict(input: {
  schoolId: string;
  staffId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  ignoreId?: string;
}) {
  const conflicts = await prisma.timetable.findMany({
    where: {
      schoolId: input.schoolId,
      staffId: input.staffId,
      dayOfWeek: input.dayOfWeek,
      ...(input.ignoreId ? { id: { not: input.ignoreId } } : {}),
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      section: { select: { id: true, name: true } },
    },
  });

  const conflict = conflicts.find((slot) =>
    rangesOverlap(slot.startTime, slot.endTime, input.startTime, input.endTime),
  );

  if (conflict) {
    throw new Error(
      `Staff is already scheduled for ${conflict.section.name} (${conflict.startTime}-${conflict.endTime}).`,
    );
  }
}

export async function createTimetableSlot(
  _prev: TimetableActionState,
  formData: FormData,
): Promise<TimetableActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = timetableSlotSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const [section, staff, mapping] = await Promise.all([
    prisma.section.findFirst({
      where: { id: parsed.data.sectionId, schoolId },
      select: { id: true },
    }),
    prisma.staff.findFirst({
      where: { id: parsed.data.staffId, schoolId },
      select: { id: true },
    }),
    prisma.sectionStaff.findFirst({
      where: { sectionId: parsed.data.sectionId, staffId: parsed.data.staffId },
      select: { id: true },
    }),
  ]);

  if (!section) return { status: "error", message: "Selected section is invalid." };
  if (!staff) return { status: "error", message: "Selected staff is invalid." };
  if (!mapping) {
    return {
      status: "error",
      message: "Staff must be assigned to the section before scheduling.",
    };
  }

  try {
    await assertNoStaffConflict({
      schoolId,
      staffId: parsed.data.staffId,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
    });

    await prisma.timetable.create({
      data: {
        schoolId,
        sectionId: parsed.data.sectionId,
        staffId: parsed.data.staffId,
        dayOfWeek: parsed.data.dayOfWeek,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        room: parsed.data.room || null,
      },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to create timetable slot.",
    };
  }

  revalidatePath("/school/timetable");
  revalidatePath("/school/sections");
  return { status: "success", message: "Timetable slot created." };
}

export async function updateTimetableSlot(
  _prev: TimetableActionState,
  formData: FormData,
): Promise<TimetableActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = timetableSlotSchema.safeParse(raw);
  if (!parsed.success || !parsed.data.id) {
    return { status: "error", message: parsed.success ? "Slot id is required." : parsed.error.errors[0]?.message };
  }

  const existing = await prisma.timetable.findFirst({
    where: { id: parsed.data.id, schoolId },
    select: { id: true },
  });
  if (!existing) return { status: "error", message: "Timetable slot not found." };

  try {
    await assertNoStaffConflict({
      schoolId,
      staffId: parsed.data.staffId,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      ignoreId: parsed.data.id,
    });

    await prisma.timetable.update({
      where: { id: parsed.data.id },
      data: {
        sectionId: parsed.data.sectionId,
        staffId: parsed.data.staffId,
        dayOfWeek: parsed.data.dayOfWeek,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        room: parsed.data.room || null,
      },
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to update timetable slot.",
    };
  }

  revalidatePath("/school/timetable");
  revalidatePath("/school/sections");
  return { status: "success", message: "Timetable slot updated." };
}

export async function deleteTimetableSlot(formData: FormData) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Slot id is required.");

  const slot = await prisma.timetable.findFirst({
    where: { id, schoolId },
    select: { id: true },
  });

  if (!slot) throw new Error("Timetable slot not found.");
  await prisma.timetable.delete({ where: { id } });
  revalidatePath("/school/timetable");
}

export async function moveTimetableSlot(id: string, dayOfWeek: DayOfWeek) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  if (!id) {
    return { status: "error" as const, message: "Slot id is required." };
  }

  const slot = await prisma.timetable.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      staffId: true,
      startTime: true,
      endTime: true,
    },
  });

  if (!slot) {
    return { status: "error" as const, message: "Timetable slot not found." };
  }

  try {
    await assertNoStaffConflict({
      schoolId,
      staffId: slot.staffId,
      dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      ignoreId: slot.id,
    });

    await prisma.timetable.update({
      where: { id: slot.id },
      data: { dayOfWeek },
    });
  } catch (error) {
    return {
      status: "error" as const,
      message: error instanceof Error ? error.message : "Unable to move slot.",
    };
  }

  revalidatePath("/school/timetable");
  return { status: "success" as const };
}
