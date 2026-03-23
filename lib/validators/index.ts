import { z } from "zod";
import {
  ClassType,
  Gender,
  MaritalStatus,
  ProgramType,
  StudentStatus,
  TeacherStatus,
} from "@/app/generated/prisma/enums";

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
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
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

export const sectionMultiTeacherSchema = z.object({
  id: z.string().optional(),
  classId: z.string().min(1, "Class is required"),
  name: z.string().min(1, "Section name is required"),
  teacherIds: z.array(z.string().min(1)).optional().default([]),
  room: z.string().optional(),
  capacity: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().int().positive().optional(),
  ),
});

export const subjectCreateSchema = z.object({
  name: z.string().trim().min(2, "Subject name is required"),
});

export const subjectUpdateSchema = subjectCreateSchema.extend({
  id: z.string().min(1, "Subject id is required"),
});

export const courseCreateSchema = z.object({
  name: z.string().trim().min(2, "Course name is required"),
  subjectIds: z
    .array(z.string().min(1))
    .min(1, "Select at least one subject"),
});

export const courseUpdateSchema = courseCreateSchema.extend({
  id: z.string().min(1, "Course id is required"),
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
  ratePerSection: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().nonnegative("Rate per section cannot be negative").optional(),
  ),
  remark: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const teacherUpdateSchema = teacherCreateSchema
  .omit({ password: true })
  .extend({
    id: z.string().min(1, "Teacher id is required"),
  });
