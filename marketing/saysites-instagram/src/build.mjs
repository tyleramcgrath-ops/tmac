// Builds the SaySites Instagram pack: every post, carousel slide, Story,
// highlight cover and the profile photo, rendered from HTML to PNG at
// Instagram's sizes. Run: node src/build.mjs (needs Playwright).
//
// Brand: black, white and calm neutrals, Instrument Sans, the quote-mark S.
// The example firms are SaySites' demo sites, labelled "Example design"
// everywhere they appear. No prices, no competitors, no promised rankings.

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const A = (f) => pathToFileURL(join(HERE, 'assets', f)).href

const CSS = `
@font-face { font-family: 'Instrument Sans'; src: url('${A('instrument-sans.woff2')}') format('woff2'); font-weight: 400 700; font-stretch: 75% 100%; }
:root { --paper: #f4f3ef; --paper2: #ebe9e3; --ink: #121316; --mu: #64666b; --line: #dedbd4; --mint: #2f6b4f; --dmu: #a3a5aa; }
* { box-sizing: border-box; margin: 0; }
html, body { width: 100%; height: 100%; }
body { font-family: 'Instrument Sans', system-ui, sans-serif; color: var(--ink); background: var(--paper); -webkit-font-smoothing: antialiased; }
.f { position: relative; width: 100%; height: 100%; overflow: hidden; display: flex; flex-direction: column; padding: 88px 84px; }
.dark { background: var(--ink); color: #fff; }
.light { background: var(--paper); }
.white { background: #fff; }
.top { display: flex; justify-content: space-between; align-items: center; }
.logo { display: inline-flex; align-items: center; gap: 14px; font-size: 40px; letter-spacing: -0.02em; }
.logo b { font-weight: 700; } .logo span { opacity: .72; }
.page { font-size: 26px; color: var(--mu); font-variant-numeric: tabular-nums; letter-spacing: .02em; }
.dark .page, .dark .k { color: var(--dmu); }
.k { font-size: 28px; font-weight: 500; color: var(--mu); display: flex; align-items: center; gap: 16px; letter-spacing: .01em; }
.k::before { content: ''; width: 34px; height: 2px; background: currentColor; }
h1 { font-weight: 500; letter-spacing: -0.045em; line-height: .98; text-wrap: balance; }
.xl { font-size: 124px; } .l { font-size: 98px; } .m { font-size: 76px; } .s { font-size: 60px; }
p.lede { font-size: 36px; line-height: 1.4; color: var(--mu); max-width: 860px; text-wrap: pretty; }
.dark p.lede { color: var(--dmu); }
.grow { flex: 1; }
.foot { display: flex; justify-content: space-between; align-items: flex-end; font-size: 30px; }
.foot .url { font-weight: 600; letter-spacing: -0.01em; }
.tag { font-size: 22px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; padding: 10px 16px; border: 2px solid currentColor; border-radius: 8px; color: var(--mu); }
.dark .tag { color: var(--dmu); }
.browser { background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 40px 80px -40px rgba(18,19,22,.45); border: 1px solid var(--line); }
.browser .bar { height: 46px; display: flex; align-items: center; gap: 10px; padding: 0 18px; border-bottom: 1px solid var(--line); background: #fafaf8; }
.browser .bar i { width: 13px; height: 13px; border-radius: 50%; background: var(--line); }
.browser img { display: block; width: 100%; }
.phone { position: absolute; width: 300px; border-radius: 46px; padding: 12px; background: var(--ink); box-shadow: 0 40px 80px -30px rgba(18,19,22,.55); }
.phone img { display: block; width: 100%; border-radius: 36px; }
.step { display: grid; grid-template-columns: 120px 1fr; gap: 28px; align-items: start; padding: 34px 0; border-top: 2px solid rgba(255,255,255,.14); }
.light .step { border-top-color: var(--line); }
.step b { font-size: 72px; font-weight: 500; letter-spacing: -0.04em; line-height: 1; }
.step h3 { font-size: 46px; font-weight: 500; letter-spacing: -0.03em; margin-bottom: 10px; }
.step p { font-size: 30px; line-height: 1.4; color: var(--dmu); }
.light .step p { color: var(--mu); }
.card { background: #fff; color: var(--ink); border-radius: 28px; padding: 40px; box-shadow: 0 40px 90px -40px rgba(0,0,0,.6); }
.ch { display: flex; justify-content: space-between; font-size: 22px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--mu); margin-bottom: 22px; }
.cols { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 26px; }
.cols div { background: var(--paper); border-radius: 16px; padding: 22px 10px; text-align: center; display: grid; gap: 6px; }
.cols b { font-size: 60px; font-weight: 500; letter-spacing: -0.04em; line-height: 1; }
.cols span { font-size: 22px; color: var(--mu); }
.rows { list-style: none; padding: 0; }
.rows li { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 22px 6px; border-top: 1px solid var(--line); font-size: 30px; }
.rows li i { font-style: normal; font-size: 19px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--mu); border: 2px solid currentColor; border-radius: 7px; padding: 5px 10px; white-space: nowrap; }
.rows li i.g { color: var(--mint); }
.bars li { display: grid; grid-template-columns: 220px 1fr 60px; align-items: center; gap: 20px; }
.bar2 { height: 10px; border-radius: 5px; background: var(--line); overflow: hidden; } .bar2 em { display: block; height: 100%; background: var(--ink); }
.score { display: flex; align-items: baseline; gap: 18px; margin: 4px 0 18px; }
.score b { font-size: 150px; font-weight: 500; letter-spacing: -0.06em; line-height: .9; }
.score span { font-size: 30px; color: var(--mu); }
.mail { background: #fff; color: var(--ink); border-radius: 26px; padding: 44px; font-size: 32px; line-height: 1.45; box-shadow: 0 40px 90px -40px rgba(0,0,0,.6); }
.mail .from { font-size: 24px; color: var(--mu); margin-bottom: 8px; }
.mail .subj { font-size: 36px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 26px; }
.mail p + p { margin-top: 20px; }
.crms { display: flex; flex-wrap: wrap; gap: 18px; }
.crms b { font-size: 46px; font-weight: 500; letter-spacing: -0.03em; padding: 22px 30px; border: 2px solid rgba(255,255,255,.2); border-radius: 18px; }
.ghost { border: 3px dashed var(--line); border-radius: 22px; height: 150px; }
.dark .ghost { border-color: rgba(255,255,255,.18); }
.ph { background: var(--paper2); border-radius: 18px; padding: 30px; display: grid; gap: 16px; }
.ph i { display: block; height: 18px; border-radius: 9px; background: #d6d3cb; }
`

