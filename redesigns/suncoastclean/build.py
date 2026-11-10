#!/usr/bin/env python3
"""Build the Sun Coast Cleaning and Restoration site.

    python3 build.py                   writes the site into ./site (pages link theme.css)
    python3 build.py --artifact DIR    preview build: CSS inlined, a "redesign concept"
                                       banner on every page, the form switched off

Content comes from content/pages.json and content/posts.json, pulled from
suncoastclean.com's WordPress API on 2026-11-06. Every page's and post's words
are kept as they are; only the markup around them changes (links point at the
new pages, images that were already dead on the live site are dropped, the
YouTube embed becomes a link card).
"""
import argparse
import datetime
import html
import json
import os
import re
import shutil

from bs4 import BeautifulSoup, NavigableString

HERE = os.path.dirname(os.path.abspath(__file__))

PHONE = '(561) 747-8787'
PHONE_TEL = 'tel:+15617478787'
SMS = 'sms:+15617478787'
EMAIL = 'brad@suncoastclean.com'
BRAND = 'Suncoast Cleaning and Restoration'   # the title tag on the live site
FACEBOOK = 'https://www.facebook.com/suncoastcleaningandrestoration/'
TWITTER = 'https://twitter.com/SunCoastClean'
VIDEO_ID = 'yWZ7fcNIKxA'
SITE_URL = 'https://suncoastclean.com'      # canonical addresses keep the live site's /slug/ form
OG_IMAGE = '/img/1600210492486-724fe5c67fb0.jpg'

# Facts about the business, each taken from a page on the live site.
FACTS = [
    ('Established in 1988', 'about-suncoast-carpet-cleaning'),
    ('Owner Bradley Broderick, 30 years of cleaning and restoration experience', 'about-suncoast-carpet-cleaning'),
    ('Nationally certified by the IICRC; an IICRC certified firm since 1998', 'home'),
    ('Better Business Bureau member since 1993', 'home'),
    ('Licensed, bonded and insured (license #1988-09231)', 'about-suncoast-carpet-cleaning'),
    ('Master Technicians on every truck with at least 12 years of experience with Sun Coast', 'about-suncoast-carpet-cleaning'),
    ('Authorized 3M Scotchgard provider', 'about-suncoast-carpet-cleaning'),
    ('Based in Jupiter, FL 33478; serving southeastern Florida from Port St. Lucie to Boca Raton', 'locations'),
]

# Words that tie a news post to a service or a town (matched against post titles).
SERVICE_WORDS = {
    'carpet-cleaning': ['carpet'], 'green-carpet-cleaning': ['green', 'eco', 'natural', 'non-toxic'],
    'tile-and-grout-cleaning': ['tile', 'grout'], 'natural-stone-restoration-and-polishing': ['stone', 'marble', 'hardwood'],
    'shower-stall-cleaning': ['shower'], 'furniture-cleaning-that-gets-out-stains': ['upholstery', 'furniture', 'couch', 'sofa'],
    'leather-cleaning-and-conditioning': ['leather'], 'area-rug-cleaning': ['rug'],
    'drapery-and-curtain-cleaning': ['drap', 'curtain'], 'water-damage-cleaning': ['water damage', 'flood', 'water restoration'],
    'hurricane-clean-up': ['hurricane', 'flood', 'water damage'], 'air-duct-cleaning': ['duct', 'allerg'],
    'commercial-cleaning-for-southern-florida-businesses': ['commercial'],
    'full-home-cleaning': ['home cleaning', 'spring cleaning', 'holiday', 'guests'], 'move-in-cleaning': ['move in', 'move-in'],
}
TOWN_OF = {'jupiter-carpet-cleaning': 'Jupiter', 'palm-beach': 'Palm Beach Gardens', 'port-st-lucie': 'Port St. Lucie',
           'stuart': 'Stuart', 'indiantown': 'Indiantown', 'lake-worth': 'Lake Worth', 'boca-raton': 'Boca Raton',
           'boynton-beach': 'Boynton Beach', 'wellington': 'Wellington', 'west-palm-beach': 'West Palm Beach',
           'royal-palm-beach': 'Royal Palm Beach'}

# Search snippets for the main pages, written from each page's own content.
DESCRIPTIONS = {
    'home': 'Carpet, upholstery, tile and grout, area rug and water damage cleaning in Jupiter and the Palm Beaches since 1988. '
            'Free estimates: (561) 747-8787.',
    'about-suncoast-carpet-cleaning': 'Sun Coast Cleaning and Restoration: established 1988, owner Bradley Broderick, IICRC certified, '
            'licensed, bonded and insured, Master Technicians on every truck.',
    'best-cleaning-services-in-florida': 'Carpet, tile and grout, area rug, drapery, furniture, leather, shower, air duct, water damage '
            'and commercial cleaning from Sun Coast in Jupiter and the Palm Beaches.',
    'locations': 'Sun Coast comes to you across southeastern Florida: Jupiter, Palm Beach Gardens, West Palm Beach, Wellington, '
            'Boca Raton, Stuart, Port St. Lucie and 40 more towns.',
    'contact-us': 'Contact Sun Coast Cleaning and Restoration in Jupiter, FL 33478. Call or text (561) 747-8787 for a free estimate, '
            'leave a testimonial, or ask about open jobs.',
    'get-that-stain-out': 'Sun Coast\'s step-by-step guides to removing 29 common carpet stains, from blood and coffee to '
            'pet stains, ink, wax and gum. If it won\'t lift, call (561) 747-8787.',
    'news': 'Cleaning tips and news from Sun Coast in Jupiter: carpet, tile, upholstery, drapery, leather and water damage advice '
            'for Palm Beach and Martin County homes.',
    'privacy': 'How Sun Coast Cleaning and Restoration collects, uses and protects personal information on suncoastclean.com.',
    'carpet-cleaning': 'Carpet cleaning in Jupiter from Sun Coast: certified technicians, truck-mounted deep steam and dry cleaning '
            'that keeps your carpet looking new and your warranty intact.',
    'green-carpet-cleaning': 'Green carpet cleaning in Jupiter and the Palm Beaches: eco-friendly, all natural, biodegradable and '
            'allergy free alternatives from Sun Coast.',
    'tile-and-grout-cleaning': 'Tile and grout cleaning in Jupiter and the Palm Beaches from Sun Coast: dirty grout lines and dull tile '
            'restored by certified technicians.',
    'natural-stone-restoration-and-polishing': 'Natural stone restoration and polishing in Jupiter and the Palm Beaches: marble, travertine '
            'and other stone floors cleaned and restored by Sun Coast.',
    'shower-stall-cleaning': 'Shower stall cleaning in Jupiter from Sun Coast Cleaning and Restoration: tile, grout, glass and fixtures '
            'cleaned professionally.',
    'furniture-cleaning-that-gets-out-stains': 'Furniture and upholstery cleaning in Jupiter and the Palm Beaches that gets out stains, '
            'from sofas and sleepers to dining chairs. Sun Coast, since 1988.',
    'leather-cleaning-and-conditioning': 'Leather cleaning and conditioning in Jupiter and West Palm Beach from Sun Coast: sofas, chairs '
            'and more cleaned, conditioned and protected.',
    'area-rug-cleaning': 'Fine area rug cleaning in Jupiter and the Palm Beaches: Oriental and specialty rugs cleaned by IICRC Master '
            'Rug Cleaners at Sun Coast Cleaning and Restoration.',
    'drapery-and-curtain-cleaning': 'Drapery and curtain cleaning in Jupiter and Palm Beach from Sun Coast, often without taking them down.',
    'water-damage-cleaning': 'Water damage restoration in Jupiter and the Palm Beaches: extraction, drying and disinfecting by Sun Coast\'s '
            'certified water removal technicians.',
    'hurricane-clean-up': 'Hurricane clean up in Jupiter and the Palm Beaches, 24 hours a day, 7 days a week: water extraction, debris '
            'removal, disinfecting and drying by Sun Coast\'s own technicians.',
    'air-duct-cleaning': 'Air duct cleaning and sanitizing in Jupiter from Sun Coast Cleaning and Restoration, for cleaner air and fewer '
            'allergens at home.',
    'commercial-cleaning-for-southern-florida-businesses': 'Commercial cleaning for southern Florida businesses: carpet, tile, upholstery '
            'and water damage work for offices and shops from Sun Coast in Jupiter.',
    'full-home-cleaning': 'Full home cleaning in Jupiter: air ducts, carpet, tile and grout and furniture cleaned in one visit by Sun Coast '
            'Cleaning and Restoration.',
    'move-in-cleaning': 'Move in cleaning in Jupiter and Palm Beach from Sun Coast: carpet, tile, upholstery and ducts cleaned before you '
            'unpack.',
}

