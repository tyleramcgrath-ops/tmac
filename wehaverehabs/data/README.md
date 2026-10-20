# We Have Rehabs — public listings data

`listings.jsonl.gz` holds real treatment facilities, one JSON object per line, ready for the
theme's importer. Each one is published as an **unclaimed public listing**: a simple page with
only the facts from its source, an attribution line, "contact the facility directly", and a
**Claim this listing** form. No photos, prices or reviews are invented. When a facility claims
its page and you verify it, it becomes a full sanctuary profile.

## Sources

Build of October 2026: **21,842 listings in 65 countries**.

| Source | Coverage | Licence / terms | Listings |
|---|---|---|---|
| [FindTreatment.gov](https://findtreatment.gov/) locator (SAMHSA), `samhsa` | United States | US government work, public domain. Must not imply SAMHSA endorsement (the theme's attribution line says so). | 20,031 |
| [CQC care directory](https://www.cqc.org.uk/about-us/transparency/using-cqc-data), `cqc` | England | Open Government Licence v3.0, attribution shown on each listing | 1,149 |
| Facilities' own public websites, found by web research, `web` (files in `intl/`) | 63 other countries: Canada 102, Australia 68, South Africa 57, India 38, Thailand 36, Bali 27, Spain 26, Switzerland 24, Mexico 20, Ireland 19, Costa Rica 16, … | Facts only (name, place, website, phone, focus, short paraphrased description); each listing links to its source | 662 |

What's kept:

- **SAMHSA:** substance use and mental health facilities. Correctional and detention settings are dropped, since they aren't open to the public. Entries for the same facility at the same address are merged.
- **CQC:** substance misuse rehab and community services, plus mental health hospitals and community services. Prison healthcare is dropped.
- **Web:** each entry was checked against the facility's own live website (no directories or aggregators).
  - Duplicates are matched on website and name, so one operator's separate locations are kept.
  - Scotland, Wales and Northern Ireland are filed under United Kingdom, and Puerto Rico under United States.
  - **Psychedelic programs are left out by default.** That covers ibogaine clinics, ayahuasca and psilocybin retreats: ibogaine carries serious cardiac risk and is illegal in many countries. Pass `--include-psychedelic` to keep them (17 entries in this build).
  - A few cities came from directory listings rather than the facility's site. The research notes flagged them, and claimants can correct them.

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

`intl/` holds the web-researched files used for this build, so `python3 build_listings.py ... --intl intl` reproduces it.

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
