"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/app/generated/prisma/client";
import { Permission } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";
import { formDataToObject } from "@/lib/form-utils";
import { requirePermission, requireTenant } from "@/lib/rbac";
import { payrollGenerateSchema } from "@/lib/validators";

export type PayrollActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function monthStartUTC(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
}

export async function getPayrolls() {
  await requirePermission(Permission.MANAGE_TEACHERS);
  const tenantId = await requireTenant();

  return prisma.payroll.findMany({
    where: { tenantId },
    orderBy: [{ month: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      month: true,
      totalSections: true,
      totalAmount: true,
      teacher: { select: { id: true, name: true } },
      createdAt: true,
    },
  });
}

export async function generatePayroll(
  _prev: PayrollActionState,
  formData: FormData,
): Promise<PayrollActionState> {
  await requirePermission(Permission.MANAGE_TEACHERS);
  const tenantId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = payrollGenerateSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const month = monthStartUTC(parsed.data.month);

  const teachers = await prisma.teacher.findMany({
    where: { tenantId, isDeleted: false },
    select: { id: true, ratePerSection: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const teacher of teachers) {
      const totalSections = await tx.sectionTeacher.count({
        where: { teacherId: teacher.id },
      });
      const totalAmount = new Prisma.Decimal(teacher.ratePerSection).mul(
        totalSections,
      );

      await tx.payroll.upsert({
        where: { teacherId_month: { teacherId: teacher.id, month } },
        create: {
          tenantId,
          teacherId: teacher.id,
          month,
          totalSections,
          totalAmount,
        },
        update: {
          totalSections,
          totalAmount,
        },
      });
    }
  });

  revalidatePath("/payroll");
  return { status: "success", message: "Payroll generated." };
}

