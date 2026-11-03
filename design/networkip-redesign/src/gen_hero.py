"""Concepts N-R: the original big dark globe hero, with a mostly white page below."""
import sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from gen_white import (SRC, BASE_CSS, LEAD, icon, header, carriers_strip, services, market, platform,
                       about, cta, footer, stats_html, PLATFORM)

CHIPS = ['25+ years of experience', 'MNO / MVNO support', 'International calling', 'Direct dialing']


def big_hero(extra=''):
    chips = ''.join(f'<li>{c}</li>' for c in CHIPS)
    return f'''<section class="bighero">
  <img class="bh-img" src="img-white/globe-navy.jpg" alt="">
  <div class="wrap bh-in">
    <p class="eyebrow">International voice services</p>
    <h1>International Voice Services Built for Mobile Growth</h1>
    <p class="lead">{LEAD}</p>
    <div class="bh-actions"><a class="btn btn-primary" href="#">Contact Us {icon('arrow', 'ic-a')}</a><a class="btn btn-hero-ghost" href="#">Explore International Calling</a></div>
    <ul class="bh-chips">{chips}</ul>
  </div>{extra}
</section>'''


# Shared styles for the dark hero with the header over it.
HERO_CSS = '''
.hd{position:absolute;left:0;right:0;top:0;background:transparent;border-bottom:1px solid rgba(255,255,255,.12)}
.hd .nav{color:rgba(255,255,255,.86)}.hd .nav a:first-child{color:#fff}
.bighero{position:relative;isolation:isolate;min-height:860px;display:flex;align-items:center;padding:150px 0 110px;background:#03101f;overflow:hidden}
.bh-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:72% 50%;z-index:-2}
.bighero::before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,#03101f 0%,#03101f 28%,rgba(3,16,31,.6) 60%,rgba(3,16,31,.06) 100%),linear-gradient(180deg,rgba(3,16,31,.55),rgba(3,16,31,0) 25%)}
.bh-in{width:100%}
.bighero .eyebrow{color:#fff}
.bighero h1{color:#fff;max-width:13.5ch;font-size:clamp(2.7rem,1.6rem + 3.8vw,4.7rem)}
.bighero .lead{color:#cfdbea;font-size:1.15rem;max-width:56ch;margin-top:24px}
.bh-actions{display:flex;flex-wrap:wrap;gap:14px;margin-top:36px}
.btn-hero-ghost{border-color:rgba(255,255,255,.4);color:#fff;background:rgba(3,16,31,.3)}
.bh-chips{list-style:none;margin:40px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:10px}
.bh-chips li{padding:9px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:rgba(11,33,61,.6);color:#fff;font-size:.86rem;font-weight:700}
.bh-chips li::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--chip-dot);margin-right:9px;vertical-align:2px}
@media (max-width:900px){.bighero{min-height:0;padding:130px 0 80px}.bighero::before{background:linear-gradient(180deg,rgba(3,16,31,.6),rgba(3,16,31,.85) 55%,#03101f)}.bh-img{object-position:78% 50%}}
'''

WHITE_BASE = '''
:root{--font:"Manrope",system-ui,sans-serif;--bg:#fff;--ink:#26303f;--head:#0a1a2f;--muted:#5b6574;--eyebrow:#0a1a2f;
--gold:#d8a040;--line:#e6e9ee;--line-strong:#d3d8e0;--card:#fff;--card-r:12px;--btn-r:10px;--num:#0a1a2f;--strip-bg:#fff;--car:#0a1a2f;
--point-bg:#fff;--nav:#fff;--hd-bg:transparent;--cta-ink:#fff;--cta-head:#fff;--ft-ink:#c3cbd6;--ft-head:#fff}
'''

CONCEPTS = {}

# N: closest to the original, but the page body is white. Blue stays as the accent.
CONCEPTS['14-hero-white-blue'] = dict(
    title='NetworkIP — Big hero, white page (blue)',
    footer_logo='logo-white@2x.png',
    css=WHITE_BASE + '''
:root{--red:#1277ff;--chip-dot:#38d8ff;--icon:#1277ff;--icon-bg:#eaf3ff;--link:#1277ff;--eyebrow:#1277ff;
--cta-bg:#03101f;--ft-bg:#03101f;--ft-line:#14243a}
.btn-primary{background:linear-gradient(135deg,#38d8ff,#1277ff);box-shadow:0 12px 28px -12px rgba(18,119,255,.8)}
.eyebrow::before{background:linear-gradient(90deg,#38d8ff,#1277ff)}
.bighero .eyebrow{color:#38d8ff}
.card{box-shadow:0 1px 2px rgba(10,26,47,.04)}
.sec-market{background:linear-gradient(90deg,#f6f8fb 0 42%,rgba(246,248,251,.8) 62%,rgba(246,248,251,.4)),var(--map) center/cover no-repeat,#f6f8fb}
.stat dd{color:#0a1a2f}
.stat dd::after{content:"";display:block;width:24px;height:3px;background:linear-gradient(90deg,#38d8ff,#1277ff);margin-top:14px}
.stats-2 .stat{background:#fff}
.sec-platform{background:#fff;border-top:1px solid var(--line)}
.facts li::before{background:#1277ff}
.ft h4::after{background:#1277ff}
''',
    body=lambda: carriers_strip() + services() + market('map-light-steel.jpg') + platform() + about() + cta(),
)

