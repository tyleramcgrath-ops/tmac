# RankForge — Security Review (Phase D.5)

Verdict: the **tenant-isolation and approval/safety design is genuinely good**; the serious problems are all at the **perimeter**. Two are critical and I introduced/carried them through Phases A–D — stated plainly, not defended.

## Ranked findings

### CRITICAL

**S-1. Unauthenticated SSRF via `/api/crawl`.** The route has no `requireUser` and fetches user-supplied URLs. Its only gate, `normalizeUrl` (`analyze.ts:441`), checks protocol + `hostname.includes('.')` — which **passes `169.254.169.254` (cloud metadata), `127.0.0.1`, and any internal `host.domain`**. It follows redirects and also fetches attacker-supplied sitemap `<loc>` URLs (same-host filtered only, not private-IP). `seo-intel` already has the right guard (`seo-intel/lib/validate.ts isPrivateHostname`) — the root foundation just doesn't use it. **Impact:** unauthenticated cloud-metadata theft / internal port scan. **Fix:** run every outbound fetch (crawl, sitemap, wp-execution) through a private-IP/redirect-hop guard; validate the *resolved* IP, not just the hostname.

**S-2. Unauthenticated legacy `/api/wordpress` with env-cred fallback.** `app/api/wordpress/route.ts` has no auth and falls back to server env creds `WP_SITE_URL/WP_USER/WP_APP_PASSWORD` (`:19-21`), including `action:'apply'` writes (`:155`). If those env vars are set in a deployment, **any anonymous caller can drive the server's WordPress account.** **Fix:** require auth + project role, drop the env-cred fallback (the new project-scoped WP path already does this correctly).

### HIGH

**S-3. No session revocation.** `logout` only clears the cookie client-side; the JWT is stateless (jose HS256, 7-day TTL, `crypto.ts:62`). A stolen or logged-out token stays valid 7 days; a password change can't invalidate sessions. **Fix:** a per-user `tokenVersion` (or server session record) checked on each request.

**S-4. No rate limiting anywhere.** No limiter on `login`/`signup` → unthrottled credential brute force + signup spam; none on `/api/crawl` or operator `execute` → resource/SSRF amplification. Login is also unaudited (S-6), so brute force is both unthrottled and invisible. **Fix:** IP+account limiter on auth; per-project limiter on crawl/deploy.

### MEDIUM

**S-5. Weak `APP_SECRET` floor + single static key, no rotation.** Accepts min length 8 (`env.ts:36`, `crypto.ts:39`); one key does double duty (session signing AND WP-password encryption), so rotating it invalidates every session *and* makes stored WP passwords undecryptable. **Fix:** require ≥32 chars; separate signing vs encryption keys with a rotation path.

**S-6. Audit log not tamper-evident + login not audited.** `rf_audit` is a plain table with bare INSERTs (no hash chain/signature); the app's DB role has full DML. Login/logout (success or failure) are not audited at all, and no API route exposes `listAudit` for in-product review. **Fix:** hash-chain entries; audit auth events; add a read API.

**S-7. Isolation is per-route convention, not systemic.** Every project route *does* call `requireProjectRole` today (verified), returning 404-not-403 — good — but there is no `middleware.ts`. A future route that forgets it is a silent cross-tenant hole. **Fix:** a middleware guard or a typed wrapper that forces project resolution.

### LOW–MEDIUM

- **S-8. scrypt N=16384** is below current guidance (≥2^15/2^17). Bump.
- **S-9. CSRF is SameSite=Lax only**, no token/Origin check. Lax + JSON-body blocks classic CSRF reasonably; add an Origin allowlist on mutations for defense-in-depth.
- **S-10. Stored-XSS surface:** crawled `title`/`metaDescription` are stored verbatim and rendered; confirm the UI escapes them (React escapes by default — verify no `dangerouslySetInnerHTML`).

## Strengths worth preserving

- **Parameterized SQL throughout** (`postgres.ts`) — no injection surface.
- **AES-256-GCM WP-credential encryption**, never returned to the client (`crypto.ts:45`, `wordpress GET` returns only siteUrl/username/aioseo).
- **404-based tenant isolation** with server-derived membership (`auth.ts:66-70`), re-checked on every sub-resource.
- **Non-bypassable dangerous-action block** in the approval flow: `safety.blocked` is checked *before* approval (`execute.ts:95`), the policy PUT sanitizes input (can't inject auto-approve for a dangerous kind), and admin role gates deploy. (Caveat: the by-`kind` half of the block is inert — see `TECHNICAL_DEBT.md` #6 — the working guard is the title regex; make it a typed flag.)

## Priority

Fix **S-1 and S-2 before anything else** — they are unauthenticated and reachable. Then S-3/S-4 (account safety), then S-5/S-6/S-7. None require a redesign; all are contained, well-understood changes.
