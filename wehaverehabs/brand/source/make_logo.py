"""Build the WeHaveRehabs logo kit as SVGs with outlined text."""
import os
import sys

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

FONT = sys.argv[1]
OUT = sys.argv[2]
os.makedirs(OUT, exist_ok=True)

font = TTFont(FONT)
gs = font.getGlyphSet()
cmap = font.getBestCmap()
hmtx = font["hmtx"]
UPM = font["head"].unitsPerEm

FOREST = "#485848"
SAGE_D = "#576853"
SAGE = "#809070"
SAGE_L = "#A9B596"
GOLD = "#BC9D6C"
GOLD_L = "#CDB083"
GOLD_D = "#A88857"
IVORY = "#FBFAF6"
DEEP = "#2F3A2F"


def text_path(s, size, tracking):
    """Return (svg path d, advance width) for a string at a font size, origin at baseline-left."""
    scale = size / UPM
    x = 0.0
    parts = []
    for ch in s:
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        tp = TransformPen(pen, (scale, 0, 0, -scale, x, 0))
        gs[g].draw(tp)
        d = pen.getCommands()
        if d:
            parts.append(d)
        x += hmtx[g][0] * scale + tracking
    return " ".join(parts), x - tracking


def lotus(c, gid):
    """Lotus mark centred on x=0, spanning y 200..520. c = colour dict."""
    if c.get("mono"):
        m = c["mono"]
        left = (
            f'<path d="M-294 133C-200 120-118 150-100 200C-88 236-60 290-4 320C-90 250-150 170-294 133Z" fill="{m}" opacity=".55"/>'
            f'<path d="M-294 133C-150 170-90 250-4 320C-60 322-126 306-172 274C-222 240-258 186-294 133Z" fill="{m}"/>'
        )
        right = f'<g transform="scale(-1 1)">{left}</g>'
        center = (
            '<path fill-rule="evenodd" '
            'd="M0 0C44 60 79 130 74 180C69 240 29 290 0 320C-29 290-69 240-74 180C-79 130-44 60 0 0Z'
            'M0 36C-34 85-59 140-56 182C-53 232-24 276 0 300C24 276 53 232 56 182C59 140 34 85 0 36Z" '
            f'fill="{m}"/>'
        )
        return f'<g transform="translate(0 200)">{left}{right}{center}</g>'
    defs = (
        f'<linearGradient id="{gid}b" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="{c["back0"]}"/><stop offset="1" stop-color="{c["back1"]}"/></linearGradient>'
        f'<linearGradient id="{gid}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c["front0"]}"/><stop offset="1" stop-color="{c["front1"]}"/></linearGradient>'
        f'<linearGradient id="{gid}o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{c["outline0"]}"/><stop offset="1" stop-color="{c["outline1"]}"/></linearGradient>'
        f'<linearGradient id="{gid}i" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c["inner0"]}"/><stop offset="1" stop-color="{c["inner1"]}"/></linearGradient>'
    )
    left = (
        f'<path d="M-294 133C-200 120-118 150-100 200C-88 236-60 290-4 320C-90 250-150 170-294 133Z" fill="url(#{gid}b)"/>'
        f'<path d="M-294 133C-150 170-90 250-4 320C-60 322-126 306-172 274C-222 240-258 186-294 133Z" fill="url(#{gid}f)"/>'
    )
    right = f'<g transform="scale(-1 1)">{left}</g>'
    center = (
        f'<path d="M0 0C44 60 79 130 74 180C69 240 29 290 0 320C-29 290-69 240-74 180C-79 130-44 60 0 0Z" fill="url(#{gid}o)"/>'
        f'<path d="M0 36C-34 85-59 140-56 182C-53 232-24 276 0 300C24 276 53 232 56 182C59 140 34 85 0 36Z" fill="url(#{gid}i)"/>'
        f'<path d="M0 36C34 85 59 140 56 182C53 232 24 276 0 300Z" fill="{c["facet"]}" opacity=".55"/>'
    )
    return defs, f'<g transform="translate(0 200)">{left}{right}{center}</g>'


COLOR = dict(back0=SAGE, back1="#B9C3A6", front0="#4F604B", front1=SAGE, outline0="#7C8A6F",
             outline1="#5F6E58", inner0="#FFFFFF", inner1="#F1F0EA", facet="#E3E2D8",
             we=FOREST, rehabs="url(#gold)", line=GOLD, gold0=GOLD_L, gold1=GOLD_D)
REVERSED = dict(back0="#9DAA89", back1="#D3DAC4", front0="#7F9170", front1="#B3BFA0", outline0="#C3CCB3",
                outline1="#9DAA89", inner0=IVORY, inner1="#ECEADF", facet="#DCDACD",
                we=IVORY, rehabs="url(#gold)", line=GOLD_L, gold0="#DCC296", gold1=GOLD)

SIZE = 150
TRACK = 30


