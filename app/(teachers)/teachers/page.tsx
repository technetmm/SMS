import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeachersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        description="Assign teachers to sections and manage payroll per section."
      />
      <Card>
        <CardHeader>
          <CardTitle>Teacher Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Assign teachers to sections and review payout calculations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
