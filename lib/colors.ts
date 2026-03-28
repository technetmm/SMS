import { StaffStatus } from "@/app/generated/prisma/enums";

export const staffStatusColor = (
  status: StaffStatus,
  className: string = "text",
) => {
  switch (status) {
    case StaffStatus.ACTIVE:
      return className + "-[#28A745]";
    case StaffStatus.ONLEAVE:
      return className + "-[#F39C12]";
    case StaffStatus.RESIGNED:
      return className + "-[#3498DB]";
    case StaffStatus.TERMINATED:
      return className + "-[#E74C3C]";
    default:
      return className + "-foreground";
  }
};
