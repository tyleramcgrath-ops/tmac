"""Generate the white-based NetworkIP mockups (concepts J-M) into design/networkip-redesign/src/."""
import pathlib

SRC = pathlib.Path('/home/user/tmac/design/networkip-redesign/src')

ICONS = {
    'globe': '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.8 3.9 5.8 3.9 9s-1.3 6.2-3.9 9c-2.6-2.8-3.9-5.8-3.9-9S9.4 5.8 12 3z"/>',
    'chart': '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    'shield': '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    'plug': '<path d="M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0zM12 17v5"/>',
    'server': '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
    'headset': '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/><path d="M19 20c0 1.1-1.8 2-4 2h-2"/>',
    'phone': '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    'arrow': '<path d="M5 12h14M13 6l6 6-6 6"/>',
}


def icon(name, cls='ic'):
    return f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[name]}</svg>'


SERVICES = [
    ('globe', 'International Calling', 'Bundled and add-on international calling offerings that remove the traditional barrier and consumer confusion.'),
    ('chart', 'Customer Intelligence', 'Customizable reports and flexible data mining with Odessi to plan distribution, marketing and new offerings.'),
    ('shield', 'Call Quality (iQT)', 'Patented iQTechnology® adjusts routing in real time for more successful calls and fewer trouble tickets.'),
    ('plug', 'Integration', 'Turnkey, or integrated with your existing infrastructure through straightforward APIs. Up and running quickly.'),
    ('server', 'Hosted Services Platform', 'Cloud-based turnkey services. No infrastructure, switches or additional technical staff required.'),
    ('headset', 'Carrier & Customer Support', 'Support before, during and after the sale, with a bilingual English and Spanish call center.'),
]

MARKET = [
    ('51.6M', 'foreign-born U.S. residents, 15.6% of the population*'),
    ('80M+', 'addressable market in the USA (25% of US consumers)'),
    ('25+%', 'of mobile subscribers have the need'),
    ('Under 2%', 'value of roaming compared with that need'),
]

PLATFORM = [
    ('6M+', 'calls a day of capacity'),
    ('1B+', 'end-user accounts supported'),
    ('100,000+', 'telephony ports'),
    ('100+', 'international carrier connections'),
]

FACTS = [
    'Privately held Texas technology company, founded 1998',
    '$80M invested in R&D',
    'Exclusive direct connections supporting MVNOs on AT&T, T-Mobile, Verizon and Boost Mobile',
    'Scalable N+x load-sharing server topology on all critical systems',
    'Expertise with Federal and State regulatory requirements',
]

CARRIERS = ['AT&amp;T', 'Verizon', 'T-Mobile', 'Boost Mobile']

LEAD = ('NetworkIP is an international voice service provider with over 25 years of experience. '
        'We enable MNOs and MVNOs to outsource international calling with minimal risk and significant regulatory savings.')


def header(logo='logo-color@2x.png'):
    nav = ''.join(f'<a href="#">{n}</a>' for n in ['About Us', 'Services', 'International Calling', 'Technology', 'Contact Us'])
    return f'''<header class="hd"><div class="wrap hd-in">
  <a class="logo" href="#"><img src="img-white/{logo}" alt="NetworkIP" width="170" height="50"></a>
  <nav class="nav">{nav}</nav>
  <a class="btn btn-primary btn-sm" href="#">Talk to our team {icon('arrow', 'ic-a')}</a>
</div></header>'''


def carriers_strip(label='Direct connections with the major US MNOs'):
    items = ''.join(f'<span class="car">{c}</span>' for c in CARRIERS)
    return f'''<section class="carriers"><div class="wrap carriers-in">
  <p class="carriers-label">{label}</p><div class="carriers-list">{items}</div>
</div></section>'''


def services(title='Turnkey international calling, technology and intelligence.', eyebrow='What we do', style='cards'):
    if style == 'rows':
        items = ''.join(
            f'<li class="row"><span class="row-n">{i + 1:02d}</span><h3>{t}</h3><p>{d}</p>{icon("arrow", "ic-a row-go")}</li>'
            for i, (ic, t, d) in enumerate(SERVICES))
        body = f'<ol class="rows">{items}</ol>'
    else:
        items = ''.join(
            f'<li class="card"><span class="card-ic">{icon(ic)}</span><h3>{t}</h3><p>{d}</p><a class="more" href="#">Learn more {icon("arrow", "ic-a")}</a></li>'
            for ic, t, d in SERVICES)
        body = f'<ul class="cards">{items}</ul>'
    return f'''<section class="sec sec-services"><div class="wrap">
  <div class="head"><p class="eyebrow">{eyebrow}</p><h2>{title}</h2>
  <p class="lead">NetworkIP offers a range of calling solutions on its Hosted Services Platform. Offering international long distance is an easy way to increase revenue and improve loyalty.</p></div>
  {body}
</div></section>'''


