# Homeballot — online voting demo

A static, no-backend demo of what verified online voting for Americans could look
like. Built to back an Instagram funding campaign for the full project.

Everything is simulated: the election, the candidates, the access codes and the
results. Nothing leaves the visitor's browser, and the page never asks for a
Social Security number or any other real personal data.

## Before you post it

Open `app.js` and fill in the two lines at the top:

```js
const FUND_URL = "";          // your GoFundMe / Kickstarter / Stripe link
const INSTAGRAM_HANDLE = "";  // e.g. "homeballot" (no @)
```

Until `FUND_URL` is set, the "Contribute" and "Support" buttons scroll to the
funding section and say the contribution page will open soon.

## Contact form

`api/contact.js` is a Vercel function that relays the form to the address in the
`CONTACT_EMAIL` environment variable (set in the Vercel project, never in code).
Delivery uses FormSubmit; the first message to a new address sends a one-time
activation email that must be confirmed before messages arrive.

## Deploy

Static files, no build step. From this folder: `vercel deploy --prod`, or import
the repo in Vercel with **Root Directory** set to `apps/homeballot`.
