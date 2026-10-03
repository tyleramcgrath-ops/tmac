#!/usr/bin/env python3
"""
Render the Instagram kit from posts.json.

Everything the kit ships is generated here, so the pictures and the captions
come from one file and cannot drift apart. Edit posts.json, re-run this, and
media/ plus CAPTIONS.md are rebuilt together.

    python3 build.py

Needs Pillow (pip install pillow) and the three brand fonts. The fonts are
fetched once into .fonts/ from the Google Fonts repository if they are not
already there; they are the same faces the website uses (Newsreader, Inter,
DM Mono), all under the SIL Open Font License.

Output
    media/<post-id>/01.jpg ...   1080x1350, the aspect Instagram shows largest
    media/profile/avatar.jpg     1080x1080 for the profile picture
    media/profile/highlight-*.jpg 1080x1920 story-shaped highlight covers
    CAPTIONS.md                  every caption, alt text and first comment
"""

import json
import os
import sys
import textwrap
import urllib.request

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("Pillow is required:  pip install pillow")

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
PHOTOS = os.path.join(REPO, "themes", "mcgrath-chrome", "assets", "img")
MEDIA = os.path.join(HERE, "media")
FONTDIR = os.path.join(HERE, ".fonts")

W, H = 1080, 1350          # Instagram's tallest supported feed ratio, 4:5
PHOTO_H = 810              # photo band on a photo_panel slide, leaving 540 of panel
MARGIN = 76

FONT_URLS = {
    "Newsreader.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/newsreader/Newsreader%5Bopsz,wght%5D.ttf",
    "Inter.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz,wght%5D.ttf",
    "DMMono-Regular.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/dmmono/DMMono-Regular.ttf",
}


# --------------------------------------------------------------------------
# fonts
# --------------------------------------------------------------------------

def ensure_fonts():
    os.makedirs(FONTDIR, exist_ok=True)
    for name, url in FONT_URLS.items():
        path = os.path.join(FONTDIR, name)
        if os.path.exists(path) and os.path.getsize(path) > 10000:
            continue
        print(f"  fetching {name}")
        try:
            with urllib.request.urlopen(url, timeout=60) as r, open(path, "wb") as f:
                f.write(r.read())
        except Exception as exc:
            sys.exit(
                f"could not fetch {name} ({exc}).\n"
                f"Download it manually into {FONTDIR}/ from {url}"
            )


def serif(size, weight=460):
    """Newsreader, the display face the website uses for headings."""
    f = ImageFont.truetype(os.path.join(FONTDIR, "Newsreader.ttf"), size)
    try:
        f.set_variation_by_axes([weight, min(72, max(6, size))])
    except Exception:
        pass
    return f


def sans(size, weight=400):
    f = ImageFont.truetype(os.path.join(FONTDIR, "Inter.ttf"), size)
    try:
        f.set_variation_by_axes([min(32, max(14, size)), weight])
    except Exception:
        pass
    return f


def mono(size):
    return ImageFont.truetype(os.path.join(FONTDIR, "DMMono-Regular.ttf"), size)


# --------------------------------------------------------------------------
# text helpers
# --------------------------------------------------------------------------

def text_w(draw, s, font):
    return draw.textbbox((0, 0), s, font=font)[2]


def draw_tracked(draw, xy, s, font, fill, track):
    """Letter-spaced text. Pillow has no tracking, so step glyph by glyph."""
    x, y = xy
    for ch in s:
        draw.text((x, y), ch, font=font, fill=fill)
        x += text_w(draw, ch, font) + track
    return x


def tracked_w(draw, s, font, track):
    return sum(text_w(draw, c, font) + track for c in s) - track if s else 0


def wrap_to_width(draw, s, font, max_w):
    """Greedy wrap on words, measuring the real font."""
    words, lines, line = s.split(), [], ""
    for word in words:
        trial = f"{line} {word}".strip()
        if text_w(draw, trial, font) <= max_w or not line:
            line = trial
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def fit_headline(draw, s, max_w, max_h, hi, lo=38, lh=1.14):
    """Largest size at which the headline fits the box. Shrink, never overflow."""
    for size in range(hi, lo - 1, -2):
        font = serif(size)
        lines = wrap_to_width(draw, s, font, max_w)
        if len(lines) * size * lh <= max_h:
            return font, lines, size * lh
    font = serif(lo)
    return font, wrap_to_width(draw, s, font, max_w), lo * lh


# --------------------------------------------------------------------------
# slides
# --------------------------------------------------------------------------

def cover_crop(im, box_w, box_h):
    """Crop to the box's ratio from the centre, then scale. Never distorts."""
    want = box_w / box_h
    have = im.width / im.height
    if have > want:
        new_w = int(im.height * want)
        left = (im.width - new_w) // 2
        im = im.crop((left, 0, left + new_w, im.height))
    else:
        new_h = int(im.width / want)
        top = (im.height - new_h) // 2
        im = im.crop((0, top, im.width, top + new_h))
    return im.resize((box_w, box_h), Image.LANCZOS)


