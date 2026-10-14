#!/usr/bin/env python3
"""Pull quarterly Search Console + GA4 numbers straight from Google's APIs.

Auth: a service account key, given as the env var GOOGLE_SERVICE_ACCOUNT_JSON
(the key file's JSON contents) or GOOGLE_APPLICATION_CREDENTIALS (a path).
The service account must be a user on each Search Console property and a
Viewer on each GA4 property.

Needs: pip install google-auth requests

  python3 scripts/q3_google_pull.py list                 # what the key can see
  python3 scripts/q3_google_pull.py report [--out DIR]   # Q3 vs Q2 for every brand
"""
import argparse
import json
import os
import sys
from datetime import date

from google.auth.transport.requests import AuthorizedSession
from google.oauth2 import service_account

SCOPES = [
    "https://www.googleapis.com/auth/webmasters.readonly",
    "https://www.googleapis.com/auth/analytics.readonly",
]

BRANDS = {
    "EnVue Telematics": "envuetelematics.com",
    "EnVue Mexico": "envuemex.com",
    "TruePoint Systems": "truepointsystems.com",
    "Centris": "centrisinfo.com",
    "Centris Intelligence": "centrisintelligence.com",
}

PERIODS = {
    "Q3": (date(2026, 7, 1), date(2026, 9, 30)),
    "Q2": (date(2026, 4, 1), date(2026, 6, 30)),
}


