import { authenticator } from "otplib";
import QRCode from "qrcode";

const ISSUER = "Technet LMS";

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
