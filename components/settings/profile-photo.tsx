"use client";

import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { uploadProfilePhoto, removeProfilePhotoAction } from "@/app/(school)/settings/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialState = { status: "idle" as const };

export function ProfilePhoto({
  name,
  imageUrl,
}: {
  name: string | null;
  imageUrl: string | null;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [state, formAction] = useActionState(uploadProfilePhoto, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Updated");
      setFile(null);
    }
    if (state.status === "error") toast.error(state.message ?? "Failed");
  }, [state]);

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
        <CardTitle>Profile Photo</CardTitle>
        <CardDescription>Update your avatar across the dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <Avatar className="h-20 w-20">
            <AvatarImage src={previewUrl ?? imageUrl ?? undefined} alt={name ?? "Profile"} />
            <AvatarFallback>{name?.slice(0, 2).toUpperCase() ?? "ME"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{name ?? "Your profile"}</p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, or WEBP up to 2MB.
            </p>
          </div>
        </div>

        <form action={formAction} className="space-y-3">
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
            <Button type="submit" disabled={!file}>
              Upload Photo
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!imageUrl}
              onClick={async () => {
                const result = await removeProfilePhotoAction();
                if (result.status === "success") toast.success(result.message ?? "Removed");
                if (result.status === "error") toast.error(result.message ?? "Failed");
              }}
            >
              Remove Photo
            </Button>
          </div>
          {state.status === "error" ? (
            <p className="text-sm text-destructive" role="status">
              {state.message}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
