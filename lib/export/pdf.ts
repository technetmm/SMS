import PDFDocument from "pdfkit";

export async function buildSimpleTablePdfBuffer({
  title,
  subtitle,
  headers,
  rows,
}: {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: string[][];
}) {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  const chunks: Buffer[] = [];

  const bufferPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.fontSize(18).text(title, { align: "left" });
  if (subtitle) {
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor("#666").text(subtitle);
    doc.fillColor("#000");
  }
  doc.moveDown(1);

  const startX = doc.x;
  let y = doc.y;
  const columnWidth = 500 / Math.max(1, headers.length);

  headers.forEach((header, index) => {
    doc.font("Helvetica-Bold").fontSize(10).text(header, startX + index * columnWidth, y, {
      width: columnWidth,
    });
  });

  y += 18;
  doc.moveTo(startX, y).lineTo(startX + headers.length * columnWidth, y).strokeColor("#ccc").stroke();
  y += 8;

  for (const row of rows) {
    row.forEach((cell, index) => {
      doc.font("Helvetica").fontSize(9).fillColor("#111").text(cell, startX + index * columnWidth, y, {
        width: columnWidth,
      });
    });
    y += 16;

    if (y > 760) {
      doc.addPage();
      y = 40;
    }
  }

  doc.end();
  return bufferPromise;
}