# O: same hero, white page, logo red for buttons and accents, gold hairlines.
CONCEPTS['15-hero-white-red'] = dict(
    title='NetworkIP — Big hero, white page (red)',
    footer_logo='logo-white@2x.png',
    css=WHITE_BASE + '''
:root{--red:#a3141f;--chip-dot:#e2454d;--icon:#a3141f;--icon-bg:#fbeeee;--link:#a3141f;
--cta-bg:#a3141f;--ft-bg:#0d1017;--ft-line:#22252d}
.bighero .eyebrow::before{background:var(--gold)}
.bighero::after{content:"";position:absolute;left:0;right:0;bottom:0;height:4px;background:linear-gradient(90deg,var(--gold) 0 60%,var(--red) 60%)}
.card{border-top:3px solid transparent}
.card:nth-child(-n+3){border-top-color:var(--red)}
.sec-market{background:linear-gradient(90deg,#f7f7f8 0 42%,rgba(247,247,248,.78) 62%,rgba(247,247,248,.4)),var(--map) center/cover no-repeat,#f7f7f8}
.stat dd::after{content:"";display:block;width:24px;height:3px;background:var(--red);margin-top:14px}
.stats-2 .stat{background:#fff}
.cta .btn-primary{background:#fff;color:var(--red)}
''',
    body=lambda: carriers_strip() + services() + market('map-light-red.jpg') + platform() + about() + cta(),
)

# P: hero with a white stats card that overlaps into the page; open, borderless service grid.
CONCEPTS['16-hero-white-overlap'] = dict(
    title='NetworkIP — Big hero, overlapping white card',
    footer_logo='logo-white@2x.png',
    hero_extra=f'''<div class="wrap overlap-wrap"><div class="overlap">{stats_html([('1998', 'founded in Texas'), ('25+', 'years of experience'), ('6M+', 'calls a day of capacity'), ('100+', 'international carriers')], 'ov-stats')}</div></div>''',
    css=WHITE_BASE + '''
:root{--red:#a3141f;--chip-dot:#e2454d;--icon:#0a1a2f;--icon-bg:transparent;--link:#a3141f;
--cta-bg:#0a1a2f;--ft-bg:#0a1a2f;--ft-line:#1a2d47}
.bighero{overflow:visible;padding-bottom:180px;margin-bottom:0}
.overlap-wrap{position:absolute;left:0;right:0;bottom:-90px;z-index:2}
.overlap{background:#fff;border-radius:16px;box-shadow:0 30px 70px -30px rgba(3,16,31,.55);padding:10px 16px;border-bottom:4px solid var(--red)}
.ov-stats{display:grid;grid-template-columns:repeat(4,1fr);margin:0}
.ov-stats .stat{display:flex;flex-direction:column-reverse;padding:22px 26px}
.ov-stats .stat+.stat{border-left:1px solid var(--line)}
.ov-stats dd{margin:0 0 6px;font-size:2.4rem;font-weight:800;letter-spacing:-.04em;color:var(--head);line-height:1}
.ov-stats dt{font-size:.88rem;color:var(--muted)}
.carriers{padding-top:120px;border-bottom:0}
.cards{gap:0;border-top:1px solid var(--line)}
.card{border:0;border-radius:0;border-bottom:1px solid var(--line);padding:36px 34px 36px 0}
.card:nth-child(3n+2),.card:nth-child(3n+3){padding-left:34px;border-left:1px solid var(--line)}
.card-ic{width:auto;height:auto;justify-content:start;margin-bottom:4px}
.card-ic .ic{width:32px;height:32px;color:var(--red)}
.sec-market{background:#fff;border-top:1px solid var(--line)}
.points li{border-left:3px solid var(--red);border-radius:6px}
.sec-platform{background:#f7f8fa}
.stats-2 .stat{background:#fff}
@media (max-width:900px){.ov-stats{grid-template-columns:1fr 1fr}.ov-stats .stat:nth-child(3){border-left:0}.overlap-wrap{bottom:-150px}.carriers{padding-top:180px}
 .card,.card:nth-child(3n+2),.card:nth-child(3n+3){padding:28px 0;border-left:0}}
@media (max-width:560px){.ov-stats .stat{padding:16px}.ov-stats dd{font-size:1.8rem}}
''',
    body=lambda: carriers_strip() + services() + market('map-light.jpg') + platform() + about() + cta(),
)