# The live site's main menu, in its order.
NAV_SERVICES = [
    ('carpet-cleaning', 'Carpet Cleaning'),
    ('tile-and-grout-cleaning', 'Tile and Grout Cleaning'),
    ('furniture-cleaning-that-gets-out-stains', 'Furniture Cleaning'),
    ('area-rug-cleaning', 'Area Rug Cleaning'),
    ('water-damage-cleaning', 'Water Damage'),
    ('air-duct-cleaning', 'Air Duct Cleaning in Jupiter &amp; Sanitizing'),
    ('commercial-cleaning-for-southern-florida-businesses', 'Commercial Cleaning'),
    ('green-carpet-cleaning', 'Green Carpet Cleaning'),
]
# Every service page, with a short label for lists.
SERVICES = [
    ('carpet-cleaning', 'Carpet cleaning'),
    ('green-carpet-cleaning', 'Green carpet cleaning'),
    ('tile-and-grout-cleaning', 'Tile and grout cleaning'),
    ('natural-stone-restoration-and-polishing', 'Natural stone restoration'),
    ('shower-stall-cleaning', 'Shower stall cleaning'),
    ('furniture-cleaning-that-gets-out-stains', 'Furniture cleaning'),
    ('leather-cleaning-and-conditioning', 'Leather cleaning'),
    ('area-rug-cleaning', 'Area rug cleaning'),
    ('drapery-and-curtain-cleaning', 'Drapery and curtain cleaning'),
    ('water-damage-cleaning', 'Water damage'),
    ('hurricane-clean-up', 'Hurricane clean up'),
    ('air-duct-cleaning', 'Air duct cleaning'),
    ('commercial-cleaning-for-southern-florida-businesses', 'Commercial cleaning'),
    ('full-home-cleaning', 'Full home cleaning'),
    ('move-in-cleaning', 'Move in cleaning'),
]
SERVICE_SLUGS = [s for s, _ in SERVICES]
LOCATIONS = ['jupiter-carpet-cleaning', 'palm-beach', 'port-st-lucie', 'stuart', 'indiantown', 'lake-worth',
             'boca-raton', 'boynton-beach', 'wellington', 'west-palm-beach', 'royal-palm-beach']
# Old .aspx addresses that still appear in the copy, and where they go now.
ASPX_MAP = {
    'carpet-cleaning-in-florida': 'carpet-cleaning',
    'careers': 'now-hiring',
    'spring-cleaning': 'spring-cleaning-tips',
    'cleaning-services-testimonials': 'home#reviews',
    'admin/pages/leave-a-testimonial-for-suncoast': 'mailto:brad@suncoastclean.com?subject=A%20testimonial%20for%20Sun%20Coast',
}
# Towns on the home page that have their own page.
TOWN_PAGES = {'Jupiter': 'jupiter-carpet-cleaning', 'Palm Beach Gardens': 'palm-beach', 'West Palm Beach': 'west-palm-beach',
              'Lake Worth': 'lake-worth', 'Wellington': 'wellington', 'Boynton Beach': 'boynton-beach',
              'Boca Raton': 'boca-raton', 'Stuart': 'stuart', 'Port St. Lucie': 'port-st-lucie', 'Indiantown': 'indiantown'}
HOME_TOWNS = ['Jupiter', 'Palm Beach Gardens', 'West Palm Beach', 'Palm Beach', 'Lake Worth', 'Wellington', 'Boynton Beach',
              'Delray Beach', 'Boca Raton', 'Stuart', 'Jensen Beach', 'Port St. Lucie', 'Indiantown']

ICONS = '''<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="phone" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>
  <symbol id="chat" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>
  <symbol id="star" viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></symbol>
  <symbol id="chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="fb" viewBox="0 0 24 24"><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.3H7.4V14h2.8v8z"/></symbol>
  <symbol id="tw" viewBox="0 0 24 24"><path d="M22 5.9c-.7.3-1.5.5-2.4.6.9-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 0 0-7 3.7A11.6 11.6 0 0 1 3.4 4.7a4.1 4.1 0 0 0 1.3 5.5c-.7 0-1.3-.2-1.9-.5 0 2 1.4 3.7 3.3 4.1-.6.2-1.2.2-1.9.1a4.1 4.1 0 0 0 3.8 2.8A8.3 8.3 0 0 1 2 18.4 11.7 11.7 0 0 0 8.3 20c7.5 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.1z"/></symbol>
</svg>'''

STAR = '<svg><use href="#star"/></svg>'
STARS = '<div class="stars" aria-hidden="true">' + STAR * 5 + '</div>'


# --------------------------------------------------------------------------- content
def load():
    pages = json.load(open(os.path.join(HERE, 'content/pages.json')))
    posts = json.load(open(os.path.join(HERE, 'content/posts.json')))
    posts.sort(key=lambda p: p['date'], reverse=True)
    return pages, posts


PAGES, POSTS = load()
PAGE_BY_SLUG = {p['slug']: p for p in PAGES}
POST_BY_SLUG = {p['slug']: p for p in POSTS}
STAINS = [p['slug'] for p in PAGES if 3876 <= p['id'] <= 3932]


def title_of(item):
    return html.unescape(item['title']).strip()


def url_for(slug):
    """File name for a page or post slug."""
    if slug == 'home':
        return 'index.html'
    if '#' in slug:
        base, frag = slug.split('#', 1)
        return url_for(base) + '#' + frag
    if slug in PAGE_BY_SLUG:
        return slug + '.html'
    if slug in POST_BY_SLUG:
        return slug + '.html'
    return slug + '.html'


def post_url(post):
    # Two posts share a slug with a page; the page keeps the address, as on the live site.
    if post['slug'] in PAGE_BY_SLUG:
        return post['slug'] + '-post.html'
    return post['slug'] + '.html'


def item_url(item):
    if 'categories' in item or item in POSTS:
        return post_url(item)
    return url_for(item['slug'])


def map_href(href):
    """Point the copy's own links at the new pages. None means drop the link, keep the words."""
    if not href:
        return None
    h = href.strip()
    if h.startswith('AddArticle.aspx'):
        return None
    m = re.match(r'^(?:https?://(?:www\.)?suncoastclean\.com)?(/.*)?$', h)
    if not m:
        return h  # another website
    path = (m.group(1) or '/').strip('/')
    if path == '':
        return 'index.html'
    if path.endswith('.aspx'):
        path = path[:-5]
        path = ASPX_MAP.get(path, path)
    if path == 'home#reviews':
        return 'index.html#reviews'
    if path.startswith('mailto:'):
        return path
    if path in PAGE_BY_SLUG:
        return url_for(path)
    if path in POST_BY_SLUG:
        return post_url(POST_BY_SLUG[path])
    return 'https://suncoastclean.com/' + path + '/'


def excerpt(item, n=170):
    text = BeautifulSoup(item['content'], 'html.parser').get_text(' ')
    text = re.sub(r'\s+', ' ', text).replace('\xa0', ' ').strip()
    if len(text) <= n:
        return text
    cut = text[:n].rsplit(' ', 1)[0]
    return cut.rstrip(' ,.;:') + '…'


def fmt_date(iso):
    d = datetime.date.fromisoformat(iso[:10])
    return d.strftime('%B %-d, %Y')


def video_card(video_id, title='SunCoast Cleaning & Restoration'):
    return (f'<a class="video-card" href="https://www.youtube.com/watch?v={video_id}" target="_blank" rel="noopener">'
            f'<img src="img/yt.jpg" width="480" height="360" alt="" loading="lazy">'
            f'<span class="play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg></span>'
            f'<span>Watch: {html.escape(title)} on YouTube</span></a>')


PHONE_RE = re.compile(r'(1-877-747-8787|\(561\)\s?747-8787|561-747-8787)')


def linkify_phones(soup):
    for node in list(soup.find_all(string=PHONE_RE)):
        if node.find_parent('a'):
            continue
        parts = PHONE_RE.split(str(node))
        if len(parts) == 1:
            continue
        frag = BeautifulSoup('', 'html.parser')
        for i, part in enumerate(parts):
            if i % 2 == 1:
                a = frag.new_tag('a', href=PHONE_TEL)
                a.string = part
                frag.append(a)
            elif part:
                frag.append(NavigableString(part))
        node.replace_with(frag)


