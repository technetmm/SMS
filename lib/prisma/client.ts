import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const baseClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

const prisma = baseClient;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = baseClient;

export { prisma };
