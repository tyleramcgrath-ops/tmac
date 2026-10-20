// Renders the We Have Rehabs Instagram kit to PNG/JPG with Playwright.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2];
const BRAND = '/home/user/tmac/wehaverehabs/brand/svg';
const IMG = '/home/user/tmac/wehaverehabs/wp-theme/wehaverehabs/assets/img';
const TMP = path.join(__dirname, 'html');
fs.mkdirSync(TMP, { recursive: true });

const C = { ivory: '#F7F5EE', sand: '#E8E6D8', forest: '#485848', deep: '#2F3A2F', sage: '#809070', soft: '#A9B596', gold: '#BC9D6C', dgold: '#8C6E3E', text: '#2F3A2F', muted: '#5B6358' };
const svg = n => 'file://' + BRAND + '/' + n + '.svg';
const img = n => 'file://' + IMG + '/' + n + '.jpg';

const base = (w, h, body, bg = C.ivory) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500&family=Cinzel:wght@400;500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${w}px;height:${h}px;overflow:hidden;background:${bg};color:${C.text};font-family:Jost,sans-serif}
.serif{font-family:'Cormorant Garamond',serif}
.eyebrow{font-family:Cinzel,serif;letter-spacing:.32em;text-transform:uppercase;font-size:26px;color:${C.dgold}}
.dark .eyebrow{color:${C.gold}}
.dark{color:${C.ivory}}
.photo{position:absolute;inset:0;background-size:cover;background-position:center}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(28,35,28,.15) 0%,rgba(28,35,28,.25) 40%,rgba(28,35,28,.86) 100%)}
.foot{position:absolute;left:0;right:0;bottom:56px;display:flex;align-items:center;justify-content:center;gap:16px;font-family:Cinzel,serif;font-size:20px;letter-spacing:.3em;text-transform:uppercase}
.foot img{height:30px}
.rule{width:90px;height:2px;background:${C.gold};margin:34px 0}
.num{font-family:'Cormorant Garamond',serif;font-size:40px;color:${C.dgold};width:70px;flex:none}
.swipe{position:absolute;right:70px;bottom:58px;font-family:Cinzel,serif;font-size:20px;letter-spacing:.3em;text-transform:uppercase}
</style></head><body>${body}</body></html>`;

const footer = (dark) => `<div class="foot" style="color:${dark ? C.soft : C.forest}"><img src="${svg(dark ? 'mark-lotus-reversed' : 'mark-lotus')}">wehaverehabs.com</div>`;

// Photo cover with headline.
const photoCover = (photo, eyebrow, title, sub, swipe) => `
<div class="photo" style="background-image:url(${img(photo)})"></div><div class="shade"></div>
<div class="dark" style="position:absolute;left:80px;right:80px;bottom:150px">
 <div class="eyebrow">${eyebrow}</div>
 <h1 class="serif" style="font-weight:500;font-size:92px;line-height:1.02;margin-top:26px">${title}</h1>
 ${sub ? `<p style="font-size:30px;font-weight:300;line-height:1.45;margin-top:28px;color:#E9E7DC">${sub}</p>` : ''}
</div>${footer(true)}${swipe ? `<div class="swipe dark" style="color:${C.gold}">Swipe →</div>` : ''}`;

// Text slide on ivory.
const textSlide = (eyebrow, title, items, page) => `
<div style="position:absolute;inset:0;padding:120px 90px 0">
 <div class="eyebrow">${eyebrow}</div>
 ${title ? `<h2 class="serif" style="font-weight:500;font-size:80px;line-height:1.05;margin-top:24px">${title}</h2>` : ''}
 <div class="rule"></div>
 <div style="display:flex;flex-direction:column;gap:52px">
 ${items.map(([n, t, d]) => `<div style="display:flex;gap:18px;align-items:baseline"><span class="num">${n}</span><div><div style="font-size:44px;line-height:1.28;font-weight:400">${t}</div>${d ? `<div style="font-size:31px;line-height:1.45;color:${C.muted};font-weight:300;margin-top:12px">${d}</div>` : ''}</div></div>`).join('')}
 </div>
