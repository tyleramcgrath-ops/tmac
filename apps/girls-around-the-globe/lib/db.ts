import "server-only";
import { SCHEMA } from "./schema";
import { seedMembers } from "./seed";

// One query function for both backends: a real Postgres when DATABASE_URL is
// set (production), otherwise PGlite — Postgres compiled to WASM — so local
// development and tests need no database server. PGlite keeps its data in
// .data/pglite between dev restarts.

type Row = Record<string, unknown>;
type Runner = <T = Row>(sql: string, params?: unknown[]) => Promise<T[]>;

// Next bundles pages, route handlers and actions separately, so module state
// isn't shared between them. Keep one connection per process on globalThis —
// two PGlite instances on the same directory would never see each other's
// writes, and two pg pools would double the connection count.
const store = globalThis as typeof globalThis & { __gatgDb?: Promise<Runner> | null };

async function connect(): Promise<Runner> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: url,
      max: 5,
      ssl: /sslmode=require|neon\.tech|supabase/.test(url) ? { rejectUnauthorized: false } : undefined,
    });
    return async (sql, params) => (await pool.query(sql, params as unknown[])).rows;
  }
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_PGLITE) {
    throw new Error("DATABASE_URL is not set. Point it at a Postgres database before running in production.");
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = process.env.PGLITE_DIR ?? ".data/pglite";
  const db = dir === "memory" ? new PGlite() : new PGlite(dir);
  return async <T,>(sql: string, params?: unknown[]) => (await db.query<T>(sql, params)).rows;
}

async function init(): Promise<Runner> {
  const run = await connect();
  for (const statement of SCHEMA) await run(statement);
  await seedMembers(run);
  return run;
}

export async function query<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  store.__gatgDb ??= init().catch((err) => {
    store.__gatgDb = null;
    throw err;
  });
  const run = await store.__gatgDb;
  return run<T>(sql, params);
}

export async function one<T = Row>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export type Query = Runner;
