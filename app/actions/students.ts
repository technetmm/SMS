"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma/client";
import { requireRole } from "@/lib/permissions";
import { formDataToObject, emptyToUndefined } from "@/lib/form-utils";
import { studentCreateSchema, studentUpdateSchema } from "@/lib/validators";

export async function createStudent(formData: FormData) {
  await requireRole([UserRole.ADMIN, UserRole.TEACHER]);

  const raw = formDataToObject(formData);
  const parsed = studentCreateSchema.parse({
    ...raw,
    phone: emptyToUndefined(raw.phone as string | undefined),
  });

  await prisma.student.create({
    data: {
      name: parsed.name,
      gender: parsed.gender,
      phone: parsed.phone,
      status: parsed.status,
    },
  });

  revalidatePath("/students");
}

export async function updateStudent(formData: FormData) {
  await requireRole([UserRole.ADMIN, UserRole.TEACHER]);

  const raw = formDataToObject(formData);
  const parsed = studentUpdateSchema.parse({
    ...raw,
    phone: emptyToUndefined(raw.phone as string | undefined),
  });

  await prisma.student.update({
    where: { id: parsed.id },
    data: {
      name: parsed.name,
      gender: parsed.gender,
      phone: parsed.phone,
      status: parsed.status,
    },
  });

  revalidatePath("/students");
}

export async function deleteStudent(formData: FormData) {
  await requireRole([UserRole.ADMIN]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    throw new Error("Student id is required");
  }

  await prisma.student.delete({ where: { id } });
  revalidatePath("/students");
}
