import { z } from "zod";
import {
  ClassType,
  Gender,
  ProgramType,
  StudentStatus,
} from "@/app/generated/prisma";

export const studentCreateSchema = z.object({
  name: z.string().min(2, "Name is required"),
  gender: z.nativeEnum(Gender),
  phone: z.string().min(6).optional(),
  status: z.nativeEnum(StudentStatus),
});

export const studentUpdateSchema = studentCreateSchema.extend({
  id: z.string().min(1),
});

export const classCreateSchema = z.object({
  name: z.string().min(2, "Class name is required"),
  courseId: z.string().min(1),
  classType: z.nativeEnum(ClassType),
  programType: z.nativeEnum(ProgramType),
});

export const sectionCreateSchema = z.object({
  classId: z.string().min(1),
  name: z.string().min(1, "Section name is required"),
  teacherId: z.string().optional(),
  room: z.string().optional(),
  capacity: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().int().positive().optional(),
  ),
});
