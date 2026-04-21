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
import { formatMoney } from "@/lib/helper";
import {
  BILLING_TYPE_LABELS,
  CLASS_TYPE_LABELS,
  enumLabel,
  PROGRAM_TYPE_LABELS,
} from "@/lib/enum-labels";
import { getLocale, getTranslations } from "next-intl/server";
import { dateFormatter } from "@/lib/formatter";

export async function ClassTable({
  page,
  filters,
  searchParams,
}: {
  page: number;
  filters?: ClassTableFilters;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const [t, locale] = await Promise.all([
    getTranslations("SchoolEntities.classes.table"),
    getLocale(),
  ]);
  const classes = await getPaginatedClasses({ page, filters });

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.course")}</TableHead>
            <TableHead>{t("columns.type")}</TableHead>
            <TableHead>{t("columns.programType")}</TableHead>
            <TableHead>{t("columns.billingType")}</TableHead>
            <TableHead className="text-right">{t("columns.fee")}</TableHead>
            <TableHead>{t("columns.createdAt")}</TableHead>
            <TableHead className="text-right">{t("columns.actions")}</TableHead>
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
              <TableCell>
                {dateFormatter(locale).format(klass.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/school/classes/${klass.id}/edit`}>
                      {t("actions.edit")}
                    </Link>
                  </Button>
                  <form action={deleteClass}>
                    <input type="hidden" name="id" value={klass.id} />
                    <Button size="sm" type="submit" variant="destructive">
                      {t("actions.delete")}
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
                {t("empty")}
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
