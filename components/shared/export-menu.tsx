"use client";

import { useTransition } from "react";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ExportAction = () => Promise<{
  status: "success" | "error" | "idle";
  url?: string;
  message?: string;
}>;

export function ExportMenu({
  items,
}: {
  items: Array<{ label: string; action: ExportAction }>;
}) {
  const [pending, startTransition] = useTransition();

  const runExport = (action: ExportAction) => {
    startTransition(async () => {
      const result = await action();
      if (result.status === "error") {
        toast.error(result.message ?? "Export failed");
        return;
      }
      if (result.status === "idle") {
        return;
      }
      if (result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      }
      toast.success("Export completed");
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={pending}>
          <FileDown className="h-4 w-4" />
          {pending ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.label}
            onClick={() => runExport(item.action)}
            className="cursor-pointer"
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
