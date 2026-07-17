# Security Hardening (Phase D.6 P4 + P5 + P6)

Closes the two critical perimeter holes from the D.5 security review and hardens
the session layer. Every change is defensive; no dual-use tooling is added.

---

## P4 — SSRF elimination

### The defect (from D.5)
`/api/crawl` is a public, unauthenticated endpoint that fetches
attacker-influenced URLs (the user's domain, sitemap `<loc>` entries, and every
redirect hop). The old `normalizeUrl` only checked protocol + `hostname.includes('.')`
— it did not stop `http://169.254.169.254/…` (cloud metadata), private IPs, DNS
rebinding, or redirects into the internal network.

### The fix — one guard, everywhere
`app/api/seo-scan/url-guard.ts` is the single source of truth for outbound-fetch
safety. Every server-side fetch of a user-influenced URL passes through it.

- **`checkUrlSyntax` (sync):** protocol ∈ {http, https}; port ∈ {80, 443, 8080,
  8443}; rejects `localhost`, `.local`/`.internal`/`.lan`, literal private IPv4
  and IPv6 (including bracketed `[::1]`), and decimal/hex-encoded hosts (e.g.
  `2130706433` = 127.0.0.1).
- **`isSafeFetchTarget` (async):** syntax + DNS `lookup(host, {all:true})`,
  asserting **every resolved address is public** — this is what defeats DNS
  rebinding and split-horizon (a public name that resolves to an internal IP).
- **IPv4 blocks:** `0/8, 10/8, 100.64/10, 127/8, 169.254/16, 172.16/12,
  192.0.0/24, 192.168/16, 198.18/15, 224/4, 240/4, 255.255.255.255`.
- **IPv6 blocks:** `::1`, `::`, link-local (`fe80…`), ULA (`fc/fd`), AWS IPv6
  metadata (`fd00:ec2…`), and IPv4-mapped (`::ffff:…`, validated as v4).

### Wired in
- `analyze.ts` `fetchOnce` now follows redirects **manually**, re-validating
  each hop (up to 6) with `isSafeFetchTarget` — defeating redirect-to-internal.
- `crawl/route.ts` `safeText` (sitemap `<loc>` fetch) validates before fetching.
- `wp-execution.ts` `wpFetch` validates the tenant-supplied site URL before
  every request (a connection could point at an internal host or later rebind).

A test-only `__setTrustedHostsForTests` seam lets the WordPress double / PHP
emulator tests reach `wp.test` / `127.0.0.1` without weakening production — the
seam is never set outside tests.

### Tests
`tests/url-guard.test.ts` — 68 cases: private v4/v6, loopback, link-local, ULA,
cloud metadata, unsafe ports, bad protocols, numeric-encoded hosts, and a
**mocked DNS-rebinding** case (public host → private resolved address → blocked)
plus split-horizon.

---

## P5 — Remove the legacy WordPress entry point

### The defect (from D.5)
`app/api/wordpress/route.ts` was a second, insecure WordPress path:
unauthenticated, no tenant scoping, no audit log, and an **env-credential
fallback** (`WP_SITE_URL` / `WP_USER` / `WP_APP_PASSWORD`) that let an
`action:'apply'` write run against a server-configured site with no project
ownership check.

### The fix
Deleted the route entirely. The authenticated per-project API
(`/api/projects/[projectId]/wordpress` + `lib/foundation/wp-execution.ts`) is
now the only deployment path: connections stored **encrypted**, tenant-scoped,
role-gated, audited, with read-back verification and rollback. No caller
referenced the legacy endpoint. The server-wide WP credential vars were removed
from `.env.example`.

**Result: exactly one secure deployment API. Everything authenticated, audited,
tenant-scoped.**

---

## P6 — Session security

### Session revocation + logout everywhere
The D.5 review flagged: *no session revocation*. Fixed with a `tokenVersion`:

- `User.tokenVersion` is embedded in the session JWT as a `tv` claim.
- `currentUser` rejects any token whose `tv` ≠ the user's current
  `tokenVersion` — even a well-signed, unexpired token is dead once the version
  advances.
- `revokeSessions(userId)` bumps the version; `POST /api/auth/logout
  {everywhere:true}` calls it, invalidating every device/browser at once.
- A fresh token is minted on every login (rotation on auth); a version bump
  rotates all. Legacy tokens default to `tv=0`.

### Rate limiting
`lib/foundation/rate-limit.ts` — an in-memory sliding-window limiter:
- **Login:** 10 attempts / 5 min per (client IP + target email) → 429 +
  `Retry-After`.
- **Signup:** 5 / hour per client IP.
- **Honest scope:** per-process. Exact on one instance; needs a shared store
  (Redis/Postgres) to be global across horizontally-scaled serverless. This is
  documented in the module, not hidden.

### CSRF review
The session cookie is `SameSite=Lax`, which already blocks it from cross-site
sub-requests. As defense-in-depth, `assertSameOrigin(request)` rejects a
mismatched `Origin` on auth POSTs (login/signup/logout).

### APP_SECRET strength
- Crypto floor raised **8 → 16** (`crypto.ts`).
- Production now requires **≥32** (`env.ts`), with the hint `openssl rand -base64 32`.
- `requireAppSecret` enforces 32 in production, 16 otherwise.

### Cookie settings
`HttpOnly` + `SameSite=Lax` retained; `Secure` is now also set on the
cookie-clear in production (it was only on the set path before).

### Auth middleware review
Enforcement remains per-route via `requireUser` / `requireProjectRole` with
404-not-403 tenant isolation (server-derived membership, never client-claimed).
This model was found sound in D.5; P6 hardened the token lifecycle around it
rather than restructuring it. Centralizing enforcement into Next.js middleware
is a noted, non-blocking future refinement.

### Tests
`tests/auth-routes.test.ts` adds: logout-everywhere revokes an existing session
(old cookie goes dead), repeated failed logins hit 429, and a cross-origin login
is 403. `tests/foundation.test.ts` updated for the `tv`-bearing token
(round-trips with version; legacy token defaults to 0). The rate limiter is
reset between route tests via `__resetRateLimits`.

### Store change
`updateUser()` was added to the `FoundationStore` interface and both
implementations to persist `tokenVersion` — covered by the P7 store-conformance
contract.
