import { DeviceApprovalTable } from "@/components/auth/device-approval-table";
import { TablePagination } from "@/components/shared/table-pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma/client";
import { getPaginatedPendingDeviceApprovalRows } from "@/lib/auth/device-approval-queue";
import { requireSchoolAdminAccess, requireTenant } from "@/lib/rbac";
import { StatCard } from "@/components/shared/stat-card";
import { RevenueChart } from "@/components/shared/revenue-chart";
import { Currency } from "@/app/generated/prisma/enums";
import { formatMoney } from "@/lib/formatter";
import { parsePageParam } from "@/lib/pagination";
import { getLocale, getTranslations } from "next-intl/server";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const [sessionUser, schoolId] = await Promise.all([
    requireSchoolAdminAccess(),
    requireTenant(),
  ]);
  const [t, locale] = await Promise.all([
    getTranslations("SchoolDashboard"),
    getLocale(),
  ]);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    studentCount,
    classCount,
    paymentRevenue,
    refundRevenue,
    tenant,
    deviceApprovalRequests,
  ] = await Promise.all([
    prisma.student.count({ where: { schoolId } }),
    prisma.class.count({ where: { schoolId } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { schoolId, createdAt: { gte: startOfMonth } },
    }),
    prisma.refund.aggregate({
      _sum: { amount: true },
      where: { schoolId, createdAt: { gte: startOfMonth } },
    }),
    prisma.tenant.findFirst({
      where: { id: schoolId },
      select: { currency: true },
    }),
    getPaginatedPendingDeviceApprovalRows(
      {
        role: sessionUser.role,
        schoolId: sessionUser.schoolId,
      },
      { page },
    ),
  ]);

  const monthlyRevenue =
    Number(paymentRevenue._sum.amount ?? 0) -
    Number(refundRevenue._sum.amount ?? 0);
  const currency = tenant?.currency ?? Currency.USD;
  const tableMessages = {
    errors: {
      unableToProcess: t("deviceTable.errors.unableToProcess"),
    },
    success: {
      approved: t("deviceTable.success.approved"),
      denied: t("deviceTable.success.denied"),
    },
    columns: {
      requester: t("deviceTable.columns.requester"),
      role: t("deviceTable.columns.role"),
      school: t("deviceTable.columns.school"),
      requested: t("deviceTable.columns.requested"),
      deviceIp: t("deviceTable.columns.deviceIp"),
      status: t("deviceTable.columns.status"),
      actions: t("deviceTable.columns.actions"),
    },
    roleLabels: {
      superAdmin: t("deviceTable.roleLabels.superAdmin"),
      schoolSuperAdmin: t("deviceTable.roleLabels.schoolSuperAdmin"),
      schoolAdmin: t("deviceTable.roleLabels.schoolAdmin"),
      teacher: t("deviceTable.roleLabels.teacher"),
      student: t("deviceTable.roleLabels.student"),
    },
    fallbacks: {
      unnamedUser: t("deviceTable.fallbacks.unnamedUser"),
      notAvailable: t("deviceTable.fallbacks.notAvailable"),
    },
    actions: {
      deny: t("deviceTable.actions.deny"),
      denying: t("deviceTable.actions.denying"),
      approve: t("deviceTable.actions.approve"),
      approving: t("deviceTable.actions.approving"),
    },
    empty: t("deviceTable.empty"),
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title={t("stats.totalStudents")}
          value={studentCount.toString()}
        />
        <StatCard
          title={t("stats.activeClasses")}
          value={classCount.toString()}
        />
        <StatCard
          title={t("stats.monthlyRevenue")}
          value={formatMoney(monthlyRevenue, currency)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <RevenueChart title={t("charts.monthlyRevenue")} />
        <div className="rounded-lg border bg-background p-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            {t("highlights.title")}
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>{t("highlights.topProgram")}</li>
            <li>{t("highlights.avgAttendance")}</li>
            <li>{t("highlights.pendingInvoices")}</li>
          </ul>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("deviceApprovals.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DeviceApprovalTable
            initialRequests={deviceApprovalRequests.items}
            locale={locale}
            messages={tableMessages}
          />
          <TablePagination
            pagination={deviceApprovalRequests}
            pathname="/school/dashboard"
          />
        </CardContent>
      </Card>
    </div>
  );
}
