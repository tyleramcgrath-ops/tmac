// Resolves extensionless relative imports (`await import('./env')`) and the
// app's `@/*` -> `./*` tsconfig path alias to their .ts source. Next's
// bundler does both in the app; plain Node does neither, so the check scripts
// register this hook to exercise the real modules — including real route.ts
// handlers, which import via `@/lib/foundation/...` — unmodified.
import { existsSync } from 'fs'
import { fileURLToPath, pathToFileURL } from 'url'

// apps/north-star-hq/ — the root `@/*` resolves against (tsconfig.json paths).
const APP_ROOT = new URL('../', import.meta.url)

export async function resolve(specifier, context, next) {
  let base = null
  if (specifier.startsWith('@/')) {
    base = fileURLToPath(new URL(specifier.slice(2), APP_ROOT))
  } else if (specifier.startsWith('.') && !/\.(ts|mts|js|mjs|json)$/.test(specifier)) {
    base = fileURLToPath(new URL(specifier, context.parentURL))
  }
  if (base) {
    for (const ext of ['.ts', '.mts']) {
      if (existsSync(base + ext)) return next(pathToFileURL(base + ext).href, context)
    }
  }
  return next(specifier, context)
}
