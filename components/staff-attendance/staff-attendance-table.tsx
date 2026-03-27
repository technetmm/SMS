import { getStaffAttendance } from "@/app/(school)/staff-attendance/actions";
import { enumLabel, ATTENDANCE_STATUS_LABELS } from "@/lib/enum-labels";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export async function StaffAttendanceTable() {
  const logs = await getStaffAttendance();
  const formatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Staff</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">{formatter.format(log.date)}</TableCell>
              <TableCell>{log.staff.name}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span>{log.section.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {log.section.class.name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {enumLabel(log.status, ATTENDANCE_STATUS_LABELS)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                No staff attendance records yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}

