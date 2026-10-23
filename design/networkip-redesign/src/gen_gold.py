"""Concepts S-W: gold versions of the big-hero white concepts N-R (14-18)."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import gen_hero
from gen_hero import CONCEPTS, BASE_CSS, HERO_CSS, header, big_hero, footer, SRC

# Gold from the logo (#D8A040). A deeper shade is used for gold text and icons on white so they stay readable.
GOLD_CSS = '''
:root{--gold:#d8a040;--gold-deep:#a8771f;--gold-soft:#fbf3e3;--gold-grad:linear-gradient(135deg,#ecc56f 0%,#d8a040 45%,#b9842a 100%)}
.btn-primary{background:var(--gold-grad);color:#1b1306;box-shadow:0 14px 30px -14px rgba(184,132,42,.9)}
.eyebrow{color:var(--gold-deep)}.eyebrow::before{background:var(--gold);height:2px;width:34px}
.bighero .eyebrow{color:#ecc56f}
.bighero h1 .gold{background:linear-gradient(135deg,#f3d58f,#d8a040 55%,#c08a2e);-webkit-background-clip:text;background-clip:text;color:transparent}
.bh-chips li::before{background:#ecc56f;box-shadow:0 0 10px rgba(236,197,111,.8)}
.bh-chips li{border-color:rgba(236,197,111,.35)}
.bighero::after{content:"";position:absolute;left:0;right:0;bottom:0;height:4px;background:var(--gold-grad)}
.hd .btn-primary{color:#1b1306}
.nav a:first-child{box-shadow:inset 0 -2px 0 var(--gold)}
.car{color:var(--head)}.car+.car{border-left-color:rgba(216,160,64,.45)}
.carriers{border-bottom-color:rgba(216,160,64,.35)}
.card-ic{background:var(--gold-soft);color:var(--gold-deep)}
.card-ic .ic{color:var(--gold-deep)}
.more{color:var(--gold-deep)}
.card{border-color:#efe6d4}
.points .ic{color:var(--gold-deep)}
.stat dd{background:linear-gradient(135deg,#c99134 0%,#a8771f 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.stat dd::after{background:var(--gold)!important;-webkit-text-fill-color:initial}
.stats{border-top-color:rgba(216,160,64,.55)}
.facts{border-color:#efe6d4}.facts li::before{background:var(--gold)}
.ft h4::after{background:var(--gold)}
.ft{position:relative}.ft::before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:var(--gold-grad)}
'''

TWEAKS = {
    # N: blue page accents become gold; blue kept only in the hero.
    '14-hero-white-blue': '''
.sec-market{background:linear-gradient(90deg,#fbf8f2 0 42%,rgba(251,248,242,.82) 62%,rgba(251,248,242,.45)),var(--map) center/cover no-repeat,#fbf8f2}
.cta{background:#03101f}.cta .btn-primary{color:#1b1306}
''',
    # O: keep the red contact band, give it a gold button; red stays as a secondary accent.
    '15-hero-white-red': '''
.card:nth-child(-n+3){border-top-color:var(--gold)}
.sec-market{background:linear-gradient(90deg,#fbf8f2 0 42%,rgba(251,248,242,.82) 62%,rgba(251,248,242,.45)),var(--map) center/cover no-repeat,#fbf8f2}
.cta .btn-primary{background:var(--gold-grad);color:#1b1306}
.facts li::before{background:var(--red)}
''',
    # P: gold-edged overlap card with gold numbers.
    '16-hero-white-overlap': '''
.overlap{border-bottom:4px solid var(--gold);box-shadow:0 30px 70px -30px rgba(3,16,31,.55),0 0 0 1px rgba(216,160,64,.25)}
.ov-stats dd{background:linear-gradient(135deg,#c99134,#a8771f);-webkit-background-clip:text;background-clip:text;color:transparent}
.card-ic{background:none}
.card-ic .ic{color:var(--gold-deep)}
.points li{border-left-color:var(--gold)}
.sec-platform{background:#fbf8f2}
''',
    # Q: warm cream bands instead of pale blue; gold-tinted contact band.
    '17-hero-white-curve': '''
.bighero::after{left:-10%;right:-10%;bottom:-120px;height:220px;background:#fff;border-radius:50% 50% 0 0/100% 100% 0 0;box-shadow:0 -4px 0 #d8a040,0 -14px 30px -10px rgba(216,160,64,.55)}
.sec-market,.sec-about{background:#fbf7ef}
.stats-2 .stat{background:#fffdf8}
.cta{background:linear-gradient(120deg,#fbf3e3,#f5e6c7);border-top:0}
''',
    # R: all-white page with gold rules, gold numbers and a gold-framed call to action.
    '18-hero-all-white': '''
.card h3{border-top-color:var(--gold)}
.stats-2 .stat{border-top-color:var(--gold)}
.card-ic{background:none}
.cta .cta-in{border-color:rgba(216,160,64,.5);box-shadow:0 24px 60px -36px rgba(168,119,31,.55)}
''',
}

NAMES = {
    '14-hero-white-blue': '19-gold-hero-blue',
    '15-hero-white-red': '20-gold-hero-red',
    '16-hero-white-overlap': '21-gold-hero-overlap',
    '17-hero-white-curve': '22-gold-hero-curve',
    '18-hero-all-white': '23-gold-hero-all-white',
}


def gold_hero(extra=''):
    return big_hero(extra).replace('Built for Mobile Growth', 'Built for <span class="gold">Mobile Growth</span>')


def write():
    for src_name, new_name in NAMES.items():
        c = CONCEPTS[src_name]
        html = ('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
                f'<title>{c["title"]} — gold</title><link rel="stylesheet" href="fonts-07-group-light.css">'
                f'<style>{BASE_CSS}{HERO_CSS}{c["css"]}{GOLD_CSS}{TWEAKS[src_name]}</style></head><body>'
                + header('logo-white@2x.png') + '<main>' + gold_hero(c.get('hero_extra', '')) + c['body']()
                + footer(c['footer_logo']) + '</main></body></html>')
        (SRC / f'{new_name}.html').write_text(html)
        print('wrote', new_name)


if __name__ == '__main__':
    write()
