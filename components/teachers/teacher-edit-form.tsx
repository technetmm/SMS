"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateTeacher, type TeacherActionState } from "@/app/(dashboard)/teachers/actions";
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

type TeacherFormData = {
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

const initialState: TeacherActionState = { status: "idle" };

export function TeacherEditForm({ teacher }: { teacher: TeacherFormData }) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateTeacher, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Teacher updated");
      router.push(`/teachers/${teacher.id}`);
      router.refresh();
    }
    if (state.status === "error") {
      toast.error(state.message ?? "Unable to update teacher");
    }
  }, [router, state, teacher.id]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={teacher.id} />

      <Card>
        <CardHeader>
          <CardTitle>Personal Info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" defaultValue={teacher.name} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nrcNumber">NRC number</Label>
            <Input id="nrcNumber" name="nrcNumber" defaultValue={teacher.nrcNumber} required />
          </div>
          <DatePickerField name="dob" label="Date of birth" defaultValue={teacher.dob} />
          <div className="grid gap-2">
            <Label htmlFor="gender">Gender</Label>
            <Select name="gender" defaultValue={teacher.gender}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="maritalStatus">Marital status</Label>
            <Select name="maritalStatus" defaultValue={teacher.maritalStatus}>
              <SelectTrigger id="maritalStatus">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
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
              defaultValue={teacher.parmentAddress ?? ""}
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="currentAddress">Current address</Label>
            <Textarea
              id="currentAddress"
              name="currentAddress"
              defaultValue={teacher.currentAddress ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={teacher.phone ?? ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={teacher.email} required />
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
            <Input id="jobTitle" name="jobTitle" defaultValue={teacher.jobTitle} required />
          </div>
          <DatePickerField name="hireDate" label="Hire date" defaultValue={teacher.hireDate} />
          <DatePickerField name="exitDate" label="Exit date" defaultValue={teacher.exitDate ?? ""} />
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={teacher.status}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
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
              min="0.01"
              step="0.01"
              defaultValue={teacher.ratePerSection}
              required
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="remark">Remark</Label>
            <Textarea id="remark" name="remark" defaultValue={teacher.remark ?? ""} />
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
