import { authenticator } from "otplib";
import QRCode from "qrcode";

const ISSUER = "Technet SMS";

export const TWO_FACTOR_REQUIRED_CODE = "TWO_FACTOR_REQUIRED";
export const TWO_FACTOR_INVALID_CODE = "TWO_FACTOR_INVALID";

export const TWO_FACTOR_REQUIRED_MESSAGE =
  "Enter your authenticator app code to continue.";
export const TWO_FACTOR_INVALID_MESSAGE =
  "The authenticator code is invalid. Please try again.";

export function generateTwoFactorSecret() {
  return authenticator.generateSecret();
}

export function buildOtpAuthUrl({
  email,
  secret,
}: {
  email: string;
  secret: string;
}) {
  return authenticator.keyuri(email, ISSUER, secret);
}

export async function generateQrCodeDataUrl(otpauthUrl: string) {
  return QRCode.toDataURL(otpauthUrl);
}

export function verifyTwoFactorToken({
  token,
  secret,
}: {
  token: string;
  secret: string;
}) {
  return authenticator.check(token, secret);
}
