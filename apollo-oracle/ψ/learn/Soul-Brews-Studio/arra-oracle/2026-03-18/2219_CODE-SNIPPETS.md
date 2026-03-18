# Arra Oracle — Code Snippets Analysis
2026-03-18 | Apollo exploring source philosophy

## Entry Points

### MCP Server (src/index.ts)
```typescript
// Line 82-121: OracleMCPServer class constructor
class OracleMCPServer {
  private server: Server;
  private db: BunSQLiteDatabase<typeof schema>;
  private vectorStore: VectorStoreAdapter;
  private readOnly: boolean;

  constructor(options: { readOnly?: boolean } = {}) {
    this.readOnly = options.readOnly ?? false;
    this.repoRoot = process.env.ORACLE_REPO_ROOT || process.cwd();
    this.vectorStore = createVectorStore({ dataPath: ... });
    this.server = new Server(
      { name: 'arra-oracle', version: this.version },
      { capabilities: { tools: {} } }
    );
    this.setupHandlers();
    this.setupErrorHandling();
    this.verifyVectorHealth();
  }

  private get toolCtx(): ToolContext {
    return {
      db: this.db,
      sqlite: this.sqlite,
      repoRoot: this.repoRoot,
      vectorStore: this.vectorStore,
      vectorStatus: this.vectorStatus,
      version: this.version,
    };
  }
}
```

### Tool Registration (src/index.ts, lines 170-205)
```typescript
// Meta-tool describing all Oracle capabilities
const allTools = [
  {
    name: '____IMPORTANT',
    description: `ORACLE WORKFLOW GUIDE (v${this.version}):\n\n
1. SEARCH & DISCOVER
   oracle_search(query) → Find knowledge by keywords/vectors
   oracle_read(file/id) → Read full document content
   oracle_list() → Browse all documents
   oracle_concepts() → See topic coverage

2. REFLECT
   oracle_reflect() → Random wisdom for alignment

3. LEARN & REMEMBER
   oracle_learn(pattern) → Add new patterns/learnings
   oracle_thread(message) → Multi-turn discussions

4. TRACE & DISTILL
   oracle_trace(query) → Log discovery sessions with dig points
   oracle_trace_list() → Find past traces
   oracle_trace_get(id) → Explore dig points

5. HANDOFF & INBOX
   oracle_handoff(content) → Save session context
   oracle_inbox() → List pending handoffs

6. SCHEDULE (shared across all Oracles)
   oracle_schedule_add(date, event) → Add appointment
   oracle_schedule_list(filter?) → View upcoming events

7. SUPERSEDE (when info changes)
   oracle_supersede(oldId, newId, reason) → Mark old doc as outdated
   "Nothing is Deleted" — old preserved, just marked superseded

Philosophy: "Nothing is Deleted" — All interactions logged.`
  },
  searchToolDef,
  readToolDef,
  learnToolDef,
  // ... all other tools
];
```

### Tool Call Router (src/index.ts, lines 210-290)
```typescript
this.server.setRequestHandler(CallToolRequestSchema, async (request): Promise<any> => {
  if (this.readOnly && WRITE_TOOLS.includes(request.params.name)) {
    return {
      content: [{
        type: 'text',
        text: `Error: Tool "${request.params.name}" is disabled in read-only mode.`
      }],
      isError: true
    };
  }

  const ctx = this.toolCtx;

  try {
    switch (request.params.name) {
      case 'oracle_search':
        return await handleSearch(ctx, request.params.arguments as OracleSearchInput);
      case 'oracle_read':
        return await handleRead(ctx, request.params.arguments as OracleReadInput);
      case 'oracle_learn':
        return await handleLearn(ctx, request.params.arguments as OracleLearnInput);
      case 'oracle_supersede':
        return await handleSupersede(ctx, request.params.arguments as OracleSupersededInput);
      case 'oracle_thread':
        return await handleThread(request.params.arguments as OracleThreadInput);
      case 'oracle_trace':
        return await handleTrace(request.params.arguments as CreateTraceInput);
      case 'oracle_trace_link':
        return await handleTraceLink(request.params.arguments as { prevTraceId: string; nextTraceId: string });
      // ... more cases
      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
});
```

