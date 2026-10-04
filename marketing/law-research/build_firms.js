const fs=require('fs');
const skip=/(superlawyers|justia\.com|findlaw|avvo|yelp|martindale|lawyers\.com|bbb\.org|reddit|bestlawyers|cornell\.edu|nolo|expertise\.com|thumbtack)/i;
const perQ=[];
for(const line of fs.readFileSync('raw_search.txt','utf8').trim().split('\n')){
  const [,q,urls]=line.split('|');
  perQ.push(urls.trim().split(/\s+/).map((u,i)=>({u,q,rank:i+1})).filter(x=>!skip.test(x.u)));
}
// interleave: take the 1st surviving firm of each query, then the 2nd, etc. (keeps spread across queries)
const LIMIT=+process.argv[2]||100;const out=[];const seen=new Set();
for(let k=0;k<12&&out.length<LIMIT;k++) for(const L of perQ){ if(out.length>=LIMIT)break; const x=L[k]; if(!x)continue;
  const d=new URL(x.u).hostname.replace(/^www\./,''); if(seen.has(d))continue; seen.add(d);
  out.push({domain:d,url:x.u,homepage:'https://'+new URL(x.u).hostname+'/',query:x.q,rank:x.rank});}
fs.writeFileSync('firms.json',JSON.stringify(out,null,1));
console.log(out.length, perQ.length);
