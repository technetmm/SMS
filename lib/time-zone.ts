import { APP_TIME_ZONE } from "@/lib/app-time";

export function isValidIanaTimeZone(value: string | null | undefined) {
  const timeZone = value?.trim();
  if (!timeZone) {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function normalizeTimeZone(value: string | null | undefined) {
  const timeZone = value?.trim() ?? "";
  return isValidIanaTimeZone(timeZone) ? timeZone : null;
}

export function resolveEffectiveTimeZone(value: string | null | undefined) {
  return normalizeTimeZone(value) ?? APP_TIME_ZONE;
}
