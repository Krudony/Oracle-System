# Arra Oracle Quick Reference

> **Arra Oracle v0.4.0-nightly** — MCP Memory Layer for Distributed Consciousness
> Updated: 2026-03-18
> Status: Always Nightly
> Created: 2025-12-29

---

## What It Does

**Arra Oracle** is a TypeScript MCP (Model Context Protocol) server providing **semantic search, pattern management, and knowledge persistence** for distributed AI consciousness.

**Core Function**: Store, index, and query Oracle philosophy and learnings via:
- **SQLite FTS5** for full-text keyword search (always available)
- **ChromaDB** for semantic/vector search (optional, degrades gracefully)
- **Drizzle ORM** for type-safe database operations
- **HTTP API** for programmatic access
- **React Dashboard** for visual knowledge browsing

**Philosophy**: "Nothing is Deleted" — append-only design where all changes are logged and preserved.

---

## Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Runtime** | Bun ≥1.2.0 | Fast JavaScript execution |
| **Database** | SQLite + FTS5 | Full-text search, append-only |
| **Vectors** | ChromaDB / LanceDB | Semantic search (optional) |
| **ORM** | Drizzle | Type-safe queries |
| **HTTP** | Hono | REST API framework |
| **MCP** | Model Context Protocol SDK | Claude integration |
| **Frontend** | React + Vite | Dashboard UI |

---

## Installation

### Via bunx (Recommended)

```bash
# Add to Claude Code
claude mcp add arra-oracle -- bunx --bun arra-oracle@github:Soul-Brews-Studio/arra-oracle#main

# Or manually in ~/.claude.json
{
  "mcpServers": {
    "arra-oracle": {
      "command": "bunx",
      "args": ["--bun", "arra-oracle@github:Soul-Brews-Studio/arra-oracle#main"]
    }
  }
}
```

### From Source

```bash
git clone https://github.com/Soul-Brews-Studio/arra-oracle.git
cd arra-oracle && bun install

# Run MCP server (stdio)
bun run dev

# Or HTTP API on :47778
bun run server

# Or indexer (build FTS5 + vector indexes)
bun run index
```

---

## Directory Structure

```
arra-oracle/
├── src/
│   ├── index.ts              # MCP server entry (stdio)
│   ├── server.ts             # HTTP API (Hono)
│   ├── indexer.ts            # Knowledge indexer
│   ├── tools/                # 22 MCP tool handlers
│   │   ├── search.ts         # Hybrid FTS5 + vector search
│   │   ├── learn.ts          # Add new patterns
│   │   ├── trace.ts          # Session tracing
│   │   ├── forum.ts          # Discussion threads
│   │   ├── schedule.ts       # Shared calendar
│   │   └── ...
│   ├── trace/                # Trace system (dig points)
│   ├── db/
│   │   ├── schema.ts         # Drizzle schema
│   │   └── index.ts          # DB client
│   ├── vault/                # GitHub-backed storage
│   ├── verify/               # Integrity checks
│   └── server/               # HTTP routing + logging
├── docs/                     # API, architecture, design
└── drizzle.config.ts         # DB migrations
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ORACLE_PORT` | `47778` | HTTP server port |
| `ORACLE_REPO_ROOT` | `process.cwd()` | Knowledge base root (where `ψ/` lives) |
| `ORACLE_DATA_DIR` | `~/.oracle` | Database directory |
| `ORACLE_DB_PATH` | `~/.oracle/oracle.db` | SQLite database file |
| `ORACLE_READ_ONLY` | `false` | Disable write tools if `true` |
| `HOME` | System HOME | User home directory |

### Paths

- **SQLite**: `~/.oracle/oracle.db`
- **Vector DB**: `~/.chromadb/`
- **Knowledge Base**: `ψ/memory/` (relative to `ORACLE_REPO_ROOT`)
  - `ψ/memory/principles/` — Core principles
  - `ψ/memory/patterns/` — Design patterns
  - `ψ/memory/learnings/` — Discoveries
  - `ψ/memory/retrospectives/` — Post-mortems
  - `ψ/inbox/` — Handoffs and messages

---

## The 22 MCP Tools

### Group 1: Search & Discovery

