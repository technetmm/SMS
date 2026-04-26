"use server";

import { revalidateLocalizedPath } from "@/lib/revalidate";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma/client";
import { formDataToObject } from "@/lib/form-utils";
import { paginateQuery } from "@/lib/pagination";
import { requireSchoolAdminAccess, requireTenant } from "@/lib/rbac";
import { payrollGenerateSchema } from "@/lib/validators";
import { containsInsensitive } from "@/lib/table-filters";
import { z } from "zod";
import { logAction } from "@/lib/audit-log";

export type PayrollActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  msgID?: number;
};

export type PayrollTableFilters = {
  q?: string;
  monthFrom?: Date;
  monthTo?: Date;
  totalMin?: number;
  totalMax?: number;
};

function monthStartUTC(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
}

export async function getPayrolls() {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  return prisma.payroll.findMany({
    where: { schoolId },
    orderBy: [{ month: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      month: true,
      totalHours: true,
      totalAmount: true,
      tenant: { select: { currency: true } },
      staff: { select: { id: true, name: true } },
      createdAt: true,
      adjustments: {
        select: {
          adjustmentAmount: true,
          adjustmentReason: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getPaginatedPayrolls({
  page,
  filters,
}: {
  page: number;
  filters?: PayrollTableFilters;
}) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();
  const where: Record<string, unknown> = { schoolId };

  if (filters?.monthFrom || filters?.monthTo) {
    where.month = {
      ...(filters.monthFrom ? { gte: filters.monthFrom } : {}),
      ...(filters.monthTo ? { lte: filters.monthTo } : {}),
    };
  }

  if (filters?.totalMin != null || filters?.totalMax != null) {
    where.totalAmount = {
      ...(filters.totalMin != null ? { gte: filters.totalMin } : {}),
      ...(filters.totalMax != null ? { lte: filters.totalMax } : {}),
    };
  }

  if (filters?.q) {
    where.OR = [{ staff: { name: containsInsensitive(filters.q) } }];
  }

  return paginateQuery({
    page,
    count: () => prisma.payroll.count({ where }),
    query: ({ skip, take }) =>
      prisma.payroll.findMany({
        where,
        orderBy: [{ month: "desc" }, { createdAt: "desc" }],
        skip,
        take,
        select: {
          id: true,
          month: true,
          totalHours: true,
          totalAmount: true,
          tenant: { select: { currency: true } },
          staff: { select: { id: true, name: true } },
          createdAt: true,
          adjustments: {
            select: {
              adjustmentAmount: true,
              adjustmentReason: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      }),
  });
}

export async function generatePayroll(
  _prev: PayrollActionState,
  formData: FormData,
): Promise<PayrollActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = payrollGenerateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message,
      msgID: Date.now(),
    };
  }

  const month = monthStartUTC(parsed.data.month);

  const staffMembers = await prisma.staff.findMany({
    where: { schoolId },
    select: { id: true, ratePerHour: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const staff of staffMembers) {
      // Get all timetables for the staff member to calculate their scheduled hours
      const timetables = await tx.timetable.findMany({
        where: { staffId: staff.id },
        include: { section: true },
      });

      // Get attendance records for the month
      const attendanceRecords = await tx.staffAttendance.findMany({
        where: {
          staffId: staff.id,
          date: {
            gte: month,
            lt: new Date(month.getFullYear(), month.getMonth() + 1, 1),
          },
        },
      });

      // Calculate total hours worked
      let totalHours = 0;
      const daysInMonth = new Date(
        month.getFullYear(),
        month.getMonth() + 1,
        0,
      ).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(
          month.getFullYear(),
          month.getMonth(),
          day,
        );
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

        // Check if staff was present on this day
        const attendance = attendanceRecords.find(
          (a) =>
            a.date.getDate() === day &&
            a.date.getMonth() === month.getMonth() &&
            a.date.getFullYear() === month.getFullYear(),
        );

        if (attendance && attendance.status === "PRESENT") {
          // Find timetables for this day of week
          const dayTimetables = timetables.filter((timetable) => {
            const dayMap: { [key: number]: string } = {
              0: "SUN",
              1: "MON",
              2: "TUE",
              3: "WED",
              4: "THU",
              5: "FRI",
              6: "SAT",
            };
            return timetable.dayOfWeek === dayMap[dayOfWeek];
          });

          // Calculate hours for this day
          for (const timetable of dayTimetables) {
            const [startHour, startMin] = timetable.startTime
              .split(":")
              .map(Number);
            const [endHour, endMin] = timetable.endTime.split(":").map(Number);
            const hoursWorked =
              (endHour * 60 + endMin - startHour * 60 - startMin) / 60;
            totalHours += Math.max(0, hoursWorked);
          }
        }
      }

      const totalAmount = new Prisma.Decimal(staff.ratePerHour || 0).mul(
        totalHours,
      );

      await tx.payroll.upsert({
        where: { staffId_month: { staffId: staff.id, month } },
        create: {
          schoolId,
          staffId: staff.id,
          month,
          totalHours,
          totalAmount,
        },
        update: {
          totalHours,
          totalAmount,
        },
      });
    }
  });

  revalidateLocalizedPath("/school/payroll");
  return {
    status: "success",
    message: "Payroll generated.",
    msgID: Date.now(),
  };
}

const adjustPayrollSchema = z.object({
  payrollId: z.string().min(1, "Payroll ID is required."),
  adjustmentAmount: z.string().min(1, "Adjustment amount is required."),
  adjustmentReason: z.string().optional(),
});

export async function adjustPayroll(
  _prevState: PayrollActionState,
  formData: FormData,
): Promise<PayrollActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = adjustPayrollSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message,
      msgID: Date.now(),
    };
  }

  const payroll = await prisma.payroll.findFirst({
    where: { id: parsed.data.payrollId, schoolId },
    select: { id: true, totalAmount: true, staffId: true, month: true },
  });

  if (!payroll) {
    return {
      status: "error",
      message: "Payroll record not found.",
      msgID: Date.now(),
    };
  }

  try {
    const currentAmount = payroll.totalAmount;
    const adjustment = new Prisma.Decimal(parsed.data.adjustmentAmount);
    const newAmount = currentAmount.add(adjustment);

    await prisma.payroll.update({
      where: { id: parsed.data.payrollId },
      data: { totalAmount: newAmount },
    });

    // Create payroll adjustment record
    await prisma.payrollAdjustment.create({
      data: {
        payrollId: parsed.data.payrollId,
        adjustmentAmount: adjustment,
        adjustmentReason: parsed.data.adjustmentReason || "",
        schoolId,
      },
    });

    await logAction({
      action: "UPDATE",
      entity: "Payroll",
      entityId: payroll.id,
      schoolId,
      metadata: {
        field: "adjustment",
        adjustmentAmount: parsed.data.adjustmentAmount,
        adjustmentReason: parsed.data.adjustmentReason,
      },
    });
  } catch (error) {
    console.error("adjustPayroll failed", error);
    return {
      status: "error",
      message: "Unable to adjust payroll.",
      msgID: Date.now(),
    };
  }

  revalidateLocalizedPath("/school/payroll");
  return {
    status: "success",
    message: "Payroll adjusted successfully.",
    msgID: Date.now(),
  };
}
