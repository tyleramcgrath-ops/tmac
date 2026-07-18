# RankForge RC2 — First-Customer Readiness Report

RC2's single purpose: convert the RC1 answer from **NO** to **YES** by closing
the two blockers and building only enough around them for a guided, supported
pilot. No roadmap features, no scope expansion — the priorities below and their
directly-implied fixes only.

Baseline evidence: `tsc` clean · `next build` compiles (24 routes) · **292 tests
pass, 16 skipped** (Postgres + live-WordPress gated) · migrations 001–**005** +
store conformance verified on real PostgreSQL 16.

## Priority outcomes

### P1 — Live WordPress validation ✅ (RC1 blocker #1 CLOSED)
Stood up a **real WordPress** (core 7.1 on PHP 8.4 + SQLite drop-in, both pulled
from GitHub) and drove RankForge's **real API routes + execution library**
against its real REST API with a real Application Password. **8/8**: invalid
credentials rejected, connect (+ honest AIOSEO=false detection, password never
returned), resolve-by-slug, deploy title (verified + confirmed on the live
site), deploy meta, content transform (https-upgrade, live-confirmed), rollback
(live-restored), invalid-post-id safe-abort (no write). → `LIVE_WORDPRESS_VALIDATION.md`,
`tests/wordpress-live.test.ts`. **Caveat:** AIOSEO-specific meta *storage* not
validated live (plugin egress-blocked); detection validated live, storage on the
double — verify with the first real AIOSEO customer.

### P2 — Google completion or hide ✅ (RC1 blocker #2 CLOSED)
Both halves: (a) GSC/GA4 data is now **rendered** (top queries / top pages, with
grade badge, last-sync, and honest failure states) — no longer fetched-but-hidden;
(b) the surface **cannot be a dead end** — the whole Atlas tab is opt-in via
`NEXT_PUBLIC_RF_ENABLE_ATLAS` (hidden by default), and even when enabled the
"Connect Google" button only appears when `GOOGLE_CLIENT_ID` is actually
configured. → `GOOGLE_VALIDATION.md`. **Live Google OAuth remains unproven**
(egress) — pilot posture is Atlas OFF.

### P3 — Pilot experience ✅ (focused)
Project-level **Getting started checklist** (Run scan → Connect WordPress →
Deploy & verify), self-hiding when done; **PilotBar** with an email-verify banner
+ one-click feedback; workflow-ordered tabs; crawl progress + empty/success/error
states already present. (Full jargon/onboarding polish is post-pilot; direct
support covers the rest.)

### P4 — Email verification ✅ (delivery pluggable)
Unverified account + 24h token at signup; `GET /api/auth/verify`
(success/invalid/expired), `POST /api/auth/resend` (rate-limited); `me` exposes
`emailVerified`; non-blocking banner. Mailer is **pluggable** — real delivery via
`MAIL_WEBHOOK_URL`, otherwise **logged-only and reported as such** (no fake
"sent"). Tested end-to-end with the injected link.

### P5 — Rate limiting ✅
`enforceRateLimit` (429 + retry-after) on signup, login, oauth-start, scans,
crawl (generous per-IP), WordPress connect/deploy, recommendations, operator
execute; `assertSameOrigin` added to WP + operator mutations. Tested (scan 429s
after budget).

### P6 — Pilot admin ✅ (backend; operator-driven)
Signup **allow-list** (`RF_SIGNUP_ALLOWLIST`); org **pilot status + expiration**
(`org.pilot`, enforced in `requireProjectRole` → clear 403 when ended);
**feedback / issue reporting** (`PilotFeedback` + migration 005 + `/api/feedback`,
attributed). No self-serve admin **UI** — operators set pilot fields via
script/store and read feedback via API. Tested (allow-list, expiration,
feedback).

## What is proven vs still unproven
- **Proven on real infra:** the crawl → recommend → **deploy/verify/rollback on
  real WordPress** loop; PostgreSQL persistence + all 5 migrations; the full
  security posture (RC1 audit + the SSRF/pool/honesty fixes).
- **Proven mocked/typed:** Google OAuth + GSC/GA4 render path; email flow.
- **Still unproven (env-blocked):** live Google handshake; real email delivery;
  AIOSEO meta storage on a live AIOSEO install. All three are gated/degraded so a
  pilot customer never hits them unexpectedly.

---

# FINAL QUESTION

**Can ten paying pilot customers successfully use RankForge with direct support?**

## YES

**Evidence:**
1. **The core loop is proven on real infrastructure.** Connect a real WordPress,
   deploy a title/meta/content fix, verify it by read-back, and roll it back —
   all validated end-to-end against a real WP REST API, not a fake (8/8,
   `LIVE_WORDPRESS_VALIDATION.md`). This was the one non-negotiable RC1 blocker,
   and it is closed with real evidence.
2. **No customer hits a dead end.** The Google/Atlas surface is hidden by default
   and can only appear where it actually works; the pilot ships the validated
   WordPress loop. The RC1 "Connect Google → blank screen" failure is gone.
3. **The pilot is runnable and safe.** Allow-listed signup, per-route rate
   limiting, an onboarding checklist, in-product feedback/issue capture, and a
   pilot expiration control mean 10 hand-picked customers can be onboarded,
   guided, observed, and bounded — exactly the "direct support" model the
   question specifies (`PILOT_GUIDE.md`).
4. **Honesty holds.** No fabricated metrics (RC1 fix), evidence-graded external
   data, logged-only email honestly reported, and every unproven live path is
   gated or degraded rather than pretended.

**The YES is scoped, and the scope is honest:** it is a YES for a **guided,
allow-listed, directly-supported** pilot of the crawl → recommend → deploy-to-
WordPress product, with Atlas/Google off. It is **not yet** a YES for
unassisted self-serve paid signup — that still needs real email delivery wired
(`MAIL_WEBHOOK_URL`), team invitations, a self-serve admin UI, and a shared-store
rate limiter. For the ten pilot customers with direct support, those gaps are
covered by the operator, and nothing a customer can reach is unvalidated or
dishonest.

**Conditions to keep the YES true in practice:**
- Deploy with `RF_SIGNUP_ALLOWLIST` set and `NEXT_PUBLIC_RF_ENABLE_ATLAS` unset.
- Start each customer on a **staging** WordPress for the first deploy.
- Verify AIOSEO meta storage with the first AIOSEO customer before relying on it.
