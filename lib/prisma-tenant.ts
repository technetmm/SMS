import { UserRole } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";

type SessionLike = {
  user?: {
    id?: string;
    role?: UserRole;
    tenantId?: string | null;
  };
};

const tenantScopedModels = new Set([
  "tenant",
  "branch",
  "subscription",
  "teacher",
  "student",
  "subject",
  "course",
  "class",
  "section",
  "enrollment",
  "attendance",
  "payment",
  "auditlog",
]);

function mergeWhereWithTenant(
  where: Record<string, unknown> | undefined,
  tenantId: string,
) {
  if (!where) return { tenantId };
  if ("tenantId" in where) return where;
  return { ...where, tenantId };
}

export function getPrismaClient(session: SessionLike) {
  const role = session.user?.role;
  const tenantId = session.user?.tenantId ?? null;
  const isSuperAdmin = role === UserRole.SUPER_ADMIN;

  if (isSuperAdmin) {
    return prisma;
  }

  if (!tenantId) {
    throw new Error("Tenant context is required for non-super-admin users.");
  }

  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (!tenantScopedModels.has(String(model).toLowerCase())) {
            return query(args);
          }
          return query({
            ...args,
            where: mergeWhereWithTenant(
              (args as Record<string, unknown> | undefined)?.where as
                | Record<string, unknown>
                | undefined,
              tenantId,
            ),
          });
        },
        async findFirst({ model, args, query }) {
          if (!tenantScopedModels.has(String(model).toLowerCase())) {
            return query(args);
          }
          return query({
            ...args,
            where: mergeWhereWithTenant(
              (args as Record<string, unknown> | undefined)?.where as
                | Record<string, unknown>
                | undefined,
              tenantId,
            ),
          });
        },
        async count({ model, args, query }) {
          if (!tenantScopedModels.has(String(model).toLowerCase())) {
            return query(args);
          }
          return query({
            ...args,
            where: mergeWhereWithTenant(
              (args as Record<string, unknown> | undefined)?.where as
                | Record<string, unknown>
                | undefined,
              tenantId,
            ),
          });
        },
      },
    },
  });
}
