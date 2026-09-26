// ---- Fill these in before you post the link ----
const FUND_URL = "https://www.gofundme.com/f/build-homeballot-secure-online-voting"; // the "Contribute" and "Support" buttons link here
const INSTAGRAM_HANDLE = "";  // e.g. "homeballot" (no @)
// ------------------------------------------------

const STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","District of Columbia","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"];

// Fictional races. Seed counts make the demo tally look alive.
const RACES = [
  { id: "gov", title: "Governor", short: "Governor", note: "Vote for one.", writeIn: true, options: [
    { id: "coleman", name: "Avery Coleman", sub: "Former county commissioner", seed: 4812 },
    { id: "whitfield", name: "Dana Whitfield", sub: "Small-business owner", seed: 4530 },
    { id: "okafor", name: "Sam Okafor", sub: "State representative", seed: 2197 },
  ]},
  { id: "sen", title: "U.S. Senator", short: "Senate", note: "Vote for one.", writeIn: true, options: [
    { id: "harlan", name: "Morgan Harlan", sub: "Veteran and nurse", seed: 5903 },
    { id: "reyes", name: "Luis Reyes", sub: "Former prosecutor", seed: 5411 },
  ]},
  { id: "m1", title: "Measure 1: Online Voting Pilot", short: "Measure 1", note: "Should the state run a secure, audited online voting pilot for overseas military and voters with disabilities?", options: [
    { id: "yes", name: "Yes", seed: 7340 },
    { id: "no", name: "No", seed: 3981 },
  ]},
];

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// ---- storage (per-browser; may be unavailable) ----
const store = {
  get(k, d) { try { const v = localStorage.getItem("hb:" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("hb:" + k, JSON.stringify(v)); } catch {} },
};
const mem = { used: store.get("used", []), votes: store.get("votes", []), receipts: store.get("receipts", []) };

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let voter = null;
let ballot = {};

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove("show"), 2600);
}

// ---- access codes: DEMO-XXXX-XXXX, last char is a checksum ----
function checksum(body) {
  let sum = 0;
  for (let i = 0; i < body.length; i++) sum += CODE_CHARS.indexOf(body[i]) * (i + 3);
  return CODE_CHARS[sum % CODE_CHARS.length];
}
function makeCode() {
  const rnd = crypto.getRandomValues(new Uint32Array(7));
  const body = [...rnd].map((n) => CODE_CHARS[n % CODE_CHARS.length]).join("");
  const full = body + checksum(body);
  return `DEMO-${full.slice(0, 4)}-${full.slice(4)}`;
}
function normCode(v) { return v.toUpperCase().replace(/[^A-Z0-9]/g, ""); }
function validCode(v) {
  const n = normCode(v);
  if (!/^DEMO[A-Z0-9]{8}$/.test(n)) return false;
  const body = n.slice(4, 11);
  if ([...n.slice(4)].some((c) => !CODE_CHARS.includes(c))) return false;
  return checksum(body) === n[11];
}

// ---- steps ----
function go(step) {
  $$(".panel").forEach((p) => p.classList.toggle("active", p.dataset.panel == step));
  $$(".steps li").forEach((li) => {
    const n = +li.dataset.step;
    li.classList.toggle("active", n === step);
    li.classList.toggle("done", n < step);
  });
  const app = $("#app");
  if (app.getBoundingClientRect().top < 0) app.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Step 1
function initVerify() {
  const sel = $("#state-select");
  sel.insertAdjacentHTML("beforeend", STATES.map((s) => `<option>${s}</option>`).join(""));

  const code = $("#code-input");
  $("#gen-code").addEventListener("click", () => {
    code.value = makeCode();
    $("#verify-error").textContent = "";
    toast("Demo code generated. In production, this code is mailed to your registered address.");
  });

  code.addEventListener("input", () => {
    const digits = code.value.replace(/\D/g, "");
    // Stop anyone typing a real SSN into the demo.
    if (/^\d{3}-?\d{2}-?\d{4}$/.test(code.value.trim()) || digits.length >= 9) {
      code.value = "";
      $("#verify-error").textContent = "That looks like a Social Security number. Do not enter it here. Use \"Generate demo code\" instead.";
    }
  });

  $("#verify-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const first = f.first.value.trim();
    const err = $("#verify-error");
    if (!first) return (err.textContent = "Enter a first name. Any name may be used for the demonstration.");
    if (!f.state.value) return (err.textContent = "Select a state.");
    if (!validCode(f.code.value)) return (err.textContent = "This access code is not valid. Select \"Generate demo code\" to create one.");
    const n = normCode(f.code.value);
    if (mem.used.includes(n)) return (err.textContent = "A ballot has already been submitted with this access code. Each voter may submit one ballot.");
    err.textContent = "";
    voter = { first, state: f.state.value, code: n };
    $$(".js-name").forEach((el) => (el.textContent = first));
    $$(".js-state").forEach((el) => (el.textContent = f.state.value));
    runChecks();
  });
}

