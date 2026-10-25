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

The form posts from the browser to FormSubmit using a private alias code
(`FORM_ALIAS` in `app.js`), so the destination address never appears in the
page or the repo. FormSubmit issues the alias after the address is activated.
FormSubmit blocks requests from Vercel's servers, so it can't be relayed through
a serverless function.

## Deploy

Static files, no build step. From this folder: `vercel deploy --prod`, or import
the repo in Vercel with **Root Directory** set to `apps/homeballot`.