const MARK = (c = 'currentColor', s = 46) => `<svg width="${s}" height="${s}" viewBox="0 0 48 48"><g fill="${c}"><circle cx="19" cy="19" r="7.5"/><path d="M11.5 19C11.5 10.7 17.9 4.7 26.5 4.1v5.2c-5.2.5-9 4.1-9.6 9.7z"/><circle cx="29" cy="29" r="7.5"/><path d="M36.5 29C36.5 37.3 30.1 43.3 21.5 43.9v-5.2c5.2-.5 9-4.1 9.6-9.7z"/></g></svg>`
const LOGO = `<span class="logo">${MARK()}<span style="opacity:1"><b>say</b><span>sites</span></span></span>`
const top = (page) => `<div class="top">${LOGO}${page ? `<span class="page">${page}</span>` : ''}</div>`
const foot = (left = 'saysites.com', right = '') => `<div class="foot"><span class="url">${left}</span><span>${right}</span></div>`

// ---------------------------------------------------------------------------
// Feed posts (1080 x 1350). Posted 1 → 9, so 9 ends up top-left of the grid.
// Dark and light alternate, making a checkerboard once all nine are up.
// ---------------------------------------------------------------------------

const work = (img, phone, name, kind) => `<div class="f light">
  ${top()}
  <div style="position:relative; margin-top:64px; height:760px">
    <div class="browser" style="width:840px"><div class="bar"><i></i><i></i><i></i></div><img src="${A(img)}" alt=""></div>
    <div class="phone" style="right:-10px; top:250px"><img src="${A(phone)}" alt=""></div>
  </div>
  <div class="grow"></div>
  <div class="foot"><span><span style="display:block;font-size:46px;font-weight:500;letter-spacing:-0.03em">${name}</span><span style="color:var(--mu)">${kind}</span></span><span class="tag">Example design</span></div>
</div>`

