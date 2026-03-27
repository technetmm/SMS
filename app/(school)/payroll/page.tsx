import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { PayrollGenerateForm } from "@/components/payroll/payroll-generate-form";
import { PayrollTable } from "@/components/payroll/payroll-table";
import { generatePayroll } from "@/app/(school)/payroll/actions";
import { PERMISSIONS } from "@/lib/permission-keys";

export default async function PayrollPage() {
  await requirePermission(PERMISSIONS.staffUpdate);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        description="Generate and review monthly staff payroll."
      />
      <PayrollGenerateForm action={generatePayroll} />
      <PayrollTable />
    </div>
  );
}

