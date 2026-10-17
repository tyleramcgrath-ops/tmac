# Girls Around the Globe

Casual encounters, worldwide. Swipe on adults who want no-strings fun, use
Passport to swipe in a city before you travel there, chat with your matches,
and upgrade to **Globe+** for premium features. The site is strictly for casual
meetups between consenting adults: no relationship or marriage modes, and no
paid arrangements.

## What works

- **Accounts**: email + password sign-up (18+ enforced on the server), log-in,
  log-out, account deletion. Passwords are hashed with scrypt; sessions are
  signed, httpOnly cookies.
- **Profiles & photos**: up to 6 photos per member (JPEG/PNG/WebP, 4 MB max,
  checked by file signature, not file name), bio, prompts, languages,
  interests, travel status. Photos are only served to signed-in members.
- **Swiping**: drag, buttons or ← ↑ → keys. Mutual likes create a match. The
  deck respects both people's "show me" preferences.
- **Chat**: real messages between matches, refreshed every 3 seconds, with the
  scam/paid-arrangement shield. Unmatch and report & block from the chat menu.
- **Globe+** ($14.99/month via Stripe Checkout):
  | | Free | Globe+ |
  |---|---|---|
  | Passport to another city | — | ✓ |
  | See who likes you | blurred | ✓ |
  | Likes | 25/day | unlimited |
  | Super likes | 1/day | 5/day |

Twelve fictional **sample members** are loaded on first start so a new site
has people to swipe on. Some of them "like back" and send a canned reply, so
you can test matching and chat alone. Turn them off with `SEED_MEMBERS=off`.

## Running it

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # unit + database tests
```

No setup is needed locally: without `DATABASE_URL` the app uses PGlite (real
Postgres compiled to WebAssembly) and stores data in `.data/pglite`. Without
Stripe keys, the Globe+ page offers a 30-day test upgrade instead of checkout.

## Going live

Set these environment variables (see `.env.example`):

| Variable | What it's for |
|---|---|
| `DATABASE_URL` | Postgres connection string (Neon, Supabase, Vercel Postgres…). Tables are created on first request. |
| `SESSION_SECRET` | Signs login cookies. Generate with `openssl rand -base64 32`. |
| `SITE_URL` | Public URL, used for Stripe redirects, e.g. `https://girlsaroundtheglobe.com`. |
| `STRIPE_SECRET_KEY` | Turns on Globe+ checkout and the billing portal. |
| `STRIPE_WEBHOOK_SECRET` | Verifies Stripe webhooks sent to `/api/stripe/webhook`. Subscribe to `checkout.session.completed`, `invoice.paid` and `customer.subscription.deleted`. |
| `SEED_MEMBERS` | `off` to launch without the sample members. |

The app refuses to start in production without `DATABASE_URL` and
`SESSION_SECRET`, so it can't silently run on throwaway storage or a guessable
secret.

## Still to do before launch

- Selfie + ID verification (e.g. Persona, Veriff, Onfido); the verified badge
  is currently only set on sample members
- Moving photos from the database to object storage (Vercel Blob or S3) once
  traffic grows, plus automatic nudity screening
- Email verification and password reset (needs an email provider)
- A moderation queue for the `reports` table
- Real translation in chat (DeepL or Google Translate API)
- Login rate limiting in a shared store; today's limiter is per server instance
- Legal review: terms, privacy policy (GDPR/CCPA), age-assurance rules by country

## Stack

Next.js 16 (App Router, server actions) · React 19 · TypeScript · Tailwind
CSS v4 · Postgres (`pg`) / PGlite · Stripe · jose
