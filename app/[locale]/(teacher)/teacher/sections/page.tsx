import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { TeacherAccessFallback } from "@/components/teacher/teacher-access-fallback";
import {
  getTeacherSections,
  requireTeacherAccess,
} from "@/app/(teacher)/teacher/actions";
import { getTranslations } from "next-intl/server";

export default async function TeacherSectionsPage() {
  const [t, scope, sections] = await Promise.all([
    getTranslations("TeacherSite.sections"),
    requireTeacherAccess(),
    getTeacherSections(),
  ]);

  if (!scope.schoolId || !scope.staffId) {
    return <TeacherAccessFallback />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <Card
            key={section.id}
            className="transition-colors hover:bg-muted/20"
          >
            <CardHeader>
              <CardTitle className="text-base">
                <Link
                  href={`/teacher/sections/${section.id}`}
                  className="hover:underline"
                >
                  {section.name}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">{section.className}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {t("labels.students", {
                    count: section.activeStudents,
                    capacity: section.capacity,
                  })}
                </Badge>
                <Badge variant="outline">
                  {section.room
                    ? t("labels.room", { room: section.room })
                    : t("labels.roomNotSet")}
                </Badge>
              </div>
              <div className="flex items-center justify-between pt-1">
                <Link
                  href={`/teacher/sections/${section.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {t("actions.viewDetails")}
                </Link>
                {section.meetingLink ? (
                  <a
                    href={section.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("actions.openMeeting")}
                    title={t("actions.openMeeting")}
                    className="inline-flex size-8 items-center justify-center rounded-md border border-input hover:bg-accent hover:text-accent-foreground"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sections.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("empty")}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
