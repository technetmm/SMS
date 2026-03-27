"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerAuth } from "@/auth";
import {UserRole } from "@/app/generated/prisma/enums";
import { requireRole } from "@/lib/rbac";
import { logAction } from "@/lib/audit-log";
import { changeEmailSchema, changePasswordSchema } from "@/lib/validators/settings";
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
  revalidatePath("/settings");
  revalidatePath("/platform/settings");
}

function revalidatePermissionPages() {
  revalidatePath("/settings/permissions");
  revalidatePath("/platform/settings/permissions");
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

const rolePermissionSchema = z.object({
  roleId: z.string().min(1, "Role is required"),
  permissionKey: z.string().min(1, "Permission is required"),
  enabled: z.coerce.boolean(),
});

const userPermissionSchema = z.object({
  userId: z.string().min(1, "User is required"),
  permissionKey: z.string().min(1, "Permission is required"),
  enabled: z.coerce.boolean(),
});

export async function setRolePermission(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const current = await requireRole(UserRole.SCHOOL_ADMIN);
  const parsed = rolePermissionSchema.safeParse({
    roleId: getFormValue(formData, "roleId"),
    permissionKey: getFormValue(formData, "permission"),
    enabled: getFormValue(formData, "enabled"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  if (!current.schoolId) {
    return { status: "error", message: "Unauthorized" };
  }

  const [role, permission] = await Promise.all([
    prisma.role.findFirst({
      where: { id: parsed.data.roleId, schoolId: current.schoolId },
      select: { id: true },
    }),
    prisma.permission.findUnique({
      where: { key: parsed.data.permissionKey },
      select: { id: true },
    }),
  ]);

  if (!role || !permission) {
    return { status: "error", message: "Invalid role or permission." };
  }

  if (parsed.data.enabled) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });
  } else {
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id, permissionId: permission.id },
    });
  }

  await logAction({
    action: "UPDATE",
    entity: "RolePermission",
    schoolId: current.schoolId,
    userId: current.id,
    metadata: parsed.data,
  });

  revalidatePermissionPages();
  return { status: "success", message: "Role permission updated." };
}

export async function setUserPermission(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  userPermissionSchema.parse({
    userId: getFormValue(formData, "userId"),
    permissionKey: getFormValue(formData, "permission"),
    enabled: getFormValue(formData, "enabled"),
  });
  return {
    status: "error",
    message: "Direct user permission overrides are disabled. Assign a role instead.",
  };
}
