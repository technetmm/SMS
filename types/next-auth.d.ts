import "next-auth";
import "next-auth/jwt";
import { UserRole } from "@/app/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      schoolId?: string | null;
      permissions?: string[];
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role: UserRole;
    schoolId?: string | null;
    permissions?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    schoolId?: string | null;
    permissions?: string[];
  }
}
