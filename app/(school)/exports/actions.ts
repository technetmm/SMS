"use server";

import { Permission } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";
import { requirePermission, requireTenant } from "@/lib/rbac";
import { buildExcelBuffer } from "@/lib/export/excel";
import { buildSimpleTablePdfBuffer } from "@/lib/export/pdf";
import { saveExportFile } from "@/lib/export/storage";
import { logAction } from "@/lib/audit-log";

export type ExportState = {
  status: "idle" | "success" | "error";
  message?: string;
  url?: string;
};

function stamp(prefix: string) {
  return `${prefix}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
}

export async function exportStudentsToExcel(): Promise<ExportState> {
  await requirePermission(Permission.MANAGE_STUDENTS);
  const tenantId = await requireTenant();

  const students = await prisma.student.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      name: true,
      gender: true,
      phone: true,
      status: true,
      createdAt: true,
    },
  });

  const buffer = await buildExcelBuffer({
    sheetName: "Students",
    headers: ["Name", "Gender", "Phone", "Status", "Created At"],
    rows: students.map((s) => [s.name, s.gender, s.phone ?? "-", s.status, s.createdAt]),
  });

  const filename = `${stamp("students")}.xlsx`;
  const url = await saveExportFile({ filename, buffer });

  await logAction({
    action: "EXPORT",
    entity: "Student",
    tenantId,
    metadata: { format: "xlsx", count: students.length },
  });

  return { status: "success", url };
}

export async function exportTeachersToExcel(): Promise<ExportState> {
  await requirePermission(Permission.MANAGE_TEACHERS);
  const tenantId = await requireTenant();

  const teachers = await prisma.teacher.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      name: true,
      email: true,
      phone: true,
      status: true,
      hireDate: true,
    },
  });

  const buffer = await buildExcelBuffer({
    sheetName: "Teachers",
    headers: ["Name", "Email", "Phone", "Status", "Hire Date"],
    rows: teachers.map((t) => [t.name, t.email, t.phone ?? "-", t.status, t.hireDate]),
  });

  const filename = `${stamp("teachers")}.xlsx`;
  const url = await saveExportFile({ filename, buffer });

  await logAction({
    action: "EXPORT",
    entity: "Teacher",
    tenantId,
    metadata: { format: "xlsx", count: teachers.length },
  });

  return { status: "success", url };
}

export async function exportAttendanceToExcel(): Promise<ExportState> {
  await requirePermission(Permission.VIEW_REPORTS);
  const tenantId = await requireTenant();

  const attendance = await prisma.attendance.findMany({
    where: { tenantId },
    orderBy: { date: "desc" },
    take: 1000,
    select: {
      status: true,
      date: true,
      enrollment: {
        select: {
          student: { select: { name: true } },
          section: { select: { name: true } },
        },
      },
    },
  });

  const buffer = await buildExcelBuffer({
    sheetName: "Attendance",
    headers: ["Student", "Section", "Status", "Date"],
    rows: attendance.map((a) => [
      a.enrollment.student.name,
      a.enrollment.section.name,
      a.status,
      a.date,
    ]),
  });

  const filename = `${stamp("attendance")}.xlsx`;
  const url = await saveExportFile({ filename, buffer });

  await logAction({
    action: "EXPORT",
    entity: "Attendance",
    tenantId,
    metadata: { format: "xlsx", count: attendance.length },
  });

  return { status: "success", url };
}

export async function exportPaymentsToPDF(): Promise<ExportState> {
  await requirePermission(Permission.VIEW_REPORTS);
  const tenantId = await requireTenant();

  const payments = await prisma.invoice.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 1000,
    select: {
      finalAmount: true,
      paidAmount: true,
      status: true,
      id: true,
      dueDate: true,
      student: { select: { name: true } },
    },
  });

  const total = payments.reduce((sum, payment) => sum + Number(payment.finalAmount), 0);

  const buffer = await buildSimpleTablePdfBuffer({
    title: "Payment Summary Report",
    subtitle: `Generated ${new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date())} | Records: ${payments.length} | Total: $${total.toFixed(2)}`,
    headers: ["Invoice", "Student", "Due Date", "Status", "Final", "Paid"],
    rows: payments.map((payment) => [
      payment.id,
      payment.student.name,
      new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(payment.dueDate),
      payment.status,
      `$${Number(payment.finalAmount).toFixed(2)}`,
      `$${Number(payment.paidAmount).toFixed(2)}`,
    ]),
  });

  const filename = `${stamp("payments")}.pdf`;
  const url = await saveExportFile({ filename, buffer });

  await logAction({
    action: "EXPORT",
    entity: "Payment",
    tenantId,
    metadata: { format: "pdf", count: payments.length, total },
  });

  return { status: "success", url };
}
