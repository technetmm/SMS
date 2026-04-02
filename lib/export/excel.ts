import ExcelJS from "exceljs";

export async function buildExcelBuffer({
  sheetName,
  headers,
  rows,
}: {
  sheetName: string;
  headers: string[];
  rows: Array<Array<string | number | Date | null>>;
}) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.addRow(headers);
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  for (const row of rows) {
    worksheet.addRow(row);
  }

  worksheet.columns = headers.map((header, index) => ({
    header,
    key: header,
    width: Math.max(16, header.length + 4),
    style:
      index === 0
        ? { alignment: { horizontal: "left" as const } }
        : { alignment: { horizontal: "left" as const } },
  }));

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      if (rowNumber > 1 && cell.value instanceof Date) {
        cell.numFmt = "yyyy-mm-dd";
      }
    });
  });

  return workbook.xlsx.writeBuffer();
}
