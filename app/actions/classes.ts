"use server";

import { revalidateLocalizedPath } from "@/lib/revalidate";
import { getPrismaClient } from "@/lib/prisma-tenant";
import { requireSchoolAdminAccess, requireTenant } from "@/lib/rbac";
import { formDataToObject, emptyToUndefined } from "@/lib/form-utils";
import { classCreateSchema, sectionCreateSchema } from "@/lib/validators";
import { getServerAuth } from "@/auth";
import { logAction } from "@/lib/audit-log";

export type ClassActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function createClass(
  _prevState: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();
  const session = await getServerAuth();
  const prismaTenant = getPrismaClient(session ?? {});

  const raw = formDataToObject(formData);
  const parsed = classCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  try {
    const created = await prismaTenant.class.create({
      data: {
        schoolId,
        name: parsed.data.name,
        courseId: parsed.data.courseId,
        classType: parsed.data.classType,
        programType: parsed.data.programType,
      },
    });

    await logAction({
      action: "CREATE",
      entity: "Class",
      entityId: created.id,
      schoolId,
      metadata: { name: parsed.data.name, courseId: parsed.data.courseId },
    });
  } catch {
    return { status: "error", message: "Unable to create class." };
  }

  revalidateLocalizedPath("/school/classes");
  return { status: "success", message: "Class created successfully." };
}

export async function createSection(
  _prevState: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();
  const session = await getServerAuth();
  const prismaTenant = getPrismaClient(session ?? {});

  const raw = formDataToObject(formData);
  const staffIds = formData
    .getAll("staffIds")
    .map((value) => String(value))
    .filter(Boolean);

  const parsed = sectionCreateSchema.safeParse({
    ...raw,
    room: emptyToUndefined(raw.room as string | undefined),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  try {
    const created = await prismaTenant.section.create({
      data: {
        schoolId,
        classId: parsed.data.classId,
        name: parsed.data.name,
        room: parsed.data.room,
        capacity: parsed.data.capacity,
      },
    });

    if (staffIds.length > 0) {
      await prismaTenant.sectionStaff.createMany({
        data: staffIds.map((staffId) => ({
          sectionId: created.id,
          staffId,
        })),
        skipDuplicates: true,
      });
    }

    await logAction({
      action: "CREATE",
      entity: "Section",
      entityId: created.id,
      schoolId,
      metadata: {
        classId: parsed.data.classId,
        name: parsed.data.name,
        staffIds,
      },
    });
  } catch {
    return { status: "error", message: "Unable to create section." };
  }

  revalidateLocalizedPath("/school/classes");
  return { status: "success", message: "Section created successfully." };
}
