"use client";

import React, {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { SectionActionState } from "@/app/(school)/school/sections/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";

const initialState: SectionActionState = { status: "idle" };

type Option = { id: string; name: string };

type SectionFormProps = {
  mode: "create" | "edit";
  action: (
    prevState: SectionActionState,
    formData: FormData,
  ) => Promise<SectionActionState>;
  classes: Option[];
  staff: Option[];
  initialData?: {
    id: string;
    name: string;
    classId: string;
    staffIds: string[];
    room: string | null;
    meetingLink: string | null;
    capacity: number;
  };
};

function uniqueById(items: Option[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

export function SectionForm({
  mode,
  action,
  classes,
  staff,
  initialData,
}: SectionFormProps) {
  const t = useTranslations("SchoolEntities.sections");
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    SectionActionState,
    FormData
  >(action, initialState);
  const staffAnchor = useComboboxAnchor();

  const initialClass = useMemo(
    () => classes.find((item) => item.id === initialData?.classId) ?? null,
    [classes, initialData?.classId],
  );
  const initialStaff = useMemo(
    () =>
      (initialData?.staffIds ?? [])
        .map((id) => staff.find((item) => item.id === id))
        .filter((item): item is Option => Boolean(item)),
    [initialData?.staffIds, staff],
  );

  const [selectedClass, setSelectedClass] = useState<Option | null>(
    initialClass,
  );
  const [selectedStaff, setSelectedStaff] = useState<Option[]>(initialStaff);

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
      toast.success(state.message ?? t("messages.saved"));
      router.push("/school/sections");
    }
    if (state.status === "error") {
      toast.error(state.message ?? t("messages.saveFailed"));
    }
  }, [router, state, t]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!selectedClass) {
      event.preventDefault();
      toast.error(t("messages.pleaseSelectClass"));
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      {mode === "edit" && initialData ? (
        <input type="hidden" name="id" value={initialData.id} />
      ) : null}
      <input type="hidden" name="classId" value={selectedClass?.id ?? ""} />
      {selectedStaff.map((staff) => (
        <input key={staff.id} type="hidden" name="staffIds" value={staff.id} />
      ))}

      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "create" ? t("create.title") : t("edit.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="name">{t("form.name")}</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initialData?.name ?? ""}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>{t("form.class")}</Label>
            <Combobox
              items={classes}
              value={selectedClass}
              onValueChange={(value: Option | null) => setSelectedClass(value)}
              itemToStringLabel={(item) => item?.name ?? ""}
            >
              <ComboboxInput placeholder={t("form.classPlaceholder")} />
              <ComboboxContent>
                <ComboboxEmpty>{t("form.noItemsFound")}</ComboboxEmpty>
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
            <Label>{t("form.teacherOptional")}</Label>
            <Combobox
              multiple
              autoHighlight
              items={staff}
              value={selectedStaff}
              onValueChange={(value: Array<Option>) =>
                setSelectedStaff(uniqueById(value))
              }
            >
              <ComboboxChips ref={staffAnchor} className="w-full">
                <ComboboxValue>
                  {(values) => (
                    <React.Fragment>
                      {values.map((value: Option) => (
                        <ComboboxChip key={value.id}>{value.name}</ComboboxChip>
                      ))}
                      <ComboboxChipsInput />
                    </React.Fragment>
                  )}
                </ComboboxValue>
              </ComboboxChips>
              <ComboboxContent anchor={staffAnchor}>
                <ComboboxEmpty>No items found.</ComboboxEmpty>
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
            <Label htmlFor="room">{t("form.room")}</Label>
            <Input
              id="room"
              name="room"
              defaultValue={initialData?.room ?? ""}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="meetingLink">{t("form.meetingLink")}</Label>
            <Input
              id="meetingLink"
              name="meetingLink"
              type="url"
              defaultValue={initialData?.meetingLink ?? ""}
              placeholder={t("form.meetingLinkPlaceholder")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="capacity">{t("form.capacity")}</Label>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              defaultValue={initialData?.capacity?.toString() || ""}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SubmitButton
          label={
            mode === "create"
              ? t("form.actions.create")
              : t("form.actions.save")
          }
          loadingLabel={
            mode === "create"
              ? t("form.actions.creating")
              : t("form.actions.saving")
          }
        />
      </div>
    </form>
  );
}
