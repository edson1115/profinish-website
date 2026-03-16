import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: "new",
  });
  const page = await browser.newPage();
  
  // Set viewport to a standard desktop size
  await page.setViewport({ width: 1440, height: 900 });

  console.log(`Navigating to ${url}...`);
  try {
    await page.goto(url, { waitUntil: 'networkidle0' });
  } catch (e) {
    console.error(`Error navigating to ${url}. Is the server running? (node serve.mjs)`);
    await browser.close();
    process.exit(1);
  }

  const screenshotsDir = path.join(__dirname, 'temporary screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Find next index for auto-increment
  const files = fs.readdirSync(screenshotsDir);
  let maxIndex = 0;
  files.forEach(file => {
    const match = file.match(/^screenshot-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxIndex) maxIndex = num;
    }
  });
  const nextIndex = maxIndex + 1;

  const filename = label ? `screenshot-${nextIndex}-${label}.png` : `screenshot-${nextIndex}.png`;
  const filepath = path.join(screenshotsDir, filename);

  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`Screenshot saved to: ${filepath}`);

  await browser.close();
})();