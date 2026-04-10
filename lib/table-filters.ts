export function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function parseTextParam(value: string | string[] | undefined) {
  const raw = firstParam(value);
  if (!raw) return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function parseNumberParam(value: string | string[] | undefined) {
  const raw = firstParam(value);
  if (!raw) return undefined;
  const num = Number(raw);
  return Number.isFinite(num) ? num : undefined;
}

export function parseDateParam(value: string | string[] | undefined) {
  const raw = firstParam(value);
  if (!raw) return undefined;
  const date = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

export function parseDateRangeParams(input: {
  from?: string | string[];
  to?: string | string[];
}) {
  const from = parseDateParam(input.from);
  const toStart = parseDateParam(input.to);

  // Normalize "to" as end-of-day UTC for inclusive date filtering.
  const to = toStart
    ? new Date(Date.UTC(
        toStart.getUTCFullYear(),
        toStart.getUTCMonth(),
        toStart.getUTCDate(),
        23,
        59,
        59,
        999,
      ))
    : undefined;

  return { from, to };
}

export function parseEnumParam<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
) {
  const raw = firstParam(value);
  if (!raw) return undefined;
  return allowed.includes(raw as T) ? (raw as T) : undefined;
}

export function containsInsensitive(value: string) {
  return {
    contains: value,
    mode: "insensitive" as const,
  };
}

