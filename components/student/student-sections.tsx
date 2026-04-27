import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { prisma } from "@/lib/prisma/client";
import { getLocale, getTranslations } from "next-intl/server";
import { dateFormatter } from "@/lib/formatter";
import Link from "next/link";

interface StudentSectionsProps {
  studentId: string;
  schoolId: string;
}

export async function StudentSections({
  studentId,
  schoolId,
}: StudentSectionsProps) {
  const [t, locale] = await Promise.all([
    getTranslations("StudentDashboard.sections"),
    getLocale(),
  ]);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      schoolId,
      studentId,
      status: "ACTIVE",
    },
    include: {
      section: {
        include: {
          class: true,
          staffMappings: {
            include: {
              staff: true,
            },
          },
          enrollments: {
            where: { status: "ACTIVE" },
          },
        },
      },
    },
    orderBy: {
      enrolledAt: "desc",
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {enrollments.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <div className="rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("columns.section")}</TableHead>
                  <TableHead>{t("columns.class")}</TableHead>
                  <TableHead>{t("columns.teacher")}</TableHead>
                  <TableHead>{t("columns.capacity")}</TableHead>
                  <TableHead>{t("columns.enrolled")}</TableHead>
                  <TableHead>{t("columns.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment) => {
                  const activeEnrollments =
                    enrollment.section.enrollments.filter(
                      (item) => item.status === "ACTIVE",
                    ).length;
                  const isFull =
                    activeEnrollments >= enrollment.section.capacity;

                  return (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">
                        {enrollment.section.name}
                      </TableCell>
                      <TableCell>{enrollment.section.class.name}</TableCell>
                      <TableCell>
                        {enrollment.section.staffMappings.length
                          ? enrollment.section.staffMappings
                              .map((mapping) => mapping.staff.name)
                              .join(", ")
                          : t("notAvailable")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isFull ? "outline" : "default"}
                          className={
                            isFull
                              ? "text-destructive border-destructive/40"
                              : ""
                          }
                        >
                          {activeEnrollments} / {enrollment.section.capacity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {dateFormatter(locale).format(enrollment.enrolledAt)}
                      </TableCell>
                      <TableCell>
                        <Button asChild size="sm" variant="outline">
                          <Link
                            href={`/student/sections/${enrollment.section.id}`}
                          >
                            {t("actions.view")}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
