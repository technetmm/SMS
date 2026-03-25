import { TeacherStatus } from "@/app/generated/prisma/enums";

export const teacherStatusColor = (status: TeacherStatus) => {
  switch (status) {
    case TeacherStatus.ACTIVE:
      return "text-[#28A745]";
    case TeacherStatus.ONLEAVE:
      return "text-[#F39C12]";
    case TeacherStatus.RESIGNED:
      return "text-[#3498DB]";
    case TeacherStatus.TERMINATED:
      return "text-[#E74C3C]";
    default:
      return "text-foreground";
  }
};