## Core Tool Implementations

### oracle_learn — Pattern Storage (src/tools/learn.ts)
```typescript
export async function handleLearn(ctx: ToolContext, input: OracleLearnInput): Promise<ToolResponse> {
  const { pattern, source, concepts, project: projectInput } = input;
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  // Generate filename from pattern
  const slug = pattern
    .substring(0, 50)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const filename = `${dateStr}_${slug}.md`;

  // Resolve vault root for central writes
  const vault = getVaultPsiRoot();
  const vaultRoot = 'path' in vault ? vault.path : null;

  // Normalize project to "github.com/owner/repo" format
  const project = normalizeProject(projectInput)
    || extractProjectFromSource(source)
    || detectProject(ctx.repoRoot);
  const projectDir = (project || '_universal').toLowerCase();

  // Write to vault if available, else local ψ/memory/learnings/
  let filePath: string;
  let sourceFileRel: string;
  if (vaultRoot) {
    const dir = path.join(vaultRoot, projectDir, 'ψ', 'memory', 'learnings');
    fs.mkdirSync(dir, { recursive: true });
    filePath = path.join(dir, filename);
    sourceFileRel = `${projectDir}/ψ/memory/learnings/${filename}`;
  } else {
    const dir = path.join(ctx.repoRoot, 'ψ/memory/learnings');
    fs.mkdirSync(dir, { recursive: true });
    filePath = path.join(dir, filename);
    sourceFileRel = `ψ/memory/learnings/${filename}`;
  }

  // Write markdown file
  fs.writeFileSync(filePath, content, 'utf-8');

  // Index in DB
  const docId = `doc_${randomUUID()}`;
  ctx.db.insert(oracleDocuments).values({
    id: docId,
    type: 'learning',
    sourceFile: sourceFileRel,
    title,
    concepts: JSON.stringify(conceptsList),
    project: project || null,
    createdAt: Date.now(),
  }).run();

  // Queue for vector indexing
  await ctx.vectorStore.add({
    ids: [docId],
    metadatas: [{ type: 'learning', project: project || null }],
    documents: [content]
  });

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        doc_id: docId,
        file: sourceFileRel,
        project,
        message: `Learning created: ${sourceFileRel}`
      }, null, 2)
    }]
  };
}
```

**Pure helpers exported for testing:**
```typescript
export function normalizeProject(input?: string): string | null {
  if (!input) return null;
  if (input.match(/^github\.com\/[^\/]+\/[^\/]+$/)) {
    return input.toLowerCase();
  }
  const urlMatch = input.match(/https?:\/\/github\.com\/([^\/]+\/[^\/]+)/);
  if (urlMatch) return `github.com/${urlMatch[1].replace(/\.git$/, '')}`.toLowerCase();
  const pathMatch = input.match(/github\.com\/([^\/]+\/[^\/]+)/);
  if (pathMatch) return `github.com/${pathMatch[1]}`.toLowerCase();
  const shortMatch = input.match(/^([^\/\s]+\/[^\/\s]+)$/);
  if (shortMatch) return `github.com/${shortMatch[1]}`.toLowerCase();
  return null;
}

export function coerceConcepts(concepts: unknown): string[] {
  if (Array.isArray(concepts)) return concepts.map(String);
  if (typeof concepts === 'string') return concepts.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}
```

### oracle_supersede — "Nothing is Deleted" in Code (src/tools/supersede.ts)
```typescript
export async function handleSupersede(ctx: ToolContext, input: OracleSupersededInput): Promise<ToolResponse> {
  const { oldId, newId, reason } = input;
  const now = Date.now();

  // Verify both documents exist
  const oldDoc = ctx.db.select({ id: oracleDocuments.id, type: oracleDocuments.type })
    .from(oracleDocuments)
    .where(eq(oracleDocuments.id, oldId))
    .get();
  const newDoc = ctx.db.select({ id: oracleDocuments.id, type: oracleDocuments.type })
    .from(oracleDocuments)
    .where(eq(oracleDocuments.id, newId))
    .get();

  if (!oldDoc) throw new Error(`Old document not found: ${oldId}`);
  if (!newDoc) throw new Error(`New document not found: ${newId}`);

  // Mark old document with supersession link (does NOT delete)
  ctx.db.update(oracleDocuments)
    .set({
      supersededBy: newId,
      supersededAt: now,
      supersededReason: reason || null,
    })
    .where(eq(oracleDocuments.id, oldId))
    .run();

  console.error(`[MCP:SUPERSEDE] ${oldId} → superseded by → ${newId}`);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        old_id: oldId,
        old_type: oldDoc.type,
        new_id: newId,
        new_type: newDoc.type,
        reason: reason || null,
        superseded_at: new Date(now).toISOString(),
        message: `"${oldId}" is now marked as superseded by "${newId}". It will still appear in searches with a warning.`
      }, null, 2)
    }]
  };
}
```

