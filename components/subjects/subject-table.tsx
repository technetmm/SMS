import {
  getPaginatedSubjects,
  type SubjectTableFilters,
} from "@/app/(school)/school/subjects/actions";
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
import { SubjectRowActions } from "@/components/subjects/subject-row-actions";
import { dateFormatter } from "@/lib/formatter";
import { getLocale, getTranslations } from "next-intl/server";

export async function SubjectTable({
  page,
  filters,
  searchParams,
}: {
  page: number;
  filters?: SubjectTableFilters;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const [t, locale] = await Promise.all([
    getTranslations("SchoolEntities.subjects.table"),
    getLocale(),
  ]);
  const subjects = await getPaginatedSubjects({ page, filters });

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.courses")}</TableHead>
            <TableHead>{t("columns.createdAt")}</TableHead>
            <TableHead className="text-right">{t("columns.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subjects.items.map((subject) => (
            <TableRow key={subject.id}>
              <TableCell className="font-medium">{subject.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{subject._count.courses}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {dateFormatter(locale).format(subject.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <SubjectRowActions id={subject.id} name={subject.name} />
              </TableCell>
            </TableRow>
          ))}
          {subjects.totalCount === 0 ? (
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
        pagination={subjects}
        pathname="/school/subjects"
        searchParams={searchParams}
      />
    </div>
  );
}
