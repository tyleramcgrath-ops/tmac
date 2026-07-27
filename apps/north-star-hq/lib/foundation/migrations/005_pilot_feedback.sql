-- RC2 P6 — pilot feedback / issue reports.
--
-- Same JSONB-with-projected-key-columns shape as every other entity, so the P7
-- column-map + store conformance contract cover it. Attributed to org + user;
-- captured in-product during the guided pilot. Forward-only + idempotent.
-- (Pilot org status/expiry lives inside rf_orgs.data.pilot — no new table.)

CREATE TABLE IF NOT EXISTS rf_feedback (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES rf_orgs(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS rf_feedback_org_idx ON rf_feedback (org_id, created_at DESC);
