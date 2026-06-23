#!/usr/bin/env python3
"""Relative Marketing Agency — specimen / colorway sheet (page 02)."""
import math
from PIL import Image, ImageDraw, ImageFont

FONTS = "/home/user/tmac/.claude/skills/canvas-design/canvas-fonts"
S = 3
W, H = 1500, 1900
WS, HS = W*S, H*S

PAPER  = (237, 234, 225)
INK    = (20, 21, 25)
INK_DIM= (120, 119, 113)
INK_FAINT=(196, 192, 182)
ACCENT = (255, 74, 32)

img = Image.new("RGB", (WS, HS), PAPER)
d = ImageDraw.Draw(img, "RGBA")

def font(name, size): return ImageFont.truetype(f"{FONTS}/{name}", int(size*S))
def text_w(s,f,tr=0):
    w=0
    for ch in s: w+=d.textlength(ch,font=f)+tr*S
    return w-(tr*S if s else 0)
def tracked(cx,y,s,f,fill,tr=0,anchor="m"):
    tw=text_w(s,f,tr)
    x = cx-tw/2 if anchor=="m" else (cx if anchor=="l" else cx-tw)
    for ch in s:
        d.text((x,y),ch,font=f,fill=fill); x+=d.textlength(ch,font=f)+tr*S
    return tw
def line(x1,y1,x2,y2,fill,wpx): d.line([(x1,y1),(x2,y2)],fill=fill,width=int(wpx*S))

f_word=font("Outfit-Bold.ttf",92)
f_mark=font("Outfit-Bold.ttf",300)
f_sub =font("Outfit-Regular.ttf",26)
f_mono=font("GeistMono-Regular.ttf",19)
f_mono_s=font("GeistMono-Regular.ttf",15)
f_h   =font("Outfit-Bold.ttf",30)

cx=WS/2; MARG=150*S

# header
top=120*S
line(MARG,top,WS-MARG,top,INK_FAINT,1)
tracked(MARG,top-34*S,"RELATIVE",f_mono,INK,tr=2,anchor="l")
tracked(WS-MARG,top-34*S,"SPECIMEN  /  02",f_mono,INK_DIM,tr=2,anchor="r")
tracked(cx,top-34*S,"IDENTITY  SYSTEM",f_mono_s,ACCENT,tr=3,anchor="m")

# --- primary mark, light colorway, in a hairline reference square ---
fcx,fcy=cx,560*S
fr=300*S
fl,ft_,frt,fb=fcx-fr,fcy-fr,fcx+fr,fcy+fr
d.rectangle([fl,ft_,frt,fb],outline=INK_FAINT,width=int(1*S))
ct=34*S
for (px,py,dx,dy) in [(fl,ft_,1,1),(frt,ft_,-1,1),(fl,fb,1,-1),(frt,fb,-1,-1)]:
    line(px,py,px+dx*ct,py,INK,2); line(px,py,px,py+dy*ct,INK,2)

R="R"
rb=d.textbbox((0,0),R,font=f_mark); rw,rh=rb[2]-rb[0],rb[3]-rb[1]
rx=fcx-rw/2-rb[0]; ry=fcy-rh/2-rb[1]; off=17*S
d.text((rx+off,ry+off),R,font=f_mark,fill=ACCENT)
d.text((rx,ry),R,font=f_mark,fill=PAPER)
d.text((rx,ry),R,font=f_mark,fill=INK)
tracked(cx,fb+30*S,"PRIMARY  MARK  ·  PARALLAX  R",f_mono_s,INK_DIM,tr=2,anchor="m")

# --- wordmark lockup ---
wy=1010*S
tracked(cx,wy,"RELATIVE",f_word,INK,tr=10,anchor="m")
sy=wy+140*S
sub="MARKETING  AGENCY"
subw=text_w(sub,f_sub,9); gap=30*S
tracked(cx,sy,sub,f_sub,INK,tr=9,anchor="m")
line(cx-subw/2-gap-160*S,sy+14*S,cx-subw/2-gap,sy+14*S,INK_FAINT,1)
line(cx+subw/2+gap,sy+14*S,cx+subw/2+gap+160*S,sy+14*S,INK_FAINT,1)

# --- color system swatches ---
swy=1360*S
tracked(MARG,swy-46*S,"COLOUR  SYSTEM",f_mono_s,INK_DIM,tr=3,anchor="l")
line(MARG,swy-14*S,WS-MARG,swy-14*S,INK_FAINT,1)
sw_w=(WS-2*MARG-2*40*S)/3
swatches=[((20,21,25),"INK","#141519"),((255,74,32),"SIGNAL","#FF4A20"),((237,234,225),"PAPER","#EDEAE1")]
for i,(col,nm,hx) in enumerate(swatches):
    x0=MARG+i*(sw_w+40*S); x1=x0+sw_w; y0=swy; y1=swy+150*S
    d.rectangle([x0,y0,x1,y1],fill=col)
    if nm=="PAPER": d.rectangle([x0,y0,x1,y1],outline=INK_FAINT,width=int(1*S))
    tracked(x0,y1+22*S,nm,f_mono_s,INK,tr=2,anchor="l")
    tracked(x1,y1+22*S,hx,f_mono_s,INK_DIM,tr=1,anchor="r")

# footer
fy=HS-150*S
line(MARG,fy,WS-MARG,fy,INK_FAINT,1)
tracked(MARG,fy+22*S,"ONE  ORIGIN  ·  INFINITE  PERSPECTIVE",f_mono_s,INK_DIM,tr=2,anchor="l")
tracked(WS-MARG,fy+22*S,"REL  ·  MMXXVI",f_mono_s,INK_DIM,tr=2,anchor="r")

out=img.resize((W,H),Image.LANCZOS)
out.save("/home/user/tmac/scratchpad/relative_logo_specimen.png")
print("saved specimen")