def palette(ground, colors):
    if ground == "navy":
        return {
            "bg": colors["navy"],
            "fg": colors["cream"],
            "accent": colors["blue_lt"],
            "rule": "#2A4868",
            "muted": "#9FB3C8",
        }
    return {
        "bg": colors["cream"],
        "fg": colors["ink"],
        "accent": colors["blue"],
        "rule": colors["line"],
        "muted": "#5A6B7E",
    }


def render_photo_panel(slide, colors, site):
    """Photograph on top, editorial panel beneath. The theme's own idiom."""
    pal = palette(slide.get("panel", "cream"), colors)
    canvas = Image.new("RGB", (W, H), pal["bg"])
    photo = Image.open(os.path.join(PHOTOS, slide["photo"])).convert("RGB")
    canvas.paste(cover_crop(photo, W, PHOTO_H), (0, 0))
    d = ImageDraw.Draw(canvas)

    inner = W - MARGIN * 2
    y = PHOTO_H + 54

    eyebrow = slide.get("eyebrow", "")
    if eyebrow:
        ef = mono(23)
        draw_tracked(d, (MARGIN, y), eyebrow.upper(), ef, pal["accent"], 3.4)
        y += 52

    font, lines, step = fit_headline(d, slide["headline"], inner, 540 - (y - PHOTO_H) - 92, 70)
    for line in lines:
        d.text((MARGIN, y), line, font=font, fill=pal["fg"])
        y += step

    foot_y = H - MARGIN - 26
    d.line([(MARGIN, foot_y - 26), (W - MARGIN, foot_y - 26)], fill=pal["rule"], width=2)
    draw_tracked(d, (MARGIN, foot_y), site, mono(21), pal["muted"], 2.2)
    return canvas


