"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/shared/table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocale, useTranslations } from "next-intl";
import { dateFormatter } from "@/lib/formatter";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  deleteStudentAttendance,
  type EnrollmentActionState,
} from "@/app/(school)/school/enrollments/actions";

type AttendanceRow = {
  id: string;
  date: Date;
  status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE";
  remark?: string | null;
  enrollment: {
    student: { name: string };
    section: { name: string; class: { name: string } };
  };
};

export function EnrollmentAttendanceTable({
  rows,
  pathname,
  searchParams,
  canDelete = true,
}: {
  rows: {
    items: AttendanceRow[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  pathname: string;
  searchParams?: Record<string, string | string[] | undefined>;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("SchoolEntities.attendance.table");

  const initialState: EnrollmentActionState = { status: "idle" };
  const [deleteState, deleteAction, pending] = useActionState<
    EnrollmentActionState,
    FormData
  >(deleteStudentAttendance, initialState);
  const lastHandledKeyRef = useRef<string>("");

  useEffect(() => {
    if (deleteState.status === "idle") return;

    const key = `${deleteState.msgID}:${deleteState.status}:${deleteState.message ?? ""}`;
    if (lastHandledKeyRef.current === key) return;
    lastHandledKeyRef.current = key;

    if (deleteState.status === "success") {
      toast.success(
        deleteState.message ?? "Student attendance deleted successfully.",
      );
      router.refresh();
    }
    if (deleteState.status === "error") {
      toast.error(
        deleteState.message ?? "Failed to delete student attendance.",
      );
    }
  }, [router, deleteState]);

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.date")}</TableHead>
            <TableHead>{t("columns.student")}</TableHead>
            <TableHead>{t("columns.section")}</TableHead>
            <TableHead>{t("columns.status")}</TableHead>
            <TableHead>{t("columns.remark")}</TableHead>
            {canDelete && (
              <TableHead className="w-25">{t("columns.actions")}</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.items.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{dateFormatter(locale).format(row.date)}</TableCell>
              <TableCell className="font-medium">
                {row.enrollment.student.name}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span>{row.enrollment.section.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {row.enrollment.section.class.name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {t(`statusOptions.${row.status.toLowerCase()}`)}
                </Badge>
              </TableCell>
              <TableCell>
                {row.remark && row.remark.length > 50 ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <span className="text-sm text-muted-foreground cursor-pointer hover:text-foreground underline">
                        {row.remark.substring(0, 50)}...
                      </span>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t("columns.remark")}</DialogTitle>
                        <DialogDescription>{row.remark}</DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {row.remark || "-"}
                  </span>
                )}
              </TableCell>
              {canDelete && (
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("delete.description")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {t("delete.cancel")}
                        </AlertDialogCancel>
                        <form action={deleteAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <AlertDialogAction type="submit" disabled={pending}>
                            {t("delete.confirm")}
                          </AlertDialogAction>
                        </form>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              )}
            </TableRow>
          ))}
          {rows.totalCount === 0 ? (
            <TableRow>
              <TableCell
                colSpan={canDelete ? 6 : 5}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                {t("empty")}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      <TablePagination
        pagination={rows}
        pathname={pathname}
        searchParams={searchParams}
      />
    </div>
  );
}
