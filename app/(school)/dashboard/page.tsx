import { prisma } from "@/lib/prisma/client";
import { requireTenant } from "@/lib/rbac";
import { StatCard } from "@/components/shared/stat-card";
import { RevenueChart } from "@/components/shared/revenue-chart";

export default async function DashboardPage() {
  const tenantId = await requireTenant();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [studentCount, classCount, revenue] = await Promise.all([
    prisma.student.count({ where: { tenantId } }),
    prisma.class.count({ where: { tenantId } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { tenantId, status: "PAID", paidAt: { gte: startOfMonth } },
    }),
  ]);

  const monthlyRevenue = revenue._sum.amount ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Students" value={studentCount.toString()} />
        <StatCard title="Active Classes" value={classCount.toString()} />
        <StatCard
          title="Monthly Revenue"
          value={`$${Number(monthlyRevenue).toFixed(2)}`}
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
    </div>
  );
}
