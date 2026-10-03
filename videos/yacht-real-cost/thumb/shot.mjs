import pw from '/opt/node22/lib/node_modules/playwright/index.js'; const { chromium } = pw;
const b = await chromium.launch();
for (const [f,w,h,o] of [['thumb.html',1080,1920,'thumbnail-vertical.png'],['thumb-wide.html',1280,720,'thumbnail-1280x720.png']]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto('file://' + process.cwd() + '/thumb/' + f);
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  await p.screenshot({ path: 'thumb/' + o }); await p.close();
}
await b.close();