def stats_html(items, cls='stats'):
    return f'<dl class="{cls}">' + ''.join(f'<div class="stat"><dt>{l}</dt><dd>{v}</dd></div>' for v, l in items) + '</dl>'


def market(bg_img, title='Call anyone, anywhere. As easy as calling stateside.'):
    return f'''<section class="sec sec-market" style="--map:url('img-white/{bg_img}')"><div class="wrap">
  <div class="market-grid">
    <div><p class="eyebrow">Why international calling</p><h2>{title}</h2>
    <p class="lead">Bundled and add-on worldwide calling gives consumers the least path of resistance to call anywhere in the world, and removes the need for calling apps to reach family and friends.</p>
    <a class="btn btn-ghost" href="#">Explore International Calling {icon('arrow', 'ic-a')}</a></div>
    <ul class="points">
      <li>{icon('globe')}<div><h3>Bundled / add-on worldwide calling</h3><p>Included at no additional cost, calling from and to any phone.</p></div></li>
      <li>{icon('phone')}<div><h3>Direct dialing support</h3><p>Exclusive connections with AT&amp;T, Verizon, T-Mobile and Boost Mobile.</p></div></li>
      <li>{icon('shield')}<div><h3>Fraud and abuse controls</h3><p>Proven automated measures that enable casual consumers, not just heavy users.</p></div></li>
    </ul>
  </div>
  {stats_html(MARKET)}
  <p class="foot">*2024: the highest share of foreign-born people in U.S. history. Figures from networkip.net.</p>
</div></section>'''


def platform(title='One platform, so you can focus on your customers.'):
    return f'''<section class="sec sec-platform"><div class="wrap">
  <div class="platform-grid">
    <div><p class="eyebrow">Technology</p><h2>{title}</h2>
    <p class="lead">No infrastructure, switches or additional technical staff. Switching facilities across two geographic regions, enterprise-grade storage and backup, and connections to over 100 international carriers.</p></div>
    {stats_html(PLATFORM, 'stats stats-2')}
  </div>
</div></section>'''


def about(title='Over 25 years of international voice.'):
    facts = ''.join(f'<li>{f}</li>' for f in FACTS)
    return f'''<section class="sec sec-about"><div class="wrap about-grid">
  <div><p class="eyebrow">About NetworkIP</p><h2>{title}</h2>
  <p class="lead">{LEAD} NetworkIP supports direct dialing through its exclusive connections with the major US MNOs.</p>
  <a class="btn btn-primary" href="#">About us {icon('arrow', 'ic-a')}</a></div>
  <div class="facts"><h3>NetworkIP facts</h3><ul>{facts}</ul></div>
</div></section>'''


def cta():
    return f'''<section class="cta"><div class="wrap cta-in">
  <div><h2>Still have questions? Let’s chat.</h2><p>Get in touch by phone or email, or leave us a message and we’ll get back to you as soon as possible.</p></div>
  <div class="cta-actions"><a class="btn btn-primary" href="#">Contact us {icon('arrow', 'ic-a')}</a><a class="cta-tel" href="#">512-423-0748</a></div>
</div></section>'''


def footer(logo='logo-white@2x.png'):
    cols = {'Company': ['About Us', 'Management', 'Contact Us'], 'Service': ['International Calling', 'Customer Intelligence'], 'Technology': ['Integration', 'Call Quality']}
    c = ''.join(f'<div><h4>{k}</h4>' + ''.join(f'<a href="#">{x}</a>' for x in v) + '</div>' for k, v in cols.items())
    return f'''<footer class="ft"><div class="wrap ft-grid">
  <div><img src="img-white/{logo}" alt="NetworkIP" width="170" height="50"><p>119 West Tyler Street, Suite 100<br>Longview, Texas 75601<br>512-423-0748 · marketing@networkip.net</p></div>{c}
</div><div class="wrap ft-bottom"><span>All rights reserved by NetworkIP © 2026.</span><a href="#">Privacy Policy</a></div></footer>'''


