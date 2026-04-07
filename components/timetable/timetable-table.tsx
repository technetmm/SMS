import Link from "next/link";
import { getPaginatedTimetable, getTimetable, deleteTimetableSlot } from "@/app/(school)/school/timetable/actions";
import { TablePagination } from "@/components/shared/table-pagination";
import { enumLabel, DAY_OF_WEEK_LABELS } from "@/lib/enum-labels";
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

export async function TimetableTable({
  page,
  slots: slotsProp,
}: {
  page?: number;
  slots?: Awaited<ReturnType<typeof getTimetable>>;
} = {}) {
  const slots =
    slotsProp != null
      ? {
          items: slotsProp,
          page: 1,
          pageSize: slotsProp.length,
          totalCount: slotsProp.length,
          totalPages: 1,
        }
      : await getPaginatedTimetable({ page: page ?? 1 });

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Day</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Staff</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Room</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {slots.items.map((slot) => (
            <TableRow key={slot.id}>
              <TableCell>{enumLabel(slot.dayOfWeek, DAY_OF_WEEK_LABELS)}</TableCell>
              <TableCell className="font-medium">
                {slot.startTime} - {slot.endTime}
              </TableCell>
              <TableCell>{slot.staff.name}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span>{slot.section.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {slot.section.class.name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {slot.room ? <Badge variant="outline">{slot.room}</Badge> : "-"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/school/timetable/${slot.id}/edit`}>Edit</Link>
                  </Button>
                  <form action={deleteTimetableSlot}>
                    <input type="hidden" name="id" value={slot.id} />
                    <Button size="sm" type="submit" variant="destructive">
                      Delete
                    </Button>
                  </form>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {slots.totalCount === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                No timetable slots yet. Create your first slot.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      {slotsProp == null ? (
        <TablePagination pagination={slots} pathname="/school/timetable" />
      ) : null}
    </div>
  );
}
