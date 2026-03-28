"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma/client";
import { requireSchoolAdminAccess, requireTenant } from "@/lib/rbac";
import { formDataToObject, emptyToUndefined } from "@/lib/form-utils";
import { staffCreateSchema, staffUpdateSchema } from "@/lib/validators";
import { UserRole } from "@/app/generated/prisma/enums";
import { enqueueEmail } from "@/lib/queue";
import { logAction } from "@/lib/audit-log";

export type StaffActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function createStaff(
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = staffCreateSchema.safeParse({
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
    let createdStaffId = "";
    await prisma.$transaction(async (tx) => {
      const passwordHash = await bcrypt.hash(parsed.data.password, 10);

      const user = await tx.user.create({
        data: {
          email: parsed.data.email,
          name: parsed.data.name,
          role: UserRole.TEACHER,
          passwordHash,
          schoolId,
        },
      });

      const staff = await tx.staff.create({
        data: {
          userId: user.id,
          schoolId,
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
      createdStaffId = staff.id;

      const teacherRole = await tx.role.findFirst({
        where: { schoolId, name: "Teacher" },
        select: { id: true },
      });
      if (teacherRole) {
        await tx.userRoleAssignment.upsert({
          where: { userId_roleId: { userId: user.id, roleId: teacherRole.id } },
          update: {},
          create: { userId: user.id, roleId: teacherRole.id },
        });
      }
    });

    await enqueueEmail({
      to: parsed.data.email,
      subject: "Welcome to Technet SMS",
      body: `Hi ${parsed.data.name}, your staff account is ready.`,
      delayMs: 2000,
    });

    await logAction({
      action: "CREATE",
      entity: "Staff",
      entityId: createdStaffId,
      schoolId,
      metadata: { email: parsed.data.email },
    });
  } catch (error) {
    console.error("createStaff failed", error);
    return { status: "error", message: "Unable to create staff." };
  }

  revalidatePath("/staff");
  return { status: "success", message: "Staff created successfully." };
}

export async function getStaff() {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  return prisma.staff.findMany({
    where: { schoolId },
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

export async function updateStaff(
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = staffUpdateSchema.safeParse({
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

  const staff = await prisma.staff.findFirst({
    where: { id: parsed.data.id, schoolId },
    select: { userId: true },
  });

  if (!staff) {
    return { status: "error", message: "Staff not found." };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existing && existing.id !== staff.userId) {
    return { status: "error", message: "Email already exists." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: staff.userId },
        data: {
          email: parsed.data.email,
          name: parsed.data.name,
        },
      });

      await tx.staff.update({
        where: { id: parsed.data.id },
        data: {
          schoolId,
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
    console.error("updateStaff failed", error);
    return { status: "error", message: "Unable to update staff." };
  }

  revalidatePath("/staff");
  return { status: "success", message: "Staff updated successfully." };
}

export async function deleteStaff(formData: FormData) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    throw new Error("Staff id is required");
  }

  const staff = await prisma.staff.findFirst({
    where: { id, schoolId },
    select: {
      userId: true,
      _count: { select: { sections: true } },
    },
  });

  if (!staff) {
    throw new Error("Staff not found");
  }

  if (staff._count.sections > 0) {
    throw new Error(
      "Staff is assigned to sections. Remove assignments first.",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.staff.delete({ where: { id } });
    await tx.user.delete({ where: { id: staff.userId } });
  });

  revalidatePath("/staff");
}
