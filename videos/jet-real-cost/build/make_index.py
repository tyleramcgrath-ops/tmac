import json
m=json.load(open('audio_meta.json'))
TOTAL=34.2
starts=[];t=0.10
for v in m['voices']:
    starts.append(round(t,3)); t+=v['duration_s']+0.12
audio=[]
for i,v in enumerate(m['voices']):
    audio.append(f'<audio id="vo{i+1}" class="clip" src="{v["path"]}" data-start="{starts[i]}" data-duration="{v["duration_s"]}" data-track-index="10" data-volume="1"></audio>')
audio.append(f'<audio id="bgm" class="clip" src="assets/bgm/dark-pulse.mp3" data-start="0" data-duration="{TOTAL}" data-track-index="11" data-volume="0.22"></audio>')
sfx=[('whoosh-short',2.19,0.5),('whoosh-short',3.02,0.5),('impact-bass-2',4.10,0.9),('impact-bass-1',5.76,0.8),
     ('click',8.64,0.6),('click',9.19,0.6),('click',9.77,0.6),('click',10.50,0.6),('impact-bass-1',11.47,0.9),
     ('whoosh-short',14.69,0.5),('impact-bass-1',17.24,0.8),('whoosh-short',18.63,0.5),('impact-bass-2',21.89,0.9),
     ('riser',23.9,0.5),('impact-bass-2',25.19,1.0),('impact-bass-1',27.21,0.8),('whoosh-short',29.94,0.5),('impact-bass-1',32.07,0.9)]
for k,(n,s,vol) in enumerate(sfx):
    audio.append(f'<audio id="sfx{k}" class="clip" src="assets/sfx/{n}.mp3" data-start="{s}" data-duration="1.2" data-track-index="{20+k%4}" data-volume="{vol}"></audio>')
