// Scoring, history and prompt generation — the part of the scanner that turns a parsed page and
// a competitor set into two scores, a work order and the prompts that go with it.
//
// This file is loaded two ways, and both matter:
//
//   the browser   <script src="/score.js"> in index.html, a classic script, so every declaration
//                 below lands in the global lexical scope exactly as it did when this code was an
//                 inline block — the scripts that follow it in index.html see these names
//                 unchanged.
//   the server    require('./score.js') from the scan job, which reads them off module.exports.
//
// It exists in one copy for one reason: a scheduled scan and a scan the customer watches must
// produce the same two numbers. Two copies of this logic is how those numbers start disagreeing,
// and a customer who sees one score in the app and a different one in their weekly email has no
// reason to trust either.
//
// Nothing here touches the DOM, the network or storage at load time. `$` is defined for the
// browser scripts that follow and is deliberately not exported.

"use strict";
const RANK_W   = { kwInTitle:20, kwInH1:15, wordCount:15, h3Count:10, h2Count:10,
                   listCount:10, faq:10, table:5, kwInMeta:5 };
const ANSWER_W = { stats:30, questionHeadings:20, table:15, schema:15, entities:10, coverage:10 };
const FIX_META = {
  kwInTitle:['CRITICAL',0.2,'RANK + ANSWER'], kwInH1:['CRITICAL',0.2,'RANK'],
  stats:['CRITICAL',4,'ANSWER'], schema:['HIGH',1,'ANSWER'], table:['HIGH',2,'ANSWER'],
  questionHeadings:['HIGH',3,'RANK + ANSWER'], h3Count:['CRITICAL',6,'RANK + ANSWER'],
  wordCount:['CRITICAL',6,'RANK'], listCount:['MEDIUM',1,'RANK'], entities:['HIGH',2,'ANSWER'],
  coverage:['HIGH',0.1,'ANSWER'], h2Count:['MEDIUM',1,'RANK'], kwInMeta:['MEDIUM',0.2,'RANK'],
  jsStats:['CRITICAL',0.5,'ANSWER'],
  animGate:['HIGH',0.25,'HUMAN VISITORS'],
  hiddenContent:['CRITICAL',0.5,'HUMAN VISITORS'],
  h3Fragmented:['MEDIUM',2,'RANK + ANSWER'],
  claimsAudit:['HIGH',1,'ANSWER'],
  schemaMismatch:['HIGH',0.5,'ANSWER'],
  dupHeadings:['MEDIUM',0.5,'RANK + ANSWER'],
  counterCaptionHeadings:['LOW',0.25,'RANK']
};
/* signals that carry weight but sit outside the two 100-point tables. hiddenContent is
   deliberately the heaviest: a demo button a visitor cannot see costs revenue directly,
   which outranks every content task on the list. */
