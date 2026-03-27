import Link from "next/link";
import { getStaff, deleteStaff } from "@/app/(school)/staff/actions";
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
import { enumLabel, STAFF_STATUS_LABELS } from "@/lib/enum-labels";

export async function StaffTable() {
  const staff = await getStaff();
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
          {staff.map((staff) => (
            <TableRow key={staff.id}>
              <TableCell className="font-medium">{staff.name}</TableCell>
              <TableCell>{staff.email}</TableCell>
              <TableCell>{staff.phone ?? "-"}</TableCell>
              <TableCell>
                <Badge
                  variant={staff.status === "ACTIVE" ? "default" : "outline"}
                >
                  {enumLabel(staff.status, STAFF_STATUS_LABELS)}
                </Badge>
              </TableCell>
              <TableCell>{formatter.format(staff.hireDate)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/staff/${staff.id}`}>View</Link>
                  </Button>
                  <Button asChild size="sm" variant="default">
                    <Link href={`/staff/${staff.id}/edit`}>Edit</Link>
                  </Button>
                  <form action={deleteStaff}>
                    <input type="hidden" name="id" value={staff.id} />
                    <Button size="sm" variant="destructive" type="submit">
                      Delete
                    </Button>
                  </form>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {staff.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                No staff yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
