"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma/client";
import { formDataToObject } from "@/lib/form-utils";
import { classCreateSchema } from "@/lib/validators";
import { requireSchoolAdmin } from "@/lib/permissions";
import { requireTenantId } from "@/lib/tenant";

export type ClassActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function createClass(
  _prevState: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  await requireSchoolAdmin();
  const tenantId = await requireTenantId();

  const raw = formDataToObject(formData);
  const parsed = classCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const course = await prisma.course.findFirst({
    where: { id: parsed.data.courseId, tenantId },
    select: { id: true },
  });

  if (!course) {
    return { status: "error", message: "Selected course is invalid." };
  }

  try {
    await prisma.class.create({
      data: {
        tenantId,
        name: parsed.data.name,
        courseId: parsed.data.courseId,
        classType: parsed.data.classType,
        programType: parsed.data.programType,
      },
    });
  } catch {
    return { status: "error", message: "Unable to create class." };
  }

  revalidatePath("/classes");
  revalidatePath("/sections");
  return { status: "success", message: "Class created successfully." };
}

export async function getClasses() {
  await requireSchoolAdmin();
  const tenantId = await requireTenantId();

  return prisma.class.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      classType: true,
      programType: true,
      createdAt: true,
      course: { select: { id: true, name: true } },
      _count: { select: { sections: true } },
    },
  });
}

export async function getClassById(id: string) {
  await requireSchoolAdmin();
  const tenantId = await requireTenantId();
  if (!id) return null;

  return prisma.class.findFirst({
    where: { id, tenantId },
    select: {
      id: true,
      name: true,
      classType: true,
      programType: true,
      courseId: true,
    },
  });
}

export async function updateClass(
  _prevState: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  await requireSchoolAdmin();
  const tenantId = await requireTenantId();

  const raw = formDataToObject(formData);
  const id = String(raw.id ?? "");
  const parsed = classCreateSchema.safeParse(raw);

  if (!id) return { status: "error", message: "Class id is required." };
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const [existingClass, course] = await Promise.all([
    prisma.class.findFirst({
      where: { id, tenantId },
      select: { id: true },
    }),
    prisma.course.findFirst({
      where: { id: parsed.data.courseId, tenantId },
      select: { id: true },
    }),
  ]);

  if (!existingClass) return { status: "error", message: "Class not found." };
  if (!course) return { status: "error", message: "Selected course is invalid." };

  try {
    await prisma.class.update({
      where: { id },
      data: {
        name: parsed.data.name,
        courseId: parsed.data.courseId,
        classType: parsed.data.classType,
        programType: parsed.data.programType,
      },
    });
  } catch {
    return { status: "error", message: "Unable to update class." };
  }

  revalidatePath("/classes");
  revalidatePath("/sections");
  return { status: "success", message: "Class updated successfully." };
}

export async function deleteClass(formData: FormData) {
  await requireSchoolAdmin();
  const tenantId = await requireTenantId();

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Class id is required.");

  const klass = await prisma.class.findFirst({
    where: { id, tenantId },
    select: { id: true, _count: { select: { sections: true } } },
  });

  if (!klass) throw new Error("Class not found.");
  if (klass._count.sections > 0) {
    throw new Error("Class has sections. Delete sections first.");
  }

  await prisma.class.delete({ where: { id } });
  revalidatePath("/classes");
  revalidatePath("/sections");
}