</div>${footer(false)}${page ? `<div style="position:absolute;right:70px;top:70px;font-family:Cinzel;letter-spacing:.2em;font-size:20px;color:${C.sage}">${page}</div>` : ''}`;

const ctaSlide = (line, sub) => `
<div style="position:absolute;inset:0;background:${C.deep}"></div>
<div class="dark" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 110px">
 <img src="${svg('mark-lotus-reversed')}" style="width:200px">
 <h2 class="serif" style="font-weight:500;font-size:72px;line-height:1.08;margin-top:44px">${line}</h2>
 <div class="rule" style="margin:40px auto"></div>
 <p style="font-size:30px;font-weight:300;line-height:1.5;color:#E3E1D4">${sub}</p>
</div>${footer(true)}`;

const W = 1080, H = 1350;
const jobs = [];
const add = (file, body, bg, w = W, h = H) => jobs.push({ file, html: base(w, h, body, bg), w, h });

// Profile picture (Instagram crops to a circle; keep the lotus inside the safe area).
add('01-profile-picture/profile-picture.png', `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><img src="${svg('mark-lotus')}" style="width:700px;margin-top:-20px"></div>`, C.ivory, 1080, 1080);
add('01-profile-picture/profile-picture-dark.png', `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><img src="${svg('mark-lotus-reversed')}" style="width:700px;margin-top:-20px"></div>`, C.deep, 1080, 1080);

// Post 1 — welcome.
add('02-posts/post-01-welcome.jpg', `
<div class="dark" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 100px">
 <img src="${svg('logo-primary-reversed')}" style="width:820px">
 <div class="rule" style="margin:56px auto 46px"></div>
 <p class="serif" style="font-size:54px;line-height:1.2;font-style:italic;color:${C.ivory}">A calm, honest guide to holistic &amp; mental-health rehabs around the world.</p>
 <p style="font-size:28px;font-weight:300;margin-top:40px;color:#D9D7CA;line-height:1.5">Retreats, clinical programs and medically supervised care — searchable by place, need and budget.</p>
</div>${footer(true)}`, C.deep);

// Post 2 — carousel: questions to ask.
const qs = [
  ['Which body licenses you, and what is the licence number?', 'Then check it yourself with that regulator.'],
  ['Are you accredited, and by whom?', ''],
  ['How do you decide what level of care I need?', ''],
  ['Who is on the clinical team, and what are their qualifications?', ''],
  ['How many hours of individual therapy will I have each week?', ''],
  ['Can I see a sample weekly schedule?', ''],
  ['How do you handle detox — is there 24-hour medical cover?', ''],
  ['Do you treat co-occurring mental health conditions?', 'And what do you not treat?'],
  ['What does aftercare look like, and when does planning start?', ''],
  ['Can I have an itemised written quote?', 'What is not included?'],
  ['Do you pay for referrals, or offer free travel or housing?', 'A yes is a red flag.'],
  ['Can I tour in person or by video and speak to a clinician?', ''],
];
add('02-posts/post-02-questions/slide-1.jpg', photoCover('hero', 'The guide', '12 questions to ask before you choose a rehab', 'Save this for the call. Write down every answer — and who gave it.', true));
for (let s = 0; s < 3; s++) {
  add(`02-posts/post-02-questions/slide-${s + 2}.jpg`, textSlide('Questions to ask', s === 0 ? 'Before you commit' : '', qs.slice(s * 4, s * 4 + 4).map((q, i) => [String(s * 4 + i + 1).padStart(2, '0'), q[0], q[1]]), `${s + 2} / 5`));
}
add('02-posts/post-02-questions/slide-5.jpg', ctaSlide('A good program welcomes your questions.', 'Read the full guide, “How to choose a rehab” — link in bio.'));

// Post 3 — quote.
add('02-posts/post-03-quote.jpg', `
<div class="photo" style="background-image:url(${img('grass')});background-position:60% center"></div>
<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(28,35,28,0) 35%,rgba(28,35,28,.8) 100%)"></div>
<div class="dark" style="position:absolute;left:90px;right:90px;bottom:160px">
 <p class="serif" style="font-size:80px;line-height:1.08;font-style:italic">“A good decision rarely has to be made in a rush.”</p>
 <div class="rule" style="margin:36px 0 0"></div>
