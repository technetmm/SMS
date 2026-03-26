"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma/client";
import { emptyToUndefined, formDataToObject } from "@/lib/form-utils";
import { sectionMultiTeacherSchema } from "@/lib/validators";
import { requireSchoolAdmin } from "@/lib/permissions";
import { requireTenantId } from "@/lib/tenant";

export type SectionActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function parseSectionInput(formData: FormData) {
  const raw = formDataToObject(formData);
  const teacherIds = formData
    .getAll("teacherIds")
    .map((value) => String(value))
    .filter(Boolean);

  return sectionMultiTeacherSchema.safeParse({
    id: raw.id,
    classId: raw.classId,
    name: raw.name,
    teacherIds: Array.from(new Set(teacherIds)),
    room: emptyToUndefined(raw.room as string | undefined),
    capacity: raw.capacity,
  });
}

async function validateTenantReferences(
  tenantId: string,
  classId: string,
  teacherIds: string[],
) {
  const [klass, teachers] = await Promise.all([
    prisma.class.findFirst({
      where: { id: classId, tenantId },
      select: { id: true },
    }),
    teacherIds.length
      ? prisma.teacher.findMany({
          where: { id: { in: teacherIds }, tenantId },
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);

  if (!klass) {
    return { ok: false as const, message: "Selected class is invalid." };
  }
  if (teachers.length !== teacherIds.length) {
    return {
      ok: false as const,
      message: "One or more selected teachers are invalid.",
    };
  }
  return { ok: true as const };
}

export async function createSection(
  _prevState: SectionActionState,
  formData: FormData,
): Promise<SectionActionState> {
  await requireSchoolAdmin();
  const tenantId = await requireTenantId();

  const parsed = parseSectionInput(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const tenantCheck = await validateTenantReferences(
    tenantId,
    parsed.data.classId,
    parsed.data.teacherIds,
  );
  if (!tenantCheck.ok) return { status: "error", message: tenantCheck.message };

  try {
    await prisma.$transaction(async (tx) => {
      const section = await tx.section.create({
        data: {
          tenantId,
          classId: parsed.data.classId,
          name: parsed.data.name,
          room: parsed.data.room,
          capacity: parsed.data.capacity,
        },
      });

      if (parsed.data.teacherIds.length > 0) {
        await tx.sectionTeacher.createMany({
          data: parsed.data.teacherIds.map((teacherId) => ({
            sectionId: section.id,
            teacherId,
          })),
          skipDuplicates: true,
        });
      }
    });
  } catch {
    return { status: "error", message: "Unable to create section." };
  }

  revalidatePath("/sections");
  revalidatePath("/classes");
  return { status: "success", message: "Section created successfully." };
}

export async function getSections() {
  await requireSchoolAdmin();
  const tenantId = await requireTenantId();

  return prisma.section.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      room: true,
      capacity: true,
      createdAt: true,
      enrollments: {
        select: {
          status: true,
        },
      },
      class: { select: { id: true, name: true } },
      teacherMappings: {
        select: {
          teacher: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

export async function getSectionById(id: string) {
  await requireSchoolAdmin();
  const tenantId = await requireTenantId();
  if (!id) return null;

  return prisma.section.findFirst({
    where: { id, tenantId },
    select: {
      id: true,
      name: true,
      classId: true,
      room: true,
      capacity: true,
      teacherMappings: {
        select: {
          teacher: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

export async function updateSection(
  _prevState: SectionActionState,
  formData: FormData,
): Promise<SectionActionState> {
  await requireSchoolAdmin();
  const tenantId = await requireTenantId();

  const parsed = parseSectionInput(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }
  if (!parsed.data.id) {
    return { status: "error", message: "Section id is required." };
  }

  const [existingSection, tenantCheck] = await Promise.all([
    prisma.section.findFirst({
      where: { id: parsed.data.id, tenantId },
      select: { id: true },
    }),
    validateTenantReferences(
      tenantId,
      parsed.data.classId,
      parsed.data.teacherIds,
    ),
  ]);

  if (!existingSection)
    return { status: "error", message: "Section not found." };
  if (!tenantCheck.ok) return { status: "error", message: tenantCheck.message };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.section.update({
        where: { id: parsed.data.id as string },
        data: {
          classId: parsed.data.classId,
          name: parsed.data.name,
          room: parsed.data.room,
          capacity: parsed.data.capacity,
        },
      });

      await tx.sectionTeacher.deleteMany({
        where: { sectionId: parsed.data.id as string },
      });

      if (parsed.data.teacherIds.length > 0) {
        await tx.sectionTeacher.createMany({
          data: parsed.data.teacherIds.map((teacherId) => ({
            sectionId: parsed.data.id as string,
            teacherId,
          })),
          skipDuplicates: true,
        });
      }
    });
  } catch {
    return { status: "error", message: "Unable to update section." };
  }

  revalidatePath("/sections");
  revalidatePath("/classes");
  return { status: "success", message: "Section updated successfully." };
}

export async function assignTeachersToSection(
  sectionId: string,
  teacherIds: string[],
): Promise<SectionActionState> {
  await requireSchoolAdmin();
  const tenantId = await requireTenantId();
  const uniqueTeacherIds = Array.from(new Set(teacherIds)).filter(Boolean);

  const [section, teachers] = await Promise.all([
    prisma.section.findFirst({
      where: { id: sectionId, tenantId },
      select: { id: true },
    }),
    uniqueTeacherIds.length
      ? prisma.teacher.findMany({
          where: { id: { in: uniqueTeacherIds }, tenantId },
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);

  if (!section) return { status: "error", message: "Section not found." };
  if (teachers.length !== uniqueTeacherIds.length) {
    return {
      status: "error",
      message: "One or more selected teachers are invalid.",
    };
  }

  await prisma.sectionTeacher.createMany({
    data: uniqueTeacherIds.map((teacherId) => ({ sectionId, teacherId })),
    skipDuplicates: true,
  });

  revalidatePath("/sections");
  return { status: "success", message: "Teachers assigned successfully." };
}

export async function removeTeacherFromSection(
  sectionId: string,
  teacherId: string,
): Promise<SectionActionState> {
  await requireSchoolAdmin();
  const tenantId = await requireTenantId();

  const relation = await prisma.sectionTeacher.findFirst({
    where: {
      sectionId,
      teacherId,
      section: { tenantId },
      teacher: { tenantId },
    },
    select: { id: true },
  });

  if (!relation) {
    return { status: "error", message: "Assignment not found." };
  }

  await prisma.sectionTeacher.deleteMany({
    where: { sectionId, teacherId },
  });

  revalidatePath("/sections");
  return { status: "success", message: "Teacher removed from section." };
}

export async function deleteSection(formData: FormData) {
  await requireSchoolAdmin();
  const tenantId = await requireTenantId();

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Section id is required.");

  const section = await prisma.section.findFirst({
    where: { id, tenantId },
    select: {
      id: true,
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  });

  if (!section) throw new Error("Section not found.");
  if (section._count.enrollments > 0) {
    throw new Error("Section has related records and cannot be deleted.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.sectionTeacher.deleteMany({ where: { sectionId: id } });
    await tx.section.delete({ where: { id } });
  });

  revalidatePath("/sections");
  revalidatePath("/classes");
}
