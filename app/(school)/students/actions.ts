"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma/client";
import { requireSchoolAdminAccess, requireTenant } from "@/lib/rbac";
import { formDataToObject, emptyToUndefined } from "@/lib/form-utils";
import { studentCreateSchema, studentUpdateSchema } from "@/lib/validators";
import { StudentStatus, UserRole } from "@/app/generated/prisma/enums";

export type StudentActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function createStudent(
  _prevState: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = studentCreateSchema.safeParse({
    ...raw,
    fatherName: emptyToUndefined(raw.fatherName),
    motherName: emptyToUndefined(raw.motherName),
    phone: emptyToUndefined(raw.phone),
    address: emptyToUndefined(raw.address),
    email: emptyToUndefined(raw.email),
    password: emptyToUndefined(raw.password),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const shouldCreateAccount = Boolean(parsed.data.createAccount);
  if (shouldCreateAccount && (!parsed.data.email || !parsed.data.password)) {
    return { status: "error", message: "Email and password are required." };
  }

  const existing = parsed.data.email
    ? await prisma.user.findUnique({
        where: { email: parsed.data.email },
        select: { id: true },
      })
    : null;

  if (existing) {
    return { status: "error", message: "Email already exists." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const user = shouldCreateAccount
        ? await tx.user.create({
            data: {
              email: parsed.data.email!,
              name: parsed.data.name,
              role: UserRole.STUDENT,
              passwordHash: await bcrypt.hash(parsed.data.password!, 10),
              schoolId,
            },
          })
        : null;

      await tx.student.create({
        data: {
          schoolId,
          userId: user?.id,
          name: parsed.data.name,
          gender: parsed.data.gender,
          dob: parsed.data.dob,
          fatherName: parsed.data.fatherName,
          motherName: parsed.data.motherName,
          phone: parsed.data.phone,
          address: parsed.data.address,
          status: parsed.data.status,
        },
      });

      if (user) {
        const studentRole = await tx.role.findFirst({
          where: { schoolId, name: "Student" },
          select: { id: true },
        });
        if (studentRole) {
          await tx.userRoleAssignment.upsert({
            where: { userId_roleId: { userId: user.id, roleId: studentRole.id } },
            update: {},
            create: { userId: user.id, roleId: studentRole.id },
          });
        }
      }
    });
  } catch (error) {
    console.error("createStudent failed", error);
    return { status: "error", message: "Unable to create student." };
  }

  revalidatePath("/students");
  return { status: "success", message: "Student created successfully." };
}

export async function getStudents({
  query,
  status,
}: {
  query?: string;
  status?: StudentStatus | "ALL";
} = {}) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const where: Record<string, unknown> = { schoolId };

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { phone: { contains: query, mode: "insensitive" } },
    ];
  }

  return prisma.student.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      gender: true,
      phone: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function getStudentById(id: string) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  return prisma.student.findFirst({
    where: { id, schoolId },
  });
}

export async function updateStudent(
  _prevState: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = studentUpdateSchema.safeParse({
    ...raw,
    fatherName: emptyToUndefined(raw.fatherName),
    motherName: emptyToUndefined(raw.motherName),
    phone: emptyToUndefined(raw.phone),
    address: emptyToUndefined(raw.address),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  try {
    const existing = await prisma.student.findFirst({
      where: { id: parsed.data.id, schoolId },
      select: { id: true },
    });
    if (!existing) {
      return { status: "error", message: "Student not found." };
    }

    await prisma.student.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        gender: parsed.data.gender,
        dob: parsed.data.dob,
        fatherName: parsed.data.fatherName,
        motherName: parsed.data.motherName,
        phone: parsed.data.phone,
        address: parsed.data.address,
        status: parsed.data.status,
      },
    });
  } catch (error) {
    console.error("updateStudent failed", error);
    return { status: "error", message: "Unable to update student." };
  }

  revalidatePath("/students");
  return { status: "success", message: "Student updated successfully." };
}

export async function deleteStudent(
  _prevState: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { status: "error", message: "Student id is required" };
  }

  const student = await prisma.student.findFirst({
    where: { id, schoolId },
    select: {
      _count: {
        select: { enrollments: true, invoices: true },
      },
    },
  });

  if (!student) {
    return { status: "error", message: "Student not found" };
  }

  if (
    student._count.enrollments > 0 ||
    student._count.invoices > 0
  ) {
    return {
      status: "error",
      message: "Student has related records. Remove them first.",
    };
  }

  await prisma.student.delete({ where: { id } });
  revalidatePath("/students");
  return { status: "success", message: "Student deleted successfully." };
}
