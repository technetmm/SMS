import {
  getPaginatedEnrollments,
  type EnrollmentTableFilters,
} from "@/app/(school)/school/enrollments/actions";
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
  ENROLLMENT_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/enum-labels";
import { formatMoney } from "@/lib/helper";
import { UpdateEnrollmentStatusForm } from "@/components/enrollments/update-enrollment-status-form";
import { UpdateProgressForm } from "@/components/enrollments/update-progress-form";
import { EnrollmentRowActions } from "@/components/enrollments/enrollment-row-actions";
import { getLocale, getTranslations } from "next-intl/server";
import { dateFormatter } from "@/lib/formatter";

export async function EnrollmentTable({
  page,
  filters,
  searchParams,
}: {
  page: number;
  filters?: EnrollmentTableFilters;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const [t, locale] = await Promise.all([
    getTranslations("SchoolEntities.enrollments.table"),
    getLocale(),
  ]);
  const rows = await getPaginatedEnrollments({ page, filters });

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.student")}</TableHead>
            <TableHead>{t("columns.section")}</TableHead>
            <TableHead>{t("columns.status")}</TableHead>
            <TableHead>{t("columns.enrolledDate")}</TableHead>
            <TableHead>{t("columns.autoInvoice")}</TableHead>
            <TableHead>{t("columns.progress")}</TableHead>
            <TableHead className="text-right">{t("columns.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.items.map((row) => {
            const latestInvoice = row.invoices[0];
            const latestProgress = row.progress[0];
            const progressValue = latestProgress?.progress ?? 0;
            return (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  {row.student.name}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span>{row.section.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {row.section.class.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Badge
                      variant={row.status === "ACTIVE" ? "default" : "outline"}
                    >
                      {enumLabel(row.status, ENROLLMENT_STATUS_LABELS)}
                    </Badge>
                    <UpdateEnrollmentStatusForm
                      id={row.id}
                      currentStatus={row.status}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  {dateFormatter(locale).format(row.enrolledAt)}
                </TableCell>
                <TableCell>
                  {latestInvoice ? (
                    <div className="space-y-1 text-sm">
                      <p>
                        {t("invoice.final")}:{" "}
                        {formatMoney(
                          Number(latestInvoice.finalAmount),
                          row.tenant.currency,
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("invoice.original")}{" "}
                        {formatMoney(
                          Number(latestInvoice.originalAmount),
                          row.tenant.currency,
                        )}{" "}
                        | {t("invoice.discount")}{" "}
                        {formatMoney(
                          Number(latestInvoice.discount),
                          row.tenant.currency,
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("invoice.paid")}{" "}
                        {formatMoney(
                          Number(latestInvoice.paidAmount),
                          row.tenant.currency,
                        )}{" "}
                        | {t("invoice.remaining")}{" "}
                        {formatMoney(
                          Math.max(
                            0,
                            Number(latestInvoice.finalAmount) -
                              Number(latestInvoice.paidAmount),
                          ),
                          row.tenant.currency,
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("invoice.due")}{" "}
                        {dateFormatter(locale).format(latestInvoice.dueDate)}
                      </p>
                      <Badge
                        variant={
                          latestInvoice.status === "PAID"
                            ? "default"
                            : "outline"
                        }
                      >
                        {enumLabel(latestInvoice.status, PAYMENT_STATUS_LABELS)}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {t("notAvailable")}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-3">
                    <div className="h-2 w-full min-w-40 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${Math.max(0, Math.min(100, progressValue))}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {progressValue.toFixed(0)}%
                    </p>
                    <UpdateProgressForm
                      enrollmentId={row.id}
                      currentProgress={latestProgress?.progress}
                      currentRemark={latestProgress?.remark}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <EnrollmentRowActions
                    id={row.id}
                    studentName={row.student.name}
                  />
                </TableCell>
              </TableRow>
            );
          })}
          {rows.totalCount === 0 ? (
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
        pagination={rows}
        pathname="/school/enrollments"
        searchParams={searchParams}
      />
    </div>
  );
}
