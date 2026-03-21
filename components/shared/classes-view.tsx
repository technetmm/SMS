"use client";

import { createClass, createSection } from "@/app/actions/classes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SubmitButton } from "@/components/shared/submit-button";

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

export function ClassesView({
  courses,
  teachers,
  classes,
}: {
  courses: CourseOption[];
  teachers: TeacherOption[];
  classes: ClassItem[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button>New Class</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Create Class</DialogTitle>
            </DialogHeader>
            <form action={createClass} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="class-name">Class name</Label>
                <Input id="class-name" name="name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="course">Course</Label>
                <Select name="courseId">
                  <SelectTrigger id="course">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
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
                  <SelectTrigger id="classType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONE_ON_ONE">One-on-one</SelectItem>
                    <SelectItem value="PRIVATE">Private</SelectItem>
                    <SelectItem value="GROUP">Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="programType">Program type</Label>
                <Select name="programType" defaultValue="REGULAR">
                  <SelectTrigger id="programType">
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REGULAR">Regular (2 days)</SelectItem>
                    <SelectItem value="INTENSIVE">Intensive (4 days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <SubmitButton label="Create class" />
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">New Section</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Create Section</DialogTitle>
            </DialogHeader>
            <form action={createSection} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="section-name">Section name</Label>
                <Input id="section-name" name="name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="section-class">Class</Label>
                <Select name="classId">
                  <SelectTrigger id="section-class">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="section-teacher">Teacher</Label>
                <Select name="teacherId">
                  <SelectTrigger id="section-teacher">
                    <SelectValue placeholder="Assign teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                          {section.name} · {section.teacher?.user.name ?? "Unassigned"}
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
