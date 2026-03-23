import Link from "next/link";
import { getSections, deleteSection } from "@/app/(school)/sections/actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export async function SectionTable() {
  const sections = await getSections();
  const formatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Teacher</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sections.map((section) => (
            <TableRow key={section.id}>
              <TableCell className="font-medium">{section.name}</TableCell>
              <TableCell>{section.class.name}</TableCell>
              <TableCell>
                {section.teacherMappings.length
                  ? section.teacherMappings.map((item) => item.teacher.name).join(", ")
                  : "-"}
              </TableCell>
              <TableCell>{formatter.format(section.createdAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/sections/${section.id}/edit`}>Edit</Link>
                  </Button>
                  <form action={deleteSection}>
                    <input type="hidden" name="id" value={section.id} />
                    <Button size="sm" type="submit" variant="destructive">
                      Delete
                    </Button>
                  </form>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {sections.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                No sections yet. Create your first section.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
