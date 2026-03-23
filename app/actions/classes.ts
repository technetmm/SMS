"use server";

import { revalidatePath } from "next/cache";
import { Permission } from "@/app/generated/prisma/enums";
import { getPrismaClient } from "@/lib/prisma-tenant";
import { requirePermission, requireTenant } from "@/lib/rbac";
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
  await requirePermission(Permission.MANAGE_CLASSES);
  const tenantId = await requireTenant();
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
        tenantId,
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
      tenantId,
      metadata: { name: parsed.data.name, courseId: parsed.data.courseId },
    });
  } catch {
    return { status: "error", message: "Unable to create class." };
  }

  revalidatePath("/classes");
  return { status: "success", message: "Class created successfully." };
}

export async function createSection(
  _prevState: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  await requirePermission(Permission.MANAGE_CLASSES);
  const tenantId = await requireTenant();
  const session = await getServerAuth();
  const prismaTenant = getPrismaClient(session ?? {});

  const raw = formDataToObject(formData);
  const teacherIds = formData
    .getAll("teacherIds")
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
        tenantId,
        classId: parsed.data.classId,
        name: parsed.data.name,
        room: parsed.data.room,
        capacity: parsed.data.capacity,
      },
    });

    if (teacherIds.length > 0) {
      await prismaTenant.sectionTeacher.createMany({
        data: teacherIds.map((teacherId) => ({
          sectionId: created.id,
          teacherId,
        })),
        skipDuplicates: true,
      });
    }

    await logAction({
      action: "CREATE",
      entity: "Section",
      entityId: created.id,
      tenantId,
      metadata: {
        classId: parsed.data.classId,
        name: parsed.data.name,
        teacherIds,
      },
    });
  } catch {
    return { status: "error", message: "Unable to create section." };
  }

  revalidatePath("/classes");
  return { status: "success", message: "Section created successfully." };
}
