#!/usr/bin/env python3
"""Relative Marketing Agency — primary logo. Parallax Order."""
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FONTS = "/home/user/tmac/.claude/skills/canvas-design/canvas-fonts"
S = 3                      # supersample
W, H = 1500, 1900          # final
WS, HS = W*S, H*S

# palette
GROUND = (13, 14, 17)
INK    = (236, 233, 224)
INK_DIM= (120, 120, 124)
INK_FAINT=(54, 56, 62)
ACCENT = (255, 74, 32)     # molten

img = Image.new("RGB", (WS, HS), GROUND)
d = ImageDraw.Draw(img, "RGBA")

def font(name, size):
    return ImageFont.truetype(f"{FONTS}/{name}", int(size*S))

def text_w(s, f, tr=0):
    w = 0
    for ch in s:
        w += d.textlength(ch, font=f) + tr*S
    return w - (tr*S if s else 0)

def tracked(cx, y, s, f, fill, tr=0, anchor="m"):
    """draw letter-spaced text. anchor m=center, l=left. y is top."""
    tw = text_w(s, f, tr)
    if anchor == "m":
        x = cx - tw/2
    elif anchor == "l":
        x = cx
    else:
        x = cx - tw
    for ch in s:
        d.text((x, y), ch, font=f, fill=fill)
        x += d.textlength(ch, font=f) + tr*S
    return tw

# ---- fonts
f_word   = font("Outfit-Bold.ttf", 150)
f_mark   = font("Outfit-Bold.ttf", 560)
f_sub    = font("Outfit-Regular.ttf", 33)
f_mono   = font("GeistMono-Regular.ttf", 19)
f_mono_s = font("GeistMono-Regular.ttf", 15)

cx = WS/2
MARG = 150*S

def line(x1,y1,x2,y2,fill,wpx):
    d.line([(x1,y1),(x2,y2)], fill=fill, width=int(wpx*S))

# ================= TOP CLINICAL HEADER =================
top = 120*S
line(MARG, top, WS-MARG, top, INK_FAINT, 1)
tracked(MARG, top-34*S, "RELATIVE", f_mono, INK, tr=2, anchor="l")
tracked(WS-MARG, top-34*S, "EST. MMXXVI", f_mono, INK_DIM, tr=2, anchor="r")
# small registration ticks along the rule
tracked(cx, top-34*S, "REFERENCE  FRAME  /  01", f_mono_s, ACCENT, tr=3, anchor="m")

# ================= REFERENCE FRAME (mark stage) =================
# square frame centered, where the parallax R lives
fr = 560*S                  # half-size of frame
fcx, fcy = cx, 700*S        # frame center
fl, ft_, frt, fb = fcx-fr, fcy-fr, fcx+fr, fcy+fr

# faint full-bleed measurement crosshair
line(fl, fcy, frt, fcy, INK_FAINT, 1)
line(fcx, ft_, fcx, fb, INK_FAINT, 1)

# corner crop ticks
ct = 40*S
for (px,py,dx,dy) in [(fl,ft_,1,1),(frt,ft_,-1,1),(fl,fb,1,-1),(frt,fb,-1,-1)]:
    line(px, py, px+dx*ct, py, INK, 2)
    line(px, py, px, py+dy*ct, INK, 2)

# datum tick labels on the horizontal axis (clinical)
for i,fx in enumerate([fl, fcx-fr*0.5, fcx, fcx+fr*0.5, frt]):
    line(fx, fcy-7*S, fx, fcy+7*S, INK_DIM, 1)

# ---- THE PARALLAX R ----
# accent echo offset down-right, ink R on top: relative displacement
R = "R"
rb = d.textbbox((0,0), R, font=f_mark)
rw, rh = rb[2]-rb[0], rb[3]-rb[1]
rx = fcx - rw/2 - rb[0]
ry = fcy - rh/2 - rb[1]
off = 30*S
# accent ghost (the reference position)
d.text((rx+off, ry+off), R, font=f_mark, fill=ACCENT)
# knock the ground back where ink will sit to keep accent as a clean sliver
d.text((rx, ry), R, font=f_mark, fill=GROUND)   # mask
d.text((rx, ry), R, font=f_mark, fill=INK)      # ink R

# vector from origin(center) to the relative point (accent dot)
ang = math.radians(-38)
rad = fr*0.86
dotx, doty = fcx + rad*math.cos(ang), fcy + rad*math.sin(ang)
line(fcx, fcy, dotx, doty, ACCENT, 1.4)
dr = 9*S
d.ellipse([dotx-dr,doty-dr,dotx+dr,doty+dr], fill=ACCENT)
# tiny coordinate label by the dot
tracked(dotx+18*S, doty-10*S, "P ( x, y )", f_mono_s, INK_DIM, tr=1, anchor="l")
# origin marker
orr=5*S
d.ellipse([fcx-orr,fcy-orr,fcx+orr,fcy+orr], outline=INK, width=int(1.4*S))

# ================= WORDMARK =================
wy = 1360*S
tracked(cx, wy, "RELATIVE", f_word, INK, tr=14, anchor="m")

# flanking hairlines + subtitle
sy = wy + 215*S
sub = "MARKETING  AGENCY"
subw = text_w(sub, f_sub, 11)
gap = 34*S
tracked(cx, sy, sub, f_sub, INK, tr=11, anchor="m")
line(MARG, sy+18*S, cx-subw/2-gap, sy+18*S, INK_FAINT, 1)
line(cx+subw/2+gap, sy+18*S, WS-MARG, sy+18*S, INK_FAINT, 1)

# ================= BOTTOM CLINICAL FOOTER =================
fy = HS-150*S
line(MARG, fy, WS-MARG, fy, INK_FAINT, 1)
tracked(MARG, fy+22*S, "POSITION  IS  RELATIVE  TO  ORIGIN", f_mono_s, INK_DIM, tr=2, anchor="l")
tracked(WS-MARG, fy+22*S, "N 00.00  ·  E 00.00", f_mono_s, INK_DIM, tr=2, anchor="r")

# ---- downscale ----
out = img.resize((W,H), Image.LANCZOS)
out.save("/home/user/tmac/scratchpad/relative_logo.png")
print("saved primary")
