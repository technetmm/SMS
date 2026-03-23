import { PageHeader } from "@/components/shared/page-header";
import { ExportMenu } from "@/components/shared/export-menu";
import { requireSchoolStaff } from "@/lib/permissions";
import { exportAttendanceToExcel } from "@/app/(school)/exports/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AttendancePage() {
  await requireSchoolStaff();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Track daily attendance and generate reports."
        actions={
          <ExportMenu
            items={[
              { label: "Export Excel", action: exportAttendanceToExcel },
            ]}
          />
        }
      />
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Select a class section to mark present, absent, late, or leave.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Filter by class, section, and date range to export reports.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