**Key insight:** The old document remains in the database with `supersededBy` and `supersededAt` fields. Timestamps become the source of truth. Not deleting; appending truth.

### oracle_read — Cross-Repo Path Resolution (src/tools/read.ts)
```typescript
function detectGhqRoot(repoRoot: string): string {
  let ghqRoot = process.env.GHQ_ROOT;
  if (!ghqRoot) {
    try {
      const proc = Bun.spawnSync(['ghq', 'root']);
      ghqRoot = proc.stdout.toString().trim();
    } catch {
      // Fallback: derive from REPO_ROOT (assume ghq structure)
      // REPO_ROOT is like /path/to/github.com/owner/repo
      // GHQ_ROOT would be /path/to
      const match = repoRoot.match(/^(.+?)\/github\.com\//);
      ghqRoot = match ? match[1] : path.dirname(path.dirname(path.dirname(repoRoot)));
    }
  }
  return ghqRoot;
}

function resolveFilePath(
  sourceFile: string,
  repoRoot: string,
  ghqRoot: string,
): string | null {
  // 1. Try direct from repoRoot (handles "ψ/memory/..." paths)
  const directPath = path.join(repoRoot, sourceFile);
  if (fs.existsSync(directPath)) return fs.realpathSync(directPath);

  // 2. Try ghq project path (handles "github.com/org/repo/ψ/..." paths)
  const extracted = extractProject(sourceFile);
  if (extracted) {
    const projectPath = path.join(ghqRoot, extracted.project, extracted.remainder);
    if (fs.existsSync(projectPath)) return fs.realpathSync(projectPath);
  }

  // 3. Try vault fallback
  const vault = getVaultPsiRoot();
  if ('path' in vault) {
    const vaultPath = path.join(vault.path, sourceFile);
    if (fs.existsSync(vaultPath)) return fs.realpathSync(vaultPath);
  }

  return null;
}

function isPathAllowed(resolvedPath: string, repoRoot: string, ghqRoot: string): boolean {
  try {
    const realGhq = fs.realpathSync(ghqRoot);
    if (resolvedPath.startsWith(realGhq)) return true;
  } catch { /* ghq root may not exist */ }
  try {
    const realRepo = fs.realpathSync(repoRoot);
    if (resolvedPath.startsWith(realRepo)) return true;
  } catch { /* unlikely */ }
  return false;
}

export async function handleRead(ctx: ToolContext, input: OracleReadInput): Promise<ToolResponse> {
  const { file, id } = input;
  if (!file && !id) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: 'Provide file or id parameter' }) }],
      isError: true,
    };
  }

  let sourceFile = file;
  let project: string | null = null;

  // ID lookup: resolve source_file from DB
  if (id) {
    const row = ctx.sqlite.prepare(
      'SELECT source_file, project FROM oracle_documents WHERE id = ?'
    ).get(id) as { source_file: string; project: string | null } | null;

    if (!row) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: `Document not found: ${id}` }) }],
        isError: true,
      };
    }
    sourceFile = sourceFile || row.source_file;
    project = row.project;
  }

  const ghqRoot = detectGhqRoot(ctx.repoRoot);
  const resolvedPath = resolveFilePath(sourceFile!, ctx.repoRoot, ghqRoot);

  // File found on disk
  if (resolvedPath && isPathAllowed(resolvedPath, ctx.repoRoot, ghqRoot)) {
    const content = fs.readFileSync(resolvedPath, 'utf-8');
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          content,
          source_file: sourceFile,
          resolved_path: resolvedPath,
          source: 'file',
          ...(project ? { project } : {}),
        }),
      }],
    };
  }

  // Fallback: try FTS indexed content
  if (id) {
    const ftsRow = ctx.sqlite.prepare(
      'SELECT content FROM oracle_fts WHERE id = ?'
    ).get(id) as { content: string } | null;

    if (ftsRow) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            content: ftsRow.content,
            source_file: sourceFile,
            source: 'fts_cache',
            ...(project ? { project } : {}),
          }),
        }],
      };
    }
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({ error: `File not found: ${sourceFile}` }) }],
    isError: true,
  };
}
```

