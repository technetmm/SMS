import Link from "next/link";
import {
  getPaginatedSections,
  deleteSection,
} from "@/app/(school)/school/sections/actions";
import { TablePagination } from "@/components/shared/table-pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export async function SectionTable({ page }: { page: number }) {
  const sections = await getPaginatedSections({ page });
  const formatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Teacher</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sections.items.map((section) => {
            const activeEnrollments = section.enrollments.filter(
              (item) => item.status === "ACTIVE",
            ).length;
            const isFull = activeEnrollments >= section.capacity;

            return (
              <TableRow key={section.id}>
                <TableCell className="font-medium">{section.name}</TableCell>
                <TableCell>{section.class.name}</TableCell>
                <TableCell>
                  {activeEnrollments} / {section.capacity}
                </TableCell>
                <TableCell>
                  {section.staffMappings.length
                    ? section.staffMappings
                        .map((item) => item.staff.name)
                        .join(", ")
                    : "-"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={isFull ? "outline" : "default"}
                    className={
                      isFull ? "text-destructive border-destructive/40" : ""
                    }
                  >
                    {isFull ? "Full" : "Available"}
                  </Badge>
                </TableCell>
                <TableCell>{formatter.format(section.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/school/sections/${section.id}/edit`}>
                        Edit
                      </Link>
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
            );
          })}
          {sections.totalCount === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                No sections yet. Create your first section.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      <TablePagination pagination={sections} pathname="/school/sections" />
    </div>
  );
}