def clean(content, slug):
    """The page's own HTML, tidied for the new theme. Words are never changed."""
    soup = BeautifulSoup(content, 'html.parser')
    for t in soup.find_all(['script', 'style']):
        t.decompose()
    for t in soup.find_all(re.compile(r'^o(:|$)')):   # Word's <o:p> leftovers
        t.unwrap()
    for t in soup.find_all(True):
        for a in list(t.attrs):
            keep_dims = t.name == 'img' and a in ('width', 'height')
            if a in ('style', 'dir', 'width', 'height', 'cellspacing', 'cellpadding', 'border', 'align', 'valign',
                     'decoding', 'loading', 'srcset', 'sizes', 'fetchpriority', 'class', 'id') or a.startswith('data-'):
                if not keep_dims:
                    del t.attrs[a]
    # Images that no longer exist on the live site (their /filesimages/ folder is gone).
    for img in soup.find_all('img'):
        src = img.get('src', '')
        if 'filesimages' in src or 'carpetcleangreen' in src:
            parent = img.parent
            img.decompose()
            if parent and parent.name == 'p' and not parent.get_text(strip=True) and not parent.find(True):
                parent.decompose()
    for fr in soup.find_all('iframe'):
        m = re.search(r'youtube\.com/embed/([\w-]+)', fr.get('src', ''))
        if m:
            holder = fr.parent if fr.parent and fr.parent.name == 'p' else fr
            holder.replace_with(NavigableString(f'@@VIDEO:{m.group(1)}@@'))   # swapped in after serialising
        else:
            fr.decompose()
    for d in soup.find_all(['div', 'figure', 'span', 'u']):
        d.unwrap()
    for t in soup.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'li', 'b', 'strong', 'ul', 'ol']):
        if t.decomposed:
            continue
        if not t.get_text(strip=True).replace('\xa0', '').strip() and not t.find(['img', 'a']):
            t.decompose()
    for h in soup.find_all('h1'):        # the page title is the only H1
        h.name = 'h2'
    for a in soup.find_all('a'):
        new = map_href(a.get('href'))
        if new is None:
            a.unwrap()
            continue
        a['href'] = new
        if new.startswith('http'):
            a['target'] = '_blank'
            a['rel'] = 'noopener'
    for tb in soup.find_all('table'):
        tds = tb.find_all('td')
        inner = {c.name for td in tds for c in td.find_all(True)}
        if tds and inner <= {'br'}:
            # a table of town names -> columns of lists
            cols = soup.new_tag('div', attrs={'class': 'town-cols'})
            for td in tds:
                ul = soup.new_tag('ul')
                for line in re.split(r'<br\s*/?>', td.decode_contents()):
                    line = re.sub(r'\s+', ' ', line).strip()
                    if line:
                        li = soup.new_tag('li')
                        li.append(BeautifulSoup(line, 'html.parser'))
                        ul.append(li)
                cols.append(ul)
            tb.replace_with(cols)
        elif tds and all(td.find('h3') for td in tds):
            cards = soup.new_tag('div', attrs={'class': 'cards'})
            for td in tds:
                box = soup.new_tag('div')
                for c in list(td.children):
                    box.append(c)
                cards.append(box)
            tb.replace_with(cards)
        else:
            if tds and all(td.find('a') and len(td.find_all(True)) == 1 for td in tds):
                tb['class'] = 'link-table'
            wrap = soup.new_tag('div', attrs={'class': 'table-wrap'})
            tb.wrap(wrap)
    if slug == 'contact-us':
        for p in soup.find_all('p'):
            if 'Phone:' in p.get_text():
                p['class'] = 'lead-contact'
                for br in p.find_all('br')[:1]:
                    if not br.previous_sibling or not str(br.previous_sibling).strip():
                        br.decompose()
    for h in soup.find_all('h3'):
        if PHONE_RE.match(h.get_text(strip=True)):
            h.name = 'p'
            h['class'] = 'call-box'
    linkify_phones(soup)
    out = str(soup)
    out = re.sub(r'@@VIDEO:([\w-]+)@@', lambda m: video_card(m.group(1)), out)
    out = re.sub(r'\n{3,}', '\n\n', out).strip()
    return out


# --------------------------------------------------------------------------- seo
def esc(s):
    return html.escape(s, quote=True)


def canonical_path(slug, post=None):
    if slug == 'home':
        return '/'
    if post is not None:
        return '/' + post['slug'] + '/'
    return '/' + slug + '/'


def seo_title(item, kind):
    title = title_of(item)
    if kind == 'home':
        return 'Carpet Cleaning Jupiter & Palm Beach | Sun Coast Cleaning'
    if kind == 'stain':
        return f'How to Remove {title} Stains | Sun Coast Cleaning'
    if kind == 'post':
        return f'{title} | Sun Coast News' if len(title) <= 48 else title
    long = f'{title} | Sun Coast Cleaning and Restoration'
    return long if len(long) <= 60 else f'{title} | Sun Coast'


def sentence_cut(text, n=155):
    text = re.sub(r'\s+', ' ', text).strip()
    if len(text) <= n:
        return text
    cut = text[:n]
    m = re.search(r'^(.*[.!?])\s', cut)
    if m and len(m.group(1)) > 70:
        return m.group(1)
    return cut.rsplit(' ', 1)[0].rstrip(' ,.;:') + '…'


def meta_description(item, kind):
    return sentence_cut(_description(item, kind), 158)


def _description(item, kind):
    slug = item['slug']
    if slug in DESCRIPTIONS:
        return DESCRIPTIONS[slug]
    if kind == 'location':
        town = TOWN_OF[slug]
        return (f'{town} carpet cleaning by Sun Coast, since 1988: carpet, tile and grout, upholstery, area rugs and water damage '
                f'restoration in {town}, FL. Free estimates: (561) 747-8787.')
    if kind == 'stain':
        steps = howto_steps(item)
        first = '; '.join(steps[:2]).lower() if steps else ''
        return sentence_cut(f'Sun Coast\'s steps to remove {title_of(item).lower()} stains from carpet: {first}. '
                            f'Test an inconspicuous area first. Still stained? Call (561) 747-8787 in Jupiter.')
    text = BeautifulSoup(item['content'], 'html.parser').get_text(' ').replace('\xa0', ' ')
    return sentence_cut(text) or f'{title_of(item)} from Sun Coast Cleaning and Restoration in Jupiter, Florida.'


def howto_steps(page):
    text = BeautifulSoup(page['content'], 'html.parser').get_text('\n')
    steps = [re.sub(r'^\d+\.\)\s*', '', ln).strip() for ln in text.split('\n') if re.match(r'^\d+\.\)', ln.strip())]
    return [s for s in steps if s]


def breadcrumbs(items):
    """items: [(label, href or None)]; the last is the current page."""
    parts = []
    for i, (label, href) in enumerate(items):
        if href and i < len(items) - 1:
            parts.append(f'<li><a href="{href}">{esc(label)}</a></li>')
        else:
            parts.append(f'<li aria-current="page">{esc(label)}</li>')
    return '<nav class="crumbs" aria-label="Breadcrumb"><ol>' + ''.join(parts) + '</ol></nav>'


def breadcrumb_ld(items):
    els = []
    for i, (label, path) in enumerate(items, 1):
        el = {'@type': 'ListItem', 'position': i, 'name': label}
        if path:
            el['item'] = SITE_URL + path
        els.append(el)
    return {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': els}


BUSINESS_LD = {
    '@context': 'https://schema.org', '@type': 'LocalBusiness', '@id': SITE_URL + '/#business',
    'name': 'Sun Coast Cleaning and Restoration', 'alternateName': 'Suncoast Cleaning and Restoration',
    'url': SITE_URL + '/', 'telephone': '+1-561-747-8787', 'email': EMAIL, 'foundingDate': '1988',
    'image': SITE_URL + '/logo.png', 'logo': SITE_URL + '/logo.png',
    'address': {'@type': 'PostalAddress', 'addressLocality': 'Jupiter', 'addressRegion': 'FL', 'postalCode': '33478', 'addressCountry': 'US'},
    'areaServed': ['Jupiter', 'Palm Beach Gardens', 'West Palm Beach', 'Palm Beach', 'Lake Worth', 'Wellington', 'Boynton Beach',
                   'Delray Beach', 'Boca Raton', 'Stuart', 'Jensen Beach', 'Port St. Lucie', 'Indiantown', 'Royal Palm Beach'],
    'sameAs': [FACEBOOK, TWITTER],
}


def ld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False) + '</script>'


def related_posts(words, exclude=None, n=6):
    words = [w.lower() for w in words]
    out = []
    for p in POSTS:
        if exclude is not None and p['slug'] == exclude:
            continue
        t = title_of(p).lower()
        if any(re.search(r'\b' + re.escape(w), t) for w in words):
            out.append(p)
        if len(out) >= n:
            break
    return out


def related_list(heading, posts, intro=''):
    if not posts:
        return ''
    lis = ''.join(f'<li><a href="{post_url(p)}">{esc(title_of(p))}</a>'
                  f'<time datetime="{p["date"][:10]}">{fmt_date(p["date"])}</time><p>{esc(excerpt(p, 140))}</p></li>' for p in posts)
    return f'<section class="related"><h2>{esc(heading)}</h2>{f"<p>{intro}</p>" if intro else ""}<ul class="news-list">{lis}</ul></section>'


def glance_block():
    lis = ''.join(f'<li>{esc(f)}</li>' for f, _ in FACTS)
    return (f'<section class="glance"><h2>Sun Coast at a glance</h2><ul>{lis}</ul>'
            f'<p>Call or text <a href="{PHONE_TEL}">{PHONE}</a> for a free estimate, or email <a href="mailto:{EMAIL}">{EMAIL}</a>.</p></section>')


def areas_sentence(service_label):
    links = ', '.join(f'<a href="{url_for(s)}">{TOWN_OF[s]}</a>' for s in LOCATIONS)
    return (f'<section class="areas"><h2>Where we offer {esc(service_label.lower())}</h2>'
            f'<p>Sun Coast comes to you in {links}, and the rest of Palm Beach, Martin and St. Lucie counties. '
            f'<a href="{url_for("locations")}">See every town we serve</a>.</p></section>')


def town_services(town):
    links = ''.join(f'<li><a href="{url_for(s)}">{esc(label)}</a></li>' for s, label in SERVICES)
    return (f'<section class="areas"><h2>Cleaning services in {esc(town)}</h2>'
            f'<p>Every Sun Coast service is available in {esc(town)}:</p><ul class="svc-links">{links}</ul></section>')


# --------------------------------------------------------------------------- shell