// Step 2
function runChecks() {
  go(2);
  const items = $$("#checks li");
  const btn = $("#to-ballot");
  btn.disabled = true;
  items.forEach((li) => { li.className = "wait"; });
  items.forEach((li, i) => {
    setTimeout(() => { li.className = ""; }, i * 550);
    setTimeout(() => {
      li.className = "ok";
      if (i === items.length - 1) { btn.disabled = false; btn.focus(); }
    }, i * 550 + 520);
  });
}

// Step 3
function renderBallot() {
  $("#ballot-form").innerHTML = RACES.map((r) => `
    <fieldset>
      <legend>${r.title}</legend>
      <p class="race-note">${r.note}</p>
      ${r.options.map((o) => `
        <label class="opt">
          <input type="radio" name="${r.id}" value="${o.id}">
          <span class="radio"></span>
          <span>${o.name}${o.sub ? `<span class="sub">${o.sub}</span>` : ""}</span>
        </label>`).join("")}
      ${r.writeIn ? `
        <label class="opt">
          <input type="radio" name="${r.id}" value="__write">
          <span class="radio"></span>
          <input class="writein" data-for="${r.id}" placeholder="Write-in candidate" maxlength="40" aria-label="Write-in for ${r.title}">
        </label>` : ""}
    </fieldset>`).join("");

  $$(".writein").forEach((w) => w.addEventListener("focus", () => {
    $(`input[name="${w.dataset.for}"][value="__write"]`).checked = true;
  }));
}

function readBallot() {
  const out = {};
  for (const r of RACES) {
    const pick = $(`input[name="${r.id}"]:checked`);
    if (!pick) continue;
    if (pick.value === "__write") {
      const name = $(`.writein[data-for="${r.id}"]`).value.trim();
      if (!name) return { error: `Enter a name for your write-in selection for ${r.title}, or choose another option.` };
      out[r.id] = { writeIn: name };
    } else out[r.id] = { id: pick.value };
  }
  if (!Object.keys(out).length) return { error: "Make at least one selection before continuing." };
  return { ballot: out };
}

function label(race, sel) {
  if (!sel) return null;
  if (sel.writeIn) return `${sel.writeIn} (write-in)`;
  return race.options.find((o) => o.id === sel.id).name;
}

// Step 4
function renderReview() {
  $("#review").innerHTML = RACES.map((r) => {
    const l = label(r, ballot[r.id]);
    return `<div><dt>${r.short}</dt><dd class="${l ? "" : "skip"}">${l ? esc(l) : "Skipped"}</dd></div>`;
  }).join("");
}

