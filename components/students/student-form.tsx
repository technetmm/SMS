"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createStudent,
  updateStudent,
  type StudentActionState,
} from "@/app/(school)/school/students/actions";
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

type StudentFormData = {
  id?: string;
  name: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dob: string;
  admissionDate: string;
  fatherName?: string | null;
  motherName?: string | null;
  phone?: string | null;
  address?: string | null;
  status: "ACTIVE" | "INACTIVE" | "GRADUATED";
};

const initialState: StudentActionState = { status: "idle" };

export function StudentForm({
  mode,
  initialData,
}: {
  mode: "create" | "edit";
  initialData?: StudentFormData;
}) {
  const router = useRouter();
  const action = mode === "create" ? createStudent : updateStudent;
  const [state, formAction] = useActionState(action, initialState);
  const [createAccount, setCreateAccount] = useState(false);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Student saved");
      router.push("/school/students");
      router.refresh();
    }
    if (state.status === "error") {
      toast.error(state.message ?? "Unable to save student");
    }
  }, [router, state]);

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && initialData?.id ? (
        <input type="hidden" name="id" value={initialData.id} />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Personal Info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initialData?.name}
              placeholder="Student name"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gender">Gender</Label>
            <Select name="gender" defaultValue={initialData?.gender ?? "MALE"}>
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
          <div className="grid gap-2">
            <Label htmlFor="dob">Date of birth</Label>
            <Input
              id="dob"
              name="dob"
              type="date"
              defaultValue={initialData?.dob}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="admissionDate">Admission Date</Label>
            <Input
              id="admissionDate"
              name="admissionDate"
              type="date"
              defaultValue={initialData?.admissionDate}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parent Info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="fatherName">Father name</Label>
            <Input
              id="fatherName"
              name="fatherName"
              placeholder="Father name"
              defaultValue={initialData?.fatherName ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="motherName">Mother name</Label>
            <Input
              id="motherName"
              name="motherName"
              placeholder="Mother name"
              defaultValue={initialData?.motherName ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={initialData?.phone ?? ""}
              placeholder="09xxxxxxxx"
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              placeholder="Address"
              defaultValue={initialData?.address ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              name="status"
              defaultValue={initialData?.status ?? "ACTIVE"}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="GRADUATED">Graduated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {mode === "create" ? (
        <Card>
          <CardHeader>
            <CardTitle>Account (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="createAccount"
                checked={createAccount}
                onChange={(event) => setCreateAccount(event.target.checked)}
              />
              Create a linked user account
            </label>

            {createAccount ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" />
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <SubmitButton
          label={mode === "create" ? "Create Student" : "Save Changes"}
          loadingLabel={mode === "create" ? "Creating..." : "Saving..."}
        />
      </div>
      {state.status === "error" ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}
    </form>
  );
}
