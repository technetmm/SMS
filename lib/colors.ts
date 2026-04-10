import { StaffStatus } from "@/app/generated/prisma/enums";

export const staffStatusColor = (status: StaffStatus) => {
  switch (status) {
    case StaffStatus.ACTIVE:
      return "#28A745";
    case StaffStatus.ONLEAVE:
      return "#F39C12";
    case StaffStatus.RESIGNED:
      return "#3498DB";
    case StaffStatus.TERMINATED:
      return "#E74C3C";
  }
};
