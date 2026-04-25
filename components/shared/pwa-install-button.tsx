"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneDisplayMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ((window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function PwaInstallButton() {
  const t = useTranslations("Common");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => isStandaloneDisplayMode());
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register("/push-sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
      } catch {
        // Ignore registration errors; install button can still work where supported.
      }
    };

    void registerServiceWorker();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const canShowInstallButton = useMemo(() => {
    return !isInstalled && deferredPrompt != null;
  }, [deferredPrompt, isInstalled]);

  const installApp = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setIsInstalling(false);
    setDeferredPrompt(null);
  };

  if (!canShowInstallButton) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[60]">
      <Button type="button" onClick={installApp} disabled={isInstalling} className="shadow-lg">
        <Download className="size-4" />
        {isInstalling ? t("installingApp") : t("installApp")}
      </Button>
    </div>
  );
}
