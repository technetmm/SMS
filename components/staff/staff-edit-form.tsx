"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  updateStaff,
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

type StaffFormData = {
  id: string;
  name: string;
  jobTitle: string;
  nrcNumber: string;
  dob: string;
  email: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  maritalStatus: "SINGLE" | "MARRIED";
  parmentAddress?: string | null;
  currentAddress?: string | null;
  phone?: string | null;
  hireDate: string;
  exitDate?: string | null;
  status: "ACTIVE" | "ONLEAVE" | "RESIGNED" | "TERMINATED";
  ratePerSection: string;
  remark?: string | null;
};

const initialState: StaffActionState = { status: "idle" };

export function StaffEditForm({ staff }: { staff: StaffFormData }) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateStaff, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Staff updated");
      router.push(`/school/staff/${staff.id}`);
      router.refresh();
    }
    if (state.status === "error") {
      toast.error(state.message ?? "Unable to update staff");
    }
  }, [router, state, staff.id]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={staff.id} />

      <Card>
        <CardHeader>
          <CardTitle>Personal Info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" defaultValue={staff.name} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nrcNumber">NRC number</Label>
            <Input
              id="nrcNumber"
              name="nrcNumber"
              defaultValue={staff.nrcNumber}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dob">Date of birth</Label>
            <Input
              id="dob"
              name="dob"
              type="date"
              defaultValue={staff.dob}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gender">Gender</Label>
            <Select name="gender" defaultValue={staff.gender}>
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
            <Select name="maritalStatus" defaultValue={staff.maritalStatus}>
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
              defaultValue={staff.parmentAddress ?? ""}
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="currentAddress">Current address</Label>
            <Textarea
              id="currentAddress"
              name="currentAddress"
              defaultValue={staff.currentAddress ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={staff.phone ?? ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={staff.email}
              required
            />
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
              defaultValue={staff.jobTitle}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hireDate">Hire date</Label>
            <Input
              id="hireDate"
              name="hireDate"
              type="date"
              defaultValue={staff.hireDate}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="exitDate">Exit date</Label>
            <Input
              id="exitDate"
              name="exitDate"
              type="date"
              defaultValue={staff.exitDate ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={staff.status}>
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
              defaultValue={staff.ratePerSection}
              placeholder="Optional (e.g. 25.00)"
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="remark">Remark</Label>
            <Textarea
              id="remark"
              name="remark"
              defaultValue={staff.remark ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <SubmitButton label="Save Changes" loadingLabel="Saving..." />
      </div>
      {state.status === "error" ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}
    </form>
  );
}
