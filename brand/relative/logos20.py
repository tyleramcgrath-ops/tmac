#!/usr/bin/env python3
"""Relative Marketing Agency — 20 logo explorations. Studio contact sheet."""
import math
from PIL import Image, ImageDraw, ImageFont

FONTS = "/home/user/tmac/.claude/skills/canvas-design/canvas-fonts"
S = 2
COLS, ROWS = 4, 5
CELL = 560
GUT = 36
MARGIN = 120
HEAD = 250
FOOT = 150
GW = MARGIN*2 + COLS*CELL + (COLS-1)*GUT
GH = HEAD + ROWS*CELL + (ROWS-1)*GUT + FOOT
WS, HS = GW*S, GH*S

BONE   = (240, 237, 229)
INK    = (24, 24, 27)
DIM    = (150, 148, 141)
FAINT  = (210, 206, 197)
ACCENT = (228, 74, 38)

img = Image.new("RGB", (WS, HS), BONE)
d = ImageDraw.Draw(img, "RGBA")

def F(name, size): return ImageFont.truetype(f"{FONTS}/{name}", int(size*S))
def tw(s,f,tr=0):
    w=0
    for ch in s: w+=d.textlength(ch,font=f)+tr*S
    return w-(tr*S if s else 0)
def tt(cx,y,s,f,fill,tr=0,anchor="m"):
    w=tw(s,f,tr); x=cx-w/2 if anchor=="m" else (cx if anchor=="l" else cx-w)
    for ch in s:
        d.text((x,y),ch,font=f,fill=fill); x+=d.textlength(ch,font=f)+tr*S
    return w
def L(x1,y1,x2,y2,fill,wpx): d.line([(x1,y1),(x2,y2)],fill=fill,width=max(1,int(wpx*S)))

f_lab  = F("GeistMono-Regular.ttf", 12)
f_num  = F("GeistMono-Regular.ttf", 11)
f_word = F("Outfit-Bold.ttf", 200)   # base, resized per use via truetype cache
# cache R glyph fonts by px
_fcache={}
def outfit(px):
    k=("o",int(px))
    if k not in _fcache: _fcache[k]=ImageFont.truetype(f"{FONTS}/Outfit-Bold.ttf",int(px*S))
    return _fcache[k]
def outfitR(px):
    k=("or",int(px))
    if k not in _fcache: _fcache[k]=ImageFont.truetype(f"{FONTS}/Outfit-Regular.ttf",int(px*S))
    return _fcache[k]

def drawR(cx,cy,px,fill,font=None):
    f=font or outfit(px); R="R"
    b=d.textbbox((0,0),R,font=f); w=b[2]-b[0]; h=b[3]-b[1]
    d.text((cx-w/2-b[0], cy-h/2-b[1]), R, font=f, fill=fill)
    return w,h

def wordmark(cx,cy,text,px,fill,tr=2):
    f=outfit(px)
    # measure with tracking
    width=tw(text,f,tr)
    x=cx-width/2;
    b=d.textbbox((0,0),"H",font=f); h=b[3]-b[1]
    y=cy-h/2-b[1]
    for ch in text:
        d.text((x,y),ch,font=f,fill=fill); x+=d.textlength(ch,font=f)+tr*S
    return width

# ---------- 20 concept renderers; each gets center (cx,cy) and unit u (=CELL*S*0.5*0.78) ----------
def c01_parallax(cx,cy,u):
    px=u*1.5
    drawR(cx+u*0.10, cy+u*0.10, px, ACCENT)
    drawR(cx, cy, px, BONE)        # mask
    # outline echo: redraw ink slightly thicker? just ink on top
    drawR(cx, cy, px, INK)

def c02_orbit(cx,cy,u):
    drawR(cx,cy,u*1.25,INK)
    r=u*1.15
    d.ellipse([cx-r,cy-r,cx+r,cy+r],outline=DIM,width=max(1,int(1.2*S)))
    a=math.radians(-52); dx,dy=cx+r*math.cos(a),cy+r*math.sin(a); dr=u*0.085
    d.ellipse([dx-dr,dy-dr,dx+dr,dy+dr],fill=ACCENT)

