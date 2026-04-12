import Link from "next/link";
import {
  getPaginatedClasses,
  deleteClass,
  type ClassTableFilters,
} from "@/app/(school)/school/classes/actions";
import { TablePagination } from "@/components/shared/table-pagination";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dateFormatter, formatMoney } from "@/lib/helper";
import {
  BILLING_TYPE_LABELS,
  CLASS_TYPE_LABELS,
  enumLabel,
  PROGRAM_TYPE_LABELS,
} from "@/lib/enum-labels";

export async function ClassTable({
  page,
  filters,
  searchParams,
}: {
  page: number;
  filters?: ClassTableFilters;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const classes = await getPaginatedClasses({ page, filters });

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Program Type</TableHead>
            <TableHead>Billing Type</TableHead>
            <TableHead className="text-right">Fee</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.items.map((klass) => (
            <TableRow key={klass.id}>
              <TableCell className="font-medium">{klass.name}</TableCell>
              <TableCell>{klass.course.name}</TableCell>
              <TableCell>
                {enumLabel(klass.classType, CLASS_TYPE_LABELS)}
              </TableCell>
              <TableCell>
                {enumLabel(klass.programType, PROGRAM_TYPE_LABELS)}
              </TableCell>
              <TableCell>
                {enumLabel(klass.billingType, BILLING_TYPE_LABELS)}
              </TableCell>
              <TableCell className="text-right">
                {formatMoney(Number(klass.fee), klass.tenant.currency)}
              </TableCell>
              <TableCell>{dateFormatter.format(klass.createdAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/school/classes/${klass.id}/edit`}>Edit</Link>
                  </Button>
                  <form action={deleteClass}>
                    <input type="hidden" name="id" value={klass.id} />
                    <Button size="sm" type="submit" variant="destructive">
                      Delete
                    </Button>
                  </form>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {classes.totalCount === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                No classes yet. Create your first class.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      <TablePagination
        pagination={classes}
        pathname="/school/classes"
        searchParams={searchParams}
      />
    </div>
  );
}
