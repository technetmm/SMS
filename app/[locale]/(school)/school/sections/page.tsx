import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { SectionTable } from "@/components/sections/section-table";
import { parsePageParam } from "@/lib/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseDateRangeParams, parseTextParam } from "@/lib/table-filters";

export default async function SectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; createdFrom?: string; createdTo?: string }>;
}) {
  await requireSchoolAdmin();
  const params = await searchParams;
  const { page: pageParam } = params;
  const page = parsePageParam(pageParam);
  const q = parseTextParam(params.q);
  const { from: createdFrom, to: createdTo } = parseDateRangeParams({
    from: params.createdFrom,
    to: params.createdTo,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sections"
        description="Manage class sections and staff assignments."
        actions={
          <Button asChild>
            <Link href="/school/sections/create">Create Section</Link>
          </Button>
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
              <Input id="q" name="q" defaultValue={q} placeholder="Section, class, or teacher" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="createdFrom">Created From</Label>
              <Input id="createdFrom" name="createdFrom" type="date" defaultValue={parseTextParam(params.createdFrom)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="createdTo">Created To</Label>
              <Input id="createdTo" name="createdTo" type="date" defaultValue={parseTextParam(params.createdTo)} />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">Apply</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/school/sections">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <SectionTable
        page={page}
        filters={{ q, createdFrom, createdTo }}
        searchParams={{
          q: params.q,
          createdFrom: params.createdFrom,
          createdTo: params.createdTo,
          page: params.page,
        }}
      />
    </div>
  );
}

