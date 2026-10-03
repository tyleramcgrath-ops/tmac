#!/usr/bin/env python3
"""Build an Apex Revival Short (people-first, subtle receipt tags) from spec.json in a project dir.

spec.json:
{ "voice_speed":1.15,
  "lines":[{"text":"...", "shots":[["mk123.mp4@0.5", 2.0, "lux", "word"], ...]}, ...],   # shot starts at the given word of the line (first shot = line start)
  "pills":[["text", "L1:word" | "L1", "L3:word", "#FFC94A"], ...],                        # [label, start, end, dotcolor]
  "tags":[["LABEL","VALUE","sub or ''", "L2:word", "L3:word", "green|''"], ...],
  "mids":[["text (html ok)", "L6:word", "L7:word" or "END", size, "#color"], ...],
  "footnote":"...", "caption_fix":{"whisperword":"fixed"} }
Stages: tts | cut | index | all
"""
import json, os, re, subprocess, sys
P=os.getcwd(); S=json.load(open('spec.json'))
FE=os.path.expanduser('~/.claude/skills/faceless-explainer/scripts')
LEAD, GAP, TAIL = 0.10, 0.12, 0.9

def sh(*a, **k): subprocess.run(list(a), check=True, **k)

def tts():
    lines=S['lines']
    sb=["---","format: 1080x1920","mode: autonomous","music: none","---",""]
    for i,l in enumerate(lines,1): sb+= [f"## Frame {i} — L{i}", "- duration: 4s", f'- voiceover: "{l["text"]}"', ""]
    open('STORYBOARD.md','w').write("\n".join(sb))
    sc=["# SCRIPT","","**Voice:** am_michael (Kokoro)","","---",""]
    for i,l in enumerate(lines,1): sc+= [f"## Line {i} — L{i} (Frame {i})","",f"    {l['text']}",""]
    open('SCRIPT.md','w').write("\n".join(sc))
    sh('node',f'{FE}/audio.mjs','--script','./SCRIPT.md','--storyboard','./STORYBOARD.md','--hyperframes','.','--out','./audio_meta.json','--voice','am_michael','--speed',str(S.get('voice_speed',1.15)))

def timing():
    m=json.load(open('audio_meta.json')); starts=[]; t=LEAD
    for v in m['voices']: starts.append(round(t,3)); t+=v['duration_s']+GAP
    total=round(t-GAP+TAIL,2)
    return m, starts, total

def norm(w): return re.sub(r'[^a-z0-9$%]','',w.lower())

def at(ref, m, starts, total):
    if ref=='END': return total
    if isinstance(ref,(int,float)): return float(ref)
    li, _, word = ref.partition(':'); i=int(li[1:])-1
    if not word: return starts[i]
    occ=1
    if '#' in word: word,occ=word.split('#'); occ=int(occ)
    seen=0
    for w in m['voices'][i]['words']:
        if norm(w['text']).startswith(norm(word)):
            seen+=1
            if seen==occ: return round(starts[i]+w['start'],3)
    raise SystemExit(f"word not found: {ref} in {[w['text'] for w in m['voices'][i]['words']]}")

def cut():
    m,starts,total=timing()
    segs=[]
    for i,l in enumerate(S['lines']):
        for j,sh_ in enumerate(l['shots']):
            src,off,g=sh_[0],sh_[1],sh_[2]
            st= 0.0 if (i==0 and j==0) else (starts[i] if j==0 else at(f"L{i+1}:{sh_[3]}",m,starts,total))
            segs.append([st,src,off,g])
    segs.sort(key=lambda x:x[0])
    out=[]
    for k,(st,src,off,g) in enumerate(segs):
        en= segs[k+1][0] if k+1<len(segs) else total
        out.append((round(st,2),round(en,2),src,off,g))
    G={'calm':"eq=contrast=1.05:saturation=1.08,colorbalance=rs=.03:gs=.01:bs=-.03",
       'lux':"eq=contrast=1.10:saturation=1.30:brightness=-0.02,colorbalance=rs=.04:bs=-.04",
       'cost':"eq=contrast=1.12:saturation=0.75:brightness=-0.07,colorbalance=bs=.03"}
    os.makedirs('build',exist_ok=True); os.makedirs('assets/footage',exist_ok=True); parts=[]
    for k,(a,b,src,off,g) in enumerate(out):
        D=round(b-a,3); o=f'build/seg{k:02d}.mp4'; fx=0.5
        if '@' in src: src,fx=src.split('@'); fx=float(fx)
        if src.endswith('.jpg'):
            fc=(f"[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:2,eq=brightness=-0.06:saturation=1.2[bg];"
                f"[0:v]scale=1300:-2,fps=30,zoompan=z='1+0.10*on/({D}*30)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1300x708:fps=30[fg];"
                f"[bg][fg]overlay=(W-w)/2:(H-h)/2-80,{G[g]},vignette=PI/4.5,fps=30,format=yuv420p[v]")
            cmd=['ffmpeg','-v','error','-y','-loop','1','-framerate','30','-t',str(D),'-i','raw/'+src,'-filter_complex',fc,'-map','[v]','-t',str(D),'-c:v','libx264','-preset','veryfast','-crf','18','-an',o]
        else:
            vf=(f"scale=-2:1920,crop=1080:1920:(iw-1080)*{fx}:0,fps=30,zoompan=z='1+0.06*on/({D}*30)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30,"
                f"{G[g]},vignette=PI/4.5,fps=30,format=yuv420p")
            cmd=['ffmpeg','-v','error','-y','-ss',str(off),'-t',str(D),'-i','raw/'+src,'-vf',vf,'-t',str(D),'-c:v','libx264','-preset','veryfast','-crf','18','-an',o]
        sh(*cmd); parts.append(o)
    open('build/list.txt','w').write(''.join(f"file '{os.path.basename(p)}'\n" for p in parts))
    sh('ffmpeg','-v','error','-y','-f','concat','-safe','0','-i','build/list.txt','-c','copy','assets/footage/track.mp4')
    json.dump(out,open('build/cuts.json','w'),indent=1); print('cut ok',total)

