# NetworkIP WordPress Theme (v3.0.0)

This is a custom theme for networkip.net. Version 3.0 follows mockup X, "People Connect Possibilities": a white page with a gold globe, a gold band, a photo of someone on a call, red pill buttons and the logo's gold and red as accents. It also has designed interior pages and a contact form.

Requirements: WordPress 6.3+ (tested on 7.1.3) and PHP 7.4+ (tested on 8.4). It needs no plugins and no page builder.

## Install

1. In wp-admin, go to **Appearance → Themes → Add New → Upload Theme**. Upload `networkip-theme.zip` and activate it.
2. Under **Settings → Reading**, set "Your homepage displays" to **A static page** and pick a page (for example "Home"). `front-page.php` also renders when the homepage shows latest posts.
3. Under **Settings → Permalinks**, choose **Post name**. Create pages with these slugs so the built-in links resolve: `about-us`, `management`, `service`, `international-calling`, `customer-intelligence`, `technology`, `integration`, `call-quality`, `contact-us`, `privacy-policy`.
4. Optional: under **Appearance → Menus**, assign menus to *Primary navigation*, *Footer: Company*, *Footer: Service* and *Footer: Technology*. If a location has no menu, the theme shows the public-site links automatically.
5. Both NetworkIP logos are built in: the full-color logo in the white header, and a white-lettered version in the dark footer. To replace them, use **Appearance → Customize → Site Identity**: *Logo* for the header, *Logo for dark backgrounds* for the footer.

## Switching from the current Elementor site

The current networkip.net is built with Elementor. Version 1.1 handles that so the new design doesn't end up mixed with the old one:

- **Elementor's global colors and fonts are blocked.** Elementor's "kit" styles used to recolor the menu and headings dark navy and swap the font to Roboto. Elementor stays installed and working.
- **The old homepage content is hidden.** The static front page's editor content (the old Elementor homepage) is not shown inside the new homepage.
- **The main pages use built-in designs.** About Us, Management, Service, International Calling, Customer Intelligence, Technology, Integration, Call Quality and Contact Us render built-in layouts with the public content, instead of their old Elementor layouts. They only need to exist with those slugs.

All three can be switched off in **Customize → NetworkIP Homepage → Layout & compatibility**. Other pages (for example Privacy Policy) still show their own content.

**If the old header or footer still appears:** that comes from Elementor Pro's Theme Builder. Go to **Templates → Theme Builder** and set the old Header and Footer templates to Draft, or remove their display conditions.

## Look (v3.0: "People Connect Possibilities")

This is mockup X (`design/networkip-redesign/24-people-connect-*.png`), with photo A.

Homepage, top to bottom:

1. **Header:** white and sticky, with the full-color logo, dark menu links and a red "Talk to Our Team" pill button. It gets a soft shadow when the page scrolls.
2. **Hero:** white, with the black-and-gold globe on the right. The headline is "People Connect Possibilities." with "Possibilities" in gold and a red period. Stacked side words sit at the bottom right.
3. **Carrier strip:** AT&T, Verizon, T-Mobile and Boost Mobile, centered.
4. **Gold band:** "Global Calling Solutions for Mobile Operators." over a world map of gold lights, with three features (Grow Revenue, Move Faster, A Partner You Can Trust) and red line icons.
5. **Photo section:** "Bridging People. Strengthening Communities." next to a photo of a woman on a call, cut at an angle.
6. **Our impact:** 25+ years, 100+ carriers, 6M+ calls a day, 1B+ accounts.
7. **Services** and **technology** cards (white and light gray). Icons are red on a soft gold tile.
8. **Contact:** red section with the white form card.
9. **Footer:** charcoal with the white logo.

Interior pages get a white banner with the gold globe faded in on the right, then the same cards, red call-to-action band and footer.

