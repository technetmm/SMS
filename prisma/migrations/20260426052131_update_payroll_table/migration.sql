-- CreateTable
CREATE TABLE "PayrollAdjustment" (
    "id" TEXT NOT NULL,
    "payrollId" TEXT NOT NULL,
    "adjustmentAmount" DECIMAL(65,30) NOT NULL,
    "adjustmentReason" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PayrollAdjustment_payrollId_idx" ON "PayrollAdjustment"("payrollId");

-- CreateIndex
CREATE INDEX "PayrollAdjustment_schoolId_idx" ON "PayrollAdjustment"("schoolId");

-- AddForeignKey
ALTER TABLE "PayrollAdjustment" ADD CONSTRAINT "PayrollAdjustment_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "Payroll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollAdjustment" ADD CONSTRAINT "PayrollAdjustment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
