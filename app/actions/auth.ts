"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import { UserRole } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";
import { processEmailJob } from "@/lib/jobs/email.job";
import {
  signupSchema,
  type SignupActionState,
} from "@/app/lib/validations/signup-schema";
import {
  buildEmailVerificationIdentifier,
  buildVerificationEmailBody,
  buildVerificationEmailSubject,
  generateEmailVerificationCode,
  hashEmailVerificationCode,
  normalizeEmail,
  EMAIL_VERIFICATION_RESEND_COOLDOWN_MS,
  EMAIL_VERIFICATION_TTL_MS,
  requiresEmailVerification,
  verifyEmailVerificationCode,
} from "@/lib/auth/email-verification";
import { getTranslations } from "next-intl/server";

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

export async function signup(
  _previousState: SignupActionState,
  formData: FormData,
): Promise<SignupActionState> {
  const t = await getTranslations("SignupForm");
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
      message: t("messages.invalidForm"),
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const normalizedEmail = normalizeEmail(data.email);
  const tenantSlug = data.slug ? data.slug : toSlug(data.schoolName);

  if (!tenantSlug) {
    return {
      success: false,
      fieldErrors: { slug: [t("fieldErrors.slug.invalid")] },
    };
  }

  try {
    const [emailExists, slugExists] = await Promise.all([
      prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      }),
      prisma.tenant.findUnique({
        where: { slug: tenantSlug },
        select: { id: true },
      }),
    ]);

    if (emailExists) {
      return {
        success: false,
        fieldErrors: { email: [t("fieldErrors.email.taken")] },
      };
    }

    if (slugExists) {
      return {
        success: false,
        fieldErrors: { slug: [t("fieldErrors.slug.taken")] },
      };
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const verificationCode = generateEmailVerificationCode();
    const verificationTokenHash =
      await hashEmailVerificationCode(verificationCode);
    const verificationExpiresAt = new Date(
      Date.now() + EMAIL_VERIFICATION_TTL_MS,
    );

    await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.schoolName,
          slug: tenantSlug,
        },
        select: { id: true },
      });

      const user = await tx.user.create({
        data: {
          name: data.adminName,
          email: normalizedEmail,
          passwordHash,
          role: UserRole.SCHOOL_SUPER_ADMIN,
          schoolId: tenant.id,
          isSchoolOwner: true,
          emailVerifiedAt: null,
        },
        select: { id: true },
      });

      const identifier = buildEmailVerificationIdentifier(user.id);
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

    let emailSent = false;
    try {
      await processEmailJob({
        to: normalizedEmail,
        subject: buildVerificationEmailSubject(),
        body: buildVerificationEmailBody({
          userName: data.adminName,
          schoolName: data.schoolName,
          code: verificationCode,
        }),
      });
      emailSent = true;
    } catch (error) {
      console.error("signup processEmailJob failed", {
        email: normalizedEmail,
        error,
      });
      emailSent = false;
    }

    console.log("signup processEmailJob", {
      email: normalizedEmail,
      emailSent,
    });

    if (!emailSent) {
      return {
        success: true,
        message: t("messages.createdEmailFailed"),
        redirectTo: `/verify-email?email=${encodeURIComponent(normalizedEmail)}&emailSend=failed`,
      };
    }

    return {
      success: true,
      message: t("messages.createdSuccess"),
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
        message: t("messages.schemaOutdated"),
      };
    }

    return {
      success: false,
      message: t("messages.createFailed"),
    };
  }
}

export async function verifySignupEmailAction(
  _previousState: VerifyEmailActionState,
  formData: FormData,
): Promise<VerifyEmailActionState> {
  const t = await getTranslations("VerifyEmailForm");

  const verifyEmailSchema = z.object({
    email: z.string().trim().email(t("messages.invalidEmail")),
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, t("messages.codeLength")),
  });

  const parsed = verifyEmailSchema.safeParse({
    email: formData.get("email"),
    code: formData.get("code"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message ?? t("messages.invalidRequest"),
    };
  }

  const email = normalizeEmail(parsed.data.email);
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      role: true,
      emailVerifiedAt: true,
      passwordHash: true,
    },
  });

  if (!user) {
    return { status: "error", message: t("messages.invalidRequest") };
  }

  if (user.emailVerifiedAt) {
    return {
      status: "success",
      message: t("messages.alreadyVerified"),
      redirectTo: "/login?verified=1",
    };
  }

  if (
    !requiresEmailVerification({
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt,
      passwordHash: user.passwordHash,
    })
  ) {
    return { status: "error", message: t("messages.invalidRequest") };
  }

  const identifier = buildEmailVerificationIdentifier(user.id);
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
      message: t("messages.codeMissing"),
    };
  }

  if (tokenRecord.expires.getTime() <= Date.now()) {
    return {
      status: "error",
      message: t("messages.codeExpired"),
    };
  }

  const isValidCode = await verifyEmailVerificationCode(
    parsed.data.code,
    tokenRecord.token,
  );

  if (!isValidCode) {
    return {
      status: "error",
      message: t("messages.codeInvalid"),
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
    message: t("messages.verifySuccess"),
    redirectTo: "/login?verified=1",
  };
}

export async function resendSignupEmailCodeAction(
  _previousState: VerifyEmailActionState,
  formData: FormData,
): Promise<VerifyEmailActionState> {
  const t = await getTranslations("VerifyEmailForm");

  const resendEmailSchema = z.object({
    email: z.string().trim().email(t("messages.invalidEmail")),
  });

  const parsed = resendEmailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message ?? t("messages.invalidResend"),
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
      passwordHash: true,
      school: { select: { name: true } },
    },
  });

  if (
    !user ||
    !requiresEmailVerification({
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt,
      passwordHash: user.passwordHash,
    })
  ) {
    return {
      status: "error",
      message: t("messages.notRequired"),
    };
  }

  const identifier = buildEmailVerificationIdentifier(user.id);
  const latestToken = await prisma.verificationToken.findFirst({
    where: { identifier },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, token: true },
  });

  if (latestToken) {
    const ageMs = Date.now() - latestToken.createdAt.getTime();
    if (ageMs < EMAIL_VERIFICATION_RESEND_COOLDOWN_MS) {
      return {
        status: "error",
        message: t("messages.cooldown"),
        cooldownSeconds: Math.ceil(
          (EMAIL_VERIFICATION_RESEND_COOLDOWN_MS - ageMs) / 1000,
        ),
      };
    }
  }

  const verificationCode = generateEmailVerificationCode();
  const verificationTokenHash =
    await hashEmailVerificationCode(verificationCode);
  const verificationExpiresAt = new Date(
    Date.now() + EMAIL_VERIFICATION_TTL_MS,
  );

  await prisma.verificationToken.create({
    data: {
      identifier,
      token: verificationTokenHash,
      expires: verificationExpiresAt,
    },
  });

  let emailSent = false;
  try {
    await processEmailJob({
      to: email,
      subject: buildVerificationEmailSubject(),
      body: buildVerificationEmailBody({
        userName: user.name ?? "User",
        schoolName: user.school?.name ?? "your school",
        code: verificationCode,
      }),
    });
    emailSent = true;
  } catch (error) {
    console.error("resendSignupEmailCodeAction processEmailJob failed", {
      email,
      error,
    });
    emailSent = false;
  }

  if (!emailSent) {
    await prisma.verificationToken.deleteMany({
      where: {
        identifier,
        token: verificationTokenHash,
      },
    });
    return {
      status: "error",
      message: t("messages.sendFailed"),
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
    message: t("messages.resent"),
  };
}
