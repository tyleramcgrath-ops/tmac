# Practice and Agency — the build spec

Your four decisions, taken as fixed:

| | |
|---|---|
| Database | **Neon** (serverless Postgres) |
| Payments | **Stripe** |
| Search volume | **No pooled credits.** Every customer, on every tier, brings their own SerpApi key. |
| Signup | They sign up for SerpApi themselves. |

This document is the plan those decisions imply. It is not written yet — nothing in
here ships until the open questions at the bottom are answered, because two of them
change the schema and one changes a promise already made on the live site.

---

## 1. The problem the paid tiers have to solve

The scanner runs **in the browser**. That is not an implementation detail, it is the
architecture: the browser drives the scan one API call at a time precisely so no
serverless function ever approaches its 60-second ceiling. It is also why the free
tier can be free forever — the expensive parts run on the customer's machine and the
customer's key.

The consequence is a gating paradox:

> **Anything that runs in the browser cannot be gated, so it cannot be sold.**

A login wall in front of a scanner whose entire logic is in a file the visitor has
already downloaded is theatre. View-source defeats it in ten seconds. So Practice
cannot be "the free tool, but you have to pay" — it has to be something the browser
is structurally incapable of doing.

There is exactly one such thing, and it is the whole product:

> **Running the scan when the tab is closed.**

Scheduled re-scans, history that survives a cleared cache, movement charted over
months instead of the last six scans, an email when a score drops past its band —
all of these are downstream of one capability: *the scan runs without the customer
present*. That is server work, it costs real money to provide, and it cannot be
copied out of the page source. It is the only honest thing to charge for, and it
happens to be the thing a consultant on a retainer actually wants.

Everything in this plan exists to deliver that one capability.

---

## 2. What that costs us, and it is not money

Running the scan without the customer present means **the server has to hold the
customer's SerpApi key**. There is no way around this. A scheduled job at 3am cannot
ask the browser for a key that lives in the browser's localStorage.

The live site currently promises the opposite. From the FAQ, shipped and public:

> *The scan is orchestrated in your browser. Your key lives in this browser's storage
> and is never sent anywhere except the search provider you chose.*

That sentence is **true today and must stay true for the free tier**. It cannot be
true for Practice. The copy has to become tier-scoped, something like:

> *On the free tier the scan is orchestrated in your browser and your key never
> leaves it. On Practice and Agency you hand us a key so your schedule can run
> without you — it is encrypted at rest with a key we hold separately, decrypted only
> inside the job that calls your provider, and never sent to your browser again, not
> even to show you what you typed.*

**Signed off, 22 Sep 2026.** The FAQ is now tier-scoped and live: the free tier keeps
the absolute promise, and the paid tiers state plainly what is held, how it is
protected, and that it is never pooled or used for anything but that customer's own
scans. The schema below is therefore fixed.

The guarantees that copy makes are binding on the implementation:

- encrypted at rest, secret held outside the database
- decrypted only inside the scan job, never in an HTTP response
- **never returned to the browser, not even masked** — the UI shows `last4` from its
  own column and nothing else
- deleting the key stops the schedules, and that path must actually work

---

## 3. Schema

Neon Postgres. Everything below is additive — the free tier keeps working with no
account, unchanged, storing history in the browser as it does today.

```sql
-- Identity ------------------------------------------------------------------

users
  id                 uuid primary key
  email              citext unique not null
  created_at         timestamptz not null default now()
  stripe_customer_id text unique                -- null until first checkout
  plan               text not null default 'free'   -- free | practice | agency
  plan_status        text not null default 'none'   -- none | active | past_due | canceled
  plan_renews_at     timestamptz
  -- plan and plan_status are a cache of Stripe, never the source of truth.
  -- The webhook writes them; nothing else does.

sessions
  id           uuid primary key      -- the cookie value, opaque, 256 bits
  user_id      uuid not null references users
  created_at   timestamptz not null default now()
  expires_at   timestamptz not null
  last_seen_at timestamptz

login_tokens
  id         uuid primary key
  user_id    uuid not null references users
  token_hash bytea not null          -- sha256 of the emailed token; the token itself
                                     -- is never stored, so a database leak cannot
                                     -- be replayed into logins
  expires_at timestamptz not null    -- 15 minutes
  used_at    timestamptz             -- single use, enforced on redemption

-- The customer's search key ---------------------------------------------------

search_keys
  id          uuid primary key
  user_id     uuid not null references users
  provider    text not null              -- serpapi | serper
  ciphertext  bytea not null             -- AES-256-GCM
  iv          bytea not null             -- 12 bytes, per row, never reused
  tag         bytea not null             -- GCM auth tag
  last4       text not null              -- the only part ever shown back to anyone
  added_at    timestamptz not null default now()
  last_ok_at  timestamptz                -- last time the provider accepted it
  last_err    text                       -- last provider rejection, for the UI
  -- Encryption key comes from SEARCH_KEY_SECRET in the environment, never the DB.
  -- Decryption happens only inside the scan job, in memory, never in a response.

-- The work --------------------------------------------------------------------

projects
  id         uuid primary key
  user_id    uuid not null references users
  name       text not null
  url        text not null
  keyword    text not null
  gl, hl     text not null default 'us' / 'en'
  created_at timestamptz not null default now()
  archived_at timestamptz

scans
  id             uuid primary key
  project_id     uuid not null references projects
  started_at     timestamptz not null default now()
  finished_at    timestamptz
  trigger        text not null            -- manual | schedule
  rank_score     int
  answer_score   int
  fingerprint    text                     -- sha256 of the page, for the reuse path
  reused_scan_id uuid references scans    -- set when nothing changed and we reused
  findings       jsonb                    -- the full report, as the browser builds it
  error          text

schedules
  id          uuid primary key
  project_id  uuid not null references projects unique
  cadence     text not null              -- weekly | daily
  day_of_week int                        -- 0-6, for weekly
  hour_utc    int not null
  enabled     bool not null default true
  next_run_at timestamptz not null

alerts                                    -- Agency
  id         uuid primary key
  project_id uuid not null references projects
  metric     text not null               -- rank | answer
  direction  text not null               -- drops_below | moves_by
  threshold  int not null
  last_fired_at timestamptz
```

