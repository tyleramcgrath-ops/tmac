// Loads index.html in Chromium, runs the demo, checks for console errors, dumps the work order.
const { chromium } = require(require('path').join(require('child_process').execSync('npm root -g').toString().trim(),'playwright'));
const http=require('http'), fs=require('fs'), path=require('path');
const { enterApp }=require('./enter-app.js');
(async()=>{
  const root=path.join(__dirname,'..');
  const srv=http.createServer((req,res)=>{ const f=path.join(root,'index.html'); res.setHeader('content-type','text/html'); res.end(fs.readFileSync(f)); });
  await new Promise(r=>srv.listen(0,r)); const port=srv.address().port;
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const page=await browser.newPage();
  // Network-resource failures are split out rather than dropped: this sandbox cannot reach the
  // Google Fonts <link> the page has always carried (ERR_TUNNEL / ERR_CERT_AUTHORITY_INVALID,
  // depending on the proxy), which is an environment fact, not a regression. They are printed
  // below so a genuinely new one is still visible; only real page errors fail the run.
  const errors=[], netErrors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{ if(m.type()!=='error') return;
    (/ERR_TUNNEL|ERR_CERT|net::/.test(m.text())?netErrors:errors).push('console: '+m.text()); });
  await page.goto('http://127.0.0.1:'+port+'/');
  await page.waitForSelector('#report.on');
  // The marketing homepage covers the demo report until a launch control is clicked; walk it
  // for real so the screenshot below is of the app and not of the front door.
  console.log('front door:',JSON.stringify(await enterApp(page)));
  // expand every prompt toggle and click every copy button
  const n=await page.$$eval('.ptoggle',els=>{ els.forEach(e=>e.click()); return els.length; });
  await page.$$eval('.cpy',els=>els.forEach(e=>e.click()));
  const master=await page.evaluate(()=>masterPrompt(S.lastData));
  const fixes=await page.evaluate(()=>S.lastData.fixes.map(f=>[f.key,f.severity,f.effort,Math.round(f._pts),Math.round(f._rank)]));
  const sections=await page.$$eval('#report section h2',h=>h.map(x=>x.textContent.trim()));
  fs.writeFileSync(path.join(__dirname,'demo-work-order.txt'),master);
  console.log('toggles:',n,'errors:',errors.length); errors.forEach(e=>console.log('  ',e));
  console.log('network-resource errors (not failures):',netErrors.length); netErrors.forEach(e=>console.log('  ',e));
  console.log('sections:',sections.join(' | '));
  console.log('fixes:',JSON.stringify(fixes));
  console.log('master length:',master.length);
  await page.screenshot({path:path.join(__dirname,'demo-shot.png'),fullPage:true});
  await browser.close(); srv.close();
  process.exit(errors.length?1:0);
})();
