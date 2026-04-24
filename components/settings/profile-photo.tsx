"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { uploadProfilePhoto, removeProfilePhotoAction } from "@/app/(school)/school/settings/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ProfilePhoto({
  name,
  imageUrl,
}: {
  name: string | null;
  imageUrl: string | null;
}) {
  const t = useTranslations("SettingsProfilePhoto");
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={previewUrl ?? imageUrl ?? undefined}
              alt={name ?? t("altProfile")}
            />
            <AvatarFallback>{name?.slice(0, 2).toUpperCase() ?? "ME"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{name ?? t("yourProfile")}</p>
            <p className="text-xs text-muted-foreground">
              {t("fileHelp")}
            </p>
          </div>
        </div>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!file) return;
            const formData = new FormData();
            formData.set("photo", file);
            startTransition(async () => {
              const result = await uploadProfilePhoto({ status: "idle" }, formData);
              if (result.status === "success") {
                toast.success(result.message ?? t("messages.updated"));
                setError(null);
                setFile(null);
                return;
              }
              setError(result.message ?? t("messages.failed"));
              toast.error(result.message ?? t("messages.failed"));
            });
          }}
        >
          <Input
            type="file"
            name="photo"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              setFile(selected);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!file || pending}>
              {t("buttons.upload")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!imageUrl || pending}
              onClick={async () => {
                const result = await removeProfilePhotoAction();
                if (result.status === "success") {
                  toast.success(result.message ?? t("messages.removed"));
                }
                if (result.status === "error") {
                  toast.error(result.message ?? t("messages.failed"));
                }
              }}
            >
              {t("buttons.remove")}
            </Button>
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="status">
              {error}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
