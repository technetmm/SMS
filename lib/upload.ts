import path from "path";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type UploadResult = {
  url: string;
  fileName: string;
};

export async function saveProfileImage({
  file,
  existingUrl,
}: {
  file: File;
  existingUrl?: string | null;
}): Promise<UploadResult> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Unsupported file type. Use JPG, PNG, or WEBP.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File is too large. Max size is 2MB.");
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const fileName = `${randomUUID()}.${ext}`;
  const filePath = path.join(uploadsDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, buffer);

  if (existingUrl && existingUrl.startsWith("/uploads/")) {
    const existingPath = path.join(process.cwd(), "public", existingUrl);
    await unlink(existingPath).catch(() => undefined);
  }

  return {
    url: `/uploads/${fileName}`,
    fileName,
  };
}

export async function removeProfileImage(existingUrl?: string | null) {
  if (!existingUrl || !existingUrl.startsWith("/uploads/")) {
    return;
  }
  const existingPath = path.join(process.cwd(), "public", existingUrl);
  await unlink(existingPath).catch(() => undefined);
}