BASE_CSS = '''
*{box-sizing:border-box}html,body{margin:0;overflow-x:hidden}
body{background:var(--bg);color:var(--ink);font-family:var(--font);font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased}
img{display:block;max-width:100%}a{color:inherit;text-decoration:none}
h1,h2,h3,h4{margin:0;color:var(--head);letter-spacing:-.02em;line-height:1.08;font-weight:800}
h1{font-size:clamp(2.6rem,1.6rem + 4vw,5rem);letter-spacing:-.035em;line-height:1.02}
h2{font-size:clamp(1.9rem,1.3rem + 2vw,3rem)}h3{font-size:1.16rem;letter-spacing:-.01em;line-height:1.25}
p{margin:0}
.wrap{max-width:1240px;margin:0 auto;padding:0 32px}
.ic{width:26px;height:26px}.ic-a{width:18px;height:18px}
.eyebrow{display:flex;align-items:center;gap:12px;font-size:.76rem;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:var(--eyebrow);margin-bottom:18px}
.eyebrow::before{content:"";width:28px;height:2px;background:var(--gold)}
.lead{font-size:1.1rem;color:var(--muted);max-width:60ch;margin-top:18px}
.btn{display:inline-flex;align-items:center;gap:10px;height:54px;padding:0 26px;border-radius:var(--btn-r);font-weight:700;font-size:1rem;border:1.5px solid transparent;white-space:nowrap}
.btn-sm{height:44px;padding:0 20px;font-size:.92rem}
.btn-primary{background:var(--red);color:#fff;box-shadow:0 12px 26px -12px rgba(163,20,31,.7)}
.btn-ghost{border-color:var(--line-strong);color:var(--head)}
.hd{position:relative;z-index:5;background:var(--hd-bg);border-bottom:1px solid var(--line)}
.hd-in{display:flex;align-items:center;gap:40px;height:88px}
.logo img{height:46px;width:auto}
.nav{display:flex;gap:30px;margin-left:auto;font-size:.95rem;font-weight:600;color:var(--nav)}
.nav a:first-child{color:var(--head);box-shadow:inset 0 -2px 0 var(--red);padding-bottom:4px}
.sec{padding:110px 0}
.head{max-width:760px;margin-bottom:56px}
.cards{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--card-r);padding:32px 30px;display:flex;flex-direction:column;gap:12px}
.card p{color:var(--muted);font-size:.97rem}
.card-ic{width:52px;height:52px;border-radius:12px;display:grid;place-items:center;color:var(--icon);background:var(--icon-bg);margin-bottom:8px}
.more{margin-top:auto;padding-top:10px;display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:.92rem;color:var(--link)}
.carriers{border-bottom:1px solid var(--line);background:var(--strip-bg)}
.carriers-in{display:flex;align-items:center;gap:40px;padding-top:30px;padding-bottom:30px}
.carriers-label{font-size:.74rem;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);max-width:230px;line-height:1.5}
.carriers-list{display:flex;flex:1;justify-content:space-between;gap:20px}
.car{font-size:1.5rem;font-weight:800;letter-spacing:-.02em;color:var(--car)}
.car+.car{padding-left:20px;border-left:1px solid var(--line)}
.market-grid,.platform-grid,.about-grid{display:grid;grid-template-columns:1.1fr 1fr;gap:72px;align-items:start}
.points{list-style:none;margin:0;padding:0;display:grid;gap:16px}
.points li{display:grid;grid-template-columns:44px 1fr;gap:16px;padding:22px;border-radius:var(--card-r);background:var(--point-bg);border:1px solid var(--line)}
.points .ic{color:var(--icon);width:30px;height:30px;margin-top:2px}
.points p{color:var(--muted);font-size:.95rem;margin-top:6px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);margin:72px 0 0;border-top:1px solid var(--line-strong)}
.stat{display:flex;flex-direction:column-reverse;justify-content:flex-end;padding:28px 24px 0 0}
.stat+.stat{padding-left:24px;border-left:1px solid var(--line)}
.stat dd{margin:0 0 10px;font-size:clamp(2.2rem,1.6rem + 2vw,3.3rem);font-weight:800;letter-spacing:-.04em;line-height:1;color:var(--num)}
.stat dt{font-size:.92rem;color:var(--muted);max-width:24ch}
.stats-2{grid-template-columns:repeat(2,1fr);margin:0;border:0;gap:0}
.stats-2 .stat{padding:28px;border:1px solid var(--line);border-left:1px solid var(--line)}
.foot{margin-top:22px;font-size:.8rem;color:var(--muted)}
.facts{background:var(--card);border:1px solid var(--line);border-radius:var(--card-r);padding:36px}
.facts ul{list-style:none;margin:18px 0 0;padding:0;display:grid;gap:14px}
.facts li{position:relative;padding-left:28px;color:var(--ink)}
.facts li::before{content:"";position:absolute;left:0;top:.55em;width:12px;height:2px;background:var(--red)}
.about-grid .btn{margin-top:30px}
.cta{padding:84px 0;background:var(--cta-bg);color:var(--cta-ink)}
.cta h2{color:var(--cta-head)}.cta p{margin-top:12px;max-width:56ch;opacity:.85}
.cta-in{display:flex;align-items:center;justify-content:space-between;gap:40px}
.cta-actions{display:flex;align-items:center;gap:26px}.cta-tel{font-weight:800;font-size:1.2rem}
.ft{background:var(--ft-bg);color:var(--ft-ink);padding:72px 0 0;font-size:.95rem}
.ft img{height:50px;width:auto;margin-bottom:22px}
.ft-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:40px}
.ft h4{font-size:.76rem;letter-spacing:.2em;text-transform:uppercase;color:var(--ft-head);margin-bottom:18px}
.ft h4::after{content:"";display:block;width:22px;height:2px;background:var(--red);margin-top:10px}
.ft-grid a{display:block;margin-bottom:10px;opacity:.85}
.ft-bottom{display:flex;justify-content:space-between;margin-top:56px;padding-top:22px;padding-bottom:28px;border-top:1px solid var(--ft-line);font-size:.85rem;opacity:.8}
@media (max-width:1100px){.nav{display:none}.hd-in{justify-content:space-between}}
@media (max-width:900px){
 .sec{padding:72px 0}.cards{grid-template-columns:1fr 1fr}
 .market-grid,.platform-grid,.about-grid{grid-template-columns:1fr;gap:40px}
 .stats{grid-template-columns:1fr 1fr}.stat:nth-child(3){padding-left:0;border-left:0}
 .carriers-in{flex-direction:column;align-items:flex-start;gap:16px}.carriers-list{width:100%;flex-wrap:wrap}
 .cta-in{flex-direction:column;align-items:flex-start}.ft-grid{grid-template-columns:1fr 1fr}
}
@media (max-width:560px){
 .wrap{padding:0 18px}.cards{grid-template-columns:1fr}.btn-sm{display:none}
 .car{font-size:1.15rem}.car+.car{padding-left:0;border-left:0}.carriers-list{gap:8px 20px;justify-content:flex-start}
 .stats-2{grid-template-columns:1fr 1fr}.stats-2 .stat{padding:20px}
 .stat,.stat+.stat{padding:22px 12px 0 0}.stat:nth-child(even){padding-left:14px;border-left:1px solid var(--line)}
 .stats-2 .stat:nth-child(even){padding-left:20px}
 .points li{grid-template-columns:1fr}.cta-actions{flex-direction:column;align-items:flex-start}
 .ft-grid{grid-template-columns:1fr}
}
'''


