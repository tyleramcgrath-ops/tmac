#!/usr/bin/env python3
"""Assemble the installable theme: style.css from ../theme.css, the images, and a zip.

    python3 wp-theme/build-theme.py        -> wp-theme/suncoast.zip
"""
import os
import shutil
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
THEME = os.path.join(HERE, 'suncoast')

HEADER = '''/*
Theme Name: Sun Coast
Theme URI: https://suncoastclean.com/
Author: Tyler McGrath
Description: The redesigned Sun Coast Cleaning and Restoration website as a WordPress theme: photo hero, estimate form that emails the owner, service, location and stain-guide pages, a news index, built-in SEO tags and schema, and redirects for the site's old addresses.
Version: 1.0.0
Requires at least: 6.0
Tested up to: 7.1
Requires PHP: 7.4
License: GNU General Public License v2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
Text Domain: suncoast
*/

'''


def build():
    css = open(os.path.join(ROOT, 'theme.css')).read()
    open(os.path.join(THEME, 'style.css'), 'w').write(HEADER + css)
    img_dir = os.path.join(THEME, 'assets', 'img')
    os.makedirs(img_dir, exist_ok=True)
    for name in os.listdir(os.path.join(ROOT, 'img')):
        shutil.copy(os.path.join(ROOT, 'img', name), img_dir)
    for name in ('logo.png', 'logo-mark.png'):
        shutil.copy(os.path.join(ROOT, name), img_dir)
    out = os.path.join(HERE, 'suncoast.zip')
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        for folder, _, files in os.walk(THEME):
            for f in files:
                if f.startswith('.'):
                    continue
                p = os.path.join(folder, f)
                z.write(p, os.path.relpath(p, HERE))
    print(out, os.path.getsize(out) // 1024, 'KB')


if __name__ == '__main__':
    build()
