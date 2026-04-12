import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSchoolAdmin } from "@/lib/permissions";
import { requireTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma/client";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  enumLabel,
  GENDER_LABELS,
  MARITAL_STATUS_LABELS,
  STAFF_STATUS_LABELS,
} from "@/lib/enum-labels";
import { staffStatusColor } from "@/lib/colors";
import { timeToMinutes } from "@/lib/time";
import { dateFormatter } from "@/lib/helper";
import { StaffSystemRoleManager } from "@/components/staff/staff-system-role-manager";

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSchoolAdmin();
  const { id } = await params;

  if (!id) {
    redirect("/school/staff");
  }

  const schoolId = await requireTenantId();

  const [staff, sectionCount, timetableSlots] = await Promise.all([
    prisma.staff.findFirst({
      where: { id, schoolId },
      include: {
        user: {
          select: {
            role: true,
          },
        },
      },
    }),
    prisma.sectionStaff.count({ where: { staffId: id } }),
    prisma.timetable.findMany({
      where: { schoolId, staffId: id },
      select: { startTime: true, endTime: true },
    }),
  ]);

  if (!staff) {
    redirect("/school/staff");
  }

  const weeklyMinutes = timetableSlots.reduce((total, slot) => {
    try {
      return (
        total + (timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime))
      );
    } catch {
      return total;
    }
  }, 0);
  const weeklyHoursLabel = `${Math.floor(weeklyMinutes / 60)}h ${weeklyMinutes % 60}m`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={staff.name}
        description="Staff profile and employment details."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/school/staff">Back</Link>
            </Button>
            <Button asChild>
              <Link href={`/school/staff/${staff.id}/edit`}>Edit</Link>
            </Button>
          </div>
        }
      />

      <StaffSystemRoleManager
        userId={staff.userId}
        actorRole={session.user.role}
        currentRole={staff.user.role}
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Full name</p>
                <p className="font-medium">{staff.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">NRC number</p>
                <p className="font-medium">{staff.nrcNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date of birth</p>
                <p className="font-medium">
                  {staff?.dob ? dateFormatter.format(staff.dob) : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gender</p>
                <p className="font-medium">
                  {enumLabel(staff.gender, GENDER_LABELS)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Marital status</p>
                <p className="font-medium">
                  {enumLabel(staff.maritalStatus, MARITAL_STATUS_LABELS)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{staff.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium">{staff.phone ?? "-"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground">
                  Permanent address
                </p>
                <p className="font-medium">{staff.parmentAddress ?? "-"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground">Current address</p>
                <p className="font-medium">{staff.currentAddress ?? "-"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {staff.remark ?? "No remarks yet."}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Job title</p>
                <p className="font-medium">{staff.jobTitle}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Hire date</p>
                <p className="font-medium">
                  {staff?.hireDate ? dateFormatter.format(staff.hireDate) : "-"}
                </p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Exit date</p>
                <p className="font-medium">
                  {staff.exitDate ? dateFormatter.format(staff.exitDate) : "-"}
                </p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">
                  Rate per section
                </p>
                <p className="font-medium">{staff.ratePerSection.toString()}</p>
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>

                  <p
                    className={"font-medium"}
                    style={{ color: staffStatusColor(staff.status) }}
                  >
                    {enumLabel(staff.status, STAFF_STATUS_LABELS)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">
                  Assigned sections
                </p>
                <p className="font-medium">{sectionCount}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">
                  Weekly teaching time
                </p>
                <p className="font-medium">{weeklyHoursLabel}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
