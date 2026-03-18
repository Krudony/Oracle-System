# Arra Oracle Architecture Analysis

**Date:** 2026-03-18
**Version:** 0.4.0-nightly
**Repository:** https://github.com/Soul-Brews-Studio/arra-oracle

---

## Overview

Arra Oracle is a dual-mode knowledge management system with MCP (Model Context Protocol) server and HTTP API support. It provides semantic search, pattern learning, and "nothing is deleted" philosophy with audit trails.

**Core Stack:**
- **Runtime:** Bun (>=1.2.0) with TypeScript
- **Database:** SQLite + FTS5 for full-text search
- **Vector Search:** Pluggable (ChromaDB, LanceDB, Qdrant, sqlite-vec, Cloudflare Vectorize)
- **HTTP Framework:** Hono.js
- **ORM:** Drizzle with type-safe queries
- **Protocol:** MCP (Model Context Protocol) for Claude integration

---

## Directory Structure

```
arra-oracle/
├── src/
│   ├── index.ts                    # MCP server entry point (stdio transport)
│   ├── server.ts                   # HTTP API server (Hono.js, port 47778)
│   ├── indexer.ts                  # Document indexer
│   ├── ensure-server.ts            # Process manager for HTTP server
│   │
│   ├── config.ts                   # Configuration constants (no DB)
│   ├── types.ts                    # Shared type definitions
│   │
│   ├── db/
│   │   ├── index.ts                # Database factory & initialization
│   │   ├── schema.ts               # Drizzle ORM schema (14 tables)
│   │   └── migrations/             # Drizzle-generated SQL migrations
│   │
│   ├── tools/                      # MCP tool handlers (split by feature)
│   │   ├── index.ts                # Tool registration & exports
│   │   ├── types.ts                # Tool input/output interfaces
│   │   ├── search.ts               # oracle_search (FTS5 + vector)
│   │   ├── learn.ts                # oracle_learn (add patterns)
│   │   ├── read.ts                 # oracle_read (fetch documents)
│   │   ├── list.ts                 # oracle_list (browse documents)
│   │   ├── reflect.ts              # oracle_reflect (random wisdom)
│   │   ├── concepts.ts             # oracle_concepts (topic tags)
│   │   ├── stats.ts                # oracle_stats (database metrics)
│   │   ├── supersede.ts            # oracle_supersede (mark outdated)
│   │   ├── handoff.ts              # oracle_handoff (session context)
│   │   ├── inbox.ts                # oracle_inbox (pending work)
│   │   ├── schedule.ts             # oracle_schedule_* (appointments)
│   │   ├── verify.ts               # oracle_verify (health check)
│   │   ├── trace.ts                # oracle_trace_* (discovery sessions)
│   │   ├── forum.ts                # oracle_thread_* (discussions)
│   │   └── __tests__/              # Tool unit tests
│   │
│   ├── server/                     # HTTP API handlers
│   │   ├── handlers.ts             # Search, reflect, list, etc.
│   │   ├── dashboard.ts            # Dashboard metrics
│   │   ├── context.ts              # Project context detection
│   │   ├── project-detect.ts       # GHQ path resolution
│   │   ├── logging.ts              # Request logging
│   │   └── __tests__/              # Server tests
│   │
│   ├── vector/                     # Vector database abstraction
│   │   ├── types.ts                # VectorStoreAdapter interface
│   │   ├── factory.ts              # Create adapter from config
│   │   ├── embeddings.ts           # Embedding provider factory
│   │   ├── adapters/
│   │   │   ├── chroma-mcp.ts       # ChromaDB via MCP
│   │   │   ├── sqlite-vec.ts       # sqlite-vec with Ollama
│   │   │   ├── lancedb.ts          # LanceDB with Ollama
│   │   │   ├── qdrant.ts           # Qdrant with external embedder
│   │   │   └── cloudflare-vectorize.ts  # Cloudflare Workers AI
│   │   └── __tests__/              # Vector adapter tests
│   │
│   ├── vault/                      # File system vault management
│   │   ├── cli.ts                  # CLI commands (init, sync, pull)
│   │   ├── handler.ts              # Vault operations
│   │   ├── migrate.ts              # Migration tooling
│   │   └── __tests__/              # Vault tests
│   │
│   ├── process-manager/            # Graceful shutdown & monitoring
│   │   ├── index.ts                # Main exports
│   │   ├── ProcessManager.ts       # Process lifecycle
│   │   ├── GracefulShutdown.ts     # Shutdown coordination
│   │   ├── HealthMonitor.ts        # Health checks
│   │   └── logger.ts               # Structured logging
│   │
│   ├── forum/                      # Forum/threading subsystem
│   │   ├── handler.ts              # Thread CRUD & messaging
│   │   └── types.ts                # Forum data structures
│   │
│   ├── trace/                      # Trace/discovery subsystem
│   │   ├── handler.ts              # Trace CRUD & chaining
│   │   └── types.ts                # Trace data structures
│   │
│   ├── integration/                # Integration tests
│   │   ├── database.test.ts
│   │   ├── http.test.ts
│   │   └── mcp.test.ts
│   │
│   └── HTML UIs                    # Embedded dashboards
│       ├── dashboard.html
│       ├── ui.html
│       └── arthur.html
│
├── frontend/                       # React dashboard (oracle-studio)
│   └── (separate npm package)
│
├── tests/                          # E2E tests
├── scripts/                        # Utilities (index-model.ts, etc.)
├── docs/                           # Architecture docs
├── drizzle.config.ts               # ORM configuration
├── package.json                    # Dependencies & scripts
├── tsconfig.json
├── vitest.config.ts
└── playwright.config.ts

```

