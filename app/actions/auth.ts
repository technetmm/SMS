"use server";

import bcrypt from "bcryptjs";
import { UserRole } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";
import { signupSchema, type SignupActionState } from "@/app/lib/validations/signup-schema";

function toSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function signup(
  _previousState: SignupActionState,
  formData: FormData,
): Promise<SignupActionState> {
  const parsed = signupSchema.safeParse({
    schoolName: formData.get("schoolName"),
    adminName: formData.get("adminName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    phone: formData.get("phone"),
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please check the form fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const tenantSlug = data.slug ? data.slug : toSlug(data.schoolName);

  if (!tenantSlug) {
    return {
      success: false,
      fieldErrors: { slug: ["Please provide a valid school slug."] },
    };
  }

  try {
    const [emailExists, slugExists] = await Promise.all([
      prisma.user.findUnique({ where: { email: data.email.toLowerCase() }, select: { id: true } }),
      prisma.tenant.findUnique({ where: { slug: tenantSlug }, select: { id: true } }),
    ]);

    if (emailExists) {
      return { success: false, fieldErrors: { email: ["Email is already in use."] } };
    }

    if (slugExists) {
      return { success: false, fieldErrors: { slug: ["Slug is already taken."] } };
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.schoolName,
          slug: tenantSlug,
        },
        select: { id: true },
      });

      await tx.user.create({
        data: {
          name: data.adminName,
          email: data.email.toLowerCase(),
          passwordHash,
          role: UserRole.SCHOOL_ADMIN,
          tenantId: tenant.id,
        },
      });
    });

    return {
      success: true,
      message: "School account created successfully. Please sign in.",
      redirectTo: "/login?registered=1",
    };
  } catch {
    return {
      success: false,
      message: "We could not create your account right now. Please try again.",
    };
  }
}

