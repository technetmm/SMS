import PDFDocument from "pdfkit";
import { getPdfFontPath } from "@/lib/export/pdf-font";

export async function buildInvoicePdfBuffer(input: {
  schoolName: string;
  invoiceId: string;
  createdAt: Date;
  studentName: string;
  sectionName: string;
  className: string;
  originalAmount: number;
  discount: number;
  finalAmount: number;
  paidAmount: number;
  status: string;
}) {
  const fontPath = getPdfFontPath();
  if (!fontPath) {
    throw new Error("Unable to resolve bundled TTF font for PDF rendering.");
  }
  const doc = new PDFDocument({ margin: 40, size: "A4", font: fontPath });

  const chunks: Buffer[] = [];

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const remaining = Math.max(0, input.finalAmount - input.paidAmount);

  doc.fontSize(20).text(input.schoolName || "School", { align: "left" });
  doc.moveDown(0.2);
  doc
    .fontSize(11)
    .fillColor("#555")
    .text(`Invoice #${input.invoiceId.slice(0, 8)}`);
  doc.text(
    `Date: ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(input.createdAt)}`,
  );
  doc.fillColor("#000");

  doc.moveDown(1);
  doc.fontSize(12).text(`Student: ${input.studentName}`);
  doc.text(`Section: ${input.className} • ${input.sectionName}`);
  doc.text(`Status: ${input.status}`);

  doc.moveDown(1);
  doc.text("Fee Breakdown");
  doc.moveDown(0.3);
  doc.text(`Original Fee: $${input.originalAmount.toFixed(2)}`);
  doc.text(`Discount: $${input.discount.toFixed(2)}`);
  doc.text(`Final Amount: $${input.finalAmount.toFixed(2)}`);
  doc.text(`Paid Amount: $${input.paidAmount.toFixed(2)}`);
  doc.text(`Remaining: $${remaining.toFixed(2)}`);

  doc.end();
  return done;
}
