// Scans that run while the browser is closed.
//
// A schedule is a row saying "this project, daily at 07:00 UTC" and a next_run_at. Nothing here
// runs a scan: when a schedule falls due it enqueues one through the same lib/tick.js machinery a
// person's own click uses, so a scheduled scan and a watched scan are the same code producing the
// same numbers. That is the whole design — a second scanner that only runs on a timer would drift
// from the first one, and nobody would notice until a customer compared two reports.
//
// The promotion is driven from the tick rather than from its own cron. Vercel's Hobby plan allows
// one cron a day, which is no use for an hourly schedule; the tick already chains itself along,
// so a due schedule is picked up by whichever tick runs next.
// Required at the point of use, not at the top. lib/tick.js requires this file, so requiring it
// back at module scope hands us tick's exports *before* it has assigned them — the binding is an
// empty object and enqueue is undefined. It fails only in the load order production uses (tick
// first), which is exactly the kind of bug a test that imports this file first would hide.
const tickModule = () => require('./tick.js');

const DAY = 86400000;

// When this schedule should next fire, strictly after `from`. Pure, so the awkward cases — a
// daily schedule promoted at exactly its own hour, a weekly one landing on today — are testable
// without a database or a clock.
function nextRun(cadence, hourUtc, dayOfWeek, from) {
  const base = from instanceof Date ? new Date(from.getTime()) : new Date(from || Date.now());
  const at = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), hourUtc, 0, 0, 0));
  if (cadence === 'daily') {
    // Strictly after: a schedule promoted at 07:00:00 goes to tomorrow, not into a loop.
    while (at.getTime() <= base.getTime()) at.setTime(at.getTime() + DAY);
    return at;
  }
  if (cadence === 'weekly') {
    const want = Number(dayOfWeek);
    // Walk forward to the wanted weekday, then past `from` if that landed in the past.
    let delta = (want - at.getUTCDay() + 7) % 7;
    at.setTime(at.getTime() + delta * DAY);
    while (at.getTime() <= base.getTime()) at.setTime(at.getTime() + 7 * DAY);
    return at;
  }
  throw new Error('unknown cadence: ' + cadence);
}

function validate(input) {
  const cadence = input && input.cadence;
  if (cadence !== 'daily' && cadence !== 'weekly') return 'Cadence has to be daily or weekly.';
  const hour = Number(input.hourUtc);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return 'The hour has to be a whole number from 0 to 23, in UTC.';
  if (cadence === 'weekly') {
    const d = Number(input.dayOfWeek);
    // The schema refuses a weekly schedule with no day; catching it here gives a sentence
    // instead of a constraint violation.
    if (!Number.isInteger(d) || d < 0 || d > 6) return 'A weekly schedule needs a day, 0 (Sunday) to 6.';
  }
  return null;
}

// Ownership lives in the WHERE clause, as everywhere else: the INSERT ... SELECT only finds a
// project row when it belongs to the caller, so there is no path here that schedules somebody
// else's site.
async function setSchedule(db, userId, projectId, input) {
  const bad = validate(input);
  if (bad) return { error: bad, status: 400 };
  const cadence = input.cadence;
  const hour = Number(input.hourUtc);
  const day = cadence === 'weekly' ? Number(input.dayOfWeek) : null;
  const next = nextRun(cadence, hour, day, new Date());

  let r;
  try {
    r = await db.query(
      `INSERT INTO schedules (project_id, cadence, day_of_week, hour_utc, enabled, next_run_at)
       SELECT p.id, $2, $3, $4, true, $5
         FROM projects p
        WHERE p.id = $1 AND p.user_id = $6 AND p.archived_at IS NULL
       ON CONFLICT (project_id) DO UPDATE
          SET cadence = EXCLUDED.cadence, day_of_week = EXCLUDED.day_of_week,
              hour_utc = EXCLUDED.hour_utc, enabled = true, next_run_at = EXCLUDED.next_run_at
       RETURNING id, project_id, cadence, day_of_week, hour_utc, enabled, next_run_at`,
      [projectId, cadence, day, hour, next, userId]
    );
  } catch (e) {
    if (/invalid input syntax for type uuid/.test(String(e && e.message))) return { error: 'No such project.', status: 404 };
    throw e;
  }
  if (!r.rows.length) return { error: 'No such project.', status: 404 };
  return { schedule: shape(r.rows[0]) };
}