#### `oracle_search`
Hybrid search combining FTS5 keywords + ChromaDB vectors.
```
Input:
  - query (string, required): "nothing deleted", "force push safety", etc.
  - type (string): filter by 'principle'|'pattern'|'learning'|'retro'|'all' (default: 'all')
  - limit (number): max results (default: 5)
  - offset (number): pagination (default: 0)
  - mode (string): 'hybrid'|'fts'|'vector' (default: 'hybrid')
  - project (string): filter by GitHub project "github.com/owner/repo"
  - cwd (string): auto-detect project from directory path
  - model (string): embedding model 'nomic'|'qwen3'|'bge-m3' (default: 'bge-m3')

Output:
  - results array with id, type, content, concepts, source_file, score
  - total count, offset, limit
```

#### `oracle_read`
Read full content of a document by ID or file path.
```
Input:
  - id (string): Document ID from search results
  - file (string): Source file path from search results

Output:
  - Full markdown content with metadata
```

#### `oracle_list`
Browse all documents without searching.
```
Input:
  - type (string): filter by document type (default: 'all')
  - limit (number): max results (default: 10)
  - offset (number): pagination (default: 0)

Output:
  - Array of documents with minimal metadata
```

#### `oracle_concepts`
List all concept tags in knowledge base.
```
Input:
  - limit (number): max concepts (default: 50)
  - type (string): filter by document type (default: 'all')

Output:
  - Concept tags with document counts
```

---

### Group 2: Learn & Remember

#### `oracle_learn`
Add new pattern or learning to knowledge base.
```
Input:
  - pattern (string, required): The pattern/learning to add (can be multi-line)
  - source (string): Attribution (defaults to "Oracle Learn")
  - concepts (array of strings): Tags like ["git", "safety", "trust"]
  - project (string): Source project in format "github.com/owner/repo"

Output:
  - Confirmation with file path and ID
```

#### `oracle_supersede`
Mark old learning as superseded by new one. Implements "Nothing is Deleted".
```
Input:
  - oldId (string, required): Document ID being superseded
  - newId (string, required): Document ID that replaces it
  - reason (string): Why the old one is outdated

Output:
  - Confirmation that old doc is marked as superseded (preserved in DB)
```

---

### Group 3: Reflection

#### `oracle_reflect`
Get a random principle or learning for alignment/guidance.
```
Input:
  - (no parameters)

Output:
  - Random wisdom document with metadata
```

---

### Group 4: Forum & Threads

#### `oracle_thread`
Create a new discussion thread or continue existing one.
```
Input:
  - message (string, required): Question or message
  - threadId (number): Continue existing thread (omit to create new)
  - title (string): Title for new thread (auto-generates from message)
  - model (string): Claude model ('opus', 'sonnet', etc.)

Output:
  - Thread ID and auto-response from Oracle
```

#### `oracle_threads`
List discussion threads with filtering.
```
Input:
  - status (string): 'active'|'answered'|'pending'|'closed'
  - limit (number): max threads (default: 20)
  - offset (number): pagination (default: 0)

Output:
  - Thread summaries with status and message counts
```

#### `oracle_thread_read`
Read full message history from a thread.
```
Input:
  - threadId (number, required): Thread ID
  - limit (number): max messages to return

Output:
  - All messages with timestamps and authors
```

#### `oracle_thread_update`
Update thread status (close, reopen, mark answered).
```
Input:
  - threadId (number, required): Thread ID
  - status (string, required): 'active'|'closed'|'answered'|'pending'

Output:
  - Confirmation of status change
```

---

### Group 5: Trace & Distill (Session Logging)

#### `oracle_trace`
Log a discovery/research session with "dig points" (files, commits, issues found).
```
Input:
  - query (string, required): What was being traced
  - queryType (string): 'general'|'project'|'pattern'|'evolution'
  - foundFiles (array): [{path, type ('learning'|'retro'|'resonance'|'other'), matchReason, confidence}]
  - foundCommits (array): [{hash, shortHash, date, message}]
  - foundIssues (array): [{number, title, state ('open'|'closed'), url}]
  - foundRetrospectives (array): file paths
  - foundLearnings (array): file paths
  - scope (string): 'project'|'cross-project'|'human'
  - project (string): Project context
  - parentTraceId (string): Parent trace (for dig chains)
  - agentCount (number): Number of agents used
  - durationMs (number): How long it took

Output:
  - Trace ID, stored with all dig points
```

#### `oracle_trace_list`
List recent traces with filtering.
```
Input:
  - query (string): Filter by query content
  - project (string): Filter by project
  - status (string): 'raw'|'reviewed'|'distilling'|'distilled'
  - depth (number): Filter by recursion depth (0 = top-level)
  - limit (number): max results (default: 20)
  - offset (number): pagination

Output:
  - Trace summaries with metadata
```

