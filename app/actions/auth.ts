"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import { UserRole } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";
import { enqueueEmail } from "@/lib/queue";
import { signupSchema, type SignupActionState } from "@/app/lib/validations/signup-schema";
import {
  buildSignupEmailVerificationIdentifier,
  buildSignupVerificationEmailBody,
  generateEmailVerificationCode,
  hashEmailVerificationCode,
  normalizeEmail,
  SIGNUP_EMAIL_VERIFICATION_RESEND_COOLDOWN_MS,
  SIGNUP_EMAIL_VERIFICATION_TTL_MS,
  verifyEmailVerificationCode,
} from "@/lib/auth/email-verification";

function toSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export type VerifyEmailActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  redirectTo?: string;
  cooldownSeconds?: number;
};

const verifyEmailSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Verification code must be 6 digits."),
});

const resendEmailSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
});

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
  const normalizedEmail = normalizeEmail(data.email);
  const tenantSlug = data.slug ? data.slug : toSlug(data.schoolName);

  if (!tenantSlug) {
    return {
      success: false,
      fieldErrors: { slug: ["Please provide a valid school slug."] },
    };
  }

  let createdTenantId: string | null = null;
  let createdUserId: string | null = null;

  try {
    const [emailExists, slugExists] = await Promise.all([
      prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } }),
      prisma.tenant.findUnique({ where: { slug: tenantSlug }, select: { id: true } }),
    ]);

    if (emailExists) {
      return { success: false, fieldErrors: { email: ["Email is already in use."] } };
    }

    if (slugExists) {
      return { success: false, fieldErrors: { slug: ["Slug is already taken."] } };
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const verificationCode = generateEmailVerificationCode();
    const verificationTokenHash = await hashEmailVerificationCode(
      verificationCode,
    );
    const verificationExpiresAt = new Date(
      Date.now() + SIGNUP_EMAIL_VERIFICATION_TTL_MS,
    );

    await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.schoolName,
          slug: tenantSlug,
        },
        select: { id: true },
      });
      createdTenantId = tenant.id;

      const user = await tx.user.create({
        data: {
          name: data.adminName,
          email: normalizedEmail,
          passwordHash,
          role: UserRole.SCHOOL_ADMIN,
          schoolId: tenant.id,
          isSchoolOwner: true,
          emailVerifiedAt: null,
        },
        select: { id: true },
      });
      createdUserId = user.id;

      const identifier = buildSignupEmailVerificationIdentifier(user.id);
      await tx.verificationToken.deleteMany({
        where: { identifier },
      });
      await tx.verificationToken.create({
        data: {
          identifier,
          token: verificationTokenHash,
          expires: verificationExpiresAt,
        },
      });
    });

    let emailQueued = false;
    try {
      emailQueued = await enqueueEmail({
        to: normalizedEmail,
        subject: "Verify your email for Technet SMS",
        body: buildSignupVerificationEmailBody({
          adminName: data.adminName,
          schoolName: data.schoolName,
          code: verificationCode,
        }),
      });
    } catch (error) {
      console.error("signup enqueueEmail failed", {
        email: normalizedEmail,
        error,
      });
      emailQueued = false;
    }

    if (!emailQueued) {
      if (createdUserId && createdTenantId) {
        const userId = createdUserId;
        const tenantId = createdTenantId;
        await prisma.$transaction(async (tx) => {
          await tx.verificationToken.deleteMany({
            where: {
              identifier: buildSignupEmailVerificationIdentifier(userId),
            },
          });
          await tx.$executeRaw`DELETE FROM "User" WHERE id = ${userId}`;
          await tx.$executeRaw`DELETE FROM "Tenant" WHERE id = ${tenantId}`;
        });
      }

      return {
        success: false,
        message:
          "We could not send your verification code right now. Please try again.",
      };
    }

    return {
      success: true,
      message: "School account created. Check your email for the verification code.",
      redirectTo: `/verify-email?email=${encodeURIComponent(normalizedEmail)}`,
    };
  } catch (error) {
    console.error("signup failed", {
      email: normalizedEmail,
      error,
    });

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2022"
    ) {
      return {
        success: false,
        message:
          "Database schema is out of date. Please run migrations and try again.",
      };
    }

    if (createdUserId && createdTenantId) {
      const userId = createdUserId;
      const tenantId = createdTenantId;
      await prisma.$transaction(async (tx) => {
        await tx.verificationToken.deleteMany({
          where: {
            identifier: buildSignupEmailVerificationIdentifier(userId),
          },
        });
        await tx.$executeRaw`DELETE FROM "User" WHERE id = ${userId}`;
        await tx.$executeRaw`DELETE FROM "Tenant" WHERE id = ${tenantId}`;
      });
    }

    return {
      success: false,
      message: "We could not create your account right now. Please try again.",
    };
  }
}

