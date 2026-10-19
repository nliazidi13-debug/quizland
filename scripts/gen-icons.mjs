import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(here, "../public/brand/logo-quizland-source.jpg");
const BRAND = path.join(here, "../public/brand");
const OUT = path.join(here, "../public/icons");
const ICON_BG = { r: 255, g: 255, b: 255, alpha: 1 };

mkdirSync(OUT, { recursive: true });
mkdirSync(BRAND, { recursive: true });

// 1. Cut the near-white background to transparency (logo art is on white).
async function makeTransparentLogo() {
  const img = sharp(SRC).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const alpha = 255 - Math.min(r, g, b);
    data[i + 3] = alpha;
  }
  await sharp(data, { raw: { width, height, channels } })
    .trim()
    .png()
    .toFile(path.join(BRAND, "logo-quizland.png"));
  console.log("wrote brand/logo-quizland.png");
}

async function iconOnWhite(size, name, safeRatio = 1) {
  const inner = Math.round(size * safeRatio);
  const logo = await sharp(path.join(BRAND, "logo-quizland.png"))
    .resize(inner, inner, { fit: "contain", background: ICON_BG })
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: ICON_BG },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(path.join(OUT, name));
  console.log("wrote icons/" + name);
}

await makeTransparentLogo();
await iconOnWhite(192, "icon-192.png", 0.82);
await iconOnWhite(512, "icon-512.png", 0.82);
await iconOnWhite(180, "apple-touch-icon.png", 0.82);
await iconOnWhite(192, "icon-maskable-192.png", 0.6);
await iconOnWhite(512, "icon-maskable-512.png", 0.6);

// Favicon convention file (square, white background matching the source logo).
await iconOnWhite(256, "../../src/app/icon.png", 0.82);
console.log("done");
