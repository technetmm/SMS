import { getEnrollments } from "@/app/(school)/school/enrollments/actions";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { enumLabel, ENROLLMENT_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/enum-labels";
import { formatMoney } from "@/lib/helper";
import { UpdateEnrollmentStatusForm } from "@/components/enrollments/update-enrollment-status-form";
import { UpdateProgressForm } from "@/components/enrollments/update-progress-form";

export async function EnrollmentTable() {
  const rows = await getEnrollments();
  const formatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Enrolled Date</TableHead>
            <TableHead>Auto Invoice</TableHead>
            <TableHead>Progress</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const latestInvoice = row.invoices[0];
            const latestProgress = row.progress[0];
            const progressValue = latestProgress?.progress ?? 0;
            return (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.student.name}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span>{row.section.name}</span>
                    <span className="text-xs text-muted-foreground">{row.section.class.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Badge variant={row.status === "ACTIVE" ? "default" : "outline"}>
                      {enumLabel(row.status, ENROLLMENT_STATUS_LABELS)}
                    </Badge>
                    <UpdateEnrollmentStatusForm
                      id={row.id}
                      currentStatus={row.status}
                    />
                  </div>
                </TableCell>
                <TableCell>{formatter.format(row.enrolledAt)}</TableCell>
                <TableCell>
                  {latestInvoice ? (
                    <div className="space-y-1 text-sm">
                      <p>
                        Final:{" "}
                        {formatMoney(
                          Number(latestInvoice.finalAmount),
                          row.tenant.currency,
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Original{" "}
                        {formatMoney(
                          Number(latestInvoice.originalAmount),
                          row.tenant.currency,
                        )}{" "}
                        | Discount{" "}
                        {formatMoney(
                          Number(latestInvoice.discount),
                          row.tenant.currency,
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Paid{" "}
                        {formatMoney(
                          Number(latestInvoice.paidAmount),
                          row.tenant.currency,
                        )}{" "}
                        | Remaining{" "}
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
                        Due {formatter.format(latestInvoice.dueDate)}
                      </p>
                      <Badge variant={latestInvoice.status === "PAID" ? "default" : "outline"}>
                        {enumLabel(latestInvoice.status, PAYMENT_STATUS_LABELS)}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-3">
                    <div className="h-2 w-full min-w-40 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${Math.max(0, Math.min(100, progressValue))}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{progressValue.toFixed(0)}%</p>
                    <UpdateProgressForm
                      enrollmentId={row.id}
                      currentProgress={latestProgress?.progress}
                      currentRemark={latestProgress?.remark}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                No enrollments yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
