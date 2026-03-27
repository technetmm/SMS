import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const softDeleteModels = new Set([
  "User",
  "Tenant",
  "Branch",
  "Subscription",
  "RolePermission",
  "UserPermission",
  "Staff",
  "Student",
  "Subject",
  "Course",
  "Class",
  "Section",
  "Enrollment",
  "Attendance",
  "Progress",
  "Invoice",
]);

function appendNotDeleted(where?: Record<string, unknown>) {
  if (!where) return { isDeleted: false };
  if ("isDeleted" in where || "OR" in where || "AND" in where || "NOT" in where) {
    return where;
  }
  return { ...where, isDeleted: false };
}

const baseClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

const prisma = baseClient.$extends({
  query: {
    $allModels: {
      async findMany({ model, args, query }) {
        if (!softDeleteModels.has(String(model))) {
          return query(args);
        }
        return query({
          ...args,
          where: appendNotDeleted(
            (args as Record<string, unknown> | undefined)?.where as
              | Record<string, unknown>
              | undefined,
          ),
        });
      },
      async findFirst({ model, args, query }) {
        if (!softDeleteModels.has(String(model))) {
          return query(args);
        }
        return query({
          ...args,
          where: appendNotDeleted(
            (args as Record<string, unknown> | undefined)?.where as
              | Record<string, unknown>
              | undefined,
          ),
        });
      },
      async count({ model, args, query }) {
        if (!softDeleteModels.has(String(model))) {
          return query(args);
        }
        return query({
          ...args,
          where: appendNotDeleted(
            (args as Record<string, unknown> | undefined)?.where as
              | Record<string, unknown>
              | undefined,
          ),
        });
      },
      async delete({ model, args, query }) {
        if (!softDeleteModels.has(String(model))) {
          return query(args);
        }
        const delegate = ((baseClient as unknown) as Record<string, unknown>)[
          String(model).charAt(0).toLowerCase() + String(model).slice(1)
        ] as { update: (value: unknown) => Promise<unknown> };
        return delegate.update({
          ...(args as Record<string, unknown>),
          data: { isDeleted: true, deletedAt: new Date() },
        });
      },
      async deleteMany({ model, args, query }) {
        if (!softDeleteModels.has(String(model))) {
          return query(args);
        }
        const delegate = ((baseClient as unknown) as Record<string, unknown>)[
          String(model).charAt(0).toLowerCase() + String(model).slice(1)
        ] as { updateMany: (value: unknown) => Promise<unknown> };
        return delegate.updateMany({
          ...(args as Record<string, unknown>),
          where: appendNotDeleted(
            (args as Record<string, unknown> | undefined)?.where as
              | Record<string, unknown>
              | undefined,
          ),
          data: { isDeleted: true, deletedAt: new Date() },
        });
      },
    },
  },
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = baseClient;

export { prisma };