const W_EXTRA = { hiddenContent:45, jsStats:30, animGate:20, h3Fragmented:15, claimsAudit:10, schemaMismatch:12, dupHeadings:8, counterCaptionHeadings:5 };
// Which competitor median each task's target comes from - used to flag SOFT TARGETS whose
// median moves when one competitor is dropped from the sample.
const FIX_METRIC = { wordCount:'wordCount', h3Count:'h3Count', h2Count:'h2Count', listCount:'listCount', stats:'statCount', questionHeadings:'questionHeadingCount', h3Fragmented:'h3Count' };
const COMP_FLOOR_WORDS = 300;
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s==null?'':s).replace(/[&<>"']/g, (c) =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const median = (a) => { if(!a.length) return 0; const s=a.slice().sort((x,y)=>x-y), m=s.length>>1;
  return s.length%2 ? s[m] : (s[m-1]+s[m])/2; };
const ratio = (mine,target) => !target ? 1 : Math.max(0, Math.min(1, mine/target));
const effortLabel = (h) => h<=0.25?'15 MIN' : h<=0.5?'30 MIN' : h<=1?'1 HR' : h<=2?'2 HRS' : h<=4?'HALF DAY' : '1 DAY';

const spreadOf = (a) => { if(!a.length) return {min:0,median:0,max:0}; const s=a.slice().sort((x,y)=>x-y);
  return {min:s[0], median:Math.round(median(s)), max:s[s.length-1]}; };
function medians(c){
  return { total:c.length,
    spread:{ wordCount:spreadOf(c.map(x=>x.wordCount)), h2Count:spreadOf(c.map(x=>x.h2Count)),
             h3Count:spreadOf(c.map(x=>x.h3Count)), listCount:spreadOf(c.map(x=>x.listCount)),
             statCount:spreadOf(c.map(x=>x.statCount)), questionHeadingCount:spreadOf(c.map(x=>x.questionHeadingCount)) },
    wordCount:Math.round(median(c.map(x=>x.wordCount))),
    h2Count:Math.round(median(c.map(x=>x.h2Count))),
    h3Count:Math.round(median(c.map(x=>x.h3Count))),
    listCount:Math.round(median(c.map(x=>x.listCount))),
    statCount:Math.round(median(c.map(x=>x.statCount))),
    questionHeadingCount:Math.round(median(c.map(x=>x.questionHeadingCount))),
    kwInTitleN:c.filter(x=>x.kwInTitle).length,
    kwInH1N:c.filter(x=>x.kwInH1).length,
    faqN:c.filter(x=>x.questionHeadingCount>0||x.hasFaqSchema).length,
    tableN:c.filter(x=>x.tableCount>0).length,
    schemaN:c.filter(x=>x.hasFaqSchema||x.hasProductSchema).length };
}
function foldT(t){ return String(t||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }
const GLUE_T = {of:1,for:1,as:1,the:1,a:1,an:1,to:1,in:1,on:1,de:1,'&':1,and:1};
// "IoT" is the initials of "Internet of Things"; "GPS" of "Global Positioning System".
function initialsOf(term){
  const w=String(term||'').split(/\s+/).filter(Boolean);
  if(w.length<2) return [];
  const all=w.map(x=>x[0]).join('').toLowerCase();
  const noGlue=w.filter(x=>!GLUE_T[x.toLowerCase()]).map(x=>x[0]).join('').toLowerCase();
  return noGlue.length>=2 ? [all,noGlue] : [all];
}
function sameConcept(a,b){
  const fa=foldT(a), fb=foldT(b);
  if(fa===fb) return true;
  if(fa.length>=3 && fb.length>=3 && (fa===fb+'s'||fb===fa+'s')) return true;
  const wa=fa.split(' '), wb=fb.split(' ');
  // one is a whole-word sub-phrase of the other ("Positioning System" inside "Global Positioning System")
  const shorter=wa.length<=wb.length?wa:wb, longer=wa.length<=wb.length?wb:wa;
  if(shorter.length>=1 && longer.length>shorter.length){
    for(let i=0;i+shorter.length<=longer.length;i++){
      if(longer.slice(i,i+shorter.length).join(' ')===shorter.join(' ')) return true; }
  }
  if(initialsOf(a).indexOf(fb.replace(/ /g,''))!==-1 || initialsOf(b).indexOf(fa.replace(/ /g,''))!==-1) return true;
  return false;
}
// Category vocabulary as CONCEPTS: every surface form of one idea ("Internet of Things",
// "IoT", "Internet Things") is one group with one document frequency, never ten separate
// "missing terms". The canonical form is the one the ranking pages use most.
function categoryEntities(c, ownDomain, minDf, top){
  minDf = minDf || Math.min(3, Math.max(2, Math.floor(c.length/3)));
  const df = new Map();
  c.forEach(function(p,pi){ new Set(p.entities||[]).forEach(function(e){
    if(!df.has(e)) df.set(e,new Set()); df.get(e).add(pi); }); });
  const own = (ownDomain||'').split('.')[0].toLowerCase();
  const terms = Array.from(df.entries())
    .filter(x => x[0].length>2 && (!own || x[0].toLowerCase().indexOf(own)===-1))
    .sort((a,b)=>b[1].size-a[1].size || b[0].length-a[0].length);
  const groups=[];
  terms.forEach(function(x){
    const term=x[0], pages=x[1];
    // Only a term that itself clears the bar can open a group; a one-page fragment may
    // still join an existing concept, which is exactly how fragments get absorbed.
    let g=null;
    for(let i=0;i<groups.length;i++){ if(sameConcept(groups[i].canonical,term)){ g=groups[i]; break; } }
    if(g){ if(g.variants.indexOf(term)===-1 && g.variants.length<8) g.variants.push(term); pages.forEach(pi=>g.pages.add(pi)); }
    else if(pages.size>=minDf) groups.push({canonical:term, variants:[], pages:new Set(pages)});
  });
  return groups.map(g=>({canonical:g.canonical, variants:g.variants, df:g.pages.size}))
    .filter(g=>g.df>=minDf).sort((a,b)=>b.df-a.df).slice(0, top||40);
}
// Which bucket a missing term belongs in decides whether adding it is right or reckless.
function classifyTerm(term, serpDomains, siteLinkText, ownDomain){
  // Named on the site itself (navigation, links, alt text) beats everything: a reseller's
  // partner brand ranks for the keyword too, and calling it a competitor would get the single
  // most valuable term on the list thrown away.
  const site=foldT(siteLinkText||'');
  if(site && foldT(term).length>=3 && (' '+site+' ').indexOf(' '+foldT(term)+' ')!==-1) return 'OWN STACK';
  const f=foldT(term).replace(/ /g,'');
  const oneWord=!/\s/.test(String(term).trim());
  if(f.length>=3){
    for(let i=0;i<(serpDomains||[]).length;i++){
      const d=String(serpDomains[i]||'').split('.')[0].replace(/[^a-z0-9]/g,'');
      if(!d || d===String(ownDomain||'').split('.')[0]) continue;
      if(d===f || (d.length>=4 && f.indexOf(d)===0) || (f.length>=4 && d.indexOf(f)===0)) return 'COMPETITOR';
      if(oneWord && f.length>=5 && d.indexOf(f)!==-1) return 'COMPETITOR';   // "Motive" in gomotive
    }
  }
  return 'VOCABULARY';
}
function row(key,label,mine,target,earned,weight,note){
  return {key:key,label:label,mine:mine,target:target,earned:+earned.toFixed(1),weight:weight,
          pct:weight?Math.round(earned/weight*100):0,note:note||''};
}
// P21 — the word-count check only ever flagged running UNDER the median; every prompt already
// says "aim for PARITY with the median, never more", but nothing ever measured the other
// direction, so a page could run hundreds of words over and the report would stay silent.
// Informational only, by design: this never produces a fix task (ratio() already caps earned
// at full marks once mine >= target, so no task-generation threshold is touched either way) —
// it is a note attached to the baseline row, not an instruction to cut content.
function overParityNote(mine,target){
  if(!target || mine<=target*1.15) return '';
  const over=mine-target;
  return over.toLocaleString()+' words OVER the median ('+mine.toLocaleString()+' vs '+target.toLocaleString()+') — parity is the target, not a floor. Not a task: whether to trim is a judgement call, not a ranking requirement.';
}
function scoreRank(p,m){
  const W=RANK_W, r=[];
  r.push(row('kwInTitle','Head term in title tag', p.kwInTitle?'yes':'absent',
    m.kwInTitleN+' of '+m.total+' pages', p.kwInTitle?W.kwInTitle:0, W.kwInTitle));
  r.push(row('kwInH1','Head term in H1', p.kwInH1?'yes':'absent',
    m.kwInH1N+' of '+m.total+' pages', p.kwInH1?W.kwInH1:0, W.kwInH1));
  r.push(row('wordCount','Body word count', p.wordCount.toLocaleString(), m.wordCount.toLocaleString(),
    W.wordCount*ratio(p.wordCount,m.wordCount), W.wordCount, overParityNote(p.wordCount,m.wordCount)));
  r.push(row('h3Count','H3 subheading depth', p.h3Count, m.h3Count,
    W.h3Count*ratio(p.h3Count,m.h3Count), W.h3Count));
  r.push(row('h2Count','H2 section count', p.h2Count, m.h2Count,
    W.h2Count*ratio(p.h2Count,m.h2Count), W.h2Count));
  r.push(row('listCount','Bulleted / numbered lists', p.listCount, m.listCount,
    W.listCount*ratio(p.listCount,m.listCount), W.listCount));
  const faq = p.questionHeadingCount>0 || p.hasFaqSchema;
  r.push(row('faq','FAQ / Q&A block', faq?'yes':'no', m.faqN+' of '+m.total+' pages', faq?W.faq:0, W.faq));
  const tbl = p.tableCount>0;
  r.push(row('table','Comparison table', tbl?'yes':'no', m.tableN+' of '+m.total+' pages', tbl?W.table:0, W.table));
  r.push(row('kwInMeta','Head term in meta description', p.kwInMeta?'yes':'absent','—',
    p.kwInMeta?W.kwInMeta:0, W.kwInMeta));
  return [Math.round(r.reduce((s,x)=>s+x.earned,0)), r];
}
// vis (optional): { text: rendered innerText, reliable: bool }. A concept found in the served
// HTML but not in the rendered visible text is PRESENT BUT HIDDEN - a crawler sees it, a
// person does not - and is scored as NOT covered. Only trusted when the render's own
// self-check passed; otherwise the served text decides and the state says so.
function scoreAnswer(p,m,cov,cats,vis){
  const W=ANSWER_W, r=[];
  const hid = p.jsHiddenStatCount||0;
  r.push(row('stats','Quantified, attributable claims', p.statCount, m.statCount,
    W.stats*ratio(p.statCount,m.statCount), W.stats,
    hid ? (hid+' of these exist only in counter attributes, absent from the served text') : ''));
  // Answer engines lift the text under a question heading, so the floor is 3 even when the
  // ranking pages use none - but that case is labelled as an answer-layer recommendation,
  // not parity, and the task it produces is demoted (see buildFixes).
  const qt = Math.max(m.questionHeadingCount,3);
  r.push(row('questionHeadings','Question-shaped headings', p.questionHeadingCount, qt,
    W.questionHeadings*ratio(p.questionHeadingCount,qt), W.questionHeadings,
    m.questionHeadingCount===0 ? 'ranking-set median is 0; target of 3 is an answer-layer floor, not parity' : ''));
  const tbl = p.tableCount>0;
  r.push(row('table','Extractable spec / comparison table', tbl?'yes':'no','yes', tbl?W.table:0, W.table));
  const sch = p.hasFaqSchema||p.hasProductSchema;
  r.push(row('schema','FAQPage / Product / Service schema', sch?'yes':'none found',
    m.schemaN+' of '+m.total+' pages', sch?W.schema:0, W.schema,
    p.schemaTopLevel ? ((p.schemaTopLevel.length+' top-level: '+p.schemaTopLevel.slice(0,6).join(', '))
      +((p.schemaClaimsAbsent||0)>0 ? ' · '+p.schemaClaimsAbsent+' declared item(s) not found in page text' : ''))
      : ((p.schemaTypes||[]).slice(0,6).join(', ')||'no JSON-LD found')));
  const mineText = ' '+foldT((p.entities||[]).join(' | '))+' '+foldT(p.bodyText||'')+' ';
  const visText = vis && vis.reliable && vis.text ? ' '+foldT(vis.text)+' ' : null;
  const inText = function(g, txt){ return [g.canonical].concat(g.variants||[], initialsOf(g.canonical).filter(function(x){return x.length>=3;})).some(function(v){ const fv=foldT(v); if(!fv) return false;
    return new RegExp(' '+fv.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(s|es)? ').test(txt) || (fv.length>4 && /s$/.test(fv) && txt.indexOf(' '+fv.replace(/s$/,'')+' ')!==-1); }); };
  const states = cats.map(function(g){
    const served = inText(g, mineText);
    if(!served) return {canonical:g.canonical, state:'ABSENT'};
    if(visText && !inText(g, visText)) return {canonical:g.canonical, state:'PRESENT BUT HIDDEN'};
    return {canonical:g.canonical, state: visText ? 'PRESENT' : 'PRESENT (visibility unverified)'};
  });
  const hit = states.filter(function(s){return s.state.indexOf('PRESENT')===0 && s.state!=='PRESENT BUT HIDDEN';});
  const hiddenN = states.filter(function(s){return s.state==='PRESENT BUT HIDDEN';}).length;
  const missing = states.filter(function(s){return s.state==='ABSENT' || s.state==='PRESENT BUT HIDDEN';}).map(function(s){return s.canonical;});
  r.push(row('entities','Category concept coverage', hit.length+' of '+cats.length, cats.length,
    W.entities*ratio(hit.length, Math.max(cats.length,1)), W.entities,
    (missing.length?('missing: '+missing.slice(0,12).join(', ')):'')+(hiddenN?' · '+hiddenN+' present in HTML but hidden from visitors (counted as missing)':'')));
  const peer = cov.peerMedian||1;
  r.push(row('coverage','Observed answer-set coverage', cov.mine+'/'+cov.queries,
    peer+'/'+cov.queries, W.coverage*ratio(cov.mine,peer), W.coverage));
  return [Math.round(r.reduce((s,x)=>s+x.earned,0)), r, missing, states];
}
// P22 — every point below 100 has to be traceable: claimed by a task above, or explicitly
// declared residual, so "nothing left to do" and "the tool ran out of ideas" never read the
// same in a report. gap() only turns a row into a task once it drops under 85% of its own
// weight; a row sitting at, say, 90% is missing real points that no task will ever mention.
// This walks every row in the table, splits its shortfall into MAPPED (a fix task with this
// key exists in the report) or RESIDUAL (it does not — usually because the row is above the
// task-generation threshold), and totals both so the gap always adds up.
function scoreReconciliation(rows, fixes, label){
  const fixKeys=new Set((fixes||[]).map(function(f){return f.key;}));
  const total=+rows.reduce(function(s,x){return s+x.weight;},0).toFixed(1);
  const earned=+rows.reduce(function(s,x){return s+x.earned;},0).toFixed(1);
  let mappedPts=0; const residual=[];
  rows.forEach(function(r){
    const short=+(r.weight-r.earned).toFixed(1);
    if(short<=0.05) return;
    if(fixKeys.has(r.key)) mappedPts+=short; else residual.push({key:r.key,label:r.label,short:short,pct:r.pct});
  });
  const residualPts=+residual.reduce(function(s,x){return s+x.short;},0).toFixed(1);
  return {label:label,total:total,earned:earned,missing:+(total-earned).toFixed(1),
          mappedPts:+mappedPts.toFixed(1),residualPts:residualPts,residual:residual};
}
function reconcileText(rc){
  if(rc.missing<=0.05) return rc.label+' is '+rc.earned+'/'+rc.total+' — every point earned, nothing to reconcile.';
  let s=rc.label+' is '+rc.earned+'/'+rc.total+' ('+rc.missing+' point'+(rc.missing===1?'':'s')+' short of 100). ';
  const parts=[];
  if(rc.mappedPts>0.05) parts.push(rc.mappedPts+' point'+(rc.mappedPts===1?'':'s')+' claimed by a task above');
  if(rc.residualPts>0.05) parts.push(rc.residualPts+' point'+(rc.residualPts===1?'':'s')+' declared unreachable this scan — no task exists for '
    +rc.residual.map(function(x){return x.label+' ('+x.pct+'%, '+x.short+' pt'+(x.short===1?'':'s')+' short)';}).join(', ')
    +', each already at or above the threshold that generates a task, so the shortfall is fractional, not a missing idea');
  s+=parts.join('; ')+'.';
  return s;
}

// ---- Confidence: how much of a score is the page, and how much is the sample ----------
// Leave one competitor out, rescore, repeat. The spread of the results is how far the score
// can move without the page changing at all - which is exactly what an operator saw when
// two scans of an unchanged page came back 87 then 88.
function looBand(comps, mine, cov, ownDomain, vis){
  if(comps.length<3) return null;
  let rMin=101,rMax=-1,aMin=101,aMax=-1;
  // The medians are what generate the instructions, so they get the same treatment as the
  // scores: the range each one covers across leave-one-out samples.
  const keys=['wordCount','h2Count','h3Count','listCount','statCount','questionHeadingCount'];
  const mb={}; keys.forEach(function(k){ mb[k]=[Infinity,-Infinity]; });
  for(let i=0;i<comps.length;i++){
    const sub=comps.filter(function(x,j){return j!==i;});
    const mm=medians(sub), cc=categoryEntities(sub,ownDomain);
    const r=scoreRank(mine,mm)[0], a=scoreAnswer(mine,mm,cov,cc,vis)[0];
    rMin=Math.min(rMin,r); rMax=Math.max(rMax,r); aMin=Math.min(aMin,a); aMax=Math.max(aMax,a);
    keys.forEach(function(k){ mb[k][0]=Math.min(mb[k][0],mm[k]); mb[k][1]=Math.max(mb[k][1],mm[k]); });
  }
  return {rank:[rMin,rMax], answer:[aMin,aMax], n:comps.length, medians:mb};
}
// The gate self-check as exact counts, never a boolean: "36 markers at first paint → 35/36
// released, 1 still hidden (“More Info”)". "0 still hidden" is printed only when it is 0.
function gateLine(g){ return !g ? 'not available on this render'
  : (g.summary || (g.state==='none' ? 'no entrance-animation markers on the page'
     : g.atLoad.markers+' marker'+(g.atLoad.markers===1?'':'s')+' at first paint → '+(g.releasedCount!=null?g.releasedCount:g.released)+'/'+g.atLoad.markers+' released, '+g.afterScroll.hidden+' still hidden'
       +(g.afterScroll.hidden&&g.residual&&g.residual.length?' ('+g.residual.slice(0,3).map(function(x){return '“'+(x.ctaText||x.text||'').slice(0,40)+'”';}).join(', ')+(g.residual.length>3?', …':'')+')':''))); }
function gateVerdict(g){ return !g ? '' : g.state==='none' ? '' : g.state==='released' ? 'GATE RELEASED — every marked element re-read visible; hidden findings are credible'
  : g.state==='partial' ? 'PARTIALLY RELEASED — the '+g.afterScroll.hidden+' still hidden are real residuals, listed as findings'
  : 'GATE DID NOT RELEASE — nothing fired; may not reproduce in a real browser, nothing behind it is asserted as hidden'; }
// Served-vs-rendered word count check. Two independent measurements of the same page.
// A = served HTML through the regex parser. B = the rendered page: painted text (text nodes
// whose ancestors all pass a paint test) PLUS reachable text (carousel slides and tab panels
// one click away, parsed by any crawler; P11). Different source AND different code path, so
// the check can fail. When they differ by more than 20% that is a BASIS DIFFERENCE — two
// different quantities, each explained by its composition — never "unreliable" (P14).
// Which one is SCORED is decided by the comparison basis (P12): the served figure unless every
// page in the comparison was rendered, so one median is never built from two bases.
function wordCheck(p, r, basis){
  if(!r || !r.ok || !r.renderedWords) return null;
  const rw=r.renderedWords;
  const served=(p.wordCountServed!=null?p.wordCountServed:p.wordCount)||0, rm=rw.main||0, rp=rw.page||0;
  const reach=(rw.reachable&&rw.reachable.main)||0, reachPage=(rw.reachable&&rw.reachable.page)||0;
  const rendered=rw.scored!=null?rw.scored:rm+reach;
  const dom=r.parsed&&r.parsed.wordCount!=null ? r.parsed.wordCount : null;
  const diffPct=Math.round(Math.abs(served-rendered)/Math.max(served,rendered,1)*100);
  const paintedOnlyPct=Math.round(Math.abs(served-rm)/Math.max(served,rm,1)*100);
  const basisDifference=diffPct>20;
  basis = basis==='rendered' ? 'rendered' : 'served';
  const acc=rw.carouselAccounting||null, b=rw.buckets||null;
  // What the difference IS, so it can be named instead of being called unreliable.
  const parts=[];
  if(acc&&acc.totals&&acc.totals.cloneWords) parts.push(acc.totals.clones+' carousel clone slides ('+acc.totals.cloneWords.toLocaleString()+' words) excluded on both sides');
  if(reach) parts.push(reach.toLocaleString()+' words in '+((rw.reachable&&rw.reachable.carouselItems)||0)+' off-stage carousel slide(s)'+((rw.reachable&&rw.reachable.panels)?' and '+rw.reachable.panels+' closed tab panel(s)':'')+' counted as REACHABLE');
  const residual=served-rendered;
  if(Math.abs(residual)>0) parts.push(Math.abs(residual).toLocaleString()+' words '+(residual>0?'served but not painted or reachable (script-gated, display:none, or inside a hidden template wrapper)':'painted but absent from served HTML (script-mounted)'));
  return { served:served, servedRegion:p.wordRegion||'main content', renderedMain:rm, renderedPage:rp, reachable:reach, reachablePage:reachPage, rendered:rendered, renderedRegion:rw.mainRegion||'', renderedDomRule:dom,
           innerTextMain:rw.innerTextMain, textContentMain:rw.textContentMain, carousels:rw.carousels||[], buckets:b, accounting:acc, firstPaint:rw.firstPaint||null, measuredAt:rw.measuredAt||null,
           clones:p.carouselCloneCount||0, cloneWords:p.carouselCloneWords||0, cloneLog:p.carouselClones||[],
           diffPct:diffPct, paintedOnlyPct:paintedOnlyPct, basisDifference:basisDifference, unreliable:basisDifference, explain:parts.join('; '),
           basis:basis, scored:basis, scoredWords:basis==='rendered'?rendered:served,
           gateStuck:!!(r.gate&&r.gate.state==='stuck') };
}
function wordCheckText(w){ return !w ? '' : (w.basisDifference
  ? 'BASIS DIFFERENCE '+w.diffPct+'% — served '+w.served.toLocaleString()+' · rendered '+w.rendered.toLocaleString()+' ('+w.renderedMain.toLocaleString()+' painted + '+w.reachable.toLocaleString()+' reachable). '+(w.explain?'The difference is: '+w.explain+'. ':'')+'Scored figure: '+w.scored+' ('+w.scoredWords.toLocaleString()+'), the basis every page in this comparison shares.'
  : 'served '+w.served.toLocaleString()+' · rendered '+w.rendered.toLocaleString()+' ('+w.renderedMain.toLocaleString()+' painted + '+w.reachable.toLocaleString()+' reachable) · '+w.diffPct+'% apart — counts consistent; scored figure: '+w.scored+' ('+w.scoredWords.toLocaleString()+')')
  +(w.clones?' · '+w.clones+' served carousel clone slide(s) carrying '+w.cloneWords+' words dropped ('+w.cloneLog.map(function(c){return c.count+' by '+c.selector;}).join(', ')+')':''); }
// Carousel clone drops, one line per selector, for the METHODOLOGY block.
function cloneLines(p, r){
  const served=(p.carouselClones||[]);
  const lines=served.map(function(c){return c.count+' matched by `'+c.selector+'` ('+c.words+' words'+(c.kind==='fallback'?', generic fallback':'')+') in served HTML';});
  if(!served.length) lines.push('0 matched in served HTML (a runtime carousel builds its clones after load; see the rendered accounting)');
  else if(!served.some(function(c){return c.kind==='fallback';})) lines.push('0 matched by generic fallback');
  const rc=r&&r.ok&&r.renderedWords&&r.renderedWords.carousels||[];
  rc.forEach(function(c){ lines.push('rendered: '+c.count+' × '+c.selector+' — '+(c.paintedElements!=null?c.paintedElements+' painted element(s), ':'')+c.painted+' with painted text, '+c.paintedWords+' of '+c.textContentWords+' words painted (innerText '+c.innerTextWords+')'); });
  return lines;
}
// P10 / P17: the composition of the scored rendered count and the per-container carousel
// accounting, every line from the same measurement pass (one measuredAt).
function compositionLines(w){
  if(!w||!w.buckets) return [];
  const b=w.buckets, acc=w.accounting, fmt=function(n){return Number(n||0).toLocaleString();};
  const when=w.measuredAt?' (measured at settle, '+(w.measuredAt.msSinceNavigation/1000).toFixed(1)+' s after navigation, '+w.measuredAt.wallClock+')':'';
  const out=['Painted words, '+(w.renderedRegion||'<main>')+' ...... '+fmt(w.renderedMain)+' total'+when,
    '                             '+fmt(b.body)+' body copy',
    '                             '+fmt(b.carousel)+' carousel'+(acc&&acc.totals?' ('+acc.totals.painted+' painted slide(s); '+acc.totals.reachable+' more reachable = '+fmt(acc.totals.reachableWords)+' words; '+acc.totals.clones+' clones excluded)':''),
    '                             '+fmt(b.feed)+' feed / loop grid',
    '                             '+fmt(b.other)+' other (nav, header, footer, form inside the region)'];
  const sum=(b.body||0)+(b.carousel||0)+(b.feed||0)+(b.other||0);
  out.push('                             composition '+(sum===w.renderedMain?'sums to the total ✓':'DOES NOT SUM ('+fmt(sum)+' vs '+fmt(w.renderedMain)+') — the render should have refused to emit this'));
  out.push('Reachable, not painted ..... '+fmt(w.reachable)+' words'+(acc&&acc.totals?' in '+acc.totals.reachable+' carousel slide(s)':'')+' one click away, in the DOM a crawler parses (P11)');
  out.push('Rendered figure ............ '+fmt(w.rendered)+' = '+fmt(w.renderedMain)+' painted + '+fmt(w.reachable)+' reachable');
  if(w.firstPaint&&!w.firstPaint.error) out.push('First paint, no input ...... painted '+fmt(w.firstPaint.main)+' · innerText '+fmt(w.firstPaint.innerTextMain)+' ('+(w.firstPaint.measuredAt.msSinceNavigation/1000).toFixed(1)+' s after navigation, before any scroll) — what a hand count at the top of a fresh page sees; entrance animations below the fold have not fired yet');
  if(acc&&acc.containers&&acc.containers.length){
    out.push('Carousel accounting ........ '+acc.totals.items+' items in '+acc.containers.length+' container(s) = '+acc.totals.clones+' clones + '+acc.totals.painted+' painted + '+acc.totals.reachable+' reachable + '+acc.totals.excluded+' excluded, all classified');
    acc.containers.forEach(function(c){ out.push('  '+(c.container.slice(0,42)+' ('+c.label+')').padEnd(60,'.')+' '+c.items+' items = '+c.clones+' clones + '+c.painted+' painted ('+fmt(c.paintedWords)+'w) + '+c.reachable+' reachable ('+fmt(c.reachableWords)+'w) + '+c.excluded+' excluded'+(Object.keys(c.excludedWhy||{}).length?' ('+Object.keys(c.excludedWhy).map(function(k){return c.excludedWhy[k]+' '+k;}).join(', ')+')':'')); });
  }
  return out;
}
// "median 4 (range 2–5 across leave-one-out)"
const medText = (b,m,k) => { const v=Number(m[k]||0).toLocaleString(); if(!b||!b.medians||!b.medians[k]) return v;
  const r=b.medians[k]; return r[0]===r[1] ? v+' (stable across leave-one-out)' : v+' (range '+Number(r[0]).toLocaleString()+'–'+Number(r[1]).toLocaleString()+' across leave-one-out)'; };
const bandText = (b,k) => !b ? '' : (b[k][0]===b[k][1] ? 'stable across competitor samples' : 'band '+b[k][0]+'–'+b[k][1]+' across competitor samples');

// ---- Rendered vs served -----------------------------------------------------------------
// Three texts, two directions. (a) served HTML, (b) rendered DOM, (c) innerText, which
// respects visibility. Served-but-not-in-innerText is content a crawler gets and a visitor
// does not; innerText-but-not-served is content a non-JS crawler never sees. Both are
// defects, and they are opposite ones.
// P4 — a container the served HTML hides may be emptied by a widget at mount, its children
// moved into the visible DOM. Every served heading found inside a hidden container is looked
// up in the rendered heading list by level and text: painted anywhere → RELOCATED_VISIBLE;
// present but not painted → HIDDEN (with the reason); absent → GONE. A hidden container whose
// served heading count drops to zero after render is flagged CONTAINER RELOCATED.
function reconcileHidden(p, r){
  if(!r || !r.ok || !Array.isArray(r.headingList)) return null;
  const states={}, details=[];
  (p.outline||[]).filter(function(h){return h.hidden;}).forEach(function(h){
    const key=foldT(h.text);
    const cands=r.headingList.filter(function(x){return x.level===h.level && foldT(x.text)===key;});
    let state, why='';
    if(!cands.length) state='GONE';
    else if(cands.some(function(x){return x.painted;})){ state='RELOCATED_VISIBLE'; why='painted at y='+cands.filter(function(x){return x.painted;}).map(function(x){return x.top;}).join(', '); }
    else { state='HIDDEN'; why=cands.map(function(x){return x.why;}).filter(Boolean)[0]||'not painted'; }
    if(!states[key] || state==='RELOCATED_VISIBLE') states[key]=state;
    if(details.length<40) details.push({level:h.level,text:h.text.slice(0,90),hiddenBy:h.hiddenBy||'',state:state,why:why});
  });
  const relocated=[];
  (p.hiddenContainers||[]).forEach(function(c){
    if(!c.headings) return;
    const cls=(c.cls||'').split(' ')[0];
    const now=(r.hiddenNow||[]).find(function(x){return cls && (x.cls||'').split(' ').indexOf(cls)!==-1;});
    const renderedHeadings=now?now.headings:null;
    // P4 v2 fix — a container is only CONTAINER RELOCATED when ITS OWN headings are the ones
    // confirmed painted elsewhere, never "some heading somewhere on the page relocated". The
    // old check fired on ANY container whose class wasn't found in r.hiddenNow (renderedHeadings
    // null) as soon as ANY hidden heading anywhere had state RELOCATED_VISIBLE — a false
    // positive on every unrelated container the instant one real relocation existed on the page.
    const ownTexts=(c.headingTexts||[]).map(function(t){
      const mm=String(t||'').match(/^H([1-6])\s+([\s\S]*)$/);
      return mm ? {level:+mm[1], key:foldT(mm[2])} : null;
    }).filter(Boolean);
    const prefixMatch=function(a,b){ return !!a && !!b && (a.indexOf(b)===0 || b.indexOf(a)===0); };
    const ownConfirmedRelocated = ownTexts.length>0 && ownTexts.every(function(ot){
      return details.some(function(d){ return d.level===ot.level && d.state==='RELOCATED_VISIBLE' && prefixMatch(foldT(d.text),ot.key); });
    });
    if(renderedHeadings===0 || (renderedHeadings===null && ownConfirmedRelocated))
      relocated.push({tag:c.tag,cls:c.cls,reason:c.reason,servedHeadings:c.headings,renderedHeadings:renderedHeadings===null?0:renderedHeadings,headingTexts:c.headingTexts||[]});
  });
  return { headingStates:states, details:details, relocated:relocated,
           relocatedVisible:details.filter(function(d){return d.state==='RELOCATED_VISIBLE';}).length,
           stillHidden:details.filter(function(d){return d.state==='HIDDEN';}).length,
           gone:details.filter(function(d){return d.state==='GONE';}).length };
}
function relocationLines(rc){
  if(!rc) return [];
  const out=[];
  rc.relocated.forEach(function(c){ out.push('CONTAINER RELOCATED — <'+c.tag+(c.cls?' class="'+c.cls+'"':'')+'> is '+c.reason+' in served HTML but holds '+c.renderedHeadings+' of its '+c.servedHeadings+' served headings after render. Its content was moved into the visible DOM by a widget. Findings that call this content "hidden from visitors" are WRONG for this page. Re-verify before acting.'); });
  rc.details.forEach(function(d){ out.push('H'+d.level+' “'+d.text.slice(0,70)+'” — served inside a hidden container ('+d.hiddenBy+') → '+d.state+(d.why?' ('+d.why+')':'')); });
  return out;
}
function renderDiff(p, r){
  if(!r || !r.ok) return null;
  const inner=' '+foldT(r.innerText||'')+' ', dom=' '+foldT(r.domText||'')+' ';
  const served=' '+foldT((p.servedBlocks||[]).join(' | '))+' '+foldT(p.bodyText||'')+' ';
  const servedNotVisible=[], visibleNotServed=[];
  (p.servedBlocks||[]).forEach(function(seg){
    const f=foldT(seg); if(f.length<10) return;
    if(inner.indexOf(f)!==-1) return;
    servedNotVisible.push({text:seg, inDom: dom.indexOf(f)!==-1});
  });
  // P16 — a line that a third-party script inserted (the renderer attributes every DOM insertion
  // to the script host that made it), or that sits in a body-level container named like a chat /
  // cookie / promo widget, is VOLATILE: it can differ between two scans of a byte-identical page
  // (after-hours chat status, a dismissed banner, an A/B test). Tracked apart from page findings.
  const injected=(r.injected||[]);
  const injText=injected.map(function(x){ return {x:x, f:' '+foldT((x.lines||[]).join(' '))+' '}; });
  const VOLATILE_TEXT_RE=/\b(we are online|we're online|we are offline|chat with|start a chat|leave a message|available m-f|cookies?|accept all|privacy (policy|settings)|your privacy|consent)\b/i;
  const volatile=[];
  const volatileOf=function(t){
    const f=' '+foldT(t)+' ';
    for(let i=0;i<injText.length;i++){ const it=injText[i];
      if(it.f.indexOf(f.trim()?' '+f.trim()+' ':f)!==-1 || (f.length>20 && f.indexOf(it.f.trim())!==-1 && it.f.trim().length>10)) return {host:it.x.host||'', how:it.x.how, where:(it.x.topId?'#'+it.x.topId:'')+(it.x.topCls?' .'+it.x.topCls.split(' ')[0]:'')};
      const w=f.trim().split(' '); if(w.length>=3){ let hit=0,n=0; for(let k=0;k+3<=w.length;k++){ n++; if(it.f.indexOf(' '+w.slice(k,k+3).join(' ')+' ')!==-1) hit++; } if(n&&hit/n>=0.6) return {host:it.x.host||'', how:it.x.how, where:(it.x.topId?'#'+it.x.topId:'')+(it.x.topCls?' .'+it.x.topCls.split(' ')[0]:'')}; }
    }
    if(VOLATILE_TEXT_RE.test(t)) return {host:'', how:'text matches a chat / cookie / consent widget pattern', where:''};
    return null;
  };
  String(r.innerText||'').split(/\n+/).forEach(function(line){
    const t=line.replace(/\s+/g,' ').trim(); if(t.length<12 || !/[A-Za-z]{3,}/.test(t)) return;
    const f=foldT(t); if(f.length<10) return;
    if(served.indexOf(f)!==-1) return;
    // innerText joins adjacent inline elements into one line; the served side keeps them as
    // separate blocks. If most of the line's 3-word shingles exist in the served text, it is
    // served content re-flowed by the browser, not script-injected.
    const w=f.split(' '); if(w.length>=4){ let hit=0, n=0;
      for(let i=0;i+3<=w.length;i++){ n++; if(served.indexOf(' '+w.slice(i,i+3).join(' ')+' ')!==-1) hit++; }
      if(n && hit/n>=0.5) return; }
    const v=volatileOf(t);
    if(v){ if(volatile.length<40 && !volatile.some(function(x){return x.text===t;})) volatile.push({text:t.slice(0,160), host:v.host, how:v.how, where:v.where}); return; }
    if(visibleNotServed.length<80 && !visibleNotServed.some(function(x){return x.text===t;})) visibleNotServed.push({text:t.slice(0,160)});
  });
  // Widget lines the renderer saw but innerText split differently still count as volatile.
  injected.forEach(function(x){ (x.lines||[]).forEach(function(l){ const f=foldT(l); if(f.length<10||served.indexOf(f)!==-1) return; if(volatile.length<40 && !volatile.some(function(y){return foldT(y.text)===f||foldT(y.text).indexOf(f)!==-1||f.indexOf(foldT(y.text))!==-1;})) volatile.push({text:l.slice(0,160), host:x.host||'', how:x.how, where:(x.topId?'#'+x.topId:'')+(x.topCls?' .'+x.topCls.split(' ')[0]:'')}); }); });
  // The renderer labels WHY each element is hidden. Menus, carousel slides, closed dialogs,
  // tabs and screen-reader text are hidden by design on nearly every site; reporting them as
  // findings is the overclaim the operator test caught. Only 'content' (or anything inside a
  // stuck entrance-animation wrapper) can become a task.
  const ctxOf=function(h){ if(h.context) return h.context; return h.kind==='screen-reader-only'?'screen-reader':'content'; };
  const all=(r.hidden||[]);
  // The render's self-check. If the entrance-animation gate never released (marker count
  // did not drop after a full scroll), anything hidden behind it is UNVERIFIED — a headless
  // artifact is as likely as a defect — and it is kept out of the findings entirely.
  const gate=r.gate||null;
  const gateStuck=!!(gate && gate.state==='stuck');
  // Elements inside a marker that was inserted AFTER first paint (a widget mounted its
  // template late) are UNVERIFIED too: the identity check never saw them, and a real browser
  // may well reveal them on the first scroll. Never a hidden-content finding.
  const lateN=(gate&&gate.late&&gate.late.hidden)||0;
  const unverified=all.filter(function(h){return (gateStuck && h.gated) || h.late;});
  const hidden=all.filter(function(h){return !(gateStuck && h.gated) && !h.late && (h.gated || ctxOf(h)==='content');});
  const byDesign=all.filter(function(h){return !(h.gated || ctxOf(h)==='content');});
  const byContext=Object.assign({}, r.hiddenByContext||{});
  if(!r.hiddenByContext){ all.forEach(function(h){ const c=ctxOf(h); byContext[c]=(byContext[c]||0)+1; }); }
  const byKind={}; hidden.forEach(function(h){ byKind[h.kind]=(byKind[h.kind]||0)+1; });
  const important=hidden.filter(function(h){return /call to action|price|statistic|form|heading/.test(h.kind);});
  // A display:none block that is NOT inside an animation wrapper is usually a modal, tab or
  // menu waiting for a click. Real, but not the stuck-reveal pattern; ranked lower.
  const priority=important.filter(function(h){return h.gated || !/^display:none|ancestor display:none/.test(h.reason);});
  const designCount=Object.keys(byContext).filter(function(k){return k!=='content';}).reduce(function(a,k){return a+byContext[k];},0);
  return { servedNotVisible:servedNotVisible.slice(0,80), servedNotVisibleCount:servedNotVisible.length,
           visibleNotServed:visibleNotServed, visibleNotServedCount:visibleNotServed.length,
           volatile:volatile, volatileCount:volatile.length, injectHook:!!r.injectHook,
           hidden:hidden, hiddenCount:(r.hiddenByContext&&!gateStuck&&!lateN ? (r.hiddenContentCount||0) : hidden.length), srOnlyCount:byContext['screen-reader']||0,
           late:gate&&gate.late?gate.late:null, lateSummary:gate&&gate.lateSummary||'',
           byDesign:byDesign, byDesignCount:designCount, byContext:byContext, important:important, priority:priority,
           gate:gate, gateStuck:gateStuck, unverified:unverified, unverifiedCount:gateStuck?Math.max((r.hiddenContentCount||unverified.length)-hidden.length,0):0,
           residual:(gate&&gate.residual)||[],
           gating:r.gating||{inDom:0,stillHidden:0}, counters:r.counters||[], byKind:byKind };
}

// ---- Scan history: findings carried forward, never silently dropped -------------------
// Bumped whenever a detector's rule changes. A finding that disappears across a version
// change is re-verified item by item, never marked RESOLVED on the version change alone.
const SCANNER_VERSION='10.5';
function fingerprintOf(p){
  return [p.httpTitle,(p.h1||[])[0],p.metaDescription,p.h2Count,p.h3Count,p.listCount,p.tableCount,p.wordCount,p.textSha256||''].join('|');
}
// What the page looked like, in enough detail to say WHAT changed next time — not just that
// the fingerprint moved. Headings are kept as level+text so added / removed / reworded
// headings can be named.
function snapshotOf(p, r){
  return { title:p.httpTitle||'', h1:(p.h1||[])[0]||'', meta:p.metaDescription||'',
    wordCount:p.wordCount||0, pageWordCount:p.pageWordCount||0, h2Count:p.h2Count||0, h3Count:p.h3Count||0,
    h3Hidden:p.h3Hidden||0, listCount:p.listCount||0, tableCount:p.tableCount||0, statCount:p.statCount||0,
    counterCount:p.counterCount||0, jsHiddenStatCount:p.jsHiddenStatCount||0, questionHeadingCount:p.questionHeadingCount||0,
    schemaTopLevel:(p.schemaTopLevel||[]).slice(0,12), schemaAbsent:p.schemaClaimsAbsent||0,
    dupCount:p.headingDuplicateCount||0, animMarkers:p.animationGatedElements||0, animBlocks:p.animationGatedCount||0,
    hiddenContainers:p.hiddenContainerCount||0, textSha:p.textSha256||'',
    outline:(p.outline||[]).slice(0,150).map(function(h){return 'H'+h.level+' '+h.text.slice(0,120);}),
    renderedHidden:r&&r.ok?(r.hiddenContentCount||0):null,
    // Everything scoreRank needs, so a later scan can re-score THIS page under any rules
    // version and any sample (P13 attribution).
    kwInTitle:!!p.kwInTitle, kwInH1:!!p.kwInH1, kwInMeta:!!p.kwInMeta, hasFaqSchema:!!p.hasFaqSchema, hasProductSchema:!!p.hasProductSchema,
    wordCountServed:p.wordCountServed!=null?p.wordCountServed:(p.wordCount||0), wordPainted:r&&r.ok&&r.renderedWords?(r.renderedWords.main||0):null,
    wordReachable:r&&r.ok&&r.renderedWords&&r.renderedWords.reachable?(r.renderedWords.reachable.main||0):null,
    wordBasis:p.wordScored||'served' };
}
function loadHistoryAll(url,kw){
  try{ const all=JSON.parse(localStorage.getItem('cg.hist')||'{}'); return all[histKey(url,kw)]||[]; }catch(e){ return []; }
}
// P16 — volatile lines are tracked as seen-in-N-of-M, never as NEW / RESOLVED / WITHDRAWN.
// Only scans that recorded volatile lines count toward M (tracking began in 10.5).
function volatileHistory(entries, curVolatile){
  const tracked=(entries||[]).filter(function(e){return Array.isArray(e.volatile);});
  const counts={}; tracked.forEach(function(e){ const seen=new Set(e.volatile.map(foldT)); seen.forEach(function(f){ counts[f]=(counts[f]||0)+1; }); });
  const M=tracked.length+1;
  const rows=[]; const curSet=new Set();
  (curVolatile||[]).forEach(function(v){ const f=foldT(v.text); curSet.add(f); rows.push({text:v.text, host:v.host, how:v.how, where:v.where, seen:(counts[f]||0)+1, of:M, present:true}); });
  const texts={}; tracked.forEach(function(e){ e.volatile.forEach(function(t){ texts[foldT(t)]=texts[foldT(t)]||t; }); });
  Object.keys(counts).forEach(function(f){ if(curSet.has(f)) return; rows.push({text:texts[f]||f, host:'', how:'', where:'', seen:counts[f], of:M, present:false}); });
  return { rows:rows, scans:M, trackingSince:tracked.length?tracked[0].stamp:null };
}
function histKey(url,kw){ return foldT(url)+'|'+foldT(kw); }
function loadHistory(url,kw){
  try{ const all=JSON.parse(localStorage.getItem('cg.hist')||'{}'); const arr=all[histKey(url,kw)]||[]; return arr.length?arr[arr.length-1]:null; }catch(e){ return null; }
}
function saveHistory(url,kw,entry){
  try{ const all=JSON.parse(localStorage.getItem('cg.hist')||'{}'); const k=histKey(url,kw);
    // Only the newest entry keeps the SERP / competitor cache (it is the only one reused).
    const older=(all[k]||[]).map(function(e){ const o=Object.assign({},e); delete o.serpCache; return o; });
    all[k]=older.concat([entry]).slice(-6);
    try{ localStorage.setItem('cg.hist',JSON.stringify(all)); }
    catch(e2){ const noCache=Object.assign({},entry); delete noCache.serpCache; all[k]=older.concat([noCache]).slice(-6); localStorage.setItem('cg.hist',JSON.stringify(all)); }
  }catch(e){}
}
// The concrete differences between two snapshots, as lines a person can check. Empty array =
// nothing enumerable moved (the fingerprint alone differs: wording or markup inside blocks).
function whatChanged(a,b){
  if(!a||!b) return null;
  const out=[];
  const q=function(s){return '“'+String(s||'').slice(0,70)+'”';};
  if(a.title!==b.title) out.push('title: '+q(a.title)+' → '+q(b.title));
  if(a.h1!==b.h1) out.push('H1: '+q(a.h1)+' → '+q(b.h1));
  if(a.meta!==b.meta) out.push('meta description changed');
  const A=a.outline||[], B=b.outline||[];
  const cnt=function(arr){const m={}; arr.forEach(function(x){m[x]=(m[x]||0)+1;}); return m;};
  const ca=cnt(A), cb=cnt(B);
  const removed=[], added=[];
  Object.keys(ca).forEach(function(k){ if((cb[k]||0)<ca[k]) removed.push(k+(ca[k]-(cb[k]||0)>1?' ×'+(ca[k]-(cb[k]||0)):'')); });
  Object.keys(cb).forEach(function(k){ if((ca[k]||0)<cb[k]) added.push(k+(cb[k]-(ca[k]||0)>1?' ×'+(cb[k]-(ca[k]||0)):'')); });
  if(removed.length) out.push('headings removed: '+removed.slice(0,6).join('; ')+(removed.length>6?' (+'+(removed.length-6)+' more)':''));
  if(added.length) out.push('headings added: '+added.slice(0,6).join('; ')+(added.length>6?' (+'+(added.length-6)+' more)':''));
  // The word count compared is the SERVED one (stable across bases); a scored figure that moved
  // because the basis changed is a rules change (attributed in P13), not a page change.
  if((a.wordCountServed!=null?a.wordCountServed:a.wordCount)!==(b.wordCountServed!=null?b.wordCountServed:b.wordCount)) out.push('word count (served): '+Number(a.wordCountServed!=null?a.wordCountServed:a.wordCount).toLocaleString()+' → '+Number(b.wordCountServed!=null?b.wordCountServed:b.wordCount).toLocaleString());
  [['h2Count','H2 count'],['h3Count','H3 count'],['listCount','lists'],['tableCount','tables'],['statCount','quantified claims'],
   ['counterCount','counter widgets'],['questionHeadingCount','question headings'],['dupCount','duplicated headings'],['animMarkers','entrance-animation markers'],
   ['hiddenContainers','declared-hidden containers'],['schemaAbsent','schema items absent from the page']].forEach(function(x){
    if((a[x[0]]||0)!==(b[x[0]]||0)) out.push(x[1]+': '+Number(a[x[0]]||0).toLocaleString()+' → '+Number(b[x[0]]||0).toLocaleString()); });
  const sa=(a.schemaTopLevel||[]).join(','), sb=(b.schemaTopLevel||[]).join(',');
  if(sa!==sb) out.push('schema types: '+(sa||'none')+' → '+(sb||'none'));
  if(a.textSha!==b.textSha && !out.some(function(l){return /word count|heading/.test(l);})) out.push('text fingerprint moved with no heading, title, meta or count change — wording or markup changed inside existing blocks (an attribute, a class, an animation setting, a sentence)');
  return out;
}
// Re-run the check that produced a prior finding against the FRESH page. Returns
// {status:'clean'|'present'|'unknown', evidence}. 'present' means the previously reported
// items are still on the page whatever the task list says; 'unknown' means this scan could
// not re-run that check (no render). Only 'clean' can ever become RESOLVED.
function recheckFinding(f, p, ctx){
  ctx=ctx||{}; const r=ctx.rendered||null, diff=ctx.diff||null, prev=ctx.prevSnap||null, cur=ctx.curSnap||null;
  const items=f.items||[];
  const gateOk=!!(r&&r.ok&&r.gate&&r.gate.state!=='stuck');
  switch(f.key){
    case 'dupHeadings': {
      const counts={}; (p.outline||[]).forEach(function(h){ const k=h.level+'|'+foldT(h.text); counts[k]=(counts[k]||0)+1; });
      const still=[], gone=[];
      items.forEach(function(t){ const ft=foldT(t); let n=0; Object.keys(counts).forEach(function(k){ const kt=k.split('|')[1]; if(kt===ft||(ft.length>12&&kt.indexOf(ft)===0)) n=Math.max(n,counts[k]); }); (n>=2?still:gone).push('“'+t.slice(0,50)+'” '+(n>=2?'still ×'+n:'now ×'+n)); });
      if(still.length) return {status:'present', evidence:'duplicate-heading check re-run on the fresh fetch: '+still.join('; ')+(gone.length?'; '+gone.join('; '):'')};
      if((p.headingDuplicateCount||0)>0) return {status:'present', evidence:'duplicate-heading check re-run on the fresh fetch: '+p.headingDuplicateCount+' duplicate(s) still found'};
      return {status:'clean', evidence:'duplicate-heading check re-run on the fresh fetch: '+(gone.length?gone.join('; '):'no duplicates found')};
    }
    case 'hiddenContent':
      if(!r||!r.ok) return {status:'unknown', evidence:'no browser render on this scan, so hidden content could not be re-checked'};
      if(!gateOk) return {status:'unknown', evidence:'the render gate did not release ('+gateLine(r.gate)+'), so hidden content could not be re-checked'};
      if(diff&&diff.hiddenCount>0) return {status:'present', evidence:'render re-run: '+diff.hiddenCount+' content element(s) still hidden'};
      return {status:'clean', evidence:'render re-run with the gate released ('+gateLine(r.gate)+'): 0 content elements hidden'};
    case 'animGate':
      if(!r||!r.ok) return {status:'unknown', evidence:'no browser render on this scan; the verify-by-eye item cannot be closed from served HTML'};
      if(!gateOk) return {status:'unknown', evidence:'the render gate did not release again ('+gateLine(r.gate)+')'};
      return {status:'clean', evidence:'render re-run: '+gateLine(r.gate)+' — the blocks were seen visible'};
    case 'jsStats': {
      const hid=(p.counters||[]).filter(function(c){return !c.inServedText;}).length;
      return hid?{status:'present', evidence:'counter check re-run: '+hid+' counter value(s) still absent from the served text'}:{status:'clean', evidence:'counter check re-run: every counter value now appears in the served text'};
    }
    case 'schemaMismatch': {
      const abs=(p.schemaClaims||[]).filter(function(x){return !x.present;}).length;
      if(abs>0||(p.hasFaqSchema&&(p.questionHeadingCount||0)<2)) return {status:'present', evidence:'schema check re-run: '+abs+' schema item(s) still absent from the page text'};
      return {status:'clean', evidence:'schema check re-run: every declared item now matches page text'};
    }
    case 'kwInTitle': return p.kwInTitle?{status:'clean',evidence:'title now contains the head term: “'+(p.httpTitle||'').slice(0,70)+'”'}:{status:'present',evidence:'title still lacks the head term: “'+(p.httpTitle||'').slice(0,70)+'”'};
    case 'kwInH1': return p.kwInH1?{status:'clean',evidence:'H1 now contains the head term'}:{status:'present',evidence:'H1 still lacks the head term: “'+((p.h1||[])[0]||'').slice(0,70)+'”'};
    case 'kwInMeta': return p.kwInMeta?{status:'clean',evidence:'meta description now contains the head term'}:{status:'present',evidence:'meta description still lacks the head term'};
    case 'schema': return (p.hasFaqSchema||p.hasProductSchema)?{status:'clean',evidence:'FAQ / product schema now present: '+(p.schemaTopLevel||[]).join(', ')}:{status:'present',evidence:'still no FAQ / product schema'};
    case 'table': return (p.tableCount||0)>0?{status:'clean',evidence:'page now has '+p.tableCount+' table(s)'}:{status:'present',evidence:'page still has no table'};
    case 'claimsAudit': return {status:'clean', evidence:'an audit item, closed when the page no longer out-claims the median'};
    default: {
      // Median-based tasks: the page's OWN figure must have moved in the right direction.
      // A task that vanished because the competitor sample moved is a sample change.
      const metric={wordCount:['wordCount',1],h3Count:['h3Count',1],h2Count:['h2Count',1],stats:['statCount',1],listCount:['listCount',1],
        questionHeadings:['questionHeadingCount',1],h3Fragmented:['h3Count',-1],entities:null}[f.key];
      if(metric===undefined||metric===null||!prev||!cur) return {status:'unknown', evidence:'no page-level figure to re-check for this task'};
      const k=metric[0], dir=metric[1], was=prev[k]||0, now=cur[k]||0;
      if((now-was)*dir>0) return {status:'clean', evidence:k+' moved '+was.toLocaleString()+' → '+now.toLocaleString()+' on this page'};
      return {status:'present', evidence:'this page’s '+k+' is unchanged at '+now.toLocaleString()+'; the task disappeared because the competitor sample moved, not because the page improved'};
    }
  }
}
// RESOLVED = the specific check that produced the finding was re-run on the fresh fetch and came
// back clean, AND the page changed. WITHDRAWN = the check is clean but the page did NOT change:
// nothing was fixed, so the earlier report was a render or sample difference — a false
// positive this tool owns. STILL PRESENT = the task fell off the list (a rule or sample change)
// but the re-check finds the reported items still on the page: it is carried forward, never
// closed. UNVERIFIED = the check could not be re-run this scan: carried, with the reason.
// A coarse "did the page change at all" signal is never, on its own, evidence that anything
// specific was fixed.
function diffScans(prev, cur, page, ctx){
  if(!prev) return null;
  ctx=ctx||{};
  const prevKeys=(prev.fixes||[]).map(function(f){return f.key;}), curKeys=cur.fixes.map(function(f){return f.key;});
  const gone=(prev.fixes||[]).filter(function(f){return curKeys.indexOf(f.key)===-1;});
  const added=cur.fixes.filter(function(f){return prevKeys.indexOf(f.key)===-1;});
  const pageChanged = prev.fingerprint!==cur.fingerprint;
  const versionChanged = (prev.version||'pre-10.3')!==(cur.version||SCANNER_VERSION);
  const changedLines = whatChanged(prev.snap, cur.snap);
  const g=cur.gate||null;
  const gateText = g ? gateLine(g)+' ('+g.state+')' : 'render not available';
  const rc=Object.assign({prevSnap:prev.snap||null, curSnap:cur.snap||null}, ctx);
  const resolved=[], withdrawn=[], stillPresent=[], unverified=[];
  gone.forEach(function(f){
    const chk = page ? recheckFinding(f, page, rc) : {status:'unknown', evidence:'no page data to re-check against'};
    const base={key:f.key,title:f.title,items:f.items||[],check:chk.evidence,prior:f};
    if(chk.status==='present'){ stillPresent.push(Object.assign(base,{why:'re-verified against the fresh fetch: STILL ON THE PAGE. '+chk.evidence+(versionChanged?'. The task fell off the list because the scanner rules changed ('+(prev.version||'pre-10.3')+' → '+(cur.version||SCANNER_VERSION)+'), not because the page was fixed — it is carried forward.':'. It is carried forward, not closed.')})); return; }
    if(chk.status==='unknown'){ unverified.push(Object.assign(base,{why:'could not be re-checked this scan — '+chk.evidence+'. Carried forward as unverified, not closed.'})); return; }
    if(pageChanged){
      resolved.push(Object.assign(base,{why:chk.evidence+(f.key==='hiddenContent'?'; gate self-check: '+gateText:'')
        +(changedLines&&changedLines.length?'. Page changes this scan: '+changedLines.slice(0,3).join(' · '):'. Page fingerprint changed')}));
    } else {
      withdrawn.push(Object.assign(base,{why:'page unchanged (same fingerprint), yet '+chk.evidence
        +(f.key==='hiddenContent'?'. The earlier "hidden" report was a render that never released the entrance-animation gate, not a defect on the page.'
        : versionChanged ? '. The scanner rules changed since that scan ('+(prev.version||'pre-10.3')+' → '+(cur.version||SCANNER_VERSION)+') and the re-run check is clean, so the earlier report was an artefact of the old rule, not something the page fixed.'
        : '. The finding disappeared because of a sample or render difference ('+prev.n+' → '+cur.n+' competitor pages, median word count '+Number(prev.medianWords||0).toLocaleString()+' → '+Number(cur.medianWords||0).toLocaleString()+'), not because the page improved.')}));
    }
  });
  const attribution = ctx.medians ? attributeScore(prev, cur, ctx.medians, pageChanged) : null;
  return { prevStamp:prev.stamp, pageChanged:pageChanged, changedLines:changedLines, versionChanged:versionChanged,
    prevVersion:prev.version||'pre-10.3', curVersion:cur.version||SCANNER_VERSION,
    rank:[prev.rank,cur.rank], answer:[prev.answer,cur.answer], n:[prev.n,cur.n],
    medianWords:[prev.medianWords,cur.medianWords], attribution:attribution,
    resolved:resolved, withdrawn:withdrawn, stillPresent:stillPresent, unverified:unverified,
    added:added.map(function(f){return {key:f.key,title:f.title};}),
    carried:cur.fixes.filter(function(f){return prevKeys.indexOf(f.key)!==-1;}).length };
}
// ---- P13: a score delta is decomposed into causes, one variable at a time ----------------
// Which figure the word row scored, per scanner version. 10.4 scored the painted count when it
// disagreed with the served count by more than 20%; 10.5 scores the comparison basis (served
// unless every page was rendered), with painted + reachable as the rendered figure.
function wordUnderRules(version, f){
  const v=parseFloat(String(version).replace(/^pre-/,''))||0;
  if(v<10.4) return f.served;
  if(v<10.5){ const pct=Math.abs(f.served-(f.painted||0))/Math.max(f.served,f.painted||0,1); return (f.painted!=null && pct>0.2) ? f.painted : f.served; }
  return f.basis==='rendered' ? (f.painted||0)+(f.reachable||0) : f.served;
}
// A scoreRank input rebuilt from a stored snapshot, under a given rules version.
function pageFromSnap(sn, version, basis){
  const served = sn.wordCountServed!=null ? sn.wordCountServed : (sn.wordCount||0);
  return { kwInTitle:!!sn.kwInTitle, kwInH1:!!sn.kwInH1, kwInMeta:!!sn.kwInMeta, hasFaqSchema:!!sn.hasFaqSchema, hasProductSchema:!!sn.hasProductSchema,
    wordCount: wordUnderRules(version, {served:served, painted:sn.wordPainted, reachable:sn.wordReachable, basis:basis||sn.wordBasis||'served'}),
    h3Count:sn.h3Count||0, h2Count:sn.h2Count||0, listCount:sn.listCount||0, questionHeadingCount:sn.questionHeadingCount||0, tableCount:sn.tableCount||0 };
}
// Rank Score: A = prev page · prev sample · prev rules (recorded); B = prev page · cur sample ·
// prev rules; C = cur page · cur sample · prev rules; D = cur page · cur sample · cur rules
// (recorded). sample = B−A, page = C−B, rules = D−C; the three sum to D−A by construction.
// Answer Score: row by row from the stored rows, cause read off which side of the row moved.
function attributeScore(prev, cur, mCur, pageChanged){
  if(!prev || !cur || !cur.snap || !mCur) return null;
  const pv=prev.version||'pre-10.3', cv=cur.version||SCANNER_VERSION;
  const A=prev.rank, D=cur.rank, snP=prev.snap||null, snC=cur.snap;
  const enrichedC = snC.kwInTitle!=null, enrichedP = !!(snP && snP.kwInTitle!=null);
  const prevBasis=(snP&&snP.wordBasis)||(prev.basis)||'served', curBasis=snC.wordBasis||cur.basis||'served';
  const out={from:A, to:D, delta:D-A, rulesChanged:pv!==cv||prevBasis!==curBasis, prevVersion:pv+(prevBasis!==curBasis?' / '+prevBasis+' basis':''), curVersion:cv+(prevBasis!==curBasis?' / '+curBasis+' basis':''), lines:[], recomputed:null, answer:[]};
  if(!enrichedC) return out;
  // "Previous rules" = the previous scanner version AND the previous measurement basis.
  const C=scoreRank(pageFromSnap(snC,pv,prevBasis),mCur)[0];
  const rules=D-C;
  const basisNote=(function(){ const fig={served:snC.wordCountServed,painted:snC.wordPainted,reachable:snC.wordReachable}; const a=wordUnderRules(pv,Object.assign({basis:prevBasis},fig)), b=wordUnderRules(cv,Object.assign({basis:curBasis},fig)); return a!==b ? ' (word basis '+Number(a).toLocaleString()+' → '+Number(b).toLocaleString()+', '+out.prevVersion+' → '+out.curVersion+')' : ''; })();
  if(!pageChanged){
    // Same page both times: B = C, so page = 0 and sample = C − A.
    out.lines.push({cause:'scoring rule change', delta:rules, note:basisNote});
    out.lines.push({cause:'competitor sample', delta:C-A, note:''});
    out.lines.push({cause:'page content', delta:0, note:'fingerprint identical'});
  } else if(enrichedP){
    const B=scoreRank(pageFromSnap(snP,pv,prevBasis),mCur)[0];
    out.lines.push({cause:'scoring rule change', delta:rules, note:basisNote});
    out.lines.push({cause:'competitor sample', delta:B-A, note:''});
    out.lines.push({cause:'page content', delta:C-B, note:''});
  } else {
    out.lines.push({cause:'scoring rule change', delta:rules, note:basisNote});
    out.lines.push({cause:'competitor sample + page content', delta:C-A, note:'not separable: the previous scan predates attribution logging (pre-10.5)'});
  }
  out.recomputed={version:pv, score:C};
  // Answer Score rows: what moved, and on which side.
  const rp=(prev.rows&&prev.rows.answer)||null, rc=(cur.rows&&cur.rows.answer)||null;
  if(rp&&rc){ Object.keys(rc).forEach(function(k){ const a=rp[k], b=rc[k]; if(!a) return; const d=Math.round((b.earned-a.earned)*10)/10; if(!d) return;
    const cause = String(a.target)!==String(b.target) && String(a.mine)===String(b.mine) ? 'sample (target '+a.target+' → '+b.target+')' : String(a.mine)!==String(b.mine) && String(a.target)===String(b.target) ? 'page ('+a.mine+' → '+b.mine+')' : 'page and sample ('+a.mine+'/'+a.target+' → '+b.mine+'/'+b.target+')';
    out.answer.push({key:k, delta:d, cause:cause}); }); }
  return out;
}
function attributionLines(at, label){
  if(!at) return [];
  const sg=function(n){ return (n>0?'+':n<0?'−':'')+Math.abs(Math.round(n*10)/10); };
  const out=[];
  at.lines.forEach(function(l){ out.push('                     '+sg(l.delta).padStart(4)+'  '+l.cause+l.note+(l.note===''?'':'')); });
  if(at.recomputed && at.rulesChanged) out.push('                     Recomputed under '+at.recomputed.version+' rules on today\'s sample: '+at.recomputed.score+'.');
  return out;
}
// A prior task the re-check says is still on the page (or could not be re-checked) goes back
// into the work order, from the copy the history kept, with the re-verification stated.
function carryForward(fixes, changes){
  if(!changes) return fixes;
  const back=[];
  changes.stillPresent.concat(changes.unverified).forEach(function(c){
    const f=c.prior||{}; if(!f.title) return;
    const still=changes.stillPresent.indexOf(c)!==-1;
    back.push({key:f.key, title:f.title, body:(f.body||'')+' RE-VERIFIED ON THIS SCAN: '+(still?'still on the page — ':'could not be re-checked — ')+c.check+'.',
      code:(f.code||'')+'\nre-check → '+(still?'STILL PRESENT':'UNVERIFIED')+' ('+c.check.slice(0,120)+')',
      severity:f.severity||'HIGH', effort:f.effort||'1 HR', engine:f.engine||'RANK', _pts:f.pts!=null?f.pts:5, _hours:f.hours||1, _extra:!!f.extra,
      _rank:(f.pts!=null?f.pts:5)/Math.max(f.hours||1,0.15), _section:f.section||(f.extra?'OUT-OF-SCORE':'IN-SCORE'), _items:c.items||[], _carried:still?'STILL PRESENT':'UNVERIFIED'});
  });
  if(!back.length) return fixes;
  const all=fixes.concat(back);
  const outOf=all.filter(function(x){return x._section==='OUT-OF-SCORE';}).sort(function(a,b){return b._rank-a._rank;});
  const inS=all.filter(function(x){return x._section!=='OUT-OF-SCORE';}).sort(function(a,b){return b._rank-a._rank;});
  const hi=outOf.findIndex(function(x){return x.key==='hiddenContent';}); if(hi>0){ const h=outOf.splice(hi,1)[0]; outOf.unshift(h); }
  return resolveRefs(outOf.concat(inS));
}

const NO_INVENT =
'ABSOLUTE RULE — DO NOT INVENT ANYTHING\n'+
'Never make up a statistic, customer name, price, certification, award, product\n'+
'capability, or comparison claim. If a task needs a fact you were not given, stop and\n'+
'ask me for it. A plausible-sounding invented number on a commercial page is a legal\n'+
'and reputational problem, not a helpful guess.';

function verifyFirst(c){
  return 'BEFORE YOU START\n'+
'Open the exact URL above and check it against the measured figures in this prompt. If what you\n'+
'see differs, stop and tell me which numbers disagree rather than proceeding. Do not call the\n'+
'figures confirmed unless they actually match. '+
(c.rendered
 ? 'These figures come from the served HTML, cross-checked against a rendered copy of the page\n(headless browser, scrolled, '+c.rendered.waitMs+' ms wait), so counter widgets and script-injected content\nwere seen; anything hidden from visitors is listed in the work order under RENDERED-VS-SERVED DIFF.'
 : 'Note that these figures were read without running\nJavaScript, so counter widgets and script-injected content may be missing from them.');
}

function ctxBlock(c){
  return 'CONTEXT\n'+
    'Page to edit ....... '+c.url+'\n'+
    'Target keyword ..... "'+c.keyword+'"\n'+
    'Brand .............. '+c.brand+'\n'+
    'Market ............. '+String(c.gl||'us').toUpperCase()+' / '+String(c.hl||'en').toUpperCase()+'\n'+
    'Measured against ... the '+c.medians.total+' pages currently ranking for this keyword';
}

function counterLines(p){
  const cs=(p.counters||[]).filter(function(x){return !x.inServedText;});
  if(!cs.length) return (p.jsHiddenStats||[]).map(function(x){return '  • '+x;}).join('\n');
  return cs.slice(0,12).map(function(x){
    return '  • '+x.display+' — '+x.label+'\n      served element text: '+(x.elementText===''?'(empty)':'“'+x.elementText+'”')
      +' · data-from-value: '+(x.fromValue==null?'—':x.fromValue)+' · data-to-value: '+(x.toValue==null?'—':x.toValue);
  }).join('\n');
}
function claimLines(p){
  const cl=p.schemaClaims||[];
  if(!cl.length) return '  (no FAQ, product, offer, review or rating items declared)';
  return cl.slice(0,30).map(function(x){return '  '+(x.present?'PRESENT':'ABSENT ')+'  ['+x.kind+'] “'+x.text.slice(0,100)+'”'+(x.present?'':'  ← not in the page text ('+x.matched+' checked)');}).join('\n')
    +(cl.length>30?'\n  … and '+(cl.length-30)+' more':'');
}
function vocabLines(c){
  const info=c.missingInfo||[];
  if(!info.length) return '  '+(c.missing||[]).slice(0,20).join(', ');
  const bucket=function(name){
    const rows=info.filter(function(x){return x.bucket===name;});
    if(!rows.length) return '';
    return '  '+name+'\n'+rows.slice(0,14).map(function(x){return '    • '+(x.state==='PRESENT BUT HIDDEN'?'[PRESENT BUT HIDDEN] ':'[ABSENT] ')+x.term+(x.variants&&x.variants.length?'  (also: '+x.variants.slice(0,3).join(', ')+')':'')+'  — on '+x.df+' of '+c.medians.total+' ranking pages';}).join('\n');
  };
  return [bucket('OWN STACK'),bucket('VOCABULARY'),bucket('COMPETITOR')].filter(Boolean).join('\n');
}

function promptFor(fix, c){
  const p=c.page, m=c.medians, kw=c.keyword, brand=c.brand;
  const head = (job) => 'You are an experienced SEO copywriter and technical SEO. '+job+'\n\n'+ctxBlock(c)+'\n\n'+verifyFirst(c)+'\n\n';
  const voice = 'VOICE\nMatch the existing page. If you need to see the current copy, ask me to paste it before writing.\n'+
    'Plain, concrete, commercial B2B English. No "unlock", "elevate", "revolutionary", "seamless", no exclamation marks.\n';

  switch(fix.key){

  case 'kwInTitle': return head('Your job is to rewrite one title tag.')+
'THE PROBLEM (measured)\n'+
'Current title: "'+(p.httpTitle||'(empty)')+'"\n'+
'The phrase "'+kw+'" does not appear in it. '+m.kwInTitleN+' of the '+m.total+' pages that outrank\n'+
'this one lead with that phrase.\n\n'+
'TASK\nWrite 5 replacement title tags.\n\n'+
'RULES\n'+
'- 50 to 60 characters including spaces. Count each one and show the count.\n'+
'- The exact phrase "'+kw+'" (or its closest natural form) must appear in the first 35 characters.\n'+
'- End with " | '+brand+'".\n'+
'- Descriptive, not promotional. No superlatives you cannot prove.\n'+
'- Do not invent product names or claims.\n\n'+
'OUTPUT\nA numbered list. Each line: the title, then [character count].\n'+
'Then one short paragraph: which one you recommend and why.';

  case 'kwInH1': return head('Your job is to rewrite one H1 heading.')+
'THE PROBLEM (measured)\n'+
'Current H1: "'+((p.h1&&p.h1[0])||'(no H1 found)')+'"\n'+
'It does not contain "'+kw+'". All '+m.kwInH1N+' of the '+m.total+' pages outranking this one put the\n'+
'term in their H1. The current H1 states a benefit where the category name belongs.\n\n'+
'TASK\nWrite 5 replacement H1 options.\n\n'+
'RULES\n'+
'- Contain "'+kw+'" or its closest natural noun form.\n'+
'- Under 70 characters. Say what the page is about, not what it promises.\n'+
'- Must read as a heading, not a slogan.\n'+
'- Different from the title tag — do not just repeat it.\n\n'+voice+'\n'+
'OUTPUT\nA numbered list of 5, then your recommendation in one sentence.';

  case 'jsStats': return head('Your job is to make hidden statistics readable by machines.')+
'THE PROBLEM (measured)\n'+
'This page carries '+(p.jsHiddenStatCount||0)+' statistics that exist only inside counter-widget attributes.\n'+
'Each value appears nowhere in the text the server sends — it is written into the page only\n'+
'once JavaScript runs. This was checked per counter against the full served copy (element text,\n'+
'data-from-value and data-to-value all read), not assumed.\n\n'+
'Recovered values:\n'+counterLines(p)+'\n\n'+
'These are among the most quotable facts on the page, and they are invisible to any crawler\n'+
'or answer engine that does not execute JavaScript.\n\n'+
'TASK\n'+
'STEP 1. Confirm with me which of these figures are approved for public use, and their source.\n'+
'STEP 2. Write each one as a plain-text sentence that can sit next to, or replace, the counter,\n'+
'so the number exists in the HTML whether or not the script runs.\n'+
'STEP 3. Give me the implementation note for a WordPress/Elementor page: keep the animation if\n'+
'we want it, but ensure a server-rendered text version of the figure is present in the markup.\n\n'+
'RULES\n'+
'- Use the figures exactly as recovered above. Do not round, restate, or embellish them.\n'+
'- Each sentence must name what was measured and over what period if I give you that detail.\n'+
'- Do not add a source or study name I have not given you.\n\n'+
'OUTPUT\nThe rewritten sentences, then a short implementation note.';

  case 'animGate': { const g=p.animationGated||[];
    return head('Your job is to diagnose content that may be invisible to visitors.')+
'THE PROBLEM (measured)\n'+
'This page has '+g.length+' block'+(g.length>1?'s':'')+' wrapped in an entrance-animation container. Those wrappers\n'+
'start hidden and are made visible by JavaScript once an observer fires. If the reveal never\n'+
'runs, the content stays invisible to human visitors while remaining fully readable to\n'+
'crawlers — so it will not show up in any content audit, including this one.\n\n'+
'Framework detected: '+((g[0]&&g[0].framework)||'entrance animation')+'\n'+
'Blocks affected:\n'+g.slice(0,6).map(function(x){return '  • ['+x.carries+'] '+x.sample.slice(0,90);}).join('\n')+'\n\n'+
'IMPORTANT: this is a flag to VERIFY, not a confirmed defect. A server-side scan cannot see\n'+
'rendered CSS. The wrapper being present is normal; the wrapper being stuck is the bug.\n\n'+
'TASK\n'+
'STEP 1. Tell me how to confirm it in under a minute: what to look at on the live page, and\n'+
'what to check in the browser console and the element inspector. Be specific about what a\n'+
'stuck reveal looks like versus a working one.\n'+
'STEP 2. If it is stuck, give me the fix in this order of preference:\n'+
'   a) the clean fix inside the page builder itself — turning the entrance animation off on\n'+
'      the affected widgets — with the exact menu path;\n'+
'   b) a CSS override scoped to those widgets only;\n'+
'   c) a global CSS override, and say plainly what it costs: it disables every entrance\n'+
'      animation on the whole site, not just these.\n'+
'STEP 3. Tell me what would make the reveal fail in the first place, and what else on the site\n'+
'might be broken by the same root cause. A never-firing observer is usually a symptom, not the\n'+
'disease — if a script is erroring or being deferred, other things are probably failing too.\n\n'+
'RULES\n'+
'- Do not assume the content is definitely hidden. Give me the check first.\n'+
'- Do not recommend the global override as the primary fix.\n'+
'- If you need the page source or a console screenshot, ask me for it.\n\n'+
'OUTPUT\nThe verification steps, then the fix options in order, then the root-cause note.'; }

  case 'hiddenContent': { const d=c.diff||{}; const items=(d.priority&&d.priority.length?d.priority:d.important)||[];
    return head('Your job is to make content that visitors cannot see visible again.')+
'THE PROBLEM (measured in a real browser, not inferred)\n'+
'The page was rendered in headless Chromium, scrolled to the bottom so every intersection\n'+
'observer could fire, and left for '+((c.rendered&&c.rendered.waitMs)||2500)+' ms. Afterwards these elements still carried text that no\n'+
'visitor can see — the computed style says so — while the same text sits in the served HTML\n'+
'where every crawler reads it:\n\n'+
items.slice(0,14).map(function(h){return '  • ['+h.kind+'] “'+h.text.slice(0,90)+'” — '+h.reason+(h.gated?', inside an entrance-animation wrapper':'');}).join('\n')+
(items.length>14?'\n  … and '+(items.length-14)+' more (full list in the RENDERED-VS-SERVED DIFF)':'')+'\n\n'+
'Render self-check: '+gateLine(d.gate)+(d.gate&&d.gate.method?' — '+d.gate.method:'')+'.\n'+
'Elements still carrying an entrance-animation marker after render: '+((d.gate&&d.gate.afterScroll)?d.gate.afterScroll.markers:((d.gating&&d.gating.inDom)||0))+' ('+((d.gate&&d.gate.afterScroll)?d.gate.afterScroll.hidden:((d.gating&&d.gating.stillHidden)||0))+' hidden).\n'+
'The marker class is removed when the animation fires; the element itself never leaves the DOM.\n\n'+
'A call to action, a price, a statistic or a form that a visitor cannot see is a revenue defect,\n'+
'not an SEO nuance. It outranks every content task on this list.\n\n'+
'TASK\n'+
'STEP 1. Reproduce it: tell me exactly what to open and inspect on the live page to see each item\n'+
'hidden, in under a minute (element inspector, computed style, console).\n'+
'STEP 2. Diagnose the mechanism. If the items sit in entrance-animation wrappers, the reveal is\n'+
'not firing — find out why (a script error, a deferred bundle, an observer that never triggers).\n'+
'If the reason is display:none, tell me whether it is a modal, tab or menu waiting for a click, in\n'+
'which case say so and stop — that is intentional.\n'+
'STEP 3. Give me the fix in this order: (a) the page-builder setting, with the menu path; (b) a CSS\n'+
'override scoped to the affected widgets; (c) a global override, with its cost stated plainly.\n'+
'STEP 4. Tell me what else on the site is probably broken by the same root cause.\n\n'+
'RULES\n'+
'- Do not recommend the global override first.\n'+
'- If you need the page source or a console screenshot, ask me for it.\n\n'+
'OUTPUT\nReproduction steps, then the diagnosis, then the fix options in order, then the root-cause note.'; }

  case 'stats': { const need=Math.max(m.statCount-p.statCount,1);
    return head('Your job is to help add quantified proof to a page — carefully.')+
'THE PROBLEM (measured)\n'+
'This page contains '+p.statCount+' quantified claims. The '+m.total+' pages ranking above it carry a\n'+
'median of '+m.statCount+'. AI answer engines quote figures they can attribute to a source. With\n'+
'nothing quantified on the page, there is nothing for them to lift, so the page is invisible\n'+
'to the answer layer no matter how well it is written.\n\n'+
NO_INVENT+'\n\n'+
'TASK — follow these steps in order\n'+
'STEP 1. Do not write any statements yet. First ask me for real data. List exactly what you\n'+
'need for each of the '+need+' claims:\n'+
'  - the customer or source name, and whether I have permission to name them\n'+
'  - the metric and the figure\n'+
'  - the timeframe it was measured over\n'+
'  - where it can be verified if challenged\n'+
'Also suggest which '+need+' metrics would be most persuasive for "'+kw+'" specifically, so I know\n'+
'what to go and pull.\n\n'+
'STEP 2. Wait for my answer.\n\n'+
'STEP 3. Once I give you real figures, write them as page-ready statements in this shape:\n'+
'  [figure] [outcome] — [customer], [timeframe]\n'+
'and tell me where on the page each one should sit.\n\n'+
'IF I TELL YOU I HAVE NO DATA\n'+
'Do not write statements and do not use placeholders that could ship by accident. Instead give\n'+
'me a one-page collection plan: the '+need+' metrics worth gathering, which system or team inside\n'+
'the business holds each, and the exact question to ask to get it.'; }

  case 'questionHeadings': { const need=qNeed(p,m);
    return head('Your job is to write question-shaped subheadings with direct answers underneath.')+
'THE PROBLEM (measured)\n'+
'This page has '+p.questionHeadingCount+' question-shaped headings. The ranking set median is '+m.questionHeadingCount+'.\n'+
(m.questionHeadingCount===0
 ? 'READ THIS FIRST: none of the ranking pages use question headings, so this is NOT a parity task.\n'+
   'It is recommended on answer-layer grounds only — an answer engine lifts the sentence under a\n'+
   'question heading more readily than a paragraph — and it is ranked below every parity task on\n'+
   'the list for that reason. If the page is already at parity everywhere else, this is optional.\n\n'
 : '')+
'Each question heading is a retrieval hook: it matches how a buyer actually types, and the\n'+
'text immediately beneath it is what an answer engine lifts.\n\n'+
'TASK\nWrite '+need+' question headings for a page about "'+kw+'", each with a direct answer beneath it.\n\n'+
'RULES\n'+
'- Every question must be one a real buyer would type. Cover: cost, how it works, whether it\n'+
'  works, what to look for, how it compares, and how to get started.\n'+
'- The answer directly under each heading must be 35 to 50 words and must answer the question\n'+
'  in the FIRST sentence. No warm-up clause, no "it depends" opener.\n'+
'- Write in complete sentences that stand alone if quoted out of context.\n'+
'- Where an answer would need a specific figure I have not given you, write the sentence\n'+
'  without the number and flag it to me in a list at the end. Do not invent figures.\n\n'+voice+'\n'+
'OUTPUT\nFor each: the heading as an H3, then the answer paragraph. Then a short list titled\n'+
'"Figures I need from you" for anything you deliberately left blank.'; }

  case 'h3Count': return head('Your job is to design the subheading architecture for a page.')+
'THE PROBLEM (measured)\n'+
'This page has '+p.h3Count+' H3 subheadings against a ranking-set median of '+m.h3Count+'. It also runs\n'+
p.wordCount.toLocaleString()+' words against a median of '+m.wordCount.toLocaleString()+'. Those two facts are the same problem:\n'+
'the page has no structural skeleton to hang detail on.\n\n'+
'TASK\nProduce a complete heading outline for this page — H2 sections with H3 subheadings beneath\n'+
'them — that would bring it to roughly '+m.h3Count+' H3s.\n\n'+
'RULES\n'+
'- Keep the existing H2 sections where they make sense. Ask me for the current outline first.\n'+
'- Each H3 covers exactly one idea a buyer needs before purchasing.\n'+
'- Note next to each H3 roughly how many words it should carry, totalling about '+
  Math.max(m.wordCount-p.wordCount,0).toLocaleString()+' new words.\n'+
'- No filler sections. If you cannot name what goes in a section, drop it.\n\n'+
'OUTPUT\nAn indented outline. Under it, one paragraph on which three sections to write first and why.';

  case 'wordCount': { const add=Math.max(m.wordCount-p.wordCount,0);
    return head('Your job is to close a word-count gap with real content — never by writing to a target.')+
'THE PROBLEM (measured)\n'+
'This page runs '+p.wordCount.toLocaleString()+' words. The '+m.total+' pages outranking it run a median of '+
m.wordCount.toLocaleString()+', a gap of roughly '+add.toLocaleString()+' words.\n\n'+
'Do not treat that number as a quota. A word-count target produces filler; a page that actually\n'+
'answers more of the buyer’s questions produces the word count as a side effect, not the goal.\n\n'+
NO_INVENT+'\n\n'+
'TASK\n'+
'STEP 1. Ask me to paste the current page copy and the heading outline.\n'+
'STEP 2. From that outline and the keyword "'+kw+'", list the specific questions a buyer researching\n'+
'this would still have after reading the page — real questions, not generic section headings.\n'+
'STEP 3. For each question, tell me exactly what facts you would need to answer it well (a spec, a\n'+
'number, a process detail, a policy). Ask me for those before writing anything.\n'+
'STEP 4. Once I answer, write each section. Its length is whatever it takes to actually answer the\n'+
'question — do not stretch a 100-word answer to 250, and do not compress a 400-word one to fit.\n\n'+
'RULES\n'+
'- Target parity with the median, not more. If your honest, fact-grounded sections land short of\n'+
'  it, tell me so and name what additional real content would close the rest — never pad to hit\n'+
'  the number.\n'+
'- Every paragraph must carry information a buyer could act on. If a paragraph only restates\n'+
'  the heading, cut it.\n'+
'- Where a section needs a figure, spec or customer detail I have not given you, leave the\n'+
'  sentence factually neutral and list what you need at the end.\n\n'+voice+'\n'+
'OUTPUT\nThe list of buyer questions first, then each section under its heading, then "Facts I\n'+
'needed and did not get".'; }

  case 'table': return head('Your job is to build a comparison table.')+
'THE PROBLEM (measured)\n'+
'This page has no table. '+m.tableN+' of the '+m.total+' ranking pages have one. A table is the most cleanly\n'+
'extractable structure on a web page — an answer engine can lift a single row and attribute it\n'+
'without parsing any prose. This is the highest-value structural addition for AI visibility.\n\n'+
NO_INVENT+'\n\n'+
'TASK\n'+
'STEP 1. Ask me for the real specs — the products, tiers or options to compare and their actual\n'+
'attributes. Suggest which 5 to 7 comparison dimensions matter most for "'+kw+'" so I know what\n'+
'to send you.\n'+
'STEP 2. Once I give you real data, build the table.\n\n'+
'RULES\n'+
'- Rows are the options; columns are the dimensions. Never the other way round.\n'+
'- Every cell holds a concrete value or a clear "not included". No "varies", no "contact us".\n'+
'- Include a caption sentence above the table stating what is being compared.\n'+
'- Do not include competitor products unless I explicitly give you verified specs for them.\n\n'+
'OUTPUT\nClean semantic HTML using table, thead, tbody and th scope="col", ready to paste.\n'+
'No inline styles, no CSS classes, no wrapper divs.';

  case 'schema': return head('Your job is to write structured data markup.')+
'THE PROBLEM (measured)\n'+
'Detected JSON-LD on this page: '+((p.schemaTypes||[]).join(', ')||'none')+'\n'+
m.schemaN+' of the '+m.total+' ranking pages carry FAQPage or Product/Service markup. This is the best\n'+
'result-per-hour item on the whole list — but only for content the page really has.\n\n'+
'TASK\n'+
'STEP 1. Ask me to paste the page FAQ questions and answers, and the product or service\n'+
'details (name, description, and whether pricing is public).\n'+
'STEP 2. Produce the JSON-LD blocks that the page content actually supports.\n\n'+
'RULES\n'+
'- schema.org vocabulary, valid JSON-LD, wrapped in a script tag of type application/ld+json.\n'+
'- Every field must reflect content that is actually visible on the page. Marking up content\n'+
'  that is not on the page is a structured-data violation and can trigger a manual action.\n'+
'  If the page has no FAQ, say so plainly and tell me the FAQ has to be written and published\n'+
'  first — do not produce FAQPage markup for questions that do not exist on the page.\n'+
'- If the page sells service categories rather than named products with a price or SKU, say so\n'+
'  and use Service, not Product. Tell me what you would need for valid Product markup.\n'+
'- Do not include aggregateRating or review markup unless I give you real, on-page reviews.\n'+
'- Do not invent prices, SKUs, or availability.\n\n'+
'OUTPUT\nThe script blocks, ready to paste into the head. Then a two-line note telling me how to\n'+
'verify them with Google Rich Results Test.';

  case 'entities': return head('Your job is to close a topical vocabulary gap.')+
'THE PROBLEM (measured)\n'+
'These concepts appear across multiple pages that outrank this one. They are the vocabulary the\n'+
'category is actually discussed in. This page mentions none of them. Each concept is listed once,\n'+
'with the surface forms the ranking pages use, and sorted into the bucket that decides what to do:\n\n'+
vocabLines(c)+'\n\n'+
'OWN STACK means the term is already named somewhere on this site (navigation, product pages,\n'+
'links) but not in this page’s copy — usually the most valuable term in the set, because the\n'+
'business already sells or resells it and the page never says so. COMPETITOR means a domain\n'+
'ranking for this keyword; do not add those unless a real comparison exists. VOCABULARY is\n'+
'category language.\n\n'+
'TASK\n'+
'STEP 1. Ask me to paste the current page copy.\n'+
'STEP 2. Work the OWN STACK terms in first — confirm with me that the business really offers each\n'+
'one. Then decide which VOCABULARY terms genuinely belong. Leave COMPETITOR terms out unless I say\n'+
'otherwise. Be strict.\n'+
'STEP 3. For the ones that do belong, show me exactly where and how to work each into the\n'+
'existing copy: quote the current sentence, then the rewritten sentence.\n\n'+
'RULES\n'+
'- Natural sentences only. If a term cannot be used naturally, say so and leave it out.\n'+
'- Never keyword-stuff. One meaningful mention beats five forced ones.\n'+
'- Do not claim the business does something it does not do just to fit a term in.\n\n'+
'OUTPUT\nA table: term | belongs? | where it goes | before sentence | after sentence.';

  case 'listCount': return head('Your job is to convert dense prose into scannable lists.')+
'THE PROBLEM (measured)\n'+
'This page has '+p.listCount+' lists against a ranking-set median of '+m.listCount+'. Lists are extractable\n'+
'structure and they hold readers on the page.\n\n'+
'TASK\n'+
'STEP 1. Ask me to paste the current page copy.\n'+
'STEP 2. Find the '+Math.max(m.listCount-p.listCount,2)+' passages that are secretly lists written as paragraphs.\n'+
'STEP 3. Rewrite each as a bulleted or numbered list.\n\n'+
'RULES\n'+
'- Numbered only when order genuinely matters (a process, a sequence). Otherwise bulleted.\n'+
'- Parallel grammar across items. Each item starts the same way grammatically.\n'+
'- 3 to 7 items per list. Add a lead-in sentence above each.\n'+
'- Do not add items that were not in the original prose.\n\n'+
'OUTPUT\nFor each: the original paragraph, then the list version as clean HTML.';

  case 'kwInMeta': return head('Your job is to write a meta description.')+
'THE PROBLEM (measured)\n'+
'Current meta description: "'+(p.metaDescription||'(empty)')+'"\n'+
'It does not contain "'+kw+'". This does not move rankings directly — it moves click-through,\n'+
'which does.\n\n'+
'TASK\nWrite 5 meta descriptions.\n\n'+
'RULES\n'+
'- 140 to 155 characters including spaces. Count each and show the count.\n'+
'- Contain "'+kw+'" naturally, ideally in the first half.\n'+
'- End with a reason to click — something specific the page delivers.\n'+
'- Do not promise anything the page does not contain.\n\n'+
'OUTPUT\nNumbered list, each with [character count], then your recommendation.';

  case 'h2Count': return head('Your job is to restructure a page section headings.')+
'THE PROBLEM (measured)\nThis page has '+p.h2Count+' H2 sections; the ranking median is '+m.h2Count+'.\n\n'+
'TASK\nAsk me for the current outline, then propose a revised H2 structure that covers the buyer\n'+
'journey for "'+kw+'" from problem through to next step.\n\n'+
'OUTPUT\nThe revised outline, with a one-line note on what each section is for.';

  case 'h3Fragmented': return head('Your job is to consolidate a fragmented heading outline, not add to it.')+
'THE PROBLEM (measured)\n'+
'This page runs '+p.h3Count+' H3 subheadings against a ranking-set median of '+m.h3Count+'. That many\n'+
'headings on one page is not extra structure — it fragments the content into pieces too small to\n'+
'carry a complete idea, which hurts both readability and how cleanly an answer engine can extract\n'+
'a section.\n\n'+
'TASK\n'+
'STEP 1. Ask me to paste the current full heading outline (every H2 and H3, in order).\n'+
'STEP 2. Group the existing H3s into roughly '+m.h3Count+' subheadings that each carry a genuinely\n'+
'distinct idea. Show which originals merge into which new heading, and which get dropped because\n'+
'they duplicate a neighbor or carry no real content of their own.\n'+
'STEP 3. If another task on this work order also adds question headings or new sections, do this\n'+
'consolidation FIRST — tell me explicitly which of those new headings still make sense once the\n'+
'outline is merged, so the total does not just grow again.\n\n'+
'RULES\n'+
'- Never lose real information in a merge — combine the surviving text under the new heading.\n'+
'- A heading that cannot be filled with at least two sentences of distinct information should be\n'+
'  dropped, not kept for the sake of structure.\n\n'+
'OUTPUT\nOld outline next to new outline, side by side. Then a one-paragraph note on what to tell\n'+
'whoever edits the page.';

  case 'claimsAudit': return head('Your job is to audit quantified claims already on the page, not write new ones.')+
'THE PROBLEM (measured)\n'+
'This page runs '+p.statCount+' quantified claims already — more than the '+m.total+' ranking pages’\n'+
'median of '+m.statCount+'. Good volume, unknown reliability: nothing has verified where these numbers\n'+
'came from or whether they still hold up.\n\n'+
NO_INVENT+'\n\n'+
'TASK\n'+
'STEP 1. Ask me to paste the current page copy.\n'+
'STEP 2. List every quantified claim on the page: the figure, the sentence it sits in, and what it\n'+
'would need to be defensible if a prospect or a competitor challenged it (a named source, a date,\n'+
'a customer’s permission to be named, an internal report to point to).\n'+
'STEP 3. For each one, ask me directly: can you verify this, and can I keep publishing it as-is?\n\n'+
'RULES\n'+
'- Do not delete or soften a claim on your own judgement — flag it and let me decide.\n'+
'- An unverifiable number that stays live on a commercial page is a bigger liability than a\n'+
'  missing one, so treat "I could not verify this" as a real finding, not a failure to report.\n\n'+
'OUTPUT\nA table: claim | where it appears | verifiable from what I gave you? | what would make it\n'+
'defensible.';

  case 'schemaMismatch': return head('Your job is to reconcile FAQPage structured data with the FAQ content actually visible on the page.')+
'THE PROBLEM (measured)\n'+
'This page publishes '+((p.schemaTopLevel||p.schemaTypes||[]).join(', ')||'structured data')+'. Every declared item that\n'+
'Google requires to be visibly supported was string-matched against the page text:\n\n'+
claimLines(p)+'\n\n'+
'The scan found '+p.questionHeadingCount+' visible question heading'+(p.questionHeadingCount===1?'':'s')+' on the page itself.\n'+
'Structured data has to describe what a visitor can actually see — Google treats a schema/content\n'+
'mismatch as a policy violation, not a cosmetic detail, and it can cost the rich result entirely.\n\n'+
NO_INVENT+'\n\n'+
'TASK\n'+
'STEP 1. Ask me to paste the current FAQPage JSON-LD and the current visible page copy.\n'+
'STEP 2. Match every question in the schema to a visible question-and-answer on the page. List any\n'+
'schema entry with no visible counterpart, and any visible Q&A missing from the schema.\n'+
'STEP 3. If this work order also includes a task adding new visible question headings, treat those\n'+
'as part of this job, not a separate one — every new heading needs a matching schema entry, added\n'+
'at the same time it goes live, not after.\n'+
'STEP 4. Produce the corrected JSON-LD.\n\n'+
'RULES\n'+
'- Never leave a schema entry with no visible match on the page.\n'+
'- Every answer in the schema must match the visible answer text — not a rewritten version of it.\n\n'+
'OUTPUT\nThe mismatch list first, then the corrected JSON-LD block, ready to paste. Then a two-line\n'+
'note on how to verify it with Google Rich Results Test.';

  default: return head('Your job is to improve one aspect of a page.')+
'TASK\n'+fix.title+'\n\n'+fix.body+'\n\n'+(fix.code?('MEASURED\n'+fix.code+'\n\n'):'')+
NO_INVENT+'\n\nAsk me for the current page copy first, then produce the change, ready to paste.';
  }
}

function masterPrompt(d){
  const c={url:d.url,keyword:d.keyword,brand:d.brand,gl:d.gl,hl:d.hl,page:d.page,
           medians:d.medians,missing:d.missing,missingInfo:d.missingInfo,rendered:d.rendered,diff:d.diff};
  const p=d.page, m=d.medians, r=d.rendered, df=d.diff, band=d.band, sp=m.spread||{}, wc=d.wordCheck||null;
  // Computed here rather than read off d.rankReconcile/d.answerReconcile: masterPrompt must
  // stand on its own (tests and any other caller build a `d` without going through render()),
  // never depend on a side effect render() happens to have run first.
  const rankReconcile = d.rankReconcile || (d.rankRows ? scoreReconciliation(d.rankRows, d.fixes, 'Rank score') : null);
  const answerReconcile = d.answerReconcile || (d.answerRows ? scoreReconciliation(d.answerRows, d.fixes, 'Answer score') : null);
  const line=(a,b,cc,dd)=>'  '+String(a).padEnd(28)+String(b).padStart(11)+String(cc).padStart(14)+(dd!=null?String(dd).padStart(17):'');
  const rng=(k)=> sp[k] ? (sp[k].min.toLocaleString()+'–'+sp[k].max.toLocaleString()) : '';
  const mrng=(k)=> band&&band.medians&&band.medians[k] ? (band.medians[k][0]===band.medians[k][1] ? 'stable' : band.medians[k][0].toLocaleString()+'–'+band.medians[k][1].toLocaleString()+' SOFT') : '';
  const fmt=(n)=>Number(n||0).toLocaleString();
  const wl=(txt,indent)=>{ // wrap long rule text at ~92 cols
    const words=String(txt).split(' '), out=[]; let cur='';
    words.forEach(function(w){ if((cur+' '+w).length>92){ out.push(cur); cur=w; } else cur=cur?cur+' '+w:w; });
    if(cur) out.push(cur); return out.join('\n'+indent);
  };
  const failed=(d.failed||[]);

  let out =
(d.demo
 ? '!! SAMPLE DATA - DO NOT ACT ON THIS !!\n'+
   'This work order came from the app’s built-in example, not a live scan of your site.\n'+
   'Every figure below is illustrative. Run a real scan before using any of it.\n\n'
 : '')+
'# SEO AND AI-VISIBILITY WORK ORDER\n\n'+
(d.reused ? '## NO CHANGE SINCE LAST SCAN ('+d.reused.stamp+')\n'+
  'Page fingerprint identical — sha256 '+(p.textSha256||'').slice(0,8)+'…\n'+
  'Competitor medians reused from that scan (age: '+d.reused.ageHours+' hours). No SERP credits spent.\n'+
  'Open tasks: '+d.fixes.length+(d.reused.tasks===d.fixes.length?' (unchanged)':' (was '+d.reused.tasks+')')+'. Rank '+d.rankScore+' · Answer '+d.answerScore+'.\n'+
  'The page was re-fetched and re-rendered on this scan; only the Google results and competitor pages are reused.\n'+
  'Run a full rescan: tick “Force a full rescan” in the scan form.\n\n' : '')+
ctxBlock(c)+'\n'+
'Audit date ......... '+d.stamp+'\n'+
'Rank Score ......... '+d.rankScore+'/100   (how closely this page matches the pages beating it'+(band?'; '+bandText(band,'rank'):'')+')\n'+
'Answer Score ....... '+d.answerScore+'/100   (whether AI answer engines can quote it'+(band?'; '+bandText(band,'answer'):'')+')\n\n'+

'## METHODOLOGY\n'+
'Every figure in this work order is reproducible from these rules. Check the method before the\n'+
'numbers; a number without its method cannot be verified.\n\n'+
'  Fetch mode ......... '+(r ? 'served HTML + rendered DOM (headless Chromium, computed styles read)' : 'served HTML only'+(d.renderError?' — render failed: '+d.renderError:''))+'\n'+
'  Fetched URL ........ exactly as given, no cache-busting parameter added; freshness requested\n'+
'                       via Cache-Control: no-cache header'+(p.finalUrl&&p.finalUrl!==p.fetchedUrl&&p.finalUrl!==d.url?'; redirected to '+p.finalUrl:'')+'\n'+
(r ? '  Render wait ........ '+fmt(r.waitMs)+' ms after '+r.waitStrategy+', scrolled to bottom: '+(r.scrolled?'yes ('+r.scrollSteps+' steps)':'no')+', then '+fmt(Math.max(600,Math.round(r.waitMs/2)))+' ms more\n'+
   '  Render input ....... '+((r.gate&&r.gate.interaction)||'window.scrollTo only (older render)')+'; viewport 1366×900\n'+
   '  Gate self-check .... '+gateLine(r.gate)+(r.gate&&r.gate.state!=='none'?'\n                       '+gateVerdict(r.gate):'')+'\n'+
   (r.gate&&r.gate.method ? '                       Method: '+r.gate.method+'\n' : '')+
   (r.gate&&r.gate.residual&&r.gate.residual.length ? r.gate.residual.slice(0,8).map(function(x){return '                       still hidden: ['+(x.cta?'call to action':x.tag)+'] “'+(x.ctaText||x.text).slice(0,70)+'” — '+x.reason+(x.stillMarked?', marker class still present':'');}).join('\n')+'\n' : '')
   : '  Render wait ........ n/a (not rendered)\n')+
'  Word count rule .... '+wl(p.wordRule||'main content only; nav, header, footer, aside and form stripped','                       ')+'\n'+
'                       Region used on this page: '+(p.wordRegion||'main content')+'\n'+
'  Text fingerprint ... sha256 '+(p.textSha256||'(not available)')+'\n'+
'                       The stripped text is downloadable from the report ("Download counted text");\n'+
'                       apply the rule above to it and you get exactly '+fmt(p.wordCount)+'.\n'+
'  Block definition ... '+wl(p.blockRule||'the outermost element carrying an entrance-animation marker that contains text','                       ')+'\n'+
'  Measurement basis .. '+(d.basis&&d.basis.kind==='rendered' ? 'RENDERED (painted + reachable) for every page in the comparison — this page and all '+m.total+' competitors were rendered.' : 'SERVED HTML for every page in the comparison (this page and all '+m.total+' competitors). The rendered figure for this page is printed beside it and never mixed into the median.')+'\n'+
'                       One basis per comparison is asserted at scan time; a page that could only be measured on the other basis is\n'+
'                       excluded with the disposition BASIS_MISMATCH rather than averaged in. Tick “Render every competitor” for the rendered basis.\n'+
'  Word count check ... '+(wc
   ? (wc.basisDifference
      ? 'BASIS DIFFERENCE '+wc.diffPct+'% — served '+fmt(wc.served)+' · rendered '+fmt(wc.rendered)+' ('+fmt(wc.renderedMain)+' painted + '+fmt(wc.reachable)+' reachable).\n'+
        '                       Two quantities, not one unreliable number. The difference is: '+wl(wc.explain||'carousel + script-mounted content','                       ')+'.\n'+
        '                       SCORED FIGURE: '+wc.scored+' ('+fmt(wc.scoredWords)+') — the basis every page in this comparison shares. Any task derived from\n'+
        '                       the word count is capped at HIGH while this difference stands (P14).\n'
      : 'served '+fmt(wc.served)+' · rendered '+fmt(wc.rendered)+' ('+fmt(wc.renderedMain)+' painted + '+fmt(wc.reachable)+' reachable) · '+wc.diffPct+'% apart — counts consistent. Scored figure: '+wc.scored+' ('+fmt(wc.scoredWords)+').\n')+
     '                       A = served HTML, '+wc.servedRegion+', regex parser · B = rendered page, same boundary ('+wc.renderedRegion+'), painted text (one tree walk; every text node whose ancestors all pass display / visibility / opacity / hidden / client-rect / clip tests) plus REACHABLE text (off-stage carousel slides and closed tab panels with a painted sibling; clones excluded)\n'+
     '                       for comparison only: innerText '+fmt(wc.innerTextMain||0)+' · textContent '+fmt(wc.textContentMain||0)+(wc.renderedDomRule!=null?' · rendered DOM under the served rules '+fmt(wc.renderedDomRule):'')+'\n'+
     '                       whole page (served HTML) '+fmt(p.pageWordCount||wc.served)+' · whole page (rendered, painted) '+fmt(wc.renderedPage)+'\n'
     +(wc.gateStuck?'                       The render gate did not release on this scan, so the rendered figure excludes gated content.\n':'')
     +(compositionLines(wc).length?compositionLines(wc).map(function(l){return '  '+l;}).join('\n')+'\n':'')
   : 'rendered count not available on this scan; the served figure stands alone and is unverified\n')+
'  Carousel clones .... '+(cloneLines(p,r).length?cloneLines(p,r).join('\n                       '):'none matched')+'\n'+
'  Competitor sample .. '+(d.sample ? d.sample.requested+' requested → '+d.sample.used+' used, '+d.sample.dispositions.reduce(function(n,x){return n+(x.count||1);},0)+' not used'+(d.sample.dispositions.length?':':'')+'\n'+
     d.sample.dispositions.map(function(x){return '                       '+(x.code+(x.count>1?' ×'+x.count:'')).padEnd(22)+x.domain+' — '+x.reason;}).join('\n')+(d.sample.dispositions.length?'\n':'')+
     (d.sample.unaccounted?'                       UNACCOUNTED '+d.sample.unaccounted+' — the arithmetic does not close; treat every median as provisional.\n':'                       arithmetic closes: used + dispositions = requested\n')
   : (d.depthRequested||m.total)+' requested → '+m.total+' used'+(failed.length?', '+failed.length+' not used:':'')+'\n'+
     (failed.length ? failed.map(function(f){return '                       '+(f.excluded?'EXCLUDED — UNREADABLE  ':'FAILED  ')+f.domain+' — '+f.reason;}).join('\n')+'\n' : ''))+
   ((d.rescued&&d.rescued.length) ? d.rescued.map(function(f){return '                       RENDERED  '+f.domain+' — served HTML gave '+fmt(f.servedWords)+' words (script-gated); rendered in a browser: '+fmt(f.renderedWords)+' words, '+f.headings+' headings. '+(f.used?'USED (rendered basis).':'NOT USED on the served basis (BASIS_MISMATCH); would be used under “Render every competitor”.');}).join('\n')+'\n' : '')+
'                       Effort model: 1 day = 6 hours, half day = 3 hours; pts/hr figures use it.\n'+
'                       Minimum-content gate: a page under '+COMP_FLOOR_WORDS+' main-content words or with no headings is a failed or\n'+
'                       script-gated fetch, not a competitor, and is excluded so it cannot drag every median down.\n'+
'                       word count min/median/max '+(sp.wordCount?fmt(sp.wordCount.min)+' / '+fmt(sp.wordCount.median)+' / '+fmt(sp.wordCount.max):'n/a')+'\n'+
'  Score confidence ... '+(band ? 'Rank '+band.rank[0]+'–'+band.rank[1]+', Answer '+band.answer[0]+'–'+band.answer[1]+' — leave-one-out across the '+band.n+' competitor pages.\n'+
'                       A move inside that band between scans is sample noise, not progress.' : 'not computed (fewer than 3 competitor pages)')+'\n'+
'  Median confidence .. '+(band&&band.medians ? 'each median below carries its leave-one-out range; a task whose median moves\n'+
'                       when one competitor is dropped is marked SOFT TARGET and its number may change next scan.' : 'not computed')+'\n'+
'  Heading rule ....... '+wl(p.headingRule||'headings inside post-feed, loop or carousel widgets are TEMPLATE; the rest EDITORIAL','                       ')+'\n'+
'  Hidden containers .. '+((p.hiddenContainers&&p.hiddenContainers.length)
   ? p.hiddenContainers.length+' element'+(p.hiddenContainers.length===1?'':'s')+' the served HTML itself hides, excluded from the word count, headings inside them labelled HIDDEN and still counted:\n'
     +p.hiddenContainers.slice(0,6).map(function(c){return '                       <'+c.tag+(c.cls?' class="'+c.cls+'"':'')+'> — '+c.reason+' — '+c.words+' words, '+c.headings+' heading'+(c.headings===1?'':'s')+(c.headingTexts&&c.headingTexts.length?' ('+c.headingTexts.slice(0,3).join('; ').slice(0,160)+')':'');}).join('\n')+(p.hiddenContainers.length>6?'\n                       … and '+(p.hiddenContainers.length-6)+' more':'')
   : 'none declared in the served HTML')+'\n'+
(d.reconcile && (d.reconcile.details.length||d.reconcile.relocated.length) ? '  After render ....... '+relocationLines(d.reconcile).join('\n                       ')+'\n' : '')+
(r&&r.gate&&r.gate.late&&r.gate.late.count ? '  Late markers ....... '+r.gate.lateSummary+(r.gate.late.hidden&&r.gate.late.residual&&r.gate.late.residual.length?'\n'+r.gate.late.residual.slice(0,6).map(function(x){return '                       LATE / UNVERIFIED: “'+x.text.slice(0,70)+'” — '+x.reason+' at y='+x.top;}).join('\n'):'')+'\n' : '')+
'\n'+

(df ?
'## RENDERED-VS-SERVED DIFF\n'+
'Text in HTML but invisible to humans ....... '+df.hiddenCount+' element'+(df.hiddenCount===1?'':'s')+' by computed style'+
  (Object.keys(df.byKind).length?'  ('+Object.keys(df.byKind).map(function(k){return df.byKind[k]+' '+k;}).join(', ')+')':'')+'\n'+
(df.hidden.length ? df.hidden.slice(0,25).map(function(h){return '    ['+h.kind+'] “'+h.text.slice(0,80)+'” — '+h.reason+(h.gated?' (entrance-animation wrapper)':'');}).join('\n')+(df.hidden.length>25?'\n    … and '+(df.hidden.length-25)+' more':'')+'\n' : '    none\n')+
'  Hidden by design, NOT findings ............ '+df.byDesignCount+' element'+(df.byDesignCount===1?'':'s')+
  (df.byDesignCount?'  ('+Object.keys(df.byContext).filter(function(k){return k!=='content';}).map(function(k){return df.byContext[k]+' '+({navigation:'in menus',carousel:'carousel slides waiting their turn',dialog:'in closed dialogs/popups',tab:'in collapsed tabs/accordions','screen-reader':'screen-reader-only text'}[k]||k);}).join(', ')+')':'')+'\n'+
'  Served text blocks never appearing in visible text: '+df.servedNotVisibleCount+
  (df.servedNotVisible.length?'\n'+df.servedNotVisible.slice(0,12).map(function(x){return '    “'+x.text.slice(0,80)+'”'+(x.inDom?'':' (removed from the DOM by script)');}).join('\n'):'')+'\n'+
'Text visible but absent from served HTML ... '+df.visibleNotServedCount+' line'+(df.visibleNotServedCount===1?'':'s')+' (script-injected page content; invisible to any crawler that does not run JavaScript)\n'+
(df.visibleNotServed.length ? df.visibleNotServed.slice(0,12).map(function(x){return '    “'+x.text.slice(0,80)+'”';}).join('\n')+(df.visibleNotServed.length>12?'\n    … and '+(df.visibleNotServed.length-12)+' more':'')+'\n' : '')+
(d.volatile ? '  VOLATILE (third-party widget, may vary by time/session — not a page finding) '+d.volatile.rows.filter(function(x){return x.present;}).length+' line'+(d.volatile.rows.filter(function(x){return x.present;}).length===1?'':'s')+' this scan\n'+
  (d.volatile.rows.length ? d.volatile.rows.slice(0,14).map(function(x){return '    “'+x.text.slice(0,60)+'”'.padEnd(64-Math.min(x.text.length,60))+' seen '+x.seen+'/'+x.of+' scans'+(x.present?'':' — absent this scan')+(x.host?' · from '+x.host:'')+(x.where?' · in '+x.where:'')+(!x.present||x.host?'':' · '+x.how);}).join('\n')+'\n' : '    none\n')+
  '    Detection: DOM insertions are attributed to the script host that made them'+(df.injectHook?'':' (hook did not install on this page; pattern match only)')+'; a body-level container named like a chat, cookie or consent widget also counts. Volatile lines never enter NEW / RESOLVED / WITHDRAWN; they carry a seen-in-N-of-M counter instead'+(d.volatile.trackingSince?' (tracking since '+d.volatile.trackingSince+')':' (tracking starts with this scan)')+'. This scan ran at '+d.stamp+'.\n' : '')+
(df.gateStuck ?
'  UNVERIFIED (gate did not release) ........ '+df.unverifiedCount+' element'+(df.unverifiedCount===1?'':'s')+' inside entrance-animation wrappers stayed hidden, but so did every\n'+
'    marker on the page ('+gateLine(df.gate)+'). That is the signature of a render that never fired the\n'+
'    reveal, not of a broken page. Reported for manual verification only, NOT as hidden content:\n'+
(df.unverified.filter(function(h){return !h.late;}).slice(0,12).map(function(h){return '    ['+h.kind+'] “'+h.text.slice(0,80)+'”';}).join('\n')+(df.unverified.length>12?'\n    … and '+(df.unverified.length-12)+' more':''))+'\n' : '')+
(df.late&&df.late.count ?
'  LATE / UNVERIFIED (inserted after first paint) '+df.late.hidden+' of '+df.late.count+' marker'+(df.late.count===1?'':'s')+' a widget mounted after first paint stayed hidden after a targeted\n'+
'    scroll. The identity check never saw them at load, and a real browser may reveal them on the first scroll, so they are\n'+
'    reported for manual verification only, NOT as hidden content:\n'+
(df.unverified.filter(function(h){return h.late;}).slice(0,10).map(function(h){return '    ['+h.kind+'] “'+h.text.slice(0,80)+'” — '+h.reason;}).join('\n'))+'\n' : '')+
(d.reconcile&&d.reconcile.relocated.length ? d.reconcile.relocated.map(function(c){return '  CONTAINER RELOCATED — <'+c.tag+(c.cls?' class="'+c.cls+'"':'')+'> is '+c.reason+' in served HTML but holds '+c.renderedHeadings+' of its '+c.servedHeadings+'\n    served headings after render. Its content was moved into the visible DOM by a widget. Findings that call this\n    content "hidden from visitors" are WRONG for this page. Re-verify before acting.';}).join('\n')+'\n' : '')+
'Entrance-animation markers ................. '+(p.animationGatedElements||0)+' elements carry one in served HTML ('+(p.animationGatedCount||0)+' outermost blocks with text)'+
  (df.gate&&df.gate.state!=='none' ? '; in the browser: '+gateLine(df.gate)+' ('+df.gate.afterScroll.markers+' still carrying the marker class)' : '; '+df.gating.inDom+' still carrying the marker after render, '+df.gating.stillHidden+' hidden')+'\n'+
'                                             (an element never leaves the DOM when its animation fires — the marker class is removed)\n'+
'Counter widgets ............................ '+(p.counterCount||0)+' in served HTML'+((p.countersWithoutCaption||0)?' ('+p.countersWithoutCaption+' without a caption the parser could find)':'')+(df.counters.length?'; after render ('+df.counters.length+'): '+df.counters.map(function(x){return (x.label?'“'+x.label.slice(0,40)+'”':'counter')+' shows '+x.renderedText+(x.renderedText!==x.toValue?' (target '+x.toValue+')':'')+(x.visible?'':' (hidden)');}).slice(0,8).join(', '):'')+'\n\n'
: (d.renderError ?
'## RENDERED-VS-SERVED DIFF\n'+
'Not available: the page could not be rendered in a browser ('+d.renderError+'). The rest of this\n'+
'work order is from served HTML only. Item 5 of STEP 0 applies in full.\n\n' : ''))+

(d.changes ?
'## CHANGES SINCE THE LAST SCAN ('+d.changes.prevStamp+')\n'+
'  Page content ....... '+(d.changes.pageChanged?'CHANGED':'unchanged — same title, H1, meta, heading counts and text fingerprint')+'\n'+
(d.changes.pageChanged ? (d.changes.changedLines===null ? '                       what changed: not itemised — the previous scan predates change logging; only the fingerprint is available\n'
   : d.changes.changedLines.length ? d.changes.changedLines.map(function(l){return '                       what changed: '+l+'\n';}).join('') : '                       what changed: nothing enumerable (see fingerprint note)\n') : '')+
(d.changes.versionChanged ? '  Scanner rules ...... CHANGED since that scan ('+d.changes.prevVersion+' → '+d.changes.curVersion+'). A finding that disappeared was re-verified item by item; none is marked RESOLVED on the rule change alone.\n' : '')+
'  Rank Score ......... '+d.changes.rank[0]+' → '+d.changes.rank[1]+(d.changes.rank[1]!==d.changes.rank[0]?'  ('+(d.changes.rank[1]-d.changes.rank[0]>0?'+':'')+(d.changes.rank[1]-d.changes.rank[0])+')':'')+(band&&!d.changes.pageChanged&&Math.abs(d.changes.rank[1]-d.changes.rank[0])<=(band.rank[1]-band.rank[0])?'  (inside the confidence band: sample noise, not movement)':'')+'\n'+
(d.changes.rank[1]!==d.changes.rank[0] ? (d.changes.attribution&&d.changes.attribution.lines.length ? attributionLines(d.changes.attribution).join('\n')+'\n' : '                     not attributable: the previous scan predates attribution logging (pre-10.5)\n') : '')+
'  Answer Score ....... '+d.changes.answer[0]+' → '+d.changes.answer[1]+(d.changes.answer[1]!==d.changes.answer[0]?'  ('+(d.changes.answer[1]-d.changes.answer[0]>0?'+':'')+(d.changes.answer[1]-d.changes.answer[0])+')':'')+(band&&!d.changes.pageChanged&&Math.abs(d.changes.answer[1]-d.changes.answer[0])<=(band.answer[1]-band.answer[0])?'  (inside the confidence band: sample noise, not movement)':'')+'\n'+
(d.changes.answer[1]!==d.changes.answer[0] ? (d.changes.attribution&&d.changes.attribution.answer.length ? d.changes.attribution.answer.map(function(a){return '                     '+(a.delta>0?'+':'−')+Math.abs(a.delta)+'  '+a.key+' row — '+a.cause;}).join('\n')+'\n' : '                     row-level attribution not available (previous scan pre-10.5)\n') : '')+
'  Competitor sample .. '+d.changes.n[0]+' → '+d.changes.n[1]+' pages; median word count '+fmt(d.changes.medianWords[0])+' → '+fmt(d.changes.medianWords[1])+'\n'+
'  RESOLVED SINCE LAST SCAN ... '+(d.changes.resolved.length ? '\n'+d.changes.resolved.map(function(f){return '    “'+f.title+'”'+(f.items&&f.items.length?' ['+f.items.slice(0,3).join('; ')+']':'')+'\n      evidence: '+f.why;}).join('\n')+'\n' : 'none\n')+
'  STILL PRESENT (re-verified) '+(d.changes.stillPresent.length ? '\n'+d.changes.stillPresent.map(function(f){return '    “'+f.title+'”'+(f.items&&f.items.length?' ['+f.items.slice(0,3).join('; ')+']':'')+'\n      '+f.why;}).join('\n')+'\n' : 'none\n')+
(d.changes.unverified.length ? '  UNVERIFIED (carried) ....... \n'+d.changes.unverified.map(function(f){return '    “'+f.title+'”\n      '+f.why;}).join('\n')+'\n' : '')+
'  NEW SINCE LAST SCAN ........ '+(d.changes.added.length ? '\n'+d.changes.added.map(function(f){return '    “'+f.title+'”';}).join('\n')+'\n' : 'none\n')+
'  UNCHANGED .................. '+d.changes.carried+' task'+(d.changes.carried===1?'':'s')+' carried forward\n'+
'  WITHDRAWN .................. '+(d.changes.withdrawn.length ? '\n'+d.changes.withdrawn.map(function(f){return '    “'+f.title+'”'+(f.items&&f.items.length?' ['+f.items.slice(0,3).join('; ')+']':'')+'\n      why: '+f.why;}).join('\n')+'\n' : 'none\n')+
'  RESOLVED is claimed only when the exact check that produced the finding was re-run on this\n'+
'  fetch and came back clean; “the page changed” is never evidence on its own. STILL PRESENT is a\n'+
'  task that fell off the list (a rule or sample change) while its items are still on the page —\n'+
'  it is carried into the tasks below, never closed. A WITHDRAWN task is one this tool reported\n'+
'  last time and now believes was a false positive — the page did not change, so the finding\n'+
'  could not have been fixed; it was a render or sample difference. If you acted on one, check\n'+
'  that edit. A tool that silently dropped its own bad findings would teach you not to trust the\n'+
'  good ones, so they are listed here instead.\n\n'
: '')+

'## STEP 0 - VERIFY BEFORE YOU DO ANYTHING\n'+
'This baseline came from an automated scan. Check it before you act on it.\n\n'+
'1. Open EXACTLY this URL: '+d.url+'\n'+
'   Not the homepage. Not a similar page. If the URL you can reach differs in any way, or you\n'+
'   cannot open it at all, say so and stop.\n'+
'2. Compare what you actually see against the MEASURED BASELINE below.\n'+
'3. If ANY figure differs from the baseline, STOP. Do not start Task 1. List every difference\n'+
'   as "baseline says X, I see Y" and ask me which is correct.\n'+
'   Never write "confirmed" or "all accurate" beside numbers that do not match. A disagreement\n'+
'   is a finding, not a formality — and it usually means one of us is looking at the wrong page.\n'+
(r
 ? '4. The baseline figures are read from the served HTML; a rendered copy was also checked, so\n'+
   '   counter widgets and script-injected content are accounted for (see RENDERED-VS-SERVED DIFF).\n'+
   '   If you still find content on the live page that is missing from the baseline, flag it.\n'+
   '5. Content the browser check found hidden from visitors is listed above. If you see it on the\n'+
   '   live page with your own eyes, say so — a rendering difference between browsers is itself\n'+
   '   a finding worth recording.\n\n'
 : '4. This scan reads the page as the server sends it, without running JavaScript. Figures inside\n'+
   '   animated counters, tabs, accordions or script-injected content may exist on the page and be\n'+
   '   missing from the baseline. If you find some, flag them: they are also invisible to any\n'+
   '   crawler that does not execute JavaScript, which is a problem worth fixing in its own right.\n'+
   '5. The scan cannot see rendered CSS. If something is present in the HTML but hidden from human\n'+
   '   visitors on the live page, say so — that is a real defect the scan is blind to.\n\n')+
'## DO NOT MAKE THIS WORSE\n'+
(d.rankScore>=75
 ? 'This page already scores '+d.rankScore+'/100 on Rank — close to parity with what is already\n'+
   'ranking. From here the dominant risk is regression, not stagnation. Treat every change below as\n'+
   'one you must be able to undo, not just one you must be able to justify.\n'
 : '')+
'- Do not change the URL.\n'+
'- Do not edit the title tag or H1 without telling me the exact before/after and why — both carry\n'+
'  ranking signal on their own, separate from anything else on this list.\n'+
'- The ROLLBACK SNAPSHOT below is the restore point. Before any edit, confirm it still matches.\n\n'+
'## ROLLBACK SNAPSHOT (as measured '+d.stamp+')\n'+
'Paste these back to undo. Everything here is the current live value, not a suggestion.\n\n'+
'  Title tag .......... '+(p.httpTitle||'(empty)')+'\n'+
'  Meta description ... '+(p.metaDescription||'(empty)')+'\n'+
'  H1 ................. '+((p.h1&&p.h1[0])||'(none)')+'\n'+
'  Canonical .......... '+(p.canonical||'(none)')+'\n'+
'  Heading outline .... '+((p.outline&&p.outline.length)
   ? '\n'+p.outline.slice(0,80).map(function(h){return '    '+'  '.repeat(Math.max(h.level-1,0))+'H'+h.level+'  '+h.text;}).join('\n')+(p.outline.length>80?'\n    … '+(p.outline.length-80)+' more headings':'')
   : '(ask me to paste it — the scan did not capture an ordered outline)')+'\n\n'+
'## HOW I WANT YOU TO WORK\n'+
'There are '+d.fixes.length+' tasks below in two explicitly ranked sections. Section A (OUT-OF-SCORE) is\n'+
'visitor-facing and integrity defects that sit outside the two 100-point tables; each carries a\n'+
'fixed weight, not table points. Section B (IN-SCORE) recovers points from the Rank and Answer\n'+
'tables and is ordered by points per hour — arithmetic you can check. Ordering WITHIN each\n'+
'section is arithmetic; ordering A before B is a judgement call, stated as such: a demo button a\n'+
'visitor cannot see costs revenue now, a missing H3 does not. Work them in order. After each task,\n'+
'show me the finished output and stop. Wait for me to say go before starting the next one.\n'+
'Effort model: 1 day = 6 hours, half day = 3 hours, then 2 hrs / 1 hr / 30 min / 15 min. All pts/hr figures use\n'+
'this. Section B labels are a pure function of pts/hr: HIGH ≥ 10, MEDIUM ≥ 5, otherwise LOW. CRITICAL is reserved\n'+
'for Section A — something wrong on a live commercial page, not something merely absent.\n\n'+
NO_INVENT+'\n\n'+
'Before you start Task 1, ask me for two things: the current page copy, and the current\n'+
'heading outline (or confirm the ROLLBACK SNAPSHOT outline is still current). Almost every\n'+
'task below needs them.\n\n'+
'## MEASURED BASELINE\n'+
'From a live scan of the top '+m.total+' Google results for this keyword. SPREAD is min–max across them;\n'+
'a median with a wide spread is a soft target, not a hard one.\n\n'+
line('SIGNAL','THIS PAGE','TOP-'+m.total+' MEDIAN','SPREAD (MIN–MAX)')+'   MEDIAN RANGE (leave-one-out)\n'+
'  '+'-'.repeat(100)+'\n'+
line('Body word count', fmt(p.wordCount)+(wc?' '+wc.scored+' · '+(wc.scored==='served'?fmt(wc.rendered)+' rendered':fmt(wc.served)+' served'):''), fmt(m.wordCount), rng('wordCount'))+'   '+mrng('wordCount')+(wc&&wc.basisDifference?'   BASIS DIFFERENCE '+wc.diffPct+'% ('+(wc.explain?wc.explain.split(';')[0]:'carousel + script-mounted')+')':'')+(overParityNote(p.wordCount,m.wordCount)?'\n  NOTE — '+overParityNote(p.wordCount,m.wordCount):'')+'\n'+
line('H2 sections', p.h2Count+(p.h2Template?' ('+p.h2Template+' feed)':''), m.h2Count, rng('h2Count'))+'   '+mrng('h2Count')+'\n'+
line('H3 subheadings', p.h3Count+(p.h3Template?' ('+p.h3Template+' feed)':''), m.h3Count, rng('h3Count'))+'   '+mrng('h3Count')+'\n'+
line('Question-shaped headings', p.questionHeadingCount, m.questionHeadingCount, rng('questionHeadingCount'))+'   '+mrng('questionHeadingCount')+'\n'+
line('Quantified claims', p.statCount, m.statCount, rng('statCount'))+'   '+mrng('statCount')+'\n'+
line('Lists', p.listCount, m.listCount, rng('listCount'))+'   '+mrng('listCount')+'\n'+
line('Tables', p.tableCount, m.tableN+' of '+m.total, '')+'\n'+
line('Keyword in title tag', p.kwInTitle?'yes':'NO', m.kwInTitleN+' of '+m.total, '')+'\n'+
line('Keyword in H1', p.kwInH1?'yes':'NO', m.kwInH1N+' of '+m.total, '')+'\n'+
line('FAQ/Product/Service schema', (p.hasFaqSchema||p.hasProductSchema)?'yes':'NO', m.schemaN+' of '+m.total, '')+'\n\n'+
'Word count follows the rule in METHODOLOGY (main content only, so a whole-page count reads\n'+
'higher — whole page (served HTML) '+fmt(p.pageWordCount||p.wordCount)+(wc?', whole page (rendered, painted) '+fmt(wc.renderedPage):'')+'). '+(wc?'The scored word count is the '+wc.scored.toUpperCase()+' figure ('+fmt(wc.scoredWords)+'), the basis every page in the comparison shares'+(wc.basisDifference?'; the rendered figure differs by '+wc.diffPct+'% — see Word count check':'')+'. ':'')+'Quantified claims are figures inside a sentence; a bare\n'+
'number lifted out of a widget is not counted twice.\n\n'+
'Current title tag: "'+(p.httpTitle||'(empty)')+'"\n'+
'Current H1: "'+((p.h1&&p.h1[0])||'(none found)')+'"\n'+
'Current meta description: "'+(p.metaDescription||'(empty)')+'"\n'+
(p.schemaTopLevel
 ? 'Schema, top-level entities ('+p.schemaTopLevel.length+'): '+(p.schemaTopLevel.join(', ')||'none')+'\n'+
   'Schema, nested sub-objects ('+(p.schemaNested||[]).length+'): '+((p.schemaNested||[]).join(', ')||'none')+'\n'+
   ((p.schemaClaims||[]).length ? 'Schema items checked against page text: '+(p.schemaClaims.length-p.schemaClaimsAbsent)+' present, '+p.schemaClaimsAbsent+' absent\n' : '')
 : 'Schema types found: '+((p.schemaTypes||[]).join(', ')||'none')+'\n')+
'\nA note on targets: aim for PARITY with the median, never more. Overshooting a median is how\n'+
'a page ends up padded with filler that dilutes it.\n\n';

  if(d.missingInfo && d.missingInfo.length){
    out += '## CATEGORY VOCABULARY THIS PAGE IS MISSING\n'+
    'Concepts appearing across several pages that outrank this one, absent here. One line per\n'+
    'concept; surface forms in brackets. Presence was checked against the served HTML AND the\n'+
    'rendered visible text'+(d.diff&&d.diff.gateStuck?' (render self-check failed, so visibility is unverified on this scan)':'')+':\n'+
    '  PRESENT BUT HIDDEN = in the HTML, invisible to a visitor — scored as missing until visible\n'+
    '  ABSENT             = not on the page at all\n'+
    vocabLines(c)+'\n'+
    'OWN STACK = named elsewhere on this site (navigation, links, product pages) but not on this page\n'+
    '            — the business already offers it and the page never says so. Usually the best term here.\n'+
    'VOCABULARY = category language. Use judgement; I would rather you exclude a term than force it.\n'+
    'COMPETITOR = a domain ranking for this keyword. Do not add unless a real comparison exists.\n\n';
  } else if(d.missing && d.missing.length){
    out += '## CATEGORY VOCABULARY THIS PAGE IS MISSING\n'+
    'Terms appearing across several pages that outrank this one, absent here:\n'+
    '  '+d.missing.slice(0,24).join(', ')+'\n'+
    'Some of these will be competitor brands or adjacent products that would be wrong to add.\n'+
    'Use judgement — I would rather you exclude a term than force it.\n\n';
  }

  out += '## THE TASKS\n\n';
  let lastSection='';
  d.fixes.forEach(function(f,i){
    const sec=f._section||(f._extra?'OUT-OF-SCORE':'IN-SCORE');
    if(sec!==lastSection){
      out += (sec==='OUT-OF-SCORE'
        ? '### SECTION A — OUT-OF-SCORE (visitor-facing and integrity defects; fixed weight, ranked by weight per hour)\n\n'
        : '### SECTION B — IN-SCORE (recovers Rank/Answer points; ranked by points per hour)\n\n');
      lastSection=sec;
    }
    out += '### Task '+(i+1)+' — '+f.title+(f._soft?'  [SOFT TARGET]':'')+'\n'+
      '['+f.severity+' · about '+f.effort.toLowerCase()+' · '+impactText(f)+']\n\n'+
      'Why: '+f.body+'\n'+
      (f.code ? '\nMeasured:\n'+f.code.split('\n').map(function(l){return '  '+l;}).join('\n')+'\n' : '')+
      '\nDo this: '+taskLine(f,c)+'\n\n';
  });

  out += '## SCORE RECONCILIATION\n'+
  'Every point below 100 on either table is either claimed by a task above or declared\n'+
  'unreachable here — so "nothing left to do" and "the tool ran out of ideas" never read the\n'+
  'same in this report.\n\n'+
  (rankReconcile ? '  '+reconcileText(rankReconcile)+'\n\n' : '')+
  (answerReconcile ? '  '+reconcileText(answerReconcile)+'\n\n' : '');

  out += '## WHEN YOU ARE DONE\n'+
  'Give me a single checklist of every change, grouped by where it goes: title tag, head section,\n'+
  'page body, structured data. That is what I will hand to whoever edits the site.\n\n'+
  'Then list, in one place, every fact you needed from me and did not get.\n';
  return out;
}

// "+8 pts ANSWER, about 16 pts/hr" - the arithmetic behind the task order, shown so it can be
// argued with. Signals outside the two 100-point tables show their weight instead.
function impactText(f){
  const pts=Math.round(f._pts||0), hrs=f._hours||1;
  const perHr=Math.round((f._pts||0)/Math.max(hrs,0.15));
  if(f._extra) return 'weight '+pts+' outside the score tables, affects '+f.engine.toLowerCase()+' · ≈'+perHr+' pts/hr';
  return '+'+pts+' pts on '+f.engine+' · ≈'+perHr+' pts/hr';
}

function taskLine(f,c){
  const m=c.medians, p=c.page, kw=c.keyword;
  switch(f.key){
    case 'kwInTitle': return 'Write 5 title tags, 50-60 characters, "'+kw+'" in the first 35 characters, ending " | '+c.brand+'". Show the character count for each and recommend one.';
    case 'kwInH1': return 'Write 5 H1 options under 70 characters that contain "'+kw+'" and describe the page rather than sell it. Recommend one.';
    case 'hiddenContent': return 'Give me the one-minute reproduction on the live page, then the diagnosis — stuck entrance animation, or a modal/tab that is meant to be closed — then the fix: page builder first, scoped CSS second, global override last with its cost stated. Anything hidden that is intentional, say so and move on.';
    case 'animGate': return 'Give me a one-minute check to confirm whether this content is actually visible on the live page, then the fix — page builder first, scoped CSS second, global override last with its cost stated. Do not assume it is broken before I confirm.';
    case 'jsStats': return 'Rewrite the '+(p.jsHiddenStatCount||0)+' counter figures as plain server-rendered text so they exist in the HTML without JavaScript. Use the recovered values exactly; confirm their source with me first.';
    case 'stats': return 'Ask me for the real figures FIRST — customer, metric, timeframe, permission to name them — and suggest which '+Math.max(m.statCount-p.statCount,1)+' metrics would be most persuasive. Write nothing until I answer. If I have no data, give me a collection plan instead.';
    case 'questionHeadings': return 'Write '+qNeed(p,m)+' question heading'+(qNeed(p,m)===1?'':'s')+', each followed by a 35-50 word answer that answers the question in its first sentence. Flag any figure you need from me rather than inventing one.';
    case 'h3Count': return 'Produce a full heading outline taking the page to about '+m.h3Count+' H3s, with a word budget beside each.';
    case 'wordCount': return 'Do not write to a word count. List the specific buyer questions about "'+kw+'" this page leaves unanswered, using only the current copy plus facts I give you. Answer each one in as many words as it genuinely takes, then total the result — if it lands short of '+m.wordCount.toLocaleString()+' words, tell me what real gaps remain rather than padding to close the gap.';
    case 'h3Fragmented': return 'Merge the current H3s into the '+m.h3Count+' subheadings that each carry a genuinely distinct idea; show old-to-new mapping. Do this before any task that adds new headings.';
    case 'claimsAudit': return 'For each of the '+p.statCount+' quantified claims already on the page, tell me what you can and cannot verify from what I give you, and ask for the source, date and permission to publish for anything unverified. Flag, do not delete.';
    case 'schemaMismatch': return 'Work from the PRESENT/ABSENT list above: for every ABSENT item either put the content on the page or take it out of the JSON-LD, list every mismatch in either direction, and produce corrected JSON-LD. If this list also adds new question headings, fold them into this task rather than leaving the schema to catch up later.';
    case 'table': return 'Ask me for the real specs, then build a comparison table as clean semantic HTML — rows are options, columns are dimensions, every cell a concrete value.';
    case 'schema': return 'Ask me for the FAQ content and product details, then produce only the JSON-LD the page content actually supports. If there is no FAQ on the page, say it has to be written first. If there are service categories rather than priced products, use Service and tell me what Product would need.';
    case 'entities': return 'Start with the OWN STACK terms — confirm each with me, then work them in. Then judge the VOCABULARY terms. Leave COMPETITOR terms out unless I say otherwise. Show before/after sentences for every term you add.';
    case 'listCount': return 'Find prose that should be lists and rewrite it as clean HTML lists with parallel grammar.';
    case 'kwInMeta': return 'Write 5 meta descriptions, 140-155 characters, containing "'+kw+'", each with its character count.';
    case 'h2Count': return 'Propose a revised H2 structure covering the buyer journey for "'+kw+'".';
    case 'dupHeadings': return f._template
      ? 'Do not touch the page body. In the widget that produces the SECOND feed, either set the title element\'s HTML tag to H4 (or a non-heading element), or set the query offset so the two feeds return non-overlapping posts. Do not delete the posts and do not retitle them — the titles are correct. Confirm which feed is second by its position on the page.'
      : 'For each repeated heading text listed above, keep the editorial copy and remove or retitle the others; show me the before/after outline with the duplicates gone and nothing else changed.';
    case 'counterCaptionHeadings': return 'This is a widget/markup setting, not a content edit. For each counter caption listed above, change its tag to a <div> or <span> (or use the widget\'s own "caption element" setting if it has one). Keep the text exactly as-is, and do not touch any other heading — the pillars and the question headings stay untouched.';
    default: return 'Read the measured figures for this item above, tell me exactly what you would change on the page and why, and show the before/after. Do not write anything until I confirm the facts you need.';
  }
}

// Node sees `module`; the browser does not, so this is inert in a page and is the whole of the
// server-side surface.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RANK_W,
    ANSWER_W,
    FIX_META,
    W_EXTRA,
    FIX_METRIC,
    COMP_FLOOR_WORDS,
    esc,
    median,
    ratio,
    effortLabel,
    spreadOf,
    medians,
    foldT,
    GLUE_T,
    initialsOf,
    sameConcept,
    categoryEntities,
    classifyTerm,
    row,
    overParityNote,
    scoreRank,
    scoreAnswer,
    scoreReconciliation,
    reconcileText,
    looBand,
    gateLine,
    gateVerdict,
    wordCheck,
    wordCheckText,
    cloneLines,
    compositionLines,
    medText,
    bandText,
    reconcileHidden,
    relocationLines,
    renderDiff,
    SCANNER_VERSION,
    fingerprintOf,
    snapshotOf,
    loadHistoryAll,
    volatileHistory,
    histKey,
    loadHistory,
    saveHistory,
    whatChanged,
    recheckFinding,
    diffScans,
    wordUnderRules,
    pageFromSnap,
    attributeScore,
    attributionLines,
    carryForward,
    NO_INVENT,
    verifyFirst,
    ctxBlock,
    counterLines,
    claimLines,
    vocabLines,
    promptFor,
    masterPrompt,
    impactText,
    taskLine
  };
}
