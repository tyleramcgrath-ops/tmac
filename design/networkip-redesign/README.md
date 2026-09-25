# NetworkIP homepage redesign — concepts

Three homepage directions for https://www.networkip.net/, all built from the current site's content (25+ years, direct connections with AT&T / Verizon / T-Mobile / Boost, 51.6M foreign-born U.S. residents, comparison chart, contact details).

| File | Concept |
|---|---|
| `00-current-site.png` | Current homepage, for reference |
| `01-clarity-*.png` | **A: Clarity.** Light, editorial, premium. Fraunces serif + Instrument Sans, brand navy and gold, a single stat card, a clean comparison table. |
| `02-signal-*.png` | **B: Signal.** Dark "network operator" look: a dotted globe with call routes from Texas, a bento grid of stats, a mono-type route console. |
| `03-homeline-*.png` | **C: Home Line.** Warm and human: cream and rust, a phone call UI ("Included in your plan"), a three-step launch flow. |

`*-hero.png` is the first screen at 1440×900. `*-full.png` is the full page.

The mockups are plain HTML/CSS in `src/`, with fonts vendored in `src/fonts/`. To re-render them, open the files in a browser or screenshot them with Playwright at a 1440px viewport. Carrier names appear as plain text placeholders, not official logos.
