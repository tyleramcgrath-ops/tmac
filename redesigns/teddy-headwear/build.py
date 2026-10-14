"""Generate the Teddy Headwear redesign pages from shared templates.

Run from anywhere:  python3 redesigns/teddy-headwear/build.py
Pages share assets/site.css and assets/site.js; site.js renders the header,
footer, cart and each page's interactive parts.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent

FONTS = ("https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,300..900;1,62..125,300..900"
         "&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..700&family=IBM+Plex+Mono:wght@400;500"
         "&family=Yellowtail&family=Graduate&family=Rye&display=swap")

CITY = {"t": ("T", "Texas"), "f": ("F", "Florida"), "ny": ("NY", "New York"), "la": ("LA", "Los Angeles")}
HATS = []
for typ, price in (("cowboy", 150), ("fedora", 140)):
    for m, (mono, place) in CITY.items():
        HATS.append({"id": f"{typ}-{m}", "name": f"{mono} {'Cowboy' if typ == 'cowboy' else 'Fedora'} Hat", "price": price,
                     "img": f"img/{typ}-{m}-cream.webp",
                     "desc": f"100% wool {typ} hat with the {place} {mono} monogram embroidered on the crown. Silk lined, adjustable sweatband, leather band with metal button."})
APPAREL = [
    ("tee-script", "Teddy Script Tee", 45, "apparel-tee-black", "Heavyweight faded black tee with an oversized gold script T."),
    ("tee-monogram", "Monogram Tee", 45, "apparel-tee-bone", "Bone cotton tee with the Teddy Headwear script in forest green."),
    ("hoodie", "Frontier Hoodie", 95, "apparel-hoodie", "Forest green hoodie with the Teddy script embroidered in gold."),
    ("crew", "Saddle Crewneck", 85, "apparel-crew", "Saddle brown crewneck with a cream script T."),
    ("trucker", "Teddy Trucker", 40, "apparel-trucker", "Forest green mesh trucker with the gold Teddy oval."),
    ("cord", "Corduroy Trucker", 45, "apparel-cord", "Cream corduroy trucker with the gold Teddy oval."),
    ("rag", "Silk Wild Rag", 55, "apparel-rag", "Gold silk wild rag that matches the hat lining."),
    ("tote", "Canvas Tote", 35, "apparel-tote", "Bone canvas tote with leather handles."),
]
APPAREL = [{"id": i, "name": n, "price": p, "img": f"img/{k}.webp", "desc": d} for i, n, p, k, d in APPAREL]


def head(title, desc, extra=""):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<link rel="stylesheet" href="assets/site.css">{extra}
</head>
"""


def page(path, title, desc, body_attrs, main, extra_head="", after_main=""):
    html = head(title, desc, extra_head) + f"""<body {body_attrs}>
<div id="chrome-top"></div>
<main id="top">
{main}
</main>
{after_main}<div id="chrome-bottom"></div>
<script src="assets/site.js"></script>
</body>
</html>
"""
    (ROOT / path).write_text(html)


