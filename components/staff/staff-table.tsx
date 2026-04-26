import { getServerAuth } from "@/auth";
import {
  getPaginatedStaff,
  type StaffTableFilters,
} from "@/app/(school)/school/staff/actions";
import { TablePagination } from "@/components/shared/table-pagination";
import { Badge } from "@/components/ui/badge";
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
import { StaffRowActionsMenu } from "@/components/staff/staff-row-actions-menu";
import { dateFormatter } from "@/lib/formatter";

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
  const session = await getServerAuth();
  const actorRole = session?.user?.role;
  const staff = await getPaginatedStaff({ page, filters });

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
              <TableCell>
                {dateFormatter(locale, { dateStyle: "medium" }).format(
                  staff.hireDate,
                )}
              </TableCell>
              <TableCell className="text-right">
                {actorRole ? (
                  <div className="flex justify-end">
                    <StaffRowActionsMenu
                      staffId={staff.id}
                      targetUserId={staff.userId}
                      actorRole={actorRole}
                      targetRole={staff.user.role}
                    />
                  </div>
                ) : null}
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
