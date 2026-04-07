"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma/client";
import { emptyToUndefined, formDataToObject } from "@/lib/form-utils";
import { paginateQuery } from "@/lib/pagination";
import { sectionMultiStaffSchema } from "@/lib/validators";
import { requireSchoolAdmin } from "@/lib/permissions";
import { requireTenantId } from "@/lib/tenant";

export type SectionActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function parseSectionInput(formData: FormData) {
  const raw = formDataToObject(formData);
  const staffIds = formData
    .getAll("staffIds")
    .map((value) => String(value))
    .filter(Boolean);

  return sectionMultiStaffSchema.safeParse({
    id: raw.id,
    classId: raw.classId,
    name: raw.name,
    staffIds: Array.from(new Set(staffIds)),
    room: emptyToUndefined(raw.room as string | undefined),
    capacity: raw.capacity,
  });
}

async function validateTenantReferences(
  schoolId: string,
  classId: string,
  staffIds: string[],
) {
  const [klass, staff] = await Promise.all([
    prisma.class.findFirst({
      where: { id: classId, schoolId },
      select: { id: true },
    }),
    staffIds.length
      ? prisma.staff.findMany({
          where: { id: { in: staffIds }, schoolId },
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);

  if (!klass) {
    return { ok: false as const, message: "Selected class is invalid." };
  }
  if (staff.length !== staffIds.length) {
    return {
      ok: false as const,
      message: "One or more selected staff are invalid.",
    };
  }
  return { ok: true as const };
}

export async function createSection(
  _prevState: SectionActionState,
  formData: FormData,
): Promise<SectionActionState> {
  await requireSchoolAdmin();
  const schoolId = await requireTenantId();

  const parsed = parseSectionInput(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const tenantCheck = await validateTenantReferences(
    schoolId,
    parsed.data.classId,
    parsed.data.staffIds,
  );
  if (!tenantCheck.ok) return { status: "error", message: tenantCheck.message };

  try {
    await prisma.$transaction(async (tx) => {
      const section = await tx.section.create({
        data: {
          schoolId,
          classId: parsed.data.classId,
          name: parsed.data.name,
          room: parsed.data.room,
          capacity: parsed.data.capacity,
        },
      });

      if (parsed.data.staffIds.length > 0) {
        await tx.sectionStaff.createMany({
          data: parsed.data.staffIds.map((staffId) => ({
            sectionId: section.id,
            staffId,
          })),
          skipDuplicates: true,
        });
      }
    });
  } catch {
    return { status: "error", message: "Unable to create section." };
  }

  revalidatePath("/school/sections");
  revalidatePath("/school/classes");
  return { status: "success", message: "Section created successfully." };
}

export async function getSections() {
  await requireSchoolAdmin();
  const schoolId = await requireTenantId();

  return prisma.section.findMany({
    where: { schoolId },
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
      staffMappings: {
        select: {
          staff: {
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

export async function getPaginatedSections({ page }: { page: number }) {
  await requireSchoolAdmin();
  const schoolId = await requireTenantId();

  return paginateQuery({
    page,
    count: () => prisma.section.count({ where: { schoolId } }),
    query: ({ skip, take }) =>
      prisma.section.findMany({
        where: { schoolId },
        orderBy: { createdAt: "desc" },
        skip,
        take,
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
          staffMappings: {
            select: {
              staff: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
  });
}

export async function getSectionById(id: string) {
  await requireSchoolAdmin();
  const schoolId = await requireTenantId();
  if (!id) return null;

  return prisma.section.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      name: true,
      classId: true,
      room: true,
      capacity: true,
      staffMappings: {
        select: {
          staff: {
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
  const schoolId = await requireTenantId();

  const parsed = parseSectionInput(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }
  if (!parsed.data.id) {
    return { status: "error", message: "Section id is required." };
  }

  const [existingSection, tenantCheck] = await Promise.all([
    prisma.section.findFirst({
      where: { id: parsed.data.id, schoolId },
      select: { id: true },
    }),
    validateTenantReferences(
      schoolId,
      parsed.data.classId,
      parsed.data.staffIds,
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

      await tx.sectionStaff.deleteMany({
        where: { sectionId: parsed.data.id as string },
      });

      if (parsed.data.staffIds.length > 0) {
        await tx.sectionStaff.createMany({
          data: parsed.data.staffIds.map((staffId) => ({
            sectionId: parsed.data.id as string,
            staffId,
          })),
          skipDuplicates: true,
        });
      }
    });
  } catch {
    return { status: "error", message: "Unable to update section." };
  }

  revalidatePath("/school/sections");
  revalidatePath("/school/classes");
  return { status: "success", message: "Section updated successfully." };
}

export async function assignStaffToSection(
  sectionId: string,
  staffIds: string[],
): Promise<SectionActionState> {
  await requireSchoolAdmin();
  const schoolId = await requireTenantId();
  const uniqueStaffIds = Array.from(new Set(staffIds)).filter(Boolean);

  const [section, staff] = await Promise.all([
    prisma.section.findFirst({
      where: { id: sectionId, schoolId },
      select: { id: true },
    }),
    uniqueStaffIds.length
      ? prisma.staff.findMany({
          where: { id: { in: uniqueStaffIds }, schoolId },
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);

  if (!section) return { status: "error", message: "Section not found." };
  if (staff.length !== uniqueStaffIds.length) {
    return {
      status: "error",
      message: "One or more selected staff are invalid.",
    };
  }

  await prisma.sectionStaff.createMany({
    data: uniqueStaffIds.map((staffId) => ({ sectionId, staffId })),
    skipDuplicates: true,
  });

  revalidatePath("/school/sections");
  return { status: "success", message: "Staff assigned successfully." };
}

export async function removeStaffFromSection(
  sectionId: string,
  staffId: string,
): Promise<SectionActionState> {
  await requireSchoolAdmin();
  const schoolId = await requireTenantId();

  const relation = await prisma.sectionStaff.findFirst({
    where: {
      sectionId,
      staffId,
      section: { schoolId },
      staff: { schoolId },
    },
    select: { id: true },
  });

  if (!relation) {
    return { status: "error", message: "Assignment not found." };
  }

  await prisma.sectionStaff.deleteMany({
    where: { sectionId, staffId },
  });

  revalidatePath("/school/sections");
  return { status: "success", message: "Staff removed from section." };
}

export async function deleteSection(formData: FormData) {
  await requireSchoolAdmin();
  const schoolId = await requireTenantId();

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Section id is required.");

  const section = await prisma.section.findFirst({
    where: { id, schoolId },
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
    await tx.sectionStaff.deleteMany({ where: { sectionId: id } });
    await tx.section.delete({ where: { id } });
  });

  revalidatePath("/school/sections");
  revalidatePath("/school/classes");
}
