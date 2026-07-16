# Project Workspaces: Persistent Memory Architecture

**Status:** Design Document (Future Phase — Post-Production Foundation)  
**Target Implementation:** Phase 11+  
**Priority:** Strategic Foundation for Long-term Product Value  

---

## Table of Contents

1. [Vision & Objectives](#vision--objectives)
2. [Core Concepts](#core-concepts)
3. [Data Model](#data-model)
4. [Architecture](#architecture)
5. [Database Design](#database-design)
6. [API Specification](#api-specification)
7. [Storage Strategy](#storage-strategy)
8. [Timeline & Event Model](#timeline--event-model)
9. [AI Memory Model](#ai-memory-model)
10. [Search & Query System](#search--query-system)
11. [Data Retention & Lifecycle](#data-retention--lifecycle)
12. [Scalability](#scalability)
13. [Integration Points](#integration-points)
14. [Implementation Phases](#implementation-phases)

---

## Vision & Objectives

### Problem Statement
Currently, RankForge executes autonomous operations but doesn't retain comprehensive project history. When a user returns to a project after 6 months, the system has no memory of:
- What crawls were done and their results
- How recommendations evolved
- Which changes were deployed and their impact
- What the team learned
- How competitor landscape changed
- Why decisions were made

This creates a **project amnesia problem** where each session starts fresh, losing institutional knowledge and the ability to answer "why" questions about the project's history.

### Vision
Transform each RankForge project into a **living workspace** — a persistent, searchable record of everything that has ever happened. Every project becomes a time-machine that users can query to understand decisions, track progress, and learn from history.

### Key Objectives
1. **Complete Historical Record** — Every action, data point, and decision is permanently recorded
2. **Contextual Understanding** — Users can understand why changes were made and what impact they had
3. **AI-Augmented Memory** — Forge can reason about project history and answer complex questions
4. **Team Collaboration** — Multiple stakeholders can see the full project context and contribute insights
5. **Trend Analysis** — Track patterns over time (seasonal traffic, conversion improvements, etc.)
6. **Learning & Optimization** — System learns what works and what doesn't for this specific project
7. **Accountability** — Complete audit trail of who did what and when
8. **Competitive Benchmarking** — Track competitor changes alongside own project evolution

---

## Core Concepts

### 1. Project Workspace
A project workspace is a persistent container that holds all data, history, and context for a single SEO project. It serves as the project's "operating system."

```
ProjectWorkspace
├── Core Identity
│   ├── Project ID (immutable)
│   ├── Domain/URL
│   ├── Industry vertical
│   └── Creation timestamp
├── Current State
│   ├── Latest crawl data
│   ├── Latest Search Console data
│   ├── Latest GA4 data
│   └── Current recommendations
├── Historical Record
│   ├── Timeline of events
│   ├── All crawl history
│   ├── All decisions & executions
│   ├── All deployments
│   └── All feedback loops
└── Knowledge & Learning
    ├── Extracted insights
    ├── Pattern detection
    ├── Learned preferences
    └── AI conversational memory
```

### 2. Event-Based Architecture
Everything in a project is an event. Events are the atomic unit of history.

```
Event types:
- CrawlCompleted
- SearchConsoleUpdated
- GA4DataSynced
- DecisionEngineRan
- RecommendationGenerated
- ExecutionInitiated
- ExecutionSucceeded
- ExecutionFailed
- ExecutionRolledBack
- VerificationCompleted
- KnowledgeGraphUpdated
- CompetitorSnapshotTaken
- TrafficMovement
- RankingChange
- UserAction (approved/rejected/commented)
- SystemLearning
- CampaignStarted
- CampaignCompleted
- FileUploaded
- ReportGenerated
- AIConversation
```

### 3. Time-Based Queries
The ability to ask "what was this project like on date X?" and get a complete snapshot.

```
Examples:
- "Project state as of 2024-03-15"
- "Crawl data from 90 days ago"
- "All recommendations from Q3"
- "Traffic snapshot before deployment"
```

### 4. Memory Hierarchy
Different data retention levels based on access patterns and value.

```
L1: Hot Cache (30 days)
  - Last 3 crawls
  - Weekly Search Console syncs
  - Daily GA4 updates
  - All recent recommendations

L2: Warm Storage (1 year)
  - Monthly crawl summaries
  - Weekly Search Console snapshots
  - Weekly GA4 summaries
  - All recommendations
  - All executions

L3: Cold Archive (7+ years)
  - Quarterly crawl data
  - Monthly summaries
  - Annual trend reports
  - Audit trail
```

---

## Data Model

### Core Entities

#### 1. ProjectWorkspace (Already exists, extend)
```sql
CREATE TABLE project_workspaces (
  id UUID PRIMARY KEY,
  
  -- Identity
  domain VARCHAR NOT NULL UNIQUE,
  project_name VARCHAR NOT NULL,
  industry_vertical VARCHAR,
  business_type VARCHAR,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL,
  archived_at TIMESTAMP,
  last_activity_at TIMESTAMP,
  
  -- Configuration
  crawl_schedule JSONB,
  gsc_sync_schedule JSONB,
  ga4_sync_schedule JSONB,
  
  -- Current state pointers
  latest_crawl_id UUID,
  latest_gsc_snapshot_id UUID,
  latest_ga4_snapshot_id UUID,
  latest_kg_snapshot_id UUID,
  
  -- Statistics
  total_events INT DEFAULT 0,
  total_executions INT DEFAULT 0,
  successful_executions INT DEFAULT 0,
  failed_executions INT DEFAULT 0,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  INDEX idx_domain,
  INDEX idx_created_at,
  INDEX idx_last_activity_at
);
```

#### 2. ProjectEvent (New)
```sql
CREATE TABLE project_events (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  
  -- Event classification
  event_type VARCHAR NOT NULL,
  event_category VARCHAR NOT NULL,
  
  -- Timing
  occurred_at TIMESTAMP NOT NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Content
  data JSONB NOT NULL,
  
  -- Context
  triggered_by VARCHAR,
  user_id UUID,
  automation_rule_id UUID,
  
  -- Search/Discovery
  summary TEXT,
  tags TEXT[],
  
  -- Relationships
  related_events UUID[],
  
  FOREIGN KEY (project_id) REFERENCES project_workspaces(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_project_id,
  INDEX idx_event_type,
  INDEX idx_occurred_at,
  INDEX idx_recorded_at,
  INDEX idx_tags
);
```

#### 3. CrawlSnapshot (Replace frequent writes with snapshots)
```sql
CREATE TABLE crawl_snapshots (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  crawl_run_id UUID NOT NULL,
  
  -- Timing
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP NOT NULL,
  
  -- Summary metrics
  total_pages INT,
  indexed_pages INT,
  crawl_errors INT,
  broken_links INT,
  avg_response_time FLOAT,
  
  -- Core Web Vitals aggregates
  lcp_avg FLOAT,
  fid_avg FLOAT,
  cls_avg FLOAT,
  
  -- Storage
  full_data_location VARCHAR,
  compressed_size BIGINT,
  
  -- Diff from previous
  pages_added INT,
  pages_removed INT,
  links_broken_new INT,
  
  -- Tags for search
  tags TEXT[],
  
  FOREIGN KEY (project_id) REFERENCES project_workspaces(id),
  INDEX idx_project_id,
  INDEX idx_completed_at
);
```

#### 4. SearchConsoleSnapshot
```sql
CREATE TABLE search_console_snapshots (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  snapshot_date DATE NOT NULL,
  
  -- Aggregates
  total_clicks BIGINT,
  total_impressions BIGINT,
  avg_position FLOAT,
  avg_ctr FLOAT,
  
  -- Top performers
  top_queries JSONB,
  top_pages JSONB,
  
  -- Changes from previous snapshot
  clicks_delta INT,
  impressions_delta INT,
  position_delta FLOAT,
  
  FOREIGN KEY (project_id) REFERENCES project_workspaces(id),
  INDEX idx_project_id,
  INDEX idx_snapshot_date
);
```

#### 5. GA4Snapshot
```sql
CREATE TABLE ga4_snapshots (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  snapshot_date DATE NOT NULL,
  
  -- Aggregates
  total_users INT,
  total_sessions INT,
  total_conversions INT,
  conversion_rate FLOAT,
  avg_session_duration FLOAT,
  bounce_rate FLOAT,
  
  -- Top performers
  top_pages JSONB,
  top_traffic_sources JSONB,
  
  -- Changes
  users_delta INT,
  conversions_delta INT,
  
  FOREIGN KEY (project_id) REFERENCES project_workspaces(id),
  INDEX idx_project_id,
  INDEX idx_snapshot_date
);
```

#### 6. DecisionRecord (Audit trail for Operator decisions)
```sql
CREATE TABLE decision_records (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  
  -- The decision
  decision_id UUID NOT NULL,
  decision_type VARCHAR,
  recommended_action TEXT,
  
  -- Decision context
  business_objectives JSONB,
  candidate_actions JSONB,
  
  -- Scoring
  decision_confidence FLOAT,
  expected_impact JSONB,
  estimated_effort JSONB,
  
  -- Outcome
  approved BOOLEAN,
  approved_by UUID,
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  
  -- Execution
  executed_at TIMESTAMP,
  execution_result JSONB,
  actual_impact JSONB,
  
  created_at TIMESTAMP NOT NULL,
  
  FOREIGN KEY (project_id) REFERENCES project_workspaces(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  INDEX idx_project_id,
  INDEX idx_created_at,
  INDEX idx_approved_at
);
```

#### 7. ExecutionRecord (Detailed execution history)
```sql
CREATE TABLE execution_records (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  
  -- Execution details
  execution_type VARCHAR,
  target_page VARCHAR,
  change_description TEXT,
  
  -- Deployment
  deployed_at TIMESTAMP,
  deployed_by VARCHAR,
  deployment_method VARCHAR,
  
  -- Verification
  verification_checks JSONB,
  verification_passed BOOLEAN,
  verification_passed_at TIMESTAMP,
  verification_errors JSONB,
  
  -- Impact
  tracked_metrics JSONB,
  pre_deployment_metrics JSONB,
  post_deployment_metrics JSONB,
  measured_impact JSONB,
  
  -- Rollback (if applicable)
  rolled_back BOOLEAN,
  rolled_back_at TIMESTAMP,
  rollback_reason TEXT,
  
  -- Feedback
  user_notes TEXT,
  learning_extracted JSONB,
  
  created_at TIMESTAMP NOT NULL,
  
  FOREIGN KEY (project_id) REFERENCES project_workspaces(id),
  INDEX idx_project_id,
  INDEX idx_deployed_at,
  INDEX idx_rolled_back
);
```

#### 8. ProjectMemory (AI/ML learning from project)
```sql
CREATE TABLE project_memory (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  
  -- Memory type
  memory_type VARCHAR,
  memory_category VARCHAR,
  
  -- The insight
  insight_text TEXT,
  confidence_score FLOAT,
  
  -- Supporting evidence
  supporting_events UUID[],
  extracted_from_event_id UUID,
  
  -- Applicability
  applies_to_pages TEXT[],
  applies_to_keywords TEXT[],
  
  -- Learning parameters
  learned_at TIMESTAMP NOT NULL,
  validated BOOLEAN,
  validation_count INT DEFAULT 0,
  
  -- Decay
  created_at TIMESTAMP NOT NULL,
  last_used_at TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES project_workspaces(id),
  FOREIGN KEY (extracted_from_event_id) REFERENCES project_events(id),
  INDEX idx_project_id,
  INDEX idx_memory_type,
  INDEX idx_validated
);
```

#### 9. CompetitorSnapshot (Historical competitor analysis)
```sql
CREATE TABLE competitor_snapshots (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  competitor_domain VARCHAR NOT NULL,
  
  snapshot_date DATE NOT NULL,
  
  -- Content
  indexed_pages INT,
  backlinks INT,
  referring_domains INT,
  
  -- Rankings
  top_rankings JSONB,
  traffic_estimate INT,
  
  -- Changes from previous
  pages_added INT,
  pages_removed INT,
  new_backlinks INT,
  
  FOREIGN KEY (project_id) REFERENCES project_workspaces(id),
  INDEX idx_project_id,
  INDEX idx_competitor_domain,
  INDEX idx_snapshot_date
);
```

#### 10. ProjectReport (Generated reports and snapshots)
```sql
CREATE TABLE project_reports (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  
  -- Report info
  report_type VARCHAR,
  report_name VARCHAR,
  generated_at TIMESTAMP NOT NULL,
  
  -- Content
  summary TEXT,
  key_findings JSONB,
  recommendations JSONB,
  
  -- Period covered
  period_start DATE,
  period_end DATE,
  
  -- Storage
  report_location VARCHAR,
  data_snapshot_id UUID,
  
  FOREIGN KEY (project_id) REFERENCES project_workspaces(id),
  INDEX idx_project_id,
  INDEX idx_generated_at
);
```

---

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
│  (Project Dashboard / Timeline View / Memory Browser)        │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    API Layer                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Timeline API │ │  Memory API   │ │  Search API  │        │
│  │ (query by    │ │ (ask Forge    │ │ (find events │        │
│  │  date range) │ │  questions)   │ │   & records) │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Event Processing & Ingestion                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Event Router: Normalize incoming data to events     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Event Store: Immutable append-only log of all events│   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
┌───▼───┐      ┌─────▼──────┐  ┌────▼────┐
│Hot    │      │Warm        │  │Cold     │
│Cache  │      │Storage     │  │Archive  │
│(30d)  │      │(1yr)       │  │(7yr+)   │
└───────┘      └────────────┘  └─────────┘
```

### Data Flow

```
External Data → Event Router → Event Store → Snapshots → AI Memory
   ↓                              ↓              ↓
- Crawl data      - Normalize    - Immutable   - Aggregate
- GSC data        - Deduplicate  - Timestamped - Compress
- GA4 data        - Enrich       - Searchable  - Learn
- Executions
- Deployments
```

### Event Processing Pipeline

```
1. EVENT CAPTURE
   Source: Crawl service, GSC sync, GA4 connector, Operator, Execution
   ↓
2. EVENT NORMALIZATION
   Convert to standard event format
   ↓
3. EVENT ENRICHMENT
   Add context: related events, user info, tags
   ↓
4. EVENT STORAGE
   Write to immutable event log
   ↓
5. SNAPSHOT GENERATION
   Aggregate events into snapshots (weekly, monthly)
   ↓
6. ARCHIVAL
   Move old snapshots to cold storage
   ↓
7. AI LEARNING
   Extract patterns and insights
```

---

## Database Design

### Schema Philosophy

1. **Event Sourcing** — Store events, not just current state
2. **Immutability** — Events never change, only accumulate
3. **Time-Series Optimization** — Index by date for fast historical queries
4. **Tiered Storage** — Hot/warm/cold based on age
5. **Compression** — Large raw data compressed, summaries denormalized

### Key Indexes

```sql
-- Event queries by time
CREATE INDEX idx_events_project_time 
  ON project_events(project_id, occurred_at DESC);

-- Event type queries
CREATE INDEX idx_events_type_time 
  ON project_events(event_type, occurred_at DESC);

-- Full-text search on event data
CREATE INDEX idx_events_summary_search 
  ON project_events USING GIN(summary);

-- Tag-based queries
CREATE INDEX idx_events_tags 
  ON project_events USING GIN(tags);

-- Crawl history by date
CREATE INDEX idx_crawl_project_date 
  ON crawl_snapshots(project_id, completed_at DESC);

-- Execution impact analysis
CREATE INDEX idx_executions_metrics 
  ON execution_records(project_id, deployed_at DESC, rolled_back);

-- Decision outcome tracking
CREATE INDEX idx_decisions_outcome 
  ON decision_records(project_id, created_at DESC, approved);

-- Memory validation
CREATE INDEX idx_memory_confidence 
  ON project_memory(project_id, validated, confidence_score DESC);
```

### Partitioning Strategy

```sql
-- Partition events by month for better performance
CREATE TABLE project_events_2024_01 PARTITION OF project_events
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE project_events_2024_02 PARTITION OF project_events
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Crawl snapshots partitioned by year
CREATE TABLE crawl_snapshots_2024 PARTITION OF crawl_snapshots
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

---

## API Specification

### 1. Timeline API

```typescript
// Get project state at specific point in time
GET /api/projects/:projectId/timeline/:date
Response: {
  timestamp: "2024-03-15T00:00:00Z",
  crawl_data: {...},
  gsc_data: {...},
  ga4_data: {...},
  recommendations: [...],
  executions: [...],
  traffic_snapshot: {...}
}

// Get events within date range
GET /api/projects/:projectId/events/range
Query params: from_date, to_date, event_type, limit
Response: {
  events: [
    {
      id: "uuid",
      occurred_at: "2024-03-15T14:30:00Z",
      event_type: "CrawlCompleted",
      data: {...},
      summary: "Found 150 new pages"
    }
  ],
  total_count: 5000,
  has_more: true
}

// Get comparison between two time periods
GET /api/projects/:projectId/comparison
Query params: period1_start, period1_end, period2_start, period2_end
Response: {
  traffic_change: "+12%",
  rankings_improved: 45,
  rankings_declined: 12,
  new_crawl_errors: 3,
  pages_added: 28,
  recommendations_acted_on: 15
}
```

### 2. Memory API (Forge Knowledge)

```typescript
// Ask Forge a question about project history
POST /api/projects/:projectId/memory/ask
Body: {
  question: "Why did traffic increase in March?",
  context_window: "90days"
}
Response: {
  answer: "...",
  confidence: 0.87,
  supporting_evidence: [
    {
      event_id: "uuid",
      date: "2024-03-10",
      impact: "Added 12 new high-value pages"
    }
  ],
  related_learnings: [...]
}

// What changed since my last visit?
GET /api/projects/:projectId/memory/changes-since
Query params: since_date
Response: {
  summary: "15 new crawl errors, 42 new backlinks, 3 deployments",
  major_events: [...],
  traffic_impact: "+3%",
  ranking_impact: "45 up, 12 down"
}

// Get project's learned insights
GET /api/projects/:projectId/memory/insights
Query params: category, validated_only
Response: {
  insights: [
    {
      insight: "Meta descriptions under 120 chars perform better on mobile",
      confidence: 0.92,
      validation_count: 8,
      applies_to: ["pages/*"]
    }
  ]
}

// Get execution impact analysis
GET /api/projects/:projectId/memory/execution-impact/:executionId
Response: {
  deployment: {...},
  pre_metrics: {...},
  post_metrics: {...},
  measured_impact: {
    traffic: "+2.4%",
    rankings: "+8 avg position",
    conversions: "+1.2%"
  },
  confidence: 0.78,
  related_factors: [...]
}
```

### 3. Search API

```typescript
// Full-text search across project history
GET /api/projects/:projectId/search
Query params: q, event_type, date_from, date_to, limit
Response: {
  results: [
    {
      event_id: "uuid",
      occurred_at: "2024-03-15T14:30:00Z",
      event_type: "ExecutionCompleted",
      relevance_score: 0.95,
      snippet: "...relevant excerpt..."
    }
  ],
  total_results: 342,
  facets: {
    event_types: {...},
    date_distribution: {...}
  }
}

// Tag-based search
GET /api/projects/:projectId/tags/:tag
Query params: limit, date_from, date_to
Response: {
  tag: "meta-description",
  matching_events: [...],
  total_count: 47
}

// Trend search (find patterns)
GET /api/projects/:projectId/trends
Query params: metric, period, min_occurrences
Response: {
  trend: "Page speed improvements correlate with ranking gains",
  occurrences: 23,
  confidence: 0.88,
  supporting_events: [...]
}
```

### 4. Snapshot API

```typescript
// Get historical snapshot of crawl data
GET /api/projects/:projectId/snapshots/crawl/:snapshotId
Response: {
  snapshot_id: "uuid",
  timestamp: "2024-03-15T00:00:00Z",
  total_pages: 1250,
  indexed_pages: 1187,
  crawl_errors: 8,
  broken_links: 47,
  top_pages: [...],
  cwv_metrics: {...}
}

// List all snapshots of a type
GET /api/projects/:projectId/snapshots/crawl
Query params: limit, offset, date_from, date_to
Response: {
  snapshots: [...],
  total_count: 156
}

// Compare two snapshots
GET /api/projects/:projectId/snapshots/compare
Query params: snapshot1_id, snapshot2_id
Response: {
  pages_added: 28,
  pages_removed: 3,
  crawl_errors_delta: +2,
  broken_links_delta: -5,
  changes: {...}
}
```

---

## Storage Strategy

### Data Storage Hierarchy

```
HOT (Last 30 days)
├── Full event records
├── Complete crawl data
├── Hourly GA4 updates
├── Daily GSC updates
├── All recent executions
└── Live search indexes
   └── Storage: SSD (PostgreSQL)
   └── Retention: 30 days
   └── Cost per GB: $$$

WARM (31 days - 1 year)
├── Weekly crawl summaries
├── Weekly GSC snapshots
├── Weekly GA4 summaries
├── Monthly reports
├── Compressed events (gzip)
├── Deduplicated data
└── Searchable snapshots
   └── Storage: SSD/HDD (PostgreSQL + S3)
   └── Retention: 1 year
   └── Cost per GB: $$

COLD (1 year - 7 years)
├── Quarterly summaries
├── Annual reports
├── Audit trail (compressed)
├── Immutable event archive
├── Historical rankings
└── Learning summaries
   └── Storage: Cold storage (S3 Glacier)
   └── Retention: 7 years
   └── Cost per GB: $
```

### Storage Optimization

```
Raw Data Compression:
  Crawl data: 2.3MB → 180KB (gzipped)
  GSC data: 1.4MB → 145KB (gzipped)
  GA4 data: 980KB → 98KB (gzipped)

Deduplication:
  Event de-duplication: -34% storage
  Identical crawl pages: -12% storage
  Repeated metrics: -8% storage

Aggregation:
  Full crawl → Monthly snapshot: 50KB
  Daily events → Weekly summary: 15KB
  Raw metrics → Trend data: 2KB
```

### Storage Cost Estimation (1000 active projects)

```
Annual Storage Costs:

Per project per year:
  Hot (30 days): 450 MB × $0.023/GB = $0.01
  Warm (1 year): 2.8 GB × $0.015/GB = $0.04
  Cold (7 years): 8.2 GB × $0.004/GB = $0.03
  
  Total per project: ~$0.08/year

For 1000 projects:
  Total: ~$80/year database storage (highly scalable)
  
Additional costs:
  Search index (Elasticsearch): +$200/month for 1000 projects
  Archive storage (S3 Glacier): +$1000/year
  
  Total monthly: ~$220 for 1000 projects = $0.22/project
```

---

## Timeline & Event Model

### Event Types & Hierarchy

```
ROOT_EVENTS (Triggered by external source)
├── DataSyncEvent
│   ├── CrawlCompleted
│   ├── SearchConsoleDataReceived
│   ├── GA4DataReceived
│   ├── CompetitorSnapshotCaptured
│   └── KnowledgeGraphUpdated
├── ExecutionEvent
│   ├── ExecutionInitiated
│   ├── ExecutionDeployed
│   ├── VerificationStarted
│   ├── VerificationCompleted
│   ├── ExecutionRolledBack
│   └── ExecutionFailed
├── DecisionEvent
│   ├── DecisionEngineRan
│   ├── RecommendationGenerated
│   ├── RecommendationApproved
│   └── RecommendationRejected
├── OperatorEvent
│   ├── OperatorEvaluated
│   ├── MissionSelected
│   └── CandidateShortlisted
├── UserActionEvent
│   ├── UserApprovedExecution
│   ├── UserRejectedExecution
│   ├── UserLeftComment
│   ├── UserFileUploaded
│   └── UserReportGenerated
└── SystemLearningEvent
    ├── PatternDetected
    ├── InsightExtracted
    ├── PreferenceUpdated
    └── PredictionConfirmed

DERIVED_EVENTS (Calculated from root events)
├── TrafficMovement
│   ├── TrafficIncreased
│   ├── TrafficDecreased
│   └── AnomalyDetected
├── RankingMovement
│   ├── RankingImproved
│   ├── RankingDeclined
│   └── VolatilityDetected
├── CompetitorMovement
│   ├── CompetitorGainedRankings
│   ├── CompetitorLostRankings
│   └── CompetitorLostPages
└── ImpactCorrelation
    ├── ExecutionImpactPositive
    ├── ExecutionImpactNeutral
    ├── ExecutionImpactNegative
    └── ChangeAttributedToExecution
```

### Event Timeline Visualization

```
Timeline View:
  
  2024-03-15 ├─ Crawl completed
             │  └─ 1,250 pages (↑28 from last crawl)
             │
  2024-03-14 ├─ Meta description optimization deployed
             │  └─ Target: 542 pages
             │
  2024-03-13 ├─ Traffic spike detected: +8.3%
             │  └─ Source analysis initiated
             │
  2024-03-12 ├─ GSC data updated
             │  └─ Clicks: 12,450 (+2.1%)
             │
  2024-03-11 ├─ Competitor snapshot captured
             │  └─ Semrush gained 34 rankings
             │
  2024-03-10 ├─ Execution failed: Schema markup on /products
             │  └─ Rolled back after verification error
             │
  2024-03-08 ├─ New recommendation: Add FAQ schema
             │  └─ Priority #2, Business Value: 8.2
             │
  2024-03-05 ├─ Operator selected: Title optimization mission
             │  └─ Confidence: 92%, Impact: +34% traffic
             │
  2024-03-01 ├─ Monthly report generated
             │  └─ Traffic: +3.2%, Rankings: +12 avg
```

### Time-Based Queries

```
SQL examples:

-- Get all events in a date range
SELECT * FROM project_events 
WHERE project_id = $1 
  AND occurred_at BETWEEN $2 AND $3
ORDER BY occurred_at DESC;

-- Find events related to a specific page
SELECT * FROM project_events 
WHERE project_id = $1 
  AND data->>'page' = '/services/litigation'
  AND event_type IN ('ExecutionDeployed', 'TrafficMovement')
ORDER BY occurred_at DESC;

-- Find all executions and their subsequent impact
SELECT 
  e.id, e.deployed_at, 
  traffic.occurred_at as traffic_change_at,
  traffic.data
FROM execution_records e
LEFT JOIN project_events traffic 
  ON traffic.project_id = e.project_id
  AND traffic.event_type = 'TrafficMovement'
  AND traffic.occurred_at BETWEEN e.deployed_at 
                           AND e.deployed_at + INTERVAL '7 days'
WHERE e.project_id = $1
ORDER BY e.deployed_at DESC;

-- Compare project state across time
SELECT 
  DATE(snapshot_date),
  total_clicks,
  total_impressions,
  avg_position,
  LAG(total_clicks) OVER (ORDER BY snapshot_date) as prev_clicks,
  total_clicks - LAG(total_clicks) OVER (ORDER BY snapshot_date) as clicks_delta
FROM search_console_snapshots
WHERE project_id = $1
  AND snapshot_date BETWEEN $2 AND $3
ORDER BY snapshot_date;
```

---

## AI Memory Model

### Learning Extraction

The system continuously learns from project history and extracts learnings that improve future recommendations.

```
Learning Pipeline:

1. EXECUTION OUTCOME ANALYSIS
   Every deployment is analyzed:
   - Pre-deployment metrics
   - Post-deployment metrics
   - Attribution analysis (what caused the change)
   - Confidence scoring
   
   Example learning:
   "Meta descriptions under 120 chars correlate with 
    +3.2% avg CTR improvement when deployed to landing pages"

2. PATTERN DETECTION
   System identifies recurring patterns:
   - Seasonal traffic patterns
   - Ranking improvement patterns
   - Content that performs better
   - Optimization techniques that work
   
   Example learning:
   "Blog content on Q1 topics gets 2.4x more traffic
    than Q2 content; recommend scheduling similar
    content in future Q1 seasons"

3. DECISION OUTCOME TRACKING
   Track which recommendations worked vs didn't work:
   - Recommendation quality vs implementation
   - Outcome vs initial predictions
   - User acceptance patterns
   
   Example learning:
   "Recommendations with 8.5+ business value and
    deployment effort < 4 hours have 78% success rate"

4. COMPETITOR LEARNING
   Extract insights from competitor movements:
   - What tactics competitors use
   - How they gained rankings
   - Industry best practices
   
   Example learning:
   "Competitors in legal vertical average 240 words
    per page; our pages average 180 words. Adding
    content could improve authority"

5. FORGETTING & DECAY
   Learning confidence decays over time:
   - Use validation_count to track confidence
   - Decrease confidence if contradicted
   - Archive old learnings after 2 years
   
   Example:
   "Meta tag optimization helps rankings: confidence 92%,
    validated 8 times, last used 2 months ago"
```

### Memory Storage

```
ProjectMemory attributes:
  - insight_text: "Meta descriptions < 120 chars..."
  - memory_type: "execution_outcome"
  - memory_category: "content_optimization"
  - confidence_score: 0.92
  - validation_count: 8
  - supporting_events: [event_id_1, event_id_2, ...]
  - applies_to_pages: ["pages/*/"]
  - applies_to_keywords: ["branded", "navigational"]
  - learned_at: "2024-02-15T14:30:00Z"
  - validated: true
  - last_used_at: "2024-03-15T10:20:00Z"
```

### AI Conversation Memory

Every conversation with Forge about a project is stored and influences future interactions.

```
ConversationMemory:
  - conversation_id: UUID
  - project_id: UUID
  - timestamp: ISO 8601
  - user_query: "Why did rankings drop in March?"
  - forge_response: "..."
  - user_feedback: "helpful", "partially_helpful", "not_helpful"
  - extracted_context: {...}
  - relevance_score: 0.87

Benefits:
  - Forge learns what users care about
  - Responses become more contextual
  - Can identify misunderstandings
  - Build conversation history for team onboarding
```

### Predictive Learning

```
The system builds predictive models from history:

Traffic Prediction:
  - Seasonal patterns
  - Growth trajectory
  - Traffic cliff detection
  
Ranking Prediction:
  - What optimizations improve rankings
  - Expected timeline for improvements
  - Confidence in predictions

Content Performance:
  - Page length impact
  - Topic relevance
  - Format effectiveness
  
Deployment Risk:
  - Success probability
  - Potential for failure
  - Rollback likelihood
```

---

## Search & Query System

### Full-Text Search

```
Implementation: Elasticsearch

Index structure:
{
  "event_id": "uuid",
  "project_id": "uuid",
  "occurred_at": "timestamp",
  "event_type": "string",
  "summary": "text (analyzed)",
  "tags": ["tag1", "tag2"],
  "data": "object (nested)",
  "user_id": "uuid",
  "execution_id": "uuid"
}

Query examples:

-- Search for all title tag optimizations
GET /_search
{
  "query": {
    "multi_match": {
      "query": "title tag optimization",
      "fields": ["summary", "data"]
    }
  }
}

-- Find executions with negative impact
GET /_search
{
  "query": {
    "bool": {
      "must": [
        { "term": { "event_type": "ExecutionCompleted" } },
        { "range": { "data.measured_impact.traffic": { "lt": 0 } } }
      ]
    }
  }
}

-- Timeline aggregation
GET /_search
{
  "aggs": {
    "timeline": {
      "date_histogram": {
        "field": "occurred_at",
        "interval": "week"
      }
    }
  }
}
```

### Tag-Based Discovery

```
Automatic tagging of events:

Tags assigned based on content:
- event_type: "CrawlCompleted"
- page_target: "/products/*"
- optimization_type: "meta_description"
- business_impact: "high"
- execution_status: "successful"
- user_action: "approved"
- season: "Q1"
- year: "2024"
- month: "March"

Tag search example:
GET /api/projects/:projectId/tags/
  ?tags=["meta_description", "2024", "approved"]
  &operator=AND

Response: All executions with meta description 
optimizations in 2024 that were approved
```

### Trend Detection

```
Elasticsearch aggregations for trends:

-- Find correlated events
GET /_search
{
  "aggs": {
    "executions": {
      "filter": { "term": { "event_type": "ExecutionDeployed" } },
      "aggs": {
        "traffic_changes": {
          "filter": { 
            "term": { "event_type": "TrafficMovement" } 
          }
        }
      }
    }
  }
}

-- Detect anomalies
Anomaly detection on metrics:
- Traffic sudden changes > 20%
- Rankings changes > 5 positions for 10+ keywords
- Crawl error spikes
- Core Web Vitals degradation

-- Performance trends
Identify improving/declining metrics over time:
- Traffic trajectory
- Ranking trajectory
- Conversion trajectory
```

---

## Data Retention & Lifecycle

### Retention Policy

```
Hot (0-30 days)
├── All raw data preserved
├── Full detail retention
└── Cost: Premium (SSD)

Warm (31-365 days)
├── Compressed data
├── Deduplicated
├── Summarized (weekly aggregates)
└── Cost: Standard (HDD)

Cold (1-7 years)
├── Quarterly summaries only
├── Audit trail compressed
├── Derived data only
└── Cost: Minimal (Glacier)

Archive (7+ years)
├── Legal/compliance only
├── Read access rare
└── Cost: Minimal + retrieval fee
```

### Archival Process

```
Automated archival schedule:

Every Sunday:
  - Compress events older than 31 days
  - Create weekly summary snapshots
  - Deduplicate identical crawl pages

Every month:
  - Move warm data (31+ days) to compressed archive
  - Create monthly summary reports
  - Update trend calculations

Every quarter:
  - Create quarterly summaries
  - Move to cold storage (Glacier)
  - Consolidate related events

Every year:
  - Create annual summary
  - Move previous year data to 7-year archive
  - Purge data older than 7 years (optional)
```

### Compliance & GDPR

```
Data Deletion:
- User deletion: Remove user_id references (anonymize)
- Project deletion: 30-day retention, then purge
- Conversation deletion: Remove conversation text, keep metadata
- File deletion: Immediate purge of non-critical files

Data Export:
- User can request full project data export
- Format: JSON/CSV with all events and snapshots
- Timeline: Available within 30 days
- Format: Portable, includes metadata

Anonymization:
- Remove user names, emails from events
- Keep user_id for audit trail
- Redact sensitive data (API keys, credentials)
```

---

## Scalability

### Growth Projections

```
Events per active project per month:

Scenario: Mid-sized project (10k/month visits)
- Daily crawl: 1 event
- Daily GSC sync: 1 event
- Daily GA4 sync: 1 event
- Executions: 2-3 events/week
- User actions: 1-2 events/week
- System learnings: 2-4 events/week

Total: ~30 events/month per project

For 1,000 active projects:
  30,000 events/month
  = 360,000 events/year
  = 100 events/day

For 10,000 active projects:
  300,000 events/month
  = 3.6M events/year
  = 1,000 events/day

For 100,000 active projects (scale target):
  3M events/month
  = 36M events/year
  = 10,000 events/day
```

### Database Scaling

```
PostgreSQL Partitioning:

Current (< 10M events):
  Single database
  Partitioned by month
  
Scaling to 100M+ events:
  Time partitioning by month
  Shard by project_id % 10 (10 shards)
  Read replicas for search queries
  
Elasticsearch:
  100M+ documents in indexes
  Daily index rolling
  Index per month for easy archival
  
  Shards: 5 primary, 1 replica per index
  Retention: Keep 2-3 rolling indexes hot
```

### Query Performance

```
Target query performance:

Timeline query (get events between dates):
  - Query: SELECT * FROM events WHERE project_id = X AND date BETWEEN Y AND Z
  - Target: < 100ms
  - Implementation: Clustered index on (project_id, date)

Full-text search (Elasticsearch):
  - Query: "title tag optimization"
  - Target: < 200ms
  - Implementation: Elasticsearch with daily rolling indexes

Snapshot retrieval:
  - Query: Get crawl snapshot from 3 months ago
  - Target: < 50ms (hot), < 500ms (warm), < 2s (cold)
  - Implementation: Tiered storage with caching

Memory/learning retrieval:
  - Query: Get applicable learnings for project
  - Target: < 50ms
  - Implementation: Denormalized cache table
```

### Caching Strategy

```
Redis Cache:
  Layer 1: Recent events (24h) - 100% cache hit
  Layer 2: Recent snapshots (30d) - ~80% cache hit
  Layer 3: Trending insights - ~60% cache hit
  
  Cache invalidation:
  - Events: TTL 24 hours
  - Snapshots: TTL 7 days
  - Insights: TTL 1 hour (invalidated on new event)
  - Memory: TTL 4 hours
  
  Cache size: ~2GB per 1,000 projects
```

---

## Integration Points

### Integration with Existing Systems

```
Crawl Service → Event: CrawlCompleted
  └─ Triggers: Snapshot creation, anomaly detection

GSC Service → Event: SearchConsoleDataReceived
  └─ Triggers: Traffic analysis, seasonal detection

GA4 Service → Event: GA4DataReceived
  └─ Triggers: Conversion tracking, journey analysis

Operator Service → Events: OperatorEvaluated, MissionSelected
  └─ Triggers: Memory recording, decision audit

Execution Service → Events: ExecutionDeployed, ExecutionFailed, VerificationCompleted
  └─ Triggers: Impact measurement, learning extraction

Forge → Events: AIConversation, UserQuestion
  └─ Triggers: Conversation memory recording, context building

Users → Events: UserApprovedExecution, UserLeftComment
  └─ Triggers: Preference learning, feedback recording
```

### New Services Required

```
1. Event Router
   - Receives all events from multiple sources
   - Normalizes to standard format
   - Routes to appropriate handlers
   - Ensures exactly-once delivery
   
2. Event Store
   - Immutable append-only log
   - High-throughput write capacity
   - Full-text indexing
   - Event replay capability

3. Snapshot Service
   - Creates periodic snapshots
   - Compresses old data
   - Manages retention policies
   - Generates reports

4. Memory Service
   - Extracts learnings from events
   - Manages confidence scores
   - Tracks validation
   - Provides learning APIs

5. Search Service
   - Full-text search via Elasticsearch
   - Tag-based filtering
   - Trend detection
   - Anomaly detection

6. Timeline Service
   - Reconstructs project state at any point in time
   - Compares periods
   - Generates historical reports
   - Enables "time travel" queries

7. Archive Service
   - Manages tiered storage
   - Moves data to cold storage
   - Handles retention policies
   - Manages compliance
```

---

## Implementation Phases

### Phase 1: Foundation (Months 1-2)
**Goal:** Build core event infrastructure

- [x] Design event schema and types
- [ ] Implement event router
- [ ] Build event store (PostgreSQL)
- [ ] Create event ingestion APIs
- [ ] Add event logging to existing services
- [ ] Basic event viewing UI
- **Deliverable:** Event log of all project activities

### Phase 2: Historical Storage (Months 3-4)
**Goal:** Enable time-based queries

- [ ] Implement snapshot services
- [ ] Build crawl snapshot creation
- [ ] Add GSC/GA4 snapshot creation
- [ ] Create comparison APIs
- [ ] Timeline visualization UI
- [ ] Basic "as of date X" queries
- **Deliverable:** View project state at any past date

### Phase 3: Memory & Learning (Months 5-6)
**Goal:** Extract and apply learnings

- [ ] Build learning extraction engine
- [ ] Create pattern detection
- [ ] Implement confidence scoring
- [ ] Build validation tracking
- [ ] Create learning APIs
- [ ] Integrate with Operator for recommendations
- **Deliverable:** System learns from project history

### Phase 4: Search & Discovery (Months 7-8)
**Goal:** Find insights in project history

- [ ] Implement Elasticsearch integration
- [ ] Build full-text search
- [ ] Add tag-based discovery
- [ ] Create trend detection
- [ ] Build anomaly detection
- [ ] Advanced search UI
- **Deliverable:** Search across all project history

### Phase 5: AI Memory Integration (Months 9-10)
**Goal:** Make history accessible to Forge

- [ ] Store conversation history
- [ ] Implement context building for Forge
- [ ] Train Forge on project learnings
- [ ] Enable "Why" questions
- [ ] Build memory-augmented responses
- [ ] Create conversation history UI
- **Deliverable:** Forge understands project history and context

### Phase 6: Advanced Analytics (Months 11-12)
**Goal:** Deep insights from historical data

- [ ] Impact attribution analysis
- [ ] Causal inference engine
- [ ] Predictive modeling
- [ ] Trend forecasting
- [ ] Report generation
- [ ] Custom dashboard builder
- **Deliverable:** Advanced historical analytics platform

### Phase 7: Archive & Compliance (Months 13-14)
**Goal:** Long-term storage and compliance

- [ ] Implement tiered storage
- [ ] Automatic archival
- [ ] GDPR compliance
- [ ] Data export
- [ ] Audit trail
- [ ] Retention policies
- **Deliverable:** Compliant long-term storage

### Phase 8: Scaling & Optimization (Months 15+)
**Goal:** Production-grade scalability

- [ ] Database sharding
- [ ] Elasticsearch optimization
- [ ] Caching layer
- [ ] Query optimization
- [ ] Cost optimization
- [ ] Performance monitoring
- **Deliverable:** Production system at scale

---

## Success Metrics

### System Metrics

| Metric | Target | Implementation Month |
|--------|--------|----------------------|
| Event ingestion latency | < 100ms | Phase 1 |
| Event storage latency | < 50ms | Phase 1 |
| Timeline query latency | < 100ms | Phase 2 |
| Full-text search latency | < 200ms | Phase 4 |
| Learning extraction accuracy | > 85% | Phase 3 |
| Forge context relevance | > 80% user satisfaction | Phase 5 |
| Storage efficiency | > 70% compression | Phase 3 |
| Query success rate | > 99.5% | Phase 2 |

### User Experience Metrics

- % of users asking "why" questions to Forge
- % of users viewing project history
- Average time spent in timeline view
- Search result relevance satisfaction
- Learning application success rate
- User-rated memory quality

---

## Conclusion

Project Workspaces transforms RankForge from a stateless execution system to a **stateful, intelligent learning platform**. Every project becomes a living workspace that remembers everything, learns continuously, and enables deep historical analysis.

This architecture positions RankForge as the **ultimate SEO operating system** — not just executing changes, but understanding why they work, learning from outcomes, and using that knowledge to make better decisions in the future.

**Key Principles:**
- ✅ Everything is an event (immutable, timestamped)
- ✅ History is queryable (timeline, search, trends)
- ✅ Learning is continuous (extract patterns, validate outcomes)
- ✅ Memory is accessible (to users, to Forge, to systems)
- ✅ Scale is built-in (from day 1)

**Next Steps (Post-Production):**
1. Begin Phase 1 after shipping production foundation
2. Allocate dedicated team (4-6 engineers)
3. Establish success metrics
4. Iterate based on user feedback
5. Scale to support 100k+ projects

---

**Document Version:** 1.0  
**Last Updated:** July 16, 2026  
**Next Review:** When Phase 10 (production foundation) is complete
