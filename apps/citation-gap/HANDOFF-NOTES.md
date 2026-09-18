# Handoff notes for Claude Code

Read `PROJECT-DOC.md` first for full architecture and history.

**One thing PROJECT-DOC.md's Architecture section has stale**: it describes index.html
being assembled from a chain of remote-fetched patches (v9.1 -> v10.6). That mechanism
was retired. `build.js` now assembles `index.html` from 7 local files in
`patches/srcparts/index-1.html` ... `index-7.html` (plain concatenation with `\n`
between parts, sha256-checked against `INDEX_SHA` in build.js), with no network
dependency for the front end. The old chain patches (`patches/v9.1.json` through
`patches/v10.6.json` at the top level of `patches/`) are dead and not included here.

`build.js` still fetches `api/page.impl.js` and `api/render.impl.js` bodies from two
pinned Vercel preview URLs and applies `patches/page-v10.6.json` and
`patches/render-v10.5.json` on top (sha256-checked at every step, fails closed on any
mismatch). Those two impl files are included here too as a local fallback / for
reading, but `build.js` still needs network access to the pinned preview URLs to
regenerate them from scratch if you ever need to rebuild `public/index.html` locally
with `node build.js`.

Not included: `node_modules` (run `npm install` — only `@sparticuz/chromium` +
`puppeteer-core`, used by `api/render.js` at runtime on Vercel), and the screenshot /
scratch files from earlier testing sessions.

Deploy: this was being pushed to Vercel (`team_6bNIz3y0Q62nzicOciNA6Q2w`, project
`citation-gap`) via direct file upload, not git — there's no linked GitHub repo yet.
If you want git-based deploys going forward, `git init`, connect the Vercel project
to a new GitHub repo, and push.
