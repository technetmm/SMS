import { DeviceApprovalTable } from "@/components/auth/device-approval-table";
import { PageHeader } from "@/components/shared/page-header";
import { TablePagination } from "@/components/shared/table-pagination";
import { getPaginatedPendingDeviceApprovalRows } from "@/lib/auth/device-approval-queue";
import { parsePageParam } from "@/lib/pagination";
import { requireSchoolAdminAccess } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { parseDateRangeParams, parseTextParam } from "@/lib/table-filters";

export default async function SchoolDeviceApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    createdFrom?: string;
    createdTo?: string;
    expiresFrom?: string;
    expiresTo?: string;
  }>;
}) {
  const user = await requireSchoolAdminAccess();
  const params = await searchParams;
  const { page: pageParam } = params;
  const page = parsePageParam(pageParam);
  const q = parseTextParam(params.q);
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
      role: user.role,
      schoolId: user.schoolId,
    },
    {
      page,
      filters: {
        q,
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
        description="Review and handle staff and student device login requests."
      />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4" method="get">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="q">Search</Label>
              <Input id="q" name="q" defaultValue={q} placeholder="Name, email, IP, user agent" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="createdFrom">Requested From</Label>
              <Input id="createdFrom" name="createdFrom" type="date" defaultValue={parseTextParam(params.createdFrom)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="createdTo">Requested To</Label>
              <Input id="createdTo" name="createdTo" type="date" defaultValue={parseTextParam(params.createdTo)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiresFrom">Expires From</Label>
              <Input id="expiresFrom" name="expiresFrom" type="date" defaultValue={parseTextParam(params.expiresFrom)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiresTo">Expires To</Label>
              <Input id="expiresTo" name="expiresTo" type="date" defaultValue={parseTextParam(params.expiresTo)} />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">Apply</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/school/device-approvals">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-background">
        <DeviceApprovalTable initialRequests={requests.items} />
        <TablePagination
          pagination={requests}
          pathname="/school/device-approvals"
          searchParams={{
            q: params.q,
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
