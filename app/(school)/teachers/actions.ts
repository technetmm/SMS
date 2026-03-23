"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma/client";
import { requirePermission, requireTenant } from "@/lib/rbac";
import { formDataToObject, emptyToUndefined } from "@/lib/form-utils";
import { teacherCreateSchema, teacherUpdateSchema } from "@/lib/validators";
import { Permission, UserRole } from "@/app/generated/prisma/enums";
import { enqueueEmail } from "@/lib/queue";
import { logAction } from "@/lib/audit-log";

export type TeacherActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function createTeacher(
  _prevState: TeacherActionState,
  formData: FormData,
): Promise<TeacherActionState> {
  await requirePermission(Permission.MANAGE_TEACHERS);
  const tenantId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = teacherCreateSchema.safeParse({
    ...raw,
    parmentAddress: emptyToUndefined(raw.parmentAddress),
    currentAddress: emptyToUndefined(raw.currentAddress),
    phone: emptyToUndefined(raw.phone),
    remark: emptyToUndefined(raw.remark),
    exitDate: emptyToUndefined(raw.exitDate),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existing) {
    return { status: "error", message: "Email already exists." };
  }

  try {
    let createdTeacherId = "";
    await prisma.$transaction(async (tx) => {
      const passwordHash = await bcrypt.hash(parsed.data.password, 10);

      const user = await tx.user.create({
        data: {
          email: parsed.data.email,
          name: parsed.data.name,
          role: UserRole.TEACHER,
          passwordHash,
          tenantId,
        },
      });

      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          tenantId,
          name: parsed.data.name,
          jobTitle: parsed.data.jobTitle,
          nrcNumber: parsed.data.nrcNumber,
          dob: parsed.data.dob,
          email: parsed.data.email,
          gender: parsed.data.gender,
          maritalStatus: parsed.data.maritalStatus,
          parmentAddress: parsed.data.parmentAddress,
          currentAddress: parsed.data.currentAddress,
          phone: parsed.data.phone,
          hireDate: parsed.data.hireDate,
          exitDate: parsed.data.exitDate,
          status: parsed.data.status,
          remark: parsed.data.remark,
          ratePerSection: parsed.data.ratePerSection,
        },
      });
      createdTeacherId = teacher.id;
    });

    await enqueueEmail({
      to: parsed.data.email,
      subject: "Welcome to LMS",
      body: `Hi ${parsed.data.name}, your teacher account is ready.`,
      delayMs: 2000,
    });

    await logAction({
      action: "CREATE",
      entity: "Teacher",
      entityId: createdTeacherId,
      tenantId,
      metadata: { email: parsed.data.email },
    });
  } catch (error) {
    console.error("createTeacher failed", error);
    return { status: "error", message: "Unable to create teacher." };
  }

  revalidatePath("/teachers");
  return { status: "success", message: "Teacher created successfully." };
}

export async function getTeachers() {
  await requirePermission(Permission.MANAGE_TEACHERS);
  const tenantId = await requireTenant();

  return prisma.teacher.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      hireDate: true,
    },
  });
}

export async function updateTeacher(
  _prevState: TeacherActionState,
  formData: FormData,
): Promise<TeacherActionState> {
  await requirePermission(Permission.MANAGE_TEACHERS);
  const tenantId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = teacherUpdateSchema.safeParse({
    ...raw,
    parmentAddress: emptyToUndefined(raw.parmentAddress),
    currentAddress: emptyToUndefined(raw.currentAddress),
    phone: emptyToUndefined(raw.phone),
    remark: emptyToUndefined(raw.remark),
    exitDate: emptyToUndefined(raw.exitDate),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const teacher = await prisma.teacher.findFirst({
    where: { id: parsed.data.id, tenantId },
    select: { userId: true },
  });

  if (!teacher) {
    return { status: "error", message: "Teacher not found." };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existing && existing.id !== teacher.userId) {
    return { status: "error", message: "Email already exists." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: teacher.userId },
        data: {
          email: parsed.data.email,
          name: parsed.data.name,
        },
      });

      await tx.teacher.update({
        where: { id: parsed.data.id },
        data: {
          tenantId,
          name: parsed.data.name,
          jobTitle: parsed.data.jobTitle,
          nrcNumber: parsed.data.nrcNumber,
          dob: parsed.data.dob,
          email: parsed.data.email,
          gender: parsed.data.gender,
          maritalStatus: parsed.data.maritalStatus,
          parmentAddress: parsed.data.parmentAddress,
          currentAddress: parsed.data.currentAddress,
          phone: parsed.data.phone,
          hireDate: parsed.data.hireDate,
          exitDate: parsed.data.exitDate,
          status: parsed.data.status,
          remark: parsed.data.remark,
          ratePerSection: parsed.data.ratePerSection,
        },
      });
    });
  } catch (error) {
    console.error("updateTeacher failed", error);
    return { status: "error", message: "Unable to update teacher." };
  }

  revalidatePath("/teachers");
  return { status: "success", message: "Teacher updated successfully." };
}

export async function deleteTeacher(formData: FormData) {
  await requirePermission(Permission.MANAGE_TEACHERS);
  const tenantId = await requireTenant();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    throw new Error("Teacher id is required");
  }

  const teacher = await prisma.teacher.findFirst({
    where: { id, tenantId },
    select: {
      userId: true,
      _count: { select: { sections: true } },
    },
  });

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  if (teacher._count.sections > 0) {
    throw new Error(
      "Teacher is assigned to sections. Remove assignments first.",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.teacher.delete({ where: { id } });
    await tx.user.delete({ where: { id: teacher.userId } });
  });

  revalidatePath("/teachers");
}
