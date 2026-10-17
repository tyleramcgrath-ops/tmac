"""Pick a freely licensed landscape photo for every country and region in listings.jsonl.gz
from Wikimedia Commons (Quality images first), and write destination-photos.json for the theme.

    python3 build_destination_photos.py listings.jsonl.gz destination-photos.json
"""
import gzip, json, re, subprocess, sys, time, urllib.parse, html, os

UA = "WeHaveRehabsThemeBuilder/1.0 (https://wehaverehabs.com)"
OK_LICENSES = re.compile(r"^(CC BY(-SA)? [0-9.]+|CC0|Public domain|PD)", re.I)
SKIP_WORDS = re.compile(r"\b(map|flag|logo|coat of arms|seal|diagram|locator|chart|stamp|banknote|coin)\b", re.I)

def api(params):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    for attempt in range(4):
        out = subprocess.run(["curl", "-s", "-m", "40", "-A", UA, url], capture_output=True, text=True).stdout
        try:
            return json.loads(out)
        except ValueError:
            time.sleep(10 * (attempt + 1))
    return {}

def clean(s):
    s = re.sub(r"<[^>]+>", "", html.unescape(s or ""))
    return re.sub(r"\s+", " ", s).strip()[:120]

def find(query, quality=True):
    search = f'{query} {"incategory:Quality_images" if quality else ""}'.strip()
    data = api({"action": "query", "format": "json", "generator": "search", "gsrnamespace": 6, "gsrlimit": 12,
                "gsrsearch": search, "prop": "imageinfo", "iiprop": "url|size|extmetadata|mime", "iiurlwidth": 1600})
    time.sleep(1.2)
    pages = sorted((data.get("query", {}).get("pages", {}) or {}).values(), key=lambda p: p.get("index", 99))
    for p in pages:
        ii = (p.get("imageinfo") or [{}])[0]
        meta = ii.get("extmetadata", {})
        lic = clean(meta.get("LicenseShortName", {}).get("value"))
        if ii.get("mime") != "image/jpeg" or ii.get("width", 0) < 1600 or ii["width"] < ii.get("height", 0) * 1.2:
            continue
        if SKIP_WORDS.search(p["title"]) or not OK_LICENSES.match(lic):
            continue
        return {
            "file": p["title"],
            "url": ii.get("thumburl") or ii["url"],
            "page": ii.get("descriptionurl"),
            "artist": clean(meta.get("Artist", {}).get("value")) or "Unknown",
            "license": lic,
            "license_url": meta.get("LicenseUrl", {}).get("value", ""),
        }
    return None

def main(src, dst):
    places = {}
    for line in gzip.open(src, "rt", encoding="utf-8"):
        r = json.loads(line)
        places.setdefault(r["country"], set())
        if r.get("region") and r["region"] != r["country"]:
            places[r["country"]].add(r["region"])
    out = json.load(open(dst)) if os.path.exists(dst) else {}
    todo = [(c, None) for c in places] + [(c, reg) for c in places for reg in sorted(places[c])]
    for i, (country, region) in enumerate(todo):
        key = country if not region else f"{country}/{region}"
        if key in out:
            continue
        name = country if not region else f"{region} {country}"
        name = re.sub(r"\b(Co\.|District|Province|Region|Community)\b", "", name).strip()
        pick = find(f"{name} landscape") or find(name) or find(f"{name} landscape", quality=False)
        out[key] = pick
        print(f"{i+1}/{len(todo)} {key}: {pick['file'] if pick else '-'}", flush=True)
        if i % 10 == 0:
            json.dump(out, open(dst, "w"), ensure_ascii=False, indent=1)
    json.dump(out, open(dst, "w"), ensure_ascii=False, indent=1)
    print("found", sum(1 for v in out.values() if v), "of", len(out))

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
