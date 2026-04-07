export const DEVICE_APPROVAL_REQUIRED_CODE = "DEVICE_APPROVAL_REQUIRED";
export const DEVICE_APPROVAL_DENIED_CODE = "DEVICE_APPROVAL_DENIED";
export const DEVICE_APPROVAL_EXPIRED_CODE = "DEVICE_APPROVAL_EXPIRED";

export const DEVICE_APPROVAL_TTL_MS = 2 * 60 * 1000;
export const DEVICE_APPROVAL_POLL_INTERVAL_MS = 3000;

export const DEVICE_APPROVAL_REQUIRED_MESSAGE =
  "This login request is waiting for approval.";
export const DEVICE_APPROVAL_DENIED_MESSAGE =
  "Login request was denied by an approver.";
export const DEVICE_APPROVAL_EXPIRED_MESSAGE =
  "Login approval request expired. Please try signing in again.";

export function buildDeviceApprovalError(token: string) {
  return `${DEVICE_APPROVAL_REQUIRED_CODE}:${token}`;
}

export function extractDeviceApprovalToken(errorText: string) {
  const prefix = `${DEVICE_APPROVAL_REQUIRED_CODE}:`;
  if (!errorText.startsWith(prefix)) return null;
  const token = errorText.slice(prefix.length).trim();
  return token.length > 0 ? token : null;
}
