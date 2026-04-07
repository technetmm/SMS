import Link from "next/link";
import { getPaginatedStudents } from "@/app/(school)/school/students/actions";
import { TablePagination } from "@/components/shared/table-pagination";
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
import { StudentRowActions } from "@/components/students/student-row-actions";
import {
  enumLabel,
  GENDER_LABELS,
  STUDENT_STATUS_LABELS,
} from "@/lib/enum-labels";
import { StudentStatus } from "@/app/generated/prisma/enums";

export async function StudentTable({
  page,
  query,
  status,
  searchParams,
}: {
  page: number;
  query?: string;
  status?: StudentStatus | "ALL";
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const students = await getPaginatedStudents({ page, query, status });
  const formatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Admission Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.items.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">{student.name}</TableCell>
              <TableCell>{enumLabel(student.gender, GENDER_LABELS)}</TableCell>
              <TableCell>{student.phone ?? "-"}</TableCell>
              <TableCell>
                <Badge
                  variant={student.status === "ACTIVE" ? "default" : "outline"}
                >
                  {enumLabel(student.status, STUDENT_STATUS_LABELS)}
                </Badge>
              </TableCell>
              <TableCell>{formatter.format(student.admissionDate)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/school/students/${student.id}`}>View</Link>
                  </Button>
                  <Button asChild size="sm" variant="default">
                    <Link href={`/school/students/${student.id}/edit`}>Edit</Link>
                  </Button>
                  <StudentRowActions id={student.id} name={student.name} />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {students.totalCount === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                No students found.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      <TablePagination
        pagination={students}
        pathname="/school/students"
        searchParams={searchParams}
      />
    </div>
  );
}