const carousel = (n, slides, theme = 'dark') => slides.map((body, i) => `<div class="f ${theme}">${top(`${i + 1} / ${slides.length}`)}${body}</div>`)

const POSTS = [
  {
    id: '01-premium',
    frames: [`<div class="f dark">${top()}<div class="grow"></div>
      <p class="k" style="margin-bottom:40px">For firms that compete for every client</p>
      <h1 class="xl">Premium websites built to bring in leads.</h1>
      <p class="lede" style="margin-top:44px">Law firms, medical practices, med spas, dentists and home services.</p>
      <div style="height:90px"></div>${foot('saysites.com', 'Link in bio')}</div>`],
  },
  { id: '02-work-law', frames: [work('counsel.jpg', 'phone-calder-and-vane.jpg', 'Calder & Vane', 'Personal injury law, San Antonio')] },
  {
    id: '03-who-gets-the-call',
    frames: carousel(3, [
      `<div class="grow"></div><h1 class="xl">Your website decides who gets the call.</h1><p class="lede" style="margin-top:44px">Here’s what happens before anyone picks up the phone.</p><div style="height:80px"></div>${foot('saysites.com', 'Swipe →')}`,
      `<div class="grow"></div><p class="k" style="margin-bottom:36px">Step 1</p><h1 class="l">Someone needs help. They search.</h1><p class="lede" style="margin-top:40px">“Divorce lawyer near me.” “Back pain specialist.” “Emergency plumber.” Usually on a phone, usually in a hurry.</p><div class="grow"></div>`,
      `<div class="grow"></div><p class="k" style="margin-bottom:36px">Step 2</p><h1 class="l">They open a few websites and compare.</h1><p class="lede" style="margin-top:40px">In seconds, they decide who looks trustworthy and who actually answers their question.</p><div class="grow"></div>`,
      `<div class="grow"></div><p class="k" style="margin-bottom:36px">Step 3</p><h1 class="l">They contact the one that makes it easy.</h1><p class="lede" style="margin-top:40px">A clear answer, a real person, and a way to reach them right there on the page.</p><div class="grow"></div>`,
      `<div class="grow"></div><p class="k" style="margin-bottom:36px">What we build for that moment</p>
       <div class="step"><b>01</b><div><h3>A page for every service</h3><p>So the right page answers the right search.</p></div></div>
       <div class="step"><b>02</b><div><h3>A request form up front</h3><p>On the home page, not buried on a contact page.</p></div></div>
       <div class="step" style="border-bottom:2px solid rgba(255,255,255,.14)"><b>03</b><div><h3>One tap to call</h3><p>A call button everywhere, made for phones.</p></div></div>
       <div style="height:70px"></div>${foot('saysites.com', 'Link in bio')}`,
    ]),
  },
  { id: '04-work-medical', frames: [work('brightwater-family-medicine.jpg', 'phone-brightwater-family-medicine.jpg', 'Brightwater Family Medicine', 'Family medicine, Charlotte')] },
  {
    id: '05-leads-handled',
    frames: carousel(5, [
      `<div class="grow"></div><p class="k" style="margin-bottom:40px">Leads, handled</p><h1 class="xl">Every lead answered, followed up and tracked.</h1><div style="height:90px"></div>${foot('saysites.com', 'Swipe →')}`,
      `<div class="grow"></div><p class="lede" style="margin:0 0 40px">Every request lands in your own leads pipeline.</p>
       <div class="card"><div class="ch"><span>Example pipeline</span><span>This week</span></div>
       <div class="cols"><div><b>2</b><span>New</span></div><div><b>3</b><span>Contacted</span></div><div><b>1</b><span>Booked</span></div><div><b>1</b><span>Won</span></div></div>
       <ul class="rows"><li><b style="font-weight:600">Estate planning question</b><i>New</i></li><li>Probate consultation<i class="g">Replied automatically</i></li><li>Will update after a move<i class="g">Booked</i></li></ul></div><div class="grow"></div>`,
      `<div class="grow"></div><p class="lede" style="margin:0 0 40px">The moment someone asks for help, they hear back.</p>
       <div class="mail"><div class="from">From: Your firm</div><div class="subj">Thanks for contacting your firm</div><p>Hi Jordan,</p><p>Thank you for getting in touch. We’ve received your message and will get back to you as soon as we can.</p><p>If it’s urgent, please call us.</p></div>
       <p class="lede" style="margin-top:36px;font-size:28px">You get an alert too, and a reminder if a lead is still waiting.</p><div class="grow"></div>`,
      `<div class="grow"></div><h1 class="m" style="margin-bottom:48px">Already use a CRM? Every lead goes there too.</h1>
       <div class="crms"><b>HubSpot</b><b>Salesforce</b><b>Pipedrive</b><b>Clio Grow</b><b>Zapier</b><b>Make</b></div><div class="grow"></div>`,
      `<div class="grow"></div><h1 class="l">Know where every lead came from, and what’s working.</h1><p class="lede" style="margin-top:40px">Google Ads, Google Maps, Facebook, and a results email on the 1st of every month.</p><div style="height:80px"></div>${foot('saysites.com', 'Link in bio')}`,
    ]),
  },
  { id: '06-work-medspa', frames: [work('lumen-aesthetics.jpg', 'phone-lumen-aesthetics.jpg', 'Lumen Aesthetics', 'Med spa, Scottsdale')] },
  {
    id: '07-seo-built-in',
    frames: carousel(7, [
      `<div class="grow"></div><p class="k" style="margin-bottom:40px">SEO, built in</p><h1 class="xl">Know where you stand on Google.</h1><div style="height:90px"></div>${foot('saysites.com', 'Swipe →')}`,
      `<div class="grow"></div><p class="lede" style="margin:0 0 40px">Every page audited the way Google reads it, again after every change.</p>
       <div class="card"><div class="ch"><span>Example audit</span><span>Hale & Porter Law</span></div>
       <div class="score"><b>90</b><span>out of 100, across 8 pages</span></div>
       <ul class="rows bars"><li><span>Technical</span><span class="bar2"><em style="width:97%"></em></span><b>97</b></li><li><span>Content</span><span class="bar2"><em style="width:93%"></em></span><b>93</b></li><li><span>Google data</span><span class="bar2"><em style="width:74%"></em></span><b>74</b></li><li><span>AI answers</span><span class="bar2"><em style="width:84%"></em></span><b>84</b></li></ul></div>
       <p class="lede" style="margin-top:30px;font-size:24px">A real audit of our example law firm site.</p><div class="grow"></div>`,
      `<div class="grow"></div><h1 class="l">Fixes, most important first.</h1><p class="lede" style="margin-top:40px">Each one in plain words. The common ones, like duplicate page titles, are fixed in one click. And see how you compare with the firms you compete with.</p><div class="grow"></div>`,
      `<div class="grow"></div><h1 class="l">No one honest can promise you a ranking.</h1><p class="lede" style="margin-top:40px">What we promise: you’ll always know exactly where you stand, and why.</p><div style="height:80px"></div>${foot('saysites.com', 'Link in bio')}`,
    ]),
  },
  {
    id: '08-free-redesign',
    frames: [`<div class="f light">${top()}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:34px;margin-top:70px;align-items:end">
        <div><p class="page" style="margin-bottom:16px">Your site today</p><div class="ph" style="height:520px"><i style="width:60%"></i><i></i><i style="width:80%"></i><div style="flex:1"></div><i style="width:40%;height:60px;border-radius:12px"></i><i style="width:90%"></i><i style="width:70%"></i></div></div>
        <div><p class="page" style="margin-bottom:16px">Redesigned, free</p><div style="border-radius:26px;overflow:hidden;height:520px;box-shadow:0 30px 70px -30px rgba(18,19,22,.5)"><img src="${A('phone-hale-and-porter.jpg')}" style="width:100%;display:block"></div></div>
      </div>
      <div class="grow"></div>
      <h1 class="m">Send us your website. We’ll redesign it, free.</h1>
      <p class="lede" style="margin-top:30px">Page by page, before we’ve even spoken. No obligation.</p>
      <div style="height:60px"></div>${foot('saysites.com/redesign', '<span class="tag">Example design</span>')}</div>`],
  },
  {
    id: '09-how-we-work',
    frames: carousel(9, [
      `<div class="grow"></div><p class="k" style="margin-bottom:40px">How we work</p><h1 class="xl">You see it before you commit to anything.</h1><div style="height:90px"></div>${foot('saysites.com', 'Swipe →')}`,
      `<div class="grow"></div>
       <div class="step"><b>01</b><div><h3>A free redesign</h3><p>Send us your current site. We rebuild it so you can see the difference, page by page.</p></div></div>
       <div class="step"><b>02</b><div><h3>We build your site</h3><p>Your services, your people and your words, written for the way your clients search.</p></div></div>
       <div class="step"><b>03</b><div><h3>You approve it</h3><p>One private link to look through every page. Nothing goes live until you say so.</p></div></div>
       <div class="step" style="border-bottom:2px solid rgba(255,255,255,.14)"><b>04</b><div><h3>You watch the leads</h3><p>Every message, call tap and visit, in your dashboard.</p></div></div>
       <div class="grow"></div>`,
      `<div class="grow"></div><h1 class="l">Let’s talk about getting you more leads.</h1><p class="lede" style="margin-top:40px">Send us a message here, or start at saysites.com.</p><div style="height:80px"></div>${foot('saysites.com', 'Link in bio')}`,
    ]),
  },
]