async function receiptFor(b) {
  const nonce = crypto.getRandomValues(new Uint8Array(16)).join(",");
  const data = new TextEncoder().encode(JSON.stringify(b) + "|" + nonce);
  let hex;
  try {
    const buf = await crypto.subtle.digest("SHA-256", data);
    hex = [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");
  } catch {
    hex = [...crypto.getRandomValues(new Uint8Array(8))].map((x) => x.toString(16).padStart(2, "0")).join("");
  }
  const s = hex.slice(0, 12).toUpperCase();
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
}

async function cast() {
  const btn = $("#cast");
  btn.disabled = true;
  btn.textContent = "Submitting…";
  // Identity and ballot are stored separately: the code list only records "voted".
  mem.used.push(voter.code);
  mem.votes.push(ballot);
  const code = await receiptFor(ballot);
  mem.receipts.push(code);
  store.set("used", mem.used);
  store.set("votes", mem.votes);
  store.set("receipts", mem.receipts);
  setTimeout(() => {
    $("#receipt-code").textContent = code;
    btn.disabled = false;
    btn.textContent = "Submit ballot";
    go(5);
    renderResults();
  }, 700);
}

// ---- results ----
let activeRace = RACES[0].id;
let tick = 0;

function tally(race) {
  const counts = {};
  race.options.forEach((o) => (counts[o.id] = o.seed + Math.floor(tick * (o.seed / 900))));
  let writeIns = 0;
  mem.votes.forEach((v) => {
    const s = v[race.id];
    if (!s) return;
    if (s.writeIn) writeIns++;
    else counts[s.id]++;
  });
  return { counts, writeIns };
}

function renderResults() {
  $("#race-picker").innerHTML = RACES.map((r) =>
    `<button role="tab" aria-selected="${r.id === activeRace}" data-race="${r.id}">${r.short}</button>`).join("");
  const race = RACES.find((r) => r.id === activeRace);
  const { counts, writeIns } = tally(race);
  const rows = race.options.map((o) => ({ id: o.id, name: o.name, n: counts[o.id] }));
  if (race.writeIn && writeIns) rows.push({ id: "__write", name: "Write-ins", n: writeIns });
  const total = rows.reduce((a, r) => a + r.n, 0);
  const max = Math.max(...rows.map((r) => r.n));
  const mine = mem.votes.length ? mem.votes[mem.votes.length - 1][race.id] : null;
  const mineId = mine ? (mine.writeIn ? "__write" : mine.id) : null;

  const bars = $("#bars");
  const fresh = bars.dataset.race !== race.id;
  bars.dataset.race = race.id;
  bars.innerHTML = rows.map((r) => {
    const pct = total ? (r.n / total) * 100 : 0;
    return `<div>
      <div class="bar-top"><span>${esc(r.name)}${r.id === mineId ? '<span class="you">Your selection</span>' : ""}</span><span>${pct.toFixed(1)}%</span></div>
      <div class="bar ${r.n === max ? "lead" : ""}"><i style="width:${fresh ? 0 : pct}%" data-w="${pct}"></i></div>
    </div>`;
  }).join("");
  if (fresh) requestAnimationFrame(() => requestAnimationFrame(() => $$("#bars i").forEach((i) => (i.style.width = i.dataset.w + "%"))));
  $("#total-line").textContent = `${total.toLocaleString()} ballots. Figures are simulated for demonstration.`;
}

function initResults() {
  $("#race-picker").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-race]");
    if (!b) return;
    activeRace = b.dataset.race;
    renderResults();
  });
  renderResults();
  setInterval(() => { tick++; renderResults(); }, 4000);
}

function initLookup() {
  $("#lookup-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const out = $("#lookup-result");
    const v = $("#lookup-input").value.toUpperCase().replace(/[^0-9A-F]/g, "");
    if (v.length !== 12) { out.className = "lookup-result bad"; out.textContent = "Receipt numbers have 12 characters, for example 7F3A-C91E-04BD."; return; }
    const code = `${v.slice(0, 4)}-${v.slice(4, 8)}-${v.slice(8)}`;
    const found = mem.receipts.includes(code);
    out.className = "lookup-result " + (found ? "ok" : "bad");
    out.textContent = found
      ? `Receipt ${code} was found in the ledger. The ballot was counted.`
      : `No ballot with receipt ${code} was found.`;
  });
}

