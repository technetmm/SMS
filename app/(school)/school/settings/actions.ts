"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
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

function revalidateSettingsPages() {
  revalidatePath("/school/settings");
  revalidatePath("/platform/settings");
}

const tokenSchema = z
  .string()
  .trim()
  .min(6, "OTP code is required")
  .max(6, "OTP code must be 6 digits");

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
  const session = await getServerAuth();
  if (!session?.user?.id) {
    return { status: "error", message: "Unauthorized" };
  }

  const file = formData.get("photo");
  if (!(file instanceof File)) {
    return { status: "error", message: "Please select an image" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true },
  });

  if (!user) {
    return { status: "error", message: "User not found" };
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
  return { status: "success", message: "Profile photo updated" };
}

export async function removeProfilePhotoAction(): Promise<ActionState> {
  const session = await getServerAuth();
  if (!session?.user?.id) {
    return { status: "error", message: "Unauthorized" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true },
  });

  if (!user) {
    return { status: "error", message: "User not found" };
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
  return { status: "success", message: "Profile photo removed" };
}

export async function startTwoFactorSetup(): Promise<ActionState> {
  const session = await getServerAuth();
  if (!session?.user?.id || !session.user.email) {
    return { status: "error", message: "Unauthorized" };
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
    message: "Scan the QR code with your authenticator app.",
    qrCode,
  };
}

export async function verifyTwoFactorSetup(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getServerAuth();
  if (!session?.user?.id) {
    return { status: "error", message: "Unauthorized" };
  }

  const tokenValue = formData.get("token");
  const parsed = tokenSchema.safeParse(tokenValue);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorSecret: true },
  });

  if (!user?.twoFactorSecret) {
    return { status: "error", message: "2FA setup not started." };
  }

  const isValid = verifyTwoFactorToken({
    token: parsed.data,
    secret: user.twoFactorSecret,
  });

  if (!isValid) {
    return { status: "error", message: "Invalid code, try again." };
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
  return { status: "success", message: "2FA enabled successfully." };
}

export async function disableTwoFactor(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getServerAuth();
  if (!session?.user?.id) {
    return { status: "error", message: "Unauthorized" };
  }

  const password = formData.get("password");
  if (typeof password !== "string" || password.length < 8) {
    return { status: "error", message: "Password is required." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { status: "error", message: "Password login not configured." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { status: "error", message: "Invalid password." };
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
  return { status: "success", message: "2FA disabled." };
}

export async function changeEmailAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getServerAuth();
  if (!session?.user?.id) {
    return { status: "error", message: "Unauthorized" };
  }

  const parsed = changeEmailSchema.safeParse({
    newEmail: getFormValue(formData, "newEmail"),
    password: getFormValue(formData, "password"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { status: "error", message: "Password login not configured." };
  }

  const passwordValid = await bcrypt.compare(
    parsed.data.password,
    user.passwordHash,
  );

  if (!passwordValid) {
    return { status: "error", message: "Invalid password." };
  }

  if (parsed.data.newEmail === user.email) {
    return { status: "error", message: "Email is unchanged." };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.newEmail },
    select: { id: true },
  });

  if (existing && existing.id !== session.user.id) {
    return { status: "error", message: "Email already in use." };
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
  return { status: "success", message: "Email updated successfully." };
}

export async function changePasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getServerAuth();
  if (!session?.user?.id) {
    return { status: "error", message: "Unauthorized" };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: getFormValue(formData, "currentPassword"),
    newPassword: getFormValue(formData, "newPassword"),
    confirmPassword: getFormValue(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { status: "error", message: "Password login not configured." };
  }

  const passwordValid = await bcrypt.compare(
    parsed.data.currentPassword,
    user.passwordHash,
  );

  if (!passwordValid) {
    return { status: "error", message: "Current password is incorrect." };
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
  return { status: "success", message: "Password updated successfully." };
}

export async function updateSchoolProfileAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let ownerUser: Awaited<ReturnType<typeof requireSchoolOwnerAdminAccess>>;
  try {
    ownerUser = await requireSchoolOwnerAdminAccess();
  } catch {
    return {
      status: "error",
      message: "Only the school owner admin can update school info.",
    };
  }

  if (!ownerUser.schoolId) {
    return { status: "error", message: "School context not found." };
  }

  const parsed = schoolProfileSchema.safeParse({
    name: getFormValue(formData, "name"),
    slug: getFormValue(formData, "slug"),
    currency: getFormValue(formData, "currency") as Currency,
    billingDayOfMonth: getFormValue(formData, "billingDayOfMonth"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const slug = toSlug(parsed.data.slug);
  if (!slug) {
    return { status: "error", message: "Please provide a valid school slug." };
  }

  const existing = await prisma.tenant.findFirst({
    where: { slug, id: { not: ownerUser.schoolId } },
    select: { id: true },
  });
  if (existing) {
    return { status: "error", message: "Slug is already taken." };
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

  revalidatePath("/school/settings/school-profile");
  revalidatePath("/school/settings");
  revalidatePath("/school/dashboard");
  return { status: "success", message: "School profile updated." };
}