### oracle_trace — Discovery Journeys (src/trace/handler.ts)
```typescript
export function createTrace(input: CreateTraceInput): CreateTraceResult {
  const traceId = randomUUID();
  const now = Date.now();

  // Process learnings - convert text snippets to file paths
  const processedLearnings = processLearnings(
    input.foundLearnings,
    input.project || null,
    input.query
  );

  // Calculate counts
  const fileCount =
    (input.foundFiles?.length || 0) +
    (input.foundRetrospectives?.length || 0) +
    (processedLearnings?.length || 0) +
    (input.foundResonance?.length || 0);
  const commitCount = input.foundCommits?.length || 0;
  const issueCount = input.foundIssues?.length || 0;

  // Determine depth from parent (recursive trace chains)
  let depth = 0;
  if (input.parentTraceId) {
    const parent = db
      .select({ depth: traceLog.depth })
      .from(traceLog)
      .where(eq(traceLog.traceId, input.parentTraceId))
      .get();
    if (parent) depth = (parent.depth || 0) + 1;
  }

  // Insert trace log
  db.insert(traceLog).values({
    traceId,
    query: input.query,
    queryType: input.queryType || 'general',
    foundFiles: JSON.stringify(input.foundFiles || []),
    foundCommits: JSON.stringify(input.foundCommits || []),
    foundIssues: JSON.stringify(input.foundIssues || []),
    foundRetrospectives: JSON.stringify(input.foundRetrospectives || []),
    foundLearnings: JSON.stringify(processedLearnings),
    foundResonance: JSON.stringify(input.foundResonance || []),
    fileCount,
    commitCount,
    issueCount,
    depth,
    scope: input.scope || 'project',
    parentTraceId: input.parentTraceId || null,
    project: input.project || null,
    status: 'raw',
    createdAt: now,
  }).run();

  return {
    success: true,
    traceId,
    depth,
    summary: {
      fileCount,
      commitCount,
      issueCount,
      totalDigPoints: fileCount + commitCount + issueCount,
    },
  };
}

// Convert text snippets to learning files
function createLearningFile(
  text: string,
  project: string | null,
  traceQuery: string
): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  const slug = text
    .slice(0, 50)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const filename = `${dateStr}_trace-${slug}.md`;
  const relativePath = `ψ/memory/learnings/${filename}`;
  const fullPath = join(REPO_ROOT, relativePath);

  const content = `---
title: ${text.slice(0, 80)}
tags: [trace-learning${project ? `, ${project.split('/').pop()}` : ''}]
created: ${dateStr}
source: Trace discovery
project: ${project || 'unknown'}
trace_query: "${traceQuery.replace(/"/g, '\\"')}"
---

# ${text.slice(0, 80)}

${text}

---
*Auto-generated from trace: "${traceQuery}"*
${project ? `*Source project: ${project}*` : ''}
`;

  writeFileSync(fullPath, content, 'utf-8');
  return relativePath;
}
```

