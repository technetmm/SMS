"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma/client";
import { formDataToObject } from "@/lib/form-utils";
import { requirePermission, requireTenant } from "@/lib/rbac";
import { subjectCreateSchema, subjectUpdateSchema } from "@/lib/validators";
import { PERMISSIONS } from "@/lib/permission-keys";

export type SubjectActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function createSubject(
  _prevState: SubjectActionState,
  formData: FormData,
): Promise<SubjectActionState> {
  await requirePermission(PERMISSIONS.classUpdate);
  const schoolId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = subjectCreateSchema.safeParse(raw);

  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  try {
    await prisma.subject.create({
      data: {
        schoolId,
        name: parsed.data.name,
      },
    });
  } catch {
    return { status: "error", message: "Subject name already exists." };
  }

  revalidatePath("/subjects");
  revalidatePath("/courses");
  return { status: "success", message: "Subject created successfully." };
}

export async function getSubjects() {
  await requirePermission(PERMISSIONS.classUpdate);
  const schoolId = await requireTenant();

  return prisma.subject.findMany({
    where: { schoolId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: {
        select: {
          courses: true,
        },
      },
    },
  });
}

export async function getSubjectById(id: string) {
  await requirePermission(PERMISSIONS.classUpdate);
  const schoolId = await requireTenant();

  if (!id) return null;

  return prisma.subject.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function updateSubject(
  _prevState: SubjectActionState,
  formData: FormData,
): Promise<SubjectActionState> {
  await requirePermission(PERMISSIONS.classUpdate);
  const schoolId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = subjectUpdateSchema.safeParse(raw);

  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const existing = await prisma.subject.findFirst({
    where: {
      id: parsed.data.id,
      schoolId,
    },
    select: { id: true },
  });

  if (!existing) {
    return { status: "error", message: "Subject not found." };
  }

  try {
    await prisma.subject.update({
      where: { id: parsed.data.id },
      data: { name: parsed.data.name },
    });
  } catch {
    return { status: "error", message: "Subject name already exists." };
  }

  revalidatePath("/subjects");
  revalidatePath("/courses");
  return { status: "success", message: "Subject updated successfully." };
}

export async function deleteSubject(
  _prevState: SubjectActionState,
  formData: FormData,
): Promise<SubjectActionState> {
  await requirePermission(PERMISSIONS.classUpdate);
  const schoolId = await requireTenant();

  const id = String(formData.get("id") ?? "");
  if (!id) return { status: "error", message: "Subject id is required." };

  const subject = await prisma.subject.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      _count: { select: { courses: true } },
    },
  });

  if (!subject) {
    return { status: "error", message: "Subject not found." };
  }

  if (subject._count.courses > 0) {
    return {
      status: "error",
      message: "This subject is in use by courses. Remove courses first.",
    };
  }

  await prisma.subject.delete({ where: { id } });

  revalidatePath("/subjects");
  revalidatePath("/courses");
  return { status: "success", message: "Subject deleted successfully." };
}