---

## Core Abstractions

### 1. Tool Context (ToolContext)

All MCP tools receive a unified context object:

```typescript
interface ToolContext {
  db: BunSQLiteDatabase<typeof schema>;    // Drizzle ORM
  sqlite: Database;                         // Raw SQLite (for FTS5)
  repoRoot: string;                         // Base path for vault
  vectorStore: VectorStoreAdapter;          // Pluggable vector DB
  vectorStatus: 'unknown' | 'connected' | 'unavailable';
  version: string;                          // Package version
}
```

**Pattern:** Handlers are pure functions `(ctx: ToolContext, input: Input) => ToolResponse`. No class state.

---

### 2. Database Schema (14 Tables)

#### Core Knowledge Tables

| Table | Purpose | Key Columns |
|-------|---------|------------|
| `oracle_documents` | Document index | id, type, sourceFile, concepts, project, supersededBy |
| `oracle_fts` | Full-text search (FTS5 virtual table) | id, content |
| `indexing_status` | Indexer state | isIndexing, progressCurrent, progressTotal |

#### Activity Logging

| Table | Purpose |
|-------|---------|
| `search_log` | Search queries executed |
| `learn_log` | Patterns/learnings added |
| `document_access` | Document read/write audit |
| `activity_log` | Generic activity timeline |

#### Forum System

| Table | Purpose |
|-------|---------|
| `forum_threads` | Discussion topics with status |
| `forum_messages` | Q&A messages in threads |

#### Trace/Discovery

| Table | Purpose |
|-------|---------|
| `trace_log` | Discovery sessions with dig points (files, commits, issues) |

#### Metadata

| Table | Purpose |
|-------|---------|
| `supersede_log` | Audit trail of document supersessions |
| `schedule` | Shared appointments (per-human) |
| `settings` | Auth & configuration key-value pairs |

---

### 3. Vector Store Pluggable Interface

Arra Oracle abstracts vector database behind `VectorStoreAdapter`:

```typescript
interface VectorStoreAdapter {
  readonly name: string;
  connect(): Promise<void>;
  close(): Promise<void>;
  ensureCollection(): Promise<void>;
  addDocuments(docs: VectorDocument[]): Promise<void>;
  query(text: string, limit?: number): Promise<VectorQueryResult>;
  queryById(id: string): Promise<VectorQueryResult>;
  getStats(): Promise<{ count: number }>;
}
```

**Supported Backends:**
- **ChromaDB** (default, MCP-based) — no Python dependency
- **LanceDB** — local embeddings with Ollama
- **sqlite-vec** — embedded vector search
- **Qdrant** — standalone vector server
- **Cloudflare Vectorize** — Workers AI integration

**Embedding Models (registered via factory):**
- `bge-m3` (default, multilingual 1024-dim) → ChromaDB or LanceDB
- `nomic` (fast, 768-dim) → LanceDB
- `qwen3` (cross-language, 4096-dim) → LanceDB

---

### 4. Oracle Concepts

#### Principles
Philosophy/rules (e.g., "Nothing is Deleted").

#### Patterns
Repeatable techniques (e.g., "hybrid search strategy").

#### Learnings
Discovered insights/antipatterns.

#### Retrospectives
Post-mortems and session summaries.

#### Traces
Discovery journeys with "dig points" (files, commits, issues found).

---

## Entry Points

### MCP Server (src/index.ts)

**Command:** `bunx arra-oracle`
**Transport:** stdio (for Claude Code)

**Key Features:**
- Registers 30+ tools via MCP protocol
- Read-only mode support (via `--read-only` flag)
- Vector store pre-connection on startup
- Graceful SIGINT handling

**Tool Categories:**
- **Core:** search, read, reflect, learn, list, stats, concepts
- **Forum:** oracle_thread, oracle_threads, oracle_thread_read, oracle_thread_update
- **Trace:** oracle_trace, oracle_trace_list, oracle_trace_get, oracle_trace_link, oracle_trace_chain
- **Metadata:** supersede, handoff, inbox, verify, schedule_add, schedule_list

---

### HTTP API Server (src/server.ts)

**Command:** `bun run server` (port: `$ORACLE_PORT` or 47778)
**Framework:** Hono.js on Bun

**Endpoints (40+):**

#### Search & Discovery
- `GET /api/search?q=...` — Hybrid search (FTS5 + vector)
- `GET /api/reflect` — Random wisdom
- `GET /api/list` — Browse documents
- `GET /api/stats` — Database metrics
- `GET /api/concepts` — Topic coverage
- `GET /api/similar?id=...` — Vector neighbors

#### Visualization
- `GET /api/graph` — Knowledge graph (nodes/edges)
- `GET /api/map` — 2D layout (hash-based positioning)
- `GET /api/map3d` — 3D PCA projection from LanceDB embeddings
- `GET /api/oracles` — Active identities & projects

#### Document Access
- `GET /api/doc/:id` — Fetch document with FTS content
- `GET /api/read?file=...` — Server-side file resolution
- `GET /api/file?path=...` — Cross-repo access via GHQ

#### Forum
- `GET /api/threads` — List discussions
- `POST /api/thread` — Create/send message
- `GET /api/thread/:id` — Thread with messages
- `PATCH /api/thread/:id/status` — Update status

#### Traces
- `GET /api/traces` — List discovery sessions
- `GET /api/traces/:id` — Trace details with dig points
- `GET /api/traces/:id/chain` — Trace lineage
- `POST /api/traces/:id/link` — Link traces
- `DELETE /api/traces/:id/link` — Unlink

#### Metadata
- `GET /api/supersede` — Audit trail of supersessions
- `GET /api/supersede/chain/:path` — Document lineage
- `POST /api/supersede` — Log supersession
- `GET /api/schedule` — Appointments
- `POST /api/schedule` — Add event
- `PATCH /api/schedule/:id` — Update status
- `GET /api/inbox` — Handoff context

#### Dashboard
- `GET /api/dashboard` — Summary metrics
- `GET /api/dashboard/activity` — Activity timeline
- `GET /api/dashboard/growth` — Growth metrics