def studio_controls(full):
    styles = [("script", "Script", "font-family:Yellowtail"), ("varsity", "Varsity", "font-family:Graduate"),
              ("serif", "Serif", "font-family:'Bodoni Moda';font-style:italic;font-weight:600"), ("western", "Western", "font-family:Rye")]
    threads = [("white", "#F5F2EA"), ("gold", "#E2A526"), ("cream", "#E3D5B6"), ("forest", "#1E4630"), ("black", "#1C1C1C"), ("saddle", "#8E6239")]
    sid = "s" if full else "h"
    size = f"""
      <div class="opt"><label class="lab" for="{sid}Size">Letter size</label>
        <input type="range" id="{sid}Size" class="range" min="70" max="125" value="100"></div>""" if full else ""
    return f"""
    <div class="opts">
      <div class="opt"><label class="lab" for="{sid}Letters">Your letters <output data-out="text"></output></label>
        <div class="letters"><input id="{sid}Letters" class="letters-in" maxlength="3" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="{sid}Hint"></div>
        <div class="presets" aria-label="Quick picks">{''.join(f'<button type="button" data-preset="{p}">{p}</button>' for p in ["T", "F", "NY", "LA", "305", "TX", "&"])}</div>
        <p id="{sid}Hint" data-hint style="font-size:13px;margin:0;opacity:.7">Up to 3 letters or numbers. The ampersand works too.</p>
      </div>
      <fieldset class="opt"><legend>Lettering <output data-out="style"></output></legend>
        <div class="seg seg--styles" data-k="style">{''.join(f'<button type="button" data-v="{k}"><b style="{css}">Ab</b><small>{n}</small></button>' for k, n, css in styles)}</div></fieldset>
      <fieldset class="opt"><legend>Thread <output data-out="thread"></output></legend>
        <div class="threads" data-k="thread">{''.join(f'<button type="button" class="thread" data-v="{k}" style="background:{c}" aria-label="{k.title()} thread"></button>' for k, c in threads)}</div></fieldset>
      <fieldset class="opt"><legend>Silhouette <output data-out="type"></output></legend>
        <div class="seg" data-k="type"><button type="button" data-v="cowboy"><b>Cowboy</b><small>Classic Western / $150</small></button><button type="button" data-v="fedora"><b>Fedora</b><small>Wide-brim / $140</small></button></div></fieldset>
      <fieldset class="opt"><legend>Wool <output data-out="color"></output></legend>
        <div class="seg" data-k="color"><button type="button" class="color" data-v="cream"><span class="sw sw--cream"></span><b>Cream</b></button><button type="button" class="color" data-v="brown"><span class="sw sw--brown"></span><b>Brown</b></button></div></fieldset>{size}
      <div class="total"><span>Hat + custom monogram</span><strong data-price>$175.00</strong></div>
      <button type="button" class="btn btn--block" data-addcustom>Add custom hat to cart <span class="arrow">→</span></button>
    </div>"""


def stage():
    return '<div class="stage"><span class="stage__tag" data-tag></span><span class="stage__price" data-price></span></div>'


