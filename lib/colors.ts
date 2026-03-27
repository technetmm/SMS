import { StaffStatus } from "@/app/generated/prisma/enums";

export const staffStatusColor = (status: StaffStatus) => {
  switch (status) {
    case StaffStatus.ACTIVE:
      return "text-[#28A745]";
    case StaffStatus.ONLEAVE:
      return "text-[#F39C12]";
    case StaffStatus.RESIGNED:
      return "text-[#3498DB]";
    case StaffStatus.TERMINATED:
      return "text-[#E74C3C]";
    default:
      return "text-foreground";
  }
};
