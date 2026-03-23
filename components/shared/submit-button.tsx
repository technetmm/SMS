"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function SubmitButton({
  label,
  loadingLabel,
}: {
  label: string;
  loadingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? loadingLabel ?? "Saving..." : label}
    </Button>
  );
}