# ---------------- HOME ----------------
HOME = f"""
  <section class="hero hero--shift">
    <div class="hero__img"><img src="img/hero-noir.webp" alt="Model in a cream Teddy cowboy hat, the brim casting a deep shadow over her eyes, against the Atlantic" fetchpriority="high"></div>
    <div class="wrap hero__content">
      <span class="eyebrow">Campaign 01 / Four cities, one frontier</span>
      <h1 class="display"><span class="row"><span>A new</span></span><span class="row"><span class="serif-i">frontier.</span></span></h1>
      <p class="hero__sub">Western silhouettes, contemporary monograms. 100% wool cowboy hats and fedoras, and now your own letters stitched on the crown.</p>
      <div class="hero__ctas">
        <a class="btn" href="shop.html#hats">Shop hats <span class="arrow">→</span></a>
        <a class="btn btn--ghost" href="studio.html">Design your monogram</a>
      </div>
      <div class="hero__meta"><span>100% wool</span><span>Silk-lined interior</span><span>Custom letters</span></div>
    </div>
    <div class="seal" aria-hidden="true">
      <svg viewBox="0 0 150 150"><defs><path id="circ" d="M75,75 m-58,0 a58,58 0 1,1 116,0 a58,58 0 1,1 -116,0"/></defs><text><textPath href="#circ">Born in Jupiter, Florida ✦ Teddy Headwear ✦ </textPath></text></svg>
      <b>T</b>
    </div>
  </section>

  <section class="section" id="shop">
    <div class="wrap">
      <div class="section-head">
        <div><span class="eyebrow">The hats</span><h2 class="display">Pick your <span class="serif-i">city.</span></h2></div>
        <div><p class="lede" style="margin:0">T for Texas, F for Florida, NY and LA. Every hat has its own page now, so open one up and look closer.</p>
          <a class="btn btn--line" href="shop.html" style="justify-self:start">Shop everything <span class="arrow">→</span></a></div>
      </div>
      <div class="grid" id="grid"></div>
    </div>
  </section>

  <section class="section dark" id="teaser">
    <div class="wrap">
      <div class="section-head" style="margin-bottom:clamp(28px,4vw,48px)">
        <div><span class="eyebrow">New / Monogram Studio</span><h2 class="display">Your letters, <span class="serif-i gold">your hat.</span></h2></div>
        <p class="lede" style="margin:0">Type up to three letters and watch them stitch onto the crown. Pick the lettering, the thread and the wool.</p>
      </div>
      <div style="display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:clamp(24px,4vw,64px);align-items:start" class="teaser-grid">
        {stage()}
        {studio_controls(False)}
      </div>
      <p style="margin-top:28px"><a class="btn btn--ghost" href="studio.html">Open the full studio <span class="arrow">→</span></a></p>
    </div>
  </section>
  <style>@media (max-width: 900px) {{ .teaser-grid {{ grid-template-columns: minmax(0, 1fr) !important; }} }}</style>

  <section class="section black">
    <div class="wrap">
      <div class="section-head">
        <div><span class="eyebrow">Campaign 01</span><h2 class="display">Four cities. <span class="serif-i gold">One frontier.</span></h2></div>
        <a class="btn btn--ghost" href="campaign.html">See the campaign <span class="arrow">→</span></a>
      </div>
      <div class="mosaic">
        <figure class="m-a"><img src="img/scene-jupiter-horse.webp" alt="Rider on horseback in the Jupiter surf, cream F cowboy hat" loading="lazy"><figcaption>Jupiter</figcaption></figure>
        <figure class="m-b"><img src="img/scene-nyc-night.webp" alt="Man under a New York streetlight in the brown NY cowboy hat" loading="lazy"><figcaption>New York</figcaption></figure>
        <figure class="m-c"><img src="img/scene-la-convertible.webp" alt="Woman by a cream convertible in the LA fedora" loading="lazy"><figcaption>Los Angeles</figcaption></figure>
        <figure class="m-d"><img src="img/scene-texas-motel.webp" alt="Man on a pickup outside a Texas motel in the brown T cowboy" loading="lazy"><figcaption>Texas</figcaption></figure>
        <figure class="m-e"><img src="img/noir-life-5.webp" alt="Model holding the brim of a cream NY fedora, eyes in shadow" loading="lazy"><figcaption>Studio</figcaption></figure>
      </div>
    </div>
  </section>

  <section class="section" id="apparel">
    <div class="wrap">
      <div class="section-head">
        <div><span class="eyebrow">The apparel drop</span><h2 class="display">Beyond the <span class="serif-i">brim.</span></h2></div>
        <div><p class="lede" style="margin:0">Tees, fleece, truckers and a gold silk wild rag cut from the same shade as our hat lining.</p>
          <a class="btn btn--line" href="shop.html#apparel" style="justify-self:start">Shop all apparel <span class="arrow">→</span></a></div>
      </div>
      <div class="grid" id="appGrid"></div>
    </div>
  </section>
  <section class="split" aria-label="Apparel looks">
    <a class="tile" href="product-hoodie.html"><img src="img/apparel-hoodie-model.webp" alt="Woman in the forest green Frontier Hoodie and cream cowboy hat" loading="lazy"><span class="tile__price">$95</span>
      <div class="tile__body"><span class="eyebrow">Frontier Hoodie</span><h3 class="display">Gold <span class="serif-i">thread.</span></h3><span class="link">Shop the hoodie <span>→</span></span></div></a>
    <a class="tile" href="product-tee-script.html"><img src="img/apparel-tee-black-model.webp" alt="Man in the black Teddy Script Tee and brown cowboy hat at dusk" loading="lazy"><span class="tile__price">$45</span>
      <div class="tile__body"><span class="eyebrow">Teddy Script Tee</span><h3 class="display">After <span class="serif-i">dark.</span></h3><span class="link">Shop the tee <span>→</span></span></div></a>
  </section>

  <section class="section" id="details">
    <div class="wrap details__grid">
      <div class="hot">
        <img id="hotImg" src="img/detail-interior.webp" alt="Inside a Teddy Headwear hat: gold silk lining and sweatband" loading="lazy">
        <button class="pin" style="left:50%;top:44%" data-i="0" aria-pressed="true" aria-label="Silk lined interior">1</button>
        <button class="pin" style="left:28%;top:56%" data-i="1" aria-pressed="false" aria-label="Adjustable and breathable sweatband">2</button>
      </div>
      <div>
        <span class="eyebrow">The details</span>
        <h2 class="display" style="margin-top:18px">Look <span class="serif-i">inside.</span></h2>
        <ul class="feat" id="feat">
          <li class="open"><button data-i="0"><span class="n">01</span><b>Custom silk lined interior</b><i>+</i></button><p>A gold silk lining that matches our woven label, so the inside of the hat is as finished as the outside.</p></li>
          <li><button data-i="1"><span class="n">02</span><b>Adjustable, breathable sweatband</b><i>+</i></button><p>Dial in the fit and stay comfortable through a full day in the Florida sun.</p></li>
          <li><button data-i="2"><span class="n">03</span><b>Branded exterior woven label</b><i>+</i></button><p>The Teddy script, woven in gold and stitched to the brim.</p></li>
          <li><button data-i="3"><span class="n">04</span><b>Leather band with metal button</b><i>+</i></button><p>A saddle leather hat band finished with a debossed metal button.</p></li>
        </ul>
        <a class="btn btn--felt" href="studio.html">Design yours <span class="arrow">→</span></a>
      </div>
    </div>
  </section>

  <section class="section paper2" id="look">
    <div class="wrap section-head">
      <div><span class="eyebrow">Lookbook</span><h2 class="display">Worn <span class="serif-i">in.</span></h2></div>
      <div class="reel-nav"><button id="reelPrev" aria-label="Previous looks">←</button><button id="reelNext" aria-label="Next looks">→</button></div>
    </div>
    <div class="reel" id="reel">
      {''.join(f'<figure class="shot"><img src="img/{img}.webp" alt="{cap}" loading="lazy"><figcaption><span>{cap}</span><a href="product-{pid}.html">Shop</a></figcaption></figure>' for img, cap, pid in [
          ("noir-life-1", "T Cowboy, cream", "cowboy-t"), ("noir-life-2", "NY Cowboy, brown", "cowboy-ny"), ("noir-life-4", "T Fedora, cream", "fedora-t"),
          ("noir-life-3", "LA Cowboy, brown", "cowboy-la"), ("noir-life-6", "Jupiter, cream cowboy", "cowboy-f"), ("scene-studio-duo", "T Fedora + T Cowboy", "fedora-t"),
          ("noir-life-5", "NY Fedora, cream", "fedora-ny"), ("apparel-hoodie-model", "Frontier Hoodie", "hoodie")])}
    </div>
  </section>

  <section class="section dark" id="list">
    <div class="wrap" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(28px,5vw,80px);align-items:center" id="listGrid">
      <img src="img/apparel-trucker.webp" alt="Green Teddy Trucker with gold oval logo" loading="lazy" style="border-radius:6px;width:100%;max-width:520px;justify-self:center">
      <div>
        <span class="eyebrow">The frontier list</span>
        <h2 class="display h-md" style="margin-top:18px">First in line, <span class="serif-i gold">every drop.</span></h2>
        <p class="lede">Release dates, new colors and first-in-line passes before anyone else.</p>
        <form class="signup" id="signup" novalidate>
          <label for="email" class="sr">Email address</label>
          <input id="email" type="email" placeholder="you@email.com" autocomplete="email" required>
          <button class="btn" type="submit">Join the list <span class="arrow">→</span></button>
        </form>
        <p class="signup-note" id="signupNote" role="status"></p>
      </div>
    </div>
  </section>
  <style>@media (max-width: 900px) {{ #listGrid {{ grid-template-columns: minmax(0, 1fr) !important; }} }}</style>
"""

