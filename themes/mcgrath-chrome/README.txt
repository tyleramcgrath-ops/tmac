=== McGrath Chrome 2.0 ===

A custom WordPress theme for McGrath Marketing Group.
Navy and cream editorial design, with the dissolve kept at the centre of it.


WHAT IS IN IT
-------------
* Homepage. Hero with a live-looking visibility dashboard drawn in markup (not
  an image, so it stays sharp and a crawler can read it), a four-up stat strip,
  the dissolve, four service cards, a featured case study, the Jupiter section,
  FAQ, the free audit form and the closing call to action.

* The dissolve. A real page of blue links — live DOM text, so it is crawlable
  and screen-reader friendly — is sampled into particles, flown across the
  screen as you scroll, and reassembled as the question a buyer now asks a
  model. It lands in a search field, with the question sitting in it as though
  it has just been typed, and an overview settling in underneath: the answer on
  the left, the sources it drew on listed alongside it, your own domain first.
  Both the field and the overview are drawn generically rather than as a copy of
  any one engine's branding. Nothing else in the section moves: the type turning
  into pixels is the whole animation, and the colour behind it simply settles
  from paper to blue as the last particles arrive.

* Crawler view. The switch in the header flips the whole site into the layer a
  machine reads: monospace, heading tags exposed, colours inverted. The
  dashboard, the photography and the dissolve all come with it.

* The lens. On the services section, the cursor reveals the machine-readable
  layer underneath the design.

* Inner pages. Page templates for SEO Services, Web Design, AI Visibility,
  About, Contact and The Vault, plus blog index, single, search, archive and
  404 — all on the new palette. Each one opens with its own drawn figure rather
  than the same decorative field: ranking positions on SEO, a page being
  composed on Web Design, one question answered by several engines on AI
  Visibility, a mark and its ground on About, a place on a map on Contact.
  They are line work on the brand palette, defined in inc/icons.php, so adding
  a page means adding a glyph there and calling mcg_glyph() in the template.

* Local SEO built in: ProfessionalService schema with the full service area on
  every page; on the front page, FAQPage schema generated from the same array
  that renders the FAQ, and Service schema generated from the same array that
  renders the service cards, so none of them can disagree.


ARTWORK
-------
Every image the theme ships lives in assets/img/ and is replaced by dropping a
file over it. Nothing else needs touching.

    hero.webp            the photograph the homepage hero stands on
    roots.webp           the panel beside "Jupiter roots"
    page-seo.webp        SEO page header, and the first homepage service card
    page-webdesign.webp  Web Design page header, and the third service card
    page-aeo.webp        AI Visibility page header, and the second service card
    page-analytics.webp  the fourth service card, and the visibility audit
    page-about.webp      About page header
    page-contact.webp    the chart beside the enquiry form
    page-writing.webp    the Insights section, the blog index, archives, search
    art-mobile.webp      inside the Web Design page, under the first split
    ocean.*              behind the closing call to action — not shipped; a
                         drawn night-water scene stands in until you add one

.webp, .jpg, .jpeg and .png all work, checked in that order. Every photograph in
the set is 3:2 and every frame crops to a fixed ratio, so the pages line up with
each other; keep a replacement at 3:2 and it will drop straight in. Page headers
are shown at roughly half the header, so about 1200px wide is plenty. The hero
and the roots panel run full width, so 1300-1600px suits them.

A service card and the page it links to share one file on purpose: the card is a
preview of that page. Replace the file and both change together.

Any page with no artwork falls back to a drawn line figure rather than an empty
column, so adding a page never leaves a hole.

The two photographic panels crop to fill, so a replacement may need re-aiming.
Each call in front-page.php takes a background-position, and optionally a
background-size:

    mcg_plate( 'hero',  '', '50% 34%' );
    mcg_plate( 'roots', '', '50% 50%' );

First number is horizontal, second vertical. Raise the first to move the subject
left, raise the second to move it up. The size is normally left off, which means
"cover" — the whole frame filled with the least crop, and the sharpest result.

LOGO
----
The MG mark ships in assets/img/logo.png and is used in the header, the footer,
the dashboard in the hero and on the vault door. There is only one file: on dark
surfaces it is inverted in CSS, and in crawler view it is tinted green, so there
is no second asset to keep in sync.

To swap it without touching code: Appearance > Customize > Site Identity > Logo.
A custom logo set there replaces the bundled mark in the header. Set the Site
Icon in the same panel for the browser tab and the search-result favicon.

The name beside the mark is the "Wordmark sub-line" string in Appearance >
Customize > Homepage & brand.


INSTALL
-------
1. WordPress admin -> Appearance -> Themes -> Add New -> Upload Theme.
2. Choose mcgrath-chrome.zip, install, activate.
3. That is it. On activation the theme creates every page, assigns the right
   template to each one, sets the static front page and blog page, builds the
   primary and footer menus and turns on pretty permalinks.

   If you activated an earlier build, you will see a notice in the admin with a
   "Create the pages and menu" button. Click it once.

WHAT GETS CREATED
-----------------
     Page                              Slug                  Template
     --------------------------------  --------------------  --------------
     SEO & Web Design in Jupiter, FL   home                  front page
     SEO Company in Jupiter, FL        seo-jupiter-fl        SEO Services
     Web Design in Jupiter, FL         web-design-jupiter    Web Design
     AI Visibility                     ai-visibility         AI Visibility
     About                             about                 About
     Contact                           contact               Contact
     The Vault                         vault                 The Vault
     Notes on Search                   blog                  posts page

