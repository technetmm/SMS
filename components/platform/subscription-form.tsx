"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import {
  createSubscription,
  type PlatformActionState,
} from "@/app/(platform)/actions";
import { SubmitButton } from "@/components/shared/submit-button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "../ui/input";

type TenantOption = {
  id: string;
  name: string;
};

const initialState: PlatformActionState = { status: "idle" };

export function SubscriptionForm({ tenants }: { tenants: TenantOption[] }) {
  const [state, formAction] = useActionState(createSubscription, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Subscription created");
    }
    if (state.status === "error") {
      toast.error(state.message ?? "Unable to create subscription");
    }
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor="schoolId">Tenant</Label>
        <Select name="schoolId">
          <SelectTrigger id="schoolId" className="w-full">
            <SelectValue placeholder="Select tenant" />
          </SelectTrigger>
          <SelectContent position="popper">
            {tenants.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.id}>
                {tenant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="plan">Plan</Label>
        <Select name="plan" defaultValue="BASIC">
          <SelectTrigger id="plan" className="w-full">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="FREE">Free</SelectItem>
            <SelectItem value="BASIC">Basic</SelectItem>
            <SelectItem value="PREMIUM">Premium</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="status">Status</Label>
        <Select name="status" defaultValue="ACTIVE">
          <SelectTrigger id="status" className="w-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PAST_DUE">Past Due</SelectItem>
            <SelectItem value="CANCELED">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="currentPeriodEnd">Period end</Label>
        <Input
          id="currentPeriodEnd"
          name="currentPeriodEnd"
          type="date"
          required
        />
      </div>
      <div className="md:col-span-2">
        <SubmitButton label="Create Subscription" loadingLabel="Creating..." />
      </div>
    </form>
  );
}
