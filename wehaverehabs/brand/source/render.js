// Render SVG files to transparent PNGs at given widths.
// usage: node render.js <svgDir> <pngDir> <name:width[,width]>...
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const [svgDir, pngDir, ...jobs] = process.argv.slice(2);
  fs.mkdirSync(pngDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const job of jobs) {
    const [name, widths] = job.split(':');
    const svg = fs.readFileSync(path.join(svgDir, name + '.svg'), 'utf8');
    const vb = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
    for (const w of widths.split(',').map(Number)) {
      const h = Math.round((w * vb[3]) / vb[2]);
      await page.setViewportSize({ width: w, height: h });
      await page.setContent(
        `<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${w}" height="${h}" `)}</body></html>`
      );
      const out = path.join(pngDir, `${name}-${w}.png`);
      await page.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
      console.log(out);
    }
  }
  await browser.close();
})();