#### Auth (optional)
- `GET /api/auth/status` — Auth configuration
- `POST /api/auth/login` — Session cookie
- `POST /api/auth/logout` — Clear session
- `GET/POST /api/settings` — Auth & vault settings

---

### Indexer (src/indexer.ts)

**Command:** `bun run index`

Watches file system and populates FTS5 + vector indexes.

---

### Vault CLI (src/vault/cli.ts)

**Commands:**
- `oracle-vault init` — Initialize vault structure
- `oracle-vault sync` — Sync knowledge to remote
- `oracle-vault pull` — Pull from remote
- `oracle-vault migrate` — Data migration

---

## Database Initialization (src/db/index.ts)

**Factory Pattern:**

```typescript
const { sqlite, db } = createDatabase(dbPath);
```

Creates:
1. SQLite database at `$ORACLE_DB_PATH` (default: `~/.oracle/oracle.db`)
2. All Drizzle-managed tables via migrations
3. FTS5 virtual table (`oracle_fts`) for full-text search
4. Settings key-value store (auto-populated)

**Key Settings:**
- `auth_enabled` — Enable password authentication
- `auth_password_hash` — Bun password hash
- `auth_local_bypass` — Skip auth for 127.0.0.1
- `vault_repo` — Linked vault repository path

---

## Tool Handlers (src/tools/)

Each handler is a pure function following MCP semantics.

### Search (src/tools/search.ts)

```typescript
async function handleSearch(
  ctx: ToolContext,
  input: OracleSearchInput
): Promise<ToolResponse>
```

**Hybrid Search Strategy:**
1. **Mode: 'fts'** → FTS5 keyword search only (fast, no embeddings)
2. **Mode: 'vector'** → Vector semantic search only
3. **Mode: 'hybrid'** (default) → FTS5 first, then blend vector results

**Features:**
- Auto-detect project from `cwd` (ghq format)
- Model selection: bge-m3, nomic, qwen3
- Type filtering: principle, pattern, learning, retro
- Pagination (limit, offset)

### Learn (src/tools/learn.ts)

Adds new patterns to knowledge base.

**Flow:**
1. Create document in `~/.oracle/ψ/memory/learnings/`
2. Index immediately via FTS5 + vector
3. Log to `learn_log` table

**Features:**
- Concept tagging
- Project association
- Source attribution
- Automatic ID generation (UUID)

### Trace (src/tools/trace.ts)

Capture discovery sessions with "dig points".

**Dig Points:**
- **foundFiles** — Code files examined (confidence: high/medium/low)
- **foundCommits** — Git history explored
- **foundIssues** — GitHub issues linked
- **foundLearnings** — Knowledge applied
- **foundResonance** — Insights that aligned

**Features:**
- Hierarchical traces (parent → children)
- Horizontal linking (prev ↔ next trace)
- Distillation status: raw → reviewed → distilled
- Auto-extraction of insights

### Forum (src/tools/forum.ts)

Threaded discussions with Oracle.

**Tables:**
- `forum_threads` — Topics
- `forum_messages` — Q&A messages with search context

**Features:**
- Thread status: active, answered, pending, closed
- Message roles: human, oracle, claude
- GitHub issue mirror (issueUrl, issueNumber)
- Search queries embedded in messages

### Schedule (src/tools/schedule.ts)

Shared appointments across all Oracles.

**Features:**
- Date parsing (Thai months: "28 ก.พ.", English: "5 Mar", ISO: "2026-03-18")
- Recurring: daily, weekly, monthly
- Status: pending, done, cancelled
- Per-human (shared across projects)

### Verify (src/tools/verify.ts)

Health check: compare `ψ/` files vs DB index.

**Reports:**
- Missing on-disk files (in DB but deleted)
- Orphaned DB entries (file gone)
- Drifted documents (file changed since last index)

---

