# WordPress themes

## mcgrath-chrome

The McGrath Marketing Group theme for mcgrathmarketinggroup.com. Theme docs
(install, what gets created, every Customizer string, where to drop real
photography) live in `mcgrath-chrome/README.txt`.

### Build the installable zip

```bash
cd themes
zip -r mcgrath-chrome.zip mcgrath-chrome -x '*.DS_Store'
```

Then: WordPress admin → Appearance → Themes → Add New → Upload Theme.

### Working on it locally

The theme has no build step — `style.css` and `assets/js/chrome.js` ship as
written. Symlink or copy the folder into `wp-content/themes/` and edit in
place. PHP syntax check before committing:

```bash
for f in mcgrath-chrome/*.php mcgrath-chrome/inc/*.php; do php -l "$f"; done
node --check mcgrath-chrome/assets/js/chrome.js
```
