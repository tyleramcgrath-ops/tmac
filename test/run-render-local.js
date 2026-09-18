const http=require('http'), fs=require('fs'), path=require('path');
process.env.CHROME_PATH='/opt/pw-browsers/chromium';
const handler=require('../api/render.js');
const srv=http.createServer((req,res)=>{ res.setHeader('content-type','text/html'); res.end(fs.readFileSync(path.join(__dirname,'fixture-render.html'))); });
srv.listen(0, async ()=>{
  const port=srv.address().port;
  const out={}; const res={setHeader(){}, status(c){out.status=c; return res;}, json(o){out.body=o; return res;}};
  await handler({query:{url:'http://127.0.0.1:'+port+'/page', wait:'800'}}, res);
  srv.close();
  const b=out.body;
  if(!b.ok){ console.log('FAILED', b); process.exit(1); }
  console.log('renderMs',b.renderMs,'wait',b.waitStrategy,'scrolled',b.scrolled,'hiddenCount',b.hiddenCount,'visible',b.visibleTextElements);
  console.log('byKind',b.hiddenByKind); console.log('gating',JSON.stringify(b.gating));
  b.hidden.forEach(h=>console.log('  HIDDEN',h.kind.padEnd(15),h.reason.padEnd(32),h.tag,'|',h.text));
  console.log('counters',b.counters);
  console.log('innerText has injected:',b.innerText.includes('Injected by JavaScript'),'| has demo:',b.innerText.includes('Get a Free Demo'));
  console.log('domText has demo:', b.domText.includes('Get a Free Demo'));
  console.log('errors',b.pageErrors,b.consoleErrors, 'notes', b.notes);
});