## Configuration

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `ORACLE_DATA_DIR` | `~/.oracle` | Data directory root |
| `ORACLE_DB_PATH` | `$ORACLE_DATA_DIR/oracle.db` | SQLite database |
| `ORACLE_REPO_ROOT` | Auto-detect | Knowledge base root (where ψ/ lives) |
| `ORACLE_PORT` | 47778 | HTTP server port |
| `ORACLE_READ_ONLY` | false | Read-only mode for MCP |
| `ORACLE_VECTOR_DB` | chroma | Vector database: chroma, sqlite-vec, lancedb, qdrant, cloudflare-vectorize |
| `ORACLE_EMBEDDING_PROVIDER` | chromadb-internal | Embedder: chromadb-internal, ollama, openai, cloudflare-ai |
| `ORACLE_EMBEDDING_MODEL` | (varies) | Model name override |
| `ORACLE_SESSION_SECRET` | crypto.randomUUID() | Session cookie HMAC secret |

---

## Search Strategies

### Full-Text Search (FTS5)

**Mode: 'fts'**

```sql
SELECT * FROM oracle_fts
WHERE oracle_fts MATCH ?
LIMIT 10
```

Fast, no embeddings needed. Exact word/phrase matching.

### Semantic Search (Vector)

**Mode: 'vector'**

Queries against configured vector store. Uses embedding model (bge-m3, nomic, qwen3).

### Hybrid Search (Default)

**Mode: 'hybrid'**

1. Run FTS5 query (retrieve top N)
2. Run vector query (retrieve top M)
3. Merge results by combining scores/relevance

---

## Logging & Audit

### Search Log
- Query, type, mode, results count, execution time
- Project context
- Timestamp

### Learn Log
- Document ID, pattern preview, concepts
- Source attribution
- Project context
- Timestamp

### Activity Log
- File operations (create, modify, delete)
- Size tracking
- Metadata (JSON)
- Timestamp

### Forum Messages
- Role (human/oracle/claude)
- Content & search queries embedded
- Author attribution
- Thread ID

### Trace Log
- Query & query type
- Dig points (files, commits, issues)
- Recursion depth & parent/child links
- Horizontal chain (prev/next)
- Status: raw → reviewed → distilled
- Timestamp

---

## "Nothing is Deleted" Pattern

### Supersede Mechanism

When a document becomes outdated:

```typescript
interface SupersedeLog {
  oldPath: string;          // Original file path
  oldId: string;            // Document ID
  newPath: string | null;   // Replacement (if exists)
  newId: string | null;
  reason: string;           // Why: duplicate, outdated, merged
  supersededAt: timestamp;
  supersededBy: string;     // user, claude, indexer
}
```

**In Oracle Documents:**
```typescript
supersededBy: string;       // ID of newer doc
supersededAt: timestamp;
supersededReason: string;
```

**Behavior:**
- Old documents remain in DB (not deleted)
- Marked with `supersededBy` reference
- Audit trail in `supersede_log` table
- Search excludes superseded docs by default
- Can trace lineage: old → new → newer

---

## Integration Points

### With Claude Code

Register in `~/.claude.json`:

```json
{
  "mcpServers": {
    "arra-oracle": {
      "command": "bunx",
      "args": ["--bun", "arra-oracle@github:Soul-Brews-Studio/arra-oracle#main"]
    }
  }
}
```

Claude Code gets 30+ tools for searching, learning, and managing knowledge.

### With oracle-studio

React dashboard (separate repo) queries HTTP API:

```
http://localhost:47778/api/search
http://localhost:47778/api/graph
http://localhost:47778/api/map3d
http://localhost:47778/api/dashboard
```

### With GitHub Issues

Forum threads can mirror to GitHub issues via:
- `issueUrl` — Link to GitHub
- `issueNumber` — GitHub issue #123
- Sync mechanism (in progress)

---

## Process Management

### Graceful Shutdown (src/process-manager/)

