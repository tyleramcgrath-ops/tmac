#!/usr/bin/env bash
# Builds the tree for the rankforge-host branch: RankForge (the Next.js app at the root of this
# repo) on its own, shaped for SiteGround's Node.js hosting the way apps/saysites and
# apps/lawmatchnow are. SiteGround builds from the top of a branch, so the branch holds only the
# app: no apps/, seo-intel/, shorts/ or the repo's reports.
#
#   hosting/rankforge-host.sh OUT_DIR [REF]      (REF defaults to HEAD)
#
# Settings in Site Tools (same as SaySites): Node 22, install `npm install`, build
# `npm run build`, start `npm start`.
set -euo pipefail
OUT="${1:?usage: rankforge-host.sh OUT_DIR [REF]}"
REF="${2:-HEAD}"
ROOT="$(git rev-parse --show-toplevel)"
rm -rf "$OUT" && mkdir -p "$OUT"
git -C "$ROOT" archive "$REF" app ai components lib public scripts/migrate.mjs \
  package.json next.config.ts tsconfig.json postcss.config.mjs components.json eslint.config.mjs \
  instrumentation-client.ts markdown.d.ts .env.example hosting/rankforge | tar -x -C "$OUT"
# The host-only pieces live in hosting/rankforge/ and land at the top of the branch.
cp -R "$OUT/hosting/rankforge/." "$OUT/" && rm -rf "$OUT/hosting"
node - "$OUT" <<'JS'
const fs = require('fs'), path = require('path');
const dir = process.argv[2];
const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
// webpack and one CPU, like LawMatchNow: shared hosting's memory and process limits.
pkg.scripts = { build: 'next build --webpack', start: 'next start', 'db:migrate': pkg.scripts['db:migrate'] };
// Dev and test tooling the server never runs.
for (const d of ['@playwright/test', 'vitest']) delete (pkg.devDependencies || {})[d];
fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
// Types are checked in CI (root build); skip it on the host, and keep the build to one CPU.
const cfg = path.join(dir, 'next.config.ts');
let s = fs.readFileSync(cfg, 'utf8');
s = s.replace('const nextConfig: NextConfig = {', `const nextConfig: NextConfig = {
  // SiteGround Node.js hosting (hosting/rankforge-host.sh): one CPU, no worker threads.
  experimental: { cpus: 1, workerThreads: false },
  typescript: { ignoreBuildErrors: true },`);
fs.writeFileSync(cfg, s);
JS
echo "wrote $OUT"
