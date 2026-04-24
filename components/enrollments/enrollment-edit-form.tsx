"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  type EnrollmentActionState,
  updateEnrollmentDetails,
} from "@/app/(school)/school/enrollments/actions";
import {
  BillingType,
  Currency,
  EnrollmentStatus,
} from "@/app/generated/prisma/enums";
import { SubmitButton } from "@/components/shared/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/helper";

const initialState: EnrollmentActionState = { status: "idle" };

type Option = { id: string; name: string };
type SectionOption = {
  id: string;
  name: string;
  capacity: number;
  enrolledCount: number;
  isFull: boolean;
  perStudentFee: string;
  billingType: BillingType;
};

export function EnrollmentEditForm({
  currency,
  enrollment,
  students,
  sections,
}: {
  currency: Currency;
  enrollment: {
    id: string;
    sectionId: string;
    enrolledAt: Date;
    status: EnrollmentStatus;
    discountType: "NONE" | "FIXED" | "PERCENT";
    discountValue: string;
    student: { id: string; name: string };
  };
  students: Option[];
  sections: SectionOption[];
}) {
  const router = useRouter();
  const studentAnchor = useComboboxAnchor();
  const sectionAnchor = useComboboxAnchor();
  const [state, formAction] = useActionState(
    updateEnrollmentDetails,
    initialState,
  );
  const initialStudent = useMemo(
    () =>
      students.find((student) => student.id === enrollment.student.id) ??
      enrollment.student,
    [enrollment.student, students],
  );
  const initialSection = useMemo(
    () =>
      sections.find((section) => section.id === enrollment.sectionId) ?? null,
    [enrollment.sectionId, sections],
  );
  const [selectedStudent, setSelectedStudent] = useState<Option | null>(
    initialStudent,
  );
  const [selectedSection, setSelectedSection] = useState<SectionOption | null>(
    initialSection,
  );
  const [discountType, setDiscountType] = useState<
    "NONE" | "FIXED" | "PERCENT"
  >(enrollment.discountType);
  const [discountValue, setDiscountValue] = useState(enrollment.discountValue);

  const enrolledAtLocal = useMemo(() => {
    const offsetDate = new Date(
      enrollment.enrolledAt.getTime() -
        enrollment.enrolledAt.getTimezoneOffset() * 60_000,
    );
    return offsetDate.toISOString().slice(0, 10);
  }, [enrollment.enrolledAt]);

  const isFixedDiscount = discountType === "FIXED";
  const isPercentDiscount = discountType === "PERCENT";

  const pricing = useMemo(() => {
    const originalAmount = Number(selectedSection?.perStudentFee ?? 0);
    const parsedDiscount = Number(discountValue || 0);
    const safeDiscountValue = Number.isFinite(parsedDiscount)
      ? Math.max(0, parsedDiscount)
      : 0;

    const discountAmount =
      discountType === "PERCENT"
        ? (originalAmount * safeDiscountValue) / 100
        : discountType === "FIXED"
          ? safeDiscountValue
          : 0;

    const cappedDiscount = Math.min(originalAmount, discountAmount);
    const totalAmount = Math.max(0, originalAmount - cappedDiscount);

    return { originalAmount, discountAmount: cappedDiscount, totalAmount };
  }, [discountType, discountValue, selectedSection]);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Enrollment updated.");
      router.push("/school/enrollments");
      router.refresh();
    }

    if (state.status === "error") {
      toast.error(state.message ?? "Unable to update enrollment.");
    }
  }, [router, state]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!selectedStudent) {
      event.preventDefault();
      toast.error("Please select a student.");
      return;
    }

    if (!selectedSection) {
      event.preventDefault();
      toast.error("Please select a section.");
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="id" value={enrollment.id} />
      <input type="hidden" name="studentId" value={selectedStudent?.id ?? ""} />
      <input type="hidden" name="sectionId" value={selectedSection?.id ?? ""} />

      <Card>
        <CardHeader>
          <CardTitle>Enrollment Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Student</Label>
            <Combobox
              items={students}
              value={selectedStudent}
              onValueChange={(value: Option | null) =>
                setSelectedStudent(value)
              }
              itemToStringLabel={(item) => item?.name ?? ""}
            >
              <ComboboxInput placeholder="Search student..." />
              <ComboboxContent anchor={studentAnchor}>
                <ComboboxEmpty>No students found.</ComboboxEmpty>
                <ComboboxList>
                  {(item: Option) => (
                    <ComboboxItem key={item.id} value={item}>
                      {item.name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={enrollment.status}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="DROPPED">Dropped</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Section</Label>
            <Combobox
              items={sections}
              value={selectedSection}
              onValueChange={(value: SectionOption | null) =>
                setSelectedSection(value)
              }
              itemToStringLabel={(item) => item?.name ?? ""}
            >
              <ComboboxInput placeholder="Search section..." />
              <ComboboxContent anchor={sectionAnchor}>
                <ComboboxEmpty>No sections found.</ComboboxEmpty>
                <ComboboxList>
                  {(item: SectionOption) => (
                    <ComboboxItem
                      key={item.id}
                      value={item}
                      disabled={item.isFull && item.id !== enrollment.sectionId}
                    >
                      {item.name} ({item.enrolledCount} / {item.capacity} seats,
                      fee {formatMoney(Number(item.perStudentFee), currency)})
                      {item.isFull && item.id !== enrollment.sectionId
                        ? " - Section is full"
                        : ""}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="enrolledAt">Enrollment Date</Label>
            <Input
              id="enrolledAt"
              name="enrolledAt"
              type="date"
              defaultValue={enrolledAtLocal}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="billingType">Billing Type</Label>
            <Input
              id="billingType"
              value={
                selectedSection
                  ? selectedSection.billingType === BillingType.MONTHLY
                    ? "Monthly (inherited from class)"
                    : "One-time (inherited from class)"
                  : "Select section to view billing type"
              }
              readOnly
              className="bg-muted/40"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sectionFee">Section Fee ({currency})</Label>
            <Input
              id="sectionFee"
              value={
                selectedSection
                  ? formatMoney(pricing.originalAmount, currency)
                  : `Select section to view fee in ${currency}`
              }
              readOnly
              className="bg-muted/40"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="discountType">Discount Type</Label>
            <Select
              name="discountType"
              defaultValue={enrollment.discountType}
              onValueChange={(value) =>
                setDiscountType(value as "NONE" | "FIXED" | "PERCENT")
              }
            >
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
            <Label htmlFor="discountValue">
              {isFixedDiscount
                ? `Discount Value (${currency})`
                : isPercentDiscount
                  ? "Discount Value (%)"
                  : "Discount Value"}
            </Label>
            <Input
              id="discountValue"
              name="discountValue"
              type="number"
              min={0}
              step="0.01"
              defaultValue={enrollment.discountValue}
              onChange={(event) => setDiscountValue(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {isFixedDiscount
                ? `Enter the discount amount in ${currency}.`
                : isPercentDiscount
                  ? "Enter the discount percentage."
                  : `Discounts use the school's default currency (${currency}) when fixed amount is selected.`}
            </p>
          </div>

          <div className="md:col-span-2 rounded-lg border bg-muted/30 p-3">
            <p className="text-sm">
              <span className="text-muted-foreground">Original fee: </span>
              {formatMoney(pricing.originalAmount, currency)}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Discount: </span>
              {formatMoney(pricing.discountAmount, currency)}
            </p>
            <p className="text-sm font-semibold">
              <span className="text-muted-foreground">Total amount: </span>
              {formatMoney(pricing.totalAmount, currency)}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SubmitButton label="Update Enrollment" loadingLabel="Updating..." />
      </div>
    </form>
  );
}