def nav_html(current):
    def cur(slug):
        return ' aria-current="page"' if slug == current else ''
    dd = ''.join(f'<li><a href="{url_for(s)}"{cur(s)}>{label}</a></li>' for s, label in NAV_SERVICES)
    return f'''<header class="nav">
  <div class="wrap">
    <a class="brand" href="index.html" aria-label="Sun Coast Cleaning and Restoration, home">
      <img class="mark" src="logo-mark.png" width="283" height="162" alt="">
      <span><b>Sun Coast</b><small>Cleaning &amp; Restoration</small></span>
    </a>
    <nav class="links" aria-label="Main">
      <a href="{url_for('about-suncoast-carpet-cleaning')}"{cur('about-suncoast-carpet-cleaning')}>About Us</a>
      <div class="dd"><a href="{url_for('best-cleaning-services-in-florida')}"{cur('best-cleaning-services-in-florida')}>Services<svg aria-hidden="true"><use href="#chev"/></svg></a><ul>{dd}</ul></div>
      <a href="news.html"{cur('news')}>News</a>
      <a href="{url_for('locations')}"{cur('locations')}>Locations</a>
      <a href="{url_for('contact-us')}"{cur('contact-us')}>Contact Us</a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mmenu" aria-label="Menu" onclick="toggleMenu(this)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
      <a class="btn btn-primary" href="#estimate">Free estimate</a>
    </nav>
  </div>
</header>
<nav id="mmenu" class="mobile-menu" hidden aria-label="Menu">
  <div class="wrap">
    <a href="{url_for('about-suncoast-carpet-cleaning')}">About Us</a>
    <a href="{url_for('best-cleaning-services-in-florida')}">Services</a>
    <div class="sub">{''.join(f'<a href="{url_for(s)}">{label}</a>' for s, label in NAV_SERVICES)}</div>
    <a href="news.html">News</a>
    <a href="{url_for('locations')}">Locations</a>
    <a href="{url_for('get-that-stain-out')}">Get That Stain Out!</a>
    <a href="{url_for('contact-us')}">Contact Us</a>
  </div>
</nav>'''


def topbar():
    return f'''<div class="topbar">
  <div class="wrap">
    <span>Call or text <a href="{PHONE_TEL}">{PHONE}</a></span>
    <span class="hide-sm">Free estimates · <a href="mailto:{EMAIL}">{EMAIL}</a></span>
  </div>
</div>'''


def footer():
    svc = ''.join(f'<li><a href="{url_for(s)}">{label}</a></li>' for s, label in SERVICES)
    return f'''<footer class="site">
  <div class="wrap">
    <div class="cols">
      <div>
        <a class="brand logo-tile" href="index.html">
          <img class="logo" src="logo.png" width="283" height="240" alt="Sun Coast Cleaning &amp; Restoration">
        </a>
        <p>Carpet, upholstery, tile and grout, area rug and water damage cleaning in Jupiter and the Palm Beaches since 1988.</p>
        <div class="social">
          <a href="{FACEBOOK}" target="_blank" rel="noopener" aria-label="Facebook"><svg><use href="#fb"/></svg></a>
          <a href="{TWITTER}" target="_blank" rel="noopener" aria-label="Twitter"><svg><use href="#tw"/></svg></a>
        </div>
      </div>
      <div>
        <h4>Contact</h4>
        <ul>
          <li><a href="{PHONE_TEL}">{PHONE}</a></li>
          <li><a href="{SMS}">Text us</a></li>
          <li><a href="mailto:{EMAIL}">{EMAIL}</a></li>
          <li>Jupiter, FL 33478</li>
        </ul>
      </div>
      <div>
        <h4>Services</h4>
        <ul>{svc}</ul>
      </div>
      <div>
        <h4>Company</h4>
        <ul>
          <li><a href="{url_for('about-suncoast-carpet-cleaning')}">About Us</a></li>
          <li><a href="{url_for('locations')}">Locations</a></li>
          <li><a href="news.html">News</a></li>
          <li><a href="{url_for('get-that-stain-out')}">Get That Stain Out!</a></li>
          <li><a href="{url_for('contact-us')}">Contact Us</a></li>
          <li><a href="{url_for('privacy')}">Privacy</a></li>
        </ul>
      </div>
    </div>
    <div class="legal">
      <span>Copyright © Sun Coast Cleaning and Restoration | All Rights Reserved</span>
      <span>License #1988-09231 · IICRC certified firm · BBB member since 1993</span>
    </div>
  </div>
</footer>
<div class="callbar">
  <a class="btn btn-sun" href="{PHONE_TEL}"><svg aria-hidden="true"><use href="#phone"/></svg>Call</a>
  <a class="btn btn-ghost" style="border-color:rgba(255,255,255,.5);color:#fff" href="#estimate">Free estimate</a>
</div>'''


SERVICE_OPTIONS = ['Carpet cleaning', 'Tile and grout', 'Natural stone and polishing', 'Upholstery / furniture',
                   'Leather cleaning', 'Area rug', 'Drapery', 'Water damage', 'Air duct cleaning', 'Shower stall',
                   'Full home cleaning', 'Move in cleaning', 'Commercial']


def estimate_form(compact=False, artifact=False):
    opts = ''.join(f'<option>{o}</option>' for o in SERVICE_OPTIONS)
    note = ('<p class="form-note" id="form-note" hidden>This is a design preview, so the form isn’t connected yet. '
            'On the live site it would send the request to Sun Coast.</p>' if artifact else '')
    if compact:
        return f'''<form class="quote-card" id="estimate" aria-labelledby="est-title" onsubmit="return sendEstimate(event)">
  <h2 id="est-title">Get a free estimate</h2>
  <p class="sub">Tell us what needs cleaning. We'll call or text you back.</p>
  <label class="field"><span>Name</span><input id="est-name" name="name" autocomplete="name" required></label>
  <label class="field"><span>Phone</span><input id="est-phone" name="phone" type="tel" autocomplete="tel" required></label>
  <label class="field"><span>Service</span><select id="est-service" name="service">{opts}</select></label>
  <button class="btn btn-primary" type="submit">Request my free estimate<svg aria-hidden="true"><use href="#arrow"/></svg></button>{note}
  <p class="fine">Or call <a href="{PHONE_TEL}">{PHONE}</a></p>
</form>'''
    return f'''<form class="quote-card" id="estimate" aria-labelledby="est-title" onsubmit="return sendEstimate(event)">
  <h2 id="est-title">Get a free estimate</h2>
  <p class="sub">Tell us what needs cleaning. We'll call or text you back.</p>
  <div class="row2">
    <label class="field"><span>Name</span><input id="est-name" name="name" autocomplete="name" required></label>
    <label class="field"><span>Phone</span><input id="est-phone" name="phone" type="tel" autocomplete="tel" required></label>
  </div>
  <div class="row2">
    <label class="field"><span>Service</span><select id="est-service" name="service">{opts}</select></label>
    <label class="field"><span>ZIP code</span><input id="est-zip" name="zip" inputmode="numeric" autocomplete="postal-code" maxlength="10"></label>
  </div>
  <label class="field"><span>Anything we should know? <em style="font-weight:400;color:var(--muted);font-style:normal">(optional)</em></span><textarea id="est-notes" name="notes" rows="3" placeholder="Rooms, rug size, pet stains, water in the house…"></textarea></label>
  <button class="btn btn-primary" type="submit" style="background:var(--ink);color:#fff">Request my free estimate<svg aria-hidden="true"><use href="#arrow"/></svg></button>{note}
  <p class="fine">Water in the house? Call now: <a href="{PHONE_TEL}">{PHONE}</a></p>
</form>'''


def script(artifact):
    if artifact:
        send = '''function sendEstimate(e){e.preventDefault();var n=document.getElementById('form-note');if(n)n.hidden=false;return false;}'''
    else:
        send = '''// No form backend yet: compose the request as an email to the owner.
function sendEstimate(e){
  e.preventDefault();
  var f=e.target,v=function(n){var el=f.elements[n];return el?(el.value||'').trim():''};
  var body='Name: '+v('name')+'\\nPhone: '+v('phone')+'\\nService: '+v('service')+'\\nZIP: '+v('zip')+'\\n\\n'+v('notes');
  location.href='mailto:'''+EMAIL+'''?subject='+encodeURIComponent('Free estimate request: '+v('service'))+'&body='+encodeURIComponent(body);
  return false;
}'''
    return f'''<script>
{send}
function toggleMenu(b){{var m=document.getElementById('mmenu');var open=m.hidden;m.hidden=!open;b.setAttribute('aria-expanded',open?'true':'false');}}
</script>'''


CSS = open(os.path.join(HERE, 'theme.css')).read()


