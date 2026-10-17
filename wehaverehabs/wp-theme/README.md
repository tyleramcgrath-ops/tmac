# We Have Rehabs — WordPress theme

Custom theme for wehaverehabs.com: a boutique directory of holistic mental-health and recovery sanctuaries worldwide.

- `wehaverehabs/` — theme source (install docs in `wehaverehabs/readme.txt`).
- `wehaverehabs.zip` — ready to upload in WordPress → Appearance → Themes → Add New → Upload Theme.

Rebuild the zip after changes:

```
cd wehaverehabs/wp-theme && rm -f wehaverehabs.zip && zip -qr wehaverehabs.zip wehaverehabs
```

## Tested

On WordPress 6.8 / PHP 8.3 (SQLite): theme activation, demo import / remove / re-import, homepage,
search with every filter and sort, sanctuary profile, destination guide, region and condition
archives, owners page, journal, 404, inquiry and listing-request forms (including the spam trap),
editor saving of every field type, destination term fields, Customizer, at 1440px and 390px widths.
