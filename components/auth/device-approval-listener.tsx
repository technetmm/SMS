"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  isRealtimeStreamSupported,
  subscribeRealtimeSnapshots,
} from "@/lib/realtime/client";
import type { RealtimePendingDeviceApprovalRequest } from "@/lib/realtime/types";

const POLL_INTERVAL_MS = 3000;
const SEEN_APPROVER_REQUEST_IDS_STORAGE_KEY =
  "sms.seen-device-approval-request-ids";

type PendingRequest = RealtimePendingDeviceApprovalRequest;

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

const APPROVER_ROLES = new Set([
  "SUPER_ADMIN",
  "SCHOOL_SUPER_ADMIN",
  "SCHOOL_ADMIN",
]);

function readSeenApproverRequestIds() {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const raw = window.sessionStorage.getItem(
      SEEN_APPROVER_REQUEST_IDS_STORAGE_KEY,
    );
    if (!raw) return new Set<string>();

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set<string>();
  }
}

function saveSeenApproverRequestIds(seenRequestIds: Set<string>) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      SEEN_APPROVER_REQUEST_IDS_STORAGE_KEY,
      JSON.stringify([...seenRequestIds]),
    );
  } catch {
    // Ignore storage errors so polling still works.
  }
}

export function DeviceApprovalListener({ role }: { role: string }) {
  const [request, setRequest] = useState<PendingRequest | null>(null);
  const [loading, setLoading] = useState<"approve" | "deny" | null>(null);
  const seenApproverRequestIdsRef = useRef<Set<string> | null>(null);

  if (seenApproverRequestIdsRef.current === null) {
    seenApproverRequestIdsRef.current = readSeenApproverRequestIds();
  }

  const applyRequests = useCallback(
    (requests: PendingRequest[]) => {
      const canApproveOthers = APPROVER_ROLES.has(role);
      const next = requests.find((item) => !item.requester) ?? null;
      setRequest(next);

      if (!canApproveOthers) {
        return;
      }

      const approverRequests = requests.filter((item) => Boolean(item.requester));
      const incomingIds = new Set(approverRequests.map((item) => item.id));
      const updated = new Set(
        [...seenApproverRequestIdsRef.current!].filter((requestId) =>
          incomingIds.has(requestId),
        ),
      );

      for (const approvalRequest of approverRequests) {
        if (updated.has(approvalRequest.id)) {
          continue;
        }

        const name = approvalRequest.requester?.name?.trim() || "a user";
        toast(`New device approval request from ${name}.`);
        updated.add(approvalRequest.id);
      }

      seenApproverRequestIdsRef.current = updated;
      saveSeenApproverRequestIds(updated);
    },
    [role],
  );

  const fetchPending = useCallback(async () => {
    try {
      const canApproveOthers = APPROVER_ROLES.has(role);
      const url = canApproveOthers
        ? "/api/auth/device-approvals/pending"
        : "/api/auth/device-approvals/pending?scope=self";
      const res = await fetch(url, {
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) {
        setRequest(null);
        return;
      }

      const data = (await res.json()) as { requests?: PendingRequest[] };
      const requests = data.requests ?? [];
      applyRequests(requests);
    } catch {
      setRequest(null);
    }
  }, [applyRequests, role]);

  useEffect(() => {
    if (isRealtimeStreamSupported()) {
      return subscribeRealtimeSnapshots((snapshot) => {
        applyRequests(snapshot.pendingDeviceApprovals);
      });
    }

    let active = true;
    const tick = async () => {
      if (!active) return;
      await fetchPending();
    };

    void tick();
    const id = window.setInterval(() => {
      void tick();
    }, POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [applyRequests, fetchPending]);

  async function respond(action: "approve" | "deny") {
    if (!request || loading) return;
    setLoading(action);

    try {
      const res = await fetch("/api/auth/device-approvals/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ requestId: request.id, action }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        status?: string;
        error?: string;
      };

      if (!res.ok) {
        toast.error(data.error ?? "Unable to process login request.");
        setLoading(null);
        return;
      }

      if (action === "deny") {
        toast.success("Login request denied.");
        setRequest(null);
        setLoading(null);
        return;
      }

      toast.success("Login approved. This device will be signed out.");
      await signOut({ callbackUrl: "/login" });
    } catch {
      toast.error("Unable to process login request.");
      setLoading(null);
    }
  }

  return (
    <Dialog open={Boolean(request)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve New Device Login</DialogTitle>
          <DialogDescription>
            A new device is trying to sign in to your account.
          </DialogDescription>
        </DialogHeader>

        {request ? (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Requested at:</span>{" "}
              {formatWhen(request.createdAt)}
            </p>
            {request.requestedIp ? (
              <p>
                <span className="font-medium text-foreground">IP:</span>{" "}
                {request.requestedIp}
              </p>
            ) : null}
            {request.requestedUserAgent ? (
              <p className="line-clamp-2">
                <span className="font-medium text-foreground">Device:</span>{" "}
                {request.requestedUserAgent}
              </p>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            disabled={Boolean(loading)}
            onClick={() => void respond("deny")}
          >
            {loading === "deny" ? "Denying..." : "Deny"}
          </Button>
          <Button
            disabled={Boolean(loading)}
            onClick={() => void respond("approve")}
          >
            {loading === "approve" ? "Approving..." : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
