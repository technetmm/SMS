import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ClassTable } from "@/components/classes/class-table";
import { parsePageParam } from "@/lib/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  parseDateRangeParams,
  parseNumberParam,
  parseTextParam,
} from "@/lib/table-filters";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    classType?: string;
    programType?: string;
    billingType?: string;
    createdFrom?: string;
    createdTo?: string;
    feeMin?: string;
    feeMax?: string;
  }>;
}) {
  await requireSchoolAdmin();
  const params = await searchParams;
  const { page: pageParam } = params;
  const page = parsePageParam(pageParam);
  const q = parseTextParam(params.q);
  const classType = parseTextParam(params.classType) as
    | "ONE_ON_ONE"
    | "PRIVATE"
    | "GROUP"
    | undefined;
  const programType = parseTextParam(params.programType) as
    | "REGULAR"
    | "INTENSIVE"
    | undefined;
  const billingType = parseTextParam(params.billingType) as
    | "ONE_TIME"
    | "MONTHLY"
    | undefined;
  const { from: createdFrom, to: createdTo } = parseDateRangeParams({
    from: params.createdFrom,
    to: params.createdTo,
  });
  const feeMin = parseNumberParam(params.feeMin);
  const feeMax = parseNumberParam(params.feeMax);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes"
        description="Manage classes for your school."
        actions={
          <Button asChild>
            <Link href="/school/classes/create">Create Class</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4" method="get">
            <div className="grid gap-2">
              <Label htmlFor="q">Search</Label>
              <Input
                id="q"
                name="q"
                defaultValue={q}
                placeholder="Class or course"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="classType">Class Type</Label>
              <Select name="classType" value={classType}>
                <SelectTrigger id="classType" className="w-full">
                  <SelectValue placeholder="Select class type" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="ONE_ON_ONE">One On One</SelectItem>
                  <SelectItem value="PRIVATE">Private</SelectItem>
                  <SelectItem value="GROUP">Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="programType">Program Type</Label>

              <Select name="programType" value={programType}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Select program type" />
                </SelectTrigger>
                <SelectContent position={"popper"}>
                  <SelectGroup>
                    <SelectItem value="REGULAR">Regular</SelectItem>
                    <SelectItem value="INTENSIVE">Intensive</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="billingType">Billing Type</Label>
              <Select name="billingType" value={billingType}>
                <SelectTrigger id="billingType" className="w-full">
                  <SelectValue placeholder="Select billing type" />
                </SelectTrigger>
                <SelectContent position={"popper"}>
                  <SelectGroup>
                    <SelectItem value="ONE_TIME">One Time</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="createdFrom">Created From</Label>
              <Input
                id="createdFrom"
                name="createdFrom"
                type="date"
                defaultValue={parseTextParam(params.createdFrom)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="createdTo">Created To</Label>
              <Input
                id="createdTo"
                name="createdTo"
                type="date"
                defaultValue={parseTextParam(params.createdTo)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feeMin">Fee Min</Label>
              <Input
                id="feeMin"
                name="feeMin"
                type="number"
                step="0.01"
                defaultValue={params.feeMin}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feeMax">Fee Max</Label>
              <Input
                id="feeMax"
                name="feeMax"
                type="number"
                step="0.01"
                defaultValue={params.feeMax}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">Apply</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/school/classes">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <ClassTable
        page={page}
        filters={{
          q,
          classType,
          programType,
          billingType,
          createdFrom,
          createdTo,
          feeMin,
          feeMax,
        }}
        searchParams={{
          q: params.q,
          classType: params.classType,
          programType: params.programType,
          billingType: params.billingType,
          createdFrom: params.createdFrom,
          createdTo: params.createdTo,
          feeMin: params.feeMin,
          feeMax: params.feeMax,
          page: params.page,
        }}
      />
    </div>
  );
}
