#!/usr/bin/env python3
"""
Render the Facebook kit from posts.json.

    python3 build.py

Needs Pillow (pip install pillow). The three brand fonts are fetched once into
.fonts/ from the Google Fonts repository; they are the faces the website uses
(Newsreader, Inter, DM Mono), all under the SIL Open Font License.

Output
    media/<post-id>/01.jpg       1080x1350 feed images for photo posts
    media/share/<key>.jpg        1200x630 link-preview cards, one per page
    media/page/cover.jpg         1640x856 Page cover photo
    media/page/avatar.jpg        1080x1080 Page profile picture
    CAPTIONS.md                  every caption, link, alt text and Page field

Link posts carry no uploaded image: Facebook builds the preview from the
target page's Open Graph tags. The cards in media/share/ exist so the theme can
serve them as og:image, and so there is something to attach by hand if a
preview ever comes back bare.
"""

import json
import os
import sys
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

FEED_W, FEED_H = 1080, 1350     # portrait feed post
PHOTO_H = 810                   # photo band inside a feed photo_panel
SHARE_W, SHARE_H = 1200, 630    # Open Graph / link preview
COVER_W, COVER_H = 1640, 856    # Page cover photo
MARGIN = 76

# A Page cover is cropped differently on every surface. Desktop trims the
# height, mobile trims the width. Everything that must survive both stays
# inside this central box.
COVER_SAFE_W, COVER_SAFE_H = 1500, 600

FONT_URLS = {
    "Newsreader.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/newsreader/Newsreader%5Bopsz,wght%5D.ttf",
    "Inter.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz,wght%5D.ttf",
    "DMMono-Regular.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/dmmono/DMMono-Regular.ttf",
}


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
            sys.exit(f"could not fetch {name} ({exc}). Download it into {FONTDIR}/")


def serif(size, weight=460):
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
# text
# --------------------------------------------------------------------------

def text_w(draw, s, font):
    return draw.textbbox((0, 0), s, font=font)[2]


def draw_tracked(draw, xy, s, font, fill, track):
    x, y = xy
    for ch in s:
        draw.text((x, y), ch, font=font, fill=fill)
        x += text_w(draw, ch, font) + track
    return x


def wrap_to_width(draw, s, font, max_w):
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


def fit_headline(draw, s, max_w, max_h, hi, lo=30, lh=1.14):
    for size in range(hi, lo - 1, -2):
        font = serif(size)
        lines = wrap_to_width(draw, s, font, max_w)
        if len(lines) * size * lh <= max_h:
            return font, lines, size * lh
    font = serif(lo)
    return font, wrap_to_width(draw, s, font, max_w), lo * lh


def cover_crop(im, box_w, box_h):
    want, have = box_w / box_h, im.width / im.height
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
        return {"bg": colors["navy"], "fg": colors["cream"], "accent": colors["blue_lt"],
                "rule": "#2A4868", "muted": "#9FB3C8"}
    return {"bg": colors["cream"], "fg": colors["ink"], "accent": colors["blue"],
            "rule": colors["line"], "muted": "#5A6B7E"}


def scrim(im, colors, strength=0.74):
    """Darken a photograph with the brand navy so type sits on it legibly."""
    veil = Image.new("RGB", im.size, colors["navy"])
    return Image.blend(im, veil, strength)


# --------------------------------------------------------------------------
# renderers
# --------------------------------------------------------------------------