export async function verifySignupEmailAction(
  _previousState: VerifyEmailActionState,
  formData: FormData,
): Promise<VerifyEmailActionState> {
  const parsed = verifyEmailSchema.safeParse({
    email: formData.get("email"),
    code: formData.get("code"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message ?? "Invalid verification request.",
    };
  }

  const email = normalizeEmail(parsed.data.email);
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      role: true,
      emailVerifiedAt: true,
    },
  });

  if (!user || user.role !== UserRole.SCHOOL_ADMIN) {
    return { status: "error", message: "Invalid verification request." };
  }

  if (user.emailVerifiedAt) {
    return {
      status: "success",
      message: "Email is already verified. Please sign in.",
      redirectTo: "/login?verified=1",
    };
  }

  const identifier = buildSignupEmailVerificationIdentifier(user.id);
  const tokenRecord = await prisma.verificationToken.findFirst({
    where: { identifier },
    orderBy: { createdAt: "desc" },
    select: {
      token: true,
      expires: true,
    },
  });

  if (!tokenRecord) {
    return {
      status: "error",
      message: "Verification code not found. Please request a new code.",
    };
  }

  if (tokenRecord.expires.getTime() <= Date.now()) {
    return {
      status: "error",
      message: "Verification code expired. Please request a new code.",
    };
  }

  const isValidCode = await verifyEmailVerificationCode(
    parsed.data.code,
    tokenRecord.token,
  );

  if (!isValidCode) {
    return {
      status: "error",
      message: "Invalid verification code.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });
    await tx.verificationToken.deleteMany({
      where: { identifier },
    });
  });

  return {
    status: "success",
    message: "Email verified successfully. Please sign in.",
    redirectTo: "/login?verified=1",
  };
}

export async function resendSignupEmailCodeAction(
  _previousState: VerifyEmailActionState,
  formData: FormData,
): Promise<VerifyEmailActionState> {
  const parsed = resendEmailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message ?? "Invalid resend request.",
    };
  }

  const email = normalizeEmail(parsed.data.email);
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      role: true,
      name: true,
      emailVerifiedAt: true,
      school: { select: { name: true } },
    },
  });

  if (!user || user.role !== UserRole.SCHOOL_ADMIN || user.emailVerifiedAt) {
    return {
      status: "error",
      message: "Verification is not required for this account.",
    };
  }

  const identifier = buildSignupEmailVerificationIdentifier(user.id);
  const latestToken = await prisma.verificationToken.findFirst({
    where: { identifier },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, token: true },
  });

  if (latestToken) {
    const ageMs = Date.now() - latestToken.createdAt.getTime();
    if (ageMs < SIGNUP_EMAIL_VERIFICATION_RESEND_COOLDOWN_MS) {
      return {
        status: "error",
        message: "Please wait before requesting another code.",
        cooldownSeconds: Math.ceil(
          (SIGNUP_EMAIL_VERIFICATION_RESEND_COOLDOWN_MS - ageMs) / 1000,
        ),
      };
    }
  }

  const verificationCode = generateEmailVerificationCode();
  const verificationTokenHash = await hashEmailVerificationCode(
    verificationCode,
  );
  const verificationExpiresAt = new Date(
    Date.now() + SIGNUP_EMAIL_VERIFICATION_TTL_MS,
  );

  await prisma.verificationToken.create({
    data: {
      identifier,
      token: verificationTokenHash,
      expires: verificationExpiresAt,
    },
  });

  const emailQueued = await enqueueEmail({
    to: email,
    subject: "Your new verification code for Technet SMS",
    body: buildSignupVerificationEmailBody({
      adminName: user.name ?? "Admin",
      schoolName: user.school?.name ?? "your school",
      code: verificationCode,
    }),
  });

  if (!emailQueued) {
    await prisma.verificationToken.deleteMany({
      where: {
        identifier,
        token: verificationTokenHash,
      },
    });
    return {
      status: "error",
      message: "Unable to send a new code right now. Please try again.",
    };
  }

  await prisma.verificationToken.deleteMany({
    where: {
      identifier,
      token: { not: verificationTokenHash },
    },
  });

  return {
    status: "success",
    message: "A new verification code has been sent.",
  };
}