// ---------------------------------------------------------------------------
// Stories (1080 x 1920). The top 250px and bottom 300px stay clear of
// Instagram's own buttons; the dashed boxes are where to put a link sticker.
// ---------------------------------------------------------------------------

const story = (cls, body) => `<div class="f ${cls}" style="padding:260px 84px 320px">${body}</div>`
const STORIES = [
  { id: 's1-intro', html: story('dark', `${LOGO}<div class="grow"></div><h1 class="xl">Premium websites built to bring in leads.</h1><p class="lede" style="margin-top:44px">For law firms, medical practices, med spas, dentists and home services.</p><div class="grow"></div>`) },
  { id: 's2-work', html: story('light', `${LOGO}<div style="position:relative;flex:1;margin-top:40px"><div class="phone" style="width:560px;left:50%;transform:translateX(-50%);top:10px;border-radius:70px;padding:18px"><img src="${A('phone-hale-and-porter.jpg')}" style="border-radius:54px"></div></div><div class="foot" style="margin-top:30px"><span><span style="display:block;font-size:46px;font-weight:500;letter-spacing:-0.03em">Hale & Porter</span><span style="color:var(--mu)">Estate and family law, Columbus</span></span><span class="tag">Example design</span></div>`) },
  { id: 's3-free-redesign', html: story('light', `${LOGO}<div class="grow"></div><h1 class="xl">See your website redesigned. Free.</h1><p class="lede" style="margin-top:44px">Send us your site and see the difference, page by page, before we’ve even spoken.</p><div style="height:80px"></div><div class="ghost"></div><div class="grow"></div>`) },
  { id: 's4-leads', html: story('dark', `${LOGO}<div class="grow"></div><h1 class="l" style="margin-bottom:56px">Every lead answered, followed up and tracked.</h1>
     <div class="card"><div class="ch"><span>Example pipeline</span><span>This week</span></div><div class="cols"><div><b>2</b><span>New</span></div><div><b>3</b><span>Contacted</span></div><div><b>1</b><span>Booked</span></div><div><b>1</b><span>Won</span></div></div>
     <ul class="rows"><li><b style="font-weight:600">Estate planning question</b><i>New</i></li><li>Probate consultation<i class="g">Replied</i></li></ul></div><div class="grow"></div>`) },
  { id: 's5-lets-talk', html: story('dark', `${LOGO}<div class="grow"></div><h1 class="xl">Let’s talk about getting you more leads.</h1><p class="lede" style="margin-top:44px">Tap the link, or send us a message.</p><div style="height:80px"></div><div class="ghost"></div><div class="grow"></div>`) },
]