- **Font:** Plus Jakarta Sans, self-hosted.
- **Gold #D8A040:**
  - label bars;
  - headline highlights;
  - the band;
  - impact numbers (#A8771F on white, so they stay readable).
- **Red #A3141F:**
  - all buttons;
  - headline periods;
  - band icons;
  - the contact areas.

All colors are CSS variables at the top of `assets/css/theme.css`. A period at the end of a headline is shown in red automatically.

## Editing content

| What | Where |
|---|---|
| Header button label; hero eyebrow, headline, gold words, intro, buttons, side words | Customize → NetworkIP Homepage → Header & hero |
| Gold band eyebrow, headline, red words, intro, side words | Customize → NetworkIP Homepage → Gold band |
| Photo section text, button, side words and the photo itself | Customize → NetworkIP Homepage → Photo section |
| Carrier names in the strip under the hero | Customize → NetworkIP Homepage → Carriers |
| Contact headline, text, address, phone, email; form on/off and recipient | Customize → NetworkIP Homepage → Contact & form |
| Gold band features, impact numbers, service cards, technology cards and capacity stats (plus the optional global-calling section) | `inc/content.php` (commented PHP arrays), or the `networkip_home_content` filter from a child theme or plugin |
| Section order | The `networkip_home_sections` filter. The default is `hero, carriers, band, bridge, impact, content, services, technology, contact`. Add `network` to bring back the global-calling map section with the market figures. |
| Extra homepage content | When turned on under Layout & compatibility, the static front page's editor content appears after the impact figures |
| Main interior pages (About Us, Management, Service, International Calling, Customer Intelligence, Technology, Integration, Call Quality, Contact Us) | `inc/pages.php` (commented arrays), or the `networkip_page_layouts` filter. To add headshots to the Management page, add `'photo' => 'https://…'` to each person. |
| Other pages | Normal page editor. They use the white globe banner (the page excerpt becomes its subtitle) and end with a contact call to action. |
| Menus | Appearance → Menus. Dropdown sub-items are supported. |

## Contact form

- The form posts to `admin-post.php` (`networkip_contact` action).
- Protections:
  - Nonce check.
  - Hidden honeypot field.
  - Rejects submissions made within 3 seconds of page load.
  - Rate limit of 5 messages per IP per hour.
  - Every field is sanitized, and name, email and message are validated server-side.
  - Header-injection-safe `Reply-To`.
- Mail is sent with `wp_mail()` to the Customizer recipient, or to the site admin email if none is set. **Install an SMTP plugin** (for example WP Mail SMTP), because many hosts drop PHP `mail()`.
- The `networkip_contact_submitted` action fires after each submission. Use it to log entries to a CRM.
- If a page cache serves the homepage for longer than 12–24 hours, nonces can expire. Exclude `/` and `/contact-us/` from the cache, or keep the cache lifetime under 12 hours.

## Assets

| File | Source |
|---|---|
| `assets/images/hero-globe-gold-*.webp` | The ChatGPT handoff `hero-connected-globe-3840x2160.png`, cut out as a circle and recolored black and gold. 960, 1600 and 1920 px WebP with transparency. Used in the hero and interior banners. |
| `assets/images/band-map-*.webp` | The ChatGPT handoff `global-network-map-3840x1536.png`, reduced to its lights and recolored gold. Shown with `mix-blend-mode: screen` on the gold band. |
| `assets/images/bridge-call-*.webp/.jpg` | "A woman smiling while talking on a cell phone" by Vitaly Gariev, https://unsplash.com/photos/a-woman-smiling-while-talking-on-a-cell-phone-3KgSopqBgYI. Free to use under the [Unsplash License](https://unsplash.com/license); credit is appreciated but not required. |
| `assets/images/network-map-light-*.webp/.jpg` | The same map, inverted to cream. Used only by the optional `network` section. |
| Line icons | Drawn in the theme (`networkip_icon_paths()` in `inc/template-tags.php`), so CSS can color them |
| `assets/images/networkip-logo*.png` | The official NetworkIP logo supplied by the client. `networkip-logo` is the full-color version; `networkip-logo-white` has the black lettering turned white for the footer. |
| `assets/images/networkip-wordmark.svg` | Fallback wordmark from the ChatGPT handoff (no longer used) |
| `assets/fonts/plus-jakarta-sans-*.woff2` | Plus Jakarta Sans variable font (SIL Open Font License), self-hosted |

Nothing is hotlinked. The hero globe is preloaded with `fetchpriority="high"`, and below-the-fold images lazy-load. JavaScript is a single deferred 2 KB file for the mobile menu and the header scroll state.

## Caveats

- **Logo:** both bundled logos were made from a small 340×100 copy of the official logo, so they can look slightly soft on large high-resolution screens. For a sharper result, upload larger PNGs (about 700 px wide) under Customize → Site Identity.
- **Imagery:** the globe and map are AI-generated concept art from the handoff, not official NetworkIP photography. The photo is a stock photo; NetworkIP may want to use its own (Customize → NetworkIP Homepage → Photo section).
- **Copy:** all homepage copy comes from public networkip.net pages (Home, Service, International Calling, Customer Intelligence, Integration, Call Quality, Technology), lightly shortened. The new v3 headings ("People Connect Possibilities.", "Bridging People. Strengthening Communities.", the three band features) are new marketing wording built on those facts. Stats (25+ years, 6M+ calls a day, 1B+ accounts, 100,000+ ports, 100+ carriers, plus the market figures in the optional global-calling section) are quoted from those pages. Have NetworkIP confirm they are still current before launch.
- **Security note about the current live site:** the "Direct Integration" paragraph on networkip.net/technology/ contains injected spam links (phone-spyware sites). That is a sign the current WordPress install has been compromised. The paragraph was **not** reused here. Have the current site cleaned and audited, and do not migrate its database content without review.

## Tested

- Every PHP file passes `php -l`. No notices or warnings with `WP_DEBUG` on.
- It ran on a real WordPress 7.1.3 install (SQLite) and was checked at 1440, 820 and 400 px with no horizontal overflow.
- With Elementor 4.3.4 active, a dark-navy global kit and Elementor-built pages: the theme's colors and font hold, and no old content appears on the homepage or the nine designed pages.
- Dropdown menus work on hover and on keyboard focus, and appear as nested items in the mobile menu.
- Mobile menu:
  - Toggle with `aria-expanded`.
  - Focus moves into the menu and is trapped there.
  - Esc closes it and returns focus to the toggle.
  - It closes on link click and on resize to desktop.
  - It works without JavaScript.
- Customizer live preview works.
- Form paths were checked: valid, invalid email, bad nonce, honeypot, too fast, off-site referer and header injection.
