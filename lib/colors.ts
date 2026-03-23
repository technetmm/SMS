import { TeacherStatus } from "@/app/generated/prisma/enums";

export const teacherStatusColor = (status: TeacherStatus) => {
  let color = "text-";
  switch (status) {
    case "ACTIVE":
      color = color.concat("[#28A745]");
      break;
    case "ONLEAVE":
      color = color.concat("[#F39C12]");
      break;
    case "RESIGNED":
      color = color.concat("[#3498DB]");
      break;
    case "TERMINATED":
      color = color.concat("[#E74C3C]");
      break;
  }

  return color;
};