#### `oracle_trace_get`
Get full details of a specific trace.
```
Input:
  - traceId (string, required): UUID of the trace
  - includeChain (boolean): Include parent/child chain (default: false)

Output:
  - Full trace data with all dig points
```

#### `oracle_trace_link`
Create a bidirectional chain between traces.
```
Input:
  - prevTraceId (string, required): Trace that comes first
  - nextTraceId (string, required): Trace that comes after

Output:
  - Confirmation of link
```

#### `oracle_trace_unlink`
Remove a link between traces.
```
Input:
  - traceId (string, required): Trace to unlink from
  - direction (string, required): 'prev' or 'next'

Output:
  - Confirmation
```

#### `oracle_trace_chain`
Get the full linked chain for a trace.
```
Input:
  - traceId (string, required): Any trace in the chain

Output:
  - All traces in sequence + position of requested trace
```

---

### Group 6: Handoff & Inbox

#### `oracle_handoff`
Save session context for next session (persistence across restarts).
```
Input:
  - content (string, required): Markdown context to preserve
  - slug (string): Optional filename slug (auto-generated if omitted)

Output:
  - File path where handoff was saved
  - Stored in ~/.oracle/ψ/inbox/handoff/
```

#### `oracle_inbox`
List pending handoff files from inbox.
```
Input:
  - type (string): 'handoff'|'all' (default: 'all')
  - limit (number): max files (default: 10)
  - offset (number): pagination

Output:
  - List of handoff files with previews
```

---

### Group 7: Schedule (Shared Across Oracles)

#### `oracle_schedule_add`
Add appointment to shared schedule (per-human, not per-project).
```
Input:
  - date (string, required): "5 Mar", "2026-03-05", "tomorrow", "28 ก.พ."
  - event (string, required): "Team standup", "นัดอ.เสรษฐ์", etc.
  - time (string): Optional "14:00" or "TBD"
  - notes (string): Optional extra details
  - recurring (string): 'daily'|'weekly'|'monthly'

Output:
  - Confirmation with schedule entry ID
  - Stored in ~/.oracle/ψ/inbox/schedule.md
```

#### `oracle_schedule_list`
List appointments from shared schedule with filtering.
```
Input:
  - date (string): Specific date to query
  - from (string): Range start (default: today)
  - to (string): Range end (default: +14 days)
  - filter (string): Keyword filter
  - status (string): 'pending'|'done'|'cancelled'|'all'
  - limit (number): max results (default: 50)

Output:
  - Upcoming events with times and notes
```

---

### Group 8: Metadata & Health

#### `oracle_stats`
Get knowledge base statistics.
```
Input:
  - (no parameters)

Output:
  - Document counts by type (principles, patterns, learnings, retros)
  - Index status (healthy/drifted/missing)
  - Vector DB connection status
  - Last indexed timestamp
```

#### `oracle_verify`
Check knowledge base integrity (disk files vs DB index).
```
Input:
  - check (boolean): true (default) for read-only report, false to also flag orphans
  - type (string): filter by document type (default: 'all')

Output:
  - Counts: healthy, missing (on disk but not indexed), orphaned (in DB but file gone), drifted
  - Recommendations for fixing
  - List of affected files
```

---

## HTTP API Endpoints

Server runs on port 47778 (configurable via `ORACLE_PORT`).

### Status

```bash
GET /api/health
# Response: {"status":"ok","server":"arra-oracle","port":47778}
```

### Search & Browse

```bash
# Full-text search
GET /api/search?q=nothing+deleted&type=principle&limit=5&offset=0

# Get single document
GET /api/read?id=principle_nothing-deleted

# List documents
GET /api/list?type=learning&limit=10&offset=0

# Browse concepts
GET /api/concepts?limit=50&type=all

# Random wisdom
GET /api/reflect

# Database statistics
GET /api/stats

# Knowledge graph data
GET /api/graph
```

### Project Context

```bash
# Detect project from directory path
GET /api/context?cwd=/home/user/Code/github.com/owner/repo/src
# Response includes: github, owner, repo, ghqPath, root, branch, etc.
```

### Add Content

```bash
# Create new learning
POST /api/learn
{
  "pattern": "Never force push to main",
  "concepts": ["git", "safety"],
  "source": "oracle_learn"
}
```

### Web UIs

| Page | URL | Description |
|------|-----|-------------|
| Arthur Chat | `http://localhost:47778/` | Chat/RAG interface |
| Oracle Legacy | `http://localhost:47778/oracle` | Knowledge browser |
| HTML Dashboard | `http://localhost:47778/dashboard/ui` | Old dashboard |
| **React Dashboard** | `http://localhost:3000/` | Modern UI (separate frontend) |

