# Audit findings — palmtreesurf.com

**Status: extraction BLOCKED. Section 1.7 ladder worked top to bottom; all seven steps fail for the same root cause.**

Per VISUAL-SPEC.md §1.8 this file must exist before theme code is written. It exists, and it
reports that the audit could not be completed from this environment — not that it was skipped.

## Root cause

`palmtreesurf.com` is refused by this sandbox's egress proxy **at the CONNECT stage**, before any
TLS handshake or HTTP request. This is an allowlist policy denial on the host, not an SPA problem,
not a rendering problem, and not a tool-choice problem.

## Ladder results (§1.7)

| # | Step | Result |
|---|---|---|
| 1 | Stop using the fetch tool, switch to headless Chromium | Done. Chromium fails identically — see 3. |
| 2 | `curl -sSI https://palmtreesurf.com/` | `curl: (56) CONNECT tunnel failed, response 403` / `HTTP/1.1 403 Forbidden` |
| 3 | Confirm Chromium installed | Real problem found and fixed: `npm i playwright` pulled a build expecting `chromium_headless_shell-1243`, image ships `1194`. Fixed with `executablePath: '/opt/pw-browsers/chromium'`. Browser then launches correctly. |
| 4 | Real desktop Chrome UA + 1440x900 viewport | Built into `extract.mjs`. Same failure. |
| 5 | `waitUntil: 'load'` + `waitForSelector('main, section, img')`, 30s | `page.goto: net::ERR_TUNNEL_CONNECTION_FAILED` — fails at connection, so hydration waits cannot apply. |
| 6 | Check for a bot wall (Cloudflare / captcha) | **Not a bot wall.** No DOM is returned at all; the failure is pre-response. A challenge page would have returned markup. |
| 7 | Raw source via curl, then grep the JS bundle | `curl -s` returns zero bytes. The bundle is on the same blocked host, so it cannot be fetched or grepped either. |

## The control test that proves it is the host, not the setup

Two different Chromium errors, and the difference is the whole finding:

```
palmtreesurf.com  -> net::ERR_TUNNEL_CONNECTION_FAILED   (proxy refused CONNECT)
github.com        -> net::ERR_CERT_AUTHORITY_INVALID     (tunnel OPENED, failed later at TLS)
```

github.com got a tunnel. palmtreesurf.com never did. Chromium's networking works; this one host is
denied by policy.

## Known follow-up, not a blocker

Playwright's Chromium launches with an empty NSS store at `/root/.pki/nssdb`, so it does not trust
the proxy's CA (`/root/.ccr/ca-bundle.crt`) — that is the `ERR_CERT_AUTHORITY_INVALID` above. It is
moot while the host is blocked, but must be fixed before `extract.mjs` can run against any host:

```bash
apt-get update && apt-get install -y libnss3-tools     # currently 404s on a stale index
certutil -d sql:/root/.pki/nssdb -A -t "C,," -n ccr-proxy -i /root/.ccr/agent-proxy-ca.crt
```

TLS verification must not be disabled to work around this.

## What is needed to unblock

Either:

- **(a)** Allowlist `palmtreesurf.com` in this environment's egress policy, then run
  `node audit/extract.mjs`. The script is written, fixed, and ready — it will produce every
  artifact §1.1–§1.6 requires in one pass.
- **(b)** A manual capture. Open the site in Chrome, Inspect, right-click `<html>` in Elements,
  Copy → Copy outerHTML, paste into `audit/home-dom.html`. Repeat for two or three interior pages.
  Full-page screenshots at 1440 and 375 into `audit/shot-1440.png` / `audit/shot-375.png`.
  This is the faster path and gives the real classes, copy, colors and image URLs.

## Proceeding meanwhile

Per §1.7, the build does not stall on this: sections 3–13 are being built against the spec alone,
with every business fact as a `{{PT_*}}` placeholder (§12) and every photo slot as a manifest
placeholder (§10.1). See `TODO-CONTENT.md`.

Nothing in the theme encodes an invented business fact, price, or brand color.