def c03_frame(cx,cy,u):
    drawR(cx,cy,u*1.25,INK)
    s=u*1.25; t=u*0.30
    for sx,sy in [(-1,-1),(1,-1),(-1,1),(1,1)]:
        x,y=cx+sx*s,cy+sy*s
        L(x,y,x-sx*t,y,INK,2.4); L(x,y,x,y-sy*t,INK,2.4)

def c04_slash(cx,cy,u):
    f=outfit(u*1.5); R="R"
    b=d.textbbox((0,0),R,font=f); w=b[2]-b[0]
    total=w+u*0.55
    x0=cx-total/2
    d.text((x0-b[0], cy-(b[3]-b[1])/2-b[1]),R,font=f,fill=INK)
    # slash
    sx=x0+w+u*0.30
    L(sx-u*0.18,cy+u*0.72,sx+u*0.18,cy-u*0.72,ACCENT,u*0.14)

def c05_vector(cx,cy,u):
    drawR(cx,cy,u*1.2,INK)
    # arrow from lower-left origin up-right
    ox,oy=cx-u*1.25,cy+u*1.15; tx,ty=cx+u*1.2,cy-u*1.05
    L(ox,oy,tx,ty,INK,2)
    # arrowhead
    a=math.atan2(ty-oy,tx-ox); hl=u*0.28
    for da in (math.radians(150),math.radians(-150)):
        L(tx,ty,tx+hl*math.cos(a+da),ty+hl*math.sin(a+da),INK,2)
    d.ellipse([ox-u*0.06,oy-u*0.06,ox+u*0.06,oy+u*0.06],fill=ACCENT)

def c06_angle(cx,cy,u):
    # protractor arc + R
    r=u*1.25
    d.arc([cx-r,cy-r,cx+r,cy+r],-90,30,fill=INK,width=max(1,int(2.2*S)))
    L(cx,cy+r,cx,cy-r,FAINT,1.4)
    L(cx,cy,cx+r*math.cos(math.radians(-30)),cy+r*math.sin(math.radians(-30)),ACCENT,2)
    drawR(cx-u*0.05,cy-u*0.15,u*0.9,INK)

def c07_negative(cx,cy,u):
    s=u*1.35; rad=u*0.34
    d.rounded_rectangle([cx-s,cy-s,cx+s,cy+s],radius=rad,fill=INK)
    drawR(cx,cy,u*1.55,BONE)

def c08_stack(cx,cy,u):
    f=outfit(u*0.62)
    rows=["RE","LA","TI","VE"]
    lh=u*0.66
    y=cy-lh*1.5
    for i,r in enumerate(rows):
        col=ACCENT if i==0 else INK
        wmark=tw(r,f,1); x=cx-wmark/2
        b=d.textbbox((0,0),"H",font=f); h=b[3]-b[1]
        for ch in r:
            d.text((x,y-h/2-b[1]),ch,font=f,fill=col); x+=d.textlength(ch,font=f)+1*S
        y+=lh

def c09_italic(cx,cy,u):
    # shear an R via transform: draw on temp and paste
    px=int(u*1.6)
    tmp=Image.new("RGBA",(int(px*S*1.4),int(px*S*1.4)),(0,0,0,0))
    td=ImageDraw.Draw(tmp); f=outfit(px)
    b=td.textbbox((0,0),"R",font=f); w=b[2]-b[0];h=b[3]-b[1]
    td.text(((tmp.width-w)/2-b[0],(tmp.height-h)/2-b[1]),"R",font=f,fill=INK)
    sh=tmp.transform(tmp.size,Image.AFFINE,(1,-0.28,0.28*tmp.height/2*0+ -0.28*0,0,1,0),resample=Image.BICUBIC)
    img.paste(sh,(int(cx-tmp.width/2),int(cy-tmp.height/2)),sh)
    # motion lines
    for i,off in enumerate([-u*0.5,0,u*0.5]):
        L(cx-u*1.5,cy+off,cx-u*0.9,cy+off,ACCENT if i==1 else DIM,2)

def c10_concentric(cx,cy,u):
    for i,r in enumerate([u*1.3,u*0.98,u*0.66]):
        d.ellipse([cx-r,cy-r,cx+r,cy+r],outline=(INK if i==0 else DIM),width=max(1,int((2.2 if i==0 else 1.2)*S)))
    d.ellipse([cx-u*0.10,cy-u*0.10,cx+u*0.10,cy+u*0.10],fill=ACCENT)

