"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const { data } = useSession();
  const userName = data?.user?.name ?? data?.user?.email ?? "Account";

  return (
    <header className="flex items-center justify-between border-b bg-background px-6 py-4">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h2 className="text-lg font-semibold">{userName}</h2>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        Sign out
      </Button>
    </header>
  );
}