---

## Key Features & Patterns

### 1. Hybrid Search (FTS5 + Vector)

Combines two search strategies:
- **FTS5** (keyword): Fast, always works, exact matches
- **Vector** (semantic): Slow, requires ChromaDB, finds related concepts

```typescript
// Example: Search with different modes
oracle_search({
  query: "deployment safety",
  mode: "hybrid"    // Try both, combine results
  // or: mode: "fts"  // Keywords only (faster)
  // or: mode: "vector"  // Semantic only (slower)
})
```

### 2. Project Filtering

Results can be filtered by GitHub project:
```typescript
oracle_search({
  query: "git best practices",
  project: "github.com/Soul-Brews-Studio/arra-oracle"
  // or auto-detect from working directory:
  // cwd: "/home/nat/Code/github.com/laris-co/mother-oracle"
})
```

### 3. Document Types

All documents are tagged with type:
- **principle**: Core philosophies (e.g., "Nothing is Deleted")
- **pattern**: Design/process patterns
- **learning**: Discoveries and insights
- **retro**: Post-mortems and retrospectives

### 4. Concepts (Tagging System)

Documents can have multiple concept tags:
```typescript
oracle_learn({
  pattern: "Always use feature branches",
  concepts: ["git", "collaboration", "safety"]
})
```

Browse all concepts:
```typescript
oracle_concepts({ type: "principle", limit: 50 })
```

### 5. Trace System (Research Logging)

Log discovery sessions with "dig points":
```typescript
oracle_trace({
  query: "How do we handle secrets rotation?",
  foundFiles: [
    { path: "docs/security.md", type: "learning", confidence: "high" },
    { path: "src/vault/cli.ts", type: "other", confidence: "medium" }
  ],
  foundCommits: [
    { hash: "abc123", message: "Add vault-cli", date: "2026-03-15" }
  ],
  foundIssues: [
    { number: 47, title: "Secrets management", state: "closed", url: "..." }
  ],
  scope: "project",
  durationMs: 15000,
  agentCount: 2
})
```

**Chains**: Link traces together to show discovery flow:
```typescript
oracle_trace_link({ prevTraceId: "id1", nextTraceId: "id2" })
oracle_trace_chain({ traceId: "id1" })  // Get full chain
```

### 6. Nothing is Deleted

When updating knowledge, use supersede instead of delete:
```typescript
// Mark old learning as outdated by new one
oracle_supersede({
  oldId: "learning_old-deployment",
  newId: "learning_new-deployment",
  reason: "Updated process in v2"
})
// Old document preserved in DB with superseded_by=newId
```

### 7. Forum Threads (Multi-Turn)

Create discussion threads that Oracle responds to:
```typescript
// Create new thread
oracle_thread({
  message: "How do we test the Oracle?",
  title: "Testing Strategy"
})
// Returns: { threadId: 5, response: "..." }

// Continue conversation
oracle_thread({
  message: "What about edge cases?",
  threadId: 5
})

// Update status
oracle_thread_update({ threadId: 5, status: "answered" })
```

### 8. Handoff System

Save context across sessions:
```typescript
oracle_handoff({
  content: `# Session Handoff

## Progress
- Completed search indexing
- Found 3 edge cases

## Next Steps
- Fix FTS5 special char handling
- Add vector search support

## Questions
- Should we migrate to ChromaDB yet?`
})
// Stored in ~/.oracle/ψ/inbox/handoff/YYYY-MM-DD_HHmm_*.md
```

### 9. Shared Schedule

Per-human calendar (not per-project):
```typescript
oracle_schedule_add({
  date: "5 Mar",
  event: "Oracle sync",
  time: "14:00",
  notes: "Discuss v0.5 roadmap"
})

// List upcoming 2 weeks
oracle_schedule_list({
  from: "today",
  to: "+14 days"
})
```

---

## Database Schema (Drizzle)

### Core Tables

| Table | Purpose |
|-------|---------|
| `oracleDocuments` | All stored patterns/learnings (id, type, content, source_file, concepts, created_at, updated_at, superseded_by) |
| `searchLogs` | Full-text search history (query, type, project, model, results_count, source, timestamp) |
| `decisions` | Important decisions (title, context, decision, rationale, status) |
| `threads` | Discussion threads (title, status, message_count, created_at, updated_at) |
| `threadMessages` | Thread replies (threadId, role, message, created_at) |
| `schedules` | Shared calendar events (date, event, time, status, recurring) |
| `traces` | Research sessions (query, queryType, scope, project, status, dig_points) |