# ---------------- SHOP ----------------
SHOP = """
  <section class="phero"><div class="wrap" style="display:grid;gap:18px">
    <span class="eyebrow">Shop</span>
    <h1 class="display" style="font-size:clamp(48px,9vw,140px)">The <span class="serif-i gold">line.</span></h1>
    <p class="lede" style="margin:0">Cowboy hats and fedoras in 100% wool, four city monograms, two colors. Plus the apparel drop.</p>
  </div></section>
  <section class="section--tight"><div class="wrap">
    <div class="section-head" style="margin-bottom:28px">
      <div class="filters" role="group" aria-label="Filter products">
        <button class="chip" data-f="all" aria-pressed="true">All</button>
        <button class="chip" data-f="hats" aria-pressed="false">All hats</button>
        <button class="chip" data-f="cowboy" aria-pressed="false">Cowboy <small>$150</small></button>
        <button class="chip" data-f="fedora" aria-pressed="false">Fedora <small>$140</small></button>
        <button class="chip" data-f="apparel" aria-pressed="false">Apparel <small>from $35</small></button>
      </div>
      <span class="mono" id="count" style="font-size:13px;color:var(--muted)"></span>
    </div>
    <div class="grid" id="grid"></div>
  </div></section>
  <section class="split"><a class="tile" href="studio.html"><img src="img/scene-studio-duo.webp" alt="Two models in Teddy hats under a single spotlight" loading="lazy"><span class="tile__price">+$25</span>
    <div class="tile__body"><span class="eyebrow">Monogram Studio</span><h3 class="display">Your <span class="serif-i">letters.</span></h3><p>Put your own initials on the crown of any cowboy hat or fedora.</p><span class="link">Design yours <span>→</span></span></div></a>
    <a class="tile" href="campaign.html"><img src="img/scene-texas-motel.webp" alt="Man outside a Texas motel at dusk in the brown T cowboy hat" loading="lazy">
    <div class="tile__body"><span class="eyebrow">Campaign 01</span><h3 class="display">Four <span class="serif-i">cities.</span></h3><p>Jupiter, New York, Los Angeles and Texas, shot with the brim shadow.</p><span class="link">See the campaign <span>→</span></span></div></a></section>
"""