def wordmark(colors, x0=None, baseline=685, size=SIZE, track=None, center=True, target=1528):
    if track is None:
        _, w0 = text_path("WE HAVE REHABS", size, 0)
        track = (target - w0) / 13
    we_d, we_w = text_path("WE HAVE ", size, track)
    re_d, re_w = text_path("REHABS", size, track)
    total = we_w + track + re_w
    x = -total / 2 if center else x0
    s = (f'<path transform="translate({x:.1f} {baseline})" d="{we_d}" fill="{colors["we"]}"/>'
         f'<path transform="translate({x + we_w + track:.1f} {baseline})" d="{re_d}" fill="{colors["rehabs"]}"/>')
    return s, total


def gold_def(colors):
    return (f'<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{colors["gold0"]}"/>'
            f'<stop offset="1" stop-color="{colors["gold1"]}"/></linearGradient>')


def lines(color):
    return (f'<path d="M-676 468.6L-241 467V472.5L-676 470Z" fill="{color}"/>'
            f'<path d="M676 468.6L241 467V472.5L676 470Z" fill="{color}"/>')


def svg(viewbox, body, bg=None, title="WeHaveRehabs"):
    rect = ""
    if bg:
        vb = [float(v) for v in viewbox.split()]
        rect = f'<rect x="{vb[0]}" y="{vb[1]}" width="{vb[2]}" height="{vb[3]}" fill="{bg}"/>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}" role="img" aria-label="{title}">'
            f'<title>{title}</title>{rect}{body}</svg>\n')


def write(name, content):
    with open(os.path.join(OUT, name), "w") as fh:
        fh.write(content)


# 1. Primary stacked logo (matches the supplied artwork)
for name, cols, bg in (("logo-primary", COLOR, None), ("logo-primary-reversed", REVERSED, None),
                       ("logo-primary-on-ivory", COLOR, IVORY), ("logo-primary-on-forest", REVERSED, DEEP)):
    defs, mark = lotus(cols, "p")
    wm, _ = wordmark(cols)
    body = f'<defs>{defs}{gold_def(cols)}</defs>{lines(cols["line"])}{mark}{wm}'
    vb = "-800 160 1600 590" if bg else "-780 180 1560 540"
    write(name + ".svg", svg(vb, body, bg))

# 2. One-colour versions
for name, m in (("logo-mono-forest", FOREST), ("logo-mono-white", "#FFFFFF"), ("logo-mono-gold", GOLD)):
    cols = dict(mono=m, we=m, rehabs=m)
    wm, _ = wordmark(cols)
    body = f'{lines(m)}{lotus(cols, "m")}{wm}'
    write(name + ".svg", svg("-780 180 1560 540", body))

# 3. Horizontal lockup: lotus left, wordmark right (for website headers)
for name, cols in (("logo-horizontal", COLOR), ("logo-horizontal-reversed", REVERSED)):
    defs, mark = lotus(cols, "h")
    s = 0.62
    wm, total = wordmark(cols, x0=0, baseline=0, center=False)
    # lotus spans x -296..296, y 200..520 -> scaled width 367, height 198
    lx = 296 * s
    body = (f'<defs>{defs}{gold_def(cols)}</defs>'
            f'<g transform="translate({lx:.1f} 0) scale({s}) translate(0 -360)">{mark}</g>'
            f'<g transform="translate({2 * lx + 70:.1f} {52.5})">{wm}</g>')
    w = 2 * lx + 70 + total + 50
    write(name + ".svg", svg(f"-30 -110 {w:.0f} 220", body))

# 4. Lotus mark only
for name, cols in (("mark-lotus", COLOR), ("mark-lotus-reversed", REVERSED)):
    defs, mark = lotus(cols, "k")
    write(name + ".svg", svg("-310 190 620 340", f"<defs>{defs}</defs>{mark}"))
write("mark-lotus-mono-forest.svg", svg("-310 190 620 340", lotus(dict(mono=FOREST), "k")))

# 5. App icon / favicon artwork (square)
for name, cols, bg in (("icon-ivory", COLOR, IVORY), ("icon-forest", REVERSED, DEEP), ("icon-sage", REVERSED, SAGE_D)):
    defs, mark = lotus(cols, "i")
    body = (f'<defs>{defs}</defs><rect x="-400" y="0" width="800" height="800" fill="{bg}"/>'
            f'<g transform="translate(0 400) scale(1.25) translate(0 -360)">{mark}</g>')
    write(name + ".svg", svg("-400 0 800 800", body))

# 6. Social sharing image 1200x630
defs, mark = lotus(COLOR, "o")
wm, _ = wordmark(COLOR)
body = (f'<defs>{defs}{gold_def(COLOR)}</defs><rect x="-1000" y="0" width="2000" height="1050" fill="{IVORY}"/>'
        f'<g transform="translate(0 70) scale(.95)">{lines(GOLD)}{mark}{wm}</g>')
tag_d, tag_w = text_path("HOLISTIC · RECOVERY · RETREATS", 46, 22)
body += f'<path transform="translate({-tag_w / 2:.1f} 820)" d="{tag_d}" fill="{GOLD_D}"/>'
write("social-og-image.svg", svg("-1000 0 2000 1050", body, title="WeHaveRehabs — Holistic · Recovery · Retreats"))
print("ok", sorted(os.listdir(OUT)))