def c11_monogram(cx,cy,u):
    # R and M sharing a stem
    f=outfit(u*1.4)
    L(cx-u*0.05,cy+u*0.85,cx+u*1.25,cy+u*0.85,FAINT,1.2)
    drawR(cx-u*0.55,cy,u*1.35,INK)
    # M as three strokes
    mx=cx+u*0.45
    L(mx,cy+u*0.7,mx,cy-u*0.7,INK,u*0.16)
    L(mx,cy-u*0.7,mx+u*0.45,cy+u*0.0,INK,u*0.16)
    L(mx+u*0.45,cy+0,mx+u*0.9,cy-u*0.7,INK,u*0.16)
    L(mx+u*0.9,cy-u*0.7,mx+u*0.9,cy+u*0.7,INK,u*0.16)

def c12_dot(cx,cy,u):
    w=wordmark(cx-u*0.12,cy,"relative",u*0.5,INK,tr=1)
    # bold period
    dr=u*0.13
    d.ellipse([cx+w/2-u*0.06,cy+u*0.32-dr,cx+w/2-u*0.06+2*dr,cy+u*0.32+dr],fill=ACCENT)

def c13_cross(cx,cy,u):
    r=u*1.3
    L(cx-r,cy,cx+r,cy,FAINT,1.4); L(cx,cy-r,cx,cy+r,FAINT,1.4)
    for t in [-1,1]:
        L(cx+t*r,cy-u*0.12,cx+t*r,cy+u*0.12,DIM,1.4)
        L(cx-u*0.12,cy+t*r,cx+u*0.12,cy+t*r,DIM,1.4)
    drawR(cx,cy,u*1.0,INK)
    d.ellipse([cx-u*0.07,cy-u*0.07,cx+u*0.07,cy+u*0.07],fill=ACCENT)

def c14_ring(cx,cy,u):
    r=u*1.3
    d.ellipse([cx-r,cy-r,cx+r,cy+r],outline=INK,width=max(1,int(2.6*S)))
    drawR(cx,cy,u*1.15,INK)

def c15_delta(cx,cy,u):
    s=u*1.25
    d.polygon([(cx,cy-s),(cx-s*0.95,cy+s*0.7),(cx+s*0.95,cy+s*0.7)],outline=INK,width=max(1,int(2.4*S)))
    drawR(cx,cy+u*0.18,u*0.82,INK)

def c16_grid(cx,cy,u):
    n=5; step=u*2.2/(n-1); x0=cx-u*1.1; y0=cy-u*1.1; dr=u*0.045
    for i in range(n):
        for j in range(n):
            d.ellipse([x0+i*step-dr,y0+j*step-dr,x0+i*step+dr,y0+j*step+dr],fill=FAINT)
    drawR(cx,cy,u*1.25,INK)
    d.ellipse([x0-dr*1.4,y0-dr*1.4,x0+dr*1.4,y0+dr*1.4],fill=ACCENT)

def c17_mirror(cx,cy,u):
    drawR(cx-u*0.66,cy,u*1.2,INK)
    # mirrored R via flip
    px=int(u*1.2); tmp=Image.new("RGBA",(int(px*S*1.2),int(px*S*1.3)),(0,0,0,0))
    td=ImageDraw.Draw(tmp); f=outfit(px); b=td.textbbox((0,0),"R",font=f); w=b[2]-b[0];h=b[3]-b[1]
    td.text(((tmp.width-w)/2-b[0],(tmp.height-h)/2-b[1]),"R",font=f,fill=ACCENT)
    fl=tmp.transpose(Image.FLIP_LEFT_RIGHT)
    img.paste(fl,(int(cx+u*0.66-tmp.width/2),int(cy-tmp.height/2)),fl)
    L(cx,cy-u*1.2,cx,cy+u*1.2,FAINT,1.2)

def c18_bars(cx,cy,u):
    drawR(cx-u*0.5,cy,u*1.25,INK)
    bx=cx+u*0.55; bw=u*0.26
    for i,hh in enumerate([u*0.5,u*0.95,u*1.35]):
        x=bx+i*(bw+u*0.12)
        col=ACCENT if i==2 else INK
        d.rectangle([x,cy+u*1.0-hh,x+bw,cy+u*1.0],fill=col)

