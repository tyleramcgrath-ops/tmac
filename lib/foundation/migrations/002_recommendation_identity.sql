-- Phase D.6 P1 — stable cross-scan recommendation identity.
--
-- Recommendations used to get a fresh random UUID every scan, so re-scanning
-- silently orphaned the human's triage and reset history. Identity is now a
-- deterministic `issueId` (rule + logical target), stored in the JSONB blob,
-- and re-scans UPSERT onto it. This migration backfills issueId onto any
-- existing rows, collapses the historical duplicates that the old INSERT-only
-- path produced (preserving their history), and adds a uniqueness guard so a
-- project can never hold two rows for the same issue again.
--
-- Forward-only and idempotent (guarded by rf_schema_migrations + IF NOT EXISTS).

-- 1. Backfill a deterministic issueId for legacy rows. Mirrors the engine's
--    identity: page-type-specific schema rules key by title, everything else is
--    site-wide. Rows with no ruleId (pre-P2) fall back to a per-row unique id so
--    nothing collides and no history is lost.
UPDATE rf_recommendations
SET data = jsonb_set(
  data, '{issueId}',
  to_jsonb(
    COALESCE(NULLIF(data->>'ruleId', ''), 'legacy-' || id) || '::' ||
    CASE WHEN data->>'ruleId' IN ('schema-missing', 'breadcrumb', 'faq')
         THEN COALESCE(data->>'title', '') ELSE 'site' END
  ),
  true
)
WHERE data->>'issueId' IS NULL;

-- 2. Fold the history of duplicate rows (same project + issueId) into the
--    newest survivor, so collapsing them loses no recorded triage.
WITH ranked AS (
  SELECT id, project_id, data->>'issueId' AS iid, created_at,
         row_number() OVER (
           PARTITION BY project_id, data->>'issueId'
           ORDER BY created_at DESC, id
         ) AS rn
  FROM rf_recommendations
),
survivor AS (SELECT id, project_id, iid FROM ranked WHERE rn = 1),
losers   AS (SELECT id, project_id, iid FROM ranked WHERE rn > 1),
loser_hist AS (
  SELECT s.id AS sid,
         COALESCE(jsonb_agg(h) FILTER (WHERE h IS NOT NULL), '[]'::jsonb) AS hist
  FROM survivor s
  JOIN losers l ON l.project_id = s.project_id AND l.iid = s.iid
  JOIN rf_recommendations lr ON lr.id = l.id
  LEFT JOIN LATERAL jsonb_array_elements(COALESCE(lr.data->'history', '[]'::jsonb)) h ON true
  GROUP BY s.id
)
UPDATE rf_recommendations r
SET data = jsonb_set(
  r.data, '{history}',
  COALESCE(r.data->'history', '[]'::jsonb) || lh.hist
)
FROM loser_hist lh
WHERE r.id = lh.sid;

-- 3. Delete the now-merged duplicate rows, keeping the newest per issue.
DELETE FROM rf_recommendations
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           row_number() OVER (
             PARTITION BY project_id, data->>'issueId'
             ORDER BY created_at DESC, id
           ) AS rn
    FROM rf_recommendations
  ) t WHERE t.rn > 1
);

-- 4. One row per (project, issue) from here on. Also project rule_id/issue_id
--    for indexed lookups without unpacking the blob.
CREATE UNIQUE INDEX IF NOT EXISTS rf_recs_issue_idx
  ON rf_recommendations (project_id, (data->>'issueId'));
CREATE INDEX IF NOT EXISTS rf_recs_rule_idx
  ON rf_recommendations (project_id, (data->>'ruleId'));
