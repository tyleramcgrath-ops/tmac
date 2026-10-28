# tylermcgrath.com

Tyler McGrath's portfolio ("The Studio"): a static Next.js export served by
SiteGround from `public_html`. There's no Node runtime in production.

- `components/Studio.tsx`: the page (doors, room, panels, narration)
- `components/Compass.tsx`: the 3D Compass (three.js via react-three-fiber).
  It eases between states, faces the cursor and points its needle at it.
- `components/OrbitField.tsx`: the glass cards orbiting the Compass (a swipe
  carousel on phones)
- `app/globals.css`: the original stylesheet; `app/immersive.css` adds the
  sensor-light entrance, room depth and the glass cards
- `lib/sound.ts`: all sound, synthesised with Web Audio (room tone, doors,
  light relays, card ticks, chimes, the Compass); `lib/motion.ts`: phone tilt
- `lib/projects.ts`: the website collection (counts on the page follow it)

Run it locally with `npm install && npm run dev`.

## Deploys

`.github/workflows/tylermcgrath-deploy.yml` runs on every push to main that
touches this folder:

1. `npm ci` and `npm run build` here, which must produce `out/`
2. checks that `out/` holds `index.html`, `_next`, `art` and `projects`
3. backs up `public_html` on SiteGround to `~/backups` (keeps the last 10)
4. rsyncs the contents of `out/` straight into `public_html`, not a subfolder
5. clears SiteGround's cache
6. opens both https://tylermcgrath.com/ and https://www.tylermcgrath.com/ in
   Chromium and fails if either serves another build, or if the doors,
   narration, Voice control, four cards, Compass or Selected Work are
   missing. The screenshots are saved as the run's artifact.

Run it by hand from Actions → "tylermcgrath.com deploy". Tick `flush_only`
to just clear the cache and re-check the live site.

## One-time setup

- In SiteGround Site Tools → Devs → SSH Keys Manager, create a key and note
  the host, port and username. Add the repository secrets `SG_SSH_HOST`,
  `SG_SSH_PORT`, `SG_SSH_USER` and `SG_SSH_KEY` (the private key). Add
  `SG_DOC_ROOT` too if the document root isn't
  `www/tylermcgrath.com/public_html`.

To check the live site from any machine with Playwright:
`node scripts/verify-tylermcgrath.cjs [expected build ID]`.