// Highlight covers: Instagram shows the centre as a small circle.
const ICONS = {
  work: '<rect x="14" y="20" width="72" height="52" rx="6"/><path d="M14 32h72"/><path d="M40 86h20M50 72v14"/>',
  law: '<path d="M50 16v68M30 84h40M22 30h56"/><path d="M22 30l-10 26h20zM78 30l-10 26h20z"/><path d="M12 56c0 6 20 6 20 0M68 56c0 6 20 6 20 0"/>',
  medical: '<rect x="18" y="18" width="64" height="64" rx="14"/><path d="M50 34v32M34 50h32"/>',
  leads: '<path d="M14 24h72v44H40l-16 14V68H14z"/><path d="M30 42h40M30 54h26"/>',
  redesign: '<rect x="14" y="18" width="30" height="64" rx="6"/><rect x="56" y="18" width="30" height="64" rx="6"/><path d="M44 50h12M50 44l6 6-6 6"/>',
}
const HIGHLIGHTS = Object.entries({ work: 'Work', law: 'Law firms', medical: 'Medical', leads: 'Leads', redesign: 'Free redesign' }).map(([k, label]) => ({
  id: `highlight-${k}`,
  label,
  html: `<div class="f dark" style="align-items:center;justify-content:center"><svg width="360" height="360" viewBox="0 0 100 100" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg></div>`,
}))

