"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma/client";
import { formDataToObject } from "@/lib/form-utils";
import { requirePermission, requireTenant } from "@/lib/rbac";
import { payrollGenerateSchema } from "@/lib/validators";
import { PERMISSIONS } from "@/lib/permission-keys";

export type PayrollActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function monthStartUTC(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
}

export async function getPayrolls() {
  await requirePermission(PERMISSIONS.staffUpdate);
  const schoolId = await requireTenant();

  return prisma.payroll.findMany({
    where: { schoolId },
    orderBy: [{ month: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      month: true,
      totalSections: true,
      totalAmount: true,
      staff: { select: { id: true, name: true } },
      createdAt: true,
    },
  });
}

export async function generatePayroll(
  _prev: PayrollActionState,
  formData: FormData,
): Promise<PayrollActionState> {
  await requirePermission(PERMISSIONS.staffUpdate);
  const schoolId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = payrollGenerateSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const month = monthStartUTC(parsed.data.month);

  const staffMembers = await prisma.staff.findMany({
    where: { schoolId, isDeleted: false },
    select: { id: true, ratePerSection: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const staff of staffMembers) {
      const totalSections = await tx.sectionStaff.count({
        where: { staffId: staff.id },
      });
      const totalAmount = new Prisma.Decimal(staff.ratePerSection).mul(
        totalSections,
      );

      await tx.payroll.upsert({
        where: { staffId_month: { staffId: staff.id, month } },
        create: {
          schoolId,
          staffId: staff.id,
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
