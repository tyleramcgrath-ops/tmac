# NetworkIP WordPress Theme (v1.2.0)

This is a custom theme built from the ChatGPT "left homepage" handoff. It has a dark navy and electric-blue design with a connected-globe hero, a global network map section, glowing service cards and a contact form.

Requirements: WordPress 6.3+ (tested on 7.1.3) and PHP 7.4+ (tested on 8.4). It needs no plugins and no page builder.

## Install

1. In wp-admin, go to **Appearance → Themes → Add New → Upload Theme**. Upload `networkip-theme.zip` and activate it.
2. Under **Settings → Reading**, set "Your homepage displays" to **A static page** and pick a page (for example "Home"). `front-page.php` also renders when the homepage shows latest posts.
3. Under **Settings → Permalinks**, choose **Post name**. Create pages with these slugs so the built-in links resolve: `about-us`, `management`, `service`, `international-calling`, `customer-intelligence`, `technology`, `integration`, `call-quality`, `contact-us`, `privacy-policy`.
4. Optional: under **Appearance → Menus**, assign menus to *Primary navigation*, *Footer: Company*, *Footer: Service* and *Footer: Technology*. If a location has no menu, the theme shows the public-site links automatically.
5. The white NetworkIP logo is already built in. To replace it, use **Appearance → Customize → Site Identity → Logo for dark backgrounds** (see the caveats below).

## Switching from the current Elementor site

The current networkip.net is built with Elementor. Version 1.1 handles that so the new design doesn't end up mixed with the old one:

- **Elementor's global colors and fonts are blocked.** Elementor's "kit" styles used to recolor the menu and headings dark navy and swap the font to Roboto. Elementor stays installed and working.
- **The old homepage content is hidden.** The static front page's editor content (the old Elementor homepage) is not shown inside the new homepage.
- **The main pages use built-in designs.** About Us, Management, Service, International Calling, Customer Intelligence, Technology, Integration, Call Quality and Contact Us render built-in layouts with the public content, instead of their old Elementor layouts. They only need to exist with those slugs.

All three can be switched off in **Customize → NetworkIP Homepage → Layout & compatibility**. Other pages (for example Privacy Policy) still show their own content.

**If the old header or footer still appears:** that comes from Elementor Pro's Theme Builder. Go to **Templates → Theme Builder** and set the old Header and Footer templates to Draft, or remove their display conditions.

## Editing content

| What | Where |
|---|---|
| Hero eyebrow, headline, intro, buttons, proof chips | Customize → NetworkIP Homepage → Hero |
| About headline, text, direct-dialing panel, carrier names | Customize → NetworkIP Homepage → About |
| Contact headline, text, address, phone, email; form on/off and recipient | Customize → NetworkIP Homepage → Contact & form |
| Service cards, global-calling panels and stats, technology cards and capacity stats | `inc/content.php` (commented PHP arrays), or the `networkip_home_content` filter from a child theme or plugin |
| Extra homepage content | Anything written in the editor on the static front page appears between the About and Services sections |
| Main interior pages (About Us, Management, Service, International Calling, Customer Intelligence, Technology, Integration, Call Quality, Contact Us) | `inc/pages.php` (commented arrays), or the `networkip_page_layouts` filter. To add headshots to the Management page, add `'photo' => 'https://…'` to each person. |
| Other pages | Normal page editor. They use a map banner (the page excerpt becomes its subtitle) and end with a contact call to action. |
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
| `assets/images/hero-globe-*.webp/.jpg` | ChatGPT handoff `hero-connected-globe-3840x2160.png`, resized to 960/1600/2560 px WebP plus a 1600 px JPG fallback |
| `assets/images/network-map-*.webp/.jpg` | ChatGPT handoff `global-network-map-3840x1536.png`, same treatment |
| `assets/icons/*.svg` | ChatGPT handoff icon set, used as `<img>` because the SVGs share internal gradient ids |
| `assets/images/networkip-logo-white*.png` | Official NetworkIP logo supplied by the client, recolored so the black lettering is white |
| `assets/images/networkip-wordmark.svg` | ChatGPT handoff fallback wordmark (no longer used) |
| `assets/fonts/manrope-*.woff2` | Manrope variable font (SIL Open Font License), self-hosted |

Nothing is hotlinked. The hero image is preloaded with `fetchpriority="high"`, and below-the-fold images lazy-load. JavaScript is a single deferred 2 KB file for the mobile menu and the header scroll state.

## Caveats

- **Logo:** the header and footer use a white version of the official NetworkIP logo (`assets/images/networkip-logo-white*.png`). The black lettering and globe are white; the gold line and red "IP" are unchanged. It was made from a small 170×50 copy of the logo, so it can look slightly soft on high-resolution screens. For a sharper result, upload a larger PNG (about 700px wide or more) with white lettering under **Customize → Site Identity → Logo for dark backgrounds**. The regular Site Identity logo is not used in the header, because its black lettering disappears on the dark background.
- **Imagery:** the globe and map are AI-generated concept art from the handoff, not official NetworkIP photography.
- **Copy:** all homepage copy comes from public networkip.net pages (Home, Service, International Calling, Customer Intelligence, Integration, Call Quality, Technology), lightly shortened. Stats (51.6M, 80M+, 25+%, under 2%, 6M+ calls a day, 1B+ accounts, 100,000+ ports, 100+ carriers) are quoted from those pages with footnotes. Have NetworkIP confirm they are still current before launch.
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
