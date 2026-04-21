import Link from "next/link";
import {
  getPaginatedStaff,
  deleteStaff,
  type StaffTableFilters,
} from "@/app/(school)/school/staff/actions";
import { TablePagination } from "@/components/shared/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  enumLabel,
  STAFF_STATUS_LABELS,
  USER_ROLE_LABELS,
} from "@/lib/enum-labels";
import { getLocale, getTranslations } from "next-intl/server";

export async function StaffTable({
  page,
  filters,
  searchParams,
}: {
  page: number;
  filters?: StaffTableFilters;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const [t, locale] = await Promise.all([
    getTranslations("SchoolEntities.staff.table"),
    getLocale(),
  ]);
  const staff = await getPaginatedStaff({ page, filters });
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: locale === "en" ? "medium" : "long",
  });

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.email")}</TableHead>
            <TableHead>{t("columns.phone")}</TableHead>
            <TableHead>{t("columns.role")}</TableHead>
            <TableHead>{t("columns.status")}</TableHead>
            <TableHead>{t("columns.hireDate")}</TableHead>
            <TableHead className="text-right">{t("columns.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.items.map((staff) => (
            <TableRow key={staff.id}>
              <TableCell className="font-medium">{staff.name}</TableCell>
              <TableCell>{staff.email}</TableCell>
              <TableCell>{staff.phone ?? "-"}</TableCell>
              <TableCell>
                {enumLabel(staff.user.role, USER_ROLE_LABELS)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={staff.status === "ACTIVE" ? "default" : "outline"}
                >
                  {enumLabel(staff.status, STAFF_STATUS_LABELS)}
                </Badge>
              </TableCell>
              <TableCell>{formatter.format(staff.hireDate)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/school/staff/${staff.id}`}>
                      {t("actions.view")}
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="default">
                    <Link href={`/school/staff/${staff.id}/edit`}>
                      {t("actions.edit")}
                    </Link>
                  </Button>
                  <form action={deleteStaff}>
                    <input type="hidden" name="id" value={staff.id} />
                    <Button size="sm" variant="destructive" type="submit">
                      {t("actions.delete")}
                    </Button>
                  </form>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {staff.totalCount === 0 ? (
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
        pagination={staff}
        pathname="/school/staff"
        searchParams={searchParams}
      />
    </div>
  );
}