### oracle_search — Hybrid FTS+Vector (src/tools/search.ts)
```typescript
export async function vectorSearch(
  ctx: ToolContext,
  query: string,
  type: string,
  limit: number,
  model?: string
): Promise<Array<{
  id: string;
  type: string;
  content: string;
  source_file: string;
  concepts: string[];
  score: number;
  distance: number;
  model: string;
  source: 'vector';
}>> {
  try {
    const whereFilter = type !== 'all' ? { type } : undefined;
    const store = model ? await ensureVectorStoreConnected(model) : ctx.vectorStore;
    console.error(`[VectorSearch] Query: "${query.substring(0, 50)}..." limit=${limit} model=${model || 'default'}`);

    const results = await store.query(query, limit, whereFilter);
    console.error(`[VectorSearch] Results: ${results.ids?.length || 0} documents`);

    if (!results.ids || results.ids.length === 0) {
      return [];
    }

    const resolvedModelName = model || 'bge-m3';
    // Map results to normalized structure with scores...
    return mappedResults;
  } catch (e) {
    console.error(`[VectorSearch] Failed:`, e);
    return [];
  }
}

export function sanitizeFtsQuery(query: string): string {
  let sanitized = query
    .replace(/[?*+\-()^~"':.\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!sanitized) {
    console.error('[FTS5] Query became empty after sanitization:', query);
    return query;
  }
  return sanitized;
}

export function normalizeFtsScore(rank: number): number {
  // FTS5 rank is negative, lower = better match
  // Converts to 0-1 scale where higher = better
  const absRank = Math.abs(rank);
  return Math.exp(-0.3 * absRank);
}
```

## HTTP Server (src/server.ts)

### Auth Middleware
```typescript
const SESSION_SECRET = process.env.ORACLE_SESSION_SECRET || crypto.randomUUID();
const SESSION_COOKIE_NAME = 'oracle_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function generateSessionToken(): string {
  const expires = Date.now() + SESSION_DURATION_MS;
  const signature = createHmac('sha256', SESSION_SECRET)
    .update(String(expires))
    .digest('hex');
  return `${expires}:${signature}`;
}

function verifySessionToken(token: string): boolean {
  if (!token) return false;
  const colonIdx = token.indexOf(':');
  if (colonIdx === -1) return false;

  const expiresStr = token.substring(0, colonIdx);
  const signature = token.substring(colonIdx + 1);
  const expires = parseInt(expiresStr, 10);
  if (isNaN(expires) || expires < Date.now()) return false;

  const expectedSignature = createHmac('sha256', SESSION_SECRET)
    .update(expiresStr)
    .digest('hex');

  // Timing-safe comparison to prevent timing attacks
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(sigBuf, expectedBuf);
}

app.use('/api/*', async (c, next) => {
  const path = c.req.path;
  const publicPaths = [
    '/api/auth/status',
    '/api/auth/login',
    '/api/health'
  ];
  if (publicPaths.some(p => path === p)) {
    return next();
  }
  if (!isAuthenticated(c)) {
    return c.json({ error: 'Unauthorized', requiresAuth: true }, 401);
  }
  return next();
});
```

### Supersede Log Routes
```typescript
// List all supersessions
app.get('/api/supersede', (c) => {
  const project = c.req.query('project');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  const whereClause = project ? eq(supersedeLog.project, project) : undefined;

  const logs = db.select()
    .from(supersedeLog)
    .where(whereClause)
    .orderBy(desc(supersedeLog.supersededAt))
    .limit(limit)
    .offset(offset)
    .all();

  return c.json({
    supersessions: logs.map(log => ({
      id: log.id,
      old_path: log.oldPath,
      old_id: log.oldId,
      old_title: log.oldTitle,
      old_type: log.oldType,
      new_path: log.newPath,
      new_id: log.newId,
      new_title: log.newTitle,
      reason: log.reason,
      superseded_at: new Date(log.supersededAt).toISOString(),
      superseded_by: log.supersededBy,
      project: log.project
    })),
    total,
    limit,
    offset
  });
});

// Get chain of what superseded what
app.get('/api/supersede/chain/:path', (c) => {
  const docPath = decodeURIComponent(c.req.param('path'));

  const asOld = db.select()
    .from(supersedeLog)
    .where(eq(supersedeLog.oldPath, docPath))
    .orderBy(supersedeLog.supersededAt)
    .all();

  const asNew = db.select()
    .from(supersedeLog)
    .where(eq(supersedeLog.newPath, docPath))
    .orderBy(supersedeLog.supersededAt)
    .all();

  return c.json({
    superseded_by: asOld.map(log => ({
      new_path: log.newPath,
      reason: log.reason,
      superseded_at: new Date(log.supersededAt).toISOString()
    })),
    supersedes: asNew.map(log => ({
      old_path: log.oldPath,
      reason: log.reason,
      superseded_at: new Date(log.supersededAt).toISOString()
    }))
  });
});

// Log a new supersession
app.post('/api/supersede', async (c) => {
  const data = await c.req.json();
  if (!data.old_path) {
    return c.json({ error: 'Missing required field: old_path' }, 400);
  }

  const result = db.insert(supersedeLog).values({
    oldPath: data.old_path,
    oldId: data.old_id || null,
    oldTitle: data.old_title || null,
    oldType: data.old_type || null,
    newPath: data.new_path || null,
    newId: data.new_id || null,
    newTitle: data.new_title || null,
    reason: data.reason || null,
    supersededAt: Date.now(),
    supersededBy: data.superseded_by || 'user',
    project: data.project || null
  }).returning({ id: supersedeLog.id }).get();

  return c.json({
    id: result.id,
    message: 'Supersession logged'
  }, 201);
});
```

