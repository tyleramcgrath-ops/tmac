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

`*-hero.png` is the first screen at 1440×900. `*-full.png` is the full page.

The mockups are plain HTML/CSS in `src/`, with fonts vendored in `src/fonts/`. To re-render them, open the files in a browser or screenshot them with Playwright at a 1440px viewport. Carrier names appear as plain text placeholders, not official logos.
