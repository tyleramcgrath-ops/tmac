import sys, os, subprocess, json
# usage: thumb.py projdir src.mp4 offset cropx headline_html pill label value
d,src,off,fx,head,pill,label,value=sys.argv[1:9]
os.makedirs(f'{d}/thumb',exist_ok=True)
subprocess.run(['ffmpeg','-v','error','-y','-ss',off,'-i',f'{d}/raw/{src}','-frames:v','1','-vf','eq=contrast=1.08:saturation=1.2','-q:v','2',f'{d}/thumb/a.jpg'],check=True)
tpl='''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:B;src:url(../assets/fonts/Barlow-800.woff2);font-weight:800}
@font-face{font-family:M;src:url(../assets/fonts/IBM_Plex_Mono-500.woff2);font-weight:500}
*{margin:0;padding:0;box-sizing:border-box}
body{width:@@W@@;height:@@H@@;overflow:hidden;background:#000;font-family:B}
.a{position:absolute;inset:0;background:url(a.jpg) @@FX@@ 45%/cover}
.sh{position:absolute;inset:0;background:@@SHADE@@}
.h{position:absolute;@@HPOS@@;color:#fff;font-weight:800;font-size:@@HS@@;line-height:.95;text-shadow:0 6px 30px rgba(0,0,0,.7)}
.h span{color:#FFC94A}
.pill{position:absolute;@@PPOS@@;font-family:M;font-weight:500;font-size:@@PS@@;letter-spacing:.14em;color:#fff;padding:12px 26px;border-radius:50px;background:rgba(0,0,0,.45);border:2px solid rgba(255,255,255,.7)}
.pill b{display:inline-block;width:18px;height:18px;border-radius:50%;margin-right:16px;vertical-align:middle;background:#FFC94A}
.n{position:absolute;@@NPOS@@;color:#fff;text-shadow:0 6px 30px rgba(0,0,0,.7)}
.n .v{font-weight:800;font-size:@@VS@@;line-height:1}
.n .k{display:inline-block;background:rgba(0,0,0,.6);padding:6px 14px;border-radius:8px;font-family:M;font-size:@@KS@@;letter-spacing:.14em;color:#5CFF7A;margin-bottom:6px}
</style></head><body><div class="a"></div><div class="sh"></div>
<div class="h">@@HEAD@@</div><div class="pill"><b></b>@@PILL@@</div><div class="n"><div class="k">@@LABEL@@</div><div class="v">@@VALUE@@</div></div></body></html>'''
V=dict(W='1080px',H='1920px',FX=f'{float(fx)*100}%',SHADE='linear-gradient(180deg,rgba(0,0,0,.7),rgba(0,0,0,0) 30%,rgba(0,0,0,0) 60%,rgba(0,0,0,.85))',
  HPOS='top:90px;left:0;right:0;text-align:center',HS='104px',PPOS='left:60px;top:1330px',PS='40px',NPOS='left:60px;top:1430px',VS='160px',KS='34px')
Wd=dict(W='1280px',H='720px',FX=f'{float(fx)*100}%',SHADE='linear-gradient(90deg,rgba(0,0,0,.82),rgba(0,0,0,.25) 55%,rgba(0,0,0,0))',
  HPOS='top:50px;left:50px;text-align:left',HS='80px',PPOS='left:50px;top:420px',PS='28px',NPOS='left:50px;top:500px',VS='120px',KS='24px')
for name,vals in (('thumb.html',V),('thumb-wide.html',Wd)):
    h=tpl
    for k,v in vals.items(): h=h.replace('@@'+k+'@@',v)
    h=h.replace('@@HEAD@@',head).replace('@@PILL@@',pill).replace('@@LABEL@@',label).replace('@@VALUE@@',value)
    open(f'{d}/thumb/{name}','w').write(h)
