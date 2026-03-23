"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClass, createSection } from "@/app/actions/classes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SubmitButton } from "@/components/shared/submit-button";
import type { ClassActionState } from "@/app/actions/classes";
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

type CourseOption = {
  id: string;
  name: string;
};

type TeacherOption = {
  id: string;
  name: string;
};

type ClassItem = {
  id: string;
  name: string;
  classType: string;
  programType: string;
  course: { name: string };
  sections: Array<{
    id: string;
    name: string;
    teacher: { user: { name: string | null } } | null;
  }>;
};

function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function ClassesView({
  courses,
  teachers,
  classes,
}: {
  courses: CourseOption[];
  teachers: TeacherOption[];
  classes: ClassItem[];
}) {
  const router = useRouter();
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [selectedSectionClass, setSelectedSectionClass] = useState<ClassItem | null>(null);
  const [selectedTeachers, setSelectedTeachers] = useState<TeacherOption[]>([]);
  const sectionClassAnchor = useComboboxAnchor();
  const sectionTeacherAnchor = useComboboxAnchor();
  const initialState: ClassActionState = { status: "idle" };
  const [classState, classFormAction] = useActionState(
    createClass,
    initialState,
  );
  const [sectionState, sectionFormAction] = useActionState(
    createSection,
    initialState,
  );

  useEffect(() => {
    if (classState.status === "success") {
      setClassDialogOpen(false);
      toast.success(classState.message ?? "Class created");
      router.refresh();
    }
    if (classState.status === "error") {
      toast.error(classState.message ?? "Unable to create class");
    }
  }, [classState, router]);

  useEffect(() => {
    if (sectionState.status === "success") {
      setSectionDialogOpen(false);
      setSelectedSectionClass(null);
      setSelectedTeachers([]);
      toast.success(sectionState.message ?? "Section created");
      router.refresh();
    }
    if (sectionState.status === "error") {
      toast.error(sectionState.message ?? "Unable to create section");
    }
  }, [sectionState, router]);

  useEffect(() => {
    if (!sectionDialogOpen) {
      setSelectedSectionClass(null);
      setSelectedTeachers([]);
    }
  }, [sectionDialogOpen]);

  function handleSectionSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!selectedSectionClass) {
      event.preventDefault();
      toast.error("Please select a class.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
          <DialogTrigger asChild>
            <Button>New Class</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-130">
            <DialogHeader>
              <DialogTitle>Create Class</DialogTitle>
            </DialogHeader>
            <form action={classFormAction} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="class-name">Class name</Label>
                <Input id="class-name" name="name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="course">Course</Label>
                <Select name="courseId">
                  <SelectTrigger id="course" className="w-full">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="classType">Class type</Label>
                <Select name="classType" defaultValue="GROUP">
                  <SelectTrigger id="classType" className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="ONE_ON_ONE">One-on-one</SelectItem>
                    <SelectItem value="PRIVATE">Private</SelectItem>
                    <SelectItem value="GROUP">Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="programType">Program type</Label>
                <Select name="programType" defaultValue="REGULAR">
                  <SelectTrigger id="programType" className="w-full">
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="REGULAR">Regular (2 days)</SelectItem>
                    <SelectItem value="INTENSIVE">
                      Intensive (4 days)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <SubmitButton label="Create class" />
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">New Section</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-130">
            <DialogHeader>
              <DialogTitle>Create Section</DialogTitle>
            </DialogHeader>
            <form action={sectionFormAction} onSubmit={handleSectionSubmit} className="space-y-4">
              <input type="hidden" name="classId" value={selectedSectionClass?.id ?? ""} />
              <input type="hidden" name="teacherId" value={selectedTeachers[0]?.id ?? ""} />
              {selectedTeachers.map((teacher) => (
                <input key={teacher.id} type="hidden" name="teacherIds" value={teacher.id} />
              ))}
              <div className="grid gap-2">
                <Label htmlFor="section-name">Section name</Label>
                <Input id="section-name" name="name" required />
              </div>
              <div className="grid gap-2">
                <Label>Class</Label>
                <Combobox
                  items={classes}
                  value={selectedSectionClass}
                  onValueChange={(value: ClassItem | null) => setSelectedSectionClass(value)}
                  itemToStringLabel={(item) => item?.name ?? ""}
                >
                  <ComboboxChips ref={sectionClassAnchor} className="w-full">
                    <ComboboxValue>
                      {(value) => (
                        <>
                          {value ? <ComboboxChip>{value.name}</ComboboxChip> : null}
                          <ComboboxChipsInput placeholder="Search class..." />
                        </>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent anchor={sectionClassAnchor}>
                    <ComboboxInput placeholder="Search class..." />
                    <ComboboxEmpty>No classes found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item: ClassItem) => (
                        <ComboboxItem key={item.id} value={item}>
                          {item.name}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
              <div className="grid gap-2">
                <Label>Teachers (Multiple)</Label>
                <Combobox
                  multiple
                  autoHighlight
                  items={teachers}
                  value={selectedTeachers}
                  onValueChange={(value: TeacherOption[]) =>
                    setSelectedTeachers(uniqueById(value))
                  }
                  itemToStringLabel={(item) => item?.name ?? ""}
                >
                  <ComboboxChips ref={sectionTeacherAnchor} className="w-full">
                    <ComboboxValue>
                      {(values) => (
                        <>
                          {values.map((value: TeacherOption) => (
                            <ComboboxChip key={value.id}>{value.name}</ComboboxChip>
                          ))}
                          <ComboboxChipsInput placeholder="Search teachers..." />
                        </>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent anchor={sectionTeacherAnchor}>
                    <ComboboxInput placeholder="Search teachers..." />
                    <ComboboxEmpty>No teachers found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item: TeacherOption) => (
                        <ComboboxItem key={item.id} value={item}>
                          {item.name}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                <p className="text-xs text-muted-foreground">
                  Multiple teachers can be selected. Current schema assigns the first selected
                  teacher to this section.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="room">Room</Label>
                <Input id="room" name="room" placeholder="Room A" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input id="capacity" name="capacity" type="number" min={1} />
              </div>
              <div className="flex justify-end">
                <SubmitButton label="Create section" />
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Sections</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.course.name}</TableCell>
                <TableCell>{item.classType.replace(/_/g, " ")}</TableCell>
                <TableCell>{item.programType.replace(/_/g, " ")}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {item.sections.length === 0 ? (
                      <span className="text-sm text-muted-foreground">
                        No sections yet
                      </span>
                    ) : (
                      item.sections.map((section) => (
                        <span key={section.id} className="text-sm">
                          {section.name} ·{" "}
                          {section.teacher?.user.name ?? "Unassigned"}
                        </span>
                      ))
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
