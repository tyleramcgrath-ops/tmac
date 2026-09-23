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

### It is written, and it is tested against a real database

`db/001_init.sql` is the schema above as runnable SQL, and `test/schema.js` stands up an
actual PostgreSQL cluster in a temp directory, applies it, and asserts against the result.
That is not ceremony. The two things this schema has to get right both fail *silently*:

- A claim query without `SKIP LOCKED` does not error. Two ticks quietly do the same work
  twice, and the customer pays for both in search credits.
- A key deletion that leaves a schedule enabled does not error either. It goes on running
  on a credential the customer believes they revoked — which is the one thing the FAQ
  explicitly promises will not happen.

So both are asserted. Two claimers run concurrently, one holding its row inside an open
transaction, and the test checks the second takes a *different* job rather than blocking;
a third with nothing available comes away empty rather than waiting; and a job whose
invocation died is reclaimed once its lock goes stale.

### The FAQ's promise is a trigger, not a convention

"Delete it and the schedules stop" is a promise to a customer about their own credentials,
so `search_key_deleted_stops_schedules` enforces it in the database rather than leaving it
to whichever code path happens to delete the row remembering to do it too. The test deletes
a key and checks the schedule is disabled — and that the projects and their history survive,
because it is the key that goes, not the work.

Every `CHECK` is asserted by trying to violate it: a 13-byte GCM iv, a five-character
`last4`, a ninth step name, a negative cursor, a weekly schedule with no day, a score of
101, a second job on one scan, a second account on the same email in different case. A
constraint that is present but not enforced looks exactly like one that works, right up
until bad data arrives.

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

### Built and tested, 22 Sep 2026

`lib/scan-job.js` is the eight-phase machine, `lib/tick.js` is the queue around it, and
`api/tick.js` is the endpoint. 28 assertions in `test/scan-job.js` drive a whole scan
against the same fixtures the browser runs on and land on the browser's own numbers —
rank 20, answer 15, eleven tasks — which is the only evidence worth having that the two
paths agree. 50 more in `test/tick.js` drive the queue against a real PostgreSQL.

Three places where what got built differs from the sketch above, each for a reason:

- **A tick runs as many steps as its budget allows, not exactly one.** The *step
  function* still does exactly one unit of work, and that is where crash-safety comes
  from — `stepOnce` is what the tests hold to one page fetch, one search or one render.
  But a tick that did one step and returned would need 25 invocations and 25 cold starts
  to finish a scan that fits comfortably in two. So the tick loops `stepOnce` against a
  45-second deadline, **saving after every step**, and hands the rest to the next tick.
  A killed function loses one step, exactly as it would have.

  A tick that has claimed a job always runs at least one step, even with no budget left.
  The deadline is measured from the top of the invocation, so a slow claim can eat the
  whole budget before the first step — and a tick that claims a job, does nothing and
  puts it back has spent a round trip to move the queue zero places.

- **`SKIP LOCKED` is not what keeps two ticks apart.** The claim above is one
  auto-committed statement, so its row lock is gone the moment it returns — and a job
  being worked on is `running`, which the claim's own `WHERE` still matches. Written
  without the `locked_at` window, two concurrent ticks take the *same* job and run one
  scan twice on the customer's credits. `test/tick.js` caught exactly that. The lease is
  what holds the row; `SKIP LOCKED` only covers two claims racing inside one instant.
  The lease is `TICK_BUDGET_MS + 60s`, so it always outlasts a tick that is still working.

- **The cron is daily, not every minute.** Hobby allows one invocation a day, so the
  chain of hand-offs is the engine and the cron is only a sweep for a chain that died —
  a stranded job waits up to a day rather than forever. A minute-by-minute sweep is one
  of the things a Pro plan buys, if it ever becomes worth it.

Two failure paths are worth naming because they are what a customer actually experiences:
a job that fails backs off `2^attempts` seconds to a five-minute cap, and past
`max_attempts` it gives up and **writes the reason onto the scan**. A scan that simply
never finishes is the worst thing to hand someone waiting for it. And a job whose key has
been deleted fails immediately rather than retrying twenty times, because waiting will not
bring the key back.