def session():
    raw = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    if raw:
        creds = service_account.Credentials.from_service_account_info(json.loads(raw), scopes=SCOPES)
    elif os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        creds = service_account.Credentials.from_service_account_file(
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"], scopes=SCOPES)
    else:
        sys.exit("No credentials: set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.")
    return AuthorizedSession(creds), creds.service_account_email


def call(s, method, url, **kw):
    r = s.request(method, url, timeout=60, **kw)
    if r.status_code >= 400:
        raise RuntimeError(f"{r.status_code} {url}: {r.text[:400]}")
    return r.json()


# ---------- discovery ----------

def gsc_sites(s):
    data = call(s, "GET", "https://searchconsole.googleapis.com/webmasters/v3/sites")
    return [e["siteUrl"] for e in data.get("siteEntry", [])]


def ga4_properties(s):
    """Map property id -> display name. Needs the Analytics Admin API enabled."""
    props, token = {}, None
    while True:
        params = {"pageSize": 200, **({"pageToken": token} if token else {})}
        data = call(s, "GET", "https://analyticsadmin.googleapis.com/v1beta/accountSummaries", params=params)
        for acct in data.get("accountSummaries", []):
            for p in acct.get("propertySummaries", []):
                props[p["property"].split("/")[-1]] = p.get("displayName", "")
        token = data.get("nextPageToken")
        if not token:
            return props


def match_gsc(sites, domain):
    """Prefer the domain property, then https www / non-www URL-prefix ones."""
    for cand in (f"sc-domain:{domain}", f"https://www.{domain}/", f"https://{domain}/",
                 f"http://www.{domain}/", f"http://{domain}/"):
        if cand in sites:
            return cand
    return None


def match_ga4(props, domain, overrides):
    if domain in overrides:
        return overrides[domain]
    stem = domain.split(".")[0].lower()
    hits = [pid for pid, name in props.items() if stem in name.lower().replace(" ", "")]
    return hits[0] if len(hits) == 1 else None


# ---------- Search Console ----------

def gsc_query(s, site, start, end, dims=None, limit=25):
    url = ("https://searchconsole.googleapis.com/webmasters/v3/sites/"
           + requests_quote(site) + "/searchAnalytics/query")
    body = {"startDate": start.isoformat(), "endDate": end.isoformat(), "type": "web",
            "rowLimit": limit, "dataState": "final"}
    if dims:
        body["dimensions"] = dims
    return call(s, "POST", url, json=body).get("rows", [])


def requests_quote(v):
    from urllib.parse import quote
    return quote(v, safe="")


def gsc_block(s, site):
    out = {"property": site}
    for label, (a, b) in PERIODS.items():
        rows = gsc_query(s, site, a, b)
        t = rows[0] if rows else {"clicks": 0, "impressions": 0, "ctr": 0, "position": 0}
        out[label] = {k: t.get(k, 0) for k in ("clicks", "impressions", "ctr", "position")}
    a, b = PERIODS["Q3"]
    out["top_queries_q3"] = [{"query": r["keys"][0], **{k: r[k] for k in ("clicks", "impressions", "ctr", "position")}}
                             for r in gsc_query(s, site, a, b, ["query"])]
    out["top_pages_q3"] = [{"page": r["keys"][0], **{k: r[k] for k in ("clicks", "impressions", "ctr", "position")}}
                           for r in gsc_query(s, site, a, b, ["page"])]
    out["monthly_q3"] = monthly_gsc(s, site)
    return out


def monthly_gsc(s, site):
    a, b = PERIODS["Q3"]
    rows = gsc_query(s, site, a, b, ["date"], limit=200)
    months = {}
    for r in rows:
        m = r["keys"][0][:7]
        agg = months.setdefault(m, {"clicks": 0, "impressions": 0})
        agg["clicks"] += r["clicks"]
        agg["impressions"] += r["impressions"]
    return months


# ---------- GA4 ----------

GA_METRICS = ["sessions", "totalUsers", "engagedSessions", "engagementRate", "screenPageViews"]


def ga_report(s, pid, start, end, dims=None, limit=25, metrics=GA_METRICS):
    body = {"dateRanges": [{"startDate": start.isoformat(), "endDate": end.isoformat()}],
            "metrics": [{"name": m} for m in metrics], "limit": limit}
    if dims:
        body["dimensions"] = [{"name": d} for d in dims]
        body["orderBys"] = [{"metric": {"metricName": metrics[0]}, "desc": True}]
    data = call(s, "POST", f"https://analyticsdata.googleapis.com/v1beta/properties/{pid}:runReport", json=body)
    rows = []
    for r in data.get("rows", []):
        row = {d: v["value"] for d, v in zip(dims or [], r.get("dimensionValues", []))}
        for m, v in zip(metrics, r["metricValues"]):
            row[m] = float(v["value"])
        rows.append(row)
    return rows


def ga_block(s, pid):
    out = {"property_id": pid}
    for label, (a, b) in PERIODS.items():
        rows = ga_report(s, pid, a, b)
        out[label] = rows[0] if rows else {m: 0 for m in GA_METRICS}
    a, b = PERIODS["Q3"]
    out["channels_q3"] = ga_report(s, pid, a, b, ["sessionDefaultChannelGroup"], 20)
    out["landing_pages_q3"] = ga_report(s, pid, a, b, ["landingPage"], 25)
    out["organic_q3"] = ga_report(s, pid, a, b, ["sessionDefaultChannelGroup"], 20,
                                  ["sessions", "engagedSessions", "keyEvents"])
    out["monthly_q3"] = ga_report(s, pid, a, b, ["yearMonth"], 12, ["sessions", "totalUsers"])
    return out


# ---------- output ----------

def pct(new, old):
    return "n/a" if not old else f"{(new - old) / old * 100:+.1f}%"


def markdown(results):
    lines = ["# Q3 2026 Google data (Jul 1 – Sep 30, vs Q2)", ""]
    lines += ["| Brand | GSC clicks | vs Q2 | Impressions | vs Q2 | CTR | Avg pos | GA4 sessions | vs Q2 | Users | Engagement |",
              "|---|---|---|---|---|---|---|---|---|---|---|"]
    for brand, r in results.items():
        g, a = r.get("gsc"), r.get("ga4")
        gc = (f"{g['Q3']['clicks']:,.0f} | {pct(g['Q3']['clicks'], g['Q2']['clicks'])} | "
              f"{g['Q3']['impressions']:,.0f} | {pct(g['Q3']['impressions'], g['Q2']['impressions'])} | "
              f"{g['Q3']['ctr'] * 100:.2f}% | {g['Q3']['position']:.1f}") if g else "— | — | — | — | — | —"
        ac = (f"{a['Q3']['sessions']:,.0f} | {pct(a['Q3']['sessions'], a['Q2']['sessions'])} | "
              f"{a['Q3']['totalUsers']:,.0f} | {a['Q3']['engagementRate'] * 100:.1f}%") if a else "— | — | — | —"
        lines.append(f"| {brand} | {gc} | {ac} |")
    for brand, r in results.items():
        lines += ["", f"## {brand}"]
        for note in r.get("notes", []):
            lines.append(f"- _{note}_")
        if r.get("gsc"):
            lines += ["", "Top queries (Q3, by clicks):", ""]
            for q in r["gsc"]["top_queries_q3"][:10]:
                lines.append(f"- {q['query']} — {q['clicks']:.0f} clicks, {q['impressions']:.0f} impr, pos {q['position']:.1f}")
        if r.get("ga4"):
            lines += ["", "Channels (Q3 sessions):", ""]
            for c in r["ga4"]["channels_q3"]:
                lines.append(f"- {c['sessionDefaultChannelGroup']}: {c['sessions']:,.0f}")
    return "\n".join(lines) + "\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["list", "report"])
    ap.add_argument("--out", default=".")
    ap.add_argument("--ga4", action="append", default=[],
                    help="domain=propertyId, when a GA4 property can't be matched by name")
    args = ap.parse_args()

    s, email = session()
    print(f"Authenticated as {email}", file=sys.stderr)
    sites = gsc_sites(s)
    try:
        props = ga4_properties(s)
    except RuntimeError as e:
        props = {}
        print(f"GA4 property listing failed (enable the Analytics Admin API?): {e}", file=sys.stderr)

    if args.mode == "list":
        print("Search Console properties:", *sites or ["(none)"], sep="\n  ")
        print("GA4 properties:", *[f"{k}  {v}" for k, v in props.items()] or ["(none)"], sep="\n  ")
        return

    overrides = dict(x.split("=", 1) for x in args.ga4)
    results = {}
    for brand, domain in BRANDS.items():
        r, notes = {}, []
        site = match_gsc(sites, domain)
        if site:
            try:
                r["gsc"] = gsc_block(s, site)
            except RuntimeError as e:
                notes.append(f"Search Console error: {e}")
        else:
            notes.append(f"No Search Console access for {domain}")
        pid = match_ga4(props, domain, overrides)
        if pid:
            try:
                r["ga4"] = ga_block(s, pid)
            except RuntimeError as e:
                notes.append(f"GA4 error: {e}")
        else:
            notes.append(f"No GA4 property matched for {domain} (pass --ga4 {domain}=<id>)")
        r["notes"] = notes
        results[brand] = r

    os.makedirs(args.out, exist_ok=True)
    with open(os.path.join(args.out, "q3_google.json"), "w") as f:
        json.dump(results, f, indent=2)
    with open(os.path.join(args.out, "q3_google.md"), "w") as f:
        f.write(markdown(results))
    print(f"Wrote {args.out}/q3_google.json and q3_google.md", file=sys.stderr)


if __name__ == "__main__":
    main()