Nothing is duplicated if you run it twice, and a template you changed by hand
is left alone.


EDITING COPY
------------
Appearance -> Customize -> Homepage & brand. Everything on the homepage that is
not normal page content lives there:

  * the hero kicker, the three headline lines, the paragraph and the trust line
  * the three lines over the photograph
  * the dissolve heading and paragraph
  * the search query shown in the dissolve, the question it lands on, the
    highlighted end of that question, and the overview that comes back (which
    accepts <b> tags)
  * the case study: both name lines, the summary and the headline on the mock
    site. It ships as a deliberately unnamed, representative engagement with
    round numbers — put a real client in before launch, or leave it as the
    illustration it is
  * the wordmark sub-line, the footer tagline, contact email, location, reach
    line and the coordinates
  * LinkedIn, Instagram and YouTube URLs. Leave one blank and its icon does not
    render — there are no dead links in the footer.

Everything else on inner pages is normal WordPress content, edited in the block
editor. Body copy, headings, lists, quotes and images are all styled.


THE VAULT
---------
It ships locked with the password "jupiter". Change it: edit the Vault page,
open Summary on the right, Visibility > Password protected, set your own. Put
client work in the page body. Locked, visitors get the vault door. Unlocked,
they get your work. It is noindex and stays out of the menu.


THE FEATURED CASE STUDY
-----------------------
The section has two modes and will not blur them.

By default it is an ILLUSTRATIVE PROJECT. It says so on a label, the strip
carries three deliverables — statements about what the work involves, true
regardless of client — and a footnote says plainly that it is not a client
record. Nothing unearned is presented as a result.

To publish a real one, go to Appearance > Customize > Homepage & brand and:

    1. Fill in "Case study: client or project name". This replaces the
       Illustrative Project label, so use the name you have permission to use.
    2. Fill in all three "Verified result" figure and label pairs.
    3. Fill in "Case study: results timeframe", e.g. "First 12 months". The
       section prints "Measured over ..." beneath the figures, because a
       percentage without a period behind it is not a result.
    4. Tick "these are real, verified client results".

Every one of those has to hold. Miss any of them and the section falls back to
illustrative rather than showing two real numbers and one invented one. The
figures are never written into the page's schema, only into the visible copy.

THE SCREENSHOT
--------------
Drop a picture of the finished site at:

    assets/img/case-shot.webp    (.jpg, .jpeg and .png also work)

It renders inside a plain browser frame beside the project details, and it is
the section's main visual. Around 1400px wide suits it; any height works, the
frame follows the image.

Nothing stands in for it. With no file there the section runs one column wide
and the prose moves alongside the heading instead. That is deliberate: a drawn
mock-up of a website that does not exist is the thing that costs a case study
its credibility.

"Case study: address shown on the screenshot" puts a URL in the frame's address
bar. Leave it empty and the bar stays blank.


THE AUDIT FORM
--------------
The homepage audit form is a GET to /contact/ with the address in ?site=. It
does not run an audit on its own. The contact page reads that parameter and
prefills the Website field with it, so somebody who starts on the homepage does
not type their address twice. To run a real audit, point the form at a tool.


THE ENQUIRY FORM
----------------
The contact page ships a working form. It posts to admin-post.php, checks a
nonce, drops anything that fills the hidden honeypot field, and mails the result
with wp_mail. The reply-to is set to whoever sent it, so replying from your
inbox goes to them.

Mail goes to the Contact email under Appearance > Customize > Homepage & brand,
and falls back to the site admin address if that is blank.

wp_mail on shared hosting is often unreliable and mail sent that way frequently
lands in spam. Install an SMTP plugin and send through a real mailbox or a
transactional provider. Until you do, test it once and confirm it arrives before
relying on it.

After sending, the visitor comes back to the form with ?enquiry=sent (or =error)
and sees a message above it. Nothing is stored in the database; if you want a
record of enquiries, use a form plugin instead and drop its shortcode into the
page content, which still renders below the form.


PRICING
-------
The three price lines on the SEO page are Customizer fields, under Homepage &
brand: "SEO page price: one-off audit", "monthly SEO" and "local launch". They
ship reading "On request" rather than a made-up number. Put your real figures in
before the page goes live, or leave them as they are.


RANKING NOTES
-------------
The theme gives you the technical side: clean heading structure, schema, fast
markup, crawlable text, an FAQ that is eligible for rich results and an internal
link path from the homepage to every service page. Rankings also need things no
theme can ship: a claimed and active Google Business Profile, real reviews,
citations on the directories that matter locally, and pages that keep getting
better. Nobody can promise a position on Google, and anyone who does is selling
something.


NOTES
-----
* The dissolve is the heaviest thing on the site. It caps its particle count and
  device pixel ratio, and honours prefers-reduced-motion — with motion reduced
  it skips straight to the answer instead of animating — but on very old
  hardware you may want to drop the WebGL layer.
* The dashboard, the laptop mock, the charts and the icons are all markup or
  inline SVG, so the only image the page loads is the photograph itself.
* The results page in the dissolve is real DOM text, so it is crawlable and
  screen reader friendly. It is styled as a generic results page, not a copy of
  any search engine's branding.
* Fonts are Newsreader, Inter, DM Mono and Caveat, loaded from Google Fonts. If
  you would rather self-host them, swap the wp_enqueue_style call at the top of
  functions.php.