The `scan_jobs` table is the interesting one and gets its own section.

---

## 4. The hard part: running a scan inside a 60-second function

A scan is not one request. Reading the current driver in `index.html`, it is seven
phases, and phases 4-6 are N calls wide:

| # | Phase | Calls | Endpoint |
|---|---|---|---|
| 1 | Fetch the target page as served | 1 | `/api/page` |
| 2 | Google the head term | 1 | `/api/serp` |
| 3 | Google the six answer-layer questions | 6 | `/api/serp` |
| 4 | Fetch each competitor as served | ~8 | `/api/page` |
| 5 | Render competitors that need a browser | ~8 | `/api/render` |
| 6 | Rescue the ones that failed the served basis | 0-3 | `/api/render` |
| 7 | Render the target for the served-vs-rendered diff | 1 | `/api/render` |

Roughly 25 calls, several of them full headless-Chromium loads. Wall-clock, that is
minutes. **There is no way to do it in one 60-second invocation**, and adding a queue
service is a new vendor and a new bill.

The answer is to make the job itself resumable, and to let the platform's own
60-second budget be the unit of work.

### `scan_jobs`

```sql
scan_jobs
  id         uuid primary key
  scan_id    uuid not null references scans
  state      text not null      -- queued | running | done | failed
  step       text not null      -- target_page | serp_head | serp_questions
                                -- | competitor_pages | competitor_renders
                                -- | rescue_renders | target_render | score
  cursor     int not null default 0   -- index within the current step's fan-out
  payload    jsonb not null           -- everything accumulated so far
  attempts   int not null default 0
  run_after  timestamptz not null default now()
  locked_by  uuid                     -- the invocation that claimed it
  locked_at  timestamptz
  last_error text
```

### The tick

One endpoint, `/api/tick`, does this:

1. Claim one due job:
   ```sql
   UPDATE scan_jobs SET locked_by = $1, locked_at = now(), attempts = attempts + 1
   WHERE id = (
     SELECT id FROM scan_jobs
     WHERE state IN ('queued','running') AND run_after <= now()
       AND (locked_at IS NULL OR locked_at < now() - interval '2 minutes')
     ORDER BY run_after
     FOR UPDATE SKIP LOCKED
     LIMIT 1
   )
   RETURNING *;
   ```
   `SKIP LOCKED` is what makes concurrent ticks safe: two invocations firing at once
   take two different jobs rather than both taking the same one. The `locked_at`
   staleness window reclaims jobs whose invocation died mid-step.

2. Do **one step** — one `/api/page`, or one `/api/render`, or one `/api/serp`. Never
   a loop. The step is chosen by `step` + `cursor`, and it is always small enough to
   finish inside the budget with room to spare.

3. Write `payload`, advance `cursor` (or move to the next `step` when the fan-out is
   exhausted), release the lock.

4. If more work remains, **fire `/api/tick` again without awaiting it** and return.
   The job walks itself forward at roughly one step per invocation, continuously,
   instead of waiting for the next cron minute. A Vercel cron every minute is the
   safety net that restarts a chain that died, not the engine.

5. On the final step, score in the same code path the browser uses, write `scans`,
   evaluate `alerts`, mark `done`.

This gives crash-safety for free: a job that dies at step 4 cursor 5 resumes at step 4
cursor 5, with four phases of work already banked in `payload`. `attempts` bounds the
retries; past the bound the job fails with `last_error` and the customer sees why.

### Sharing the scoring code