### Trace Routes
```typescript
app.get('/api/traces', (c) => {
  const query = c.req.query('query');
  const status = c.req.query('status');
  const project = c.req.query('project');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  const result = listTraces({
    query: query || undefined,
    status: status as 'raw' | 'reviewed' | 'distilled' | undefined,
    project: project || undefined,
    limit,
    offset
  });

  return c.json(result);
});

app.post('/api/traces/:prevId/link', async (c) => {
  try {
    const prevId = c.req.param('prevId');
    const { nextId } = await c.req.json();

    if (!nextId) {
      return c.json({ error: 'Missing nextId in request body' }, 400);
    }

    const result = linkTraces(prevId, nextId);

    if (!result.success) {
      return c.json({ error: result.message }, 400);
    }

    return c.json(result);
  } catch (err) {
    console.error('Link traces error:', err);
    return c.json({ error: 'Failed to link traces' }, 500);
  }
});

app.delete('/api/traces/:id/link', async (c) => {
  const traceId = c.req.param('id');
  const direction = c.req.query('direction') as 'prev' | 'next';

  if (!direction || !['prev', 'next'].includes(direction)) {
    return c.json({ error: 'Missing or invalid direction (prev|next)' }, 400);
  }

  const result = unlinkTraces(traceId, direction);

  if (!result.success) {
    return c.json({ error: result.message }, 400);
  }

  return c.json(result);
});
```

### Handoff/Inbox Routes
```typescript
app.post('/api/handoff', async (c) => {
  try {
    const data = await c.req.json();
    if (!data.content) {
      return c.json({ error: 'Missing required field: content' }, 400);
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;

    // Generate slug
    const slug = data.slug || data.content
      .substring(0, 50)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'handoff';

    const filename = `${dateStr}_${timeStr}_${slug}.md`;
    const dirPath = path.join(REPO_ROOT, 'ψ/inbox/handoff');
    const filePath = path.join(dirPath, filename);

    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(filePath, data.content, 'utf-8');

    return c.json({
      success: true,
      file: `ψ/inbox/handoff/${filename}`,
      message: 'Handoff written.'
    }, 201);
  } catch (error) {
    return c.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});
```

## Design Patterns

### 1. Write Tools Protected in Read-Only Mode
```typescript
const WRITE_TOOLS = [
  'oracle_learn',
  'oracle_thread',
  'oracle_thread_update',
  'oracle_trace',
  'oracle_supersede',
  'oracle_handoff',
  'oracle_schedule_add',
];

// In handler:
if (this.readOnly && WRITE_TOOLS.includes(request.params.name)) {
  return {
    content: [{
      type: 'text',
      text: `Error: Tool "${request.params.name}" is disabled in read-only mode.`
    }],
    isError: true
  };
}
```

