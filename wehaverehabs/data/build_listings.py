"""Normalise public facility data into one listings.jsonl for the theme importer.

Sources
  --samhsa DIR   JSON pages from FindTreatment.gov (SAMHSA, US public domain)
  --cqc FILE     CQC directory CSV (England, Open Government Licence v3.0)
  --intl DIR     *.json arrays of web-researched facilities (official websites)

Usage
  python3 build_listings.py --samhsa raw/samhsa --cqc raw/cqc.csv --intl raw/intl -o listings.jsonl
"""

import argparse
import csv
import datetime
import gzip
import glob
import json
import os
import re
import sys

US_STATES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California", "CO": "Colorado",
    "CT": "Connecticut", "DE": "Delaware", "DC": "District of Columbia", "FL": "Florida", "GA": "Georgia",
    "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas",
    "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland", "MA": "Massachusetts",
    "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri", "MT": "Montana",
    "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico",
    "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
    "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota",
    "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont", "VA": "Virginia", "WA": "Washington",
    "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming", "PR": "Puerto Rico", "GU": "Guam",
    "VI": "U.S. Virgin Islands", "AS": "American Samoa", "MP": "Northern Mariana Islands", "PW": "Palau",
    "FM": "Micronesia", "MH": "Marshall Islands",
}

# Not open to the public: correctional and detention settings.
EXCLUDE_NAME = re.compile(
    r"\b(jail|correction(al|s)?|prison|detention|penitentiary|sheriff|probation|parole|inmate)\b", re.I
)

UK_NATIONS = {"England", "Scotland", "Wales", "Northern Ireland"}

CARE_LEVELS = {"Retreat", "Clinical program", "Medically supervised"}
FOCUS = {
    "Alcohol & substance use", "Anxiety & depression", "Trauma & PTSD", "Burnout & exhaustion",
    "Grief & life transitions", "Eating disorders", "Mental health",
}
SETTINGS = {"Ocean", "Jungle", "Mountains", "Hot springs", "City", "Countryside"}


def clean(value):
    if value is None:
        return None
    value = re.sub(r"\s+", " ", str(value)).strip()
    return value or None


def website(url):
    url = clean(url)
    if not url or url.lower() in ("http://", "https://", "n/a", "none"):
        return None
    if not re.match(r"^https?://", url, re.I):
        url = "https://" + url.lstrip("/")
    return url


def title_case_city(city):
    city = clean(city)
    if not city:
        return None
    return city.title() if city.isupper() or city.islower() else city


def samhsa(directory):
    rows = []
    for path in sorted(glob.glob(os.path.join(directory, "*.json"))):
        with open(path, encoding="utf-8") as fh:
            rows.extend(json.load(fh)["rows"])
    merged = {}
    for r in rows:
        name = clean(r.get("name1"))
        if not name or EXCLUDE_NAME.search(name) or EXCLUDE_NAME.search(r.get("name2") or ""):
            continue
        svc = {s["f2"]: clean(s.get("f3")) for s in (r.get("services") or [])}
        key = (name.lower(), (r.get("street1") or "").lower(), (r.get("zip") or "")[:5])

        blob = " ".join(v for v in svc.values() if v).lower()
        setting_text = (svc.get("SET") or "").lower()
        care = "Medically supervised" if (
            "hospital inpatient" in setting_text or "detox" in setting_text or svc.get("DETOX") or svc.get("HOSP")
        ) else "Clinical program"

        focus = []
        tc = (svc.get("TC") or "").lower()
        if "substance use" in tc or r.get("typeFacility") in ("SA", "OTP"):
            focus.append("Alcohol & substance use")
        if "mental health" in tc or r.get("typeFacility") == "MH":
            focus.append("Mental health")
        if "trauma" in blob:
            focus.append("Trauma & PTSD")
        if "eating disorder" in blob:
            focus.append("Eating disorders")

        state = US_STATES.get((r.get("state") or "").upper(), clean(r.get("state")))
        city = title_case_city(r.get("city"))
        address = ", ".join(x for x in [clean(r.get("street1")), clean(r.get("street2")), city,
                                         f"{r.get('state') or ''} {r.get('zip') or ''}".strip()] if x)
        languages = "; ".join(x for x in [svc.get("SL"), svc.get("OL")] if x) or None
        rec = {
            "source": "samhsa",
            "source_id": f"{name}|{r.get('street1') or ''}|{(r.get('zip') or '')[:5]}",
            "source_url": "https://findtreatment.gov/",
            "name": name,
            "operator": clean(r.get("name2")) if clean(r.get("name2")) and clean(r.get("name2")) != name else None,
            "country": "United States",
            "region": state,
            "city": city,
            "address": address,
            "lat": clean(r.get("latitude")),
            "lng": clean(r.get("longitude")),
            "phone": clean(r.get("phone")),
            "intake_phone": clean(r.get("intake1")),
            "website": website(r.get("website")),
            "care_level": care,
            "focus": focus,
            "setting": [],
            "languages": languages,
            "description": None,
            "service_setting": svc.get("SET"),
            "approaches": svc.get("TAP"),
            "programs": svc.get("SG"),
            "payment": "; ".join(x for x in [svc.get("PAY"), svc.get("PYAS")] if x) or None,
            "license": svc.get("LCA"),
            "ages": svc.get("AGE"),
            "operation": svc.get("FOP"),
        }
        if key not in merged:
            merged[key] = rec
            continue
        # Same facility listed once per service line (e.g. MH and SA): combine them.
        cur = merged[key]
        cur["focus"] = sorted(set(cur["focus"]) | set(rec["focus"]))
        if rec["care_level"] == "Medically supervised":
            cur["care_level"] = rec["care_level"]
        for field, value in rec.items():
            if not cur.get(field) and value:
                cur[field] = value
    yield from merged.values()


