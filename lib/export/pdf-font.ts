import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

let cachedFontPath: string | null | undefined;

export function getPdfFontPath() {
  if (cachedFontPath !== undefined) {
    return cachedFontPath;
  }

  try {
    const nextPackageJson = require.resolve("next/package.json");
    const resolved = path.join(
      path.dirname(nextPackageJson),
      "dist",
      "compiled",
      "@vercel",
      "og",
      "Geist-Regular.ttf",
    );
    if (existsSync(resolved)) {
      cachedFontPath = resolved;
      return cachedFontPath;
    }
  } catch {
    // Fallback below.
  }

  const fallback = path.join(
    process.cwd(),
    "node_modules",
    "next",
    "dist",
    "compiled",
    "@vercel",
    "og",
    "Geist-Regular.ttf",
  );

  cachedFontPath = existsSync(fallback) ? fallback : null;
  return cachedFontPath;
}
