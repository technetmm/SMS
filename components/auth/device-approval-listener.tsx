"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type PendingRequest = {
  id: string;
  createdAt: string;
  expiresAt: string;
  requestedIp: string | null;
  requestedUserAgent: string | null;
};

const POLL_INTERVAL_MS = 3000;

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function DeviceApprovalListener() {
  const [request, setRequest] = useState<PendingRequest | null>(null);
  const [loading, setLoading] = useState<"approve" | "deny" | null>(null);

  const expiresLabel = useMemo(
    () => (request ? formatWhen(request.expiresAt) : null),
    [request],
  );

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/device-approvals/pending", {
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) {
        setRequest(null);
        return;
      }

      const data = (await res.json()) as { requests?: PendingRequest[] };
      const next = data.requests?.[0] ?? null;
      setRequest(next);
    } catch {
      setRequest(null);
    }
  }, []);

  useEffect(() => {
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
  }, [fetchPending]);

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

      console.log("Device approval response:", {
        status: data.status,
        error: data.error,
      });

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
            <p>
              <span className="font-medium text-foreground">Expires at:</span>{" "}
              {expiresLabel}
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