</div>${footer(true)}`);

// Post 4 — carousel: red flags.
add('02-posts/post-04-red-flags/slide-1.jpg', photoCover('smoke', 'Know the signs', '4 red flags when choosing a rehab', 'Most people in treatment care deeply. A few see vulnerable people as revenue.', true));
const flags = [
  ['Patient brokering', 'A “neutral” helpline or recruiter that is paid to steer you to certain programs. Ask: “Are you paid by the facilities you recommend?”'],
  ['“Guaranteed cure”', 'No honest program can promise one. If a success rate is quoted, ask who was counted, over what period, and who followed up.'],
  ['Pressure tactics', '“Only one bed left.” “The price goes up tomorrow.” A legitimate program gives you time to verify and think.'],
  ['Free flights or free rent', 'Inducements can mean the real money comes from billing your insurance — sometimes for care you don’t need.'],
];
add('02-posts/post-04-red-flags/slide-2.jpg', textSlide('Red flags', 'What to watch for', flags.slice(0, 2).map((f, i) => [String(i + 1).padStart(2, '0'), f[0], f[1]]), '2 / 4'));
add('02-posts/post-04-red-flags/slide-3.jpg', textSlide('Red flags', '', flags.slice(2).map((f, i) => [String(i + 3).padStart(2, '0'), f[0], f[1]]), '3 / 4'));
add('02-posts/post-04-red-flags/slide-4.jpg', ctaSlide('Verify first. Decide calmly.', 'Our guide covers how to check a licence yourself — link in bio.'));

// Post 5 — holistic rehab.
add('02-posts/post-05-holistic.jpg', photoCover('shala', 'Holistic rehab, explained', 'Yoga is not a treatment plan.', 'Real holistic care pairs evidence-based therapy with practices that support the whole person — not a spa week with a new name.', false));

// Post 6 — inpatient vs outpatient.
const col = (h, items) => `<div style="flex:1;background:${C.ivory};padding:46px 38px 50px;border-top:3px solid ${C.gold}"><div class="serif" style="font-size:52px;font-weight:500;line-height:1.05">${h}</div><div style="margin-top:26px;display:flex;flex-direction:column;gap:18px">${items.map(t => `<div style="font-size:31px;line-height:1.4;font-weight:300;padding-left:26px;position:relative"><span style="position:absolute;left:0;top:-2px;color:${C.sage}">•</span>${t}</div>`).join('')}</div></div>`;
add('02-posts/post-06-inpatient-outpatient.jpg', `
<div style="position:absolute;inset:0;background:${C.sand}"></div>
<div style="position:absolute;inset:0;padding:100px 70px 0">
 <div class="eyebrow">Levels of care</div>
 <h2 class="serif" style="font-weight:500;font-size:74px;line-height:1.04;margin-top:22px">Inpatient <i style="color:${C.dgold}">or</i> outpatient?</h2>
 <div style="display:flex;gap:26px;margin-top:54px">
 ${col('Inpatient &amp; residential', ['You live on site, with 24-hour support', 'Suits a risky withdrawal or an unsafe home', 'Room to step away from triggers', 'Harder to fit around work and family'])}
 ${col('Outpatient &amp; IOP', ['You live at home and attend sessions', 'Suits a safe, supportive home', 'Keeps work, study and care going', 'Practise new skills in real life, right away'])}
 </div>
 <p style="font-size:30px;font-weight:300;color:${C.muted};margin-top:44px;line-height:1.5">Many people move between levels. A proper clinical assessment should guide the choice.</p>
</div>${footer(false)}`);

// Post 7 — Costa Rica (destination guide).
add('02-posts/post-07-costa-rica.jpg', photoCover('jungle', 'Destination guide', 'Rehab in Costa Rica: what to know before you go', 'Wellness retreat or clinical program? How to vet one from abroad, and how to plan aftercare back home.', false));

// Post 8 — help now.
add('02-posts/post-08-help-now.jpg', `
<div class="dark" style="position:absolute;inset:0;padding:120px 90px 0">
 <div class="eyebrow">If you need help now</div>
 <h2 class="serif" style="font-weight:500;font-size:84px;line-height:1.04;margin-top:24px">You don’t have to work this out alone.</h2>
 <div class="rule"></div>
 ${[['US', 'Call or text <b style="font-weight:500">988</b>', 'Suicide &amp; Crisis Lifeline, 24/7'], ['US', 'SAMHSA Helpline <b style="font-weight:500">1-800-662-4357</b>', 'Free, confidential treatment referral, 24/7'], ['UK', 'Samaritans <b style="font-weight:500">116 123</b>', 'Or NHS 111'], ['Worldwide', '<b style="font-weight:500">findahelpline.com</b>', 'Free helplines in your country']].map(([w, t, d]) => `<div style="display:flex;gap:28px;align-items:baseline;margin-bottom:44px"><span style="font-family:Cinzel;letter-spacing:.2em;font-size:22px;color:${C.gold};width:170px;flex:none">${w}</span><div><div style="font-size:42px;font-weight:300">${t}</div><div style="font-size:28px;color:#C9C7BA;font-weight:300;margin-top:4px">${d}</div></div></div>`).join('')}
 <p style="font-size:24px;color:#C9C7BA;font-weight:300;margin-top:20px">In an emergency, call your local emergency number.</p>
