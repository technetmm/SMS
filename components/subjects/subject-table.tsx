import {
  getPaginatedSubjects,
  type SubjectTableFilters,
} from "@/app/(school)/school/subjects/actions";
import { TablePagination } from "@/components/shared/table-pagination";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SubjectRowActions } from "@/components/subjects/subject-row-actions";
import { dateFormatter } from "@/lib/helper";

export async function SubjectTable({
  page,
  filters,
  searchParams,
}: {
  page: number;
  filters?: SubjectTableFilters;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const subjects = await getPaginatedSubjects({ page, filters });

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Courses</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subjects.items.map((subject) => (
            <TableRow key={subject.id}>
              <TableCell className="font-medium">{subject.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{subject._count.courses}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {dateFormatter.format(subject.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <SubjectRowActions id={subject.id} name={subject.name} />
              </TableCell>
            </TableRow>
          ))}
          {subjects.totalCount === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                No subjects yet. Create your first subject to organize courses.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      <TablePagination
        pagination={subjects}
        pathname="/school/subjects"
        searchParams={searchParams}
      />
    </div>
  );
}
