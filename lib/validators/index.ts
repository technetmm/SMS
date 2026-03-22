import { z } from "zod";
import {
  ClassType,
  Gender,
  MaritalStatus,
  ProgramType,
  StudentStatus,
  TeacherStatus,
} from "@/app/generated/prisma/index";

export const studentCreateSchema = z.object({
  name: z.string().min(2, "Name is required"),
  gender: z.nativeEnum(Gender),
  dob: z.coerce.date(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  phone: z
    .string()
    .optional()
    .refine(
      (value) => !value || /^[0-9+()\-\s]{6,}$/.test(value),
      "Invalid phone number",
    ),
  address: z.string().optional(),
  status: z.nativeEnum(StudentStatus),
  createAccount: z.preprocess(
    (value) => value === "on",
    z.boolean().optional(),
  ),
  email: z.string().email("Valid email is required").optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
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

export const teacherCreateSchema = z.object({
  name: z.string().min(2, "Name is required"),
  jobTitle: z.string().min(2, "Job title is required"),
  nrcNumber: z.string().min(3, "NRC number is required"),
  dob: z.coerce.date(),
  email: z.string().email("Valid email is required"),
  gender: z.nativeEnum(Gender),
  maritalStatus: z.nativeEnum(MaritalStatus),
  parmentAddress: z.string().optional(),
  currentAddress: z.string().optional(),
  phone: z.string().min(6).optional(),
  hireDate: z.coerce.date(),
  exitDate: z.coerce.date().optional(),
  status: z.nativeEnum(TeacherStatus),
  ratePerSection: z.coerce
    .number()
    .positive("Rate per section must be positive"),
  remark: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const teacherUpdateSchema = teacherCreateSchema
  .omit({ password: true })
  .extend({
    id: z.string().min(1, "Teacher id is required"),
  });
