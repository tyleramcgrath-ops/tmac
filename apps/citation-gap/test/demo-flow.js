// Loads index.html in Chromium, runs the demo, checks for console errors, dumps the work order.
const { chromium } = require(require('path').join(require('child_process').execSync('npm root -g').toString().trim(),'playwright'));
const http=require('http'), fs=require('fs'), path=require('path');
(async()=>{
  const root=path.join(__dirname,'..');
  const srv=http.createServer((req,res)=>{ const f=path.join(root,'index.html'); res.setHeader('content-type','text/html'); res.end(fs.readFileSync(f)); });
  await new Promise(r=>srv.listen(0,r)); const port=srv.address().port;
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const page=await browser.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push('pageerror: '+e.message)); page.on('console',m=>{ if(m.type()==='error') errors.push('console: '+m.text()); });
  await page.goto('http://127.0.0.1:'+port+'/');
  await page.waitForSelector('#report.on');
  // expand every prompt toggle and click every copy button
  const n=await page.$$eval('.ptoggle',els=>{ els.forEach(e=>e.click()); return els.length; });
  await page.$$eval('.cpy',els=>els.forEach(e=>e.click()));
  const master=await page.evaluate(()=>masterPrompt(S.lastData));
  const fixes=await page.evaluate(()=>S.lastData.fixes.map(f=>[f.key,f.severity,f.effort,Math.round(f._pts),Math.round(f._rank)]));
  const sections=await page.$$eval('#report section h2',h=>h.map(x=>x.textContent.trim()));
  fs.writeFileSync(path.join(__dirname,'demo-work-order.txt'),master);
  console.log('toggles:',n,'errors:',errors.length); errors.forEach(e=>console.log('  ',e));
  console.log('sections:',sections.join(' | '));
  console.log('fixes:',JSON.stringify(fixes));
  console.log('master length:',master.length);
  await page.screenshot({path:path.join(__dirname,'demo-shot.png'),fullPage:true});
  await browser.close(); srv.close();
  process.exit(errors.length?1:0);
})();