// ---- wiring ----
function initFlow() {
  $("#to-ballot").addEventListener("click", () => { renderBallot(); ballot = {}; go(3); });
  $("#to-review").addEventListener("click", () => {
    const res = readBallot();
    $("#ballot-error").textContent = res.error || "";
    if (res.error) return;
    ballot = res.ballot;
    renderReview();
    go(4);
  });
  $("#back-ballot").addEventListener("click", () => go(3));
  $("#cast").addEventListener("click", cast);
  $("#copy-receipt").addEventListener("click", async () => {
    const code = $("#receipt-code").textContent;
    try { await navigator.clipboard.writeText(code); toast("Receipt number copied"); }
    catch { toast(code); }
    $("#lookup-input").value = code;
  });
  $("#restart").addEventListener("click", () => {
    voter = null; ballot = {};
    $("#verify-form").reset();
    go(1);
    $("#verify-form").first.focus();
  });
}

function initFunding() {
  const note = $("#fund-note");
  $$(".js-fund").forEach((a) => {
    if (FUND_URL) { a.href = FUND_URL; a.target = "_blank"; a.rel = "noopener"; return; }
    a.addEventListener("click", () => {
      if (a.id === "fund-main") note.textContent = "The contribution page will open soon. In the meantime, please share this page.";
    });
  });
  if (INSTAGRAM_HANDLE) {
    const link = $(".js-ig-link");
    link.href = `https://instagram.com/${encodeURIComponent(INSTAGRAM_HANDLE)}`;
    link.textContent = "@" + INSTAGRAM_HANDLE;
    $(".js-ig").hidden = false;
  }
  $$(".js-share").forEach((a) => a.addEventListener("click", async (e) => {
    e.preventDefault();
    const data = { title: "Homeballot", text: "A working demonstration of secure online voting for American citizens.", url: location.origin + "/#demo" };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(data.url); toast("Link copied"); }
    } catch {}
  }));
}

function initContact() {
  const form = $("#contact-form");
  if (!form) return;
  const err = $("#contact-error");
  const btn = $("#contact-submit");
  form.addEventListener("input", () => { if (err.textContent) err.textContent = ""; });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (!data.name.trim()) return (err.textContent = "Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim())) return (err.textContent = "Please enter a valid email address.");
    if (data.message.trim().length < 10) return (err.textContent = "Please enter a message of at least 10 characters.");
    err.textContent = "";
    btn.disabled = true;
    btn.textContent = "Sending…";
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const out = await r.json().catch(() => ({}));
      if (!r.ok || !out.ok) throw new Error(out.error || "Your message could not be sent. Please try again later.");
      form.hidden = true;
      $("#contact-done").hidden = false;
    } catch (ex) {
      err.textContent = ex.message || "Your message could not be sent. Please try again later.";
    } finally {
      btn.disabled = false;
      btn.textContent = "Send message";
    }
  });
}

// Slide-in call to action: appears once the visitor has scrolled a while or
// spent some time on the page, and stays away for a week after it is closed.
function initCta() {
  const pop = $("#cta-pop");
  if (!pop) return;
  const KEY = "ctaClosed";
  const closedAt = store.get(KEY, 0);
  if (closedAt && Date.now() - closedAt < 7 * 864e5) return;
  let shown = false;
  const inView = (sel) => { const el = $(sel); if (!el) return false; const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };
  const show = () => {
    if (shown || inView("#support") || inView("#contact")) return;
    shown = true;
    pop.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => pop.classList.add("show")));
    removeEventListener("scroll", onScroll);
  };
  const hide = (remember) => {
    pop.classList.remove("show");
    setTimeout(() => (pop.hidden = true), 300);
    if (remember) store.set(KEY, Date.now());
  };
  const onScroll = () => { if (scrollY > innerHeight * 1.2) show(); };
  addEventListener("scroll", onScroll, { passive: true });
  setTimeout(show, 25000);
  $("#cta-close").addEventListener("click", () => hide(true));
  $("#cta-demo").addEventListener("click", () => hide(true));
  pop.querySelector(".js-fund").addEventListener("click", () => hide(true));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && shown) hide(true); });
}

initVerify();
initFlow();
initResults();
initLookup();
initFunding();
initContact();
initCta();
