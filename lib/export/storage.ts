import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const EXPORT_DIR = join(process.cwd(), "public", "exports");

export async function saveExportFile({
  filename,
  buffer,
}: {
  filename: string;
  buffer: Buffer | ArrayBuffer;
}) {
  await mkdir(EXPORT_DIR, { recursive: true });

  const content =
    buffer instanceof ArrayBuffer ? Buffer.from(buffer) : Buffer.from(buffer);
  const filePath = join(EXPORT_DIR, filename);

  await writeFile(filePath, content);
  return `/exports/${filename}`;
}
