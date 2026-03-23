import { getCourses } from "@/app/(school)/courses/actions";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CourseRowActions } from "@/components/courses/course-row-actions";

export async function CourseTable() {
  const courses = await getCourses();
  const formatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Classes</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.id}>
              <TableCell className="font-medium">{course.name}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {course.subjects.length === 0 ? (
                    <span className="text-sm text-muted-foreground">-</span>
                  ) : (
                    course.subjects.map((subject) => (
                      <Badge key={subject.id} variant="outline">
                        {subject.name}
                      </Badge>
                    ))
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{course._count.classes}</Badge>
              </TableCell>
              <TableCell>{formatter.format(course.createdAt)}</TableCell>
              <TableCell className="text-right">
                <CourseRowActions id={course.id} name={course.name} />
              </TableCell>
            </TableRow>
          ))}
          {courses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                No courses yet. Create your first course to start building classes.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
