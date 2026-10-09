# NetworkIP homepage redesign — concepts

Three homepage directions for https://www.networkip.net/, all built from the current site's content (25+ years, direct connections with AT&T / Verizon / T-Mobile / Boost, 51.6M foreign-born U.S. residents, comparison chart, contact details).

| File | Concept |
|---|---|
| `00-current-site.png` | Current homepage, for reference |
| `01-clarity-*.png` | **A: Clarity.** Light, editorial, premium. Fraunces serif + Instrument Sans, brand navy and gold, a single stat card, a clean comparison table. |
| `02-signal-*.png` | **B: Signal.** Dark "network operator" look: a dotted globe with call routes from Texas, a bento grid of stats, a mono-type route console. |
| `04-professional-*.png` | **D: Professional (round 2).** A plain white layout in IBM Plex Sans, navy with a small gold accent. Includes a service status panel, a to-scale chart of the market, a comparison table and a three-step launch section. Responsive, with mobile screenshots. |
| `05-corporate-*.png` | **E: Corporate (round 2).** The same page as D with a navy header band, gold buttons and Source Sans 3. |
| `06-vibrant-*.png` | **F: Vibrant (round 3).** D's professional structure with more energy: a glowing navy hero, an animated live-calling dashboard, a scrolling strip of destinations, a gradient stats band, colorful service icons and hover motion. Plus Jakarta Sans. |
| `07-group-light-*.png` | **G: Group, light (round 4, for the board).** Presents NetworkIP as the parent company. Refined ivory and navy, Newsreader and Manrope, a group structure chart linking the parent to its operating companies, operating principles, leadership and contact. Operating company names are placeholders. |
| `08-group-dark-*.png` | **H: Group, dark (round 4, for the board).** Premium navy and gold, Cormorant Garamond and Hanken Grotesk, an animated route-map hero, a portfolio index of operating companies, a history timeline and leadership. Operating company names are placeholders. |
| `03-homeline-*.png` | **C: Home Line.** Warm and human: cream and rust, a phone call UI ("Included in your plan"), a three-step launch flow. |
| `09-handoff-left-*.png` | **I: Handoff "left" concept, built as a WordPress theme (round 5).** These are screenshots of the actual theme running on WordPress 7.1, not a static mockup. Desktop full/hero, tablet, mobile full, open mobile menu, the dropdown menu, and the designed interior pages (`*-interior` is Technology; `*-page-*` are About, Management, International Calling, Integration and Contact). Theme source is in `wp-theme/networkip/`; the installable zip is `wp-theme/networkip-theme.zip`. See `wp-theme/networkip/README.md`. |
| `10-white-red-*.png` | **J: White & Red (round 6, white with logo colors).** Mostly white, black type and the logo's brand red for buttons and accents. Gold appears only as thin lines, like the logo's gold line. Features a red-lit globe in a circle, a light map section, a black technology band and a red contact band. Manrope. |
| `11-white-navy-*.png` | **K: White & Navy (round 6).** White pages with deep navy sections, red buttons and thin gold lines. The hero puts the blue globe in a rounded panel with key figures, followed by a navy global-calling band and a navy footer. Plus Jakarta Sans. |
| `12-white-charcoal-*.png` | **L: White & Charcoal (round 6).** Editorial layout with a big headline, a full-width monochrome globe band with figures, services as numbered rows, and charcoal contact and footer. Red accents. Hanken Grotesk. |
| `13-white-steel-*.png` | **M: White & Steel Blue (round 6).** Soft and airy: a centered hero over a pale world map, rounded white cards with soft shadows, steel-blue accents and red buttons. Figtree. |
| `14-hero-white-blue-*.png` | **N: Big hero, white page, blue (round 7).** Keeps the original's full-width dark globe hero. Everything below it is white, with the original electric-blue buttons and accents, and the footer is navy. The closest to the original. |
| `15-hero-white-red-*.png` | **O: Big hero, white page, red (round 7).** Same hero with a gold-and-red line under it, like the logo. White page, red buttons and accents, a red contact band and a charcoal footer. |
| `16-hero-white-overlap-*.png` | **P: Big hero with an overlapping white card (round 7).** A white stats card (1998, 25+, 6M+, 100+) sits across the bottom edge of the hero. Services are an open, borderless grid. Red accents and a navy footer. |
| `17-hero-white-curve-*.png` | **Q: Big hero with a curved edge (round 7).** The hero ends in a curved white edge. Below it, white and pale-blue sections with soft-shadow cards, blue icons and red buttons, and a white footer. |
| `18-hero-all-white-*.png` | **R: Big hero, all-white page (round 7).** The most white of the set: only the hero is dark. Minimal service columns, red accents, a boxed contact call to action and a white footer. |
| `19-23-gold-hero-*.png` | **S–W: Gold versions of N–R (round 8).** The same five layouts with more of the logo's gold: gold buttons, a gold "Mobile Growth" in the headline, gold stat numbers, icons, section-label lines, a gold line under the hero and a gold rule over the footer. A deeper gold is used for text on white so it stays readable. 19 = N (blue), 20 = O (red), 21 = P (overlapping card), 22 = Q (curved edge, now gold-rimmed), 23 = R (all white). |

`*-hero.png` is the first screen at 1440×900. `*-full.png` is the full page.

The mockups are plain HTML/CSS in `src/`, with fonts vendored in `src/fonts/`. To re-render them, open the files in a browser or screenshot them with Playwright at a 1440px viewport. Carrier names appear as plain text placeholders, not official logos.