def render_card(slide, colors, index, total):
    """A full-bleed text card for carousels."""
    pal = palette(slide.get("ground", "cream"), colors)
    canvas = Image.new("RGB", (W, H), pal["bg"])
    d = ImageDraw.Draw(canvas)
    inner = W - MARGIN * 2

    body = slide.get("body", "")
    footer = slide.get("footer", "")
    eyebrow = slide.get("eyebrow", "")

    # Measure everything before drawing anything, so the whole block can be
    # centred in the live area rather than piling up against the top margin.
    bf = sans(31)
    body_lines = wrap_to_width(d, body, bf, inner) if body else []
    body_h = len(body_lines) * 46 + (34 if body_lines else 0)
    eyebrow_h = 56 if eyebrow else 0

    top = MARGIN + 18
    bottom = H - MARGIN - 78          # clears the footer rule
    head_box = (bottom - top) - eyebrow_h - body_h
    # A card with no body is a cover or a closer: let the line run bigger.
    font, lines, step = fit_headline(d, slide["headline"], inner, head_box,
                                     84 if body_lines else 104)

    block_h = eyebrow_h + len(lines) * step + body_h
    # Optical centre sits a little above the true one.
    y = top + max(0, (bottom - top - block_h) // 2) - 24

    if eyebrow:
        draw_tracked(d, (MARGIN, y + 6), eyebrow.upper(), mono(23), pal["accent"], 3.4)
        y += eyebrow_h

    for line in lines:
        d.text((MARGIN, y), line, font=font, fill=pal["fg"])
        y += step

    if body_lines:
        y += 34
        for line in body_lines:
            d.text((MARGIN, y), line, font=bf, fill=pal["muted"])
            y += 46

    foot_y = H - MARGIN - 26
    d.line([(MARGIN, foot_y - 26), (W - MARGIN, foot_y - 26)], fill=pal["rule"], width=2)
    if footer:
        draw_tracked(d, (MARGIN, foot_y), footer, mono(21), pal["muted"], 2.2)
    if total > 1:
        counter = f"{index}/{total}"
        cf = mono(21)
        cw = tracked_w(d, counter, cf, 2.2)
        draw_tracked(d, (W - MARGIN - cw, foot_y), counter, cf, pal["muted"], 2.2)
    return canvas


# --------------------------------------------------------------------------
# profile assets
# --------------------------------------------------------------------------

def render_profile(spec, colors):
    out = os.path.join(MEDIA, "profile")
    os.makedirs(out, exist_ok=True)

    # Avatar: the logo centred on cream, sized to survive a circular crop.
    av = Image.new("RGB", (1080, 1080), colors["cream"])
    logo = Image.open(os.path.join(PHOTOS, spec["avatar_source"])).convert("RGBA")
    target = 660
    logo = logo.resize((target, int(target * logo.height / logo.width)), Image.LANCZOS)
    av.paste(logo, ((1080 - logo.width) // 2, (1080 - logo.height) // 2), logo)
    av.save(os.path.join(out, "avatar.jpg"), quality=94)

    # Highlight covers: story-shaped, label centred in the circular safe zone.
    for h in spec["highlights"]:
        cov = Image.new("RGB", (1080, 1920), colors["navy"])
        d = ImageDraw.Draw(cov)
        f = serif(96, 440)
        label = h["name"]
        bb = d.textbbox((0, 0), label, font=f)
        d.text(((1080 - bb[2]) // 2, (1920 - (bb[3] - bb[1])) // 2 - bb[1]),
               label, font=f, fill=colors["cream"])
        slug = label.lower().replace(" ", "-")
        cov.save(os.path.join(out, f"highlight-{slug}.jpg"), quality=94)

    return len(spec["highlights"]) + 1


# --------------------------------------------------------------------------
# captions
# --------------------------------------------------------------------------

def hashtag_line(spec, sets):
    tags, seen = [], set()
    for name in sets:
        for tag in spec["hashtags"][name]:
            if tag not in seen:
                seen.add(tag)
                tags.append(tag)
    return " ".join(tags)


def write_captions(spec):
    b = spec["brand"]
    out = [
        "# Captions, alt text and first comments",
        "",
        "Generated by `build.py` from `posts.json`. Do not edit this file — edit",
        "`posts.json` and re-run the build, or the words here will stop matching the",
        "pictures in `media/`.",
        "",
        f"Account: **{b['name']}** ({b['handle_placeholder']}) - {b['site']}",
        "",
        "Each post below lists, in posting order: the files to upload, the caption to",
        "paste, the alt text for each image, and the hashtag block to post as the",
        "first comment rather than inside the caption.",
        "",
        "---",
        "",
    ]
    for p in spec["posts"]:
        n = len(p["slides"])
        out.append(f"## {p['order']}. `{p['id']}`")
        out.append("")
        kind = f"Carousel, {n} images." if p["type"] == "carousel" else "Single image."
        pin = "  **Pin this to the profile grid.**" if p.get("pin_to_profile") else ""
        out.append(f"{kind}{pin}")
        out.append("")
        out.append("**Upload, in this order:**")
        out.append("")
        for i in range(n):
            out.append(f"{i + 1}. `media/{p['id']}/{i + 1:02d}.jpg`")
        out.append("")
        out.append("**Caption** — paste exactly as written:")
        out.append("")
        out.append("```text")
        out.append(p["caption"])
        out.append("```")
        out.append("")
        out.append("**Alt text** — set one per image, in the accessibility field:")
        out.append("")
        for i, alt in enumerate(p["alt_text"]):
            out.append(f"{i + 1}. {alt}")
        out.append("")
        out.append("**First comment** — post this as a comment once the post is live:")
        out.append("")
        out.append("```text")
        out.append(hashtag_line(spec, p["hashtag_sets"]))
        out.append("```")
        out.append("")
        out.append("---")
        out.append("")

    pr = spec["profile"]
    out += [
        "## Profile setup",
        "",
        "**Profile picture:** `media/profile/avatar.jpg`",
        "",
        f"**Name field:** {pr['name_field']}",
        "",
        "**Bio** (paste as written, line breaks included):",
        "",
        "```text",
        pr["bio"],
        "```",
        "",
        f"_{pr['bio_note']}_",
        "",
        f"**Link:** {pr['link']}",
        "",
        f"**Category:** {pr['category_suggestion']}",
        "",
        f"**Contact buttons:** {pr['contact_options']}",
        "",
        "**Highlights** — create each one, set the cover from the file listed, and",
        "add the posts named once they are live:",
        "",
        "| Highlight | Cover file | Holds |",
        "|---|---|---|",
    ]
    for h in pr["highlights"]:
        slug = h["name"].lower().replace(" ", "-")
        out.append(f"| {h['name']} | `media/profile/highlight-{slug}.jpg` | {h['holds']} |")
    out.append("")

    with open(os.path.join(HERE, "CAPTIONS.md"), "w") as f:
        f.write("\n".join(out))


# --------------------------------------------------------------------------

def main():
    with open(os.path.join(HERE, "posts.json")) as f:
        spec = json.load(f)
    colors = spec["brand"]["colors"]
    site = spec["brand"]["site"]

    print("fonts")
    ensure_fonts()

    print("media")
    count = 0
    for p in spec["posts"]:
        folder = os.path.join(MEDIA, p["id"])
        os.makedirs(folder, exist_ok=True)
        total = len(p["slides"])
        if len(p["alt_text"]) != total:
            sys.exit(f"{p['id']}: {total} slides but {len(p['alt_text'])} alt texts")
        for i, slide in enumerate(p["slides"], start=1):
            if slide["kind"] == "photo_panel":
                img = render_photo_panel(slide, colors, site)
            elif slide["kind"] == "card":
                img = render_card(slide, colors, i, total)
            else:
                sys.exit(f"{p['id']}: unknown slide kind {slide['kind']!r}")
            img.save(os.path.join(folder, f"{i:02d}.jpg"), quality=92, optimize=True)
            count += 1
        print(f"  {p['id']:<18} {total} image{'s' if total > 1 else ''}")

    count += render_profile(spec["profile"], colors)
    print("  profile            avatar + highlight covers")

    print("captions")
    write_captions(spec)

    print(f"\n{count} images, {len(spec['posts'])} posts. CAPTIONS.md written.")


if __name__ == "__main__":
    main()