def layout(title, description, body, *, current='', artifact=False, skeleton=True, jsonld='', seo=None):
    """The full document around a page's body. `seo` carries canonical path, og type, dates, robots and schema."""
    seo = seo or {}
    css = f'<style>\n{CSS}\n</style>' if artifact else '<link rel="stylesheet" href="theme.css">'
    path = seo.get('path', '/')
    robots = 'noindex, nofollow' if artifact else seo.get('robots', 'index, follow, max-image-preview:large, max-snippet:-1')
    og = ''
    if not artifact:
        og = f'''<link rel="canonical" href="{SITE_URL}{path}">
<meta property="og:site_name" content="Sun Coast Cleaning and Restoration">
<meta property="og:type" content="{seo.get('type', 'website')}">
<meta property="og:title" content="{esc(seo.get('ogtitle') or title)}">
<meta property="og:description" content="{esc(description)}">
<meta property="og:url" content="{SITE_URL}{path}">
<meta property="og:image" content="{SITE_URL}{OG_IMAGE}">
<meta property="og:image:width" content="1800">
<meta property="og:image:height" content="1100">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@SunCoastClean">
<meta name="twitter:title" content="{esc(seo.get('ogtitle') or title)}">
<meta name="twitter:description" content="{esc(description)}">
<meta name="twitter:image" content="{SITE_URL}{OG_IMAGE}">'''
        if seo.get('published'):
            og += f'''
<meta property="article:published_time" content="{seo['published']}">
<meta property="article:modified_time" content="{seo.get('modified', seo['published'])}">'''
        jsonld = ''.join(ld(o) for o in seo.get('ld', [])) + jsonld
    head = f'''<title>{esc(title)}</title>
{'<meta name="claude:viewport-fit-sides" content="cover">' if artifact else ''}
<meta name="robots" content="{robots}">
<meta name="description" content="{esc(description)}">
{og}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet">
{css}
{jsonld}'''
    concept = ('<div class="concept" role="note"><div class="wrap"><span><b>Redesign concept</b> for Sun Coast Cleaning and Restoration.</span>'
               '<span>Not the official website. The live site is suncoastclean.com.</span></div></div>\n') if artifact else ''
    doc = f'''{head}
{ICONS}
{concept}{topbar()}
{nav_html(current)}
<main id="top">
{body}
</main>
{footer()}
{script(artifact)}'''
    if skeleton:
        doc = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
{doc}
</body>
</html>
'''
        doc = doc.replace(f'{jsonld}\n{ICONS}', f'{jsonld}\n</head>\n<body>\n{ICONS}', 1)
    return doc


# --------------------------------------------------------------------------- sidebars
def side_list(heading, items, current):
    lis = ''.join(f'<li><a href="{u}"{" aria-current=\"page\"" if s == current else ""}>{esc(label)}</a></li>'
                  for s, u, label in items)
    return f'<div class="side-card"><h3>{heading}</h3><ul>{lis}</ul></div>'


def contact_card():
    return f'''<div class="side-card"><h3>Talk to Sun Coast</h3>
<a class="call" href="{PHONE_TEL}">{PHONE}</a>
<p>Call or text, 7 days a week. Email <a href="mailto:{EMAIL}">{EMAIL}</a>. Jupiter, FL 33478.</p></div>'''


def recent_news(current=''):
    items = []
    for p in POSTS[:6]:
        items.append((p['slug'], post_url(p), title_of(p)))
    lis = ''.join(f'<li><a href="{u}"{" aria-current=\"page\"" if s == current else ""}>{esc(t)}'
                  f'<span class="date">{fmt_date(POST_BY_SLUG[s]["date"])}</span></a></li>' for s, u, t in items)
    return f'<div class="side-card"><h3>Recent news</h3><ul>{lis}</ul><p style="margin-top:12px"><a href="news.html">All news</a></p></div>'


def services_list(current=''):
    return side_list('All services', [(s, url_for(s), label) for s, label in SERVICES], current)


def locations_list(current=''):
    items = [(s, url_for(s), title_of(PAGE_BY_SLUG[s]).replace(' Carpet Cleaning', '')) for s in LOCATIONS]
    return side_list('Areas we serve', items, current)


def stains_list(current=''):
    return side_list('Get that stain out', [(s, url_for(s), title_of(PAGE_BY_SLUG[s])) for s in STAINS], current)


def section_of(slug):
    if slug in SERVICE_SLUGS or slug == 'best-cleaning-services-in-florida':
        return 'services'
    if slug in LOCATIONS or slug == 'locations':
        return 'locations'
    if slug in STAINS or slug == 'get-that-stain-out':
        return 'stains'
    return {'about-suncoast-carpet-cleaning': 'about', 'contact-us': 'contact', 'privacy': 'legal', 'news': 'news'}.get(slug, 'page')


EYEBROWS = {
    'services': ('Services', 'best-cleaning-services-in-florida'),
    'locations': ('Locations', 'locations'),
    'stains': ('Get That Stain Out!', 'get-that-stain-out'),
    'about': ('About Sun Coast', None),
    'contact': ('Contact', None),
    'legal': ('Legal', None),
    'news': ('News', None),
    'page': ('Sun Coast', None),
}


def sidebar_for(slug, section, artifact):
    parts = [estimate_form(compact=True, artifact=artifact)]
    if section == 'services':
        parts.append(services_list(slug))
    elif section == 'locations':
        parts += [locations_list(slug), services_list()]
    elif section == 'stains':
        parts.append(stains_list(slug))
    elif section == 'news':
        parts += [recent_news(slug), services_list()]
    else:
        parts += [contact_card(), services_list()]
    return '\n'.join(parts)


def page_hero(eyebrow_html, title, meta='', crumbs=''):
    return f'''<section class="page-hero">
  <div class="wrap">
    {crumbs}
    <p class="eyebrow">{eyebrow_html}</p>
    <h1>{esc(title)}</h1>
    {f'<p class="meta">{meta}</p>' if meta else ''}
  </div>
</section>'''


# --------------------------------------------------------------------------- pages
def render_page(page, artifact):
    slug = page['slug']
    section = section_of(slug)
    label, link = EYEBROWS[section]
    eyebrow = f'<a href="{url_for(link)}">{label}</a>' if link and link != slug else label
    title = title_of(page)
    kind = {'services': 'service', 'locations': 'location', 'stains': 'stain'}.get(section, 'page')
    if slug in ('best-cleaning-services-in-florida', 'locations', 'get-that-stain-out'):
        kind = 'index'
    if slug == 'get-that-stain-out':
        tiles = ''.join(f'<a href="{url_for(s)}">{esc(title_of(PAGE_BY_SLUG[s]))}</a>' for s in STAINS)
        body_html = (f'<p>Pick the stain for Sun Coast\'s own step-by-step instructions. '
                     f'Please test every method in an inconspicuous area first. If the stain won\'t come out, '
                     f'call <a href="{PHONE_TEL}">{PHONE}</a> and we will have it cleaned today.</p>'
                     f'<div class="tile-grid">{tiles}</div>')
    else:
        body_html = clean(page['content'], slug)

    # Supporting content, all of it from elsewhere on the site.
    extra = ''
    if kind == 'service':
        short = dict(SERVICES)[slug]
        extra += areas_sentence(short)
        extra += related_list(f'News about {short.lower()}', related_posts(SERVICE_WORDS[slug]),
                              'Tips and announcements from Sun Coast on this service.')
        extra += glance_block()
    elif kind == 'location':
        town = TOWN_OF[slug]
        extra += town_services(town)
        extra += related_list(f'News from {town}', related_posts([town]))
        extra += glance_block()
    elif kind == 'stain':
        extra += (f'<section class="areas"><h2>When the stain won\'t come out</h2><p>Sun Coast\'s <a href="{url_for("carpet-cleaning")}">carpet cleaning</a>, '
                  f'<a href="{url_for("furniture-cleaning-that-gets-out-stains")}">furniture cleaning</a> and '
                  f'<a href="{url_for("area-rug-cleaning")}">area rug cleaning</a> technicians treat set-in stains, pet stains and odors every day '
                  f'across Jupiter and the Palm Beaches. Call or text <a href="{PHONE_TEL}">{PHONE}</a> for a free estimate.</p></section>')
        extra += related_list('Stain tips from our news', related_posts(['stain', 'spill', 'ketchup', 'pet stain', 'scotchgard', 'myths']))
    elif slug in ('about-suncoast-carpet-cleaning', 'contact-us', 'locations', 'best-cleaning-services-in-florida'):
        extra += glance_block()

    # Breadcrumbs
    crumbs = [('Home', '/')]
    if link and link != slug:
        crumbs.append((label, canonical_path(link)))
    crumbs.append((title, canonical_path(slug)))
    crumb_links = [('Home', 'index.html')]
    if link and link != slug:
        crumb_links.append((label, url_for(link)))
    crumb_links.append((title, None))

    desc = meta_description(page, kind)
    page_types = {'service': 'WebPage', 'location': 'WebPage', 'stain': 'WebPage', 'index': 'CollectionPage', 'page': 'WebPage'}
    web = {'@context': 'https://schema.org', '@type': page_types[kind], 'name': title, 'description': desc,
           'url': SITE_URL + canonical_path(slug), 'isPartOf': {'@id': SITE_URL + '/#website'}, 'about': {'@id': SITE_URL + '/#business'}}
    if slug == 'about-suncoast-carpet-cleaning':
        web['@type'] = 'AboutPage'
    if slug == 'contact-us':
        web['@type'] = 'ContactPage'
    schemas = [BUSINESS_LD, web, breadcrumb_ld(crumbs)]
    if kind == 'service':
        schemas.append({'@context': 'https://schema.org', '@type': 'Service', 'name': title, 'serviceType': dict(SERVICES)[slug],
                        'description': desc, 'url': SITE_URL + canonical_path(slug),
                        'provider': {'@id': SITE_URL + '/#business'}, 'areaServed': BUSINESS_LD['areaServed']})
    if kind == 'location':
        schemas.append({'@context': 'https://schema.org', '@type': 'Service', 'name': title, 'serviceType': 'Carpet cleaning',
                        'description': desc, 'url': SITE_URL + canonical_path(slug),
                        'provider': {'@id': SITE_URL + '/#business'}, 'areaServed': {'@type': 'City', 'name': TOWN_OF[slug]}})
    if kind == 'stain':
        steps = howto_steps(page)
        if len(steps) >= 2:
            schemas.append({'@context': 'https://schema.org', '@type': 'HowTo', 'name': f'How to remove {title.lower()} stains',
                            'description': desc, 'url': SITE_URL + canonical_path(slug),
                            'step': [{'@type': 'HowToStep', 'position': i, 'text': t} for i, t in enumerate(steps, 1)]})
    seo = {'path': canonical_path(slug), 'ld': schemas, 'ogtitle': title}

    body = page_hero(eyebrow, title, crumbs=breadcrumbs(crumb_links)) + f'''
