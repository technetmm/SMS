import { DeviceApprovalTable } from "@/components/auth/device-approval-table";
import { TablePagination } from "@/components/shared/table-pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma/client";
import { getPaginatedPendingDeviceApprovalRows } from "@/lib/auth/device-approval-queue";
import { requireSchoolAdminAccess, requireTenant } from "@/lib/rbac";
import { StatCard } from "@/components/shared/stat-card";
import { RevenueChart } from "@/components/shared/revenue-chart";
import { Currency } from "@/app/generated/prisma/enums";
import { formatMoney } from "@/lib/helper";
import { parsePageParam } from "@/lib/pagination";

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

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [studentCount, classCount, paymentRevenue, refundRevenue, tenant, deviceApprovalRequests] = await Promise.all([
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
    Number(paymentRevenue._sum.amount ?? 0) - Number(refundRevenue._sum.amount ?? 0);
  const currency = tenant?.currency ?? Currency.USD;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Students" value={studentCount.toString()} />
        <StatCard title="Active Classes" value={classCount.toString()} />
        <StatCard
          title="Monthly Revenue"
          value={formatMoney(monthlyRevenue, currency)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <RevenueChart />
        <div className="rounded-lg border bg-background p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Highlights</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>Top performing program: Regular (2 days)</li>
            <li>Average attendance rate: 92%</li>
            <li>Pending invoices this month: 14</li>
          </ul>
        </div>
      </div>

      <Card>
        <CardHeader>
        <CardTitle>Staff & Student Device Approval Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <DeviceApprovalTable initialRequests={deviceApprovalRequests.items} />
          <TablePagination
            pagination={deviceApprovalRequests}
            pathname="/school/dashboard"
          />
        </CardContent>
      </Card>
    </div>
  );
}
