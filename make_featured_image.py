"""
Centris Featured Image — Signal Cartography
1200x630 PNG, design-forward, museum-grade craft.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import os

W, H = 1200, 630
FONTS = "/home/user/tmac/.claude/skills/canvas-design/canvas-fonts"

# Palette — deep navy, graphite, controlled teal accent, warm cyan signal
INK         = (10, 18, 34)        # deep navy base
DEEP        = (16, 28, 52)        # slightly lifted navy
LINE        = (58, 78, 110)       # graphite line
LINE_SOFT   = (38, 54, 82)        # softer graphite
PAPER       = (232, 234, 230)     # warm off-white text
PAPER_DIM   = (168, 176, 186)     # dim text
TEAL        = (94, 214, 200)      # primary signal — calm teal
TEAL_DEEP   = (38, 142, 142)      # teal at lower temperature
AMBER       = (232, 168, 96)      # warm accent (rare)
LINE_HOT    = (120, 198, 200)     # signal line

img = Image.new("RGB", (W, H), INK)
d = ImageDraw.Draw(img, "RGBA")

# --- Subtle vertical gradient for atmosphere ---
for y in range(H):
    t = y / H
    r = int(INK[0] * (1 - t * 0.15) + DEEP[0] * (t * 0.15))
    g = int(INK[1] * (1 - t * 0.15) + DEEP[1] * (t * 0.15))
    b = int(INK[2] * (1 - t * 0.15) + DEEP[2] * (t * 0.15))
    d.line([(0, y), (W, y)], fill=(r, g, b))

# --- Outer frame: hairline rule, museum-card style ---
MARGIN = 36
d.rectangle([MARGIN, MARGIN, W - MARGIN, H - MARGIN], outline=LINE_SOFT, width=1)

# Inner frame band — top + bottom thin rules
d.line([(MARGIN + 24, MARGIN + 56), (W - MARGIN - 24, MARGIN + 56)], fill=LINE_SOFT, width=1)
d.line([(MARGIN + 24, H - MARGIN - 56), (W - MARGIN - 24, H - MARGIN - 56)], fill=LINE_SOFT, width=1)

# --- Load fonts ---
def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)

f_mono_sm   = font("GeistMono-Regular.ttf", 13)
f_mono_xs   = font("GeistMono-Regular.ttf", 11)
f_mono_md   = font("GeistMono-Bold.ttf", 14)
f_serif_xl  = font("IBMPlexSerif-Bold.ttf", 58)
f_serif_xl2 = font("IBMPlexSerif-Regular.ttf", 58)
f_serif_it  = font("IBMPlexSerif-Italic.ttf", 22)
f_label     = font("GeistMono-Bold.ttf", 11)

# --- Top header band: reference-instrument typography ---
d.text((MARGIN + 24, MARGIN + 24), "CENTRIS  ·  INFORMATION SERVICES",
       font=f_mono_md, fill=PAPER)
d.text((W - MARGIN - 24, MARGIN + 24), "FIG. 01 / SIGNAL CARTOGRAPHY",
       font=f_mono_sm, fill=PAPER_DIM, anchor="rt")

# Bottom band
d.text((MARGIN + 24, H - MARGIN - 40), "BPO  ·  NEARSHORE  ·  BILINGUAL SUPPORT",
       font=f_mono_sm, fill=PAPER_DIM)
d.text((W - MARGIN - 24, H - MARGIN - 40), "2026  ·  EDITION  06",
       font=f_mono_sm, fill=PAPER_DIM, anchor="rt")

# ============================================================
# Composition: two fields connected by a signal thread.
# Left field: structured search lattice (intent).
# Right field: concentric response arcs (the conversation).
# ============================================================

# Working area inside frame band
INNER_T = MARGIN + 80
INNER_B = H - MARGIN - 80
INNER_L = MARGIN + 36
INNER_R = W - MARGIN - 36

# Diagrams are anchored in the upper portion to leave a clean
# typographic band at the bottom for the headline.
DIAGRAM_CY = INNER_T + 120

# --- LEFT FIELD: search lattice ---
LEFT_CX = 230
LEFT_CY = DIAGRAM_CY

# A grid of small ticks — the lattice of queries.
GRID_COLS = 11
GRID_ROWS = 9
GRID_W = 200
GRID_H = 160
gx0 = LEFT_CX - GRID_W // 2
gy0 = LEFT_CY - GRID_H // 2
cw = GRID_W / (GRID_COLS - 1)
ch = GRID_H / (GRID_ROWS - 1)

# tiny dots at every intersection — fine lattice
for i in range(GRID_COLS):
    for j in range(GRID_ROWS):
        x = gx0 + i * cw
        y = gy0 + j * ch
        # distance from center for soft focal weight
        dx = (i - (GRID_COLS - 1) / 2) / ((GRID_COLS - 1) / 2)
        dy = (j - (GRID_ROWS - 1) / 2) / ((GRID_ROWS - 1) / 2)
        dist = math.hypot(dx, dy)
        a = max(60, int(220 - dist * 140))
        d.ellipse([x - 1.2, y - 1.2, x + 1.2, y + 1.2],
                  fill=(PAPER[0], PAPER[1], PAPER[2], a))

# A few "matched" intersections — highlighted as small + crosshairs
matched = [(2, 3), (5, 1), (7, 4), (4, 6), (8, 7), (1, 7), (9, 2)]
for (i, j) in matched:
    x = gx0 + i * cw
    y = gy0 + j * ch
    s = 5
    d.line([(x - s, y), (x + s, y)], fill=TEAL, width=1)
    d.line([(x, y - s), (x, y + s)], fill=TEAL, width=1)
    d.ellipse([x - 2.2, y - 2.2, x + 2.2, y + 2.2], outline=TEAL, width=1)

# Axis rules around lattice
d.line([(gx0 - 14, gy0 - 14), (gx0 - 14, gy0 + GRID_H + 14)], fill=LINE, width=1)
d.line([(gx0 - 14, gy0 + GRID_H + 14), (gx0 + GRID_W + 14, gy0 + GRID_H + 14)],
       fill=LINE, width=1)

# Axis ticks
for i in range(GRID_COLS):
    x = gx0 + i * cw
    d.line([(x, gy0 + GRID_H + 14), (x, gy0 + GRID_H + 18)], fill=LINE, width=1)
for j in range(GRID_ROWS):
    y = gy0 + j * ch
    d.line([(gx0 - 14, y), (gx0 - 18, y)], fill=LINE, width=1)

# Labels around the lattice
d.text((gx0 - 14, gy0 - 22), "INTENT", font=f_label, fill=PAPER_DIM)
d.text((gx0 + GRID_W + 14, gy0 + GRID_H + 22), "VOLUME",
       font=f_label, fill=PAPER_DIM, anchor="rt")
d.text((gx0 - 14, gy0 + GRID_H + 32), "FIELD A  —  QUERY LATTICE",
       font=f_mono_sm, fill=PAPER)
d.text((gx0 - 14, gy0 + GRID_H + 50), "keywords resolved to intent",
       font=f_mono_xs, fill=PAPER_DIM)

# --- RIGHT FIELD: concentric response arcs ---
RIGHT_CX = W - 230
RIGHT_CY = DIAGRAM_CY

# Concentric arcs — a voice received
arc_radii = [30, 56, 84, 114, 144, 172]
for idx, r in enumerate(arc_radii):
    # near arcs brighter, far arcs softer
    fade = 1 - idx / (len(arc_radii) + 1)
    col = (int(TEAL[0] * fade + LINE[0] * (1 - fade)),
           int(TEAL[1] * fade + LINE[1] * (1 - fade)),
           int(TEAL[2] * fade + LINE[2] * (1 - fade)),
           int(220 * fade + 60))
    # draw a partial arc opening to the right
    bbox = [RIGHT_CX - r, RIGHT_CY - r, RIGHT_CX + r, RIGHT_CY + r]
    d.arc(bbox, start=210, end=510, fill=col, width=1)

# Center node — point of contact
d.ellipse([RIGHT_CX - 5, RIGHT_CY - 5, RIGHT_CX + 5, RIGHT_CY + 5],
          fill=TEAL)
d.ellipse([RIGHT_CX - 11, RIGHT_CY - 11, RIGHT_CX + 11, RIGHT_CY + 11],
          outline=TEAL, width=1)

# Radial tick marks at cardinal angles
for ang_deg in (0, 45, 90, 135, 180, 225, 270, 315):
    ang = math.radians(ang_deg)
    r1, r2 = 182, 190
    x1 = RIGHT_CX + math.cos(ang) * r1
    y1 = RIGHT_CY + math.sin(ang) * r1
    x2 = RIGHT_CX + math.cos(ang) * r2
    y2 = RIGHT_CY + math.sin(ang) * r2
    d.line([(x1, y1), (x2, y2)], fill=LINE, width=1)

# Labels for the right field — set on the right side, mirroring FIELD A
right_label_y = RIGHT_CY + 172 + 22
d.text((W - MARGIN - 60, right_label_y), "FIELD B  —  RESPONSE TOPOLOGY",
       font=f_mono_sm, fill=PAPER, anchor="rt")
d.text((W - MARGIN - 60, right_label_y + 18), "bilingual agents · sub-30s response",
       font=f_mono_xs, fill=PAPER_DIM, anchor="rt")

# Small "POINT OF CONTACT" tag near center node — placed above to avoid arcs
d.text((RIGHT_CX, RIGHT_CY - 24), "POINT  OF  CONTACT",
       font=f_label, fill=TEAL, anchor="mm")

# --- THE SIGNAL THREAD: from lattice to contact ---
# A slim connective curve crossing the page
start_x = gx0 + GRID_W + 8
start_y = LEFT_CY
end_x = RIGHT_CX - 12
end_y = RIGHT_CY

steps = 220
prev = None
for s in range(steps + 1):
    t = s / steps
    # Cubic-ish curve via three control points
    cx1, cy1 = start_x + 140, start_y - 80
    cx2, cy2 = end_x - 200, end_y + 40
    # de Casteljau cubic
    x = (1 - t) ** 3 * start_x + 3 * (1 - t) ** 2 * t * cx1 + \
        3 * (1 - t) * t ** 2 * cx2 + t ** 3 * end_x
    y = (1 - t) ** 3 * start_y + 3 * (1 - t) ** 2 * t * cy1 + \
        3 * (1 - t) * t ** 2 * cy2 + t ** 3 * end_y
    if prev:
        # glow underlay
        d.line([prev, (x, y)], fill=(TEAL_DEEP[0], TEAL_DEEP[1], TEAL_DEEP[2], 80), width=5)
        d.line([prev, (x, y)], fill=LINE_HOT, width=1)
    prev = (x, y)

# Tick markers along the thread
for s in (0.18, 0.36, 0.54, 0.72):
    t = s
    cx1, cy1 = start_x + 140, start_y - 80
    cx2, cy2 = end_x - 200, end_y + 40
    x = (1 - t) ** 3 * start_x + 3 * (1 - t) ** 2 * t * cx1 + \
        3 * (1 - t) * t ** 2 * cx2 + t ** 3 * end_x
    y = (1 - t) ** 3 * start_y + 3 * (1 - t) ** 2 * t * cy1 + \
        3 * (1 - t) * t ** 2 * cy2 + t ** 3 * end_y
    d.ellipse([x - 2, y - 2, x + 2, y + 2], fill=PAPER)

# Thread label, set in italic serif — the one "human" voice in the diagram
d.text((W // 2, DIAGRAM_CY - 68), "from keyword to customer",
       font=f_serif_it, fill=PAPER_DIM, anchor="mm")

# --- HEADLINE: the conviction, set in the clean lower band ---
f_serif_lg = font("IBMPlexSerif-Bold.ttf", 46)

headline_y = H - 108
d.text((W // 2, headline_y - 34), "CENTRIS  /  2026  SEO  MOMENTUM",
       font=f_mono_md, fill=TEAL, anchor="mm")
d.text((W // 2, headline_y + 4), "From Keywords to Customers.",
       font=f_serif_lg, fill=PAPER, anchor="mm")

# --- Corner instrumentation marks ---
def corner_mark(cx, cy, flip_x=False, flip_y=False):
    sx = -1 if flip_x else 1
    sy = -1 if flip_y else 1
    L = 14
    d.line([(cx, cy), (cx + L * sx, cy)], fill=LINE, width=1)
    d.line([(cx, cy), (cx, cy + L * sy)], fill=LINE, width=1)

corner_mark(MARGIN + 24, MARGIN + 70)
corner_mark(W - MARGIN - 24, MARGIN + 70, flip_x=True)
corner_mark(MARGIN + 24, H - MARGIN - 70, flip_y=True)
corner_mark(W - MARGIN - 24, H - MARGIN - 70, flip_x=True, flip_y=True)

# --- Save ---
out = "/home/user/tmac/centris-featured-image.png"
img.save(out, "PNG", optimize=True)
print(f"Saved: {out}  ({W}x{H})")
