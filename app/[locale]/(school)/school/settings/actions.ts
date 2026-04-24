"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { revalidateLocalizedPath } from "@/lib/revalidate";
import { prisma } from "@/lib/prisma";
import { getServerAuth } from "@/auth";
import { logAction } from "@/lib/audit-log";
import { Currency } from "@/app/generated/prisma/enums";
import {
  changeEmailSchema,
  changePasswordSchema,
  schoolProfileSchema,
} from "@/lib/validators/settings";
import { requireSchoolOwnerAdminAccess } from "@/lib/rbac";
import { saveProfileImage, removeProfileImage } from "@/lib/upload";
import {
  buildOtpAuthUrl,
  generateQrCodeDataUrl,
  generateTwoFactorSecret,
  verifyTwoFactorToken,
} from "@/lib/auth/2fa";

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  qrCode?: string;
};

async function getSettingsActionTranslations() {
  return getTranslations("SettingsActions");
}

function translateValidationMessage(
  t: Awaited<ReturnType<typeof getSettingsActionTranslations>>,
  message: string | undefined,
) {
  if (!message) {
    return t("errors.unknown");
  }

  if (message.startsWith("validation.")) {
    return t(message as Parameters<typeof t>[0]);
  }

  return message;
}

function revalidateSettingsPages() {
  revalidateLocalizedPath("/school/settings");
  revalidateLocalizedPath("/platform/settings");
}

const tokenSchema = z
  .string()
  .trim()
  .min(6, "validation.otp.required")
  .max(6, "validation.otp.length");

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function toSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function uploadProfilePhoto(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = await getSettingsActionTranslations();
  const session = await getServerAuth();
  if (!session?.user?.id) {
    return { status: "error", message: t("errors.unauthorized") };
  }

  const file = formData.get("photo");
  if (!(file instanceof File)) {
    return { status: "error", message: t("errors.selectImage") };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true },
  });

  if (!user) {
    return { status: "error", message: t("errors.userNotFound") };
  }

  const result = await saveProfileImage({ file, existingUrl: user.image });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: result.url },
  });
  await logAction({
    action: "UPDATE",
    entity: "UserProfile",
    entityId: session.user.id,
    metadata: { field: "image" },
  });

  revalidateSettingsPages();
  return { status: "success", message: t("success.profilePhotoUpdated") };
}

export async function removeProfilePhotoAction(): Promise<ActionState> {
  const t = await getSettingsActionTranslations();
  const session = await getServerAuth();
  if (!session?.user?.id) {
    return { status: "error", message: t("errors.unauthorized") };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true },
  });

  if (!user) {
    return { status: "error", message: t("errors.userNotFound") };
  }

  await removeProfileImage(user.image);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: null },
  });
  await logAction({
    action: "UPDATE",
    entity: "UserProfile",
    entityId: session.user.id,
    metadata: { field: "image", removed: true },
  });

  revalidateSettingsPages();
  return { status: "success", message: t("success.profilePhotoRemoved") };
}

export async function startTwoFactorSetup(): Promise<ActionState> {
  const t = await getSettingsActionTranslations();
  const session = await getServerAuth();
  if (!session?.user?.id || !session.user.email) {
    return { status: "error", message: t("errors.unauthorized") };
  }

  const secret = generateTwoFactorSecret();
  const otpauth = buildOtpAuthUrl({
    email: session.user.email,
    secret,
  });

  const qrCode = await generateQrCodeDataUrl(otpauth);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorSecret: secret, twoFactorEnabled: false },
  });

  return {
    status: "success",
    message: t("success.scanQr"),
    qrCode,
  };
}

export async function verifyTwoFactorSetup(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = await getSettingsActionTranslations();
  const session = await getServerAuth();
  if (!session?.user?.id) {
    return { status: "error", message: t("errors.unauthorized") };
  }

  const tokenValue = formData.get("token");
  const parsed = tokenSchema.safeParse(tokenValue);
  if (!parsed.success) {
    return {
      status: "error",
      message: translateValidationMessage(t, parsed.error.errors[0]?.message),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorSecret: true },
  });

  if (!user?.twoFactorSecret) {
    return { status: "error", message: t("errors.twoFactorNotStarted") };
  }

  const isValid = verifyTwoFactorToken({
    token: parsed.data,
    secret: user.twoFactorSecret,
  });

  if (!isValid) {
    return { status: "error", message: t("errors.invalidCode") };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorEnabled: true },
  });
  await logAction({
    action: "UPDATE",
    entity: "TwoFactor",
    entityId: session.user.id,
    metadata: { enabled: true },
  });

  revalidateSettingsPages();
  return { status: "success", message: t("success.twoFactorEnabled") };
}

