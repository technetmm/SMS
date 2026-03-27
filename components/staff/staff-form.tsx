"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createStaff,
  type StaffActionState,
} from "@/app/(school)/staff/actions";
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
import { DatePickerField } from "@/components/shared/date-picker-field";

const initialState: StaffActionState = { status: "idle" };

export function StaffForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(createStaff, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Staff created");
      router.push("/staff");
      router.refresh();
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
              placeholder="12/LAMANA(N)123456"
              required
            />
          </div>
          <DatePickerField name="dob" label="Date of birth" />
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
          <DatePickerField name="hireDate" label="Hire date" />
          <DatePickerField name="exitDate" label="Exit date" />
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
            <Label htmlFor="ratePerSection">Rate per section</Label>
            <Input
              id="ratePerSection"
              name="ratePerSection"
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
