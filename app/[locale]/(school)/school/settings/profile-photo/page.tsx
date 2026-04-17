import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getServerAuth } from "@/auth";
import { ProfilePhoto } from "@/components/settings/profile-photo";
import { redirect } from "@/i18n/navigation";

export default async function ProfilePhotoPage() {
  const locale = await getLocale();
  const t = await getTranslations("SettingsPages.profilePhoto");
  const session = await getServerAuth();
  const sessionUser = session?.user;
  if (!sessionUser?.id) {
    redirect({ href: "/login", locale });
  }
  const verifiedSessionUser = sessionUser!;

  const user = await prisma.user.findUnique({
    where: { id: verifiedSessionUser.id },
    select: { name: true, image: true },
  });

  if (!user) {
    redirect({ href: "/login", locale });
  }
  const currentUser = user!;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("eyebrow")}
        </p>
        <h2 className="text-2xl font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <ProfilePhoto name={currentUser.name} imageUrl={currentUser.image} />
    </div>
  );
}
