"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  enrollStudent,
  type EnrollmentActionState,
} from "@/app/(school)/school/enrollments/actions";
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
import { BillingType, Currency } from "@/app/generated/prisma/enums";
import { formatMoney } from "@/lib/helper";

const initialState: EnrollmentActionState = { status: "idle" };

type Option = { id: string; name: string };

export function EnrollmentCreateForm({
  currency,
  students,
  sections,
}: {
  currency: Currency;
  students: Option[];
  sections: Array<{
    id: string;
    name: string;
    capacity: number;
    enrolledCount: number;
    isFull: boolean;
    perStudentFee: string;
    billingType: BillingType;
  }>;
}) {
  const router = useRouter();
  const [todayLocal] = useState(() => {
    return new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 10);
  });
  const [state, formAction] = useActionState(enrollStudent, initialState);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [discountType, setDiscountType] = useState<"NONE" | "FIXED" | "PERCENT">("NONE");
  const [discountValue, setDiscountValue] = useState<string>("0");
  const selectedSection = useMemo(
    () => sections.find((section) => section.id === selectedSectionId) ?? null,
    [sections, selectedSectionId],
  );
  const isFixedDiscount = discountType === "FIXED";
  const isPercentDiscount = discountType === "PERCENT";
  const pricing = useMemo(() => {
    const originalAmount = Number(selectedSection?.perStudentFee ?? 0);
    const parsedDiscount = Number(discountValue || 0);
    const safeDiscountValue = Number.isFinite(parsedDiscount) ? Math.max(0, parsedDiscount) : 0;

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
      toast.success(state.message ?? "Enrollment created.");
      router.push("/school/enrollments");
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
            <Select name="sectionId" onValueChange={setSelectedSectionId}>
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
                    {section.name} ({section.enrolledCount} / {section.capacity}{" "}
                    seats, fee {formatMoney(Number(section.perStudentFee), currency)})
                    {section.isFull ? " - Section is full" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="enrolledAt">Enrollment Date</Label>
            <Input
              id="enrolledAt"
              name="enrolledAt"
              type="date"
              defaultValue={todayLocal}
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

          <div className="grid gap-2 md:col-span-2">
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
              defaultValue="NONE"
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
              defaultValue="0"
              placeholder="0"
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
        <SubmitButton label="Enroll Student" loadingLabel="Enrolling..." />
      </div>
    </form>
  );
}