export async function disableTwoFactor(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = await getSettingsActionTranslations();
  const session = await getServerAuth();
  if (!session?.user?.id) {
    return { status: "error", message: t("errors.unauthorized") };
  }

  const password = formData.get("password");
  if (typeof password !== "string" || password.length < 8) {
    return { status: "error", message: t("validation.shared.passwordRequired") };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { status: "error", message: t("errors.passwordLoginNotConfigured") };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { status: "error", message: t("errors.invalidPassword") };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });
  await logAction({
    action: "UPDATE",
    entity: "TwoFactor",
    entityId: session.user.id,
    metadata: { enabled: false },
  });

  revalidateSettingsPages();
  return { status: "success", message: t("success.twoFactorDisabled") };
}

export async function changeEmailAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = await getSettingsActionTranslations();
  const session = await getServerAuth();
  if (!session?.user?.id) {
    return { status: "error", message: t("errors.unauthorized") };
  }

  const parsed = changeEmailSchema.safeParse({
    newEmail: getFormValue(formData, "newEmail"),
    password: getFormValue(formData, "password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: translateValidationMessage(t, parsed.error.errors[0]?.message),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { status: "error", message: t("errors.passwordLoginNotConfigured") };
  }

  const passwordValid = await bcrypt.compare(
    parsed.data.password,
    user.passwordHash,
  );

  if (!passwordValid) {
    return { status: "error", message: t("errors.invalidPassword") };
  }

  if (parsed.data.newEmail === user.email) {
    return { status: "error", message: t("errors.emailUnchanged") };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.newEmail },
    select: { id: true },
  });

  if (existing && existing.id !== session.user.id) {
    return { status: "error", message: t("errors.emailInUse") };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { email: parsed.data.newEmail },
  });
  await logAction({
    action: "UPDATE",
    entity: "User",
    entityId: session.user.id,
    metadata: { field: "email" },
  });

  revalidateSettingsPages();
  return { status: "success", message: t("success.emailUpdated") };
}

export async function changePasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = await getSettingsActionTranslations();
  const session = await getServerAuth();
  if (!session?.user?.id) {
    return { status: "error", message: t("errors.unauthorized") };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: getFormValue(formData, "currentPassword"),
    newPassword: getFormValue(formData, "newPassword"),
    confirmPassword: getFormValue(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: translateValidationMessage(t, parsed.error.errors[0]?.message),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { status: "error", message: t("errors.passwordLoginNotConfigured") };
  }

  const passwordValid = await bcrypt.compare(
    parsed.data.currentPassword,
    user.passwordHash,
  );

  if (!passwordValid) {
    return { status: "error", message: t("errors.currentPasswordIncorrect") };
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 10);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newHash },
  });
  await logAction({
    action: "UPDATE",
    entity: "User",
    entityId: session.user.id,
    metadata: { field: "password" },
  });

  revalidateSettingsPages();
  return { status: "success", message: t("success.passwordUpdated") };
}

export async function updateSchoolProfileAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = await getSettingsActionTranslations();
  let ownerUser: Awaited<ReturnType<typeof requireSchoolOwnerAdminAccess>>;
  try {
    ownerUser = await requireSchoolOwnerAdminAccess();
  } catch {
    return {
      status: "error",
      message: t("errors.schoolOwnerOnly"),
    };
  }

  if (!ownerUser.schoolId) {
    return { status: "error", message: t("errors.schoolContextNotFound") };
  }

  const parsed = schoolProfileSchema.safeParse({
    name: getFormValue(formData, "name"),
    slug: getFormValue(formData, "slug"),
    currency: getFormValue(formData, "currency") as Currency,
    billingDayOfMonth: getFormValue(formData, "billingDayOfMonth"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: translateValidationMessage(t, parsed.error.errors[0]?.message),
    };
  }

  const slug = toSlug(parsed.data.slug);
  if (!slug) {
    return { status: "error", message: t("errors.invalidSchoolSlug") };
  }

  const existing = await prisma.tenant.findFirst({
    where: { slug, id: { not: ownerUser.schoolId } },
    select: { id: true },
  });
  if (existing) {
    return { status: "error", message: t("errors.slugTaken") };
  }

  await prisma.tenant.update({
    where: { id: ownerUser.schoolId },
    data: {
      name: parsed.data.name.trim(),
      slug,
      currency: parsed.data.currency,
      billingDayOfMonth: parsed.data.billingDayOfMonth,
    },
  });

  await logAction({
    action: "UPDATE",
    entity: "Tenant",
    entityId: ownerUser.schoolId,
    schoolId: ownerUser.schoolId,
    userId: ownerUser.id,
    metadata: {
      operation: "update_school_profile",
      slug,
      name: parsed.data.name.trim(),
      currency: parsed.data.currency,
      billingDayOfMonth: parsed.data.billingDayOfMonth,
    },
  });

  revalidateLocalizedPath("/school/settings/school-profile");
  revalidateLocalizedPath("/school/settings");
  revalidateLocalizedPath("/school/dashboard");
  return { status: "success", message: t("success.schoolProfileUpdated") };
}