def render_photo_panel(slide, colors, site):
    pal = palette(slide.get("panel", "cream"), colors)
    canvas = Image.new("RGB", (FEED_W, FEED_H), pal["bg"])
    photo = Image.open(os.path.join(PHOTOS, slide["photo"])).convert("RGB")
    canvas.paste(cover_crop(photo, FEED_W, PHOTO_H), (0, 0))
    d = ImageDraw.Draw(canvas)

    inner = FEED_W - MARGIN * 2
    y = PHOTO_H + 54
    if slide.get("eyebrow"):
        draw_tracked(d, (MARGIN, y), slide["eyebrow"].upper(), mono(23), pal["accent"], 3.4)
        y += 52

    font, lines, step = fit_headline(d, slide["headline"], inner, 540 - (y - PHOTO_H) - 92, 70)
    for line in lines:
        d.text((MARGIN, y), line, font=font, fill=pal["fg"])
        y += step

    foot_y = FEED_H - MARGIN - 26
    d.line([(MARGIN, foot_y - 26), (FEED_W - MARGIN, foot_y - 26)], fill=pal["rule"], width=2)
    draw_tracked(d, (MARGIN, foot_y), site, mono(21), pal["muted"], 2.2)
    return canvas


def render_card(slide, colors):
    pal = palette(slide.get("ground", "cream"), colors)
    canvas = Image.new("RGB", (FEED_W, FEED_H), pal["bg"])
    d = ImageDraw.Draw(canvas)
    inner = FEED_W - MARGIN * 2

    body = slide.get("body", "")
    bf = sans(31)
    body_lines = wrap_to_width(d, body, bf, inner) if body else []
    body_h = len(body_lines) * 46 + (34 if body_lines else 0)
    eyebrow_h = 56 if slide.get("eyebrow") else 0

    top, bottom = MARGIN + 18, FEED_H - MARGIN - 78
    font, lines, step = fit_headline(d, slide["headline"], inner,
                                     (bottom - top) - eyebrow_h - body_h,
                                     84 if body_lines else 104)
    block_h = eyebrow_h + len(lines) * step + body_h
    y = top + max(0, (bottom - top - block_h) // 2) - 24

    if slide.get("eyebrow"):
        draw_tracked(d, (MARGIN, y + 6), slide["eyebrow"].upper(), mono(23), pal["accent"], 3.4)
        y += eyebrow_h
    for line in lines:
        d.text((MARGIN, y), line, font=font, fill=pal["fg"])
        y += step
    if body_lines:
        y += 34
        for line in body_lines:
            d.text((MARGIN, y), line, font=bf, fill=pal["muted"])
            y += 46

    foot_y = FEED_H - MARGIN - 26
    d.line([(MARGIN, foot_y - 26), (FEED_W - MARGIN, foot_y - 26)], fill=pal["rule"], width=2)
    if slide.get("footer"):
        draw_tracked(d, (MARGIN, foot_y), slide["footer"], mono(21), pal["muted"], 2.2)
    return canvas


def render_share(spec, colors, site):
    """1200x630 link-preview card: type over a darkened photograph."""
    photo = Image.open(os.path.join(PHOTOS, spec["photo"])).convert("RGB")
    canvas = scrim(cover_crop(photo, SHARE_W, SHARE_H), colors)
    d = ImageDraw.Draw(canvas)

    m = 68
    inner = SHARE_W - m * 2
    font, lines, step = fit_headline(d, spec["headline"], inner, 300, 64)

    block_h = 46 + len(lines) * step
    y = (SHARE_H - block_h) // 2 - 10

    draw_tracked(d, (m, y), spec["eyebrow"].upper(), mono(21), colors["blue_lt"], 3.2)
    y += 46
    for line in lines:
        d.text((m, y), line, font=font, fill=colors["cream"])
        y += step

    foot_y = SHARE_H - m + 4
    d.line([(m, foot_y - 22), (SHARE_W - m, foot_y - 22)], fill="#2A4868", width=2)
    draw_tracked(d, (m, foot_y), site, mono(19), "#9FB3C8", 2.0)
    return canvas


def render_cover(spec, colors, site):
    """1640x856 Page cover, with everything important inside the safe box."""
    photo = Image.open(os.path.join(PHOTOS, spec["photo"])).convert("RGB")
    canvas = scrim(cover_crop(photo, COVER_W, COVER_H), colors, 0.66)
    d = ImageDraw.Draw(canvas)

    safe_x = (COVER_W - COVER_SAFE_W) // 2
    safe_y = (COVER_H - COVER_SAFE_H) // 2

    font, lines, step = fit_headline(d, spec["headline"], COVER_SAFE_W - 80, 300, 76)
    block_h = 52 + len(lines) * step + 54
    y = safe_y + (COVER_SAFE_H - block_h) // 2

    def centred_tracked(text, fnt, fill, track, yy):
        w = sum(text_w(d, c, fnt) + track for c in text) - track
        draw_tracked(d, ((COVER_W - w) // 2, yy), text, fnt, fill, track)

    centred_tracked(spec["eyebrow"].upper(), mono(24), colors["blue_lt"], 3.6, y)
    y += 52
    for line in lines:
        w = text_w(d, line, font)
        d.text(((COVER_W - w) // 2, y), line, font=font, fill=colors["cream"])
        y += step
    y += 10
    centred_tracked(site, mono(22), "#9FB3C8", 2.4, y)
    return canvas


def render_avatar(colors):
    av = Image.new("RGB", (1080, 1080), colors["cream"])
    logo = Image.open(os.path.join(PHOTOS, "logo.png")).convert("RGBA")
    target = 660
    logo = logo.resize((target, int(target * logo.height / logo.width)), Image.LANCZOS)
    av.paste(logo, ((1080 - logo.width) // 2, (1080 - logo.height) // 2), logo)
    return av


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
    b, urls, ps = spec["brand"], spec["urls"], spec["page_setup"]
    out = [
        "# Facebook captions, links and Page fields",
        "",
        "Generated by `build.py` from `posts.json`. Do not edit this file — edit",
        "`posts.json` and re-run the build.",
        "",
        f"Page: **{b['page_name']}** - {b['site']}",
        "",
        "Two kinds of post below.",
        "",
        "- **Link post** — paste the caption, then the URL on its own. Facebook builds",
        "  the preview card from the page itself; wait for it to load, then delete the",
        "  raw URL from the text if you prefer a cleaner post. Do not attach an image:",
        "  an uploaded image replaces the link card and kills the click target.",
        "- **Photo post** — upload the image listed, paste the caption, set the alt text.",
        "",
        "Hashtags are deliberately sparse. They do very little on Facebook, and a wall",
        "of them reads as spam here in a way it does not on Instagram. Put them at the",
        "end of the caption, not in a comment.",
        "",
        "---",
        "",
    ]
    for p in spec["posts"]:
        out.append(f"## {p['order']}. `{p['id']}`")
        out.append("")
        if p["format"] == "link":
            pin = "  **Pin this to the Page.**" if p.get("pin_to_page") else ""
            out.append(f"**Link post** → {urls[p['link']]}{pin}")
            out.append("")
            out.append("No image upload. Let Facebook build the preview card.")
        else:
            pin = "  **Pin this to the Page.**" if p.get("pin_to_page") else ""
            out.append(f"**Photo post**, 1 image.{pin}")
            out.append("")
            out.append(f"Upload: `media/{p['id']}/01.jpg`")
        out.append("")
        out.append("**Caption** — paste exactly as written:")
        out.append("")
        out.append("```text")
        tags = hashtag_line(spec, p["hashtag_sets"])
        body = p["caption"]
        if p["format"] == "link":
            body = body + "\n\n" + urls[p["link"]]
        out.append(body + ("\n\n" + tags if tags else ""))
        out.append("```")
        out.append("")
        if p["alt_text"]:
            out.append("**Alt text:**")
            out.append("")
            for i, alt in enumerate(p["alt_text"]):
                out.append(f"{i + 1}. {alt}")
            out.append("")
        out.append("---")
        out.append("")

    out += [
        "## Page setup",
        "",
        f"**Page name:** {ps['page_name']}",
        "",
        f"**Username:** {ps['username_suggestion']}  — {ps['username_note']}",
        "",
        "**Categories:** " + ", ".join(ps["categories"]),
        "",
        "**Profile picture:** `media/page/avatar.jpg`",
        "",
        "**Cover photo:** `media/page/cover.jpg` (1640 × 856 — the text sits inside the",
        "central safe area so it survives both the desktop and the mobile crop)",
        "",
        "**Short bio:**",
        "",
        "```text",
        ps["bio_short"],
        "```",
        "",
        f"_{ps['bio_short_note']}_",
        "",
        "**About / additional information:**",
        "",
        "```text",
        ps["about_long"],
        "```",
        "",
        f"**Website:** {ps['website']}",
        "",
        f"**Action button:** {ps['cta_button']} → {ps['cta_button_url']}",
        "",
        f"_{ps['cta_note']}_",
        "",
        f"**Address:** {ps['service_area_note']}",
        "",
        f"**Hours:** {ps['hours_note']}",
        "",
        "### Services",
        "",
        "Add each one under the Page's services section:",
        "",
        "| Service | Link | Description |",
        "|---|---|---|",
    ]
    for s in ps["services"]:
        out.append(f"| {s['name']} | {urls[s['url_key']]} | {s['blurb']} |")
    out += [
        "",
        "### Link preview cards",
        "",
        "`media/share/` holds a 1200 × 630 card per page. Facebook normally pulls the",
        "preview image from the page's own Open Graph tags, so these are not uploaded",
        "with a post. They are here to be served as `og:image` by the site, and as a",
        "fallback to attach by hand if a preview ever comes back without a picture.",
        "",
    ]
    for c in spec["share_cards"]:
        out.append(f"- `media/share/{c['key']}.jpg` → {urls[c['key']]}")
    out.append("")

    with open(os.path.join(HERE, "CAPTIONS.md"), "w") as f:
        f.write("\n".join(out))


# --------------------------------------------------------------------------

def main():
    with open(os.path.join(HERE, "posts.json")) as f:
        spec = json.load(f)
    colors, site = spec["brand"]["colors"], spec["brand"]["site"]

    print("fonts")
    ensure_fonts()

    print("media")
    count = 0
    for p in spec["posts"]:
        if p["format"] == "link":
            if p["link"] not in spec["urls"]:
                sys.exit(f"{p['id']}: unknown link key {p['link']!r}")
            print(f"  {p['id']:<18} link post, no image")
            continue
        if len(p["alt_text"]) != len(p["slides"]):
            sys.exit(f"{p['id']}: {len(p['slides'])} slides but {len(p['alt_text'])} alt texts")
        folder = os.path.join(MEDIA, p["id"])
        os.makedirs(folder, exist_ok=True)
        for i, slide in enumerate(p["slides"], start=1):
            if slide["kind"] == "photo_panel":
                img = render_photo_panel(slide, colors, site)
            elif slide["kind"] == "card":
                img = render_card(slide, colors)
            else:
                sys.exit(f"{p['id']}: unknown slide kind {slide['kind']!r}")
            img.save(os.path.join(folder, f"{i:02d}.jpg"), quality=92, optimize=True)
            count += 1
        print(f"  {p['id']:<18} photo post")

    share_dir = os.path.join(MEDIA, "share")
    os.makedirs(share_dir, exist_ok=True)
    for c in spec["share_cards"]:
        render_share(c, colors, site).save(
            os.path.join(share_dir, f"{c['key']}.jpg"), quality=88, optimize=True)
        count += 1
    print(f"  share              {len(spec['share_cards'])} link-preview cards")

    page_dir = os.path.join(MEDIA, "page")
    os.makedirs(page_dir, exist_ok=True)
    render_cover(spec["cover"], colors, site).save(
        os.path.join(page_dir, "cover.jpg"), quality=90, optimize=True)
    render_avatar(colors).save(os.path.join(page_dir, "avatar.jpg"), quality=94)
    count += 2
    print("  page               cover + avatar")

    print("captions")
    write_captions(spec)

    links = sum(1 for p in spec["posts"] if p["format"] == "link")
    print(f"\n{count} images, {len(spec['posts'])} posts ({links} link, "
          f"{len(spec['posts']) - links} photo). CAPTIONS.md written.")


if __name__ == "__main__":
    main()