CONCEPTS = {}

# ---------------------------------------------------------------- J: White + Red
CONCEPTS['10-white-red'] = dict(
    title='NetworkIP — White & Red', fonts=['fonts-07-group-light.css'],
    css='''
:root{--font:"Manrope",system-ui,sans-serif;--bg:#fff;--ink:#22252b;--head:#0d0e11;--muted:#5d636d;--eyebrow:#0d0e11;
--red:#a3141f;--gold:#d8a040;--line:#e7e8ec;--line-strong:#d4d6dc;--card:#fff;--card-r:14px;--btn-r:999px;
--icon:#a3141f;--icon-bg:#fbecec;--link:#a3141f;--num:#0d0e11;--strip-bg:#fff;--car:#2a2d33;--point-bg:#fff;--nav:#3a3e46;--hd-bg:#fff;
--cta-bg:#a3141f;--cta-ink:#fff;--cta-head:#fff;--ft-bg:#0d0e11;--ft-ink:#c9ccd3;--ft-head:#fff;--ft-line:#25272d}
.hero{padding:70px 0 90px;overflow:hidden}
.hero-grid{display:grid;grid-template-columns:1.05fr 1fr;gap:40px;align-items:center}
.hero h1 em{font-style:normal;color:var(--red)}
.hero .lead{font-size:1.18rem}
.hero-actions{display:flex;gap:14px;margin-top:36px;flex-wrap:wrap}
.globe-wrap{position:relative;aspect-ratio:1;max-width:620px;margin-left:auto;width:100%}
.globe-wrap::before{content:"";position:absolute;inset:-18px;border-radius:50%;border:1px solid #f0d7d9}
.globe-wrap::after{content:"";position:absolute;inset:-46px;border-radius:50%;border:1px dashed #efe2c6}
.globe{width:100%;height:100%;border-radius:50%;object-fit:cover;object-position:68% 50%;box-shadow:0 40px 90px -30px rgba(163,20,31,.55)}
.badge{position:absolute;left:-30px;bottom:60px;background:#fff;border-radius:16px;padding:18px 22px;box-shadow:0 20px 50px -18px rgba(13,14,17,.35);border:1px solid var(--line)}
.badge strong{display:block;font-size:2rem;letter-spacing:-.03em;color:var(--red);line-height:1}
.badge span{font-size:.85rem;color:var(--muted)}
.card{transition:none;box-shadow:0 1px 0 rgba(0,0,0,.02)}
.card:nth-child(1){border-top:3px solid var(--red)}
.sec-market{background:linear-gradient(90deg,#f7f7f8 0 42%,rgba(247,247,248,.75) 62%,rgba(247,247,248,.35)),var(--map) center/cover no-repeat,#f7f7f8}
.cta .btn-primary{background:#fff;color:var(--red);box-shadow:0 12px 26px -12px rgba(0,0,0,.4)}
.sec-platform{background:#0d0e11;color:#c9ccd3}.sec-platform h2{color:#fff}.sec-platform .eyebrow{color:#fff}
.sec-platform .lead{color:#a9adb6}.sec-platform .stat{border-color:#2a2c33!important}.sec-platform .stat dd{color:#fff}
.sec-platform .stat dd::after{content:"";display:block;width:26px;height:3px;background:var(--red);margin-top:14px}
.sec-platform .stat dt{color:#a9adb6}
@media (max-width:900px){.hero-grid{grid-template-columns:1fr}.globe-wrap{max-width:420px;margin:30px auto 0}.badge{left:0}}
''',
    hero='''<section class="hero"><div class="wrap hero-grid">
  <div><p class="eyebrow">International voice services</p>
  <h1>International calling, built for <em>mobile growth.</em></h1>
  <p class="lead">''' + LEAD + '''</p>
  <div class="hero-actions"><a class="btn btn-primary" href="#">Talk to our team ''' + icon('arrow', 'ic-a') + '''</a><a class="btn btn-ghost" href="#">Explore International Calling</a></div></div>
  <div class="globe-wrap"><img class="globe" src="img-white/globe-red.jpg" alt=""><div class="badge"><strong>25+</strong><span>years of international voice</span></div></div>
</div></section>''',
    body=lambda: carriers_strip() + services() + market('map-light-red.jpg') + platform() + about() + cta() + footer(),
)

