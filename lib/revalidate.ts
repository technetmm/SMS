import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";

export function revalidateLocalizedPath(pathname: string) {
  for (const locale of locales) {
    revalidatePath(`/${locale}${pathname}`);
  }
}
