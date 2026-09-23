// Projects and scans, server side.
//
// One rule runs through every query here: **ownership lives in the WHERE clause.** Never fetch a
// row and then check who owns it — that is two steps, and the second one is the step somebody
// forgets. `WHERE id = $1 AND user_id = $2` cannot be forgotten, cannot race, and returns zero
// rows for "does not exist" and "is not yours" alike, which is also the right thing to tell a
// caller: distinguishing them would confirm that a project id exists.
//
// db is injected so the tests run these exact statements against a real PostgreSQL.
const PLAN_LIMITS = {
  // These two numbers are the pricing page, restated in code. Practice says "up to 10 projects"
  // and Agency says "unlimited sites", so that is exactly what is enforced — a cap the page does
  // not promise would be charging for something and then withholding it, and a promise the code
  // does not keep is the same thing wearing a nicer hat. Change one, change the other.
  practice: 10,
  agency: Infinity
};

// A plan that can hold server-side projects at all. The free tier is the browser-side tool and
// keeps its history in the browser; that is the whole shape of the product.
function canPersist(user) {
  if (!user) return false;
  if (user.plan !== 'practice' && user.plan !== 'agency') return false;
  // past_due keeps working: a card that failed on Tuesday should not delete Wednesday's work.
  // canceled does not — but the read paths below stay open, so history remains readable.
  return user.plan_status === 'active' || user.plan_status === 'past_due';
}

async function listProjects(db, userId) {
  const r = await db.query(
    `SELECT p.id, p.name, p.url, p.keyword, p.gl, p.hl, p.created_at,
            s.rank_score, s.answer_score, s.started_at AS last_scan_at,
            (SELECT count(*) FROM scans x WHERE x.project_id = p.id) AS scan_count
       FROM projects p
       LEFT JOIN LATERAL (
         SELECT rank_score, answer_score, started_at
           FROM scans
          WHERE project_id = p.id AND finished_at IS NOT NULL
          ORDER BY started_at DESC
          LIMIT 1
       ) s ON true
      WHERE p.user_id = $1 AND p.archived_at IS NULL
      ORDER BY p.created_at DESC`,
    [userId]
  );
  return r.rows.map((x) => ({
    id: x.id, name: x.name, url: x.url, keyword: x.keyword, gl: x.gl, hl: x.hl,
    createdAt: x.created_at,
    scans: Number(x.scan_count),
    latest: x.last_scan_at ? { rank: x.rank_score, answer: x.answer_score, at: x.last_scan_at } : null
  }));
}

async function countProjects(db, userId) {
  const r = await db.query(
    'SELECT count(*) AS n FROM projects WHERE user_id = $1 AND archived_at IS NULL', [userId]);
  return Number(r.rows[0].n);
}

