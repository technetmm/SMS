"use server";

import { revalidateLocalizedPath } from "@/lib/revalidate";
import { prisma } from "@/lib/prisma/client";
import { formDataToObject } from "@/lib/form-utils";
import { paginateQuery } from "@/lib/pagination";
import { requireSchoolAdminAccess, requireTenant } from "@/lib/rbac";
import { courseCreateSchema, courseUpdateSchema } from "@/lib/validators";
import { containsInsensitive } from "@/lib/table-filters";

export type CourseActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  msgID?: number;
};

export type CourseTableFilters = {
  q?: string;
  createdFrom?: Date;
  createdTo?: Date;
};

export async function createCourse(
  _prevState: CourseActionState,
  formData: FormData,
): Promise<CourseActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const raw = formDataToObject(formData);
  const subjectIds = formData
    .getAll("subjectIds")
    .map((value) => String(value))
    .filter(Boolean);
  const parsedWithSubjects = courseCreateSchema.safeParse({
    name: raw.name,
    subjectIds,
  });

  if (!parsedWithSubjects.success) {
    return {
      status: "error",
      message: parsedWithSubjects.error.errors[0]?.message,
      msgID: Date.now(),
    };
  }

  const subjects = await prisma.subject.findMany({
    where: { id: { in: parsedWithSubjects.data.subjectIds }, schoolId },
    select: { id: true },
  });

  if (subjects.length !== parsedWithSubjects.data.subjectIds.length) {
    return {
      status: "error",
      message: "One or more selected subjects are invalid.",
      msgID: Date.now(),
    };
  }

  try {
    await prisma.course.create({
      data: {
        schoolId,
        name: parsedWithSubjects.data.name,
        subjects: {
          create: parsedWithSubjects.data.subjectIds.map((subjectId) => ({
            schoolId,
            subjectId,
          })),
        },
      },
    });
  } catch {
    return {
      status: "error",
      message: "Course name already exists.",
      msgID: Date.now(),
    };
  }

  revalidateLocalizedPath("/school/courses");
  revalidateLocalizedPath("/school/classes");
  return {
    status: "success",
    message: "Course created successfully.",
    msgID: Date.now(),
  };
}

export async function getCourses() {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const courses = await prisma.course.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      subjects: {
        select: { subject: { select: { id: true, name: true } } },
      },
      _count: {
        select: {
          classes: true,
        },
      },
    },
  });

  return courses.map((course) => ({
    ...course,
    subjects: course.subjects.map((mapping) => mapping.subject),
  }));
}

export async function getPaginatedCourses({
  page,
  filters,
}: {
  page: number;
  filters?: CourseTableFilters;
}) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();
  const where: Record<string, unknown> = { schoolId };

  if (filters?.createdFrom || filters?.createdTo) {
    where.createdAt = {
      ...(filters.createdFrom ? { gte: filters.createdFrom } : {}),
      ...(filters.createdTo ? { lte: filters.createdTo } : {}),
    };
  }

  if (filters?.q) {
    where.OR = [
      { name: containsInsensitive(filters.q) },
      {
        subjects: {
          some: {
            subject: {
              name: containsInsensitive(filters.q),
            },
          },
        },
      },
    ];
  }

  const result = await paginateQuery({
    page,
    count: () => prisma.course.count({ where }),
    query: ({ skip, take }) =>
      prisma.course.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          name: true,
          createdAt: true,
          subjects: {
            select: { subject: { select: { id: true, name: true } } },
          },
          _count: {
            select: {
              classes: true,
            },
          },
        },
      }),
  });

  return {
    ...result,
    items: result.items.map((course) => ({
      ...course,
      subjects: course.subjects.map((mapping) => mapping.subject),
    })),
  };
}

export async function getCourseById(id: string) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  if (!id) return null;

  return prisma.course
    .findFirst({
      where: { id, schoolId },
      select: {
        id: true,
        name: true,
        subjects: {
          select: { subject: { select: { id: true, name: true } } },
        },
      },
    })
    .then((course) =>
      course
        ? {
            ...course,
            subjects: course.subjects.map((mapping) => mapping.subject),
          }
        : null,
    );
}

export async function updateCourse(
  _prevState: CourseActionState,
  formData: FormData,
): Promise<CourseActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const raw = formDataToObject(formData);
  const subjectIds = formData
    .getAll("subjectIds")
    .map((value) => String(value))
    .filter(Boolean);
  const parsed = courseUpdateSchema.safeParse({
    id: raw.id,
    name: raw.name,
    subjectIds,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message,
      msgID: Date.now(),
    };
  }

  const [course, subjects] = await Promise.all([
    prisma.course.findFirst({
      where: { id: parsed.data.id, schoolId },
      select: { id: true },
    }),
    prisma.subject.findMany({
      where: { id: { in: parsed.data.subjectIds }, schoolId },
      select: { id: true },
    }),
  ]);

  if (!course) {
    return { status: "error", message: "Course not found.", msgID: Date.now() };
  }

  if (subjects.length !== parsed.data.subjectIds.length) {
    return {
      status: "error",
      message: "One or more selected subjects are invalid.",
      msgID: Date.now(),
    };
  }

  try {
    await prisma.course.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        subjects: {
          deleteMany: {},
          create: parsed.data.subjectIds.map((subjectId) => ({
            schoolId,
            subjectId,
          })),
        },
      },
    });
  } catch {
    return {
      status: "error",
      message: "Course name already exists.",
      msgID: Date.now(),
    };
  }

  revalidateLocalizedPath("/school/courses");
  revalidateLocalizedPath("/school/classes");
  return {
    status: "success",
    message: "Course updated successfully.",
    msgID: Date.now(),
  };
}

export async function deleteCourse(
  _prevState: CourseActionState,
  formData: FormData,
): Promise<CourseActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const id = String(formData.get("id") ?? "");
  if (!id)
    return {
      status: "error",
      message: "Course id is required.",
      msgID: Date.now(),
    };

  const course = await prisma.course.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      _count: { select: { classes: true } },
    },
  });

  if (!course) {
    return { status: "error", message: "Course not found.", msgID: Date.now() };
  }

  if (course._count.classes > 0) {
    return {
      status: "error",
      message: "This course is already used by classes. Remove classes first.",
      msgID: Date.now(),
    };
  }

  await prisma.course.delete({ where: { id } });

  revalidateLocalizedPath("/school/courses");
  revalidateLocalizedPath("/school/classes");
  return {
    status: "success",
    message: "Course deleted successfully.",
    msgID: Date.now(),
  };
}
