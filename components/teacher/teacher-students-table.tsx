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
import { enumLabel, ENROLLMENT_STATUS_LABELS } from "@/lib/enum-labels";
import { TeacherProgressForm } from "@/components/teacher/teacher-progress-form";
import { getTranslations } from "next-intl/server";

export async function TeacherStudentsTable({
  rows,
  searchParams,
}: {
  rows: {
    items: Array<{
      id: string;
      status: "ACTIVE" | "COMPLETED" | "DROPPED";
      student: {
        id: string;
        name: string;
        gender: "MALE" | "FEMALE" | "OTHER";
        phone: string | null;
      };
      section: {
        id: string;
        name: string;
        class: { name: string };
      };
      progress: Array<{
        progress: number;
        remark: string | null;
        updatedAt: Date;
      }>;
    }>;
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const t = await getTranslations("TeacherSite.students");

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.student")}</TableHead>
            <TableHead>{t("columns.section")}</TableHead>
            <TableHead>{t("columns.status")}</TableHead>
            <TableHead>{t("columns.progress")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.items.map((row) => {
            const latestProgress = row.progress[0];
            const progressValue = latestProgress?.progress ?? 0;

            return (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{row.student.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {row.student.phone ?? t("notAvailable")}
                    </span>
                  </div>
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
                  <Badge variant={row.status === "ACTIVE" ? "default" : "outline"}>
                    {enumLabel(row.status, ENROLLMENT_STATUS_LABELS)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-3 min-w-52">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
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
                    <TeacherProgressForm
                      enrollmentId={row.id}
                      currentProgress={latestProgress?.progress}
                      currentRemark={latestProgress?.remark}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {rows.totalCount === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
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
        pathname="/teacher/students"
        searchParams={searchParams}
      />
    </div>
  );
}
