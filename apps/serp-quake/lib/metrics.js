// Ground displacement at one station: how far one keyword's Google top 10 moved
// between two readings. Four independent measures, each 0 (identical) .. 1
// (completely different), blended into one amplitude. README.md explains why
// each one is in the blend and why it carries the weight it does.

'use strict';

// Approximate desktop organic click-through rate by position. The absolute
// numbers matter less than the shape: position 1 is worth ~10x position 10, so
// a swap at the top moves far more traffic than a swap at the bottom.
// Shape follows published large-scale CTR studies (e.g. Backlinko 2019, 4M
// results; Advanced Web Ranking's CTR study).
const CTR = [0.276, 0.158, 0.110, 0.084, 0.063, 0.049, 0.039, 0.033, 0.027, 0.024];
const CTR_TOTAL = CTR.reduce((a, b) => a + b, 0);

const WEIGHTS = Object.freeze({ rank: 0.45, traffic: 0.25, domain: 0.20, feature: 0.10 });

// Persistence for rank-biased overlap: p = 0.9 puts ~86% of the weight on the
// top 10, which is what a 10-result SERP actually is.
const RBO_P = 0.9;

function normalizeUrl(u) {
  try {
    const x = new URL(u);
    const host = x.hostname.replace(/^www\./, '').toLowerCase();
    const path = x.pathname.replace(/\/+$/, '') || '/';
    return host + path.toLowerCase();
  } catch (e) {
    return String(u || '').toLowerCase();
  }
}

function domainOf(u) {
  try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { return ''; }
}

// Extrapolated rank-biased overlap (Webber, Moffat & Zobel 2010, eq. 32) for two
// ranked lists of possibly different length that may share no items at all.
// 1 = identical order, 0 = nothing in common.
function rbo(a, b, p = RBO_P) {
  if (!a.length && !b.length) return 1;
  if (!a.length || !b.length) return 0;
  const [S, L] = a.length <= b.length ? [a, b] : [b, a];
  const s = S.length; const l = L.length;
  // X[d] = size of the overlap of the two prefixes of depth d (S stops growing at s).
  const seenS = new Set(); const seenL = new Set();
  const X = [0];
  let overlap = 0;
  for (let d = 1; d <= l; d++) {
    const xl = L[d - 1];
    if (d <= s) {
      const xs = S[d - 1];
      if (xs === xl) overlap++;
      else {
        if (seenL.has(xs)) overlap++;
        if (seenS.has(xl)) overlap++;
      }
      seenS.add(xs);
    } else if (seenS.has(xl)) overlap++;
    seenL.add(xl);
    X[d] = overlap;
  }
  const Xs = X[s]; const Xl = X[l];
  let a1 = 0;
  for (let d = 1; d <= l; d++) a1 += (X[d] / d) * Math.pow(p, d);
  let a2 = 0;
  for (let d = s + 1; d <= l; d++) a2 += ((Xs * (d - s)) / (s * d)) * Math.pow(p, d);
  const v = ((1 - p) / p) * (a1 + a2) + ((Xl - Xs) / l + Xs / s) * Math.pow(p, l);
  return Math.max(0, Math.min(1, v));
}

// Share of the top 10's click value that changed hands. Each URL is worth the
// CTR of its position; a URL that left the top 10 is worth 0. Halved because
// every click lost by one URL is gained by another.
function trafficShift(prevUrls, curUrls) {
  const val = (list) => {
    const m = new Map();
    list.slice(0, 10).forEach((u, i) => m.set(u, (m.get(u) || 0) + CTR[i]));
    return m;
  };
  const A = val(prevUrls); const B = val(curUrls);
  const keys = new Set([...A.keys(), ...B.keys()]);
  let moved = 0;
  for (const k of keys) moved += Math.abs((A.get(k) || 0) - (B.get(k) || 0));
  return Math.min(1, moved / (2 * CTR_TOTAL));
}

function jaccardDistance(a, b) {
  const A = new Set(a); const B = new Set(b);
  if (!A.size && !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return 1 - inter / (A.size + B.size - inter);
}

// The full displacement between two readings of the same keyword.
function displacement(prev, cur) {
  const pu = prev.organic.slice(0, 10).map((o) => normalizeUrl(o.url));
  const cu = cur.organic.slice(0, 10).map((o) => normalizeUrl(o.url));
  const pd = prev.organic.slice(0, 10).map((o) => o.domain || domainOf(o.url));
  const cd = cur.organic.slice(0, 10).map((o) => o.domain || domainOf(o.url));
  const components = {
    rank: 1 - rbo(pu, cu),
    traffic: trafficShift(pu, cu),
    domain: jaccardDistance(pd, cd),
    feature: jaccardDistance(prev.features || [], cur.features || []),
  };
  const amplitude =
    WEIGHTS.rank * components.rank +
    WEIGHTS.traffic * components.traffic +
    WEIGHTS.domain * components.domain +
    WEIGHTS.feature * components.feature;
  return { amplitude, components };
}

module.exports = { CTR, WEIGHTS, RBO_P, normalizeUrl, domainOf, rbo, trafficShift, jaccardDistance, displacement };
