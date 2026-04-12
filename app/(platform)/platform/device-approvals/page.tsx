import { UserRole } from "@/app/generated/prisma/enums";
import { DeviceApprovalTable } from "@/components/auth/device-approval-table";
import { PageHeader } from "@/components/shared/page-header";
import { TablePagination } from "@/components/shared/table-pagination";
import { getPaginatedPendingDeviceApprovalRows } from "@/lib/auth/device-approval-queue";
import { parsePageParam } from "@/lib/pagination";
import { requireSuperAdminAccess } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TableFilterSelect } from "@/components/shared/table-filter-select";
import Link from "next/link";
import {
  parseDateRangeParams,
  parseTableFilterEnumParam,
  parseTextParam,
  TABLE_FILTER_ALL_VALUE,
} from "@/lib/table-filters";

export default async function PlatformDeviceApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    requesterRole?: string;
    createdFrom?: string;
    createdTo?: string;
    expiresFrom?: string;
    expiresTo?: string;
  }>;
}) {
  await requireSuperAdminAccess();
  const params = await searchParams;
  const { page: pageParam } = params;
  const page = parsePageParam(pageParam);
  const q = parseTextParam(params.q);
  const requesterRole = parseTableFilterEnumParam(params.requesterRole, [
    UserRole.SCHOOL_SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
  ] as const);
  const createdRange = parseDateRangeParams({
    from: params.createdFrom,
    to: params.createdTo,
  });
  const expiresRange = parseDateRangeParams({
    from: params.expiresFrom,
    to: params.expiresTo,
  });

  const requests = await getPaginatedPendingDeviceApprovalRows(
    {
      role: UserRole.SUPER_ADMIN,
    },
    {
      page,
      filters: {
        q,
        requesterRole,
        createdFrom: createdRange.from,
        createdTo: createdRange.to,
        expiresFrom: expiresRange.from,
        expiresTo: expiresRange.to,
      },
    },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Device Approvals"
        description="Review and handle school admin device login requests."
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
                placeholder="Name, email, school, IP, user agent"
              />
            </div>
            <TableFilterSelect
              id="requesterRole"
              name="requesterRole"
              label="Requester Role"
              placeholder="All roles"
              defaultValue={params.requesterRole ?? TABLE_FILTER_ALL_VALUE}
              options={[
                { value: "SCHOOL_SUPER_ADMIN", label: "School Owner" },
                { value: "SCHOOL_ADMIN", label: "School Admin" },
                { value: "TEACHER", label: "Teacher" },
                { value: "STUDENT", label: "Student" },
              ]}
            />
            <div className="grid gap-2">
              <Label htmlFor="createdFrom">Requested From</Label>
              <Input
                id="createdFrom"
                name="createdFrom"
                type="date"
                defaultValue={parseTextParam(params.createdFrom)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="createdTo">Requested To</Label>
              <Input
                id="createdTo"
                name="createdTo"
                type="date"
                defaultValue={parseTextParam(params.createdTo)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiresFrom">Expires From</Label>
              <Input
                id="expiresFrom"
                name="expiresFrom"
                type="date"
                defaultValue={parseTextParam(params.expiresFrom)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiresTo">Expires To</Label>
              <Input
                id="expiresTo"
                name="expiresTo"
                type="date"
                defaultValue={parseTextParam(params.expiresTo)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">Apply</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/platform/device-approvals">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-background">
        <DeviceApprovalTable initialRequests={requests.items} showSchool />
        <TablePagination
          pagination={requests}
          pathname="/platform/device-approvals"
          searchParams={{
            q: params.q,
            requesterRole: params.requesterRole,
            createdFrom: params.createdFrom,
            createdTo: params.createdTo,
            expiresFrom: params.expiresFrom,
            expiresTo: params.expiresTo,
            page: params.page,
          }}
        />
      </div>
    </div>
  );
}
