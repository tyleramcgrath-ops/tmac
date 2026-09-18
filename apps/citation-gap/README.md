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
(`vercel.json`). Two things to know:

- The project has **no git connection yet**. Deploys so far were direct file uploads, and that is
  what broke: the upload carried 7 of the ~30 files the old build needed. Pointing the Vercel
  project at this repo with root directory `apps/citation-gap` makes a merge to `main` the deploy.
- **A green build log is not proof.** It said "integrity verified" for four days while shipping a
  front end four days stale. After any deploy, read the deployed bytes — fetch `/` and check for
  something only the new version has — and call `/api/render?url=…` against a real page.
