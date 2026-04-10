import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { StaffTable } from "@/components/staff/staff-table";
import { ExportMenu } from "@/components/shared/export-menu";
import { exportStaffToExcel } from "@/app/(school)/school/exports/actions";
import { parsePageParam } from "@/lib/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseDateRangeParams, parseTextParam } from "@/lib/table-filters";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    role?: string;
    status?: string;
    hireFrom?: string;
    hireTo?: string;
  }>;
}) {
  await requireSchoolAdmin();
  const params = await searchParams;
  const { page: pageParam } = params;
  const page = parsePageParam(pageParam);
  const q = parseTextParam(params.q);
  const role = parseTextParam(params.role) as
    | "SCHOOL_ADMIN"
    | "TEACHER"
    | undefined;
  const status = parseTextParam(params.status) as
    | "ACTIVE"
    | "ONLEAVE"
    | "RESIGNED"
    | "TERMINATED"
    | undefined;
  const { from: hireFrom, to: hireTo } = parseDateRangeParams({
    from: params.hireFrom,
    to: params.hireTo,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Create and manage staff accounts."
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu
              items={[{ label: "Export Excel", action: exportStaffToExcel }]}
            />
            <Button asChild>
              <Link href="/school/staff/create">New Staff</Link>
            </Button>
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4" method="get">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="q">Search</Label>
              <Input
                id="q"
                name="q"
                defaultValue={q}
                placeholder="Name, email, phone"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select name="role" value={role}>
                <SelectTrigger id="role" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent position={"popper"}>
                  <SelectGroup>
                    <SelectItem value="SCHOOL_ADMIN">School Admin</SelectItem>
                    <SelectItem value="TEACHER">Teacher</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
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
                    <SelectItem value="ONLEAVE">On Leave</SelectItem>
                    <SelectItem value="RESIGNED">Resigned</SelectItem>
                    <SelectItem value="TERMINATED">Terminated</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hireFrom">Hire From</Label>
              <Input
                id="hireFrom"
                name="hireFrom"
                type="date"
                defaultValue={parseTextParam(params.hireFrom)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hireTo">Hire To</Label>
              <Input
                id="hireTo"
                name="hireTo"
                type="date"
                defaultValue={parseTextParam(params.hireTo)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">Apply</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/school/staff">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <StaffTable
        page={page}
        filters={{ q, role, status, hireFrom, hireTo }}
        searchParams={{
          q: params.q,
          role: params.role,
          status: params.status,
          hireFrom: params.hireFrom,
          hireTo: params.hireTo,
          page: params.page,
        }}
      />
    </div>
  );
}
