/* Teddy Headwear: shared script for every page (data, chrome, cart, monogram engine, page logic). */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const money = n => `$${n.toFixed(2)}`;
  const tc = s => s[0].toUpperCase() + s.slice(1);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================= THE BEAR (Teddy's mascot, redrawn from the favicon) ================= */
  const BEAR = `<svg viewBox="0 0 220 220" aria-hidden="true" class="bear-svg">
    <g stroke="#0B1912" stroke-linejoin="round" stroke-linecap="round">
      <circle cx="62" cy="96" r="21" fill="#EFE6D2" stroke-width="5"/><circle cx="62" cy="96" r="9.5" fill="#C9A77C" stroke="none"/>
      <circle cx="158" cy="96" r="21" fill="#EFE6D2" stroke-width="5"/><circle cx="158" cy="96" r="9.5" fill="#C9A77C" stroke="none"/>
      <ellipse cx="110" cy="130" rx="58" ry="53" fill="#EFE6D2" stroke-width="5"/>
      <ellipse cx="76" cy="146" rx="9" ry="5" fill="#D98C7A" opacity=".45" stroke="none"/><ellipse cx="144" cy="146" rx="9" ry="5" fill="#D98C7A" opacity=".45" stroke="none"/>
      <g class="bear-eyes" stroke="none"><ellipse cx="88" cy="126" rx="5.5" ry="6.5" fill="#0B1912"/><ellipse cx="132" cy="126" rx="5.5" ry="6.5" fill="#0B1912"/><circle cx="90" cy="123.5" r="1.6" fill="#fff"/><circle cx="134" cy="123.5" r="1.6" fill="#fff"/></g>
      <ellipse cx="110" cy="149" rx="25" ry="19" fill="#F8F2E4" stroke-width="3.5"/>
      <path d="M100.5 140 Q110 134.5 119.5 140 Q117.5 149 110 150 Q102.5 149 100.5 140Z" fill="#0B1912" stroke="none"/>
      <path d="M110 150 V156 M102 157.5 Q110 164 118 157.5" fill="none" stroke-width="3.5"/>
      <g transform="translate(110 189)"><path d="M0 0 L-25 -12 Q-29 0 -25 12 Z M0 0 L25 -12 Q29 0 25 12 Z" fill="#1E4630" stroke-width="4"/><path d="M-19 -6 L-19 6 M19 -6 L19 6" stroke="#D9A23B" stroke-width="2.5"/><circle r="6.5" fill="#D9A23B" stroke-width="3.5"/></g>
      <g class="bear-hat">
        <path d="M63 101 Q60 54 79 41 Q93 34 101 47 Q110 38 119 47 Q127 34 141 41 Q160 54 157 101 Z" fill="#1E4630" stroke-width="5"/>
        <path d="M85 50 Q95 44 101 52" fill="none" stroke="#2D6145" stroke-width="3"/>
        <path d="M64 87 Q110 96 156 87 L157 99 Q110 108 63 99 Z" fill="#D9A23B" stroke-width="3.5"/>
        <path d="M12 94 Q34 108 110 104 Q186 108 208 94 Q199 117 110 120 Q21 117 12 94 Z" fill="#17392A" stroke-width="5"/>
        <text x="110" y="78" text-anchor="middle" font-family="Yellowtail, cursive" font-size="30" fill="#EFE6D2" stroke="none">T</text>
      </g>
    </g></svg>`;
  const bearMark = (cls = "") => `<span class="bear-mark ${cls}">${BEAR}</span>`;

  /* ================= DATA ================= */
  const CITY = {
    t: { mono: "T", place: "Texas", line: "The original.", story: "T is for Texas, where the cowboy hat earned its shape. Our T monogram is a nod to the source: wide brim, pinched crown and a script letter stitched like a brand." },
    f: { mono: "F", place: "Florida", line: "Home water.", story: "F is for Florida. Teddy was born in Jupiter, where hard sun and salt air meet. The F monogram is the one we wear on the sand." },
    ny: { mono: "NY", place: "New York", line: "City brim.", story: "NY takes a Western shape downtown. Wet streets, night light and a brim that holds its line in a crowd." },
    la: { mono: "LA", place: "Los Angeles", line: "West Coast light.", story: "LA is palm shadows at noon and the long drive out of town. A wide brim for hard light, with the city in script on the crown." }
  };
  const HAT_PRICE = { cowboy: 150, fedora: 140 };
  const CUSTOM_FEE = 25;
  const LOOKS = {
    "cowboy-t": ["noir-life-1", "scene-texas-motel", "scene-studio-duo"],
    "cowboy-f": ["hero-noir", "noir-cowboy-model", "scene-jupiter-horse"],
    "cowboy-ny": ["noir-life-2", "scene-nyc-night"],
    "cowboy-la": ["noir-life-3"],
    "fedora-t": ["noir-life-4", "scene-studio-duo"],
    "fedora-f": ["noir-life-6"],
    "fedora-ny": ["noir-life-5"],
    "fedora-la": ["scene-la-convertible", "life-7"]
  };
  const HATS = [];
  ["cowboy", "fedora"].forEach(type => ["t", "f", "ny", "la"].forEach(m => HATS.push({
    id: `${type}-${m}`, kind: "hat", type, mono: m, price: HAT_PRICE[type],
    name: `${CITY[m].mono} ${type === "cowboy" ? "Cowboy" : "Fedora"} Hat`,
    place: CITY[m].place,
    colors: ["cream", "brown"],
    desc: type === "cowboy"
      ? `A classic Western cowboy hat in 100% wool felt, with the ${CITY[m].place} ${CITY[m].mono} monogram embroidered on the crown in original Teddy artwork.`
      : `A traditional wide-brim fedora in 100% wool felt, finished with the ${CITY[m].place} ${CITY[m].mono} monogram embroidered on the crown.`
  })));
  const APPAREL = [
    { id: "tee-script", name: "Teddy Script Tee", price: 45, color: "Faded black", img: ["apparel-tee-black", "apparel-tee-black-model"], sizes: ["S", "M", "L", "XL", "XXL"], desc: "Heavyweight boxy tee in faded black cotton with the oversized gold script T across the chest." },
    { id: "tee-monogram", name: "Monogram Tee", price: 45, color: "Bone", img: ["apparel-tee-bone"], sizes: ["S", "M", "L", "XL", "XXL"], desc: "Garment-dyed bone cotton tee with the Teddy Headwear script printed in forest green." },
    { id: "hoodie", name: "Frontier Hoodie", price: 95, color: "Forest green", img: ["apparel-hoodie", "apparel-hoodie-model"], sizes: ["S", "M", "L", "XL", "XXL"], desc: "Heavyweight forest green fleece hoodie with the Teddy script embroidered across the chest in gold thread, the same gold as our silk lining." },
    { id: "crew", name: "Saddle Crewneck", price: 85, color: "Saddle brown", img: ["apparel-crew"], sizes: ["S", "M", "L", "XL", "XXL"], desc: "Saddle brown fleece crewneck, the color of our leather hat band, with a cream script T embroidered on the chest." },
    { id: "trucker", name: "Teddy Trucker", price: 40, color: "Forest / gold", img: ["apparel-trucker"], sizes: ["One size"], desc: "Forest green mesh trucker with the gold Teddy Headwear oval embroidered on the front. Snap closure." },
    { id: "cord", name: "Corduroy Trucker", price: 45, color: "Cream cord", img: ["apparel-cord"], sizes: ["One size"], desc: "Wide-wale cream corduroy front with a mesh back and the gold Teddy oval embroidered on the crown." },
    { id: "rag", name: "Silk Wild Rag", price: 55, color: "Silk gold", img: ["apparel-rag"], sizes: ["One size"], desc: "A gold silk wild rag cut from the same shade as our hat lining, with a tone-on-tone paisley and a small script T in the corner." },
    { id: "tote", name: "Canvas Tote", price: 35, color: "Bone canvas", img: ["apparel-tote"], sizes: ["One size"], desc: "Heavy bone canvas tote with saddle leather handles and the Teddy script in forest green." },
    { id: "bear-pin", name: "Bear Hat Pin", price: 20, color: "Gold + enamel", img: ["acc-bear-pin"], sizes: ["One size"], desc: "The Teddy bear in hard enamel and polished gold, made to ride on the band or brim of your hat." },
    { id: "bear-patch", name: "Bear Patch", price: 15, color: "Embroidered", img: ["acc-bear-patch"], sizes: ["One size"], desc: "The Teddy bear, densely embroidered with a raised gold border. Iron it on a jacket, a tote or a cap." }
  ].map(a => ({ ...a, kind: "apparel" }));
  const ALL = [...HATS, ...APPAREL];
  const byId = id => ALL.find(p => p.id === id);
  const hatImg = (id, color) => `img/${id}-${color}.webp`;
  const blankImg = (type, color) => `img/blank-${type}-${color}.webp`;
  const productUrl = id => `product-${id}.html`;
  const thumbOf = (p, variant) => p.kind === "hat" ? hatImg(p.id, variant || "cream") : `img/${p.img[0]}.webp`;

  /* ================= MONOGRAM ENGINE ================= */
  const STYLES = {
    script: { label: "Script", family: "Yellowtail", weight: 400, italic: false, base: 168 },
    varsity: { label: "Varsity", family: "Graduate", weight: 400, italic: false, base: 116 },
    serif: { label: "Serif", family: "Bodoni Moda", weight: 600, italic: true, base: 152 },
    western: { label: "Western", family: "Rye", weight: 400, italic: false, base: 112 }
  };
  const THREADS = {
    white: { label: "White", hex: "#F5F2EA" }, gold: { label: "Gold", hex: "#E2A526" }, cream: { label: "Cream", hex: "#E3D5B6" },
    forest: { label: "Forest", hex: "#1E4630" }, black: { label: "Black", hex: "#1C1C1C" }, saddle: { label: "Saddle", hex: "#8E6239" }
  };
  // Crown center and usable width, in the 1000x1000 space of each blank hat photo.
  const CROWN = {
    "cowboy-cream": { cx: 497, cy: 532, w: 205, rot: -1.5 }, "cowboy-brown": { cx: 488, cy: 520, w: 205, rot: -1.5 },
    "fedora-cream": { cx: 486, cy: 590, w: 225, rot: 0 }, "fedora-brown": { cx: 500, cy: 596, w: 225, rot: 0 }
  };
  const shade = (hex, amt) => {
    const n = parseInt(hex.slice(1), 16);
    const f = c => Math.max(0, Math.min(255, Math.round(c + (amt < 0 ? c : 255 - c) * amt)));
    return "#" + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(v => v.toString(16).padStart(2, "0")).join("");
  };
  let monoSeq = 0;
  function cleanLetters(s) { return (s || "").toUpperCase().replace(/[^A-Z0-9&.]/g, "").slice(0, 3); }
  function monogramSVG(o) {
    const k = ++monoSeq, st = STYLES[o.style] || STYLES.script, th = (THREADS[o.thread] || THREADS.white).hex;
    const g = CROWN[`${o.type}-${o.color}`], text = cleanLetters(o.text);
    const n = Math.max(1, text.length), fs = st.base * [1, .8, .64][n - 1] * (o.scale || 1);
    return `<svg class="mono-layer" viewBox="0 0 1000 1000" aria-hidden="true" data-maxw="${g.w * (o.scale || 1)}">
      <defs>
        <pattern id="sat${k}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(${o.style === "varsity" ? 0 : 38})">
          <rect width="5" height="5" fill="${th}"/><rect width="1.4" height="5" fill="${shade(th, -.22)}"/><rect x="2.6" width=".8" height="5" fill="${shade(th, .25)}"/>
        </pattern>
        <filter id="emb${k}" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="4" result="n"/>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="d"/>
          <feGaussianBlur in="d" stdDeviation="1.5" result="b"/>
          <feSpecularLighting in="b" surfaceScale="2.6" specularConstant=".55" specularExponent="16" lighting-color="#ffffff" result="sp"><feDistantLight azimuth="225" elevation="48"/></feSpecularLighting>
          <feComposite in="sp" in2="d" operator="in" result="sp2"/>
          <feComposite in="d" in2="sp2" operator="arithmetic" k1="0" k2="1" k3=".55" k4="0" result="lit"/>
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.4" result="sb"/>
          <feOffset in="sb" dx="1.5" dy="3" result="so"/>
          <feFlood flood-color="#000" flood-opacity=".4"/>
          <feComposite in2="so" operator="in" result="sh"/>
          <feMerge><feMergeNode in="sh"/><feMergeNode in="lit"/></feMerge>
        </filter>
      </defs>
      <text x="${g.cx}" y="${g.cy}" text-anchor="middle" dominant-baseline="central" transform="rotate(${g.rot} ${g.cx} ${g.cy})"
        font-family="'${st.family}', serif" font-weight="${st.weight}" font-style="${st.italic ? "italic" : "normal"}" font-size="${fs.toFixed(1)}"
        letter-spacing="${o.style === "script" ? 0 : 4}" fill="url(#sat${k})" stroke="${shade(th, -.35)}" stroke-width="2.2" paint-order="stroke"
        filter="url(#emb${k})">${esc(text)}</text>
    </svg>`;
  }
  // Shrink letters that run past the crown once fonts are ready.
  function fitMono(root) {
    const svg = root.querySelector("svg.mono-layer"); if (!svg) return;
    const t = svg.querySelector("text"), maxw = +svg.dataset.maxw;
    try {
      const w = t.getComputedTextLength();
      if (w > maxw) t.setAttribute("font-size", (parseFloat(t.getAttribute("font-size")) * maxw / w).toFixed(1));
    } catch (_) {}
  }
  function paintStage(stage, o) {
    const src = blankImg(o.type, o.color);
    let img = stage.querySelector(":scope > img");
    if (!img) { img = new Image(); img.alt = ""; stage.prepend(img); }
    if (!img.src.endsWith(src)) img.src = src;
    img.alt = `${tc(o.color)} ${o.type} hat with custom "${cleanLetters(o.text)}" monogram`;
    stage.querySelector("svg.mono-layer")?.remove();
    img.insertAdjacentHTML("afterend", monogramSVG(o));
    fitMono(stage);
    (document.fonts?.ready || Promise.resolve()).then(() => fitMono(stage));
  }

  /* ================= CART ================= */
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem("teddy-cart-v2") || "[]"); } catch (_) { cart = []; }
  const save = () => { try { localStorage.setItem("teddy-cart-v2", JSON.stringify(cart)); } catch (_) {} };
  const linePrice = l => byId(l.id).price + (l.custom ? CUSTOM_FEE : 0);
  function add(id, variant, qty = 1, custom = null) {
    const key = JSON.stringify([id, variant, custom]);
    const hit = cart.find(l => l.key === key);
    hit ? hit.qty += qty : cart.push({ key, id, variant, qty, custom });
    save(); renderCart();
    const p = byId(id), cnt = $("#cartCount");
    if (cnt) { cnt.classList.remove("bump"); void cnt.offsetWidth; cnt.classList.add("bump"); }
    const label = custom ? `Custom "${custom.text}" ${p.type}` : `${p.name}${p.kind === "hat" ? ", " + variant : variant && variant !== "One size" ? ", " + variant : ""}`;
    toast(custom ? blankImg(p.type, variant) : thumbOf(p, variant), `${label} added`);
    peek();
  }
  let pt;
  function peek() {
    const el = $("#peek"); if (!el) return;
    const lines = ["Good pick.", "Looks sharp.", "Yeehaw.", "Fine choice.", "Now that's a hat."];
    $(".peek__say", el).textContent = lines[Math.floor(Math.random() * lines.length)];
    el.classList.remove("on"); void el.offsetWidth; el.classList.add("on");
    clearTimeout(pt); pt = setTimeout(() => el.classList.remove("on"), 2600);
  }
  function lineThumb(l) {
    const p = byId(l.id);
    if (l.custom) {
      const th = THREADS[l.custom.thread].hex, st = STYLES[l.custom.style];
      return `<div class="line__img custom"><img src="${blankImg(p.type, l.variant)}" alt=""><b style="color:${th};font-family:'${st.family}';${st.italic ? "font-style:italic;" : ""}">${esc(l.custom.text)}</b></div>`;
    }
    return `<div class="line__img"><img src="${thumbOf(p, l.variant)}" alt=""></div>`;
  }
  function renderCart() {
    const n = cart.reduce((s, l) => s + l.qty, 0);
    if ($("#cartCount")) $("#cartCount").textContent = n;
    const box = $("#items"); if (!box) return;
    $("#subtotal").textContent = money(cart.reduce((s, l) => s + l.qty * linePrice(l), 0));
    $("#cartFoot").hidden = !n;
    if (!n) {
      box.innerHTML = `<div class="empty">${bearMark()}<b>Nothing here yet.</b><span>Every hat starts with a monogram.</span><a class="btn btn--felt" href="studio.html">Design yours</a></div>`;
      return;
    }
    const hasHat = cart.some(l => byId(l.id).kind === "hat"), hasApp = cart.some(l => byId(l.id).kind === "apparel");
    const up = hasHat && !hasApp ? APPAREL[2] : (!hasHat ? HATS[1] : null);
    box.innerHTML = cart.map((l, i) => {
      const p = byId(l.id);
      const sub = l.custom ? `${tc(l.variant)} / "${esc(l.custom.text)}" ${STYLES[l.custom.style].label}, ${THREADS[l.custom.thread].label} thread`
        : p.kind === "hat" ? `${p.place} / ${l.variant}` : `${p.color}${l.variant ? " / " + l.variant : ""}`;
      return `<div class="line">${lineThumb(l)}
        <div><b class="nm">${l.custom ? "Custom " + (p.type === "cowboy" ? "Cowboy" : "Fedora") : p.name}</b><small>${sub}</small>
          <span class="qty"><button data-q="${i}" data-d="-1" aria-label="Decrease">−</button><span>${l.qty}</span><button data-q="${i}" data-d="1" aria-label="Increase">+</button></span></div>
        <div class="line__price">${money(linePrice(l) * l.qty)}<button data-rm="${i}">Remove</button></div></div>`;
    }).join("") + (up ? `<div class="upsell"><img src="${thumbOf(up, "brown")}" alt=""><div><b style="font-size:14px">${up.kind === "apparel" ? "Complete the look" : "Add a hat"}</b><small>${up.name} / $${up.price}</small></div><button data-up="${up.id}">Add</button></div>` : "");
  }
  function openCart() { $("#drawer").classList.add("on"); $("#scrim").classList.add("on"); $("#drawer").setAttribute("aria-hidden", "false"); hideToast(); }
  function closeCart() { $("#drawer")?.classList.remove("on"); $("#scrim")?.classList.remove("on"); $("#drawer")?.setAttribute("aria-hidden", "true"); }
  let tt;
  function toast(src, txt) { $("#toastImg").src = src; $("#toastTxt").textContent = txt; $("#toast").classList.add("on"); clearTimeout(tt); tt = setTimeout(hideToast, 3600); }
  function hideToast() { $("#toast")?.classList.remove("on"); }

  /* ================= CHROME ================= */
  const page = document.body.dataset.page;
  const NAV = [["shop.html", "Shop", "shop"], ["studio.html", "Monogram Studio", "studio", "nav-hot"], ["shop.html#apparel", "Apparel", "apparel"], ["campaign.html", "Campaign", "campaign"], ["./#details", "Details", "details"]];
  function chrome() {
    const top = $("#chrome-top"), bottom = $("#chrome-bottom");
    if (top) top.outerHTML = `
      <div class="ticker" aria-label="Announcements"><div class="ticker__track">${[0, 1].map(i => `
        <span>New: the Monogram Studio. <a href="studio.html"${i ? ' tabindex="-1"' : ""}>Put your own letters on the crown</a></span>
        <span>The apparel drop is here. <a href="shop.html#apparel"${i ? ' tabindex="-1"' : ""}>Shop tees, hoodies and truckers</a></span>
        <span>100% wool. Silk lined. Original embroidered artwork</span><span>Born in Jupiter, Florida</span>`).join("")}
      </div></div>
      <header class="hdr${document.body.classList.contains("has-hero") ? "" : " hdr--solid"}" id="hdr">
        <div class="wrap hdr__in">
          <a class="hdr__logo" href="./" aria-label="Teddy Headwear home">${bearMark()}<img src="img/logo.webp" alt="Teddy Headwear" width="450" height="84"></a>
          <nav id="nav" aria-label="Main">${NAV.map(([h, t, k, c]) => `<a href="${h}" class="${c || ""}"${k === page ? ' aria-current="page"' : ""}>${t}</a>`).join("")}</nav>
          <div class="hdr__actions">
            <button class="cart-btn" id="cartOpen" aria-label="Open cart">Cart <span class="cart-count" id="cartCount">0</span></button>
            <button class="menu-btn" id="menuBtn" aria-label="Menu" aria-expanded="false"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 8h18M3 16h18"/></svg></button>
          </div>
        </div>
      </header>`;
    if (bottom) bottom.outerHTML = `
      <section class="wordmark" aria-label="Follow Teddy Headwear">
        <div class="wrap wordmark__cta">
          <div style="display:grid;gap:14px"><span class="eyebrow">@TeddyHeadwear</span>
            <p style="margin:0;font-size:clamp(20px,2.4vw,30px);font-weight:600;line-height:1.25;max-width:30ch">Follow along for drops, shoots and where the hats end up next.</p></div>
          <a class="btn btn--felt" href="https://www.instagram.com/teddyheadwear/" target="_blank" rel="noopener">Follow on Instagram <span class="arrow">↗</span></a>
        </div>
        <p class="wordmark__big" aria-hidden="true">Teddy<span class="wordmark__bear">${BEAR}</span></p>
      </section>
      <footer class="ft"><div class="wrap">
        <div class="foot">
          <div><img src="img/logo.webp" alt="Teddy Headwear" width="200" height="37" style="height:32px;width:auto"><p>Western silhouettes and contemporary designs, blended into something original. Born in Jupiter, Florida.</p></div>
          <div><h4>Shop</h4><ul><li><a href="shop.html#cowboy">Cowboy hats</a></li><li><a href="shop.html#fedora">Fedoras</a></li><li><a href="studio.html">Monogram Studio</a></li><li><a href="shop.html#apparel">Apparel</a></li></ul></div>
          <div><h4>Brand</h4><ul><li><a href="campaign.html">Campaign 01</a></li><li><a href="./#details">Hat details</a></li><li><a href="https://teddyheadwear.com/pages/faq" target="_blank" rel="noopener">FAQ</a></li></ul></div>
          <div><h4>Follow</h4><ul><li><a href="https://www.instagram.com/teddyheadwear/" target="_blank" rel="noopener">Instagram</a></li><li><a href="./#list">Newsletter</a></li></ul></div>
        </div>
        <div class="foot__base"><span>© Teddy Headwear</span><span>Jupiter, Florida</span></div>
      </div></footer>
      <div class="scrim" id="scrim"></div>
      <aside class="drawer" id="drawer" aria-label="Cart" aria-hidden="true">
        <div class="drawer__head"><h3 class="display" style="font-size:24px">Your cart</h3><button class="x" id="cartClose" aria-label="Close cart">✕</button></div>
        <div class="drawer__items" id="items"></div>
        <div class="drawer__foot" id="cartFoot">
          <div class="sum"><span>Subtotal</span><strong id="subtotal">$0.00</strong></div>
          <button class="btn btn--block" id="checkout">Checkout <span class="arrow">→</span></button>
          <p class="drawer__note" id="checkoutNote">Shipping and taxes calculated at checkout.</p>
        </div>
      </aside>
      <div class="toast" id="toast" role="status" aria-live="polite"><img id="toastImg" src="img/cowboy-t-cream.webp" alt=""><span id="toastTxt">Added</span><button id="toastView">View cart</button></div>
      <div class="peek" id="peek" aria-hidden="true">${BEAR}<span class="peek__say">Good pick.</span></div>
      ${fine && !calm ? '<div class="cursor" id="cursor"><b>VIEW</b></div>' : ""}`;

    const hdr = $("#hdr");
    if (document.body.classList.contains("has-hero")) {
      const onScroll = () => hdr.classList.toggle("is-solid", scrollY > 40);
      addEventListener("scroll", onScroll, { passive: true }); onScroll();
    }
    $("#menuBtn").addEventListener("click", () => { const o = hdr.classList.toggle("menu-open"); $("#menuBtn").setAttribute("aria-expanded", o); });
    $("#nav").addEventListener("click", e => { if (e.target.closest("a")) hdr.classList.remove("menu-open"); });
    $("#cartOpen").addEventListener("click", openCart);
    $("#cartClose").addEventListener("click", closeCart);
    $("#scrim").addEventListener("click", closeCart);
    $("#toastView").addEventListener("click", openCart);
    addEventListener("keydown", e => { if (e.key === "Escape") closeCart(); });
    $("#items").addEventListener("click", e => {
      const q = e.target.closest("[data-q]"), rm = e.target.closest("[data-rm]"), up = e.target.closest("[data-up]");
      if (up) { const p = byId(up.dataset.up); add(p.id, p.kind === "hat" ? "brown" : p.sizes[Math.min(1, p.sizes.length - 1)]); hideToast(); return; }
      if (q) { const l = cart[+q.dataset.q]; l.qty += +q.dataset.d; if (l.qty < 1) cart.splice(+q.dataset.q, 1); }
      if (rm) cart.splice(+rm.dataset.rm, 1);
      save(); renderCart();
    });
    $("#checkout").addEventListener("click", () => { $("#checkoutNote").textContent = "Design preview: checkout hands off to the Shopify cart at launch."; });
    renderCart();
  }

  /* ================= SHARED UI ================= */
  const defaultColor = {};
  function hatCard(p) {
    const c = defaultColor[p.id] || (p.mono === "t" || p.mono === "ny" ? "brown" : "cream");
    defaultColor[p.id] = c;
    const o = c === "cream" ? "brown" : "cream";
    return `<article class="card" data-id="${p.id}">
      <a class="card__media" href="${productUrl(p.id)}" aria-label="${p.name}">
        <span class="badge">${p.type}</span>
        <img class="main" src="${hatImg(p.id, c)}" alt="${p.name} in ${c} wool" loading="lazy">
        <img class="alt" src="${hatImg(p.id, o)}" alt="" loading="lazy">
      </a>
      <div class="card__info"><div><h3 class="card__name"><a href="${productUrl(p.id)}">${p.name}</a></h3><p class="card__place">${p.place} monogram</p></div><span class="card__price">$${p.price}</span></div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <div class="swatches" role="group" aria-label="Color">
          <button class="sw sw--cream" data-color="cream" aria-pressed="${c === "cream"}" aria-label="Cream"></button>
          <button class="sw sw--brown" data-color="brown" aria-pressed="${c === "brown"}" aria-label="Brown"></button>
        </div>
        <button class="btn btn--line btn--sm" data-add="${p.id}">Add</button>
      </div>
    </article>`;
  }
  function appCard(p) {
    return `<article class="card" data-id="${p.id}">
      <a class="card__media" href="${productUrl(p.id)}" aria-label="${p.name}">
        <span class="badge badge--gold">Apparel drop</span>
        <img class="main" src="img/${p.img[0]}.webp" alt="${p.name}" loading="lazy">
        ${p.img[1] ? `<img class="alt" src="img/${p.img[1]}.webp" alt="" loading="lazy">` : ""}
      </a>
      <div class="card__info"><div><h3 class="card__name"><a href="${productUrl(p.id)}">${p.name}</a></h3><p class="card__place">${p.color}</p></div><span class="card__price">$${p.price}</span></div>
      <a class="btn btn--line btn--sm" href="${productUrl(p.id)}" style="justify-self:start">${p.sizes.length > 1 ? "Choose size" : "View"}</a>
    </article>`;
  }
  function wireGrid(grid) {
    grid.addEventListener("click", e => {
      const sw = e.target.closest("[data-color]");
      if (sw) { const el = sw.closest(".card"); defaultColor[el.dataset.id] = sw.dataset.color; el.outerHTML = hatCard(byId(el.dataset.id)); return; }
      const a = e.target.closest("[data-add]");
      if (a) add(a.dataset.add, defaultColor[a.dataset.add]);
    });
  }
  function signup() {
    const f = $("#signup"); if (!f) return;
    f.addEventListener("submit", e => {
      e.preventDefault();
      const v = $("#email").value.trim(), note = $("#signupNote");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { note.className = "signup-note"; note.textContent = "Enter an email like you@email.com to join the list."; return; }
      note.className = "signup-note ok"; note.textContent = `You're on the list. We'll email ${v} before every drop.`; $("#email").value = "";
    });
  }
  function reelNav() {
    const reel = $("#reel"); if (!reel) return;
    const step = () => (reel.querySelector(".shot")?.offsetWidth || 300) + 16;
    $("#reelPrev")?.addEventListener("click", () => reel.scrollBy({ left: -step(), behavior: "smooth" }));
    $("#reelNext")?.addEventListener("click", () => reel.scrollBy({ left: step(), behavior: "smooth" }));
  }
  // Studio controls, shared by the home teaser and the full studio.
  function studio(root, state, onChange) {
    const stage = $(".stage", root);
    const render = () => {
      paintStage(stage, state);
      $$("[data-k]", root).forEach(seg => $$("button", seg).forEach(b => b.setAttribute("aria-pressed", b.dataset.v === String(state[seg.dataset.k]))));
      $$("[data-out]", root).forEach(o => {
        const k = o.dataset.out;
        o.textContent = k === "style" ? STYLES[state.style].label : k === "thread" ? THREADS[state.thread].label : k === "text" ? `"${cleanLetters(state.text) || "?"}"` : tc(String(state[k]));
      });
      $$("[data-price]", root).forEach(el => el.textContent = money(HAT_PRICE[state.type] + CUSTOM_FEE));
      $$("[data-tag]", root).forEach(el => el.textContent = `${tc(state.type)} / ${tc(state.color)} / ${THREADS[state.thread].label} thread`);
      onChange && onChange(state);
    };
    $$("[data-k]", root).forEach(seg => seg.addEventListener("click", e => {
      const b = e.target.closest("button[data-v]"); if (!b) return;
      state[seg.dataset.k] = b.dataset.v; render();
    }));
    const inp = $("input.letters-in", root);
    if (inp) {
      inp.value = state.text;
      inp.addEventListener("input", () => { const v = cleanLetters(inp.value); if (inp.value.toUpperCase() !== v) inp.value = v; state.text = v || ""; render(); });
    }
    $$("[data-preset]", root).forEach(b => b.addEventListener("click", () => { state.text = b.dataset.preset; if (inp) inp.value = state.text; render(); }));
    const rng = $("input[type=range]", root);
    if (rng) rng.addEventListener("input", () => { state.scale = +rng.value / 100; render(); });
    $("[data-addcustom]", root)?.addEventListener("click", () => {
      const text = cleanLetters(state.text);
      if (!text) { inp?.focus(); $("[data-hint]", root) && ($("[data-hint]", root).textContent = "Type 1 to 3 letters or numbers first."); return; }
      add(`${state.type}-t`, state.color, 1, { text, style: state.style, thread: state.thread, scale: state.scale || 1 });
    });
    render();
    return render;
  }


  /* ================= INTRO: the bear pops up, tips its hat, iris out ================= */
  function intro() {
    $$("[data-bear]").forEach(e => { e.innerHTML = BEAR; });
    $$("[data-bearmark]").forEach(e => { e.outerHTML = bearMark(); });
    const el = $("#intro"); if (!el) return;
    if (document.documentElement.classList.contains("no-intro") || calm) { el.remove(); return; }
    try { sessionStorage.setItem("teddy-intro", "1"); } catch (_) {}
    const done = () => { el.classList.add("gone"); setTimeout(() => el.remove(), 50); };
    const skip = () => { if (el.classList.contains("skip")) return; el.classList.add("skip"); setTimeout(done, 650); };
    el.addEventListener("click", skip);
    addEventListener("keydown", skip, { once: true });
    setTimeout(done, 3950);
  }

  /* ================= MOTION + INTERACTION ================= */
  function fx() {
    // reveal on scroll (elements start visible; they only slide in)
    const rvs = $$(".rv");
    if (rvs.length && !calm && "IntersectionObserver" in window) {
      document.documentElement.classList.add("js-rv");
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px" });
      rvs.forEach(r => io.observe(r));
    }
    // custom cursor
    const cur = $("#cursor");
    if (cur) {
      let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
      addEventListener("pointermove", e => {
        x = e.clientX; y = e.clientY; cur.classList.add("ready");
        const t = e.target.closest?.(".card__media, .shot, .tile, .hframe, .gallery__main, .club__art");
        cur.classList.toggle("view", !!t);
        $("b", cur).textContent = t?.classList.contains("gallery__main") ? "ZOOM" : t?.classList.contains("shot") || t?.classList.contains("hframe") ? "SHOP" : "VIEW";
        cur.classList.toggle("link", !t && !!e.target.closest?.("a, button, input, label, summary"));
      }, { passive: true });
      const loop = () => { cx += (x - cx) * .22; cy += (y - cy) * .22; cur.style.transform = `translate3d(${cx}px, ${cy}px, 0)`; requestAnimationFrame(loop); };
      loop();
    }
    // 3D tilt + light sweep on product plates
    if (fine && !calm) {
      document.addEventListener("pointermove", e => {
        const m = e.target.closest?.(".card__media"); if (!m) return;
        const r = m.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        m.style.transform = `rotateX(${(.5 - py) * 9}deg) rotateY(${(px - .5) * 11}deg) translateZ(0)`;
        m.style.setProperty("--gx", px * 100 + "%"); m.style.setProperty("--gy", py * 100 + "%");
      }, { passive: true });
      document.addEventListener("pointerout", e => { const m = e.target.closest?.(".card__media"); if (m && !m.contains(e.relatedTarget)) m.style.transform = ""; });
    }
    // giant marquee that speeds up with scroll
    const mq = $$(".bigmarq__track");
    if (mq.length && !calm) {
      let last = scrollY, vel = 0, off = 0;
      const step = () => {
        const d = scrollY - last; last = scrollY; vel = vel * .9 + d * .1;
        off -= .6 + Math.abs(vel) * .35;
        mq.forEach((t, i) => { const w = t.scrollWidth / 2; const o = ((off % w) + w) % w; t.style.transform = `translate3d(${i % 2 ? o - w : -o}px,0,0)`; });
        requestAnimationFrame(step);
      };
      step();
    }
    // manifesto words light up as it scrolls through the viewport
    const man = $(".manifesto");
    if (man) {
      const words = $$(".w", man);
      const lite = () => {
        const r = man.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight * .85 - r.top) / (r.height + innerHeight * .35)));
        const n = calm ? words.length : Math.round(p * words.length);
        words.forEach((w, i) => w.classList.toggle("lit", i < n));
      };
      addEventListener("scroll", lite, { passive: true }); lite();
    }
    // city list: photo follows the cursor
    const fl = $(".cities__float");
    if (fl && fine) {
      const img = $("img", fl);
      $$(".cities a").forEach(a => {
        a.addEventListener("pointerenter", () => { img.src = a.dataset.img; fl.classList.add("on"); });
        a.addEventListener("pointerleave", () => fl.classList.remove("on"));
      });
      addEventListener("pointermove", e => { fl.style.left = e.clientX + "px"; fl.style.top = e.clientY + "px"; }, { passive: true });
    }
    // sticky horizontal campaign rail
    const rail = $(".hrail");
    if (rail && !calm && matchMedia("(min-width: 761px)").matches) {
      const track = $(".hrail__track", rail);
      const size = () => { rail.style.height = (track.scrollWidth - innerWidth + innerHeight) + "px"; };
      const move = () => {
        const r = rail.getBoundingClientRect(), max = track.scrollWidth - innerWidth;
        const p = Math.min(1, Math.max(0, -r.top / Math.max(1, rail.offsetHeight - innerHeight)));
        track.style.transform = `translate3d(${-p * max}px,0,0)`;
      };
      size(); move();
      addEventListener("resize", () => { size(); move(); });
      addEventListener("scroll", move, { passive: true });
      addEventListener("load", () => { size(); move(); });
    }
  }

  /* ================= PAGES ================= */
  const PAGES = {
    home() {
      const grid = $("#grid");
      grid.innerHTML = HATS.map(hatCard).join(""); wireGrid(grid);
      $("#appGrid").innerHTML = APPAREL.slice(0, 4).map(appCard).join("");
      studio($("#teaser"), { type: "cowboy", color: "cream", text: "JM", style: "script", thread: "gold", scale: 1 });
      // details hotspots
      const DETAIL = [
        { src: "img/detail-interior.webp", pins: [[50, 44], [28, 56]] }, { src: "img/detail-interior.webp", pins: [[50, 44], [28, 56]] },
        { src: "img/detail-label.webp", pins: [[68, 64], [36, 46]] }, { src: "img/detail-label.webp", pins: [[68, 64], [36, 46]] }
      ];
      const hotImg = $("#hotImg"), pins = $$(".pin"), feats = $$("#feat li");
      const open = i => {
        feats.forEach((li, j) => li.classList.toggle("open", j === i));
        const d = DETAIL[i]; if (!hotImg.src.endsWith(d.src)) hotImg.src = d.src;
        const pair = i < 2 ? [0, 1] : [2, 3];
        pins.forEach((p, k) => {
          const idx = pair[k]; p.dataset.i = idx; p.textContent = idx + 1;
          p.style.left = d.pins[k][0] + "%"; p.style.top = d.pins[k][1] + "%";
          p.setAttribute("aria-label", feats[idx].querySelector("b").textContent); p.setAttribute("aria-pressed", idx === i);
        });
      };
      feats.forEach((li, i) => li.querySelector("button").addEventListener("click", () => open(i)));
      pins.forEach(p => p.addEventListener("click", () => open(+p.dataset.i)));
      reelNav(); signup();
    },
    shop() {
      const grid = $("#grid");
      let f = (location.hash || "#all").slice(1);
      const set = v => {
        f = ["all", "cowboy", "fedora", "hats", "apparel"].includes(v) ? v : "all";
        $$(".chip").forEach(c => c.setAttribute("aria-pressed", c.dataset.f === f));
        const list = ALL.filter(p => f === "all" || (f === "hats" && p.kind === "hat") || (f === "apparel" && p.kind === "apparel") || p.type === f);
        grid.innerHTML = list.map(p => p.kind === "hat" ? hatCard(p) : appCard(p)).join("");
        $("#count").textContent = `${list.length} products`;
        $$(".card", grid).forEach((el, i) => el.style.animationDelay = `${i * 35}ms`);
      };
      $$(".chip").forEach(c => c.addEventListener("click", () => { set(c.dataset.f); try { history.replaceState(null, "", "#" + c.dataset.f); } catch (_) {} }));
      addEventListener("hashchange", () => set(location.hash.slice(1)));
      wireGrid(grid); set(f);
    },
    product() {
      const p = byId(document.body.dataset.id), main = $("#pdp");
      const isHat = p.kind === "hat";
      let variant = isHat ? (location.hash === "#brown" ? "brown" : location.hash === "#cream" ? "cream" : (p.mono === "t" || p.mono === "ny" ? "brown" : "cream")) : (p.sizes.length === 1 ? p.sizes[0] : null);
      let qty = 1, shot = 0;
      const shots = () => isHat
        ? [hatImg(p.id, variant), hatImg(p.id, variant === "cream" ? "brown" : "cream"), ...LOOKS[p.id].map(k => `img/${k}.webp`), "img/detail-interior.webp", "img/detail-label.webp"]
        : p.img.map(k => `img/${k}.webp`);
      const city = isHat ? CITY[p.mono] : null;
      const others = isHat
        ? [byId(`${p.type === "cowboy" ? "fedora" : "cowboy"}-${p.mono}`), ...HATS.filter(h => h.type === p.type && h.id !== p.id).slice(0, 1), APPAREL[2], APPAREL[0]]
        : [...APPAREL.filter(a => a.id !== p.id).slice(0, 2), HATS[1], HATS[2]];
      main.innerHTML = `
        <nav class="crumbs" aria-label="Breadcrumb"><a href="./">Home</a><span><a href="shop.html#${isHat ? p.type : "apparel"}">${isHat ? (p.type === "cowboy" ? "Cowboy hats" : "Fedoras") : "Apparel"}</a></span><span>${p.name}</span></nav>
        <div class="pdp">
          <div class="gallery">
            <div class="gallery__thumbs" id="thumbs"></div>
            <div class="gallery__main" id="gmain"><img id="gimg" src="" alt=""><span class="gallery__count mono" id="gcount"></span></div>
          </div>
          <div class="buy">
            <div style="display:grid;gap:14px">
              <span class="eyebrow">${isHat ? `${tc(p.type)} / ${city.place} monogram` : "The apparel drop"}</span>
              <h1 class="display">${isHat ? `${city.mono} <span class="serif-i gold">${p.type === "cowboy" ? "Cowboy" : "Fedora"}</span>` : p.name.replace(/ (\S+)$/, ' <span class="serif-i gold">$1</span>')}</h1>
              <div class="buy__price"><span>$${p.price}.00</span><small>${isHat ? "100% wool" : esc(p.color)}</small></div>
              <p style="margin:0;color:var(--muted);max-width:52ch">${esc(p.desc)}</p>
            </div>
            ${isHat ? `<fieldset class="opt"><legend>Wool color <output id="vOut">${tc(variant)}</output></legend>
              <div class="seg" id="vSeg"><button class="color" data-v="cream"><span class="sw sw--cream"></span><b>Cream</b></button><button class="color" data-v="brown"><span class="sw sw--brown"></span><b>Brown</b></button></div></fieldset>`
              : `<fieldset class="opt"><legend>Size <output id="vOut">${variant || "Choose"}</output></legend><div class="sizes" id="vSeg">${p.sizes.map(s => `<button data-v="${s}">${s}</button>`).join("")}</div></fieldset>`}
            <div class="buy__ctas">
              <div class="qty-row"><div class="stepper"><button id="qMinus" aria-label="Decrease quantity">−</button><output id="qOut">1</output><button id="qPlus" aria-label="Increase quantity">+</button></div>
                <button class="btn" id="addBtn">${isHat ? "Add to cart" : "Pre-order"} · <span id="addPrice">$${p.price}</span> <span class="arrow">→</span></button></div>
              <p id="addHint" style="margin:0;font-size:13px;color:var(--muted);min-height:1.2em" role="status"></p>
            </div>
            ${isHat ? `<a class="studio-cta" href="studio.html#${p.type}-${variant}" id="studioCta">
              <span class="mini"><img id="miniImg" src="${blankImg(p.type, variant)}" alt=""><b>JM</b></span>
              <span><strong>Want your own letters?</strong><small>Design a custom monogram in the Monogram Studio. +$${CUSTOM_FEE}</small></span><i>→</i></a>` : ""}
            <div class="perks-row">${isHat ? `<div><b>100% wool</b>Felt crown and brim</div><div><b>Silk lined</b>Gold silk interior</div><div><b>Adjustable</b>Breathable sweatband</div>`
              : `<div><b>Pre-order</b>Ships with the drop</div><div><b>Embroidered</b>Teddy artwork</div><div><b>Unisex</b>Relaxed fit</div>`}</div>
            <div class="acc">
              <details open><summary>Details</summary><div class="acc__body">${isHat ? `<ul><li>Custom silk lined interior</li><li>Adjustable and breathable sweatband</li><li>Branded exterior woven label</li><li>Leather hat band with metal button</li><li>${city.place} ${city.mono} monogram, embroidered</li></ul>`
                : `<ul><li>${esc(p.color)}</li><li>Original Teddy artwork</li><li>${p.sizes.length > 1 ? "Sizes S to XXL, relaxed unisex fit" : "One size"}</li></ul>`}</div></details>
              ${isHat ? `<details><summary>The ${city.mono} monogram</summary><div class="acc__body">${city.story}</div></details>
              <details><summary>Hat care</summary><div class="acc__body">Rest the hat on its crown or on a hook, never flat on the brim. Brush the felt with a soft brush, and let it dry naturally at room temperature if it gets wet.</div></details>` : ""}
              <details><summary>Shipping and returns</summary><div class="acc__body">Rates and delivery times are shown at checkout. Questions? See the <a href="https://teddyheadwear.com/pages/faq" target="_blank" rel="noopener">FAQ</a>.</div></details>
            </div>
          </div>
        </div>`;
      // story + related
      $("#after").innerHTML = (isHat ? `
        <section class="story black">
          <div class="story__img"><img src="img/${LOOKS[p.id][0]}.webp" alt="${p.name} on location" loading="lazy"></div>
          <div class="story__body"><span class="story__mono" aria-hidden="true">${city.mono}</span><span class="eyebrow">${city.place}</span>
            <h2 class="display h-md">${city.line.replace(/ (\S+)$/, ' <span class="serif-i gold">$1</span>')}</h2><p class="lede" style="margin:0">${city.story}</p>
            <div style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn" href="#top" id="toTop">Add to cart <span class="arrow">↑</span></a><a class="btn btn--ghost" href="campaign.html">See the campaign</a></div></div>
        </section>` : `
        <section class="split">${p.img.map(k => `<div class="tile" style="min-height:clamp(380px,50vw,620px)"><img src="img/${k}.webp" alt="${p.name}" loading="lazy"></div>`).join("")}${p.img.length === 1 ? `<a class="tile" href="studio.html"><img src="img/scene-studio-duo.webp" alt="Two models in Teddy hats" loading="lazy"><div class="tile__body"><span class="eyebrow">Pair it</span><h3 class="display">Your <span class="serif-i">mark.</span></h3><span class="link">Design a hat <span>→</span></span></div></a>` : ""}</section>`) + `
        <section class="section"><div class="wrap"><div class="section-head"><div><span class="eyebrow">Complete the look</span><h2 class="display h-md">Wear it <span class="serif-i">with.</span></h2></div><a class="btn btn--line" href="shop.html">Shop all</a></div>
          <div class="grid" id="related">${others.map(o => o.kind === "hat" ? hatCard(o) : appCard(o)).join("")}</div></div></section>`;
      wireGrid($("#related"));
      const paint = () => {
        const list = shots(); shot = Math.min(shot, list.length - 1);
        $("#gimg").src = list[shot]; $("#gimg").alt = `${p.name}, view ${shot + 1}`;
        $("#gmain").classList.toggle("contain", false);
        $("#gcount").textContent = `${shot + 1} / ${list.length}`;
        $("#thumbs").innerHTML = list.map((s, i) => `<button aria-pressed="${i === shot}" data-i="${i}" aria-label="View ${i + 1}"><img src="${s}" alt="" loading="lazy"></button>`).join("");
        $$("#vSeg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === variant));
        $("#vOut").textContent = variant ? (isHat ? tc(variant) : variant) : "Choose";
        $("#qOut").textContent = qty; $("#addPrice").textContent = `$${p.price * qty}`;
        if (isHat) { $("#studioCta").href = `studio.html#${p.type}-${variant}`; $("#miniImg").src = blankImg(p.type, variant); }
        if ($("#mbarTxt")) $("#mbarTxt").innerHTML = `${esc(p.name)}${variant ? " · " + esc(isHat ? tc(variant) : variant) : ""} <b>$${p.price}</b>`;
      };
      $("#thumbs").addEventListener("click", e => { const b = e.target.closest("[data-i]"); if (b) { shot = +b.dataset.i; $("#gmain").classList.remove("zoom"); paint(); } });
      $("#gmain").addEventListener("click", e => {
        const m = $("#gmain"); m.classList.toggle("zoom");
        if (m.classList.contains("zoom")) { const r = m.getBoundingClientRect(); $("#gimg").style.transformOrigin = `${(e.clientX - r.left) / r.width * 100}% ${(e.clientY - r.top) / r.height * 100}%`; }
      });
      $("#vSeg").addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (b) { variant = b.dataset.v; shot = 0; $("#addHint").textContent = ""; paint(); } });
      $("#qMinus").addEventListener("click", () => { qty = Math.max(1, qty - 1); paint(); });
      $("#qPlus").addEventListener("click", () => { qty = Math.min(9, qty + 1); paint(); });
      const buy = () => { if (!variant) { $("#addHint").textContent = "Choose a size to continue."; $("#vSeg button")?.focus(); return; } add(p.id, variant, qty); };
      $("#addBtn").addEventListener("click", buy);
      $("#mbarBtn")?.addEventListener("click", buy);
      $("#toTop")?.addEventListener("click", e => { e.preventDefault(); scrollTo({ top: 0, behavior: "smooth" }); });
      const mbar = $("#mbar");
      if (mbar) { const io = new IntersectionObserver(([en]) => mbar.classList.toggle("on", !en.isIntersecting)); io.observe($("#addBtn")); }
      paint();
    },
    studio() {
      const m = (location.hash || "").slice(1).split("-");
      const state = {
        type: ["cowboy", "fedora"].includes(m[0]) ? m[0] : "cowboy", color: ["cream", "brown"].includes(m[1]) ? m[1] : "cream",
        text: "JM", style: "script", thread: "gold", scale: 1
      };
      studio($("#studio"), state, s => {
        $("#sumText").textContent = cleanLetters(s.text) || "–";
        $("#sumStyle").textContent = STYLES[s.style].label;
        $("#sumThread").textContent = THREADS[s.thread].label;
        $("#sumHat").textContent = `${tc(s.color)} ${s.type === "cowboy" ? "Cowboy" : "Fedora"}`;
        $("#sumBase").textContent = money(HAT_PRICE[s.type]);
      });
      // examples gallery
      const EX = [
        { type: "cowboy", color: "brown", text: "305", style: "varsity", thread: "white" },
        { type: "fedora", color: "cream", text: "AV", style: "serif", thread: "saddle" },
        { type: "cowboy", color: "cream", text: "R", style: "western", thread: "forest" },
        { type: "fedora", color: "brown", text: "K&J", style: "script", thread: "gold" }
      ];
      $("#examples").innerHTML = EX.map((x, i) => `<button class="card" data-ex="${i}" style="background:none;border:0;padding:0;text-align:left"><div class="stage" data-exstage></div>
        <div class="card__info"><div><h3 class="card__name">"${x.text}" ${STYLES[x.style].label}</h3><p class="card__place">${tc(x.color)} ${x.type}, ${THREADS[x.thread].label.toLowerCase()} thread</p></div><span class="card__price">Try it</span></div></button>`).join("");
      $$("[data-exstage]").forEach((st, i) => paintStage(st, { ...EX[i], scale: 1 }));
      $("#examples").addEventListener("click", e => {
        const b = e.target.closest("[data-ex]"); if (!b) return;
        Object.assign(state, EX[+b.dataset.ex], { scale: 1 });
        $("#studio input.letters-in").value = state.text; $("#studio input[type=range]").value = 100;
        $("#studio").dispatchEvent(new Event("rerender"));
        scrollTo({ top: $("#studio").getBoundingClientRect().top + scrollY - 90, behavior: "smooth" });
      });
      // Re-run the studio paint after an example loads, via the current style button.
      $("#studio").addEventListener("rerender", () => $(`#studio [data-k="style"] button[data-v="${state.style}"]`).click());
    },
    campaign() { reelNav(); signup(); }
  };

  intro();
  chrome();
  (PAGES[page] || (() => {}))();
  fx();
  window.Teddy = { add, ALL, HATS, APPAREL, paintStage };
})();