### Sharing the scoring code — done, 22 Sep 2026

Scoring used to live inside `index.html`, in the first of six `<script>` blocks. The
tick needs the same logic, and **having two copies is how the two scores start
disagreeing** — a customer who reads one score in the app and a different one in their
weekly email has no reason to trust either.

That block is now `score.js`, at the app root rather than under `api/` so Vercel does
not try to make a serverless function out of it. It is loaded two ways:

- **the browser** — `<script src="/score.js">` in `index.html`. A classic script with
  no `defer`/`async`, so it blocks, executes in order before the inline blocks below
  it, and puts all 62 declarations in the global lexical scope exactly as when it was
  inline. Nothing about how the page behaves changed.
- **the scan job** — `require('./score.js')`, reading the same names off
  `module.exports`. The tail that does this is guarded by `typeof module`, so it is
  inert in a page.

`buildFixes` — the work order — moved too, with `qNeed` and `resolveRefs`. The scan job
has to produce the same *tasks* as the browser, not merely the same two numbers, and all
three are pure: no DOM, no network, no storage. That is the whole pure surface a scan
needs; 65 exports now.

`$`, the DOM helper, is deliberately **not** exported: nothing in a scan job should be
reaching for a selector, and its absence from the module surface is asserted.

What proves it: the 157 regression assertions, unchanged, now running against
`score.js` loaded into the VM ahead of the inline blocks — the browser's own load order
rather than a `require`, because it is the browser path they are about. Plus ten new
assertions in `build-guard.js`: that the build verifies and ships the file, that a
missing or unsealed `score.js` fails the build rather than shipping a dead page, that
every exported name is also a global under the classic-script path, and that
`scoreRank` and `scoreAnswer` return byte-identical JSON through both surfaces. An
end-to-end scan through the extracted file returns the same rank 20 / answer 15 and the
same eleven tasks it did before the move.

**Script indices inside `index.html` shifted by one** — there are now five inline
blocks, not six, and `regression.js` loads `score.js` then `scripts[0]`. Anything else
reading those blocks by index needs the same adjustment.

A test server that serves `index.html` for every path now answers `/score.js` with the
page itself, which the browser tries to execute as JavaScript — leaving none of the
scoring globals defined and an app that silently does nothing. All three browser flows
route static requests through one `serveStatic` helper in `test/enter-app.js` so the
next shipped static file is one edit instead of three.

### Ownership lives in the WHERE clause

One rule runs through every query in `lib/store.js`: never fetch a row and then check who owns
it. That is two steps, and the second is the one somebody forgets. `WHERE id = $1 AND user_id
= $2` cannot be forgotten and cannot race, and it returns zero rows for "does not exist" and
"is not yours" alike — which is also the right answer, because telling them apart confirms that
a project id exists.

Recording a scan uses `INSERT ... SELECT ... WHERE p.user_id = $7` for the same reason: the row
is only created when the project belongs to the caller, in the statement that creates it.

`test/store.js` tries **every read and every write twice** — once as the owner, once as a
stranger — because a missing ownership check looks exactly like a working endpoint until two
customers exist, and by then the leak has happened.

### What the plans actually allow

- **Free** cannot keep projects on the server at all. That is the product: the free tier runs
  in the browser and keeps its history there.
- **past_due keeps working.** A card that failed on Tuesday should not stop Wednesday's work.
- **canceled** stops writes but not reads: history someone paid to accumulate stays readable.
- **Agency is capped at 25**, the number the pricing page states, and the refusal says so and
  says archiving frees a slot — which the test then does.
- **Practice is uncapped**, because the pricing page states no limit for it. See §10.

### Archiving, not deleting

`archived_at` hides a project from the list and stops its schedule. The scans survive and stay
readable. A customer tidying up should not lose the score history they were paying to build.

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

### Built and tested, 22 Sep 2026

| file | what |
|---|---|
| `api/db.js` | one pool, `max: 1`, pointed at Neon's pooled endpoint |
| `api/auth.impl.js` | issue, redeem, resolve, end; cookie construction and parsing |
| `api/mail.impl.js` | the Resend POST |
| `api/auth/{request,redeem,me,logout}.js` | the four endpoints |

