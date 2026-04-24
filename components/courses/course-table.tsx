import {
  getPaginatedCourses,
  type CourseTableFilters,
} from "@/app/(school)/school/courses/actions";
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
import { CourseRowActions } from "@/components/courses/course-row-actions";
import { getLocale, getTranslations } from "next-intl/server";
import { dateFormatter } from "@/lib/formatter";

export async function CourseTable({
  page,
  filters,
  searchParams,
}: {
  page: number;
  filters?: CourseTableFilters;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const [t, locale] = await Promise.all([
    getTranslations("SchoolEntities.courses.table"),
    getLocale(),
  ]);
  const courses = await getPaginatedCourses({ page, filters });

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.subject")}</TableHead>
            <TableHead>{t("columns.classes")}</TableHead>
            <TableHead>{t("columns.createdAt")}</TableHead>
            <TableHead className="text-right">{t("columns.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.items.map((course) => (
            <TableRow key={course.id}>
              <TableCell className="font-medium">{course.name}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {course.subjects.length === 0 ? (
                    <span className="text-sm text-muted-foreground">
                      {t("notAvailable")}
                    </span>
                  ) : (
                    course.subjects.map((subject) => (
                      <Badge key={subject.id} variant="outline">
                        {subject.name}
                      </Badge>
                    ))
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{course._count.classes}</Badge>
              </TableCell>
              <TableCell>
                {dateFormatter(locale).format(course.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <CourseRowActions id={course.id} name={course.name} />
              </TableCell>
            </TableRow>
          ))}
          {courses.totalCount === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                {t("empty")}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      <TablePagination
        pagination={courses}
        pathname="/school/courses"
        searchParams={searchParams}
      />
    </div>
  );
}
