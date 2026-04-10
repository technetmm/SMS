import { requireSchoolAdminAccess } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { PayrollGenerateForm } from "@/components/payroll/payroll-generate-form";
import { PayrollTable } from "@/components/payroll/payroll-table";
import { generatePayroll } from "@/app/(school)/school/payroll/actions";
import { parsePageParam } from "@/lib/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { parseDateRangeParams, parseNumberParam, parseTextParam } from "@/lib/table-filters";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    monthFrom?: string;
    monthTo?: string;
    totalMin?: string;
    totalMax?: string;
  }>;
}) {
  await requireSchoolAdminAccess();
  const params = await searchParams;
  const { page: pageParam } = params;
  const page = parsePageParam(pageParam);
  const q = parseTextParam(params.q);
  const { from: monthFrom, to: monthTo } = parseDateRangeParams({
    from: params.monthFrom,
    to: params.monthTo,
  });
  const totalMin = parseNumberParam(params.totalMin);
  const totalMax = parseNumberParam(params.totalMax);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        description="Generate and review monthly staff payroll."
      />
      <PayrollGenerateForm action={generatePayroll} />
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4" method="get">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="q">Search Staff</Label>
              <Input id="q" name="q" defaultValue={q} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="monthFrom">Month From</Label>
              <Input id="monthFrom" name="monthFrom" type="date" defaultValue={parseTextParam(params.monthFrom)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="monthTo">Month To</Label>
              <Input id="monthTo" name="monthTo" type="date" defaultValue={parseTextParam(params.monthTo)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="totalMin">Total Min</Label>
              <Input id="totalMin" name="totalMin" type="number" step="0.01" defaultValue={params.totalMin} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="totalMax">Total Max</Label>
              <Input id="totalMax" name="totalMax" type="number" step="0.01" defaultValue={params.totalMax} />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">Apply</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/school/payroll">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <PayrollTable
        page={page}
        filters={{ q, monthFrom, monthTo, totalMin, totalMax }}
        searchParams={{
          q: params.q,
          monthFrom: params.monthFrom,
          monthTo: params.monthTo,
          totalMin: params.totalMin,
          totalMax: params.totalMax,
          page: params.page,
        }}
      />
    </div>
  );
}