CQC_KEEP = (
    "Rehabilitation (substance abuse)",
    "Community services - Substance abuse",
    "Hospitals - Mental health/capacity",
    "Community services - Mental Health",
)


def cqc(path):
    with open(path, encoding="utf-8-sig", newline="") as fh:
        rows = list(csv.reader(fh))
    header_at = next(i for i, r in enumerate(rows) if r and r[0] == "Name")
    header = rows[header_at]
    for raw in rows[header_at + 1:]:
        if len(raw) < len(header):
            continue
        d = dict(zip(header, raw))
        types = d["Service types"].split("|")
        if not any(t in CQC_KEEP for t in types):
            continue
        name = clean(d["Name"])
        if not name or EXCLUDE_NAME.search(name) or "Prison healthcare" in types:
            continue
        spec = d["Specialisms/services"]
        focus = []
        if "Substance misuse problems" in spec or any("Substance abuse" in t for t in types):
            focus.append("Alcohol & substance use")
        if "Mental health conditions" in spec or any("Mental" in t for t in types):
            focus.append("Mental health")
        if "Eating disorders" in spec:
            focus.append("Eating disorders")
        care = "Medically supervised" if any(t.startswith("Hospital") for t in types) else "Clinical program"
        address_parts = [clean(x) for x in d["Address"].split(",")]
        city = address_parts[-1] if address_parts else None
        phone = clean(d["Phone number"])
        if phone and re.fullmatch(r"\d{10}", phone):
            phone = "0" + phone  # CQC drops the leading zero of UK numbers.
        yield {
            "source": "cqc",
            "source_id": d["CQC Location ID (for office use only)"],
            "source_url": d["Location URL"],
            "name": name,
            "operator": clean(d["Provider name"]) if clean(d["Provider name"]) != name else None,
            "country": "United Kingdom",
            "region": "England",
            "city": city,
            "address": ", ".join(x for x in address_parts + [clean(d["Postcode"])] if x),
            "lat": None,
            "lng": None,
            "phone": phone,
            "intake_phone": None,
            "website": website(d["Service's website (if available)"]),
            "care_level": care,
            "focus": focus,
            "setting": [],
            "languages": None,
            "description": None,
            "service_setting": d["Service types"].replace("|", "; "),
            "approaches": None,
            "programs": spec.replace("|", "; ") or None,
            "payment": None,
            "license": "Registered with the Care Quality Commission (CQC)"
            + (f"; last inspected {d['Date of latest check'].split(' - ')[0]}" if d["Date of latest check"] else ""),
            "ages": None,
            "operation": None,
        }


def intl(directory):
    seen = set()
    for path in sorted(glob.glob(os.path.join(directory, "*.json"))):
        with open(path, encoding="utf-8") as fh:
            try:
                items = json.load(fh)
            except json.JSONDecodeError as exc:
                print(f"skip {path}: {exc}", file=sys.stderr)
                continue
        for it in items:
            name = clean(it.get("name"))
            site = website(it.get("website"))
            country = clean(it.get("country"))
            region = clean(it.get("region"))
            if country in UK_NATIONS:  # File Scotland, Wales etc. under the UK, like the CQC listings.
                country, region = "United Kingdom", country
            if not name or not site or not country:
                continue
            # Same website + same name is a duplicate; one operator's separate locations are kept.
            key = re.sub(r"^https?://(www\.)?", "", site.lower()).rstrip("/")
            if (key, name.lower()) in seen:
                continue
            seen.add((key, name.lower()))
            key = key + "|" + re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
            care = clean(it.get("care_level"))
            yield {
                "source": "web",
                "source_id": key,
                "source_url": website(it.get("source_url")) or site,
                "name": name,
                "operator": None,
                "country": country,
                "region": region,
                "city": clean(it.get("city")),
                "address": None,
                "lat": None,
                "lng": None,
                "phone": clean(it.get("phone")),
                "intake_phone": None,
                "website": site,
                "care_level": care if care in CARE_LEVELS else None,
                "focus": [f for f in (it.get("focus") or []) if f in FOCUS],
                "setting": [s for s in (it.get("setting") or []) if s in SETTINGS],
                "languages": clean(it.get("languages")),
                "description": clean(it.get("description")),
                "service_setting": None,
                "approaches": None,
                "programs": None,
                "payment": None,
                "license": None,
                "ages": None,
                "operation": None,
            }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--samhsa")
    ap.add_argument("--cqc")
    ap.add_argument("--intl")
    ap.add_argument("-o", "--out", required=True, help="listings.jsonl (or .jsonl.gz)")
    ap.add_argument("--retrieved", default=datetime.date.today().isoformat(), help="date the sources were downloaded")
    args = ap.parse_args()
    counts = {}
    opener = gzip.open if args.out.endswith(".gz") else open
    with opener(args.out, "wt", encoding="utf-8") as out:
        for name, gen in (("samhsa", samhsa(args.samhsa) if args.samhsa else []),
                          ("cqc", cqc(args.cqc) if args.cqc else []),
                          ("web", intl(args.intl) if args.intl else [])):
            for rec in gen:
                rec["retrieved"] = args.retrieved
                out.write(json.dumps(rec, ensure_ascii=False) + "\n")
                counts[name] = counts.get(name, 0) + 1
    print(json.dumps(counts))


if __name__ == "__main__":
    main()
