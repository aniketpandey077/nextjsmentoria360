/**
 * Generates PNG PWA icons from public/icon.svg
 * Run: node scripts/generate-pwa-icons.mjs
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "public", "icon.svg");
const outDir = join(root, "public");

if (!existsSync(svgPath)) {
  console.error("Missing public/icon.svg");
  process.exit(1);
}

const svg = readFileSync(svgPath);

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("Install sharp first: npm install --save-dev sharp");
  process.exit(1);
}

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

for (const { name, size } of sizes) {
  const out = join(outDir, name);
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log("Wrote", name);
}
