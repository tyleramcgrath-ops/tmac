# We Have Rehabs — public listings data

`listings.jsonl.gz` holds real treatment facilities, one JSON object per line, ready for the
theme's importer. Each one is published as an **unclaimed public listing**: a simple page with
only the facts from its source, an attribution line, "contact the facility directly", and a
**Claim this listing** form. No photos, prices or reviews are invented. When a facility claims
its page and you verify it, it becomes a full sanctuary profile.

## Sources

| Source | Coverage | Licence / terms | Records |
|---|---|---|---|
| [FindTreatment.gov](https://findtreatment.gov/) locator (SAMHSA) | United States | US government work, public domain. Must not imply SAMHSA endorsement (the theme's attribution line says so). | `samhsa` |
| [CQC care directory](https://www.cqc.org.uk/about-us/transparency/using-cqc-data) | England | Open Government Licence v3.0, attribution shown on each listing | `cqc` |
| Facilities' own public websites, found by web research | Latin America, Europe, Asia-Pacific, Canada, Africa, Middle East | Facts only (name, place, website, phone, focus); each listing links to its source | `web` |

What's kept:

- **SAMHSA:** substance use and mental health facilities. Correctional and detention settings are dropped, since they aren't open to the public. Entries for the same facility at the same address are merged.
- **CQC:** substance misuse rehab and community services, plus mental health hospitals and community services. Prison healthcare is dropped.
- **Web:** official facility websites only (no directories or aggregators), de-duplicated by domain.

The care level is mapped to the theme's three levels:

- **Medically supervised:** hospital inpatient, detox, or a CQC hospital.
- **Clinical program:** everything else.

Web entries use the level the facility describes.

## Rebuild

```bash
# 1. SAMHSA: all US facilities, 2,000 per page (about 14 pages)
for p in $(seq 1 14); do
  curl -s "https://findtreatment.gov/locator/exportsAsJson/v2?sAddr=%2239.83,-98.58%22&limitType=2&limitValue=9000000&pageSize=2000&page=$p&sort=0" > raw/samhsa/p$p.json
done
# 2. CQC: monthly directory CSV from https://www.cqc.org.uk/about-us/transparency/using-cqc-data
# 3. Web research: JSON arrays in raw/intl/*.json with
#    name, country, region, city, website, phone, care_level, focus[], setting[], languages, description, source_url
python3 build_listings.py --samhsa raw/samhsa --cqc raw/cqc.csv --intl raw/intl -o listings.jsonl.gz
```

`intl/` holds the web-researched files used for this build.

## Import into WordPress

You can import in either of two ways:

- **wp-admin:** go to Tools → Import listings, upload `listings.jsonl.gz`, then click Start import. It runs about 150 listings per step; keep the tab open.
- **WP-CLI:** `wp whr-import listings.jsonl.gz`. It accepts these options:
  - `--source=web|cqc|samhsa` or `--country="Costa Rica"` to import a subset;
  - `--limit` and `--offset`;
  - `--update` to refresh existing unclaimed listings.

Re-running is safe. Matching is on source and ID, and claimed listings are never overwritten.

To take a source back out: `wp whr-import remove --source=samhsa`. This deletes only unclaimed listings.

### Approving a claim

Claims arrive in wp-admin → Inquiries as **Claim request** entries, and are also emailed to the site admin. Each one says whether the person's email domain matches the facility's website.

1. Verify the person, for example by calling the listed phone number.
2. Edit the sanctuary.
3. Tick **Claimed by the facility** and set its **Inquiry email**.
4. Add photos, story and rates.

The page then switches to the full profile with the inquiry form. In the Sanctuaries list, the Listing column and filter show which listings are claimed and which are public.

## Keeping it accurate

Public data goes stale. Rebuild and re-import with `--update` every few months; claimed listings are left alone. Remove a listing at once if a facility asks.
