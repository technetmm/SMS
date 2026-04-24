export type PendingLoginCredentials = {
  email: string;
  password: string;
  approvalToken: string | null;
};

const STORAGE_KEY = "sms.pending-login-credentials";

function isBrowser() {
  return typeof window !== "undefined";
}

export function savePendingLoginCredentials(input: PendingLoginCredentials) {
  if (!isBrowser()) return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(input));
}

export function readPendingLoginCredentials(): PendingLoginCredentials | null {
  if (!isBrowser()) return null;

  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PendingLoginCredentials>;
    if (
      typeof parsed.email === "string" &&
      typeof parsed.password === "string" &&
      (typeof parsed.approvalToken === "string" || parsed.approvalToken === null)
    ) {
      return {
        email: parsed.email,
        password: parsed.password,
        approvalToken: parsed.approvalToken,
      };
    }
  } catch {
    // ignore malformed payload and clear it below
  }

  window.sessionStorage.removeItem(STORAGE_KEY);
  return null;
}

export function clearPendingLoginCredentials() {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}