html=f'''<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<script src="assets/vendor/gsap.min.js"></script>
<style>
@font-face{{font-family:"Barlow";src:url("assets/fonts/Barlow-700.woff2") format("woff2");font-weight:700;font-display:block}}
@font-face{{font-family:"Barlow";src:url("assets/fonts/Barlow-800.woff2") format("woff2");font-weight:800;font-display:block}}
@font-face{{font-family:"Barlow";src:url("assets/fonts/Barlow-900.woff2") format("woff2");font-weight:900;font-display:block}}
@font-face{{font-family:"Plex";src:url("assets/fonts/IBM_Plex_Mono-600.woff2") format("woff2");font-weight:600;font-display:block}}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:1080px;height:1920px;overflow:hidden;background:#000}}
#root{{position:relative;width:1080px;height:1920px;overflow:hidden;background:#000;font-family:"Barlow",sans-serif}}
#footage{{position:absolute;inset:0;width:1080px;height:1920px;object-fit:cover}}
#shade{{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.72) 0%,rgba(0,0,0,.15) 32%,rgba(0,0,0,0) 50%,rgba(0,0,0,.25) 72%,rgba(0,0,0,.65) 100%)}}
#ov{{position:absolute;inset:0}}
.abs{{position:absolute;left:0;right:0;text-align:center}}
.big{{font-weight:900;text-transform:uppercase;letter-spacing:-.02em;line-height:.9;color:#fff;
  text-shadow:0 6px 0 rgba(0,0,0,.35),0 10px 40px rgba(0,0,0,.75)}}
.red{{color:#FF3B30}} .gold{{color:#FFC94A}} .green{{color:#5CFF7A}}
.lab{{font-family:"Plex",monospace;font-weight:600;letter-spacing:.16em;text-transform:uppercase;font-size:34px;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.9)}}
#banner{{position:absolute;top:120px;left:50%;transform:translateX(-50%);padding:14px 30px;font-family:"Plex",monospace;font-weight:600;
  font-size:40px;letter-spacing:.14em;white-space:nowrap;border-radius:6px}}
#bSee{{background:#FFC94A;color:#111}} #bPay{{background:#FF3B30;color:#fff}}
#chip{{position:absolute;top:235px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.72);border:3px solid #FF3B30;border-radius:10px;
  padding:10px 28px;white-space:nowrap;display:flex;gap:22px;align-items:baseline}}
#chip .k{{font-family:"Plex",monospace;font-weight:600;font-size:30px;letter-spacing:.14em;color:#ddd}}
#chip .v{{font-weight:900;font-size:64px;color:#FF3B30;font-variant-numeric:tabular-nums}}
.row{{position:absolute;left:90px;right:90px;display:flex;justify-content:space-between;align-items:baseline;
  background:rgba(0,0,0,.6);border-left:10px solid #FF3B30;padding:18px 30px;border-radius:8px}}
.row .n{{font-weight:800;font-size:64px;color:#fff;text-transform:uppercase}}
.row .p{{font-weight:900;font-size:84px;color:#FF3B30}}
#flash{{position:absolute;inset:0;background:#fff;opacity:0}}
#tag{{position:absolute;left:50%;top:1290px;transform:translateX(-50%) rotate(-4deg);background:#fff;color:#111;border-radius:14px;
  padding:16px 40px 20px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.6)}}
#tag .t1{{font-family:"Plex",monospace;font-weight:600;font-size:30px;letter-spacing:.16em}}
#tag .t2{{font-weight:900;font-size:150px;line-height:1;font-variant-numeric:tabular-nums}}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
  <video id="footage" class="clip" src="assets/footage/track.mp4" muted playsinline data-start="0" data-duration="{TOTAL}" data-track-index="0"></video>
  <div id="ovl" class="clip" data-start="0" data-duration="{TOTAL}" data-track-index="1" style="position:absolute;inset:0">
    <div id="shade"></div>
    <div id="ov">
      <div id="bSee" class="bn" style="position:absolute;top:120px;left:50%;transform:translateX(-50%);padding:14px 30px;font-family:Plex,monospace;font-weight:600;font-size:40px;letter-spacing:.14em;white-space:nowrap;border-radius:6px">WHAT THEY SEE</div>
      <div id="bPay" class="bn" style="position:absolute;top:120px;left:50%;transform:translateX(-50%);padding:14px 30px;font-family:Plex,monospace;font-weight:600;font-size:40px;letter-spacing:.14em;white-space:nowrap;border-radius:6px;opacity:0">WHAT THEY PAY</div>
      <div id="chip" style="opacity:0"><span class="k">REAL COST / YR</span><span class="v" id="chipv">$0</span></div>

      <div id="h1" class="abs big gold" style="top:300px;font-size:128px">THE PRIVATE JET.</div>
      <div id="h2" class="abs big" style="top:300px;font-size:128px;opacity:0">THE CHAMPAGNE.</div>
      <div id="h3" class="abs big" style="top:300px;font-size:128px;opacity:0">THE LIFESTYLE.</div>

      <div id="bill" class="abs big red" style="top:340px;font-size:150px;opacity:0">THE BILL.</div>
      <div id="tag" style="opacity:0;top:1180px"><div class="t1">PURCHASE PRICE</div><div class="t2" id="tagv" style="font-size:130px">$9,450,000</div></div>
      <div id="model" class="abs lab" style="top:1440px;opacity:0;font-size:30px">LIGHT JET · e.g. EMBRAER PHENOM 300E</div>

      <div id="f1" class="row" style="top:420px;opacity:0"><span class="n">Pilots</span><span class="p">✓</span></div>
      <div id="f2" class="row" style="top:560px;opacity:0"><span class="n">Hangar</span><span class="p">✓</span></div>
      <div id="f3" class="row" style="top:700px;opacity:0"><span class="n">Insurance</span><span class="p">✓</span></div>
      <div id="f4" class="row" style="top:840px;opacity:0"><span class="n">Management</span><span class="p">✓</span></div>
      <div id="fV" class="abs big red" style="top:1000px;font-size:190px;opacity:0">$359,130</div>
      <div id="fD" class="abs big" style="top:1190px;font-size:70px;opacity:0">A YEAR. BEFORE IT FLIES.</div>

      <div id="flL" class="abs lab" style="top:560px;opacity:0;font-size:44px">FLY IT 100 HOURS</div>
      <div id="flV" class="abs big red" style="top:630px;font-size:200px;opacity:0">+$165,200</div>
      <div id="flD" class="abs big" style="top:850px;font-size:80px;opacity:0">FUEL. MAINTENANCE.</div>

      <div id="opL" class="abs lab" style="top:520px;opacity:0;font-size:44px">IF YOU'D INVESTED IT</div>
      <div id="opA" class="abs big" style="top:590px;font-size:160px;opacity:0">$9,450,000</div>
      <div id="opB" class="abs big gold" style="top:750px;font-size:120px;opacity:0">× 5%</div>
      <div id="opC" class="abs big red" style="top:890px;font-size:170px;opacity:0">−$472,500</div>
      <div id="opD" class="abs big" style="top:1070px;font-size:96px;opacity:0">A YEAR. GONE.</div>

      <div id="totL" class="abs lab" style="top:500px;opacity:0;font-size:46px">THE REAL COST</div>
      <div id="totV" class="abs big red" style="top:570px;font-size:220px;opacity:0">$996,830</div>
      <div id="totY" class="abs big" style="top:800px;font-size:110px;opacity:0">PER YEAR.</div>
      <div id="totS" class="abs big gold" style="top:950px;font-size:92px;opacity:0">$10,000 / HOUR<br>IN THE AIR.</div>

      <div id="o1" class="abs big gold" style="top:420px;font-size:118px;opacity:0">THEY SEE<br>THE JET.</div>
      <div id="o2" class="abs big" style="top:680px;font-size:118px;opacity:0">YOU KNOW<br>THE MATH.</div>
      <div id="o3" class="abs big red" style="top:300px;font-size:150px;opacity:0">STILL WANT<br>THE JET?</div>
      <div id="src" class="abs" style="top:1830px;opacity:0;font-size:22px;color:rgba(255,255,255,.6);font-family:Barlow">Estimates for a light jet (Phenom 300E) at 100 hrs/yr, excl. depreciation. Source: Flycraft. Opportunity cost at 5% is our estimate.</div>
      <div id="flash"></div>
    </div>
  </div>
  <div id="caps" data-composition-id="captions" data-composition-src="compositions/captions.html" data-start="0" data-duration="{TOTAL}" data-track-index="2"></div>
  {chr(10).join("  "+a for a in audio)}
</div>
<script>
(function(){{
  window.__timelines = window.__timelines || {{}};
  var tl = gsap.timeline({{ paused: true }});
  var SL = function(sel, at, from){{ tl.fromTo(sel, Object.assign({{opacity:0, scale:1.6, filter:"blur(12px)"}}, from||{{}}), {{opacity:1, scale:1, y:0, x:0, filter:"blur(0px)", duration:0.22, ease:"power4.out", immediateRender:false}}, at); }};
  var OUT = function(sel, at){{ tl.to(sel, {{opacity:0, duration:0.12, ease:"none"}}, at); }};
  var chipN = {{v:0}}, chipEl = document.getElementById("chipv");
  function fmt(n){{ return "$" + Math.round(n).toLocaleString("en-US"); }}
  function chipTo(v, at){{ tl.to(chipN, {{v:v, duration:0.45, ease:"power2.out", onUpdate:function(){{ chipEl.textContent = fmt(chipN.v); }}}}, at);
    tl.fromTo("#chip", {{scale:1.18}}, {{scale:1, duration:0.3, ease:"power3.out", immediateRender:false}}, at); }}
  tl.set(chipEl, {{textContent:"$0"}}, 0);

  // HOOK
  tl.fromTo("#h1", {{scale:1.12}}, {{scale:1, duration:0.5, ease:"power3.out"}}, 0);
  OUT("#h1", 2.19); SL("#h2", 2.21); OUT("#h2", 3.02); SL("#h3", 3.04); OUT("#h3", 4.08);
  // TURN
  tl.fromTo("#flash", {{opacity:0}}, {{opacity:0.85, duration:0.05, ease:"none", immediateRender:false}}, 4.10);
  tl.to("#flash", {{opacity:0, duration:0.3, ease:"power2.out"}}, 4.15);
  OUT("#bSee", 4.10); tl.fromTo("#bPay", {{opacity:0, scale:1.4}}, {{opacity:1, scale:1, duration:0.2, ease:"back.out(2)", immediateRender:false}}, 4.10);
  SL("#bill", 5.26, {{rotation:-8}}); tl.to("#bill", {{rotation:-4, duration:0.2}}, 5.48);
  var tagN = {{v:0}}, tagEl = document.getElementById("tagv");
  tl.fromTo("#tag", {{opacity:0, y:120}}, {{opacity:1, y:0, duration:0.3, ease:"back.out(1.6)", immediateRender:false}}, 5.70);
  tl.fromTo(tagN, {{v:0}}, {{v:9450000, duration:1.0, ease:"power3.out", immediateRender:false, onUpdate:function(){{ tagEl.textContent = fmt(tagN.v); }}}}, 5.76);
  SL("#model", 7.41, {{scale:1}});
  OUT(["#bill","#tag","#model"], 8.55);
  // FIXED COSTS
  tl.fromTo("#chip", {{opacity:0, y:-30}}, {{opacity:1, y:0, duration:0.25, ease:"power3.out", immediateRender:false}}, 8.60);
  SL("#f1", 8.64, {{scale:1, x:-300}}); SL("#f2", 9.19, {{scale:1, x:-300}}); SL("#f3", 9.77, {{scale:1, x:-300}}); SL("#f4", 10.50, {{scale:1, x:-300}});
  SL("#fV", 11.47); chipTo(359130, 11.47); SL("#fD", 13.00, {{scale:1.2}});
  OUT(["#f1","#f2","#f3","#f4","#fV","#fD"], 14.66);
  // FLYING
  SL("#flL", 14.82, {{scale:1, y:20}}); SL("#flV", 17.24); chipTo(524330, 17.24); SL("#flD", 17.70, {{scale:1.2}});
  OUT(["#flL","#flV","#flD"], 18.60);
  // OPPORTUNITY
  SL("#opL", 18.75, {{scale:1, y:20}}); SL("#opA", 19.09); SL("#opB", 20.99); SL("#opC", 21.89); chipTo(996830, 21.89); SL("#opD", 23.66);
  OUT(["#opL","#opA","#opB","#opC","#opD"], 24.70);
  // TOTAL
  OUT("#chip", 24.74);
  SL("#totL", 24.78, {{scale:1, y:20}});
  var totN = {{v:524330}}, totEl = document.getElementById("totV");
  tl.fromTo("#totV", {{opacity:0, scale:0.6}}, {{opacity:1, scale:1, duration:1.2, ease:"power3.out", immediateRender:false}}, 25.19);
  tl.fromTo(totN, {{v:524330}}, {{v:996830, duration:1.2, ease:"power3.out", immediateRender:false, onUpdate:function(){{ totEl.textContent = fmt(totN.v); }}}}, 25.19);
  tl.fromTo("#totV", {{x:0}}, {{x:12, duration:0.04, yoyo:true, repeat:5, ease:"none", immediateRender:false}}, 26.40);
  SL("#totY", 26.93); SL("#totS", 27.21, {{scale:1.3}});
  OUT(["#totL","#totV","#totY","#totS","#bPay"], 29.92);
  // OUTRO
  SL("#o1", 30.01); SL("#o2", 31.03);
  OUT(["#o1","#o2"], 32.03); SL("#o3", 32.07, {{scale:2}});
  tl.fromTo("#src", {{opacity:0}}, {{opacity:1, duration:0.3, immediateRender:false}}, 32.3);
  tl.to({{}}, {{duration:{TOTAL}}}, 0);
  window.__timelines["main"] = tl;
}})();
</script>
</body>
</html>
'''
open('index.html','w').write(html)
print('written', len(html))
