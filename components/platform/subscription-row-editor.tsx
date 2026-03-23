"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  cancelSubscription,
  type PlatformActionState,
  updateSubscription,
} from "@/app/(platform)/actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: PlatformActionState = { status: "idle" };

export function SubscriptionRowEditor({
  subscription,
}: {
  subscription: {
    id: string;
    plan: "FREE" | "BASIC" | "PREMIUM";
    status: "ACTIVE" | "PAST_DUE" | "CANCELED";
    currentPeriodEnd: Date;
  };
}) {
  const [state, formAction] = useActionState(updateSubscription, initialState);

  useEffect(() => {
    if (state.status === "success")
      toast.success(state.message ?? "Subscription updated");
    if (state.status === "error")
      toast.error(state.message ?? "Failed to update subscription");
  }, [state]);

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <form
        action={formAction}
        className="flex flex-wrap items-center justify-end gap-2"
      >
        <input type="hidden" name="id" value={subscription.id} />
        <Select name="plan" defaultValue={subscription.plan}>
          <SelectTrigger className="h-8 w-27.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="FREE">Free</SelectItem>
            <SelectItem value="BASIC">Basic</SelectItem>
            <SelectItem value="PREMIUM">Premium</SelectItem>
          </SelectContent>
        </Select>
        <Select name="status" defaultValue={subscription.status}>
          <SelectTrigger className="h-8 w-30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PAST_DUE">Past Due</SelectItem>
            <SelectItem value="CANCELED">Canceled</SelectItem>
          </SelectContent>
        </Select>
        <input
          className="h-8 rounded-md border bg-background px-2 text-xs"
          type="date"
          name="currentPeriodEnd"
          defaultValue={subscription.currentPeriodEnd
            .toISOString()
            .slice(0, 10)}
        />
        <Button type="submit" size="sm" variant="outline">
          Save
        </Button>
      </form>
      <form action={cancelSubscription}>
        <input type="hidden" name="id" value={subscription.id} />
        <Button
          type="submit"
          size="sm"
          variant="destructive"
          disabled={subscription.status === "CANCELED"}
        >
          Cancel
        </Button>
      </form>
    </div>
  );
}
