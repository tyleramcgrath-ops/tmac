=== McGrath Chrome 2.0 ===

A custom WordPress theme for McGrath Marketing Group.
Navy and cream editorial design, with the dissolve kept at the centre of it.


WHAT IS IN IT
-------------
* Homepage. Hero with a live-looking visibility dashboard drawn in markup (not
  an image, so it stays sharp and a crawler can read it), a four-up stat strip,
  the dissolve, four service cards, a featured case study, the Jupiter section,
  FAQ, the free audit form, a client logo row and the closing call to action.

* The dissolve. A real page of blue links — live DOM text, so it is crawlable
  and screen-reader friendly — is sampled into particles, flown across the
  screen as you scroll, and reassembled as the question a buyer now asks a
  model. It lands on a shortlist of who gets cited. Nothing else in the section
  moves: the type turning into pixels is the whole animation, and the colour
  behind it simply settles from paper to blue as the last particles arrive.

* Crawler view. The switch in the header flips the whole site into the layer a
  machine reads: monospace, heading tags exposed, colours inverted. The
  dashboard, the photography and the dissolve all come with it.

* The lens. On the services section, the cursor reveals the machine-readable
  layer underneath the design.

* Inner pages. Page templates for SEO Services, Web Design, AI Visibility,
  About, Contact and The Vault, plus blog index, single, search, archive and
  404 — all on the new palette.

* Local SEO built in: ProfessionalService schema with the full service area on
  every page; on the front page, FAQPage schema generated from the same array
  that renders the FAQ, and Service schema generated from the same array that
  renders the service cards, so none of them can disagree.


PHOTOGRAPHY
-----------
The Jupiter Inlet light ships with the theme and is used twice: the panel top
right of the hero, and the panel beside "Jupiter roots". Replace either one by
dropping your own file over it:

    assets/img/hero.jpg    the panel top right of the hero
    assets/img/roots.jpg   the panel beside "Jupiter roots"
    assets/img/ocean.jpg   behind the closing call to action (not shipped; a
                           drawn night-water scene stands in until you add one)

.webp, .jpg, .jpeg and .png all work, checked in that order. Landscape, around
1600px wide, is the right shape — the shipped file is 633px, which is fine at
normal resolution but will soften on a retina screen, so a larger original is
worth swapping in.

Both panels crop to fill, so a replacement photo may need re-aiming. Each call
in front-page.php takes a background-position and a background-size:

    mcg_plate( 'hero',  '', '100% 0%', 'auto 150%' );
    mcg_plate( 'roots', '', '62% 46%' );

In the position, the first number is horizontal and the second vertical. Raise
the first to move the subject left, raise the second to move it up.

The size is normally left off, which means "cover" — the whole frame filled
with the least possible crop, and the sharpest result. The hero passes
"auto 150%" instead because the shipped photo has the light on the right, where
the three words sit; pushing in gives the room to slide it out from under them.
A photo with the light already on the left, and sky on the right, does not need
that: drop the fourth argument and the panel will be sharper for it.

LOGO
----
The wordmark is set in type (MMG plus the sub-line), so there is nothing to
export. To use a real mark instead: Appearance > Customize > Site Identity >
Logo. A custom logo set there replaces the wordmark in the header. Set the Site
Icon in the same panel for the browser tab and the search-result favicon.


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
  * the search query shown in the dissolve, the question it lands on, and the
    highlighted end of that question
  * the case study: client, division, summary and the headline on the mock site
  * the wordmark sub-line, the footer tagline, contact email, location, reach
    line and the coordinates
  * the client logo row, one name per line
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


THE AUDIT FORM
--------------
The homepage audit form is a GET to /contact/ with the address in ?site=. It
does not run an audit on its own. Point it at a real tool, or read the
parameter on the contact page and prefill your form with it.


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
