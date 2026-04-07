"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { enumLabel, USER_ROLE_LABELS } from "@/lib/enum-labels";
import type { DeviceApprovalQueueRow } from "@/lib/auth/device-approval-queue";

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function DeviceApprovalTable({
  initialRequests,
  showSchool = false,
}: {
  initialRequests: DeviceApprovalQueueRow[];
  showSchool?: boolean;
}) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [loading, setLoading] = useState<{
    requestId: string;
    action: "approve" | "deny";
  } | null>(null);

  async function handleAction(requestId: string, action: "approve" | "deny") {
    if (loading) return;

    setLoading({ requestId, action });

    try {
      const response = await fetch("/api/auth/device-approvals/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ requestId, action }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        toast.error(payload.error ?? "Unable to process login request.");
        setLoading(null);
        router.refresh();
        return;
      }

      setRequests((current) => current.filter((request) => request.id !== requestId));
      toast.success(
        action === "approve"
          ? "Login request approved."
          : "Login request denied.",
      );
      setLoading(null);
      router.refresh();
    } catch {
      toast.error("Unable to process login request.");
      setLoading(null);
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Requester</TableHead>
          <TableHead>Role</TableHead>
          {showSchool ? <TableHead>School</TableHead> : null}
          <TableHead>Requested</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead>Device / IP</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => {
          const isBusy = loading?.requestId === request.id;

          return (
            <TableRow key={request.id}>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">
                    {request.requester.name ?? "Unnamed user"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {request.requester.email}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {enumLabel(request.requester.role, USER_ROLE_LABELS)}
              </TableCell>
              {showSchool ? (
                <TableCell>{request.requester.schoolName ?? "-"}</TableCell>
              ) : null}
              <TableCell>{formatWhen(request.createdAt)}</TableCell>
              <TableCell>{formatWhen(request.expiresAt)}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="max-w-xs truncate text-sm">
                    {request.requestedUserAgent ?? "-"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {request.requestedIp ?? "-"}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{request.status}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={Boolean(isBusy)}
                    onClick={() => void handleAction(request.id, "deny")}
                  >
                    {isBusy && loading?.action === "deny" ? "Denying..." : "Deny"}
                  </Button>
                  <Button
                    size="sm"
                    disabled={Boolean(isBusy)}
                    onClick={() => void handleAction(request.id, "approve")}
                  >
                    {isBusy && loading?.action === "approve"
                      ? "Approving..."
                      : "Approve"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
        {requests.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={showSchool ? 8 : 7}
              className="py-10 text-center text-sm text-muted-foreground"
            >
              No pending device approval requests.
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}
