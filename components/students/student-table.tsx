import Link from "next/link";
import { getPaginatedStudents } from "@/app/(school)/school/students/actions";
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
import { StudentRowActions } from "@/components/students/student-row-actions";
import {
  enumLabel,
  GENDER_LABELS,
  STUDENT_STATUS_LABELS,
} from "@/lib/enum-labels";
import { StudentStatus } from "@/app/generated/prisma/enums";
import { getLocale, getTranslations } from "next-intl/server";
import { dateFormatter } from "@/lib/formatter";

export async function StudentTable({
  page,
  query,
  status,
  gender,
  admissionFrom,
  admissionTo,
  searchParams,
}: {
  page: number;
  query?: string;
  status?: StudentStatus | "ALL";
  gender?: "ALL" | "MALE" | "FEMALE" | "OTHER";
  admissionFrom?: Date;
  admissionTo?: Date;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const [t, locale] = await Promise.all([
    getTranslations("SchoolEntities.students.table"),
    getLocale(),
  ]);
  const students = await getPaginatedStudents({
    page,
    query,
    status,
    gender: gender && gender !== "ALL" ? gender : undefined,
    admissionFrom,
    admissionTo,
  });

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.gender")}</TableHead>
            <TableHead>{t("columns.phone")}</TableHead>
            <TableHead>{t("columns.status")}</TableHead>
            <TableHead>{t("columns.admissionDate")}</TableHead>
            <TableHead className="text-right">{t("columns.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.items.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">{student.name}</TableCell>
              <TableCell>{enumLabel(student.gender, GENDER_LABELS)}</TableCell>
              <TableCell>{student.phone ?? "-"}</TableCell>
              <TableCell>
                <Badge
                  variant={student.status === "ACTIVE" ? "default" : "outline"}
                >
                  {enumLabel(student.status, STUDENT_STATUS_LABELS)}
                </Badge>
              </TableCell>
              <TableCell>
                {dateFormatter(locale).format(student.admissionDate)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/school/students/${student.id}`}>
                      {t("actions.view")}
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="default">
                    <Link href={`/school/students/${student.id}/edit`}>
                      {t("actions.edit")}
                    </Link>
                  </Button>
                  <StudentRowActions id={student.id} name={student.name} />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {students.totalCount === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                {t("empty")}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      <TablePagination
        pagination={students}
        pathname="/school/students"
        searchParams={searchParams}
      />
    </div>
  );
}
