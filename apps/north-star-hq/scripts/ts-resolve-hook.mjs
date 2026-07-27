// Resolves extensionless relative imports (`await import('./env')`) to their
// .ts source. Next's bundler does this in the app; plain Node does not, so the
// check scripts register this hook to exercise the real modules unmodified.
import { existsSync } from 'fs'
import { fileURLToPath, pathToFileURL } from 'url'

export async function resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.(ts|mts|js|mjs|json)$/.test(specifier)) {
    const base = fileURLToPath(new URL(specifier, context.parentURL))
    for (const ext of ['.ts', '.mts']) {
      if (existsSync(base + ext)) return next(pathToFileURL(base + ext).href, context)
    }
  }
  return next(specifier, context)
}
