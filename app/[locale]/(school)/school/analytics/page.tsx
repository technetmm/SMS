import { prisma } from "@/lib/prisma/client";
import { requireSchoolAdminAccess, requireTenant } from "@/lib/rbac";
import { StatCard } from "@/components/shared/stat-card";
import {
  StudentAttendanceTrendChart,
  type AttendanceTrendPoint,
} from "@/components/analytics/student-attendance-trend-chart";
import { getTranslations } from "next-intl/server";

function toYmd(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function AnalyticsPage() {
  await requireSchoolAdminAccess();
  const t = await getTranslations("AnalyticsPage");
  const schoolId = await requireTenant();

  const from = new Date();
  from.setDate(from.getDate() - 29);
  from.setHours(0, 0, 0, 0);

  const [total, present, absent, late, leave, grouped] = await Promise.all([
    prisma.attendance.count({ where: { schoolId, date: { gte: from } } }),
    prisma.attendance.count({
      where: { schoolId, date: { gte: from }, status: "PRESENT" },
    }),
    prisma.attendance.count({
      where: { schoolId, date: { gte: from }, status: "ABSENT" },
    }),
    prisma.attendance.count({
      where: { schoolId, date: { gte: from }, status: "LATE" },
    }),
    prisma.attendance.count({
      where: { schoolId, date: { gte: from }, status: "LEAVE" },
    }),
    prisma.attendance.groupBy({
      by: ["date", "status"],
      where: { schoolId, date: { gte: from } },
      _count: { _all: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const rate = total > 0 ? (present / total) * 100 : 0;

  const map = new Map<string, AttendanceTrendPoint>();
  for (const row of grouped) {
    const key = toYmd(row.date);
    const existing =
      map.get(key) ?? { day: key.slice(5), present: 0, absent: 0, late: 0, leave: 0 };
    const count = row._count._all;
    if (row.status === "PRESENT") existing.present += count;
    if (row.status === "ABSENT") existing.absent += count;
    if (row.status === "LATE") existing.late += count;
    if (row.status === "LEAVE") existing.leave += count;
    map.set(key, existing);
  }

  const data = Array.from(map.values());

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title={t("stats.attendanceRate")} value={`${rate.toFixed(1)}%`} />
        <StatCard title={t("stats.present")} value={present.toString()} />
        <StatCard title={t("stats.absent")} value={absent.toString()} />
        <StatCard title={t("stats.lateLeave")} value={`${late + leave}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <StudentAttendanceTrendChart
          data={data}
          title={t("charts.attendanceTrend")}
        />
        <div className="rounded-lg border bg-background p-6">
          <h3 className="text-sm font-medium text-muted-foreground">{t("notes.title")}</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>{t("notes.item1")}</li>
            <li>{t("notes.item2")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
