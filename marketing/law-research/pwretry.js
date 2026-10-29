const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const doms=process.argv.slice(2);
 const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
 for(const d of doms){
  const ctx=await browser.newContext({userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',viewport:{width:1366,height:900}});
  const page=await ctx.newPage(); let last=null;
  page.on('response',async r=>{ if(r.request().isNavigationRequest()&&r.request().frame()===page.mainFrame()){ last=r; }});
  const t0=Date.now(); let res={method:'playwright'};
  try{ await page.goto('https://'+(fs.readFileSync('html/'+d+'.curl','utf8').match(/url_effective":"https?:\/\/([^/"]+)/)||[,d])[1]+'/',{waitUntil:'domcontentloaded',timeout:25000});
    await page.waitForTimeout(8000);
    if(last){ res.status=last.status(); res.url=last.url(); res.headers=last.headers(); let body=''; try{body=await last.text();}catch(e){body='';}
      res.bodyLen=body.length; if(body.length>2000 && res.status<400) fs.writeFileSync('html/'+d+'.pw.html',body);
      fs.writeFileSync('html/'+d+'.pw.headers',Object.entries(res.headers).map(([k,v])=>k+': '+v).join('\n'));}
  }catch(e){res.error=String(e).slice(0,200);}
  res.ms=Date.now()-t0; fs.writeFileSync('html/'+d+'.pw.json',JSON.stringify(res)); console.log(d,res.status,res.bodyLen,res.error||'');
  await ctx.close();
 }
 await browser.close();
})();
