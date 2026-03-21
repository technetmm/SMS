"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma/client";
import { requireRole } from "@/lib/permissions";
import { formDataToObject, emptyToUndefined } from "@/lib/form-utils";
import { classCreateSchema, sectionCreateSchema } from "@/lib/validators";

export async function createClass(formData: FormData) {
  await requireRole([UserRole.ADMIN, UserRole.TEACHER]);

  const raw = formDataToObject(formData);
  const parsed = classCreateSchema.parse(raw);

  await prisma.class.create({
    data: {
      name: parsed.name,
      courseId: parsed.courseId,
      classType: parsed.classType,
      programType: parsed.programType,
    },
  });

  revalidatePath("/classes");
}

export async function createSection(formData: FormData) {
  await requireRole([UserRole.ADMIN, UserRole.TEACHER]);

  const raw = formDataToObject(formData);
  const parsed = sectionCreateSchema.parse({
    ...raw,
    teacherId: emptyToUndefined(raw.teacherId as string | undefined),
    room: emptyToUndefined(raw.room as string | undefined),
  });

  await prisma.section.create({
    data: {
      classId: parsed.classId,
      name: parsed.name,
      teacherId: parsed.teacherId,
      room: parsed.room,
      capacity: parsed.capacity,
    },
  });

  revalidatePath("/classes");
}