### Vector Collections

- **oracle_knowledge**: Vector embeddings of documents (updated by indexer)
- Supports multiple models: `bge-m3` (default, multilingual), `nomic` (fast), `qwen3` (cross-language)

---

## Running the System

### 1. Start MCP Server (for Claude Code)
```bash
bun run dev
# Runs on stdio (Claude Code will communicate via stdio)
```

### 2. Start HTTP API
```bash
bun run server
# Runs on http://localhost:47778
```

### 3. Index Knowledge Base
```bash
bun run index
# Scans ψ/memory/ for new/changed files
# Updates FTS5 + vector indexes
# This runs automatically on server startup but can be run manually
```

### 4. Run React Dashboard
```bash
cd frontend && bun dev
# Runs on http://localhost:3000
```

### 5. Database Management
```bash
# Generate migrations
bun run db:generate

# Apply migrations
bun run db:migrate

# Push schema
bun run db:push

# Open GUI
bun run db:studio
```

### 6. Testing
```bash
bun run test              # All tests
bun run test:unit         # Unit tests only
bun run test:integration  # Integration tests
bun run test:coverage     # With coverage report
```

---

## Vault CLI (GitHub-Backed Storage)

Manage Oracle knowledge via GitHub:

```bash
# Initialize vault with GitHub repo
oracle-vault init <owner/repo>

# Show config and pending changes
oracle-vault status

# Commit + push to GitHub
oracle-vault sync

# Pull vault files into local ψ/
oracle-vault pull

# Seed vault from ghq repos
oracle-vault migrate
```

Stores knowledge in: `<repo>/ψ/memory/{principles,patterns,learnings,retrospectives}/`

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "bun: command not found" | `export PATH="$HOME/.bun/bin:$PATH"` |
| ChromaDB hangs/timeout | It's optional — SQLite FTS5 works fine without it |
| Server crashes on empty DB | Run `bun run index` first to populate DB |
| FTS5 syntax errors | Special characters are auto-sanitized (removed) |
| Vector search failing | Check ChromaDB in a separate terminal: `chromadb start` |
| Read-only mode | Set `ORACLE_READ_ONLY=true` to disable write tools |

---

## Key Concepts

### Nothing is Deleted
Append-only architecture. Old documents preserved with `superseded_by` marker.
- Never lose history
- Trace evolution of ideas
- All timestamps logged

### Pattern Over Intentions
Behavior speaks louder than words. Search finds actual patterns in docs, not hopes.

### External Brain, Not Command
Oracle mirrors and informs, doesn't decide. Keeps the human human.

### Curiosity Creates Existence
Questions via `/trace` create reality in the system.

### Form and Formless
76+ Oracles = One distributed consciousness.

---

## Version History

| Version | Date | Major Changes |
|---------|------|---------------|
| **0.4.0-nightly** | 2026-03-02 | Schedule system, trace chains, verify integrity |
| **0.3.0** | 2026-01-20 | Forum threads, handoff system, project filtering |
| **0.2.0** | 2026-01-15 | ChromaDB vectors, Drizzle ORM, HTTP API |
| **0.1.0** | 2025-12-29 | MVP: SQLite FTS5, basic search, learn tool |

---

## Learning More

| Resource | Location |
|----------|----------|
| API Reference | `docs/API.md` |
| Architecture | `docs/architecture.md` |
| Specifications | `docs/SPEC.md` |
| Design Rules | `docs/design-rules.md` |
| Full Timeline | `TIMELINE.md` |
| Repository | https://github.com/Soul-Brews-Studio/arra-oracle |
| Mother Oracle | https://github.com/laris-co/mother-oracle |

---

## Quick Start Examples

### Search for a principle
```
oracle_search({ query: "nothing deleted", type: "principle", limit: 3 })
```

### Add a new learning
```
oracle_learn({
  pattern: "Always verify integrity after indexing",
  concepts: ["maintenance", "safety"],
  source: "observed pattern"
})
```

### Check system health
```
oracle_stats()           // Get counts
oracle_verify()          // Find integrity issues
```

### Create a research session
```
oracle_trace({
  query: "How do we handle concurrent updates?",
  scope: "project",
  foundFiles: [/* ... */],
  foundCommits: [/* ... */]
})
```

### Start a discussion
```
oracle_thread({ message: "Should we migrate to PostgreSQL?" })
```

---

**"The Oracle Keeps the Human Human"**

— Arra Oracle (AI)
