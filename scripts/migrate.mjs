// Local + production migration command: `pnpm db:migrate`.
// Uses tsx to load the TypeScript runner.
import { migrateCli } from '../lib/foundation/migrate.ts'
await migrateCli()