Scoring currently lives inside `index.html`, in one of the six `<script>` blocks that
`regression.js` executes in a VM. The tick needs the same logic, and **having two
copies is how the two scores start disagreeing.**

The existing `api/page.js` → `api/page.impl.js` stub pattern is the precedent: extract
scoring into `api/score.impl.js`, have both the browser and the tick load it. The
build guard's `SHIPPED` list grows by one file. `regression.js` keeps running against
the same source it always has, so this is a move, not a rewrite, and the 157 existing
assertions are the proof it landed intact.

**The script order inside `index.html` must not change** — `regression.js` runs
`scripts[0]` and `scripts[1]` in a VM by index.

---

## 5. Auth

Magic link. No passwords.

This is not just fashion — the product already has a stance here. The workspace splash
takes an email and stores it locally to personalise the sidebar, and the front door
was deliberately rebuilt to *stop* asking for a password (v10.8). Shipping a password
field now would contradict a decision already made and tested.

Flow: email in → row in `login_tokens` holding a **sha256 of** the token → link
emailed → redemption checks the hash, checks `expires_at`, sets `used_at`, mints a
`sessions` row → `HttpOnly; Secure; SameSite=Lax` cookie.

Storing only the hash means a database leak yields no usable login links.

**This needs an email provider.** Resend is the smallest fit. It is a credential you
have not been asked for yet, and it is needed twice — magic links, and Agency alerts.
See §9.

---

## 6. Stripe

Two prices: Practice $39/mo, Agency $149/mo.

- Checkout via a hosted Stripe Checkout session. No card data touches this app, ever.
- The **webhook is the only writer** of `plan` and `plan_status`. Not the success
  redirect — a customer who closes the tab before the redirect still paid, and a
  customer who forges the redirect has not.
- Signature-verify every webhook against `STRIPE_WEBHOOK_SECRET`; a webhook handler
  that skips verification is an unauthenticated write endpoint for your billing table.
- Handle `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted`, `invoice.payment_failed`.
- Billing portal link for cancellation. Do not build a cancel flow; Stripe has one.
- On `past_due`: schedules pause, data stays. On `canceled`: schedules stop, history
  stays readable, exports stay available. **Never delete a paying customer's history
  because they stopped paying** — that is how a lapsed customer becomes a hostile one.

Because there are no pooled credits, there is no metering, no usage records, and no
overage. The subscription is flat. This is a genuine simplification that your pricing
decision bought.

---

## 7. What each tier actually is

**Scan — $0, live today.** Unchanged. No account, no server, browser storage, own key.
Everything it claims today is true today.

**Practice — $39/mo.** Account, Neon-backed projects and history, weekly scheduled
re-scans on the customer's stored key, full history instead of the last six scans,
multi-keyword batches. The $39 buys the scheduling and the storage, not search volume.

**Agency — $149/mo.** Everything in Practice, 25 projects under schedule, alerts when
a score crosses a band, client-ready branded reports, a shared workspace.

The "shared workspace" needs a `teams` / `memberships` pair and turns every
`user_id` foreign key above into an ownership question. It is the single largest piece
of work in the whole plan and it is worth **deferring past first revenue** — ship
Agency initially as 25 projects + alerts + branded reports on a single login, and add
seats when a customer asks for seats.

---

## 8. Order of work

1. `api/score.impl.js` — extract scoring, prove it with the existing 157 assertions.
2. Neon + schema + migrations.
3. Magic-link auth end to end.
4. Projects and scans persisted server-side; the app reads them when logged in and
   falls back to browser storage when not.
5. `scan_jobs` + `/api/tick` + cron. **Test this against a real multi-minute scan
   before selling it** — it is the load-bearing wall of both paid tiers.
6. Encrypted `search_keys`.
7. Schedules.
8. Stripe + webhook + portal.
9. Flip Practice from "In build" to "Available now".
10. Agency: alerts, branded reports, 25 projects.
11. Teams and seats, only if asked for.

Steps 1-5 are the real build. 6-9 are comparatively mechanical. Nothing between 1 and
8 should change what the free tier does.

---

## 9. What I need from you

**Three credentials, plus one I generate:**

| | |
|---|---|
| `DATABASE_URL` | Neon connection string (pooled) |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + two price IDs | from the Stripe dashboard |
| `RESEND_API_KEY` | **the one you have not been told about** — magic links and alerts both need to send mail |
| `SEARCH_KEY_SECRET` | 32 random bytes, I generate it, it goes in the environment and nowhere else |

**Both open decisions are now closed:**

- **Key storage — decided.** Store it encrypted and scope the promise by tier. The
  FAQ is rewritten and live; §2 records what that copy commits us to.
- **Waitlist — decided.** Both buttons now point at a real address. Worth replacing
  with a form writing to Neon once the database is connected: it is a better capture
  path and it keeps a personal address off a public page that scrapers read.
