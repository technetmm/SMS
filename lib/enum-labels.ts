export const GENDER_LABELS: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

export const PLAN_LABELS: Record<string, string> = {
  FREE: "Free",
  BASIC: "Basic",
  PREMIUM: "Premium",
};

export const STUDENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  GRADUATED: "Graduated",
};

export const STAFF_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  ONLEAVE: "On Leave",
  RESIGNED: "Resigned",
  TERMINATED: "Terminated",
};

export const MARITAL_STATUS_LABELS: Record<string, string> = {
  SINGLE: "Single",
  MARRIED: "Married",
};

export const CLASS_TYPE_LABELS: Record<string, string> = {
  ONE_ON_ONE: "One-on-One",
  PRIVATE: "Private",
  GROUP: "Group",
};

export const PROGRAM_TYPE_LABELS: Record<string, string> = {
  REGULAR: "Regular",
  INTENSIVE: "Intensive",
};

export const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  DROPPED: "Dropped",
};

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  LEAVE: "Leave",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Unpaid",
  PARTIAL: "Partial",
  PAID: "Paid",
};

export const DAY_OF_WEEK_LABELS: Record<string, string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun",
};

export const BILLING_TYPE_LABELS: Record<string, string> = {
  ONE_TIME: "One-time",
  MONTHLY: "Monthly",
};

export const INVOICE_TYPE_LABELS: Record<string, string> = {
  ONE_TIME: "One-time",
  MONTHLY: "Monthly",
};

export const USER_ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  SCHOOL_ADMIN: "Admin",
  TEACHER: "Teacher",
  STUDENT: "Student",
};

export function enumLabel<T extends string>(
  value: T,
  labels: Record<string, string>,
): string {
  return labels[value] ?? value;
}
