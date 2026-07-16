# Google Integrations Setup (Search Console + Analytics 4)

This guide connects RankForge to **Google Search Console (GSC)** and **Google
Analytics 4 (GA4)** using your own Google Cloud OAuth application. RankForge
never ships shared Google credentials — you create them once for your
environment.

Until these steps are complete, RankForge runs honestly in a
**"Google OAuth is not configured"** state: the connection center and property
picker are fully usable with clearly-labeled preview (mock) data, and no
fabricated metrics are ever shown for a real project.

---

## 1. Create / select a Google Cloud project

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or select an existing one).

## 2. Enable the required APIs

Enable all three under **APIs & Services → Library**:

- **Google Search Console API**
- **Google Analytics Admin API**
- **Google Analytics Data API**

## 3. Configure the OAuth consent screen

1. **APIs & Services → OAuth consent screen**.
2. User type: **External** (or **Internal** for a Workspace-only app).
3. Fill in app name, support email, and developer contact.
4. Add the scopes RankForge requests (read-only):
   - `https://www.googleapis.com/auth/webmasters.readonly` (GSC)
   - `https://www.googleapis.com/auth/analytics.readonly` (GA4 data)
   - `https://www.googleapis.com/auth/analytics.edit` (GA4 — list properties via Admin API)
5. While the app is in **Testing**, add your Google account under **Test users**.

## 4. Create OAuth credentials

1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Add the **Authorized redirect URIs** below.

### Redirect URIs implemented by RankForge

RankForge handles the OAuth callback at:

```
/api/integrations/google/callback?service=gsc
/api/integrations/google/callback?service=ga4
```

Register the full URL for each environment you use:

- **Local:**   `http://localhost:3000/api/integrations/google/callback`
- **Preview:** `https://<your-preview-domain>.vercel.app/api/integrations/google/callback`
- **Production:** `https://<your-production-domain>/api/integrations/google/callback`

(The `?service=` query param is added by RankForge at authorization time; you
only register the path.)

## 5. Set environment variables

RankForge reads these (canonical names shown; legacy `GOOGLE_OAUTH_*` names are
also accepted):

| Variable | Purpose |
|---|---|
| `GOOGLE_CLIENT_ID` | OAuth client ID from step 4 |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret from step 4 |
| `GOOGLE_REDIRECT_URI` | The redirect URI for this environment |
| `TOKEN_ENCRYPTION_KEY` | 64-char hex (32 bytes) used to encrypt stored tokens at rest |

Generate an encryption key:

```bash
openssl rand -hex 32
```

**Local** — add to `.env.local`:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/google/callback
TOKEN_ENCRYPTION_KEY=<openssl rand -hex 32>
```

**Vercel** — add the same four under **Project → Settings → Environment
Variables** (Production + Preview), then **redeploy**.

> Never commit secret values. RankForge only ever reports the *names* of any
> missing variables, never their values.

## 6. Connect in RankForge

1. Open **`/app/integrations/google`**.
2. Confirm the banner shows "Google OAuth is configured".
3. **Connect Google Search Console** → authorize → **select a property**
   (URL-prefix or domain).
4. **Connect Google Analytics 4** → authorize → **select account → property** →
   **map your conversion events** (Lead, Form submission, Phone call, etc.).
5. **Run the initial sync.** Subsequent syncs are incremental.

---

## Diagnostic checklist

| Symptom | Likely cause | Fix |
|---|---|---|
| `redirect_uri_mismatch` | The redirect URI in Google Cloud doesn't exactly match `GOOGLE_REDIRECT_URI` | Match scheme, host, port, and path exactly (no trailing slash differences) |
| "Access blocked: app not verified" | App still in Testing without your account as a test user | Add your account under **Test users**, or submit for verification |
| Missing scope / 403 on a call | A required scope wasn't granted | Re-authorize; confirm all three scopes are on the consent screen |
| "No properties returned" | The Google account has no GSC/GA4 access, or the wrong account was used | Authorize with the account that owns the property |
| Wrong Google account connected | Signed into the wrong account during OAuth | Disconnect, then reconnect and pick the correct account |
| `invalid_grant` on refresh | Refresh token revoked or expired | Disconnect and reconnect to obtain a fresh refresh token |
| Token refresh failure | Clock skew or revoked consent | Reconnect; ensure server time is correct |
| API quota exceeded | Too many requests | Wait for quota reset; syncs retry with backoff |
| Property mismatch | Selected property's domain doesn't match the project domain | Reselect the property that matches the project |
| Stored token could not be decrypted | `TOKEN_ENCRYPTION_KEY` changed after tokens were stored | Reconnect to re-encrypt with the current key |

---

## Security notes

- Access and refresh tokens are **encrypted at rest** (AES-256-GCM) using
  `TOKEN_ENCRYPTION_KEY` and are **never returned to the browser or written to
  logs**.
- Credentials are **organization- and project-scoped**; cross-tenant access is
  rejected.
- Only **read-only** scopes are requested for data; the single GA4 `edit` scope
  is used solely to enumerate properties via the Admin API.
