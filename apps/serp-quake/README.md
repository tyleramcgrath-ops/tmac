# SERP Quake

A seismograph for Google's algorithm. It reads the top 10 for a fixed network of keywords every
few hours and turns how hard those results moved into an earthquake-style magnitude: **M2 is an
ordinary day, and every +3 means the whole network is shaking twice as hard.** Big core updates
land around M7–9 and normal churn stays near 2. Every number on the dashboard shows the
arithmetic that produced it.

```
quake scan                 one live sweep of every station (needs SERPER_API_KEY or SERPAPI_KEY)
quake watch [--every 6h]   scan forever on a cadence + serve the live dashboard on :8787
quake serve [--port 8787]  serve the dashboard for data already collected
quake status               the latest reading with the formula worked through in the terminal
quake calibrate            magnitudes inside vs outside Google-confirmed updates
quake build [--out FILE]   standalone dashboard.html with the data embedded
quake simulate             a synthetic 60-day seismogram, no keys needed
```

`--data DIR` (default `./data`) and `--stations FILE` (default `stations.json`) work on every
command. There are no dependencies. It needs Node 20 or newer.

## Running it

**Try it with no keys:** `npm run demo`, then open http://localhost:8787. It runs a built-in
synthetic Google through the real instrument: a quiet month, a spam update, a scraper-poisoning
storm, and a core update. The dashboard labels this data as simulated.

