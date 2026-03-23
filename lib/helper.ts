import { UserRole } from "@/app/generated/prisma/enums";
import { Session } from "next-auth";

export const checkRole = (user: Session["user"], role: UserRole) => {
  return user.role === role;
};

export function uniqueBy(items: any[], key: string = "id") {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item[key])) return false;
    seen.add(item[key]);
    return true;
  });
}