# ---------------- STUDIO ----------------
STUDIO = f"""
  <section class="phero" style="padding-bottom:0"><div class="wrap" style="display:grid;gap:18px;padding-bottom:40px">
    <span class="eyebrow">Monogram Studio</span>
    <h1 class="display" style="font-size:clamp(48px,9vw,140px)">Make your <span class="serif-i gold">mark.</span></h1>
    <p class="lede" style="margin:0">Your letters, embroidered on the crown of a 100% wool cowboy hat or fedora. What you see here is what we stitch.</p>
  </div></section>
  <section class="section--tight" id="studio">
    <div class="wrap" style="display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:clamp(24px,4vw,64px);align-items:start" id="studioGrid">
      <div style="position:sticky;top:96px;display:grid;gap:14px" id="stageCol">
        {stage()}
        <dl class="mono" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0;font-size:12px">
          <div><dt style="opacity:.6">Letters</dt><dd style="margin:0" id="sumText"></dd></div>
          <div><dt style="opacity:.6">Lettering</dt><dd style="margin:0" id="sumStyle"></dd></div>
          <div><dt style="opacity:.6">Thread</dt><dd style="margin:0" id="sumThread"></dd></div>
          <div><dt style="opacity:.6">Hat</dt><dd style="margin:0" id="sumHat"></dd></div>
        </dl>
      </div>
      <div style="display:grid;gap:24px">
        {studio_controls(True)}
        <p style="margin:0;font-size:13px;color:var(--muted)">Hat <span id="sumBase" class="mono"></span> + custom monogram <span class="mono">$25.00</span>. Every hat keeps the silk lining, adjustable sweatband, woven label and leather band.</p>
      </div>
    </div>
  </section>
  <style>@media (max-width: 900px) {{ #studioGrid {{ grid-template-columns: minmax(0, 1fr) !important; }} #stageCol {{ position: static !important; }} }}</style>
  <section class="section dark">
    <div class="wrap">
      <div class="section-head"><div><span class="eyebrow">How it works</span><h2 class="display h-md">Three steps to <span class="serif-i gold">yours.</span></h2></div></div>
      <ol style="list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px">
        <li style="border-top:1px solid var(--line-light);padding-top:20px;display:grid;gap:8px"><span class="mono gold">01</span><b style="font-size:22px">Type your letters</b><span style="color:var(--on-dark)">Up to three letters or numbers. Initials, an area code, a brand of your own.</span></li>
        <li style="border-top:1px solid var(--line-light);padding-top:20px;display:grid;gap:8px"><span class="mono gold">02</span><b style="font-size:22px">Pick lettering and thread</b><span style="color:var(--on-dark)">Script, Varsity, Serif or Western, in six thread colors.</span></li>
        <li style="border-top:1px solid var(--line-light);padding-top:20px;display:grid;gap:8px"><span class="mono gold">03</span><b style="font-size:22px">We stitch it</b><span style="color:var(--on-dark)">Your monogram is embroidered on the crown of a cream or brown wool hat.</span></li>
      </ol>
    </div>
  </section>
  <section class="section"><div class="wrap">
    <div class="section-head"><div><span class="eyebrow">Ideas</span><h2 class="display h-md">Start from <span class="serif-i">one of these.</span></h2></div></div>
    <div class="grid" id="examples"></div>
  </div></section>
"""

