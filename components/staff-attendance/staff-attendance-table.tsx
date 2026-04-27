"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  deleteStaffAttendance,
  type StaffAttendanceTableFilters,
  type StaffAttendanceActionState,
} from "@/app/(school)/school/staff-attendance/actions";
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
import { useTranslations, useLocale } from "next-intl";
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

type StaffAttendanceTableProps = {
  page: number;
  filters?: StaffAttendanceTableFilters;
  searchParams?: Record<string, string | string[] | undefined>;
  logs: {
    items: Array<{
      id: string;
      date: Date;
      status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE";
      remark?: string | null;
      staff: { id: string; name: string };
      section: {
        id: string;
        name: string;
        class: { id: string; name: string };
      };
      createdAt: Date;
    }>;
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

export function StaffAttendanceTable({
  searchParams,
  logs,
}: Omit<StaffAttendanceTableProps, "page" | "filters">) {
  const router = useRouter();
  const t = useTranslations("SchoolEntities.staffAttendance.table");
  const locale = useLocale();
  const [deleteState, deleteAction, pending] = useActionState<
    StaffAttendanceActionState,
    FormData
  >(deleteStaffAttendance, { status: "idle" });
  const lastHandledKeyRef = useRef<string>("");

  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  useEffect(() => {
    if (deleteState.status === "idle") return;

    const key = `${deleteState.msgID}:${deleteState.status}:${deleteState.message ?? ""}`;
    if (lastHandledKeyRef.current === key) return;
    lastHandledKeyRef.current = key;

    if (deleteState.status === "success") {
      toast.success(
        deleteState.message ?? "Staff attendance deleted successfully.",
      );
      router.refresh();
    }
    if (deleteState.status === "error") {
      toast.error(deleteState.message ?? "Failed to delete staff attendance.");
    }
  }, [router, deleteState]);

  return (
    <>
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.date")}</TableHead>
              <TableHead>{t("columns.staff")}</TableHead>
              <TableHead>{t("columns.section")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
              <TableHead>{t("columns.remark")}</TableHead>
              <TableHead className="w-25">{t("columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.items.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium">
                  {formatter.format(log.date)}
                </TableCell>
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
                    {t(`statusOptions.${log.status.toLowerCase()}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {log.remark && log.remark.length > 50 ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <span className="text-sm text-muted-foreground cursor-pointer hover:text-foreground underline">
                          {log.remark.substring(0, 50)}...
                        </span>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t("columns.remark")}</DialogTitle>
                          <DialogDescription>{log.remark}</DialogDescription>
                        </DialogHeader>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {log.remark || "-"}
                    </span>
                  )}
                </TableCell>
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
                          <input type="hidden" name="id" value={log.id} />
                          <AlertDialogAction type="submit" disabled={pending}>
                            {t("delete.confirm")}
                          </AlertDialogAction>
                        </form>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
            {logs.totalCount === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        <TablePagination
          pagination={logs}
          pathname="/school/staff-attendance"
          searchParams={searchParams}
        />
      </div>
    </>
  );
}
