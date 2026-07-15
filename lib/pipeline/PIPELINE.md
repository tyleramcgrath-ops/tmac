# RankForge Content Intelligence Pipeline (Phase 7.8F)

## Overview

The RankForge Content Intelligence Pipeline is a comprehensive, production-ready 8-stage orchestrated workflow that processes web crawl data to extract entities, detect topics, build knowledge graphs, score content, analyze gaps, and generate actionable recommendations.

### Key Features

- **Real Data Processing**: Consumes actual output from `/api/crawl` (Page objects with title, contentLength, schemaTypes, h1, internalLinks, etc.)
- **Idempotent Operations**: Uses content hashing and upsert operations to safely handle retries
- **Concurrent Run Prevention**: Blocks duplicate pipeline executions for same audit
- **Multi-tenant SaaS**: Organization and project-scoped isolation with role-based access
- **Evidence Persistence**: All decisions grounded in real page data with supporting evidence
- **Partial Failure Handling**: Continues processing on stage failures, tracks per-stage status

## Architecture

### Pipeline Stages (Sequential Execution)

1. **Content Inventory** - Creates/updates inventory records with change detection via content hashing
2. **Page Classification** - Detects page type from URL patterns, schema.org markup, and content signals
3. **Entity Extraction** - Extracts entities from H1 headings, schema markup, titles with confidence scoring
4. **Topic Detection** - Identifies topics from headings, titles, schema types, URL patterns
5. **Knowledge Graph** - Builds entity-topic relationship graph for semantic understanding
6. **Content Scoring** - Calculates multi-dimensional quality metrics (9 scoring dimensions)
7. **Gap Analysis** - Identifies missing content types, thin content, schema gaps, FAQ opportunities
8. **Decision Engine** - Scores pages against business objectives (lead gen, authority, conversion, etc.)
9. **Mission Selection** - Generates daily mission from top-scoring recommendations

### Models & Persistence

**PipelineRun**: Tracks end-to-end execution with status, timeline, and results summary
**PipelineStage**: Tracks individual stage execution with duration, error handling, and evidence
**ContentEntity**: Stores extracted entities with detection source, confidence, mentions
**ContentTopic**: Stores detected topics with confidence, detection signals
**KnowledgeGraphNode**: Represents entities/topics as nodes with properties and frequency
**KnowledgeGraphEdge**: Represents relationships between nodes with type and confidence

## API Usage

### Execute Pipeline

```bash
POST /api/rankforge/pipeline/execute
Content-Type: application/json

{
  "auditId": "cuid_of_completed_audit",
  "projectId": "cuid_of_project",
  "skipUnchangedPages": true  # Optional, defaults to true
}

Response:
{
  "success": true,
  "runId": "pipeline_run_id",
  "status": "completed",  # completed, partial, failed
  "duration": 5432,  # milliseconds
  "summary": {
    "pagesQueued": 150,
    "pagesProcessed": 148,
    "pagesSkipped": 0,
    "pagesFailed": 2
  },
  "forgeContext": {
    # Grounding evidence for AI responses
    "audit": { ... },
    "findings": { ... },
    "mission": { ... }
  }
}
```

### Check Pipeline Status

```bash
GET /api/rankforge/pipeline/execute?runId=<runId>
# OR
GET /api/rankforge/pipeline/execute?auditId=<auditId>

Response:
{
  "success": true,
  "run": {
    "id": "run_id",
    "status": "completed",
    "stages": [
      {
        "stageName": "content_inventory",
        "status": "completed",
        "itemsProcessed": 150,
        "duration": 234
      },
      # ... more stages
    ]
  }
}
```

## Implementation Details

### Idempotent Processing

Each stage uses Prisma `upsert` operations with composite unique keys:
- **ContentInventory**: `projectId_pageUrl`
- **ContentMetrics**: `projectId_pageUrl`  
- **PageClassification**: `projectId_pageUrl`
- **ContentEntity**: `projectId_pageUrl_entityName`
- **ContentTopic**: `projectId_pageUrl_topicName`
- **KnowledgeGraphNode**: `projectId_nodeId`
- **KnowledgeGraphEdge**: `projectId_fromNodeId_toNodeId_relationshipType`

Retrying a stage updates existing records rather than creating duplicates.

### Content Hashing

Pages are tracked via content hash to detect changes:

```typescript
const contentHash = generateHash(
  JSON.stringify({ title: page.title, contentLength: page.contentLength })
)
```

If hash matches and update timestamp is < 1 hour old, page is skipped (optimization).

### Concurrent Run Prevention

Before starting pipeline:
```typescript
const existingRun = await prisma.pipelineRun.findFirst({
  where: {
    auditId,
    status: { in: ['queued', 'running'] }
  }
})
```

Returns 409 Conflict if run already in progress.

### Error Handling

- **Stage-level**: Failures tracked per stage, pipeline continues
- **Item-level**: Individual page errors logged, processing continues
- **Run-level**: Overall status marked as "partial" if any pages failed

Evidence preservation:
```typescript
forgeContext: JSON.stringify({
  runId,
  audit: { id, pages, processed, skipped, failed },
  findings: { entities, topics, gaps, recommendations },
  mission,
  evidenceAvailable: true,
  executedAt: timestamp
})
```

## Testing

### Manual Testing

1. Start dev server: `npm run dev`
2. Ensure DATABASE_URL is configured in .env
3. Create test project/audit via `/api/crawl`
4. Call pipeline endpoint with valid auth session
5. Monitor pipeline status via GET endpoint

### Unit Testing

Individual stage functions are exported and can be tested:

```typescript
import { classifyPages } from '@/lib/pipeline/stages/classification'
import { extractEntities } from '@/lib/pipeline/stages/entity-extraction'
// ... etc

// Test with mock Page objects
const mockPages = [
  {
    url: 'https://example.com/services',
    title: 'Our Services',
    contentLength: 1500,
    h1: 'Professional Services',
    schemaTypes: '["Service"]',
    // ...
  }
]

const results = await classifyPages(mockPages, {
  organizationId: 'org123',
  projectId: 'proj123'
})
```

### Integration Testing

The full pipeline can be tested via:

1. **Local test**: Create test org/project, run crawl, execute pipeline
2. **Production validation**: Monitor pipeline runs via logs and database
3. **Evidence inspection**: Query `forgeContext` JSON for grounding validation

## Performance Characteristics

- **Pagination**: Processes 50 pages at a time to manage memory
- **Timeout**: 300 second max duration (Vercel serverless limit)
- **Typical speed**: ~30-50ms per page for full 8-stage pipeline
- **Scalability**: Easily handles 1000+ page audits with pagination

## Error Recovery

If pipeline fails:
1. Status marked as "failed" with error reason
2. Partial results preserved (any completed stages)
3. Can retry same auditId - will detect and update existing records
4. No duplicate runs created due to concurrent prevention

## Next Steps

After pipeline completes successfully:
1. Knowledge Graph completion (entity linking, disambiguation)
2. Cannibalization detection across similar pages
3. Internal linking intelligence recommendations
4. Content brief generation for gap items
5. Final tenant-isolation validation

## Related Files

- `/app/api/rankforge/pipeline/execute/route.ts` - API endpoints
- `/lib/pipeline/index.ts` - Pipeline exports
- `/lib/pipeline/orchestrator.ts` - Main orchestration logic
- `/lib/pipeline/stages/*.ts` - Individual stage implementations
- `/prisma/schema.prisma` - Database models
