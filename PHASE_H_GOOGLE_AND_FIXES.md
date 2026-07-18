# Phase H — Connect Google (one click) + Fix-everything via WordPress

Two capabilities, built on the existing foundation (no new dashboards, no
fabricated data):

1. **Connect Google** — a single button that opens Google's consent screen and
   connects a project to Search Console + Analytics (read-only), storing the
   OAuth tokens encrypted.
2. **Fix everything via WordPress** — an editable priority list, plus new
   one-click fixes that actually resolve issues (HTTP/HTTPS mismatch, missing
   H1, thin internal linking) by writing the WordPress post body — with the same
   safety, read-back verification, and rollback as the existing title/meta path.

---

## 1. Connect Google

### What you must do (the only step RankForge can't do for you)
Create a **Google Cloud OAuth client** and set two env vars in Vercel:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- (optional) `GOOGLE_OAUTH_REDIRECT_BASE` — only if you want to pin the callback
  origin; otherwise it's derived from the request origin.

**Authorized redirect URI** to register in the console:
`https://<your-app-domain>/api/oauth/google/callback`

Scopes requested (read-only): `webmasters.readonly` (Search Console),
`analytics.readonly` (GA4), plus `openid email` to label the connection.

### The flow
1. **Button** (Atlas tab → "Connect Google") → `GET /api/projects/:id/integrations/google/start`
   returns the Google consent URL. Admin-only.
2. Browser goes to Google, user consents.
3. Google redirects to `GET /api/oauth/google/callback?code&state`. The server:
   - verifies the **signed state** (AES-256-GCM — unforgeable + bound to the
     authorizing user; also rejects replay/expiry),
   - exchanges the code for tokens,
   - **encrypts** the token bundle (`encryptSecret`, the same AES-256-GCM used
     for WordPress app-passwords) and stores it per `(project, kind)`,
   - redirects back to the Atlas tab with a success/failure banner.
4. Search Console / Analytics now resolve as **live providers**
   (`connectedProviderSet`) in Mission Atlas; their readings grade `observed`.

### Security properties
- The token bundle is **never** returned by an API, serialized into a snapshot,
  or logged. The `/integrations` GET returns a projection that omits
  `credentialEnc` (asserted by test).
- State is CSRF-proof (encrypted + session-user check). Start/disconnect require
  the **admin** role and same-origin.
- Access tokens auto-refresh (offline refresh token) and the refreshed bundle is
  re-encrypted and persisted.
- Tenant-isolated: another tenant hitting your project id gets `404`.

### Files
- `lib/foundation/oauth/google.ts` — auth URL, code exchange, refresh, signed
  state, token encode/decode. All network calls go through an injectable
  `fetchImpl` (fully unit-tested without the network).
- `lib/foundation/external/providers/google.ts` — `GoogleSearchConsoleProvider`,
  `GoogleAnalyticsProvider` behind the existing interfaces.
- `app/api/projects/[projectId]/integrations/google/start/route.ts`,
  `app/api/oauth/google/callback/route.ts`, `app/api/projects/[projectId]/integrations/route.ts`.
- Store: `ProviderConnection` type + `upsert/get/list/deleteProviderConnection`
  on both stores + migration `004_provider_connections.sql`.
- UI: `AtlasTab.tsx` "External data sources" card (Connect / Disconnect / GA4
  property id).

---

## 2. Fix everything via WordPress

### Editable priorities
- Every recommendation can be **reordered** (▲/▼), which sets a persisted
  `userPriority` that wins over the engine's rank. "pinned ✕" clears it back to
  the engine ranking.
- `PATCH /api/projects/:id/recommendations` accepts `{ id, userPriority }` (or
  `null` to clear), independent of the status transitions it already supported.
- Dismiss / restore continues to use the existing status machine.

### New one-click fixes (write the WordPress body)
The Operator gained a **content-write** surface alongside title/meta:

| Issue (ruleId) | Fix | Transform |
| --- | --- | --- |
| `mixed-content` (HTTP/HTTPS mismatch) | Upgrade same-host `http://` sub-resources to `https://` | `https-upgrade` |
| `missing-h1` | Insert a single `<h1>` derived from the page title/slug | `prepend-h1` |
| `internal-linking` | Append a "Related pages" block linking to **real crawled** pages | `append-internal-links` |

Properties that keep this honest and safe:
- Transforms are applied to the **live post body** at deploy time (not a stale
  crawl), are **deterministic and idempotent** (re-applying a satisfied fix is a
  no-op recorded as "already satisfied"), and are **additive or like-for-like**
  (no user content is deleted).
- Internal-linking only ever links to pages that exist in the crawl — never an
  invented URL.
- Every content write is **read-back verified** (by the transform's invariant,
  since WordPress may reformat raw HTML) and **reversible** (the before-body is
  captured and restored on rollback), exactly like title/meta.
- These fixes require **explicit approval** (they are not auto-applied) and pass
  through the same safety engine. `canonical`/indexation-class changes remain
  blocked from automation.

### One-click UX
The "Fix on WordPress" button now asks the Operator for the concrete generated
fix, shows it (editable for title/meta, preview for content transforms), and
deploys through the safety-gated, verified pipeline — covering every fix kind.
Advisory-only findings (e.g. alt text) are shown as advisory, never fabricated
into a deploy.

### Files
- `lib/foundation/operator/content-fix.ts` — transforms + verification.
- `lib/foundation/operator/fixgen.ts` — new generators + `FixGenContext`.
- `lib/foundation/operator/pipeline.ts` — content fixes marked deployable.
- `lib/foundation/wp-execution.ts` — content write + content-aware verify +
  rollback (`WpChanges`).
- `lib/foundation/reco/rules.ts` — `missing-h1` + `internal-linking` rules,
  registered in `RULE_REGISTRY`.
- `app/api/projects/[projectId]/operator/{preview,execute}/route.ts` — pass site
  pages; build content changes.
- UI: `RecommendationsTab.tsx` (reorder), `DeployFromRecommendation.tsx`
  (operator-driven one-click).

---

## Validation

- `tsc` clean; `next build` compiles (new routes present).
- Full suite: **282 passed | 8 skipped** (Postgres-gated).
- New tests: `oauth-google` (11), `content-fix` (11), `google-providers` (5),
  `integrations-routes` (8), extended `store-conformance` (provider connections)
  and `wordpress-execution` (content transforms).
- Real **PostgreSQL 16**: store conformance (incl. provider connections),
  migrations 001–004, `postgres-store` all pass; migration `004` verified with
  compound PK `(project_id, kind)` and `ON DELETE CASCADE`.

## What is NOT proven (honest boundary)
- The **live Google token exchange / API calls** were not run against Google —
  this sandbox's egress is restricted to GitHub + package registries. The flow
  is proven end-to-end against an injected fake; it goes live the moment
  `GOOGLE_CLIENT_ID`/`SECRET` are set on Vercel. See
  `PHASE_G_LIMITATIONS.md` for the standing statement (now partially closed:
  the encrypted credential store + connect flow exist).
- The **live WordPress content write** was proven against the in-process WP test
  double (deploy → read-back verify → rollback), not a live WordPress site.
