import { PrismaClient } from "../app/generated/prisma/client";
import {
  AttendanceStatus,
  ClassType,
  EnrollmentStatus,
  Gender,
  MaritalStatus,
  PaymentStatus,
  Permission,
  Plan,
  ProgramType,
  StudentStatus,
  SubscriptionStatus,
  StaffStatus,
  UserRole,
} from "../app/generated/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function assertSchemaReady() {
  const requiredTables = [
    "Tenant",
    "Subscription",
    "RolePermission",
    "UserPermission",
  ] as const;

  for (const tableName of requiredTables) {
    const rows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = '${tableName}'
      ) AS "exists"`,
    );

    if (!rows[0]?.exists) {
      throw new Error(
        `Missing table "${tableName}". Run Prisma migrations before seeding (pnpm db:migrate or pnpm db:reset).`,
      );
    }
  }
}

async function ensureSubject(name: "English" | "Myanmar", tenantId: string) {
  return prisma.subject.upsert({
    where: { tenantId_name: { tenantId, name } },
    update: {},
    create: { name, tenantId },
  });
}

async function ensureCourse(name: string, subjectIds: string[], tenantId: string) {
  const course = await prisma.course.upsert({
    where: { tenantId_name: { tenantId, name } },
    update: {
      tenantId,
    },
    create: {
      name,
      tenantId,
    },
  });

  await prisma.courseSubject.deleteMany({
    where: { courseId: course.id },
  });

  if (subjectIds.length > 0) {
    await prisma.courseSubject.createMany({
      data: subjectIds.map((subjectId) => ({
        tenantId,
        courseId: course.id,
        subjectId,
      })),
      skipDuplicates: true,
    });
  }

  return course;
}

async function upsertRolePermissions() {
  await prisma.rolePermission.createMany({
    data: [
      { role: UserRole.SUPER_ADMIN, permission: Permission.MANAGE_TENANTS },
      { role: UserRole.SUPER_ADMIN, permission: Permission.MANAGE_SUBSCRIPTIONS },
      { role: UserRole.SUPER_ADMIN, permission: Permission.VIEW_REPORTS },
      { role: UserRole.SCHOOL_ADMIN, permission: Permission.MANAGE_STUDENTS },
      { role: UserRole.SCHOOL_ADMIN, permission: Permission.MANAGE_STAFF },
      { role: UserRole.SCHOOL_ADMIN, permission: Permission.MANAGE_CLASSES },
      { role: UserRole.SCHOOL_ADMIN, permission: Permission.VIEW_REPORTS },
      { role: UserRole.STAFF, permission: Permission.MANAGE_CLASSES },
      { role: UserRole.STAFF, permission: Permission.VIEW_REPORTS },
    ],
    skipDuplicates: true,
  });
}

async function upsertTenantAndSubscription(input: {
  name: string;
  slug: string;
  plan: Plan;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  subscriptionStatus: SubscriptionStatus;
}) {
  const tenant = await prisma.tenant.upsert({
    where: { slug: input.slug },
    update: {
      name: input.name,
      plan: input.plan,
      isActive: true,
    },
    create: {
      name: input.name,
      slug: input.slug,
      plan: input.plan,
      isActive: true,
    },
  });

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: input.stripeSubscriptionId },
    update: {
      tenantId: tenant.id,
      stripeCustomerId: input.stripeCustomerId,
      plan: input.plan,
      status: input.subscriptionStatus,
      isActive: input.subscriptionStatus === SubscriptionStatus.ACTIVE,
      currentPeriodEnd: new Date("2026-04-30T00:00:00Z"),
    },
    create: {
      tenantId: tenant.id,
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      plan: input.plan,
      status: input.subscriptionStatus,
      isActive: input.subscriptionStatus === SubscriptionStatus.ACTIVE,
      currentPeriodEnd: new Date("2026-04-30T00:00:00Z"),
    },
  });

  return tenant;
}

export async function main() {
  await assertSchemaReady();

  await upsertRolePermissions();

  const tenant = await upsertTenantAndSubscription({
    name: "Demo School",
    slug: "demo-school",
    plan: Plan.BASIC,
    stripeCustomerId: "cus_demo_school",
    stripeSubscriptionId: "sub_demo_school",
    subscriptionStatus: SubscriptionStatus.ACTIVE,
  });

  await upsertTenantAndSubscription({
    name: "Sunrise Academy",
    slug: "sunrise-academy",
    plan: Plan.PREMIUM,
    stripeCustomerId: "cus_sunrise_academy",
    stripeSubscriptionId: "sub_sunrise_academy",
    subscriptionStatus: SubscriptionStatus.ACTIVE,
  });

  const passwordHash = await bcrypt.hash("Admin123!", 10);

  await prisma.user.upsert({
    where: { email: "super@lms.local" },
    update: {},
    create: {
      name: "Super Admin",
      email: "super@lms.local",
      role: UserRole.SUPER_ADMIN,
      passwordHash,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@lms.local" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@lms.local",
      role: UserRole.SCHOOL_ADMIN,
      tenantId: tenant.id,
      passwordHash,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: "staff@lms.local" },
    update: {},
    create: {
      name: "Staff One",
      email: "staff@lms.local",
      role: UserRole.STAFF,
      tenantId: tenant.id,
      passwordHash: await bcrypt.hash("Staff123!", 10),
    },
  });

  const staff = await prisma.staff.upsert({
    where: { userId: staffUser.id },
    update: {
      name: "Staff One",
      jobTitle: "Senior Staff",
      nrcNumber: "12/ABC(N)123456",
      dob: new Date("1990-05-12T00:00:00Z"),
      email: "staff@lms.local",
      gender: Gender.FEMALE,
      maritalStatus: MaritalStatus.SINGLE,
      parmentAddress: "Mandalay",
      currentAddress: "Yangon",
      phone: "09-0000-0000",
      hireDate: new Date("2024-01-05T00:00:00Z"),
      status: StaffStatus.ACTIVE,
      remark: "Seeded staff account",
      ratePerSection: 150,
      tenantId: tenant.id,
    },
    create: {
      userId: staffUser.id,
      tenantId: tenant.id,
      name: "Staff One",
      jobTitle: "Senior Staff",
      nrcNumber: "12/ABC(N)123456",
      dob: new Date("1990-05-12T00:00:00Z"),
      email: "staff@lms.local",
      gender: Gender.FEMALE,
      maritalStatus: MaritalStatus.SINGLE,
      parmentAddress: "Mandalay",
      currentAddress: "Yangon",
      phone: "09-0000-0000",
      hireDate: new Date("2024-01-05T00:00:00Z"),
      status: StaffStatus.ACTIVE,
      remark: "Seeded staff account",
      ratePerSection: 150,
    },
  });

  const englishSubject = await ensureSubject("English", tenant.id);
  const myanmarSubject = await ensureSubject("Myanmar", tenant.id);

  const branch = await prisma.branch.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: "Main Campus" } },
    update: { address: "Yangon Downtown" },
    create: {
      tenantId: tenant.id,
      name: "Main Campus",
      address: "Yangon Downtown",
    },
  });

  await prisma.staff.update({
    where: { id: staff.id },
    data: { branchId: branch.id },
  });

  const english = await ensureCourse("English", [englishSubject.id], tenant.id);
  await ensureCourse("Myanmar", [myanmarSubject.id], tenant.id);

  const classA = await prisma.class.upsert({
    where: { id: "class-english-1" },
    update: {},
    create: {
      id: "class-english-1",
      name: "English Foundation A",
      tenantId: tenant.id,
      courseId: english.id,
      classType: ClassType.GROUP,
      programType: ProgramType.REGULAR,
    },
  });

  const sectionA = await prisma.section.upsert({
    where: { id: "section-english-a" },
    update: {},
    create: {
      id: "section-english-a",
      tenantId: tenant.id,
      classId: classA.id,
      branchId: branch.id,
      name: "Section A",
      room: "Room A",
      capacity: 15,
    },
  });

  const sectionB = await prisma.section.upsert({
    where: { id: "section-english-b" },
    update: {},
    create: {
      id: "section-english-b",
      tenantId: tenant.id,
      classId: classA.id,
      branchId: branch.id,
      name: "Section B",
      room: "Room B",
      capacity: 12,
    },
  });

  await prisma.sectionStaff.createMany({
    data: [
      { sectionId: sectionA.id, staffId: staff.id },
      { sectionId: sectionB.id, staffId: staff.id },
    ],
    skipDuplicates: true,
  });

  const students = [
    { name: "Aye Aye", gender: "FEMALE", phone: "09-1111-1111", dob: "2010-03-10" },
    { name: "Ko Ko", gender: "MALE", phone: "09-2222-2222", dob: "2009-08-22" },
    { name: "Myo Min", gender: "MALE", phone: "09-3333-3333", dob: "2011-01-15" },
    { name: "Su Su", gender: "FEMALE", phone: "09-4444-4444", dob: "2010-11-05" },
    { name: "Hla Hla", gender: "FEMALE", phone: "09-5555-5555", dob: "2008-04-28" },
    { name: "Kyaw Thu", gender: "MALE", phone: "09-6666-6666", dob: "2009-12-02" },
    { name: "Nandar", gender: "FEMALE", phone: "09-7777-7777", dob: "2011-07-19" },
    { name: "Zaw Win", gender: "MALE", phone: "09-8888-8888", dob: "2008-09-30" },
    { name: "Thiri", gender: "FEMALE", phone: "09-9999-9999", dob: "2010-06-14" },
    { name: "Ye Yint", gender: "MALE", phone: "09-1010-1010", dob: "2009-02-08" },
  ];

  const createdStudents = [] as { id: string; name: string; sectionId: string }[];

  for (const student of students) {
    const index = students.indexOf(student);
    const studentId = `student-demo-${String(index + 1).padStart(2, "0")}`;
    const sectionId = index % 2 === 0 ? sectionA.id : sectionB.id;

    const created = await prisma.student.upsert({
      where: { id: studentId },
      update: {
        tenantId: tenant.id,
        name: student.name,
        gender: student.gender as Gender,
        dob: new Date(`${student.dob}T00:00:00Z`),
        fatherName: "U Htun",
        motherName: "Daw Mya",
        phone: student.phone,
        address: "Yangon",
        branchId: branch.id,
        status: StudentStatus.ACTIVE,
      },
      create: {
        id: studentId,
        name: student.name,
        tenantId: tenant.id,
        gender: student.gender as Gender,
        dob: new Date(`${student.dob}T00:00:00Z`),
        fatherName: "U Htun",
        motherName: "Daw Mya",
        phone: student.phone,
        address: "Yangon",
        branchId: branch.id,
        status: StudentStatus.ACTIVE,
      },
    });
    createdStudents.push({ id: created.id, name: created.name, sectionId });
  }

  for (let i = 0; i < createdStudents.length; i++) {
    const student = createdStudents[i];

    const enrollment = await prisma.enrollment.upsert({
      where: {
        studentId_sectionId: {
          studentId: student.id,
          sectionId: student.sectionId,
        },
      },
      update: {
        tenantId: tenant.id,
        status: EnrollmentStatus.ACTIVE,
      },
      create: {
        studentId: student.id,
        sectionId: student.sectionId,
        tenantId: tenant.id,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    const originalAmount = 120;
    const discount = i % 5 === 0 ? 20 : 0;
    const finalAmount = Math.max(0, originalAmount - discount);

    const invoice = await prisma.invoice.upsert({
      where: { enrollmentId: enrollment.id },
      update: {
        tenantId: tenant.id,
        studentId: student.id,
        originalAmount,
        discount,
        finalAmount,
        paidAmount: 0,
        dueDate: new Date("2026-03-31T00:00:00Z"),
        status: PaymentStatus.UNPAID,
      },
      create: {
        tenantId: tenant.id,
        studentId: student.id,
        enrollmentId: enrollment.id,
        originalAmount,
        discount,
        finalAmount,
        paidAmount: 0,
        dueDate: new Date("2026-03-31T00:00:00Z"),
        status: PaymentStatus.UNPAID,
      },
    });

    await prisma.progress.upsert({
      where: { enrollmentId: enrollment.id },
      update: {
        tenantId: tenant.id,
        progress: Math.min(100, 15 + i * 8),
        remark: i % 2 === 0 ? "Good participation" : "Needs vocabulary practice",
      },
      create: {
        tenantId: tenant.id,
        enrollmentId: enrollment.id,
        progress: Math.min(100, 15 + i * 8),
        remark: i % 2 === 0 ? "Good participation" : "Needs vocabulary practice",
      },
    });

    await prisma.refund.deleteMany({
      where: {
        payment: { invoiceId: invoice.id },
      },
    });
    await prisma.payment.deleteMany({
      where: { invoiceId: invoice.id },
    });

    let paidAmount = 0;

    if (i % 3 === 0) {
      // Fully paid in two installments.
      const first = Number((finalAmount / 2).toFixed(2));
      const second = Number((finalAmount - first).toFixed(2));
      const firstPayment = await prisma.payment.create({
        data: {
          tenantId: tenant.id,
          invoiceId: invoice.id,
          amount: first,
          method: "Cash",
        },
      });
      await prisma.payment.create({
        data: {
          tenantId: tenant.id,
          invoiceId: invoice.id,
          amount: second,
          method: "Bank Transfer",
        },
      });
      paidAmount = finalAmount;

      if (i % 6 === 0) {
        // Refund part of first payment to cover refund scenarios.
        await prisma.refund.create({
          data: {
            tenantId: tenant.id,
            paymentId: firstPayment.id,
            amount: 10,
            reason: "Discount correction",
          },
        });
        paidAmount = Math.max(0, finalAmount - 10);
      }
    } else if (i % 3 === 1) {
      // Partially paid.
      const partial = Number((finalAmount / 2).toFixed(2));
      await prisma.payment.create({
        data: {
          tenantId: tenant.id,
          invoiceId: invoice.id,
          amount: partial,
          method: "Cash",
        },
      });
      paidAmount = partial;
    }

    const status =
      paidAmount <= 0
        ? PaymentStatus.UNPAID
        : paidAmount >= finalAmount
          ? PaymentStatus.PAID
          : PaymentStatus.PARTIAL;

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount,
        status,
      },
    });

    await prisma.attendance.upsert({
      where: {
        enrollmentId_date: {
          enrollmentId: enrollment.id,
          date: new Date("2026-03-20T00:00:00Z"),
        },
      },
      update: {
        tenantId: tenant.id,
        status: i % 4 === 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
      },
      create: {
        enrollmentId: enrollment.id,
        tenantId: tenant.id,
        date: new Date("2026-03-20T00:00:00Z"),
        status: i % 4 === 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
      },
    });
  }

  console.log("Seed completed:");
  console.log("- Tenants: demo-school, sunrise-academy");
  console.log("- Branches: Main Campus");
  console.log("- Users: super@lms.local, admin@lms.local, staff@lms.local");
  console.log("- Students seeded: 10");
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