</div>${footer(true)}`, C.forest);

// Post 9 — for facilities.
add('02-posts/post-09-for-facilities.jpg', `
<div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 100px">
 <img src="${svg('mark-lotus')}" style="width:150px">
 <div class="eyebrow" style="margin-top:46px">For rehabs &amp; retreats</div>
 <h2 class="serif" style="font-weight:500;font-size:86px;line-height:1.03;margin-top:24px">Is your program already listed?</h2>
 <div class="rule"></div>
 <p style="font-size:38px;font-weight:300;line-height:1.5;color:${C.muted}">Claim your listing for free to keep your details accurate and receive inquiries directly. Upgrade any time for a full profile with photos.</p>
 <p style="font-size:34px;margin-top:44px;color:${C.forest}">wehaverehabs.com/for-sanctuaries</p>
</div>`);

// Story highlight covers (1080x1920; the centre circle is what shows).
const hl = (name, label, bg, dark) => add(`03-highlight-covers/${name}.png`, `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center"><img src="${svg(dark ? 'mark-lotus-reversed' : 'mark-lotus')}" style="width:560px"></div>`, bg, 1080, 1920);
hl('highlight-guides', 'GUIDES', C.ivory, false);
hl('highlight-places', 'PLACES', C.sand, false);
hl('highlight-help-now', 'HELP NOW', C.forest, true);
hl('highlight-for-rehabs', 'FOR REHABS', C.deep, true);

// One story to start the "Help now" highlight.
add('04-stories/story-help-now.jpg', `
<div class="dark" style="position:absolute;inset:0;padding:300px 90px 0;text-align:center">
 <img src="${svg('mark-lotus-reversed')}" style="width:180px">
 <h2 class="serif" style="font-weight:500;font-size:86px;line-height:1.05;margin-top:50px">Need help right now?</h2>
 <div class="rule" style="margin:50px auto"></div>
 <p style="font-size:42px;font-weight:300;line-height:1.6">US: call or text <b style="font-weight:500">988</b><br>SAMHSA: <b style="font-weight:500">1-800-662-4357</b><br>UK: Samaritans <b style="font-weight:500">116 123</b><br>Worldwide: <b style="font-weight:500">findahelpline.com</b></p>
 <p style="font-size:30px;font-weight:300;color:#C9C7BA;margin-top:60px">In an emergency, call your local emergency number.</p>
</div>`, C.forest, 1080, 1920);
add('04-stories/story-welcome.jpg', `
<div class="photo" style="background-image:url(${img('bali')})"></div><div class="shade"></div>
<div class="dark" style="position:absolute;left:90px;right:90px;bottom:330px;text-align:center">
 <img src="${svg('logo-primary-reversed')}" style="width:760px">
 <p class="serif" style="font-size:58px;font-style:italic;line-height:1.2;margin-top:50px">Find a place to heal.</p>
 <p style="font-size:32px;font-weight:300;margin-top:30px;color:#E3E1D4">Holistic &amp; mental-health rehabs worldwide</p>
</div>`, C.deep, 1080, 1920);

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const [i, j] of jobs.entries()) {
    const f = path.join(TMP, i + '.html');
    fs.writeFileSync(f, j.html);
    await p.setViewportSize({ width: j.w, height: j.h });
    await p.goto('file://' + f, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(150);
    const out = path.join(OUT, j.file);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await p.screenshot({ path: out, type: out.endsWith('.png') ? 'png' : 'jpeg', quality: out.endsWith('.png') ? undefined : 92 });
    console.log(j.file);
  }
  await b.close();
})();
