"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  enrollStudent,
  type EnrollmentActionState,
} from "@/app/(school)/enrollments/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";

const initialState: EnrollmentActionState = { status: "idle" };

type Option = { id: string; name: string };

export function EnrollmentCreateForm({
  students,
  sections,
}: {
  students: Option[];
  sections: Array<{
    id: string;
    name: string;
    capacity: number;
    enrolledCount: number;
    isFull: boolean;
    perStudentFee: string;
  }>;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(enrollStudent, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Enrollment created.");
      router.push("/enrollments");
      router.refresh();
    }
    if (state.status === "error") {
      toast.error(state.message ?? "Unable to enroll student.");
    }
  }, [router, state]);

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enrollment Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="studentId">Student</Label>
            <Select name="studentId">
              <SelectTrigger id="studentId" className="w-full">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent position="popper">
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sectionId">Section</Label>
            <Select name="sectionId">
              <SelectTrigger id="sectionId" className="w-full">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent position="popper">
                {sections.map((section) => (
                  <SelectItem
                    key={section.id}
                    value={section.id}
                    disabled={section.isFull}
                  >
                    {section.name} ({section.enrolledCount} / {section.capacity} seats, fee $
                    {Number(section.perStudentFee).toFixed(2)})
                    {section.isFull ? " - Section is full" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Full sections are disabled.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="discountType">Discount Type</Label>
            <Select name="discountType" defaultValue="NONE">
              <SelectTrigger id="discountType" className="w-full">
                <SelectValue placeholder="Select discount type" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="NONE">None</SelectItem>
                <SelectItem value="FIXED">Fixed Amount</SelectItem>
                <SelectItem value="PERCENT">Percentage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="discountValue">Discount Value</Label>
            <Input
              id="discountValue"
              name="discountValue"
              type="number"
              min={0}
              step="0.01"
              defaultValue="0"
              placeholder="0"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SubmitButton label="Enroll Student" loadingLabel="Enrolling..." />
      </div>
    </form>
  );
}