def c19_wordmark(cx,cy,u):
    f=outfit(u*0.52); text="RELATIVE"; tr=2
    width=tw(text,f,tr); x=cx-width/2
    b=d.textbbox((0,0),"H",font=f); h=b[3]-b[1]; y=cy-h/2-b[1]
    for k,ch in enumerate(text):
        d.text((x,y),ch,font=f,fill=ACCENT if k==0 else INK); x+=d.textlength(ch,font=f)+tr*S

def c20_minimal(cx,cy,u):
    ox,oy=cx-u*0.9,cy+u*0.5; tx,ty=cx+u*0.9,cy-u*0.5
    L(ox,oy,tx,ty,INK,1.8)
    d.ellipse([ox-u*0.09,oy-u*0.09,ox+u*0.09,oy+u*0.09],outline=INK,width=max(1,int(1.6*S)))
    d.ellipse([tx-u*0.10,ty-u*0.10,tx+u*0.10,ty+u*0.10],fill=ACCENT)

CONCEPTS=[
 ("01","PARALLAX",c01_parallax),("02","ORBIT",c02_orbit),("03","FRAME",c03_frame),("04","RELATIVE PATH",c04_slash),
 ("05","VECTOR",c05_vector),("06","ANGLE",c06_angle),("07","NEGATIVE",c07_negative),("08","STACK",c08_stack),
 ("09","VELOCITY",c09_italic),("10","REFERENCE",c10_concentric),("11","MONOGRAM RM",c11_monogram),("12","LOWERCASE",c12_dot),
 ("13","ORIGIN",c13_cross),("14","ROUNDEL",c14_ring),("15","DELTA",c15_delta),("16","SPACETIME",c16_grid),
 ("17","MIRROR",c17_mirror),("18","RHYTHM",c18_bars),("19","WORDMARK",c19_wordmark),("20","MINIMAL",c20_minimal),
]

# ---- header
tt(MARGIN*S, (HEAD*0.42)*S, "RELATIVE", F("GeistMono-Regular.ttf",16), INK, tr=3, anchor="l")
tt(GW*S-MARGIN*S, (HEAD*0.42)*S, "MARKETING AGENCY", F("GeistMono-Regular.ttf",16), DIM, tr=2, anchor="r")
tt(GW/2*S, (HEAD*0.78)*S, "L O G O   E X P L O R A T I O N S   ·   0 1 — 2 0", F("Outfit-Regular.ttf",18), INK, tr=2, anchor="m")
L(MARGIN*S,(HEAD*1.02)*S,GW*S-MARGIN*S,(HEAD*1.02)*S,FAINT,1.2)

# ---- cells
for idx,(num,name,fn) in enumerate(CONCEPTS):
    r=idx//COLS; c=idx%COLS
    x0=(MARGIN+c*(CELL+GUT))*S; y0=(HEAD+r*(CELL+GUT))*S
    x1=x0+CELL*S; y1=y0+CELL*S
    d.rectangle([x0,y0,x1,y1],outline=FAINT,width=1)
    ccx=(x0+x1)/2; ccy=y0+CELL*S*0.44
    u=CELL*S*0.5*0.40
    fn(ccx,ccy,u)
    # label row
    L(x0+18*S,y1-46*S,x1-18*S,y1-46*S,FAINT,1)
    tt(x0+18*S,y1-34*S,num,f_num,ACCENT,tr=1,anchor="l")
    tt(x1-18*S,y1-34*S,name,f_lab,DIM,tr=1,anchor="r")

# ---- footer
L(MARGIN*S,(GH-FOOT*0.55)*S,GW*S-MARGIN*S,(GH-FOOT*0.55)*S,FAINT,1.2)
tt(MARGIN*S,(GH-FOOT*0.40)*S,"TWENTY DIRECTIONS · ONE NAME",F("GeistMono-Regular.ttf",13),DIM,tr=2,anchor="l")
tt(GW*S-MARGIN*S,(GH-FOOT*0.40)*S,"REL · MMXXVI",F("GeistMono-Regular.ttf",13),DIM,tr=2,anchor="r")

out=img.resize((GW,GH),Image.LANCZOS)
out.save("/home/user/tmac/scratchpad/relative_20_logos.png")
print("saved", GW, GH)
