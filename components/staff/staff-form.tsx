"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createStaff,
  type StaffActionState,
} from "@/app/(school)/school/staff/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/shared/submit-button";

const initialState: StaffActionState = { status: "idle" };

export function StaffForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    StaffActionState,
    FormData
  >(createStaff, initialState);
  const lastHandledKeyRef = useRef<string>("");

  useEffect(() => {
    if (pending) {
      lastHandledKeyRef.current = "";
    }
  }, [pending]);

  useEffect(() => {
    if (state.status === "idle") return;

    const key = `${state.msgID}:${state.status}:${state.message ?? ""}`;
    if (lastHandledKeyRef.current === key) return;
    lastHandledKeyRef.current = key;

    if (state.status === "success") {
      toast.success(state.message ?? "Staff created");
      router.push("/school/staff");
    }

    if (state.status === "error") {
      toast.error(state.message ?? "Unable to create staff");
    }
  }, [router, state]);

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" placeholder="Staff name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nrcNumber">NRC number</Label>
            <Input
              id="nrcNumber"
              name="nrcNumber"
              placeholder="12/LaMaNa(N)123456"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dob">Date of birth</Label>
            <Input id="dob" name="dob" type="date" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="gender">Gender</Label>
            <Select name="gender" defaultValue="MALE">
              <SelectTrigger id="gender" className="w-full">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="maritalStatus">Marital status</Label>
            <Select name="maritalStatus" defaultValue="SINGLE">
              <SelectTrigger id="maritalStatus" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="SINGLE">Single</SelectItem>
                <SelectItem value="MARRIED">Married</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="parmentAddress">Permanent address</Label>
            <Textarea
              id="parmentAddress"
              name="parmentAddress"
              placeholder="Permanent address"
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="currentAddress">Current address</Label>
            <Textarea
              id="currentAddress"
              name="currentAddress"
              placeholder="Current address"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" placeholder="09xxxxxxxx" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job Info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="jobTitle">Job title</Label>
            <Input
              id="jobTitle"
              name="jobTitle"
              placeholder="Senior Staff"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hireDate">Hire date</Label>
            <Input id="hireDate" name="hireDate" type="date" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="exitDate">Exit date</Label>
            <Input id="exitDate" name="exitDate" type="date" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue="ACTIVE">
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ONLEAVE">On Leave</SelectItem>
                <SelectItem value="RESIGNED">Resigned</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ratePerHour">Rate per hour</Label>
            <Input
              id="ratePerHour"
              name="ratePerHour"
              type="number"
              min="0"
              step="0.01"
              placeholder="Optional (e.g. 25.00)"
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="remark">Remark</Label>
            <Textarea
              id="remark"
              name="remark"
              placeholder="Additional notes"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="password">Account password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <SubmitButton label="Create Staff" loadingLabel="Creating..." />
      </div>
      {state.status === "error" ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}
    </form>
  );
}
