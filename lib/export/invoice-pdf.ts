import PDFDocument from "pdfkit";
import { Currency } from "@/app/generated/prisma/enums";
import { getPdfFontPath } from "@/lib/export/pdf-font";
import { formatMoney } from "@/lib/helper";

export async function buildInvoicePdfBuffer(input: {
  schoolName: string;
  currency: Currency;
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
  doc.text(`Section: ${input.className} / ${input.sectionName}`);
  doc.text(`Status: ${input.status}`);
  doc.text(`Currency: ${input.currency}`);

  doc.moveDown(1);
  doc.text("Fee Breakdown");
  doc.moveDown(0.3);
  doc.text(`Original Fee: ${formatMoney(input.originalAmount, input.currency)}`);
  doc.text(`Discount: ${formatMoney(input.discount, input.currency)}`);
  doc.text(`Final Amount: ${formatMoney(input.finalAmount, input.currency)}`);
  doc.text(`Paid Amount: ${formatMoney(input.paidAmount, input.currency)}`);
  doc.text(`Remaining: ${formatMoney(remaining, input.currency)}`);

  doc.end();
  return done;
}