# ---------------- CAMPAIGN ----------------
def chapter(n, city, title, img, alt, copy, shop, pair):
    pair_html = "".join(f'<figure><img src="img/{i}.webp" alt="{a}" loading="lazy"><figcaption><span>{a}</span><a href="product-{p}.html">Shop →</a></figcaption></figure>' for i, a, p in pair)
    return f"""
  <section class="chapter" id="{city.lower().replace(' ', '-')}">
    <img src="img/{img}.webp" alt="{alt}" loading="lazy">
    <div class="wrap chapter__body">
      <span class="chapter__num" aria-hidden="true">{n}</span>
      <span class="eyebrow">{city}</span>
      <h2 class="display">{title}</h2>
      <p class="lede" style="margin:0">{copy}</p>
      <div class="row"><a class="btn" href="product-{shop[0]}.html">{shop[1]} <span class="arrow">→</span></a><a class="btn btn--ghost" href="studio.html">Design your own</a></div>
    </div>
  </section>
  <section class="section--tight black"><div class="wrap pair">{pair_html}</div></section>"""


CAMPAIGN = """
  <section class="hero">
    <div class="hero__img"><img src="img/noir-cowboy-model.webp" alt="Cream F cowboy hat, the wearer's eyes lost in the brim's shadow" fetchpriority="high"></div>
    <div class="wrap hero__content">
      <span class="eyebrow">Campaign 01</span>
      <h1 class="display"><span class="row"><span>Four cities.</span></span><span class="row"><span class="serif-i">One frontier.</span></span></h1>
      <p class="hero__sub">Every Teddy monogram is a place. We took each one home and shot it the same way: one hard light, and the brim doing the rest.</p>
      <div class="hero__ctas"><a class="btn" href="#jupiter">Start in Jupiter <span class="arrow">↓</span></a><a class="btn btn--ghost" href="shop.html#hats">Shop hats</a></div>
    </div>
  </section>""" + chapter("F", "Jupiter", 'Home <span class="serif-i gold">water.</span>', "scene-jupiter-horse", "Rider in the Jupiter surf at golden hour wearing the cream F cowboy hat",
                        "Where Teddy started. Low sun across the inlet, salt on the brim and the lighthouse behind.", ("cowboy-f", "Shop the F Cowboy"),
                        [("noir-life-6", "Jupiter, cream cowboy", "cowboy-f"), ("noir-life-1", "T Cowboy, cream", "cowboy-t")]) \
    + chapter("NY", "New York", 'City <span class="serif-i gold">brim.</span>', "scene-nyc-night", "Man on a wet New York street at night in the brown NY cowboy hat",
              "A Western shape downtown. Sodium light, wet asphalt and a brim that holds its line.", ("cowboy-ny", "Shop the NY Cowboy"),
              [("noir-life-2", "NY Cowboy, brown", "cowboy-ny"), ("noir-life-5", "NY Fedora, cream", "fedora-ny")]) \
    + chapter("LA", "Los Angeles", 'Noon <span class="serif-i gold">shadow.</span>', "scene-la-convertible", "Woman by a vintage convertible on a palm-lined LA street in the cream LA fedora",
              "Palm shadows on chrome and a wide brim for hard light.", ("fedora-la", "Shop the LA Fedora"),
              [("noir-life-3", "LA Cowboy, brown", "cowboy-la"), ("life-7", "LA Fedora, cream", "fedora-la")]) \
    + chapter("T", "Texas", 'The <span class="serif-i gold">original.</span>', "scene-texas-motel", "Man on a pickup outside a Texas roadside motel at dusk in the brown T cowboy hat",
              "Where the cowboy hat got its shape. Dusk on the highway and neon coming on.", ("cowboy-t", "Shop the T Cowboy"),
              [("scene-studio-duo", "T Fedora + T Cowboy", "fedora-t"), ("noir-life-4", "T Fedora, cream", "fedora-t")]) + """
  <section class="section dark"><div class="wrap" style="display:grid;gap:22px;justify-items:start">
    <span class="eyebrow">Your city isn't here?</span>
    <h2 class="display">Stitch <span class="serif-i gold">your own.</span></h2>
    <p class="lede" style="margin:0">Put any letters on the crown in the Monogram Studio: initials, an area code, your town.</p>
    <a class="btn" href="studio.html">Open the Monogram Studio <span class="arrow">→</span></a>
  </div></section>"""