`max: 1` is not a default and is the point of that file. Each invocation is its own
process with its own pool, so a pool of ten means ten connections per concurrent
invocation — which is how a serverless app exhausts a database it barely uses. The
pooled endpoint does the real multiplexing.

`test/auth.js` runs all of it against a throwaway PostgreSQL with the real schema, over
TCP with node-postgres, which is the driver path production uses. 38 assertions. The
properties it covers are the ones that fail *silently*:

- **the token is never stored.** The test reads `login_tokens.token_hash` back and
  asserts it does not equal the token and does equal its sha256. A token stored in the
  clear still logs people in, so nothing about normal use would reveal the mistake.
- **a link works exactly once.** Redemption takes a row lock and stamps `used_at` inside
  one transaction; the second attempt is refused and no second session appears. A link
  that can be redeemed twice still logs the first person in.
- **expiry is what stops a session**, checked by expiring it, confirming it stops
  resolving, then un-expiring it and confirming it comes back — otherwise the test would
  pass just as well if something unrelated were doing the rejecting.
- **signing out deletes the row**, not just the cookie. Clearing only the cookie leaves a
  session id that still resolves for anyone who copied it.
- **a lookalike cookie name** (`not_cg_session`) is not mistaken for the session.
- **one person cannot become two accounts** — `Mixed@Case.com` and `mixed@case.COM`
  resolve to one row.

Two deliberate choices in the endpoints. `/api/auth/request` answers identically whether
or not the address has an account, because differing responses turn it into a way to ask
whether a given person is a customer. And a failed send returns a generic error rather
than the provider's reason, for the same reason.

**Still needs `RESEND_API_KEY`.** Everything above works without it; the send throws at
the point of use rather than silently succeeding. `APP_ORIGIN` is optional and falls back
to the forwarded host.

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

**Agency — $149/mo.** Everything in Practice, unlimited projects under schedule, alerts
when a score crosses a band, client-ready branded reports, a shared workspace.

The "shared workspace" needs a `teams` / `memberships` pair and turns every
`user_id` foreign key above into an ownership question. It is the single largest piece
of work in the whole plan and it is worth **deferring past first revenue** — ship
Agency initially as unlimited projects + alerts + branded reports on a single login, and
add seats when a customer asks for seats.

---

## 8. Order of work

1. ~~Extract scoring, prove it with the existing 157 assertions.~~ **Done 22 Sep 2026** —
   it landed as `score.js` at the app root rather than under `api/`, so Vercel does not
   treat it as a function. The browser loads it with `<script src="/score.js">`; the scan
   job will `require()` it. `build-guard.js` now asserts the two surfaces agree, including
   that `scoreRank` and `scoreAnswer` return identical results through both.
2. ~~Neon + schema + migrations.~~ **Schema written and proven, 22 Sep 2026** —
   `db/001_init.sql`, tested against a real PostgreSQL by `test/schema.js` (21 assertions).
   What still needs `DATABASE_URL` is pointing it at Neon and running it; the SQL itself is
   no longer a guess.
3. ~~Magic-link auth end to end.~~ **Built 22 Sep 2026** — `api/auth.impl.js` plus four
   endpoints (`request`, `redeem`, `me`, `logout`), `api/db.js`, `api/mail.impl.js`.
   38 assertions in `test/auth.js` against a real PostgreSQL running `001_init.sql`.
   **Cannot send mail until `RESEND_API_KEY` is set** — everything else works.
4. ~~Projects and scans persisted server-side.~~ **Built 22 Sep 2026** — `lib/store.js`,
   `api/projects.js`, `api/scans.js`. 48 assertions in `test/store.js`. Wiring the front
   end to read them when signed in, and fall back to browser storage when not, is what
   remains of this step.
