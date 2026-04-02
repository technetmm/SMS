import { PrismaClient } from "../app/generated/prisma/client";
import { UserRole } from "../app/generated/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function assertSchemaReady() {
  const rows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'User'
    ) AS "exists"`,
  );

  if (!rows[0]?.exists) {
    throw new Error(
      'Missing table "User". Run Prisma migrations before seeding (pnpm db:migrate or pnpm db:reset).',
    );
  }
}

export async function main() {
  await assertSchemaReady();

  const superAdminEmail = process.env.SEED_SUPER_ADMIN_EMAIL ?? "super@technet-sms.local";
  const superAdminName = process.env.SEED_SUPER_ADMIN_NAME ?? "Super Admin";
  const superAdminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD ?? "Admin123!";

  const passwordHash = await bcrypt.hash(superAdminPassword, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      name: superAdminName,
      role: UserRole.SUPER_ADMIN,
      schoolId: null,
      isSchoolOwner: false,
      passwordHash,
      twoFactorSecret: null,
      twoFactorEnabled: false,
      activeSessionId: null,
      activeSessionExpiresAt: null,
      isDeleted: false,
      deletedAt: null,
    },
    create: {
      name: superAdminName,
      email: superAdminEmail,
      role: UserRole.SUPER_ADMIN,
      passwordHash,
      schoolId: null,
      isSchoolOwner: false,
      twoFactorSecret: null,
      twoFactorEnabled: false,
      activeSessionId: null,
      activeSessionExpiresAt: null,
    },
    select: { id: true, email: true },
  });

  // Keep seeded admin usable by removing stale device-approval requests.
  await prisma.loginApprovalRequest.deleteMany({
    where: { userId: superAdmin.id },
  });
  await prisma.notification.deleteMany({
    where: { userId: superAdmin.id },
  });

  console.log("Seed completed:");
  console.log(`- Super admin: ${superAdmin.email}`);
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
