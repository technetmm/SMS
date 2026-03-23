import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerAuth } from "@/auth";
import { ProfilePhoto } from "@/components/settings/profile-photo";

export default async function ProfilePhotoPage() {
  const session = await getServerAuth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, image: true },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Profile
        </p>
        <h2 className="text-2xl font-semibold">Profile Photo</h2>
        <p className="text-sm text-muted-foreground">
          Upload or remove your profile image.
        </p>
      </div>
      <ProfilePhoto name={user.name} imageUrl={user.image} />
    </div>
  );
}
