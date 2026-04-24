import { Currency, UserRole } from "@/app/generated/prisma/enums";
import { Session } from "next-auth";

export const checkRole = (user: Session["user"], role: UserRole) => {
  return user.role === role;
};

export function uniqueBy(items: any[], key: string = "id") {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item[key])) return false;
    seen.add(item[key]);
    return true;
  });
}

const moneyCache = new Map<string, Intl.NumberFormat>();
export const money = (currency: Currency | string) => {
  const cached = moneyCache.get(currency);
  if (cached) return cached;
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });
  moneyCache.set(currency, fmt);
  return fmt;
};

export function formatMoney(
  amount: number | string,
  currency: Currency | string,
) {
  return money(currency).format(Number(amount));
}
