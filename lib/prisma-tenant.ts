import { UserRole } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";

type SessionLike = {
  user?: {
    id?: string;
    role?: UserRole;
    schoolId?: string | null;
  };
};

const schoolScopedModels = new Set([
  "tenant",
  "branch",
  "subscription",
  "staff",
  "student",
  "subject",
  "course",
  "class",
  "section",
  "enrollment",
  "attendance",
  "payment",
  "role",
  "userroleassignment",
  "auditlog",
]);

function mergeWhereWithSchool(
  where: Record<string, unknown> | undefined,
  schoolId: string,
) {
  if (!where) return { schoolId };
  if ("schoolId" in where) return where;
  return { ...where, schoolId };
}

export function getPrismaClient(session: SessionLike) {
  const role = session.user?.role;
  const schoolId = session.user?.schoolId ?? null;
  const isSuperAdmin = role === UserRole.SUPER_ADMIN;

  if (isSuperAdmin) {
    return prisma;
  }

  if (!schoolId) {
    throw new Error("School context is required for non-super-admin users.");
  }

  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (!schoolScopedModels.has(String(model).toLowerCase())) {
            return query(args);
          }
          return query({
            ...args,
            where: mergeWhereWithSchool(
              (args as Record<string, unknown> | undefined)?.where as
                | Record<string, unknown>
                | undefined,
              schoolId,
            ),
          });
        },
        async findFirst({ model, args, query }) {
          if (!schoolScopedModels.has(String(model).toLowerCase())) {
            return query(args);
          }
          return query({
            ...args,
            where: mergeWhereWithSchool(
              (args as Record<string, unknown> | undefined)?.where as
                | Record<string, unknown>
                | undefined,
              schoolId,
            ),
          });
        },
        async count({ model, args, query }) {
          if (!schoolScopedModels.has(String(model).toLowerCase())) {
            return query(args);
          }
          return query({
            ...args,
            where: mergeWhereWithSchool(
              (args as Record<string, unknown> | undefined)?.where as
                | Record<string, unknown>
                | undefined,
              schoolId,
            ),
          });
        },
      },
    },
  });
}