def product_page(p):
    ld = {"@context": "https://schema.org", "@type": "Product", "name": p["name"], "brand": {"@type": "Brand", "name": "Teddy Headwear"},
          "description": p["desc"], "image": p["img"], "offers": {"@type": "Offer", "priceCurrency": "USD", "price": f'{p["price"]}.00'}}
    page(f'product-{p["id"]}.html', f'{p["name"]} | Teddy Headwear', p["desc"], f'data-page="product" data-id="{p["id"]}"',
         '<div class="wrap" id="pdp"></div>\n<div id="after"></div>',
         extra_head=f'\n<script type="application/ld+json">{json.dumps(ld)}</script>',
         after_main=f'<div class="mbar" id="mbar"><span id="mbarTxt">{p["name"]}</span><button class="btn btn--sm" id="mbarBtn">Add to cart</button></div>\n')


if __name__ == "__main__":
    page("index.html", "Teddy Headwear Redesign", "Teddy Headwear: Western silhouettes, contemporary monograms. 100% wool cowboy hats and fedoras, custom letters and apparel, born in Jupiter, Florida.",
         'class="has-hero" data-page="home"', HOME)
    page("shop.html", "Shop | Teddy Headwear", "Shop Teddy Headwear cowboy hats, fedoras and apparel.", 'data-page="shop"', SHOP)
    page("studio.html", "Monogram Studio | Teddy Headwear", "Design a custom monogram for your Teddy Headwear cowboy hat or fedora.", 'data-page="studio"', STUDIO)
    page("campaign.html", "Campaign 01 | Teddy Headwear", "A New Frontier: four cities, one frontier. Teddy Headwear Campaign 01.", 'class="has-hero" data-page="campaign"', CAMPAIGN)
    for p in HATS + APPAREL:
        product_page(p)
    print("built", 4 + len(HATS) + len(APPAREL), "pages")
