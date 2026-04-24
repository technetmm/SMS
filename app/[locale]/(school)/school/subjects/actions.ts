"use server";

import { revalidateLocalizedPath } from "@/lib/revalidate";
import { prisma } from "@/lib/prisma/client";
import { formDataToObject } from "@/lib/form-utils";
import { paginateQuery } from "@/lib/pagination";
import { requireSchoolAdminAccess, requireTenant } from "@/lib/rbac";
import { subjectCreateSchema, subjectUpdateSchema } from "@/lib/validators";
import { containsInsensitive } from "@/lib/table-filters";

export type SubjectActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export type SubjectTableFilters = {
  q?: string;
  createdFrom?: Date;
  createdTo?: Date;
};

export async function createSubject(
  _prevState: SubjectActionState,
  formData: FormData,
): Promise<SubjectActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = subjectCreateSchema.safeParse(raw);

  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  try {
    await prisma.subject.create({
      data: {
        schoolId,
        name: parsed.data.name,
      },
    });
  } catch {
    return { status: "error", message: "Subject name already exists." };
  }

  revalidateLocalizedPath("/school/subjects");
  revalidateLocalizedPath("/school/courses");
  return { status: "success", message: "Subject created successfully." };
}

export async function getSubjects() {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  return prisma.subject.findMany({
    where: { schoolId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: {
        select: {
          courses: true,
        },
      },
    },
  });
}

export async function getPaginatedSubjects({
  page,
  filters,
}: {
  page: number;
  filters?: SubjectTableFilters;
}) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();
  const where: Record<string, unknown> = { schoolId };

  if (filters?.q) {
    where.name = containsInsensitive(filters.q);
  }

  if (filters?.createdFrom || filters?.createdTo) {
    where.createdAt = {
      ...(filters.createdFrom ? { gte: filters.createdFrom } : {}),
      ...(filters.createdTo ? { lte: filters.createdTo } : {}),
    };
  }

  return paginateQuery({
    page,
    count: () => prisma.subject.count({ where }),
    query: ({ skip, take }) =>
      prisma.subject.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take,
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: {
            select: {
              courses: true,
            },
          },
        },
      }),
  });
}

export async function getSubjectById(id: string) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  if (!id) return null;

  return prisma.subject.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function updateSubject(
  _prevState: SubjectActionState,
  formData: FormData,
): Promise<SubjectActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = subjectUpdateSchema.safeParse(raw);

  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const existing = await prisma.subject.findFirst({
    where: {
      id: parsed.data.id,
      schoolId,
    },
    select: { id: true },
  });

  if (!existing) {
    return { status: "error", message: "Subject not found." };
  }

  try {
    await prisma.subject.update({
      where: { id: parsed.data.id },
      data: { name: parsed.data.name },
    });
  } catch {
    return { status: "error", message: "Subject name already exists." };
  }

  revalidateLocalizedPath("/school/subjects");
  revalidateLocalizedPath("/school/courses");
  return { status: "success", message: "Subject updated successfully." };
}

export async function deleteSubject(
  _prevState: SubjectActionState,
  formData: FormData,
): Promise<SubjectActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const id = String(formData.get("id") ?? "");
  if (!id) return { status: "error", message: "Subject id is required." };

  const subject = await prisma.subject.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      _count: { select: { courses: true } },
    },
  });

  if (!subject) {
    return { status: "error", message: "Subject not found." };
  }

  if (subject._count.courses > 0) {
    return {
      status: "error",
      message: "This subject is in use by courses. Remove courses first.",
    };
  }

  await prisma.subject.delete({ where: { id } });

  revalidateLocalizedPath("/school/subjects");
  revalidateLocalizedPath("/school/courses");
  return { status: "success", message: "Subject deleted successfully." };
}
