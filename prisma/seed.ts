import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function ensureSubject(name: "English" | "Myanmar") {
  return prisma.subject.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

async function ensureCourse(name: string, subjectId: string) {
  return prisma.course.upsert({
    where: { name },
    update: { subjectId },
    create: { name, subjectId },
  });
}

export async function main() {
  const passwordHash = await bcrypt.hash("Admin123!", 10);

  await prisma.user.upsert({
    where: { email: "admin@lms.local" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@lms.local",
      role: "ADMIN",
      passwordHash,
    },
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: "teacher@lms.local" },
    update: {},
    create: {
      name: "Teacher One",
      email: "teacher@lms.local",
      role: "TEACHER",
      passwordHash: await bcrypt.hash("Teacher123!", 10),
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {
      name: "Teacher One",
      jobTitle: "Senior Teacher",
      nrcNumber: "12/ABC(N)123456",
      dob: new Date("1990-05-12T00:00:00Z"),
      email: "teacher@lms.local",
      gender: "FEMALE",
      maritalStatus: "SINGLE",
      parmentAddress: "Mandalay",
      currentAddress: "Yangon",
      phone: "09-0000-0000",
      hireDate: new Date("2024-01-05T00:00:00Z"),
      status: "ACTIVE",
      remark: "Seeded teacher account",
      ratePerSection: 150,
    },
    create: {
      userId: teacherUser.id,
      name: "Teacher One",
      jobTitle: "Senior Teacher",
      nrcNumber: "12/ABC(N)123456",
      dob: new Date("1990-05-12T00:00:00Z"),
      email: "teacher@lms.local",
      gender: "FEMALE",
      maritalStatus: "SINGLE",
      parmentAddress: "Mandalay",
      currentAddress: "Yangon",
      phone: "09-0000-0000",
      hireDate: new Date("2024-01-05T00:00:00Z"),
      status: "ACTIVE",
      remark: "Seeded teacher account",
      ratePerSection: 150,
    },
  });

  const englishSubject = await ensureSubject("English");
  const myanmarSubject = await ensureSubject("Myanmar");

  const english = await ensureCourse("English", englishSubject.id);
  await ensureCourse("Myanmar", myanmarSubject.id);

  const classA = await prisma.class.upsert({
    where: { id: "class-english-1" },
    update: {},
    create: {
      id: "class-english-1",
      name: "English Foundation A",
      courseId: english.id,
      classType: "GROUP",
      programType: "REGULAR",
    },
  });

  const sectionA = await prisma.section.upsert({
    where: { id: "section-english-a" },
    update: {},
    create: {
      id: "section-english-a",
      classId: classA.id,
      name: "Section A",
      teacherId: teacher.id,
      room: "Room A",
      capacity: 15,
    },
  });

  const sectionB = await prisma.section.upsert({
    where: { id: "section-english-b" },
    update: {},
    create: {
      id: "section-english-b",
      classId: classA.id,
      name: "Section B",
      teacherId: teacher.id,
      room: "Room B",
      capacity: 12,
    },
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

  const createdStudents = [] as { id: string; name: string }[];

  for (const student of students) {
    const created = await prisma.student.create({
      data: {
        name: student.name,
        gender: student.gender as "MALE" | "FEMALE" | "OTHER",
        dob: new Date(`${student.dob}T00:00:00Z`),
        fatherName: "U Htun",
        motherName: "Daw Mya",
        phone: student.phone,
        address: "Yangon",
        status: "ACTIVE",
      },
    });
    createdStudents.push({ id: created.id, name: created.name });
  }

  for (let i = 0; i < createdStudents.length; i += 1) {
    const student = createdStudents[i];
    const sectionId = i % 2 === 0 ? sectionA.id : sectionB.id;

    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        sectionId,
        status: "ACTIVE",
      },
    });

    await prisma.payment.create({
      data: {
        studentId: student.id,
        billingMonth: new Date("2026-03-01T00:00:00Z"),
        amount: 120,
        deposit: i % 3 === 0 ? 20 : 0,
        status: i % 3 === 0 ? "PAID" : "UNPAID",
        paidAt: i % 3 === 0 ? new Date("2026-03-10T00:00:00Z") : null,
        invoiceNumber: `INV-2026-${String(i + 1).padStart(3, "0")}`,
      },
    });

    await prisma.attendance.create({
      data: {
        studentId: student.id,
        sectionId,
        date: new Date("2026-03-20T00:00:00Z"),
        status: i % 4 === 0 ? "LATE" : "PRESENT",
      },
    });
  }
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
