# RC2 Priority 1 — Live WordPress Validation (PASSED)

This closes the RC1 mandatory blocker: RankForge's WordPress deploy path is no
longer proven only against an in-process fake — it has now been exercised
**end-to-end against a real, running WordPress**, through RankForge's real API
routes and real execution library.

## Environment (real, disposable WordPress)
- **WordPress core:** 7.1-beta2 (cloned from `github.com/WordPress/WordPress`).
- **Runtime:** PHP 8.4.19, WordPress built-in server (`php -S 127.0.0.1:8899`)
  with a router for pretty permalinks.
- **Database:** SQLite via the official `sqlite-database-integration` drop-in
  (`packages/plugin-sqlite-database-integration`) — no MySQL required.
- **Auth:** a real WordPress **Application Password** for user `rfadmin`, sent as
  HTTP Basic — exactly what a customer supplies.
- **REST API:** `http://127.0.0.1:8899/wp-json/wp/v2/...` returning live 200s.
- Reached from RankForge via the SSRF guard's trusted-host seam
  (`__setTrustedHostsForTests(['127.0.0.1'])`) since the target is localhost.

Why local WP: this sandbox blocks all outbound network except GitHub + package
registries, so a hosted WordPress is unreachable. Pulling WP core + the SQLite
plugin from GitHub and running them on PHP produces a **genuine WordPress REST
API** — the same endpoints and auth a customer site exposes — so the validation
is real, not mocked.

## What was validated
Driven by `tests/wordpress-live.test.ts` (gated on `RF_TEST_WORDPRESS_URL`),
against the real routes `PUT/GET/POST /api/projects/[id]/wordpress` and the real
`executeWpDeployment`/`rollbackWpDeployment`:

| # | Case | Result |
|---|---|---|
| 1 | **Invalid credentials** at connect | Real WP returns 401 → route returns **502** "could not authenticate"; nothing stored |
| 2 | **Connect** with a real Application Password | 200; connection stored; **AIOSEO auto-detected as false** (honest — none installed); GET never returns the password |
| 3 | **Read** (resolve a page URL → post id by slug) | 200; real post id resolved |
| 4 | **Deploy title** → read-back **verify** | status `verified`, `titleMatches=true`; **independently confirmed** the live page title changed |
| 5 | **Deploy meta description** (excerpt path, non-AIOSEO) | status `verified`, `metaMatches=true` |
| 6 | **Deploy content transform** (https-upgrade) to the post body | status `verified`; live content confirmed `http://…` → `https://…` upgraded |
| 7 | **Rollback** the title | status `rolled_back`; **live site confirmed restored** to the original title |
| 8 | **Invalid post id** (before-capture fails) | request errors safely; **no write, no record persisted**; target page untouched |

**8/8 passed.** Live transcript sample (raw REST, outside the test):
```
POST /wp-json/wp/v2/pages/5  {"title":"Live Demo Title"}   → HTTP 200
GET  /wp-json/wp/v2/pages/5?context=edit                   → read-back title: "Live Demo Title"
```

## Failure modes covered
- **Invalid credentials** — case 1 (real 401 → honest 502).
- **Permission failure** — the connect probe hits `/users/me?context=edit`; a
  user lacking `edit_posts` fails the same 401/403 path as case 1. (Validated at
  the auth boundary; not separately scripted with a low-priv user.)
- **Network timeout** — `wpFetch` aborts at 20s (`AbortController`); covered by
  the fake-WP suite; not reproducible against instant localhost.
- **Verification mismatch** — if a write doesn't persist, read-back sets
  `verify_failed` and **reopens** the recommendation (covered live-adjacent by
  case 8's safe-abort and by `wordpress-execution.test.ts` `dropMeta`).

## AIOSEO note (honest boundary)
The user asked for AIOSEO. The AIOSEO plugin is distributed via wordpress.org
(egress-blocked here) and is not on GitHub, so it could not be installed in this
environment. Instead, RankForge's **AIOSEO auto-detection was validated live and
correctly returned `false`**, and the non-AIOSEO meta path (WordPress core
`excerpt`) was validated end-to-end (case 5). The AIOSEO-specific meta storage
path (`aioseo_meta_data` / `_aioseo_description`) remains covered by the fake-WP
suite only; it should be validated on a real AIOSEO install during the pilot
(one of the 10 sites will have it).

## How to reproduce
```bash
# 1. Bring up WP (core + SQLite plugin from GitHub) on PHP; create an
#    application password (see the setup used in this session).
# 2. Point the gated test at it:
RF_TEST_WORDPRESS_URL=http://127.0.0.1:8899 \
RF_TEST_WP_USER=rfadmin RF_TEST_WP_APP_PASSWORD=<app-password> \
APP_SECRET=<32+chars> \
npx vitest run tests/wordpress-live.test.ts
```

## Verdict
The core promise — **connect a customer's WordPress and safely deploy, verify,
and roll back SEO fixes** — is validated on real WordPress infrastructure. RC1
Blocker #1 is **closed** (with the AIOSEO-storage caveat above scheduled for the
pilot).
