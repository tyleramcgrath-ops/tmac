// One place that knows how to reach Postgres, and how to behave while doing it inside a
// serverless function.
//
// Two settings below are not defaults and are the reason this file exists:
//
//   max: 1        Each invocation is its own process with its own pool. A pool of 10 here means
//                 10 connections per concurrent invocation, which is how a serverless app
//                 exhausts a database it barely uses. One is enough: an invocation handles one
//                 request. Neon's pooled endpoint (-pooler, pgbouncer) does the real multiplexing.
//
//   idleTimeout   Short, so a frozen-then-thawed lambda does not wake holding a connection the
//                 server closed underneath it.
//
// The pool is created lazily and cached on globalThis: Vercel reuses a warm process across
// invocations, and a module-level constant would be rebuilt on every cold start while a cached
// one survives. Connection errors are swallowed at the pool level rather than crashing the
// process — a dropped idle connection is normal and the next query reconnects.
const { Pool } = require('pg');

const KEY = '__citationGapPool';

function pool() {
  if (globalThis[KEY]) return globalThis[KEY];
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const p = new Pool({
    connectionString: url,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    // Neon terminates TLS at the pooler with a cert this trusts by default; keeping
    // rejectUnauthorized on is the point of sslmode=require in the URL.
    ssl: { rejectUnauthorized: true }
  });
  p.on('error', () => {});
  globalThis[KEY] = p;
  return p;
}

async function query(text, params) {
  return pool().query(text, params);
}

// A transaction on a single dedicated connection. Used where a read and the write that depends
// on it must not interleave with another request — redeeming a login token, claiming a job.
async function tx(fn) {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (e2) {}
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { query, tx, pool };
