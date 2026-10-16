# Girls Around the Globe

International dating with a swipe. Match with people from every country, use
Passport to swipe in a city before you travel there, and chat with built-in
translation and a scam shield.

This is a clickable prototype: the UI and flows work end to end, but members
are fictional seed data (`lib/profiles.ts`) and accounts, swipes, matches and
messages live in the visitor's browser (`lib/member-store.ts`). Replies in chat
and the "translated from" labels are simulated.

## Screens

- **`/`** — landing page with a phone mockup of the swipe deck
- **`/join`** — 3-step sign-up with an 18+ date-of-birth gate and community guidelines
- **`/swipe`** — card deck: drag, buttons or ← → keys; Worldwide or Passport city; "It's a match!" modal
- **`/matches`** — new matches row, conversation list, chat with scam/paid-arrangement warnings
- **`/profile/[id]`** — full profile with like/pass
- **`/safety`** — meeting tips, red flags, community guidelines, reporting

## Policies baked into the product

Adults 18+ only, consent first, and no paid or transactional arrangements
(escorting, "donations", sugar deals). The chat scanner flags money requests,
gift cards, crypto, off-platform pushes, and rate/"roses" language.

## Before launch

- Real auth + database for profiles, swipes, matches and messages
- Photo uploads with moderation, and selfie + ID verification (e.g. Persona, Veriff, Onfido)
- Server-side message moderation and a human report-review queue
- Real translation (DeepL or Google Translate API)
- Payments for premium features (Passport, see who liked you)
- Legal review: terms, privacy policy (GDPR/CCPA), age assurance rules by country

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4

```bash
pnpm install
pnpm dev
```
