import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/permissions";
import { UserRole } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma/client";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    value,
  );
}

export default async function TeacherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) {
    redirect("/teachers");
  }

  await requireRole([UserRole.ADMIN]);

  const teacher = await prisma.teacher.findUnique({
    where: { id: id },
  });

  if (!teacher) {
    redirect("/teachers");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={teacher.name}
        description="Teacher profile and employment details."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/teachers">Back</Link>
            </Button>
            <Button asChild>
              <Link href={`/teachers/${teacher.id}/edit`}>Edit</Link>
            </Button>
          </div>
        }
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
                <p className="font-medium">{teacher.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">NRC number</p>
                <p className="font-medium">{teacher.nrcNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date of birth</p>
                <p className="font-medium">{formatDate(teacher.dob)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gender</p>
                <p className="font-medium">{teacher.gender}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Marital status</p>
                <p className="font-medium">{teacher.maritalStatus}</p>
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
                <p className="font-medium">{teacher.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium">{teacher.phone ?? "-"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground">
                  Permanent address
                </p>
                <p className="font-medium">{teacher.parmentAddress ?? "-"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground">Current address</p>
                <p className="font-medium">{teacher.currentAddress ?? "-"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {teacher.remark ?? "No remarks yet."}
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
                <p className="font-medium">{teacher.jobTitle}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Hire date</p>
                <p className="font-medium">{formatDate(teacher.hireDate)}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Exit date</p>
                <p className="font-medium">{formatDate(teacher.exitDate)}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">
                  Rate per section
                </p>
                <p className="font-medium">
                  {teacher.ratePerSection.toString()}
                </p>
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-medium">Current status</p>
                </div>
                <Badge
                  variant={teacher.status === "ACTIVE" ? "default" : "outline"}
                >
                  {teacher.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