# ---------------------------------------------------------------- K: White + Navy
CONCEPTS['11-white-navy'] = dict(
    title='NetworkIP — White & Navy', fonts=['fonts-06-vibrant.css'],
    css='''
:root{--font:"Plus Jakarta Sans",system-ui,sans-serif;--bg:#fff;--ink:#26324a;--head:#0b2545;--muted:#5b6780;--eyebrow:#0b2545;
--red:#a3141f;--gold:#d8a040;--line:#e3e8f0;--line-strong:#cdd6e3;--card:#fff;--card-r:12px;--btn-r:10px;
--icon:#0b2545;--icon-bg:#eef3fa;--link:#a3141f;--num:#0b2545;--strip-bg:#f6f8fb;--car:#0b2545;--point-bg:rgba(255,255,255,.06);--nav:#33405a;--hd-bg:#fff;
--cta-bg:#f6f8fb;--cta-ink:#26324a;--cta-head:#0b2545;--ft-bg:#0b2545;--ft-ink:#c3cde0;--ft-head:#fff;--ft-line:#1d3a60}
.hero{padding:64px 0 80px}
.hero-grid{display:grid;grid-template-columns:1fr 1.05fr;gap:56px;align-items:center}
.hero h1 span{color:var(--red)}
.hero-actions{display:flex;gap:14px;margin-top:36px;flex-wrap:wrap}
.hero-panel{position:relative;border-radius:22px;overflow:hidden;aspect-ratio:5/4;background:#03101f}
.hero-panel img{width:100%;height:100%;object-fit:cover;object-position:70% 50%}
.hero-panel::after{content:"";position:absolute;left:0;right:0;bottom:0;height:5px;background:linear-gradient(90deg,var(--gold) 0 62%,var(--red) 62%)}
.hero-kpis{position:absolute;left:24px;right:24px;bottom:28px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.hero-kpis div{background:rgba(255,255,255,.95);border-radius:12px;padding:14px 16px}
.hero-kpis strong{display:block;font-size:1.5rem;color:var(--head);letter-spacing:-.03em;line-height:1.1}
.hero-kpis span{font-size:.8rem;color:var(--muted)}
.card-ic{border-radius:10px}
.card:hover{border-color:#cdd6e3}
.sec-services{background:#fff}
.sec-market{background:#0b2545 var(--map) center/cover no-repeat;color:#c3cde0;position:relative}
.sec-market::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(11,37,69,.97) 30%,rgba(11,37,69,.78))}
.sec-market .wrap{position:relative}
.sec-market h2,.sec-market h3,.sec-market .eyebrow{color:#fff}.sec-market .lead,.sec-market .points p,.sec-market .stat dt,.sec-market .foot{color:#b6c2d8}
.sec-market .points li{border-color:rgba(255,255,255,.14)}.sec-market .points .ic{color:#fff}
.sec-market .btn-ghost{color:#fff;border-color:rgba(255,255,255,.4)}
.sec-market .stats{border-color:rgba(255,255,255,.25)}.sec-market .stat{border-color:rgba(255,255,255,.14)!important}
.sec-market .stat dd{color:#fff}
.sec-market .stat dd::after{content:"";display:block;width:26px;height:3px;background:var(--red);margin-top:14px}
.sec-platform{background:#f6f8fb}
.stats-2 .stat{background:#fff}
@media (max-width:900px){.hero-grid{grid-template-columns:1fr}.hero-kpis{grid-template-columns:1fr 1fr 1fr}}
@media (max-width:560px){.hero-kpis{position:static;padding:14px;background:#0b2545;grid-template-columns:1fr}.hero-panel{aspect-ratio:auto}.hero-panel img{aspect-ratio:4/3}}
''',
    hero='''<section class="hero"><div class="wrap hero-grid">
  <div><p class="eyebrow">International voice services</p>
  <h1>Call anyone, anywhere. <span>No worries.</span></h1>
  <p class="lead">''' + LEAD + '''</p>
  <div class="hero-actions"><a class="btn btn-primary" href="#">Talk to our team ''' + icon('arrow', 'ic-a') + '''</a><a class="btn btn-ghost" href="#">Explore International Calling</a></div></div>
  <div class="hero-panel"><img src="img-white/globe-navy.jpg" alt="">
    <div class="hero-kpis"><div><strong>25+</strong><span>years of experience</span></div><div><strong>6M+</strong><span>calls a day capacity</span></div><div><strong>100+</strong><span>international carriers</span></div></div></div>
</div></section>''',
    body=lambda: carriers_strip() + services() + market('map-navy.jpg') + platform() + about() + cta() + footer(),
)