<div class="wrap page-grid">
  <div>
    <article class="prose">
{body_html}
    </article>
{extra}
  </div>
  <aside class="side">
{sidebar_for(slug, section, artifact)}
  </aside>
</div>'''
    return layout(seo_title(page, kind), desc, body, current=slug, artifact=artifact, seo=seo)


def render_post(post, i, artifact):
    title = title_of(post)
    prev_p = POSTS[i + 1] if i + 1 < len(POSTS) else None   # older
    next_p = POSTS[i - 1] if i > 0 else None                 # newer
    pager = '<nav class="pager" aria-label="More news">'
    if prev_p:
        pager += f'<a href="{post_url(prev_p)}"><small>Older</small>{esc(title_of(prev_p))}</a>'
    if next_p:
        pager += f'<a class="next" href="{post_url(next_p)}"><small>Newer</small>{esc(title_of(next_p))}</a>'
    pager += '</nav>'
    # Services and towns this post is about, from its title; then more reading on the same subjects.
    t = (title + ' ' + excerpt(post, 300)).lower()
    hit = lambda w: re.search(r'\b' + re.escape(w), t)
    about_services = [(s, l) for s, l in SERVICES if any(hit(w) for w in SERVICE_WORDS[s])]
    about_towns = [(s, town) for s, town in TOWN_OF.items() if hit(town.lower())]
    words = [w for s, _ in about_services for w in SERVICE_WORDS[s]] + [town for _, town in about_towns]
    rel = related_posts(words, exclude=post['slug'], n=4) if words else []
    if len(rel) < 4:
        for q in POSTS:
            if q['slug'] != post['slug'] and q not in rel:
                rel.append(q)
            if len(rel) >= 4:
                break
    links = ''.join(f'<li><a href="{url_for(s)}">{esc(l)}</a></li>' for s, l in about_services) + \
            ''.join(f'<li><a href="{url_for(s)}">{esc(town)} carpet cleaning</a></li>' for s, town in about_towns)
    extra = ''
    if links:
        extra += f'<section class="areas"><h2>Sun Coast services in this article</h2><ul class="svc-links">{links}</ul></section>'
    extra += related_list('Related reading', rel)
    shadowed = post['slug'] in PAGE_BY_SLUG
    path = canonical_path(post['slug'], post)
    desc = meta_description(post, 'post')
    crumbs = [('Home', '/'), ('News', '/news/'), (title, path)]
    schemas = [BUSINESS_LD, breadcrumb_ld(crumbs),
               {'@context': 'https://schema.org', '@type': 'Article', 'headline': title, 'description': desc,
                'datePublished': post['date'], 'dateModified': post['modified'], 'url': SITE_URL + path,
                'mainEntityOfPage': SITE_URL + path, 'image': SITE_URL + OG_IMAGE,
                'author': {'@type': 'Organization', 'name': 'Sun Coast Cleaning and Restoration', '@id': SITE_URL + '/#business'},
                'publisher': {'@id': SITE_URL + '/#business'}, 'articleSection': 'News'}]
    seo = {'path': path, 'type': 'article', 'published': post['date'], 'modified': post['modified'], 'ld': schemas, 'ogtitle': title}
    if shadowed:
        seo['robots'] = 'noindex, follow'   # a page owns this address on the live site
    body = page_hero('<a href="news.html">News</a>', title, f'<time datetime="{post["date"][:10]}">{fmt_date(post["date"])}</time>',
                     crumbs=breadcrumbs([('Home', 'index.html'), ('News', 'news.html'), (title, None)])) + f'''
<div class="wrap page-grid">
  <div>
    <article class="prose">
{clean(post['content'], post['slug'])}
    </article>
{extra}
{pager}
  </div>
  <aside class="side">
{sidebar_for(post['slug'], 'news', artifact)}
  </aside>
</div>'''
    return layout(seo_title(post, 'post'), desc, body, current='news', artifact=artifact, seo=seo)


def render_news(artifact):
    years = {}
    for p in POSTS:
        years.setdefault(p['date'][:4], []).append(p)
    out = []
    for y in sorted(years, reverse=True):
        out.append(f'<h2 class="news-year">{y}</h2><ul class="news-list">')
        for p in years[y]:
            out.append(f'<li><h3><a href="{post_url(p)}">{esc(title_of(p))}</a></h3>'
                       f'<time datetime="{p["date"][:10]}">{fmt_date(p["date"])}</time><p>{esc(excerpt(p))}</p></li>')
        out.append('</ul>')
    first, last = POSTS[-1]['date'], POSTS[0]['date']
    crumbs = [('Home', '/'), ('News', '/news/')]
    seo = {'path': '/news/', 'ogtitle': 'News', 'ld': [BUSINESS_LD, breadcrumb_ld(crumbs),
           {'@context': 'https://schema.org', '@type': 'CollectionPage', 'name': 'News', 'url': SITE_URL + '/news/',
            'description': DESCRIPTIONS['news'], 'isPartOf': {'@id': SITE_URL + '/#website'}}]}
    body = page_hero('News', 'News', f'{len(POSTS)} articles, {fmt_date(first)} to {fmt_date(last)}',
                     crumbs=breadcrumbs([('Home', 'index.html'), ('News', None)])) + f'''
<div class="wrap page-grid">
  <article>
{''.join(out)}
  </article>
  <aside class="side">
{sidebar_for('news', 'news', artifact)}
  </aside>
</div>'''
    return layout('News | Sun Coast Cleaning and Restoration', DESCRIPTIONS['news'], body, current='news', artifact=artifact, seo=seo)


# --------------------------------------------------------------------------- home
def home_parts():
    """The home page's own words, read from its content."""
    soup = BeautifulSoup(PAGE_BY_SLUG['home']['content'], 'html.parser')
    text = lambda t: re.sub(r'\s+', ' ', t.get_text(' ')).strip()
    ps = [text(p) for p in soup.find_all('p') if text(p) and not text(p).startswith('Click here')]
    heads = [text(h) for h in soup.find_all('h2')]
    intro = [p for p in ps if p.startswith('A leader') or p.startswith('If you are looking')]
    trusted_h = next(h for h in heads if h.startswith('TRUSTED'))
    trusted = [p for p in ps if p.startswith('Suncoast Cleaning and Restoration')]
    h1 = text(soup.find('h1'))
    reviews = []
    for r in soup.select('.review'):
        q = r.find('q') or r.find('blockquote')
        for br in q.find_all('br'):
            br.replace_with('\n')
        quote = '\n'.join(x.strip() for x in re.sub(r'[ \t]+', ' ', q.get_text()).split('\n') if x.strip())
        name = r.select_one('.company-name strong')
        place = r.select_one('.company-name span')
        reviews.append((quote, text(name) if name else '', text(place) if place else ''))
    return h1, intro, trusted_h, trusted, reviews


def render_home(artifact):
    h1, intro, trusted_h, trusted, reviews = home_parts()
    featured = next(r for r in reviews if r[1].startswith('Gerry'))
    others = [r for r in reviews if r is not featured]

    def review_card(q, a, w):
        paras = ''.join(f'<p>{esc(x.strip())}</p>' for x in q.split('\n') if x.strip())
        who = esc(a) + (f' <span>· {esc(w)}</span>' if w else '')
        return f'<figure class="rev">{STARS}{paras}<footer>{who}</footer></figure>'

    towns = ''.join(
        f'<li class="{"home" if t == "Jupiter" else ""}">' +
        (f'<a href="{url_for(TOWN_PAGES[t])}">{t}</a>' if t in TOWN_PAGES else f'<span>{t}</span>') + '</li>'
        for t in HOME_TOWNS)
    svc_link = lambda s, label: f'<li><a href="{url_for(s)}">{label}<svg><use href="#arrow"/></svg></a></li>'
    seo = {'path': '/', 'ogtitle': 'Sun Coast Cleaning and Restoration, Jupiter FL', 'ld': [
        BUSINESS_LD,
        {'@context': 'https://schema.org', '@type': 'WebSite', '@id': SITE_URL + '/#website', 'url': SITE_URL + '/',
         'name': 'Sun Coast Cleaning and Restoration', 'publisher': {'@id': SITE_URL + '/#business'}},
        {'@context': 'https://schema.org', '@type': 'ItemList', 'name': 'Services',
         'itemListElement': [{'@type': 'ListItem', 'position': i, 'name': l, 'url': SITE_URL + canonical_path(s)}
                             for i, (s, l) in enumerate(SERVICES, 1)]}]}
    body = f'''<section class="hero">
  <img class="hero-bg" src="img/1600210492486-724fe5c67fb0.jpg" alt="A bright, freshly cleaned living room with sofas, an area rug and tall sunny windows" width="1800" height="1100" fetchpriority="high">
  <div class="wrap">
    <div>
      <p class="eyebrow">Jupiter &amp; the Palm Beaches · Established 1988</p>
      <h1>Carpet, tile and upholstery, <em>cleaned the careful&nbsp;way.</em></h1>
      <p class="lead">Suncoast Cleaning and Restoration cleans carpet, upholstery, tile and grout, drapery and fine area rugs for homes and businesses from Port St. Lucie to Boca Raton, with eco-friendly, allergy-free options and water removal when you need it fast.</p>
      <div class="ctas">
        <a class="btn btn-primary" href="{PHONE_TEL}"><svg aria-hidden="true"><use href="#phone"/></svg>Call {PHONE}</a>
        <a class="btn btn-ghost" href="{SMS}"><svg aria-hidden="true"><use href="#chat"/></svg>Text us a photo</a>
      </div>
      <p class="note">Bonded, licensed and insured. Every estimate is free.</p>
    </div>
    {estimate_form(artifact=artifact)}
  </div>