async function createProject(db, user, input) {
  const name = String(input.name || '').trim();
  const url = String(input.url || '').trim();
  const keyword = String(input.keyword || '').trim();
  if (!name) return { error: 'A project needs a name.', status: 400 };
  if (!/^https?:\/\//i.test(url)) return { error: 'The page URL needs to start with http:// or https://', status: 400 };
  if (!keyword) return { error: 'A project needs a keyword to track.', status: 400 };

  // Archived projects do not count, which is why the refusal offers archiving as the way out:
  // it is a real way out, not a brush-off.
  const limit = PLAN_LIMITS[user.plan];
  if (limit !== Infinity && (await countProjects(db, user.id)) >= limit) {
    return {
      error: 'That plan covers ' + limit + ' projects. Archive one, or move up to Agency, which is unlimited.',
      status: 409
    };
  }

  const r = await db.query(
    `INSERT INTO projects (user_id, name, url, keyword, gl, hl)
     VALUES ($1, $2, $3, $4, COALESCE($5,'us'), COALESCE($6,'en'))
     RETURNING id, name, url, keyword, gl, hl, created_at`,
    [user.id, name, url, keyword, input.gl || null, input.hl || null]
  );
  const p = r.rows[0];
  return { project: { id: p.id, name: p.name, url: p.url, keyword: p.keyword, gl: p.gl, hl: p.hl, createdAt: p.created_at, scans: 0, latest: null } };
}

// COALESCE keeps an omitted field as it was, so a caller can send one key without having to
// re-send the whole row and accidentally blank the rest.
async function updateProject(db, userId, id, input) {
  if (input.url != null && !/^https?:\/\//i.test(String(input.url))) {
    return { error: 'The page URL needs to start with http:// or https://', status: 400 };
  }
  const r = await db.query(
    `UPDATE projects
        SET name = COALESCE($3, name), url = COALESCE($4, url), keyword = COALESCE($5, keyword),
            gl = COALESCE($6, gl), hl = COALESCE($7, hl)
      WHERE id = $1 AND user_id = $2 AND archived_at IS NULL
      RETURNING id, name, url, keyword, gl, hl, created_at`,
    [id, userId, input.name != null ? String(input.name).trim() || null : null,
     input.url != null ? String(input.url).trim() : null,
     input.keyword != null ? String(input.keyword).trim() || null : null,
     input.gl || null, input.hl || null]
  );
  if (!r.rows.length) return { error: 'No such project.', status: 404 };
  return { project: r.rows[0] };
}

// Archive rather than delete. A customer who tidies up should not lose the score history they
// were paying to accumulate, and the schedule stops either way because the list query filters on
// archived_at.
async function archiveProject(db, userId, id) {
  const r = await db.query(
    `UPDATE projects SET archived_at = now()
      WHERE id = $1 AND user_id = $2 AND archived_at IS NULL
      RETURNING id`,
    [id, userId]
  );
  if (!r.rows.length) return { error: 'No such project.', status: 404 };
  return { ok: true, id: r.rows[0].id };
}

async function listScans(db, userId, projectId, limit) {
  // The join to projects is the ownership check: a project id belonging to someone else matches
  // no row, so it reads as empty rather than as someone else's history.
  const r = await db.query(
    `SELECT s.id, s.started_at, s.finished_at, s.trigger, s.rank_score, s.answer_score,
            s.fingerprint, s.reused_scan_id, s.error
       FROM scans s
       JOIN projects p ON p.id = s.project_id
      WHERE s.project_id = $1 AND p.user_id = $2
      ORDER BY s.started_at DESC
      LIMIT $3`,
    [projectId, userId, Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500)]
  );
  return r.rows.map((x) => ({
    id: x.id, startedAt: x.started_at, finishedAt: x.finished_at, trigger: x.trigger,
    rank: x.rank_score, answer: x.answer_score, fingerprint: x.fingerprint,
    reusedScanId: x.reused_scan_id, error: x.error
  }));
}

async function getScan(db, userId, scanId) {
  const r = await db.query(
    `SELECT s.id, s.project_id, s.started_at, s.finished_at, s.trigger,
            s.rank_score, s.answer_score, s.fingerprint, s.findings, s.error
       FROM scans s JOIN projects p ON p.id = s.project_id
      WHERE s.id = $1 AND p.user_id = $2`,
    [scanId, userId]
  );
  return r.rows[0] || null;
}

// Recording a finished scan. The INSERT ... SELECT is the ownership check again: the row is only
// created when the project belongs to the caller, in the same statement that creates it.
async function recordScan(db, userId, input) {
  const projectId = input.projectId;
  if (!projectId) return { error: 'Which project?', status: 400 };
  const rank = input.rank == null ? null : Number(input.rank);
  const answer = input.answer == null ? null : Number(input.answer);
  for (const [k, v] of [['rank', rank], ['answer', answer]]) {
    if (v != null && (!Number.isFinite(v) || v < 0 || v > 100)) {
      return { error: 'A ' + k + ' score has to be between 0 and 100.', status: 400 };
    }
  }
  const trigger = input.trigger === 'schedule' ? 'schedule' : 'manual';

  let r;
  try {
    r = await db.query(
      `INSERT INTO scans (project_id, trigger, rank_score, answer_score, fingerprint, findings, finished_at)
       SELECT p.id, $2, $3, $4, $5, $6, now()
         FROM projects p
        WHERE p.id = $1 AND p.user_id = $7 AND p.archived_at IS NULL
       RETURNING id, started_at, finished_at, rank_score, answer_score`,
      [projectId, trigger, rank, answer, input.fingerprint || null,
       input.findings == null ? null : JSON.stringify(input.findings), userId]
    );
  } catch (e) {
    // An id that is not a uuid reaches Postgres as a cast error rather than as zero rows; it is
    // still just "no such project" from the caller's point of view.
    if (/invalid input syntax for type uuid/.test(String(e && e.message))) {
      return { error: 'No such project.', status: 404 };
    }
    throw e;
  }
  if (!r.rows.length) return { error: 'No such project.', status: 404 };
  const s = r.rows[0];
  return { scan: { id: s.id, startedAt: s.started_at, finishedAt: s.finished_at, rank: s.rank_score, answer: s.answer_score } };
}

module.exports = {
  PLAN_LIMITS, canPersist,
  listProjects, countProjects, createProject, updateProject, archiveProject,
  listScans, getScan, recordScan
};
