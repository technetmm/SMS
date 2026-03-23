import Link from "next/link";
import { getTeachers, deleteTeacher } from "@/app/(school)/teachers/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { enumLabel, TEACHER_STATUS_LABELS } from "@/lib/enum-labels";

export async function TeacherTable() {
  const teachers = await getTeachers();
  const formatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Hire Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teachers.map((teacher) => (
            <TableRow key={teacher.id}>
              <TableCell className="font-medium">{teacher.name}</TableCell>
              <TableCell>{teacher.email}</TableCell>
              <TableCell>{teacher.phone ?? "-"}</TableCell>
              <TableCell>
                <Badge
                  variant={teacher.status === "ACTIVE" ? "default" : "outline"}
                >
                  {enumLabel(teacher.status, TEACHER_STATUS_LABELS)}
                </Badge>
              </TableCell>
              <TableCell>{formatter.format(teacher.hireDate)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/teachers/${teacher.id}`}>View</Link>
                  </Button>
                  <Button asChild size="sm" variant="default">
                    <Link href={`/teachers/${teacher.id}/edit`}>Edit</Link>
                  </Button>
                  <form action={deleteTeacher}>
                    <input type="hidden" name="id" value={teacher.id} />
                    <Button size="sm" variant="destructive" type="submit">
                      Delete
                    </Button>
                  </form>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {teachers.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                No teachers yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