const PROFILE = `<div class="f white" style="align-items:center;justify-content:center;padding:0">${MARK('#121316', 560)}</div>`

// ---------------------------------------------------------------------------

const browser = await chromium.launch()
const shot = async (html, w, h, file) => {
  const page = await browser.newPage({ viewport: { width: w, height: h } })
  // Opened from a file so the local font and screenshots load.
  const tmp = join(HERE, '.frame.html')
  writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${html}</body></html>`)
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' })
  rmSync(tmp)
  await page.evaluate(() => document.fonts.ready)
  mkdirSync(dirname(file), { recursive: true })
  await page.screenshot({ path: file })
  await page.close()
}

const made = []
for (const p of POSTS) {
  for (const [i, f] of p.frames.entries()) {
    const file = join(ROOT, 'posts', p.frames.length > 1 ? `${p.id}-${i + 1}.png` : `${p.id}.png`)
    await shot(f, 1080, 1350, file)
    made.push(file)
  }
}
for (const s of STORIES) await shot(s.html, 1080, 1920, join(ROOT, 'stories', `${s.id}.png`)), made.push(s.id)
for (const h of HIGHLIGHTS) await shot(h.html, 1080, 1920, join(ROOT, 'highlights', `${h.id}.png`)), made.push(h.id)
await shot(PROFILE, 1080, 1080, join(ROOT, 'profile', 'profile-photo.png'))
await browser.close()
writeFileSync(join(ROOT, 'src', '.built'), `${made.length + 1} images, ${new Date().toISOString()}\n`)
console.log(`${made.length + 1} images`)
