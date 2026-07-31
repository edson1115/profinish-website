import sharp from 'sharp';
import { existsSync, renameSync } from 'fs';
import path from 'path';

// Light slate-blue-gray matching the site's slate-300 palette (#A1B0C8)
const TARGET_R = 161;
const TARGET_G = 176;
const TARGET_B = 200;

const logos = [
  'brand_assets/logo-wheels.png',
  'brand_assets/logo-merchants.png',
  'brand_assets/logo-fleetio.png',
  'brand_assets/logo-enterprise.png',
  'brand_assets/logo-mike-albert.png',
  'brand_assets/logo-element.png',
];

async function processLogo(filePath) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const px = new Uint8Array(data);

  for (let i = 0; i < px.length; i += 4) {
    const r = px[i], g = px[i + 1], b = px[i + 2];

    // Perceived luminance
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (lum >= 248) {
      // Pure / near-white → fully transparent
      px[i + 3] = 0;
    } else if (lum >= 195) {
      // Anti-alias edge zone → fade out proportionally
      const alpha = Math.round(((248 - lum) / 53) * 255);
      px[i] = TARGET_R;
      px[i + 1] = TARGET_G;
      px[i + 2] = TARGET_B;
      px[i + 3] = alpha;
    } else {
      // Logo artwork → recolor to slate-gray, fully opaque
      px[i] = TARGET_R;
      px[i + 1] = TARGET_G;
      px[i + 2] = TARGET_B;
      px[i + 3] = 255;
    }
  }

  // Write to a temp file first, then rename over the original
  const tmp = filePath + '.tmp.png';
  await sharp(Buffer.from(px), { raw: { width, height, channels } })
    .png()
    .toFile(tmp);

  renameSync(tmp, filePath);
  console.log(`Done: ${filePath}`);
}

for (const logo of logos) {
  if (!existsSync(logo)) { console.warn(`Missing: ${logo}`); continue; }
  await processLogo(logo);
}

console.log('\nAll logos processed.');
