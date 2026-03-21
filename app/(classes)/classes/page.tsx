import { prisma } from "@/lib/prisma/client";
import { PageHeader } from "@/components/shared/page-header";
import { ClassesView } from "@/components/shared/classes-view";

export default async function ClassesPage() {
  const [courses, teachers, classes] = await Promise.all([
    prisma.course.findMany({ orderBy: { name: "asc" } }),
    prisma.teacher.findMany({ include: { user: true } }),
    prisma.class.findMany({
      include: {
        course: true,
        sections: { include: { teacher: { include: { user: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes"
        description="Organize subjects, classes, and teaching sections."
      />
      <ClassesView
        courses={courses.map((course) => ({ id: course.id, name: course.name }))}
        teachers={teachers.map((teacher) => ({
          id: teacher.id,
          name: teacher.user.name ?? teacher.user.email ?? "Teacher",
        }))}
        classes={classes.map((item) => ({
          id: item.id,
          name: item.name,
          classType: item.classType,
          programType: item.programType,
          course: { name: item.course.name },
          sections: item.sections.map((section) => ({
            id: section.id,
            name: section.name,
            teacher: section.teacher
              ? { user: { name: section.teacher.user.name } }
              : null,
          })),
        }))}
      />
    </div>
  );
}
