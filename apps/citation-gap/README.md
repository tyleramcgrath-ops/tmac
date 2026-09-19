# Citation Gap

Scans the live Google top 10 and the AI Overview for a keyword, scores a page against both, and
hands back an ordered list of what to change — every item with a ready-to-paste Claude prompt.

**Live:** https://citation-gap.vercel.app · Vercel project `citation-gap`, team
`team_6bNIz3y0Q62nzicOciNA6Q2w` (SSO off, publicly shareable).

`PROJECT-DOC.md` is the full history and architecture; start there. This file is the short version
of how to work on it.

## Layout

```
index.html           the entire front end, one file, no build step — marketing homepage, app
                     shell, scanner, scoring, prompts. Edit this; it is what ships.
api/serp.js          one Google query, normalized across SerpApi and Serper
api/page.js          stub → api/page.impl.js   (fetch + parse a URL as served)
api/render.js        stub → api/render.impl.js (headless Chromium, painted-text measurement)
build.js             the deploy guard: verify every shipped file, then write public/index.html
ship-manifest.json   the sealed sha256 of every file a working deployment needs
test/                build guard, regression suite, and two real-Chromium flows
```

No framework. Two npm deps (`@sparticuz/chromium`, `puppeteer-core`), used by `api/render.js` alone.

## The front door

`index.html` carries two designs on purpose. The marketing homepage (`#homeScreen`, every `.mkt-`
rule) is a warm paper "calibration report" with its own palette declared on `.homescreen` — it does
not read the app's theme tokens, so the in-app light/dark toggle cannot alter it. The app behind it
stays dark. The site is the spec sheet; the app is the instrument switched on.

Two things there are product decisions, not styling, and should be changed deliberately:

- **Prices** (`$0` / `$39` / `$149`) are anchors, not researched positions. They live in the
  `.mkt-tier` blocks.
- **The waitlist links** point at `hello@thecitationgap.com`, which does not exist yet. Either set
  that mailbox up or repoint the two `mailto:` links before sending anyone to the page.

The workspace panel (`#splash`) is opt-in by design: a launch control goes straight to the scan
form, and only **Sign in** opens the panel. It asks for a name, never a password, because there is
no account behind it — putting a password box in front of a free tool is a toll gate, not security.

## Working on it

```bash
npm install
npm test          # build guard → regression → scan flow → demo flow (needs Chromium; ~3 min)
npm run build     # verify the manifest and write public/index.html
```

The browser flows need a Chromium binary: `CHROME_PATH=/opt/pw-browsers/chromium npm test`, or
whatever the local path is. `test/regression.js` and the two flows also want Playwright available
globally (`npm root -g`).

## Shipping a change

`build.js` fails closed: if a shipped file is missing, or its bytes do not match
`ship-manifest.json`, nothing is written and the previous production deployment stays live. That is
deliberate — a deploy that quietly went out missing files, or shipping a stale front end, is the
failure this project actually hit (see the v10.7 section of `PROJECT-DOC.md`).

So the loop is:

```bash
# 1. edit index.html / api/*.js
# 2. npm test
npm run seal      # re-record the hashes; prints exactly which files moved
# 3. commit the change AND the updated ship-manifest.json together
```

Skipping the seal is not a way to ship faster — it is a failed build.

CI enforces this: `.github/workflows/build.yml` runs `pnpm build` in this directory on every pull
request, which is `node build.js`, which fails on an unsealed change. A stale front end cannot reach
a green PR.

## Deploying

Vercel builds with `node build.js` and serves `public/` plus the `api/` functions
(`vercel.json`).

The live site is deployed by the **`citation-gap-web`** project
(`prj_eIRZinlGrCpHHzWt0OyiYqi3bePp`), linked to `tyleramcgrath-ops/tmac` with root directory
`apps/citation-gap`, Node 22.x, Vercel Authentication off. A merge to `main` builds and deploys it.

**One manual step remains on every deploy, until a dashboard fix is done.**
`citation-gap.vercel.app` is still registered to the older, unlinked `citation-gap` project, so a
new production deploy lands on `citation-gap-web.vercel.app` and the live URL stays pointed at
whatever deployment it was last aliased to. Re-point it with `assign_alias` (alias
`citation-gap.vercel.app` → the new deployment id).

To remove that step for good: in the Vercel dashboard, remove `citation-gap.vercel.app` from the old
`citation-gap` project — or delete that project, though that also destroys the rollback deployment
below — then add the domain to `citation-gap-web`. After that a merge to `main` is the whole deploy.
Renaming the old project does **not** free the domain; that was tried and failed (see v10.7).

Rollback at any time: assign `citation-gap.vercel.app` to `dpl_HwoQcbWBd8SumqhQTuPM4yz7GEt3`, the
8 Sep pre-redesign production build.

**A green build log is not proof.** It said "integrity verified" for four days while shipping a
front end four days stale. After any deploy, read the deployed bytes — fetch `/` and confirm its
sha256 matches `index.html` — and call `/api/render?url=…` against a real page.
