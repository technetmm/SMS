import { prisma } from "@/lib/prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteStudent } from "@/app/actions/students";
import { getServerAuth } from "@/auth";
import { UserRole } from "@/app/generated/prisma";

export async function StudentsTable() {
  const [students, session] = await Promise.all([
    prisma.student.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    getServerAuth(),
  ]);

  const canDelete = session?.user.role === UserRole.ADMIN;

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">{student.name}</TableCell>
              <TableCell>{student.gender}</TableCell>
              <TableCell>
                <Badge variant={student.status === "ACTIVE" ? "default" : "outline"}>
                  {student.status}
                </Badge>
              </TableCell>
              <TableCell>{student.phone ?? "-"}</TableCell>
              <TableCell className="text-right">
                {canDelete ? (
                  <form action={deleteStudent}>
                    <input type="hidden" name="id" value={student.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Delete
                    </Button>
                  </form>
                ) : (
                  <span className="text-xs text-muted-foreground">Read only</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
