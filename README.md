# Envue Mex — Site

Static redesign for **envuemex.com**, the Mexico operation of TMAC.
Telemática y videovigilancia para flotas (telematics & video for fleets).

## Stack
- Plain HTML / CSS / JS — no build step.
- Hosted as static files from the repo root (GitHub Pages compatible).

## Files
- `index.html` — single-page site (hero, soluciones, industrias, plataforma, stats, nosotros, CTA, contacto, footer).
- `styles.css` — design system anchored on royal purple `#4B2E83`.
- `script.js` — bilingual ES/EN toggle (persisted via `localStorage`), sticky nav, mobile menu, scroll reveal.
- `favicon.svg` — brand mark.
- `404.html` — bilingual not-found page.

## Languages
Default `es`. Toggle in the header switches every `[data-es] / [data-en]` element and remembers the choice across visits.
