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

export const PERMISSION_LABELS: Record<string, string> = {
  "user.view": "User: View",
  "user.create": "User: Create",
  "user.update": "User: Update",
  "user.delete": "User: Delete",
  "user.assign_role": "User: Assign Role",
  "student.view": "Student: View",
  "student.create": "Student: Create",
  "student.update": "Student: Update",
  "student.delete": "Student: Delete",
  "staff.view": "Staff: View",
  "staff.create": "Staff: Create",
  "staff.update": "Staff: Update",
  "staff.delete": "Staff: Delete",
  "class.view": "Class: View",
  "class.create": "Class: Create",
  "class.update": "Class: Update",
  "class.delete": "Class: Delete",
  "section.manage": "Section: Manage",
  "attendance.view": "Attendance: View",
  "attendance.mark": "Attendance: Mark",
  "attendance.update": "Attendance: Update",
  "fee.view": "Fee: View",
  "fee.collect": "Fee: Collect",
  "fee.update": "Fee: Update",
  "fee.report": "Fee: Report",
  "subject.manage": "Subject: Manage",
  "exam.manage": "Exam: Manage",
  "result.manage": "Result: Manage",
  "payroll.view": "Payroll: View",
  "payroll.process": "Payroll: Process",
  "settings.view": "Settings: View",
  "settings.update": "Settings: Update",
  "role.view": "Role: View",
  "role.create": "Role: Create",
  "role.update": "Role: Update",
  "role.delete": "Role: Delete",
  "permission.assign": "Permission: Assign",
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

export function enumLabel<T extends string>(
  value: T,
  labels: Record<string, string>,
): string {
  return labels[value] ?? value;
}