</section>

<div class="trust" aria-label="Credentials">
  <div class="wrap">
    <div><b>1988</b><span>Serving South Florida since</span></div>
    <div><b>BBB</b><span>Better Business Bureau member since 1993</span></div>
    <div><b>IICRC</b><span>Certified firm since 1998</span></div>
    <div><b>Green</b><span>Eco-friendly, allergy-free cleaning options</span></div>
  </div>
</div>

<section class="block intro" id="about">
  <div class="wrap">
    <div>
      <p class="eyebrow">{esc(h1.title().replace("And", "and").replace("In", "in"))}</p>
      <h2>{esc(trusted_h.capitalize())}</h2>
      {''.join(f'<p>{esc(p)}</p>' for p in intro + trusted)}
    </div>
    <div>
      {video_card(VIDEO_ID)}
    </div>
  </div>
</section>

<section class="block" id="services" style="padding-top:0">
  <div class="wrap">
    <div class="head">
      <div>
        <p class="eyebrow">Our services</p>
        <h2>One call for every floor, fabric and surface in the house.</h2>
      </div>
      <p>From a single stained sofa to a whole office, our technicians handle cleaning, pet stains and odors, heavily soiled areas, disinfecting and water removal. <a href="{url_for('best-cleaning-services-in-florida')}">See all services</a>.</p>
    </div>
    <div class="svc-groups">
      <div class="svc-group">
        <img class="ph" src="img/1584622650111-993a426fbf0a.jpg" alt="A clean tiled bathroom with a glass shower stall and wood-look floor" width="800" height="500" loading="lazy">
        <h3><span class="icon"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M3 14h18M9 5v14M15 5v14"/></svg></span>Floors</h3>
        <p class="tag">Carpet, tile, grout and stone</p>
        <ul>
          {svc_link('carpet-cleaning', 'Carpet cleaning')}
          {svc_link('green-carpet-cleaning', 'Green carpet cleaning')}
          {svc_link('tile-and-grout-cleaning', 'Tile and grout cleaning')}
          {svc_link('natural-stone-restoration-and-polishing', 'Natural stone and polishing')}
          {svc_link('shower-stall-cleaning', 'Shower stall cleaning')}
        </ul>
      </div>
      <div class="svc-group">
        <img class="ph" src="img/1555041469-a586c61ea9bc.jpg" alt="A spotless green velvet sofa on a light wood floor" width="800" height="500" loading="lazy">
        <h3><span class="icon"><svg viewBox="0 0 24 24"><path d="M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3"/><path d="M3 13a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v4H3z"/><path d="M5 17v2M19 17v2"/></svg></span>Furniture &amp; fabric</h3>
        <p class="tag">Upholstery, leather, rugs and drapes</p>
        <ul>
          {svc_link('furniture-cleaning-that-gets-out-stains', 'Furniture and upholstery')}
          {svc_link('leather-cleaning-and-conditioning', 'Leather cleaning and conditioning')}
          {svc_link('area-rug-cleaning', 'Fine area rug cleaning')}
          {svc_link('drapery-and-curtain-cleaning', 'Drapery and curtain cleaning')}
        </ul>
      </div>
      <div class="svc-group">
        <img class="ph" src="img/1628177142898-93e36e4e3a50.jpg" alt="A gloved hand spraying cleaner over a wood surface" width="800" height="500" loading="lazy">
        <h3><span class="icon"><svg viewBox="0 0 24 24"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5"/></svg></span>Restoration &amp; more</h3>
        <p class="tag">Water removal, ducts, whole homes and businesses</p>
        <ul>
          {svc_link('water-damage-cleaning', 'Water damage restoration')}
          {svc_link('hurricane-clean-up', 'Hurricane clean up')}
          {svc_link('air-duct-cleaning', 'Air duct cleaning and sanitizing')}
          {svc_link('full-home-cleaning', 'Full home cleaning')}
          {svc_link('move-in-cleaning', 'Move in cleaning')}
          {svc_link('commercial-cleaning-for-southern-florida-businesses', 'Commercial cleaning')}
        </ul>
      </div>
    </div>
  </div>
</section>

<section class="block feature-split">
  <div class="wrap">
    <div class="fs-img"><img src="img/1527515637462-cff94eecc1ac.jpg" alt="A vacuum lifting colorful confetti out of a deep carpet" width="1200" height="1300" loading="lazy"></div>
    <div class="fs-copy">
      <p class="eyebrow">Carpet cleaning</p>
      <h2>Pet stains, odors and the high-traffic spots you gave up on.</h2>
      <p>Our technicians handle carpet pet stains and odors, heavily soiled areas and carpet disinfecting, and explain every step before they start. Prefer it gentler? Ask for our eco-friendly, allergy-free green cleaning. Trying it yourself first? <a href="{url_for('get-that-stain-out')}">Get That Stain Out!</a> has Sun Coast's own instructions for 29 common stains.</p>
      <ul class="ticks">
        <li>Pet stain and odor treatment</li>
        <li>Heavily soiled and high-traffic areas</li>
        <li>Carpet disinfecting</li>
        <li>Green, allergy-free options</li>
      </ul>
      <a class="btn btn-primary" href="{url_for('carpet-cleaning')}">About our carpet cleaning<svg aria-hidden="true"><use href="#arrow"/></svg></a>
    </div>
  </div>
</section>

<section class="block why" id="why">
  <div class="wrap">
    <div class="head">
      <div>
        <p class="eyebrow">Why Suncoast</p>
        <h2>The name neighbors have recommended for decades.</h2>
      </div>
      <p>We've been cleaning South Florida homes since 1988. Here's what customers mention most.</p>
    </div>
    <div class="why-grid">
      <div><p class="n">01</p><h3>No pressure, no upsell</h3><p>Technicians explain how the cleaning works and quote what you asked for. Nothing more.</p></div>
      <div><p class="n">02</p><h3>Healthier for your family</h3><p>Eco-friendly, allergy-free and green cleaning options for homes with kids and pets.</p></div>
      <div><p class="n">03</p><h3>Certified and accountable</h3><p>An IICRC certified firm since 1998, BBB member since 1993, and bonded, licensed and insured.</p></div>
      <div><p class="n">04</p><h3>Water removal experts</h3><p>The same team that cleans your carpet knows how to get water out and dry things properly.</p></div>
    </div>
  </div>
</section>

<section class="block">
  <div class="wrap">
    <div class="head">
      <div>
        <p class="eyebrow">How it works</p>
        <h2>Clean floors in three easy steps.</h2>
      </div>
    </div>
    <div class="steps">
      <div class="step"><h3>Call, text or send the form</h3><p>Reach us at <a href="{PHONE_TEL}">{PHONE}</a>. A photo of the stain or the room helps.</p></div>
      <div class="step"><h3>Get a free estimate</h3><p>We'll tell you what we'll clean, how, and what it costs before we start.</p></div>
      <div class="step"><h3>We arrive on time and clean</h3><p>Our technicians walk you through the process and leave your home looking and smelling fresh.</p></div>
    </div>
  </div>
</section>

<section class="block reviews" id="reviews">
  <div class="wrap">
    <div class="head">
      <div>
        <p class="eyebrow">Here is what people have to say about us</p>
        <h2>What our customers say.</h2>
      </div>
      <p>Letters and notes from customers across Palm Beach and Martin counties, in their own words.</p>
    </div>
    <div class="feature">
      <div class="mark" aria-hidden="true">“</div>
      <div>
        <blockquote>{esc(featured[0].strip('“”'))}</blockquote>
        <cite>{esc(featured[1])}, {esc(featured[2])}</cite>
      </div>
    </div>
    <div class="rev-grid">
      {''.join(review_card(*r) for r in others)}
    </div>
  </div>
</section>

<section class="block area" id="area">
  <div class="wrap">
    <div>
      <p class="eyebrow">Service area</p>
      <h2>Based in Jupiter. Cleaning from Port St. Lucie to Boca&nbsp;Raton.</h2>
      <p>We serve homes and businesses across Palm Beach, Martin and St. Lucie counties. <a href="{url_for('locations')}">See every town we come to</a>, or call or text and ask.</p>
    </div>
    <ul class="towns">{towns}</ul>
  </div>
</section>