**Constantly, with no server:** `.github/workflows/serp-quake.yml` runs a sweep every 6 hours.
It commits each sweep to the `serp-quake-data` branch and rebuilds `index.html` there, so the
branch holds both the full history and the current dashboard. It also writes `quake status` to
the run's summary. To switch it on, add a `SERPER_API_KEY` (https://serper.dev) and/or
`SERPAPI_KEY` (https://serpapi.com) repo secret. Optional alerts go to
`QUAKE_SLACK_WEBHOOK_URL` or `QUAKE_WEBHOOK_URL` when a quake starts, intensifies, or ends.

**Constantly, on any box:** `SERPER_API_KEY=… node bin/quake.js watch --data ./data` sweeps on
the cadence and serves the live dashboard, which refreshes itself every minute.

**Cost:** 48 keywords × 4 sweeps a day ≈ 5,800 searches a month, plus a handful of re-fetches.
You can trade cost for steadiness by changing the keyword count or the cadence.

## How the magnitude is built, and why

The whole design copies how seismologists measure real earthquakes. Each piece exists because
of a specific way the naive version goes wrong.

### 1. Stations: 48 keywords on 8 fault lines

Each keyword is a seismometer. The keywords are grouped into eight verticals ("fault lines"):
health, finance, ecommerce, local, travel, tech, food, and how-to. Each vertical mixes YMYL,
commercial, and informational intent. A niche update (product reviews, local) lights one or two
fault lines, while a core update lights nearly all of them. `stations.json` is meant to be
edited. A new keyword seeds on its first sweep and starts measuring on its second.

### 2. Ground motion: four measures of how a SERP moved

Each station's top 10 is compared with its previous accepted reading. Each measure runs from
0 (identical) to 1 (completely different).

| Measure | Weight | What it captures | Why this weight |
|---|---|---|---|
| **rank**: 1 − rank-biased overlap, p = 0.9 | 0.45 | how far the ordering moved, top-weighted | RBO (Webber, Moffat & Zobel 2010) is the standard measure for comparing ranked lists that can share any number of items. The ordering *is* the SERP, so it carries the most weight. |
| **clicks**: CTR-weighted share of click value that changed hands | 0.25 | what site owners actually feel | Position 1 gets ~28% of clicks and position 10 ~2.4%, so a #1 swap is ~10× a #10 swap. RBO is top-weighted but not traffic-shaped. |
| **domains**: Jaccard distance of the sites in the top 10 | 0.20 | *who* ranks, not just the order | Pages from one site swapping places is churn. New sites arriving is what core updates do. |
| **features**: Jaccard distance of SERP features | 0.10 | AI Overview, snippets, PAA, local pack, video, shopping… | Layouts change during updates, but features also flicker on their own, so this measure is the least trustworthy. |

`amplitude = 0.45·rank + 0.25·clicks + 0.20·domains + 0.10·features`

### 3. Station correction: each keyword against its own normal

Some SERPs churn every day and some barely move. Raw amplitudes would let a few naturally
volatile keywords set the reading. So each amplitude is divided by **that keyword's median
amplitude over its last 120 quiet readings** (≈30 days at 6h). Readings taken during a declared
quake are left out, so a two-week core update can't teach the instrument that quakes are normal.
There is a floor of 0.03, so a frozen keyword moving one spot can't read as a 50× quake.

### 4. Network reading: robust to poisoned data

The network value is the **interquartile mean** (the mean of the middle 50%) of all station
ratios. One wild keyword can't move it. It breaks down only if more than a quarter of keywords
are corrupted in the same direction, which clears the 5–20% poisoning rate Ahrefs measured.
That value is then divided by the network's own quiet level (R0), because a skewed ratio
distribution doesn't average to exactly 1 on a calm day. After both normalizations,
**R = 1 means an ordinary day** by construction.

### 5. Magnitude: logarithmic, like Richter

`M = 2 + 3·log2(R)`, clamped to 0–10.

| R (× normal shaking) | 1 | 1.26 | 1.59 | 2 | 2.52 | 3.17 | 4 | 5.04 | 6.35 |
|---|---|---|---|---|---|---|---|---|---|
| M | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |

Shaking spans orders of magnitude, so a linear scale would either flatten normal days or blow
out on big ones. The headline is the **24-hour magnitude**, the magnitude of the average R over
the last day. One sweep is a single noisy sample, and seismologists likewise report sustained
amplitude rather than one wiggle of the needle. The single-sweep value is still drawn as the
thin trace.

| M | Class | Typically |
|---|---|---|
| 0–3 | Background | normal daily churn |
| 3–4 | Minor | above normal, usually nothing |
| 4–5 | Light | noticeable, often one vertical |
| 5–6 | Moderate | something is rolling out or being tested |
| 6–7 | Strong | a confirmed-size update (spam, reviews, helpful content) |
| 7–8 | Major | core-update territory |
| 8–9 | Great | the largest core updates |
| 9–10 | Historic | Florida/Panda/Medic-class reshuffle |

The class names are a hypothesis until there's data behind them. `quake calibrate` reports the
magnitudes your own stations recorded during each of Google's confirmed updates versus all other
days, so the names can be checked against what actually happened.

### 6. Is it a quake? STA/LTA, the standard automatic earthquake picker

A quake is declared when all of these hold:

- the 24h average R (STA) is ≥ 1.6× the 14-day quiet average (LTA),
- ≥ 25% of keywords are shaking at ≥ 2× their normal (breadth: a core update moves everything,
  one flipped SERP moves one keyword),
- the sweep reads at least M4, and
- the instrument isn't reporting interference.

A quake ends after 24h below 1.15×, and is capped at 21 days, longer than any confirmed rollout.
Every quake is logged with its start, end, peak, breadth, and fault lines, then matched against
Google's confirmed updates from the Search Status Dashboard's public feed
(status.search.google.com). Google confirms only some of what it ships, so an unconfirmed quake
is reported as unconfirmed, not as a false alarm.

### 7. Instrument health: the Ahrefs problem

In October 2026 Ahrefs reported that Google is "poisoning" results served to suspected SERP
scrapers, with 5–20% of results affected depending on the provider
(https://ahrefs.com/blog/serp-data-update/). Every third-party volatility sensor is built on
scraped SERPs, and a poisoned read looks exactly like an earthquake: the whole top 10 changes.
So before measuring, each reading goes through these checks:

1. **Malformed** (fewer than 7 results, or more than 6 of 10 from one site): rejected.
2. **Isolated total replacement** (rank ≥ 0.85 and domains ≥ 0.8): re-fetched once, through the
   second provider if both keys are set (a second seismometer at the same station).
   - If the second look matches the old SERP, the first read was poisoned and is replaced.
   - If it confirms the new SERP, the change was real.
   - If it disagrees with both, both reads are dropped.
3. **Total replacements still unresolved are dropped**, unless 30%+ of keywords flip at once.
   That is more than poisoning has been measured to reach, so it is treated as a real, violent
   update.
4. A rejected reading never becomes the station's reference, so it can't distort the next
   comparison either.
5. If 20%+ of a sweep is rejected, the dashboard shows **sensor interference** and the sweep
   can't trigger a quake.

### What it can't see

It sees one location and language (US English by default, set in `stations.json`) and one
unpersonalized desktop view. Mobile, other countries, and personalized results can move
differently. A high magnitude says rankings moved, not who won. For that, look at the
most-shaken keywords in the station array.

## Files

```
bin/quake.js           CLI: scan / watch / serve / status / calibrate / build / simulate
lib/metrics.js         ground motion: RBO, CTR-weighted traffic shift, Jaccard
lib/seismo.js          the instrument: baselines, poisoning filter, magnitude, STA/LTA events
lib/providers.js       Serper + SerpApi, normalized
lib/google-status.js   Google's confirmed ranking updates (Search Status Dashboard feed)
lib/report.js          dashboard payload, worked example, calibration
lib/alert.js           Slack / webhook alerts
lib/simulate.js        synthetic Google for tests and the demo
lib/store.js           flat files: state.json, sweeps.jsonl, events.json, confirmed.json
dashboard/index.html   the seismograph (one file, no build step)
stations.json          the keyword network
test/                  `npm test`: metric math, poisoning, end-to-end detection on the simulator
```