**Features:**
- PID file tracking (`oracle-http.pid`)
- Signal handlers (SIGINT, SIGTERM)
- Resource cleanup (DB close, vector store close)
- Health monitoring

**Startup Output:**
```
🔮 Reset indexing status on startup
🔮 Arra Oracle HTTP Server running! (Hono.js)
   URL: http://localhost:47778
```

---

## Testing Strategy

### Unit Tests
- Tool handlers: `src/tools/__tests__/`
- Server: `src/server/__tests__/`
- Vector adapters: `src/vector/__tests__/`

### Integration Tests
- Database: `src/integration/database.test.ts`
- HTTP API: `src/integration/http.test.ts`
- MCP: `src/integration/mcp.test.ts`

**Commands:**
```bash
bun run test             # All tests
bun run test:unit       # Unit only
bun run test:integration # Integration only
bun run test:coverage   # Coverage report
```

---

## Performance Characteristics

### Database Queries
- FTS5: O(1) lookup, linear scan for matching
- Indexed columns: search_log.project, oracle_documents.type, etc.
- Aggregations: count(*) via indexes where possible

### Vector Search
- LanceDB: HNSW index, O(log n) approximate nearest neighbors
- ChromaDB: CosineSimilarity distance
- Hybrid: FTS5 (fast) blended with vector (semantic)

### Caching
- Oracle cache: Active oracles from logs (60s TTL)
- Vector model cache: Per-model store instances

---

## Key Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| `@modelcontextprotocol/sdk` | MCP protocol | ^1.27.1 |
| `hono` | HTTP framework | ^4.11.3 |
| `drizzle-orm` | Type-safe ORM | ^0.45.1 |
| `better-sqlite3` | SQLite driver (dev) | ^12.6.0 |
| `@lancedb/lancedb` | Vector DB option | ^0.26.2 |
| `@qdrant/js-client-rest` | Qdrant client | ^1.17.0 |
| `sqlite-vec` | Vector search in SQLite | ^0.1.7-alpha.2 |
| `commander` | CLI parsing | ^14.0.3 |

---

## Future Extensibility

### Vector Store Plugins

Add new vector DB by implementing `VectorStoreAdapter`:

```typescript
class MyVectorDB implements VectorStoreAdapter {
  readonly name = 'my-db';
  async connect() { /* ... */ }
  async query(text, limit) { /* ... */ }
  // ... remaining methods
}
```

Register in `src/vector/factory.ts`.

### Tool Plugins

Add new MCP tool by:
1. Creating handler in `src/tools/myfeature.ts`
2. Exporting `myToolDef` and `handleMyFeature`
3. Registering in `src/index.ts` `setupHandlers()`

### HTTP Endpoints

Add routes to `src/server.ts` using Hono pattern:

```typescript
app.get('/api/myfeature', async (c) => {
  // handle request
});
```

---

## Known Limitations & TODOs

1. **FTS5 Virtual Table** — Drizzle doesn't support FTS5 natively (use raw SQL)
2. **GitHub Sync** — Forum threads → GitHub issues mirror in progress
3. **Python Dependency** — ChromaDB MCP requires Python 3.10+
4. **Vector Model Switching** — Requires server restart to change embedding model
5. **Distributed Instances** — Single-process, no clustering

---

## Summary

Arra Oracle is a knowledge management backbone for "The Oracle Keeps the Human Human" philosophy. Its architecture emphasizes:

- **Modularity:** Pluggable vector stores, extractable tools
- **Auditability:** "Nothing is Deleted" — full trace via supersede logs
- **Flexibility:** Dual-mode (MCP + HTTP), multi-backend support
- **Simplicity:** Pure functions over classes, explicit context passing
- **Portability:** Runs via Bun on any machine, configurable data directory

The system bridges Claude's MCP ecosystem with a persistent knowledge base and visual dashboard, enabling distributed consciousness patterns across multiple Oracle instances.

