import { requireSchoolAdminAccess } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { PayrollGenerateForm } from "@/components/payroll/payroll-generate-form";
import { PayrollTable } from "@/components/payroll/payroll-table";
import { generatePayroll } from "@/app/(school)/school/payroll/actions";
import { parsePageParam } from "@/lib/pagination";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireSchoolAdminAccess();
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        description="Generate and review monthly staff payroll."
      />
      <PayrollGenerateForm action={generatePayroll} />
      <PayrollTable page={page} />
    </div>
  );
}