# ---------------------------------------------------------------- L: White + Charcoal (editorial)
CONCEPTS['12-white-charcoal'] = dict(
    title='NetworkIP — White & Charcoal', fonts=['fonts-08-group-dark.css'],
    css='''
:root{--font:"Hanken Grotesk",system-ui,sans-serif;--bg:#fff;--ink:#2a2b30;--head:#17181c;--muted:#64666e;--eyebrow:#17181c;
--red:#a3141f;--gold:#d8a040;--line:#e6e6e9;--line-strong:#17181c;--card:#fff;--card-r:4px;--btn-r:4px;
--icon:#a3141f;--icon-bg:transparent;--link:#a3141f;--num:#17181c;--strip-bg:#fff;--car:#17181c;--point-bg:#fafafa;--nav:#3c3d44;--hd-bg:#fff;
--cta-bg:#17181c;--cta-ink:#e3e3e6;--cta-head:#fff;--ft-bg:#17181c;--ft-ink:#b9bac0;--ft-head:#fff;--ft-line:#2c2d33}
h1,h2{font-weight:800;letter-spacing:-.04em}
.hero{padding:90px 0 0;text-align:left}
.hero-top{display:grid;grid-template-columns:1.4fr 1fr;gap:60px;align-items:end;padding-bottom:56px}
.hero h1{font-size:clamp(2.8rem,1.6rem + 5vw,6rem)}
.hero h1 span{color:var(--red)}
.hero-side .lead{margin-top:0}
.hero-actions{display:flex;gap:14px;margin-top:28px;flex-wrap:wrap}
.hero-band{position:relative;height:460px;background:#0b0c0f url('img-white/globe-mono.jpg') 70% 45%/cover no-repeat}
.hero-band::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(11,12,15,.92),rgba(11,12,15,.2) 70%)}
.hero-band .wrap{position:relative;height:100%;display:flex;align-items:flex-end;padding-bottom:44px}
.band-stats{display:grid;grid-template-columns:repeat(4,auto);gap:56px;color:#fff}
.band-stats strong{display:block;font-size:2.6rem;letter-spacing:-.04em;line-height:1}
.band-stats span{font-size:.85rem;color:#b9bac0}
.band-stats div{padding-top:16px;border-top:2px solid var(--red)}
.band-stats div:first-child{border-top-color:var(--gold)}
.rows{list-style:none;margin:0;padding:0;border-top:2px solid var(--head)}
.row{display:grid;grid-template-columns:80px 1.1fr 1.6fr 40px;gap:24px;align-items:center;padding:30px 0;border-bottom:1px solid var(--line)}
.row-n{font-weight:800;color:var(--red);letter-spacing:.1em}
.row h3{font-size:1.5rem;letter-spacing:-.02em}
.row p{color:var(--muted)}
.row-go{color:var(--head);width:24px;height:24px}
.sec-market{background:linear-gradient(90deg,#fff 0 42%,rgba(255,255,255,.75) 62%,rgba(255,255,255,.3)),var(--map) center/cover no-repeat,#fff;border-top:1px solid var(--line)}
.points li{border-radius:4px;border-left:3px solid var(--red)}
.sec-platform{background:#f4f4f5}
.stats-2 .stat{background:#fff}
.facts{border-radius:4px;border-top:3px solid var(--head)}
@media (max-width:900px){.hero-top{grid-template-columns:1fr;gap:28px}.band-stats{grid-template-columns:1fr 1fr;gap:24px}.hero-band{height:520px}
 .row{grid-template-columns:50px 1fr;gap:8px 16px}.row p{grid-column:2}.row-go{display:none}}
''',
    hero='''<section class="hero"><div class="wrap hero-top">
  <div><p class="eyebrow">International voice services</p><h1>Connecting people worldwide<span>.</span></h1></div>
  <div class="hero-side"><p class="lead">''' + LEAD + '''</p>
  <div class="hero-actions"><a class="btn btn-primary" href="#">Talk to our team ''' + icon('arrow', 'ic-a') + '''</a><a class="btn btn-ghost" href="#">Our services</a></div></div>
</div>
<div class="hero-band"><div class="wrap"><div class="band-stats">
  <div><strong>1998</strong><span>founded in Texas</span></div><div><strong>25+</strong><span>years of experience</span></div>
  <div><strong>6M+</strong><span>calls a day capacity</span></div><div><strong>4</strong><span>major US MNOs, direct</span></div>
</div></div></div></section>''',
    body=lambda: carriers_strip() + services(style='rows') + market('map-light.jpg') + platform() + about() + cta() + footer(),
)

