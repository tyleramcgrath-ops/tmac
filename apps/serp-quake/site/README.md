# SERP Quake: the product site

The site people pay for. It has a marketing homepage with the live reading, email sign-in, a
7-day free trial with no card, Stripe billing for Pro, and the full seismograph dashboard behind
the login. Richter, the mascot, reacts to the live magnitude. He chills on normal days, gets
alert, sweats, and panics during core updates.

```
index.html        homepage: live reading (/api/pulse), the "shake it" slider, pricing, FAQ
login.html        email sign-in (one-time link, no password)
app.html          the dashboard: signed-in trial/Pro accounts, or ?demo=1 with simulated data
quake-ui.js       Richter the mascot + the drum-recorder seismograph, shared by every page
site.css          the look: seismograph paper, ink, a red pen
demo-data.json    simulated payload for the demo (npm run demo-data regenerates it)
api/pulse.js      public: current magnitude, mood, 7-day trace
api/data.js       accounts only (trial or Pro): the full seismograph
api/auth/link.js  ask for / redeem a sign-in link
api/auth/session.js  who is signed in and what they can see; sign out
api/stripe.js     Pro checkout and the billing portal
api/stripe-webhook.js  the only thing that changes a plan (signed by Stripe)
lib/              auth, db, mail, stripe: ported from apps/citation-gap; access.js = trial/Pro rule; feed.js = readings
db/001_init.sql   users, sessions, login_tokens
dev-server.js     run the whole site locally
```

## Where the readings come from

`.github/workflows/serp-quake.yml` scans Google every 6 hours and writes `data.json` to the
`serp-quake-data` branch. `lib/feed.js` reads it, with a 3-minute cache. The site never scans
anything itself.

**This repository is public, so `data.json` on the data branch is publicly readable too.** The
paywall gates the dashboard experience, not the raw numbers. Before charging real customers,
either make the repo private and set `QUAKE_DATA_TOKEN` (a fine-grained GitHub token with read
access to its contents), or point `QUAKE_DATA_URL` at private storage.

## Run it locally

```bash
npm install
QUAKE_DATA_FILE=demo-data.json node dev-server.js     # http://localhost:3000
```

Without `DATABASE_URL`, the site runs in demo mode. Sign-in says accounts aren't switched on
yet, and `/app` shows the simulated dashboard.

## Deploy (Vercel)

1. **Create a Vercel project** from this repo with root directory `apps/serp-quake/site`,
   framework "Other", and no build command.
2. **Create a Postgres database** (Neon works; use the `-pooler` connection string), then run
   `db/001_init.sql` against it once.
3. **Set environment variables** on the project:

| Variable | What for |
|---|---|
| `DATABASE_URL` | Postgres. Turns accounts on. |
| `RESEND_API_KEY`, `MAIL_FROM` | Sends sign-in links (https://resend.com; `MAIL_FROM` must be on a domain you verified there). |
| `APP_ORIGIN` | Your site's URL, e.g. `https://serpquake.com`, used in sign-in links. |
| `STRIPE_SECRET_KEY` | Turns on the Upgrade button. |
| `STRIPE_PRICE_PRO` | The Stripe Price id for Pro (create a $29/month recurring price). |
| `STRIPE_WEBHOOK_SECRET` | From a Stripe webhook pointing at `/api/stripe-webhook`, subscribed to `checkout.session.completed` and `customer.subscription.created`, `customer.subscription.updated` and `customer.subscription.deleted`. |
| `TRIAL_DAYS` | Optional. Defaults to 7. |
| `QUAKE_DATA_URL`, `QUAKE_DATA_TOKEN` | Optional. Where the readings live (see above). |

Each piece switches on independently. With no Stripe, trials still work and Upgrade says billing
isn't on yet. With no Resend, sign-in reports that it can't send.

## Tests

`npm test` covers the trial and Pro access rule, the gated data endpoint (401 signed out, 402
after the trial, 200 for trial and Pro), the public pulse not leaking the instrument, feed
caching, Stripe signature checks, and that pages load only local scripts.

## GitHub Pages preview

Until the Vercel project exists, a static copy runs at
**https://tyleramcgrath-ops.github.io/tmac/serp-quake/**. `build-pages.js` builds it: links
become relative, and `window.SQ_STATIC` tells the pages there's no API. In that copy:

- The homepage reads the live reading straight from `data.json` on the data branch.
- Sign-in says accounts are coming soon.
- `/app` shows the demo.

The `pages` job in `serp-quake.yml` republishes it on every site change to `main`, touching
only the `serp-quake/` folder of the `gh-pages` branch.

## SiteGround (tylermcgrath.com/serp-quake)

SiteGround runs PHP and MySQL, not Node, so `php/` holds a PHP copy of every function in `api/`:
sign-in links, sessions, the trial and Pro rule, the gated data, the public pulse, and Stripe
checkout and webhook. It uses the same URLs (with a `.php` ending) and returns the same JSON, so
the pages are identical. `build-pages.js --siteground` builds it, and
`.github/workflows/serp-quake-siteground.yml` deploys it on every site change to `main`:

1. It runs the tests and builds `dist/serp-quake/`.
2. It writes `serp-quake-config.php` from repo secrets and uploads it **next to `public_html`**,
   never inside it.
3. It rsyncs only `public_html/serp-quake/`. `tylermcgrath-deploy.yml` now skips that folder, so
   the portfolio deploy never deletes it.
4. It runs `php api/migrate.php` to create the tables, flushes the cache, and checks the live
   pages and APIs.

To switch accounts on, add these repo secrets. Until then the site runs in demo mode.

| Secret | What for |
|---|---|
| `SQ_DB_NAME`, `SQ_DB_USER`, `SQ_DB_PASS` | A MySQL database and user. Create them in Site Tools → Site → MySQL and give the user all privileges on that database. |
| `SQ_RESEND_API_KEY`, `SQ_MAIL_FROM` | Sign-in emails (https://resend.com). `SQ_MAIL_FROM` must be on a domain you verified there. |
| `SQ_STRIPE_SECRET_KEY`, `SQ_STRIPE_PRICE_PRO` | The Upgrade button. The price is a $29/month recurring Price id. |
| `SQ_STRIPE_WEBHOOK_SECRET` | From a Stripe webhook to `https://tylermcgrath.com/serp-quake/api/stripe-webhook.php`, subscribed to `checkout.session.completed` and `customer.subscription.created`, `customer.subscription.updated` and `customer.subscription.deleted`. |

`test/php.test.js` runs the PHP API end to end on PHP's built-in server, with SQLite in place of
MySQL. It covers sign-up, single-use links, the trial, the paywall, forged and signed Stripe
events, and sign-out.