5. ~~`scan_jobs` + `/api/tick` + cron.~~ **Built 22 Sep 2026** — `lib/scan-job.js`,
   `lib/tick.js`, `api/tick.js`. 78 assertions across `test/scan-job.js` and
   `test/tick.js`. §4 records what it does and the three places it departs from the
   sketch below. It has not yet been run against the real internet on real Neon: the
   fixtures prove the numbers and the queue, not the wall-clock.

   What follows is the reasoning from before it was built, kept because the payload
   shape it worried about is the thing that turned out to matter.

   A note on why this waits for step 2 rather than being built ahead of it. `runScan` is
   one linear 26KB async function closing over about twenty locals; turning it into
   resumable steps means every one of those (`head`, `mine`, `cov`, `perDomain` — a `Map`,
   so not even JSON — `dispositions`, `comps`, `failed`, `targetsUsed`, `basis`, `reused`)
   becomes part of a serialized payload. The step boundaries and that payload's shape are
   the design, and they should be settled against a real `scan_jobs` row and a real
   60-second function, not guessed at and then bent to fit.

   The phases themselves are already confirmed against the code: `runScan` calls
   `/api/page` once, `/api/serp` once, `/api/serp` × *nq*, `/api/page` × *depth* in
   batches of three, `/api/render` for the competitors, `/api/render` for the rescues,
   `/api/render` for the target, then scores — exactly the eight steps in §4.

   When it is built it should be **one implementation with two drivers**, the way
   `score.js` is one implementation with two loaders: the step functions take an injected
   caller and an injected reporter, the browser passes `say`/`tick` and loops them to
   completion, the tick passes no-ops and runs exactly one. Reimplementing the sequencing
   separately server-side would put the work order and the progress log back into two
   copies, which is the thing step 1 just finished undoing.
6. ~~Encrypted `search_keys`.~~ **Built 22 Sep 2026** — `lib/keys.js` and
   `api/account.js`. AES-256-GCM, per-row IV, the secret outside the database.
   35 assertions in `test/keys.js`, each written as a property of the stored row rather
   than of the code that wrote it: the bytes must not contain the key, a wrong secret
   must not decrypt them, a flipped bit must fail rather than reach a provider, and
   `describeKey` must have no path to the plaintext at all.
7. Schedules.
8. Stripe + webhook + portal.
9. Flip Practice from "In build" to "Available now".
10. Agency: alerts, branded reports.
11. Teams and seats, only if asked for.

Steps 1-6 are done. 7-9 are comparatively mechanical. Nothing between 1 and
8 should change what the free tier does.

---

## 9. What I need from you

**Three credentials, plus two I generate:**

| | |
|---|---|
| `DATABASE_URL` | Neon connection string (pooled) |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + two price IDs | from the Stripe dashboard |
| `RESEND_API_KEY` | **the one you have not been told about** — magic links and alerts both need to send mail |
| `SEARCH_KEY_SECRET` | 32 random bytes, I generate it, it goes in the environment and nowhere else |
| `CRON_SECRET` | 32 random bytes, likewise. Without it `/api/tick` answers 503 rather than opening: it is a machine that fetches arbitrary URLs and spends a customer's search credits on request, so there is no safe way to answer it unguarded. |

**Both open decisions are now closed:**

- **Key storage — decided.** Store it encrypted and scope the promise by tier. The
  FAQ is rewritten and live; §2 records what that copy commits us to.
- **Waitlist — decided.** Both buttons now point at a real address. Worth replacing
  with a form writing to Neon once the database is connected: it is a better capture
  path and it keeps a personal address off a public page that scrapers read.

---

## 10. Where the tiers separate on volume

Decided 23 Sep 2026, by the owner: **Practice includes 10 projects, Agency is unlimited.**
The page says so and `PLAN_LIMITS` in `lib/store.js` enforces exactly that, which is the whole
rule here — a cap the page does not promise is charging for something and then withholding it,
and a promise the code does not keep is the same thing with better manners. If one moves, the
other moves in the same commit, and `test/store.js` fails until they agree.

This replaces the gap that stood here before: Practice previously stated no limit, so none was
enforced, and nothing stopped a $39 customer running the hundred sites Agency charges $149 for.
Volume is now a real line between the tiers rather than features alone.

Archived projects do not count against the limit, so the over-limit refusal — *archive one, or
move up to Agency, which is unlimited* — describes a way out that actually works.
