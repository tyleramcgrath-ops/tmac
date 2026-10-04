const fs=require('fs');const R=require('./results.json');
const doms=['johnfoy.com','piastawalker.com','chicagodivorceatty.com','monastlaw.com','forthepeople.com','aramilaw.com','ramimmigrationlaw.com','larrimer.com','businessattorneysandiego.com','npavliklaw.com'];
const out=[];
for(const d of doms){const r=R.find(x=>x.domain===d);const o={domain:d,platform:r.platform,vendor:r.vendor};
 try{const j=JSON.parse(fs.readFileSync('lh/'+d+'.json','utf8'));
  if(j.runtimeError&&j.runtimeError.code!=='NO_ERROR'){o.error=j.runtimeError.code+': '+j.runtimeError.message}
  const a=j.audits,c=j.categories;o.url=j.finalDisplayedUrl||j.finalUrl;o.formFactor=j.configSettings.formFactor;o.fetchTime=j.fetchTime;
  o.performance=c.performance.score==null?null:Math.round(c.performance.score*100);o.seo=c.seo.score==null?null:Math.round(c.seo.score*100);o.accessibility=c.accessibility.score==null?null:Math.round(c.accessibility.score*100);
  o.LCP_s=a['largest-contentful-paint'].numericValue/1000;o.FCP_s=a['first-contentful-paint'].numericValue/1000;o.TBT_ms=a['total-blocking-time'].numericValue;o.CLS=a['cumulative-layout-shift'].numericValue;
  o.total_bytes=a['total-byte-weight'].numericValue;o.requests=(a['network-requests'].details?.items||[]).length;
  const tp=a['third-parties-insight']?.details?.items||[];o.third_party_entities=tp.length;o.third_party_main_thread_ms=Math.round(tp.reduce((s,x)=>s+(x.mainThreadTime||0),0));o.third_party_kb=Math.round(tp.reduce((s,x)=>s+(x.transferSize||0),0)/1024);
  o.top_third_parties=tp.sort((x,y)=>(y.mainThreadTime||0)-(x.mainThreadTime||0)).slice(0,3).map(x=>(x.entity?.text||x.entity)+` (${Math.round(x.mainThreadTime||0)}ms main-thread, ${Math.round((x.transferSize||0)/1024)}KB)`);
  o.unused_js_kb=Math.round((a['unused-javascript']?.details?.overallSavingsBytes||0)/1024);o.js_bootup_ms=Math.round(a['bootup-time']?.numericValue||0);
  o.failed_a11y=Object.values(a).filter(x=>x.score===0&&j.categories.accessibility.auditRefs.some(r=>r.id===x.id)).map(x=>x.id);
 }catch(e){o.error=o.error||('no report: '+String(e).slice(0,100)+' log: '+(fs.existsSync('lh/'+d+'.log')?fs.readFileSync('lh/'+d+'.log','utf8').slice(-300):''))}
 out.push(o);}
fs.writeFileSync('lighthouse.json',JSON.stringify(out,null,1));
const ok=out.filter(o=>o.performance!=null);const med=a=>{a=[...a].sort((x,y)=>x-y);const m=a.length>>1;return a.length%2?a[m]:(a[m-1]+a[m])/2};
for(const o of out)console.log(o.domain,o.platform,o.performance,o.seo,o.accessibility,o.LCP_s?.toFixed(1),Math.round(o.TBT_ms),Math.round(o.total_bytes/1024)+'KB',o.requests,o.third_party_entities,o.third_party_main_thread_ms+'ms',o.third_party_kb+'KB3p',o.unused_js_kb+'KBunusedJS',o.error||'',JSON.stringify(o.top_third_parties),JSON.stringify(o.failed_a11y));
if(ok.length)console.log('MEDIANS n='+ok.length,'perf',med(ok.map(o=>o.performance)),'seo',med(ok.map(o=>o.seo)),'a11y',med(ok.map(o=>o.accessibility)),'LCP',med(ok.map(o=>o.LCP_s)).toFixed(2),'TBT',med(ok.map(o=>o.TBT_ms)),'KB',Math.round(med(ok.map(o=>o.total_bytes))/1024),'LCP>2.5s',ok.filter(o=>o.LCP_s>2.5).length,'LCP>4s',ok.filter(o=>o.LCP_s>4).length,'perf<50',ok.filter(o=>o.performance<50).length);