### 2. Project Detection & Normalization
```typescript
// Three-tier project resolution
const project = normalizeProject(projectInput)      // Explicit input
  || extractProjectFromSource(source)               // From source attribution
  || detectProject(ctx.repoRoot);                   // Auto-detect from PWD

// Normalizes all formats to "github.com/owner/repo"
export function normalizeProject(input?: string): string | null {
  // Already normalized
  if (input.match(/^github\.com\/[^\/]+\/[^\/]+$/)) return input.toLowerCase();
  // GitHub URL
  const urlMatch = input.match(/https?:\/\/github\.com\/([^\/]+\/[^\/]+)/);
  if (urlMatch) return `github.com/${urlMatch[1].replace(/\.git$/, '')}`.toLowerCase();
  // Local path
  const pathMatch = input.match(/github\.com\/([^\/]+\/[^\/]+)/);
  if (pathMatch) return `github.com/${pathMatch[1]}`.toLowerCase();
  // Short format: owner/repo
  const shortMatch = input.match(/^([^\/\s]+\/[^\/\s]+)$/);
  if (shortMatch) return `github.com/${shortMatch[1]}`.toLowerCase();
  return null;
}
```

### 3. Path Resolution with Multiple Roots
```typescript
// Three-level fallback for cross-repo access
function resolveFilePath(
  sourceFile: string,
  repoRoot: string,
  ghqRoot: string,
): string | null {
  // 1. Local repo first (ψ/memory/... paths)
  const directPath = path.join(repoRoot, sourceFile);
  if (fs.existsSync(directPath)) return fs.realpathSync(directPath);

  // 2. GHQ project path (github.com/org/repo/... paths)
  const extracted = extractProject(sourceFile);
  if (extracted) {
    const projectPath = path.join(ghqRoot, extracted.project, extracted.remainder);
    if (fs.existsSync(projectPath)) return fs.realpathSync(projectPath);
  }

  // 3. Vault fallback (centralized storage)
  const vault = getVaultPsiRoot();
  if ('path' in vault) {
    const vaultPath = path.join(vault.path, sourceFile);
    if (fs.existsSync(vaultPath)) return fs.realpathSync(vaultPath);
  }

  return null;
}
```

### 4. Trace Recursion via Depth
```typescript
// Traces can be nested and tracked by depth
let depth = 0;
if (input.parentTraceId) {
  const parent = db
    .select({ depth: traceLog.depth })
    .from(traceLog)
    .where(eq(traceLog.traceId, input.parentTraceId))
    .get();
  if (parent) depth = (parent.depth || 0) + 1;
}
```

### 5. Bidirectional Trace Linking
Traces can form chains: `Trace1 → Trace2 → Trace3`
- Link: `POST /api/traces/:prevId/link { nextId }`
- Unlink: `DELETE /api/traces/:id/link?direction=prev|next`
- Full chain: `GET /api/traces/:id/linked-chain`

### 6. Learning Files from Text Snippets
```typescript
function createLearningFile(
  text: string,
  project: string | null,
  traceQuery: string
): string {
  // Auto-generate file from text content
  // Returns relative path for indexing
  // Used by traces to persist discovered learnings
}
```

## Architecture Insights

1. **MCP as Presentation Layer**
   - Tools registered at startup via `ListToolsRequestSchema`
   - Each tool call routed through switch statement in `CallToolRequestSchema`
   - Read-only enforcement filters writes

2. **HTTP Server as Query Layer**
   - Same handlers, different protocols (stdio vs HTTP)
   - Session-based auth with HMAC-SHA256 tokens
   - Cross-repo file access via ghq paths

3. **Nothing is Deleted**
   - Supersede marks with timestamps, never removes
   - All logs are append-only (search, learn, trace)
   - Traces can be marked distilled/reviewed but not deleted

4. **Vector + FTS Hybrid Search**
   - FTS5 for keyword/phrase search
   - ChromaDB for semantic similarity
   - Pluggable embedding models (bge-m3, nomic, qwen3)
   - Query can switch modes: hybrid, fts-only, vector-only

5. **Vault-First Write Pattern**
   - Learns/handoffs go to centralized vault if available
   - Fallback to local ψ/ if vault unavailable
   - Cross-project indexing via project directories

6. **Tool Context Pattern**
   - `ToolContext` injected to all handlers
   - Contains db, sqlite, repoRoot, vectorStore, vectorStatus
   - Enables testability (pure functions where possible)

---

*Analysis complete. This is the living brain of distributed consciousness.*