async function listSchedules(db, userId) {
  const r = await db.query(
    `SELECT s.id, s.project_id, s.cadence, s.day_of_week, s.hour_utc, s.enabled, s.next_run_at,
            p.name, p.url, p.keyword
       FROM schedules s JOIN projects p ON p.id = s.project_id
      WHERE p.user_id = $1 AND p.archived_at IS NULL
      ORDER BY s.next_run_at`,
    [userId]
  );
  return r.rows.map(shape);
}

async function removeSchedule(db, userId, projectId) {
  let r;
  try {
    r = await db.query(
      `DELETE FROM schedules s USING projects p
        WHERE s.project_id = p.id AND p.id = $1 AND p.user_id = $2
       RETURNING s.id`,
      [projectId, userId]
    );
  } catch (e) {
    if (/invalid input syntax for type uuid/.test(String(e && e.message))) return { ok: true, deleted: false };
    throw e;
  }
  return { ok: true, deleted: r.rows.length > 0 };
}

function shape(row) {
  return {
    id: row.id, projectId: row.project_id, cadence: row.cadence,
    dayOfWeek: row.day_of_week, hourUtc: row.hour_utc, enabled: row.enabled,
    nextRunAt: row.next_run_at,
    name: row.name, url: row.url, keyword: row.keyword
  };
}

// --- promotion ------------------------------------------------------------
//
// Claim one due schedule, advance its next_run_at, and queue the scan. The advance happens in the
// same statement that claims it, so two ticks racing cannot both enqueue the same run — the
// second finds nothing due. SKIP LOCKED keeps them from queueing behind each other.
//
// A schedule whose owner has since dropped to a plan that cannot persist is advanced but not
// enqueued: it stays on the books so that re-subscribing resumes it, and it stops consuming
// anything in the meantime.
async function promoteOne(db) {
  const claimed = await db.query(
    `UPDATE schedules s
        SET next_run_at = next_run_at
      WHERE s.id = (
        SELECT id FROM schedules
         WHERE enabled AND next_run_at <= now()
         ORDER BY next_run_at
         LIMIT 1
         FOR UPDATE SKIP LOCKED)
     RETURNING s.id, s.project_id, s.cadence, s.day_of_week, s.hour_utc`,
    []
  );
  if (!claimed.rows.length) return null;
  const s = claimed.rows[0];

  // Advance first. If enqueueing then fails, the schedule has still moved on rather than
  // retrying every tick for the rest of the day.
  const next = nextRun(s.cadence, s.hour_utc, s.day_of_week, new Date());
  await db.query('UPDATE schedules SET next_run_at = $2 WHERE id = $1', [s.id, next]);

  const owner = await db.query(
    `SELECT u.id, u.email, u.plan, u.plan_status
       FROM projects p JOIN users u ON u.id = p.user_id
      WHERE p.id = $1 AND p.archived_at IS NULL`,
    [s.project_id]
  );
  if (!owner.rows.length) return { scheduleId: s.id, skipped: 'the project is gone' };
  const user = owner.rows[0];

  const out = await tickModule().enqueue(db, user, { projectId: s.project_id, trigger: 'schedule' });
  if (out.error) return { scheduleId: s.id, skipped: out.error, nextRunAt: next };
  return { scheduleId: s.id, scanId: out.scan.id, projectId: s.project_id, nextRunAt: next };
}

// Every due schedule this tick is willing to promote. Bounded, because a backlog after an outage
// should be worked through over several ticks rather than queueing hundreds of scans at once on
// somebody's search key.
async function promoteDue(db, limit) {
  const out = [];
  for (let i = 0; i < (limit || 5); i++) {
    const one = await promoteOne(db);
    if (!one) break;
    out.push(one);
  }
  return out;
}

module.exports = { nextRun, validate, setSchedule, listSchedules, removeSchedule, promoteOne, promoteDue };