<section class="band">
  <div class="wrap">
    <div class="inner">
      <img class="bg" src="img/1631679706909-1844bbd07221.jpg" alt="" width="1600" height="700" loading="lazy">
      <div>
        <h2>Ready for floors that look new again?</h2>
        <p>Call or text for a free estimate. Tell us what needs cleaning and we'll take it from there.</p>
      </div>
      <div class="acts">
        <a class="phone" href="{PHONE_TEL}">{PHONE}</a>
        <a class="btn btn-ghost" href="#estimate">Or request an estimate online<svg aria-hidden="true"><use href="#arrow"/></svg></a>
      </div>
    </div>
  </div>
</section>'''
    title = 'Suncoast Homepage Redesign' if artifact else seo_title(PAGE_BY_SLUG['home'], 'home')
    return layout(title, meta_description(PAGE_BY_SLUG['home'], 'home'), body, current='home', artifact=artifact, skeleton=not artifact, seo=seo)


# --------------------------------------------------------------------------- hosting files
def render_404(artifact):
    tiles = ''.join(f'<a href="{url_for(s)}">{esc(l)}</a>' for s, l in SERVICES)
    body = page_hero('Page not found', 'We couldn\'t find that page.', crumbs=breadcrumbs([('Home', 'index.html'), ('Page not found', None)])) + f'''
<div class="wrap page-grid">
  <div>
    <article class="prose">
<p>The address may have changed when the site was rebuilt. Try one of the pages below, <a href="news.html">browse the news</a>,
or call or text <a href="{PHONE_TEL}">{PHONE}</a> and we\'ll point you the right way.</p>
<h2>Services</h2>
<div class="tile-grid">{tiles}</div>
<h2>Elsewhere on the site</h2>
<ul>
<li><a href="index.html">Home</a></li>
<li><a href="{url_for('about-suncoast-carpet-cleaning')}">About Us</a></li>
<li><a href="{url_for('locations')}">Locations</a></li>
<li><a href="{url_for('get-that-stain-out')}">Get That Stain Out!</a></li>
<li><a href="{url_for('contact-us')}">Contact Us</a></li>
</ul>
    </article>
  </div>
  <aside class="side">{estimate_form(compact=True, artifact=artifact)}{contact_card()}</aside>
</div>'''
    return layout('Page not found | Sun Coast Cleaning and Restoration', 'That page could not be found on suncoastclean.com.',
                  body, artifact=artifact, seo={'path': '/404.html', 'robots': 'noindex, follow', 'ld': [BUSINESS_LD]})


def redirect_rules():
    """(old path, new canonical path) for every address that is not simply /slug/."""
    rules = [('/index.html', '/'), ('/home/', '/'), ('/category/news/', '/news/'), ('/author/admin/', '/news/'), ('/feed/', '/news/'),
             ('/feed', '/news/'), ('/comments/feed/', '/news/')]
    for old, new in ASPX_MAP.items():
        target = '/' + new.split('#')[0] + '/' if not new.startswith('mailto') else '/contact-us/'
        if new == 'home#reviews':
            target = '/#reviews'
        rules.append(('/' + old + '.aspx', target))
    for slug in PAGE_BY_SLUG:
        if slug != 'home':
            rules.append((f'/{slug}.aspx', f'/{slug}/'))
    return rules


def hosting_files(out, pages_written):
    html_files = sorted(f for f in pages_written if f.endswith('.html') and f != '404.html')
    today = datetime.date.today().isoformat()

    def loc(name):
        return SITE_URL + ('/' if name == 'index.html' else '/' + name[:-5] + '/')
    entries = []
    for name in html_files:
        slug = name[:-5]
        if slug.endswith('-post'):
            continue   # shadowed by a page; noindex
        item = PAGE_BY_SLUG.get(slug) or POST_BY_SLUG.get(slug)
        mod = (item['modified'][:10] if item else today)
        pri = '1.0' if name == 'index.html' else ('0.8' if slug in SERVICE_SLUGS or slug in LOCATIONS or slug in ('news', 'locations', 'best-cleaning-services-in-florida', 'about-suncoast-carpet-cleaning', 'contact-us') else '0.5')
        entries.append(f'  <url><loc>{loc(name)}</loc><lastmod>{mod}</lastmod><priority>{pri}</priority></url>')
    open(os.path.join(out, 'sitemap.xml'), 'w').write(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + '\n'.join(entries) + '\n</urlset>\n')
    open(os.path.join(out, 'robots.txt'), 'w').write(f'User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n')

    rules = redirect_rules()
    # Netlify / Cloudflare Pages
    lines = [f'{old}  {new}  301' for old, new in rules]
    lines += ['/:slug.aspx  /:slug/  301', '/:slug.html  /:slug/  301', '/:slug/  /:slug.html  200', '/*  /404.html  404']
    open(os.path.join(out, '_redirects'), 'w').write('# Old suncoastclean.com addresses keep working.\n' + '\n'.join(lines) + '\n')
    # Vercel
    vercel = {'cleanUrls': True, 'trailingSlash': True,
              'redirects': [{'source': old.rstrip('/') or '/', 'destination': new, 'permanent': True} for old, new in rules if old not in ('/index.html',)] +
                           [{'source': '/:slug.aspx', 'destination': '/:slug/', 'permanent': True}]}
    json.dump(vercel, open(os.path.join(out, 'vercel.json'), 'w'), indent=1)
    # Apache (SiteGround, cPanel hosts)
    ht = ['# Old suncoastclean.com addresses keep working.', 'Options -MultiViews', 'RewriteEngine On', 'RewriteBase /', '']
    for old, new in rules:
        if old == '/index.html':
            continue
        pat = old.lstrip('/').replace('.', r'\.')
        ht.append(f'RewriteRule ^{pat}$ {new} [R=301,L{",NE" if "#" in new else ""}]')
    ht += ['RewriteRule ^([a-z0-9-]+)\\.aspx$ /$1/ [R=301,L]',
           '# /slug.html -> /slug/ (the canonical form), then serve /slug/ from slug.html',
           'RewriteCond %{THE_REQUEST} \\s/([a-z0-9-]+)\\.html[\\s?]',
           'RewriteRule ^([a-z0-9-]+)\\.html$ /$1/ [R=301,L]',
           'RewriteCond %{DOCUMENT_ROOT}/$1.html -f',
           'RewriteRule ^([a-z0-9-]+)/?$ /$1.html [L]',
           'ErrorDocument 404 /404.html',
           '', '<IfModule mod_headers.c>', '  <FilesMatch "\\.(jpg|png|css)$">', '    Header set Cache-Control "public, max-age=31536000"', '  </FilesMatch>', '</IfModule>']
    open(os.path.join(out, '.htaccess'), 'w').write('\n'.join(ht) + '\n')


def seo_csv(path):
    """Title and description per address, for pasting into All in One SEO if the site stays on WordPress."""
    import csv
    with open(path, 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['URL', 'SEO title', 'Meta description', 'Robots'])
        w.writerow([SITE_URL + '/', seo_title(PAGE_BY_SLUG['home'], 'home'), DESCRIPTIONS['home'], 'index, follow'])
        for page in PAGES:
            if page['slug'] == 'home':
                continue
            section = section_of(page['slug'])
            kind = {'services': 'service', 'locations': 'location', 'stains': 'stain'}.get(section, 'page')
            if page['slug'] in ('best-cleaning-services-in-florida', 'locations', 'get-that-stain-out'):
                kind = 'index'
            w.writerow([SITE_URL + canonical_path(page['slug']), seo_title(page, kind), meta_description(page, kind), 'index, follow'])
        for post in POSTS:
            shadow = post['slug'] in PAGE_BY_SLUG
            w.writerow([SITE_URL + canonical_path(post['slug'], post), seo_title(post, 'post'), meta_description(post, 'post'),
                        'noindex, follow' if shadow else 'index, follow'])


# --------------------------------------------------------------------------- build
def build(out, artifact=False):
    os.makedirs(out, exist_ok=True)
    written = {}
    written['index.html'] = render_home(artifact)
    for page in PAGES:
        if page['slug'] == 'home':
            continue
        if page['slug'] == 'news':
            written['news.html'] = render_news(artifact)
            continue
        written[url_for(page['slug'])] = render_page(page, artifact)
    for i, post in enumerate(POSTS):
        written[post_url(post)] = render_post(post, i, artifact)
    written['404.html'] = render_404(artifact)
    for name, doc in written.items():
        with open(os.path.join(out, name), 'w') as f:
            f.write(doc)
    for name in ('logo.png', 'logo-mark.png'):
        shutil.copy(os.path.join(HERE, name), out)
    if not artifact:
        shutil.copy(os.path.join(HERE, 'theme.css'), out)
        hosting_files(out, written)
        seo_csv(os.path.join(HERE, 'seo-meta.csv'))
    os.makedirs(os.path.join(out, 'img'), exist_ok=True)
    for name in os.listdir(os.path.join(HERE, 'img')):
        shutil.copy(os.path.join(HERE, 'img', name), os.path.join(out, 'img', name))
    return written


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--artifact', metavar='DIR', help='write the preview build (inlined CSS, concept banner) into DIR')
    ap.add_argument('--out', default=os.path.join(HERE, 'site'))
    args = ap.parse_args()
    if args.artifact:
        files = build(args.artifact, artifact=True)
    else:
        if os.path.isdir(args.out):
            shutil.rmtree(args.out)
        files = build(args.out)
    print(f'{len(files)} pages written to {args.artifact or args.out}')
