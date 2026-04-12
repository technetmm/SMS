import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { UserRole } from "@/app/generated/prisma/enums";

export const EMAIL_NOT_VERIFIED_CODE = "EMAIL_NOT_VERIFIED";
export const EMAIL_NOT_VERIFIED_MESSAGE =
  "Please verify your email before signing in.";

export const EMAIL_VERIFICATION_TTL_MS = 10 * 60 * 1000;
export const EMAIL_VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1000;

export const EMAIL_VERIFICATION_REQUIRED_ROLES = new Set<UserRole>([
  UserRole.SCHOOL_SUPER_ADMIN,
  UserRole.SCHOOL_ADMIN,
  UserRole.TEACHER,
  UserRole.STUDENT,
]);

export function normalizeEmail(input: string) {
  return input.trim().toLowerCase();
}

export function buildEmailVerificationIdentifier(userId: string) {
  return `email-verification:${userId}`;
}

export function generateEmailVerificationCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function hashEmailVerificationCode(code: string) {
  return bcrypt.hash(code, 10);
}

export async function verifyEmailVerificationCode(
  code: string,
  tokenHash: string,
) {
  return bcrypt.compare(code, tokenHash);
}

export function requiresEmailVerification(input: {
  role: UserRole;
  emailVerifiedAt: Date | null;
  passwordHash: string | null;
}) {
  return (
    EMAIL_VERIFICATION_REQUIRED_ROLES.has(input.role) &&
    !input.emailVerifiedAt &&
    Boolean(input.passwordHash)
  );
}

export function buildVerificationEmailSubject() {
  return "Verify your email for Technet SMS";
}

export function buildVerificationEmailBody(input: {
  userName: string;
  schoolName?: string | null;
  code: string;
}) {
  const schoolLine = input.schoolName?.trim()
    ? `Your verification code for ${input.schoolName} is: ${input.code}`
    : `Your verification code is: ${input.code}`;

  return [
    `Hi ${input.userName},`,
    "",
    schoolLine,
    "",
    "This code expires in 10 minutes.",
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");
}
