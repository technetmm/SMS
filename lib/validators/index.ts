import { z } from "zod";
import {
  Currency,
  ClassType,
  DayOfWeek,
  AttendanceStatus,
  EnrollmentStatus,
  Gender,
  MaritalStatus,
  PaymentStatus,
  ProgramType,
  StudentStatus,
  TeacherStatus,
  UserRole,
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
  fee: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? 0 : value),
    z.coerce.number().nonnegative("Fee cannot be negative"),
  ),
  feeCurrency: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? Currency.MMK : value),
    z.nativeEnum(Currency),
  ),
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
    (value) => (value === "" || value === null || value === undefined ? 30 : value),
    z.coerce.number().int().positive("Capacity must be at least 1"),
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

const timeString = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Time must be in HH:mm format");

export const timetableSlotSchema = z
  .object({
    id: z.string().optional(),
    sectionId: z.string().min(1, "Section is required"),
    teacherId: z.string().min(1, "Teacher is required"),
    dayOfWeek: z.nativeEnum(DayOfWeek),
    startTime: timeString,
    endTime: timeString,
    room: z.string().optional(),
  })
  .refine(
    (value) => {
      const [sH, sM] = value.startTime.split(":").map(Number);
      const [eH, eM] = value.endTime.split(":").map(Number);
      return eH * 60 + eM > sH * 60 + sM;
    },
    { message: "End time must be after start time", path: ["endTime"] },
  );

export const teacherAttendanceSchema = z.object({
  teacherId: z.string().min(1, "Teacher is required"),
  sectionId: z.string().min(1, "Section is required"),
  date: z.coerce.date(),
  status: z.nativeEnum(AttendanceStatus),
});

export const enrollmentCreateSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  sectionId: z.string().min(1, "Section is required"),
  discountType: z
    .enum(["NONE", "FIXED", "PERCENT"])
    .optional()
    .default("NONE"),
  discountValue: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? 0 : value),
    z.coerce.number().min(0, "Discount must be >= 0"),
  ),
});

export const enrollmentUpdateSchema = z.object({
  id: z.string().min(1, "Enrollment id is required"),
  status: z.nativeEnum(EnrollmentStatus),
});

export const enrollmentAttendanceSchema = z.object({
  enrollmentId: z.string().min(1, "Enrollment is required"),
  date: z.coerce.date(),
  status: z.nativeEnum(AttendanceStatus),
});

export const enrollmentProgressSchema = z.object({
  enrollmentId: z.string().min(1, "Enrollment is required"),
  progress: z.coerce.number().min(0, "Progress must be at least 0").max(100, "Progress cannot exceed 100"),
  remark: z.string().optional(),
});

export const invoiceUpdateSchema = z.object({
  id: z.string().min(1, "Invoice id is required"),
  status: z.nativeEnum(PaymentStatus),
});

export const enrollmentActorRoleSchema = z.nativeEnum(UserRole).refine(
  (role) =>
    role === UserRole.SCHOOL_ADMIN ||
    role === UserRole.TEACHER ||
    role === UserRole.SUPER_ADMIN,
  { message: "Only teacher/admin can enroll students." },
);

export const paymentCreateSchema = z.object({
  invoiceId: z.string().min(1, "Invoice is required"),
  amount: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().positive("Payment amount must be greater than 0"),
  ),
  method: z.string().min(2, "Payment method is required"),
});

export const refundCreateSchema = z.object({
  paymentId: z.string().min(1, "Payment is required"),
  amount: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().positive("Refund amount must be greater than 0"),
  ),
  reason: z.string().optional(),
});

export const payrollGenerateSchema = z.object({
  month: z.coerce.date(),
});