def index():
    m,starts,total=timing()
    fix=S.get('caption_fix',{})
    for v in m['voices']:
        for w in v['words']:
            if w['text'] in fix: w['text']=fix[w['text']]
    m['bgm']=None; m['sfx']=[]
    json.dump(m,open('audio_meta.json','w'),indent=2)
    durs=[v['duration_s']+GAP for v in m['voices']]; durs[0]+=LEAD; durs[-1]=total-sum(durs[:-1])
    sb=open('STORYBOARD.md').read(); parts=sb.split('## Frame ')
    for i in range(1,len(parts)): parts[i]=re.sub(r'- duration: [0-9.]+s','- duration: %.3fs'%durs[i-1],parts[i],1)
    open('STORYBOARD.md','w').write('## Frame '.join(parts))
    sh('node',f'{FE}/captions.mjs','build','--storyboard','./STORYBOARD.md','--audio-meta','./audio_meta.json','--hyperframes','.','--out','./caption_groups.json')
    c=open('compositions/captions.html').read()
    c=re.sub(r'<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"[^>]*></script>','<script src="assets/vendor/gsap.min.js"></script>',c)
    open('compositions/captions.html','w').write(c)
    audio=[f'<audio id="vo{i+1}" class="clip" src="{v["path"]}" data-start="{starts[i]}" data-duration="{v["duration_s"]}" data-track-index="10" data-volume="1"></audio>' for i,v in enumerate(m['voices'])]
    audio.append(f'<audio id="bgm" class="clip" src="assets/bgm/dark-pulse.mp3" data-start="0" data-duration="{total}" data-track-index="11" data-volume="0.2"></audio>')
    sfx=[]; cuts=json.load(open('build/cuts.json'))
    for k,c_ in enumerate(cuts[1:]): sfx.append(('whoosh-short',max(0,c_[0]-0.02),0.25))
    els=[]; tl=[]
    for k,p in enumerate(S.get('pills',[])):
        a=at(p[1],m,starts,total); b=at(p[2],m,starts,total)
        els.append(f'<div id="pl{k}" class="pill" style="opacity:0"><b style="background:{p[3]}"></b>{p[0]}</div>')
        tl.append(f'IN("#pl{k}",{a},{{x:-20,y:0}});' + (f'OUT("#pl{k}",{b-0.15});' if p[2]!='END' else ''))
    for k,t in enumerate(S.get('tags',[])):
        a=at(t[3],m,starts,total); b=at(t[4],m,starts,total); g=t[5]=='green'
        bc=' style="opacity:0;border-color:rgba(92,255,122,.6)"' if g else ' style="opacity:0"'
        kc=' style="color:#5CFF7A"' if g else ''
        sub=f'<div class="s">{t[2]}</div>' if t[2] else ''
        els.append(f'<div id="tg{k}" class="tag"{bc}><div class="k"{kc}>{t[0]}</div><div class="v">{t[1]}</div>{sub}</div>')
        tl.append(f'IN("#tg{k}",{a});'+(f'OUT("#tg{k}",{b-0.15});' if t[4]!='END' else ''))
        sfx.append(('click',a,0.35))
    for k,x in enumerate(S.get('mids',[])):
        a=at(x[1],m,starts,total); b=at(x[2],m,starts,total)
        els.append(f'<div id="md{k}" class="mid" style="top:{x[5] if len(x)>5 else 330}px;opacity:0;font-weight:800;font-size:{x[3]}px;line-height:1.05;color:{x[4]}">{x[0]}</div>')
        tl.append(f'IN("#md{k}",{a},{{y:0}});'+(f'OUT("#md{k}",{b-0.15});' if x[2]!='END' else ''))
    if S.get('impact'): sfx.append(('impact-bass-1',at(S['impact'],m,starts,total),0.55))
    audio+=[f'<audio id="sfx{k}" class="clip" src="assets/sfx/{n}.mp3" data-start="{round(s_,3)}" data-duration="1.2" data-track-index="{20+k%3}" data-volume="{vol}"></audio>' for k,(n,s_,vol) in enumerate(sfx)]
    els.append(f'<div id="src" class="mid" style="top:1840px;opacity:0;font-size:20px;color:rgba(255,255,255,.6)">{S.get("footnote","")}</div>')
    tl.append(f'tl.fromTo("#src",{{opacity:0}},{{opacity:1,duration:0.4,immediateRender:false}},{max(0,total-2.2)});')
    tpl=open(os.path.join(os.path.dirname(__file__),'template.html')).read()
    html=tpl.replace('{{TOTAL}}',str(total)).replace('{{ELS}}','\n    '.join(els)).replace('{{AUDIO}}','\n  '.join(audio)).replace('{{TL}}','\n  '.join(tl))
    open('index.html','w').write(html); print('index ok', total)

stage=sys.argv[1] if len(sys.argv)>1 else 'all'
if stage in ('tts','all'): tts()
if stage in ('cut','all'): cut()
if stage in ('index','all'): index()
