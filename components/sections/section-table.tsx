import Link from "next/link";
import {
  getPaginatedSections,
  deleteSection,
  type SectionTableFilters,
} from "@/app/(school)/school/sections/actions";
import { TablePagination } from "@/components/shared/table-pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getLocale, getTranslations } from "next-intl/server";
import { dateFormatter } from "@/lib/formatter";

export async function SectionTable({
  page,
  filters,
  searchParams,
}: {
  page: number;
  filters?: SectionTableFilters;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const [t, locale] = await Promise.all([
    getTranslations("SchoolEntities.sections.table"),
    getLocale(),
  ]);
  const sections = await getPaginatedSections({ page, filters });

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.class")}</TableHead>
            <TableHead>{t("columns.capacity")}</TableHead>
            <TableHead>{t("columns.teacher")}</TableHead>
            <TableHead>{t("columns.meetingLink")}</TableHead>
            <TableHead>{t("columns.status")}</TableHead>
            <TableHead>{t("columns.createdAt")}</TableHead>
            <TableHead className="text-right">{t("columns.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sections.items.map((section) => {
            const activeEnrollments = section.enrollments.filter(
              (item) => item.status === "ACTIVE",
            ).length;
            const isFull = activeEnrollments >= section.capacity;

            return (
              <TableRow key={section.id}>
                <TableCell className="font-medium">{section.name}</TableCell>
                <TableCell>{section.class.name}</TableCell>
                <TableCell>
                  {activeEnrollments} / {section.capacity}
                </TableCell>
                <TableCell>
                  {section.staffMappings.length
                    ? section.staffMappings
                        .map((item) => item.staff.name)
                        .join(", ")
                    : t("notAvailable")}
                </TableCell>
                <TableCell>
                  {section.meetingLink ? (
                    <a
                      href={section.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4"
                    >
                      {t("actions.openMeeting")}
                    </a>
                  ) : (
                    t("notAvailable")
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={isFull ? "outline" : "default"}
                    className={
                      isFull ? "text-destructive border-destructive/40" : ""
                    }
                  >
                    {isFull ? t("status.full") : t("status.available")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {dateFormatter(locale).format(section.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/school/sections/${section.id}`}>
                        {t("actions.view")}
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/school/sections/${section.id}/edit`}>
                        {t("actions.edit")}
                      </Link>
                    </Button>
                    <form action={deleteSection}>
                      <input type="hidden" name="id" value={section.id} />
                      <Button size="sm" type="submit" variant="destructive">
                        {t("actions.delete")}
                      </Button>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {sections.totalCount === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                {t("empty")}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      <TablePagination
        pagination={sections}
        pathname="/school/sections"
        searchParams={searchParams}
      />
    </div>
  );
}
