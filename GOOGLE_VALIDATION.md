# RC2 Priority 2 — Google Integration: Completion + No Dead End

RC1 flagged "Connect Google" as a dead end: the live OAuth handshake is unproven
(egress-blocked) and, even on success, the imported GSC/GA4 data was never
rendered. RC2 resolves this with **both** halves of the P2 requirement:

## A) Rendered end-to-end (no dead end when enabled)
- **Provider status** — each Google source shows connected / disconnected /
  error / unauthorized with a human detail (`AtlasTab` integration cards).
- **GSC data** — `snapshot.gsc` is now rendered as a top-queries table
  (query, clicks, impressions, CTR, position) with a grade badge and **last
  sync** timestamp (`GscPanel`). Previously fetched-but-hidden.
- **GA4 data** — `snapshot.analytics` rendered as a top-pages table (sessions,
  engaged, conversions) with grade + last sync (`Ga4Panel`).
- **Failure states** — when a provider returns unavailable/unauthorized/error,
  the panel shows the honest reason (`o.evidence.note`) instead of a blank or a
  fabricated number. Revenue stays null when GA4 reports no currency.

## B) Hidden entirely unless it can actually work (the guarantee)
Two gates ensure no customer ever clicks "Connect Google" and reaches nothing:
1. **Workspace opt-in** — the whole Atlas tab is shown only when
   `NEXT_PUBLIC_RF_ENABLE_ATLAS=1`. It is **hidden by default**, so a guided
   pilot never sees the external-intelligence surface unless an operator turns
   it on (`app/app/projects/[projectId]/page.tsx`).
2. **Credential presence** — even with Atlas enabled, the "Connect Google"
   button + integration cards render only when the deployment actually has
   Google OAuth configured (`GOOGLE_CLIENT_ID`/`SECRET` set → `configured:true`
   from `GET /integrations`). If not configured, the panel shows a plain "not
   enabled on this workspace" note, not a broken button. Test:
   `integrations-routes.test.ts` asserts `configured=false` without creds.

## What is proven vs unproven (honest boundary)
- **Proven (mocked):** the OAuth code exchange, token refresh, CSRF-safe state,
  encrypted storage, and the GSC/GA4 → observation → render path are all
  unit-tested with an injected fake (`oauth-google.test.ts`,
  `google-providers.test.ts`), and the rendering is typed end-to-end.
- **Unproven (environment-blocked):** the **live handshake with Google** and
  **live GSC/GA4 API responses** have still never run — this sandbox cannot
  reach `accounts.google.com` / `googleapis.com`. That is why, for the pilot,
  the recommended posture is **Atlas OFF** (option B) until the live OAuth flow
  is validated on a deployment where Google is reachable (Vercel) with real
  `GOOGLE_CLIENT_ID`/`SECRET`.

## Recommendation for the 10-customer pilot
Ship with `NEXT_PUBLIC_RF_ENABLE_ATLAS` unset (Atlas hidden). The pilot's value
is the crawl → recommend → **deploy to WordPress** loop (validated live). Turn
Atlas on only after a controlled live-OAuth validation with one internal Google
account — at which point the rendering above makes it a real, non-dead-end
feature. Either way, **the dead end is gone**: the button cannot appear where it
would not work.