# Q: hero with a curved white bottom edge; white page with pale-blue tinted bands; light footer.
CONCEPTS['17-hero-white-curve'] = dict(
    title='NetworkIP — Big hero, curved edge, light footer',
    footer_logo='logo-color@2x.png',
    css=WHITE_BASE + '''
:root{--red:#a3141f;--chip-dot:#38d8ff;--icon:#1277ff;--icon-bg:#edf4ff;--link:#1277ff;
--cta-bg:#f3f7fc;--cta-ink:#26303f;--cta-head:#0a1a2f;--ft-bg:#fff;--ft-ink:#4b5565;--ft-head:#0a1a2f;--ft-line:#e6e9ee}
.bighero{padding-bottom:170px}
.bighero::after{content:"";position:absolute;left:-10%;right:-10%;bottom:-120px;height:220px;background:#fff;border-radius:50% 50% 0 0/100% 100% 0 0}
.carriers{border-bottom:0;position:relative;z-index:1;margin-top:-40px}
.card{border-radius:16px;box-shadow:0 16px 40px -28px rgba(10,26,47,.5)}
.sec-market{background:#f3f7fc}
.points li{border-radius:14px}
.sec-market .stats{background:#fff;border:0;border-radius:16px;padding:6px 26px 26px;box-shadow:0 16px 40px -28px rgba(10,26,47,.5)}
.stat dd::after{content:"";display:block;width:24px;height:3px;background:var(--red);margin-top:14px}
.sec-about{background:#f3f7fc}
.stats-2 .stat{background:#f8fafd}
.cta{border-top:1px solid #e3eaf3}
.ft{border-top:1px solid var(--line)}
.ft h4::after{background:var(--red)}
''',
    body=lambda: carriers_strip() + services() + market('map-light-steel.jpg') + platform() + about() + cta(),
)

# R: the most white. Only the hero is dark; everything else white, including the footer.
CONCEPTS['18-hero-all-white'] = dict(
    title='NetworkIP — Big hero, all-white page',
    footer_logo='logo-color@2x.png',
    css=WHITE_BASE + '''
:root{--red:#a3141f;--chip-dot:#e2454d;--icon:#a3141f;--icon-bg:transparent;--link:#a3141f;
--cta-bg:#fff;--cta-ink:#26303f;--cta-head:#0a1a2f;--ft-bg:#fff;--ft-ink:#4b5565;--ft-head:#0a1a2f;--ft-line:#e6e9ee}
.sec{padding:120px 0}
.carriers{border-bottom:1px solid var(--line)}
.card{border:0;padding:0;border-radius:0;background:none}
.cards{gap:56px 48px}
.card-ic{width:auto;height:auto;margin-bottom:0;justify-content:start}
.card-ic .ic{width:30px;height:30px}
.card h3{font-size:1.3rem;padding-top:16px;border-top:2px solid var(--head)}
.sec-market{background:linear-gradient(90deg,#fff 0 40%,rgba(255,255,255,.75) 62%,rgba(255,255,255,.35)),var(--map) center/cover no-repeat,#fff;border-top:1px solid var(--line)}
.points li{background:#fff}
.stat dd::after{content:"";display:block;width:24px;height:3px;background:var(--red);margin-top:14px}
.sec-platform{border-top:1px solid var(--line)}
.stats-2{gap:0}.stats-2 .stat{border:0;border-top:2px solid var(--head);margin:0 0 18px;background:none;padding:22px 20px 0 0}
.cta .cta-in{border:1px solid var(--line);border-radius:16px;padding:48px;box-shadow:0 24px 60px -36px rgba(10,26,47,.45)}
.cta{padding:20px 0 100px}
.ft{border-top:1px solid var(--line)}
@media (max-width:560px){.cta .cta-in{padding:28px}}
''',
    body=lambda: carriers_strip() + services() + market('map-light.jpg') + platform() + about() + cta(),
)


def write():
    for name, c in CONCEPTS.items():
        html = ('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
                f'<title>{c["title"]}</title><link rel="stylesheet" href="fonts-07-group-light.css">'
                f'<style>{BASE_CSS}{HERO_CSS}{c["css"]}</style></head><body>'
                + header('logo-white@2x.png') + '<main>' + big_hero(c.get('hero_extra', '')) + c['body']()
                + footer(c['footer_logo']) + '</main></body></html>')
        (SRC / f'{name}.html').write_text(html)
        print('wrote', name)


if __name__ == '__main__':
    write()
