import Link from "next/link";
import { requireSchoolAdminAccess } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EnrollmentTable } from "@/components/enrollments/enrollment-table";
import { parsePageParam } from "@/lib/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  parseDateRangeParams,
  parseTextParam,
  parseEnumParam,
} from "@/lib/table-filters";
import { EnrollmentStatus } from "@/app/generated/prisma/enums";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function EnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    enrolledFrom?: string;
    enrolledTo?: string;
  }>;
}) {
  await requireSchoolAdminAccess();
  const params = await searchParams;
  const { page: pageParam } = params;
  const page = parsePageParam(pageParam);
  const q = parseTextParam(params.q);
  const status = parseEnumParam(params.status, [
    EnrollmentStatus.ACTIVE,
    EnrollmentStatus.COMPLETED,
    EnrollmentStatus.DROPPED,
  ] as const);
  const { from: enrolledFrom, to: enrolledTo } = parseDateRangeParams({
    from: params.enrolledFrom,
    to: params.enrolledTo,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrollments"
        description="Manage student enrollment, billing, attendance, and progress by section."
        actions={
          <Button asChild>
            <Link href="/school/enrollments/create">New Enrollment</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="get" className="grid gap-4 md:grid-cols-4">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="q">Search</Label>
              <Input
                id="q"
                name="q"
                defaultValue={q}
                placeholder="Student, section, or class"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" value={status}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent position={"popper"}>
                  <SelectGroup>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="DROPPED">Dropped</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="enrolledFrom">Enrolled From</Label>
              <Input
                id="enrolledFrom"
                name="enrolledFrom"
                type="date"
                defaultValue={parseTextParam(params.enrolledFrom)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="enrolledTo">Enrolled To</Label>
              <Input
                id="enrolledTo"
                name="enrolledTo"
                type="date"
                defaultValue={parseTextParam(params.enrolledTo)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">Apply</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/school/enrollments">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <EnrollmentTable
        page={page}
        filters={{ q, status, enrolledFrom, enrolledTo }}
        searchParams={{
          q: params.q,
          status: params.status,
          enrolledFrom: params.enrolledFrom,
          enrolledTo: params.enrolledTo,
          page: params.page,
        }}
      />
    </div>
  );
}
