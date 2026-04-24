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
import { enumLabel } from "@/lib/enum-labels";
import type { DeviceApprovalQueueRow } from "@/lib/auth/device-approval-queue";

function formatWhen(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

type DeviceApprovalTableMessages = {
  errors: {
    unableToProcess: string;
  };
  success: {
    approved: string;
    denied: string;
  };
  columns: {
    requester: string;
    role: string;
    school: string;
    requested: string;
    expires: string;
    deviceIp: string;
    status: string;
    actions: string;
  };
  roleLabels: {
    superAdmin: string;
    schoolSuperAdmin: string;
    schoolAdmin: string;
    teacher: string;
    student: string;
  };
  fallbacks: {
    unnamedUser: string;
    notAvailable: string;
  };
  actions: {
    deny: string;
    denying: string;
    approve: string;
    approving: string;
  };
  empty: string;
};

const defaultMessages: DeviceApprovalTableMessages = {
  errors: {
    unableToProcess: "Unable to process login request.",
  },
  success: {
    approved: "Login request approved.",
    denied: "Login request denied.",
  },
  columns: {
    requester: "Requester",
    role: "Role",
    school: "School",
    requested: "Requested",
    expires: "Expires",
    deviceIp: "Device / IP",
    status: "Status",
    actions: "Actions",
  },
  roleLabels: {
    superAdmin: "Super Admin",
    schoolSuperAdmin: "School Owner",
    schoolAdmin: "Admin",
    teacher: "Teacher",
    student: "Student",
  },
  fallbacks: {
    unnamedUser: "Unnamed user",
    notAvailable: "-",
  },
  actions: {
    deny: "Deny",
    denying: "Denying...",
    approve: "Approve",
    approving: "Approving...",
  },
  empty: "No pending device approval requests.",
};

export function DeviceApprovalTable({
  initialRequests,
  showSchool = false,
  locale = "en-US",
  messages = defaultMessages,
}: {
  initialRequests: DeviceApprovalQueueRow[];
  showSchool?: boolean;
  locale?: string;
  messages?: DeviceApprovalTableMessages;
}) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [loading, setLoading] = useState<{
    requestId: string;
    action: "approve" | "deny";
  } | null>(null);

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: messages.roleLabels.superAdmin,
    SCHOOL_SUPER_ADMIN: messages.roleLabels.schoolSuperAdmin,
    SCHOOL_ADMIN: messages.roleLabels.schoolAdmin,
    TEACHER: messages.roleLabels.teacher,
    STUDENT: messages.roleLabels.student,
  };

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
        toast.error(payload.error ?? messages.errors.unableToProcess);
        setLoading(null);
        router.refresh();
        return;
      }

      setRequests((current) => current.filter((request) => request.id !== requestId));
      toast.success(
        action === "approve"
          ? messages.success.approved
          : messages.success.denied,
      );
      setLoading(null);
      router.refresh();
    } catch {
      toast.error(messages.errors.unableToProcess);
      setLoading(null);
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{messages.columns.requester}</TableHead>
          <TableHead>{messages.columns.role}</TableHead>
          {showSchool ? <TableHead>{messages.columns.school}</TableHead> : null}
          <TableHead>{messages.columns.requested}</TableHead>
          <TableHead>{messages.columns.expires}</TableHead>
          <TableHead>{messages.columns.deviceIp}</TableHead>
          <TableHead>{messages.columns.status}</TableHead>
          <TableHead className="text-right">{messages.columns.actions}</TableHead>
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
                    {request.requester.name ?? messages.fallbacks.unnamedUser}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {request.requester.email}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {enumLabel(request.requester.role, roleLabels)}
              </TableCell>
              {showSchool ? (
                <TableCell>
                  {request.requester.schoolName ?? messages.fallbacks.notAvailable}
                </TableCell>
              ) : null}
              <TableCell>{formatWhen(request.createdAt, locale)}</TableCell>
              <TableCell>{formatWhen(request.expiresAt, locale)}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="max-w-xs truncate text-sm">
                    {request.requestedUserAgent ?? messages.fallbacks.notAvailable}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {request.requestedIp ?? messages.fallbacks.notAvailable}
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
                    {isBusy && loading?.action === "deny"
                      ? messages.actions.denying
                      : messages.actions.deny}
                  </Button>
                  <Button
                    size="sm"
                    disabled={Boolean(isBusy)}
                    onClick={() => void handleAction(request.id, "approve")}
                  >
                    {isBusy && loading?.action === "approve"
                      ? messages.actions.approving
                      : messages.actions.approve}
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
              {messages.empty}
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}
