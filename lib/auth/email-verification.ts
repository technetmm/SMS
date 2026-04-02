import bcrypt from "bcryptjs";
import { randomInt } from "crypto";

export const EMAIL_NOT_VERIFIED_CODE = "EMAIL_NOT_VERIFIED";
export const EMAIL_NOT_VERIFIED_MESSAGE =
  "Please verify your email before signing in.";

export const SIGNUP_EMAIL_VERIFICATION_TTL_MS = 10 * 60 * 1000;
export const SIGNUP_EMAIL_VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1000;

export function normalizeEmail(input: string) {
  return input.trim().toLowerCase();
}

export function buildSignupEmailVerificationIdentifier(userId: string) {
  return `signup-email:${userId}`;
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

export function buildSignupVerificationEmailBody(input: {
  adminName: string;
  schoolName: string;
  code: string;
}) {
  return [
    `Hi ${input.adminName},`,
    "",
    `Your verification code for ${input.schoolName} is: ${input.code}`,
    "",
    "This code expires in 10 minutes.",
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");
}