# ---------------------------------------------------------------- M: White + Steel blue (soft)
CONCEPTS['13-white-steel'] = dict(
    title='NetworkIP — White & Steel', fonts=['fonts-03-homeline.css'],
    css='''
:root{--font:"Figtree",system-ui,sans-serif;--bg:#fff;--ink:#28364a;--head:#13263d;--muted:#5d6c80;--eyebrow:#2f5b8a;
--red:#a3141f;--gold:#d8a040;--line:#e2e9f1;--line-strong:#c9d6e4;--card:#fff;--card-r:18px;--btn-r:999px;
--icon:#2f5b8a;--icon-bg:#e9f1f9;--link:#a3141f;--num:#13263d;--strip-bg:#fff;--car:#2f5b8a;--point-bg:#fff;--nav:#34465e;--hd-bg:rgba(255,255,255,.9);
--cta-bg:linear-gradient(120deg,#13263d,#2f5b8a);--cta-ink:#dbe6f2;--cta-head:#fff;--ft-bg:#0f1f33;--ft-ink:#b8c6d8;--ft-head:#fff;--ft-line:#22364f}
.hero{position:relative;padding:80px 0 96px;background:#f2f6fb url('img-white/map-light-steel.jpg') center 30%/cover no-repeat;text-align:center;overflow:hidden}
.hero::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(255,255,255,.85),rgba(255,255,255,.35) 70%)}
.hero .wrap{position:relative;z-index:1}
.hero .eyebrow{justify-content:center}
.hero h1{max-width:15ch;margin:0 auto}
.hero h1 span{color:var(--red)}
.hero .lead{margin:22px auto 0}
.hero-actions{display:flex;gap:14px;justify-content:center;margin-top:34px;flex-wrap:wrap}
.chips{display:flex;justify-content:center;flex-wrap:wrap;gap:12px;margin-top:48px}
.chips span{background:#fff;border:1px solid var(--line);border-radius:999px;padding:10px 18px;font-weight:700;font-size:.92rem;color:var(--head);box-shadow:0 10px 30px -18px rgba(19,38,61,.5)}
.chips span::before{content:"";display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--red);margin-right:10px;vertical-align:1px}
.card{box-shadow:0 18px 44px -26px rgba(19,38,61,.45);border-color:#edf2f7}
.sec-services{background:#fff}
.sec-market{background:#f2f6fb}
.points li{box-shadow:0 14px 34px -24px rgba(19,38,61,.4);border-color:#edf2f7}
.sec-market .stats{background:#fff;border:0;border-radius:18px;padding:8px 28px 28px;box-shadow:0 18px 44px -26px rgba(19,38,61,.45)}
.sec-platform{background:#fff}
.sec-platform .stats-2 .stat{border-radius:0;background:#f7fafd}
.sec-about{background:#f2f6fb}
.facts{box-shadow:0 18px 44px -26px rgba(19,38,61,.45);border-color:#edf2f7}
.cta{border-radius:24px;margin:0 32px 72px}
.globe-thumb{width:180px;height:180px;border-radius:50%;object-fit:cover;object-position:70% 50%;margin:0 auto 26px;box-shadow:0 20px 50px -20px rgba(19,38,61,.6);border:6px solid #fff}
@media (max-width:560px){.cta{margin:0 12px 40px}.globe-thumb{width:130px;height:130px}}
''',
    hero='''<section class="hero"><div class="wrap">
  <img class="globe-thumb" src="img-white/globe-navy.jpg" alt="">
  <p class="eyebrow">International voice services</p>
  <h1>International calling, <span>made simple</span> for mobile operators.</h1>
  <p class="lead">''' + LEAD + '''</p>
  <div class="hero-actions"><a class="btn btn-primary" href="#">Talk to our team ''' + icon('arrow', 'ic-a') + '''</a><a class="btn btn-ghost" href="#">Explore International Calling</a></div>
  <div class="chips"><span>25+ years of experience</span><span>MNO / MVNO support</span><span>Direct dialing</span><span>6M+ calls a day capacity</span></div>
</div></section>''',
    body=lambda: carriers_strip() + services() + market('map-light-steel.jpg') + platform() + about() + cta() + footer(),
)



def write(concepts):
    for name, c in concepts.items():
        fonts = ''.join(f'<link rel="stylesheet" href="{f}">' for f in c['fonts'])
        html = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{c['title']}</title>{fonts}<style>{BASE_CSS}{c['css']}</style></head>
    <body>{header()}<main>{c['hero']}{c['body']()}</main></body></html>'''
        (SRC / f'{name}.html').write_text(html)
        print('wrote', name)


if __name__ == '__main__':
    write(CONCEPTS)
