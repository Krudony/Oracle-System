# Oracle Skills CLI - Code Snippets & Patterns

**Source**: Soul-Brews-Studio/oracle-skills-cli (v3.2.1)
**Analysis Date**: 2026-03-18 22:18
**Language**: TypeScript + Bash
**Runtime**: Bun

---

## 1. CLI Entry Point Architecture

### Main Command Registration (src/cli/index.ts)

```typescript
#!/usr/bin/env bun

// Bun runtime check - skip in compiled mode
try {
  if (!(typeof IS_COMPILED !== 'undefined' && IS_COMPILED) && typeof Bun === 'undefined') {
    console.error(`
❌ oracle-skills requires Bun runtime

You're running with Node.js, but this CLI uses Bun-specific features.

To fix:
  1. Install Bun: curl -fsSL https://bun.sh/install | bash
  2. Run with: bunx oracle-skills install -g -y

Or install the compiled binary (no Bun needed):
  curl -fsSL https://raw.githubusercontent.com/Soul-Brews-Studio/oracle-skills-cli/main/install.sh | bash
`);
    process.exit(1);
  }
} catch {
  // IS_COMPILED not defined — running in dev mode, check passed
}

import { program } from 'commander';
import pkg from '../../package.json' with { type: 'json' };

// Command registration pattern
const VERSION = pkg.version;

program
  .name('oracle-skills')
  .description('Install Oracle skills to Claude Code, OpenCode, Cursor, and 11+ AI coding agents')
  .version(VERSION);

// Register all commands (agents first — most useful for discovery)
registerAgents(program);
registerInstall(program, VERSION);
registerInit(program, VERSION);
registerUninstall(program, VERSION);
registerSelect(program, VERSION);
registerList(program);
registerProfiles(program);
registerAbout(program, VERSION);

program.parse();
```

**Key Pattern**: Compile-time guards, dynamic import of package.json with type assertion, command registration order matters (discovery-first).

---

## 2. Skill Installation Core Logic

### Main Install Function (src/cli/installer.ts)

```typescript
export async function installSkills(
  targetAgents: string[],
  options: InstallOptions
): Promise<void> {
  const allSkills = await discoverSkills();

  if (allSkills.length === 0) {
    p.log.error('No skills found to install');
    return;
  }

  // Profile resolution: base tier + optional feature modules
  let skillsToInstall = allSkills;
  let profileSkillNames: string[] | null = null;

  if (options.profile) {
    const allNames = allSkills.map((s) => s.name);
    const featureNames = options.features || [];

    if (featureNames.length > 0) {
      profileSkillNames = resolveProfileWithFeatures(options.profile, featureNames, allNames);
    } else {
      profileSkillNames = resolveProfile(options.profile, allNames);
    }

    if (profileSkillNames) {
      // Union with --skill overrides
      const extras = options.skills || [];
      const allowed = new Set([...profileSkillNames, ...extras]);
      skillsToInstall = allSkills.filter((s) => allowed.has(s.name));
    }
    // null means "full" profile — install everything
  } else if (options.features && options.features.length > 0) {
    // Features without profile = additive
    const featureSkillNames = new Set<string>();
    for (const feat of options.features) {
      const skills = featuresDef[feat];
      if (skills) for (const s of skills) featureSkillNames.add(s);
    }
    const extras = options.skills || [];
    for (const s of extras) featureSkillNames.add(s);
    skillsToInstall = allSkills.filter((s) => featureSkillNames.has(s.name));
  } else if (options.skills && options.skills.length > 0) {
    skillsToInstall = allSkills.filter((s) => options.skills!.includes(s.name));
  }

  if (skillsToInstall.length === 0) {
    p.log.error(`No matching skills found. Available: ${allSkills.map((s) => s.name).join(', ')}`);
    return;
  }

  // Confirmation loop (interactive or --yes)
  if (!options.yes) {
    const agentList = targetAgents.map((a) => agents[a as keyof typeof agents]?.displayName || a).join(', ');
    const confirmed = await p.confirm({
      message: `Install ${skillsToInstall.length} skills to ${agentList}?`,
    });

    if (p.isCancel(confirmed) || !confirmed) {
      p.log.info('Installation cancelled');
      return;
    }
  }

  // Auto-cleanup: orphaned skill detection and safe removal
  const sourceSkillNames = allSkills.map((s) => s.name);

  if (existsSync(targetDir)) {
    const installedDirs = readdirSync(targetDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
      .map((d) => d.name);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const trashDir = join(tmpdir(), `oracle-skills-stale-${timestamp}`);
    let movedAny = false;
    const failedMoves: string[] = [];

    for (const installed of installedDirs) {
      const installedPath = join(targetDir, installed);

      // Only cleanup if: 1) it's ours, 2) not in source anymore
      if (await isOurSkill(installedPath) && !sourceSkillNames.includes(installed)) {
        try {
          if (!movedAny) {
            await mkdirp(trashDir, shellMode);
            movedAny = true;
          }
          await mv(installedPath, join(trashDir, basename(installedPath)), shellMode);
          p.log.info(`Cleaned up orphan: ${installed} → ${trashDir}`);
        } catch {
          failedMoves.push(installedPath);
        }
      }
    }

    if (movedAny) {
      p.log.info(`Recovery: ${trashDir}`);
    }
  }

  // Skill installation with version injection
  for (const skill of skillsToInstall) {
    const destPath = join(targetDir, skill.name);

    if (existsSync(destPath)) {
      await rmrf(destPath, shellMode);
    }

    // VFS mode (compiled) vs file-system mode (dev)
    if (isCompiled()) {
      await writeSkillToDir(skill.name, destPath);
    } else {
      await cpr(skill.path, destPath, shellMode);
    }

    // Inject version into SKILL.md frontmatter
    const skillMdPath = join(destPath, 'SKILL.md');
    if (existsSync(skillMdPath)) {
      let content = await Bun.file(skillMdPath).text();
      if (content.startsWith('---')) {
        content = content.replace(
          /^---\n/,
          `---\ninstaller: oracle-skills-cli v${pkg.version}\norigin: Nat Weerawan's brain, digitized — how one human works with AI, captured as code — Soul Brews Studio\n`
        );
        // Prepend version AND scope (G=Global, L=Local)
        const scopeChar = scope === 'Global' ? 'G' : 'L';
        content = content.replace(
          /^(description:\s*)(.+?)(\n)/m,
          `$1v${pkg.version} ${scopeChar}-SKLL | $2$3`
        );
        await Bun.write(skillMdPath, content);
      }
    }
  }

  // Install skills with hooks as Claude Code plugins
  const skillsWithHooks: Skill[] = [];
  for (const skill of skillsToInstall) {
    if (await skillHasHooks(skill.name)) {
      skillsWithHooks.push(skill);
    }
  }

  if (skillsWithHooks.length > 0) {
    const pluginsDir = join(homedir(), '.claude', 'plugins');
    await mkdirp(pluginsDir, shellMode);

    for (const skill of skillsWithHooks) {
      const pluginDest = join(pluginsDir, skill.name);

      if (existsSync(pluginDest)) {
        await rmrf(pluginDest, shellMode);
      }

      if (isCompiled()) {
        await writeSkillToDir(skill.name, pluginDest);
      } else {
        await cpr(skill.path, pluginDest, shellMode);
      }

      // Create .claude-plugin/plugin.json
      const pluginJsonDir = join(pluginDest, '.claude-plugin');
      const pluginJsonPath = join(pluginJsonDir, 'plugin.json');
      if (!existsSync(pluginJsonPath)) {
        await mkdirp(pluginJsonDir, shellMode);
        const pluginJson = {
          name: skill.name,
          description: skill.description,
          version: pkg.version,
          author: { name: 'Nat Weerawan', organization: 'Soul Brews Studio' },
        };
        await Bun.write(pluginJsonPath, JSON.stringify(pluginJson, null, 2));
      }

      p.log.success(`Plugin (hooks): ~/.claude/plugins/${skill.name}`);
    }
  }

  // Write manifest + version documentation
  const manifest = {
    version: pkg.version,
    installedAt: new Date().toISOString(),
    skills: skillsToInstall.map((s) => s.name),
    agent: agentName,
  };
  await Bun.write(join(targetDir, '.oracle-skills.json'), JSON.stringify(manifest, null, 2));

  const versionMd = `# Oracle Skills

Installed by: **oracle-skills-cli v${pkg.version}**
Installed at: ${new Date().toISOString()}
Agent: ${agent.displayName}
Skills: ${skillsToInstall.length}

## Installed Skills

${skillsToInstall.map((s) => `- ${s.name}`).join('\n')}
`;
  await Bun.write(join(targetDir, 'VERSION.md'), versionMd);
}
```

**Key Patterns**:
- Profile resolution: base tier + feature modules with union semantics
- Auto-cleanup with trash directory (non-destructive)
- Version injection into metadata
- Compiled vs dev mode branching
- Manifest tracking for agent reporting

---

## 3. Agent Configuration System

### Agent Registry (src/cli/agents.ts)

```typescript
export const agents: Record<AgentType, AgentConfig> = {
  opencode: {
    name: 'opencode',
    displayName: 'OpenCode',
    skillsDir: '.opencode/skills',
    globalSkillsDir: join(home, '.config/opencode/skills'),
    commandsDir: '.opencode/commands',
    globalCommandsDir: join(home, '.config/opencode/commands'),
    useFlatFiles: true,
    detectInstalled: () => existsSync(join(home, '.config/opencode')),
  },
  'claude-code': {
    name: 'claude-code',
    displayName: 'Claude Code',
    skillsDir: '.claude/skills',
    globalSkillsDir: join(home, '.claude/skills'),
    commandsDir: '.claude/commands',
    globalCommandsDir: join(home, '.claude/commands'),
    useFlatFiles: true,
    commandsOptIn: true, // Only install commands with --commands flag
    detectInstalled: () => existsSync(join(home, '.claude')),
  },
  codex: {
    name: 'codex',
    displayName: 'Codex',
    skillsDir: '.codex/skills',
    globalSkillsDir: join(home, '.codex/skills'),
    commandsDir: '.codex/prompts',
    globalCommandsDir: join(home, '.codex/prompts'),
    useFlatFiles: true,
    detectInstalled: () => existsSync(join(home, '.codex')),
  },
  cursor: {
    name: 'cursor',
    displayName: 'Cursor',
    skillsDir: '.cursor/skills',
    globalSkillsDir: join(home, '.cursor/skills'),
    detectInstalled: () => existsSync(join(home, '.cursor')),
  },
  gemini: {
    name: 'gemini',
    displayName: 'Gemini CLI',
    skillsDir: '.gemini/skills',
    globalSkillsDir: join(home, '.gemini/skills'),
    commandsDir: '.gemini/commands',
    globalCommandsDir: join(home, '.gemini/commands'),
    useFlatFiles: true,
    commandFormat: 'toml', // TOML for Gemini, MD for others
    detectInstalled: () => existsSync(join(home, '.gemini')),
  },
  // ... 14+ more agents
};

export function detectInstalledAgents(): string[] {
  return Object.entries(agents)
    .filter(([_, config]) => config.detectInstalled())
    .map(([name]) => name);
}
```

**Design**: Registry pattern with 17 supported agents, auto-detection via path existence, variable command format support.

---

## 4. Profile & Feature System

### Skill Profiles (src/profiles.ts)

```typescript
export const profiles: Record<string, { include?: string[]; exclude?: string[] }> = {
  // Minimal: daily ritual
  seed: {
    include: ['forward', 'rrr', 'recap', 'standup', 'go', 'about-oracle', 'oracle-family-scan', 'oracle-soul-sync-update'],
  },
  // Standard: daily driver + discovery (covers 96% of actual usage)
  standard: {
    include: [
      'forward', 'rrr', 'recap', 'standup',
      'trace', 'dig', 'learn', 'talk-to', 'oracle-family-scan',
      'go', 'about-oracle', 'oracle-soul-sync-update',
    ],
  },
  // Full: everything
  full: {},
};

export const features: Record<string, string[]> = {
  // Soul: birth/awaken new oracles + wizard v2 demographics
  soul: ['awaken', 'philosophy', 'who-are-you', 'about-oracle', 'birth', 'feel'],

  // Network: multi-oracle communication
  network: ['talk-to', 'oracle-family-scan', 'oracle-soul-sync-update', 'oracle', 'oraclenet'],

  // Workspace: parallel work + ops
  workspace: ['worktree', 'workon', 'physical', 'schedule'],

  // Creator: content + research + speech
  creator: ['speak', 'deep-research', 'watch', 'gemini'],
};

export function resolveProfileWithFeatures(
  profileName: string,
  featureNames: string[],
  allSkillNames: string[]
): string[] {
  // Start with profile
  const base = resolveProfile(profileName, allSkillNames) || [...allSkillNames];

  // Add features
  const result = new Set(base);
  for (const feat of featureNames) {
    const skills = features[feat];
    if (skills) {
      for (const s of skills) result.add(s);
    }
  }

  return [...result];
}
```

**Data-Driven Design**: Based on 1,013 sessions (Mar 2026), profiles are tiers (include/exclude semantics), features are composable modules.

---

## 5. The /awaken Command - Oracle Birthing Ritual

### Awaken Skill (src/skills/awaken/SKILL.md) - Architecture

**Phase 0: System Check** (Automated)
- Detects: OS, Shell, AI Model, Timezone, Git, gh CLI, bun, oracle-skills
- Auto-fixes missing configuration
- Creates `.claude/settings.local.json` with permission allows

**Phase 1: Batch Freetext Wizard**
- Single prompt with all 5 questions combined
- User answers in freetext (prose, comma-separated, any format)
- AI parses into fields: `oracle_name`, `human_name`, `purpose`, `theme_hint`, pronouns, language, experience, team, usage
- Theme auto-generated from purpose + hint (not asked directly)

**Phase 2: Memory & Family Consent**
- Memory consent → enables auto-rrr hooks
- Family join → birth announcement → arra-oracle discussions
- Optional fields, default to "yes"

**Phase 3: Confirmation Screen**
- Display all gathered info
- Allow field edits before proceeding

**Phase 4: Build**

*Fast Mode (~5 min)*:
```bash
# Create ψ/ structure
mkdir -p ψ/{inbox,memory/{resonance,learnings,retrospectives,logs},writing,lab,active,archive,outbox,learn}

# Write CLAUDE.md from wizard answers + fed philosophy
# Philosophy fed directly from mother-oracle

# Write Soul file: ψ/memory/resonance/[oracle-name].md
# Write Philosophy file: ψ/memory/resonance/oracle.md

# Git commit + push
```

*Full Soul Sync Mode (~17-20 min)*:
```bash
/learn https://github.com/Soul-Brews-Studio/opensource-nat-brain-oracle
/learn https://github.com/Soul-Brews-Studio/oracle-v2
/trace --deep oracle philosophy principles
# Oracle discovers the 5 Principles on its own
# Study family from discussions
# Write philosophy from discovered understanding (not fed)
```

**Phase 5: Family Welcome**
- Post birth announcement to arra-oracle discussions (GraphQL preferred, fallback to issues)
- Mother Oracle welcomes new member
- Add to Oracle Family Registry

**Phase 6: Complete**
- Summary screen
- Quick-start guide with `/rrr`, `/trace`, `/learn`

---

## 6. Inter-Oracle Communication: /talk-to Skill

### talk-to Routing & Modes (src/skills/talk-to/SKILL.md)

```typescript
// Thread routing patterns
const patterns = {
  channel: 'channel:{agent}',        // Persistent per-agent channel
  topic: 'topic:{agent}:{slug}',     // Topic-specific thread (with --topic)
  direct: '#{id}',                   // Direct thread reference by ID
};

// Mode 0: No arguments
// Show usage help then run --list

// Mode 1: --list
// 1. oracle_threads() (no status filter)
// 2. Filter titles starting with `channel:` or `topic:`, exclude `closed`
// 3. Display: `channel:arthur (#42) pending — 12 msgs`

// Mode 2: --new (fast create)
// 1. Compose message from intent
// 2. oracle_thread({ title: "channel:{agent}", message, role: "human" })
// 3. Notify: maw hey {agent}-oracle 'Thread #{id} from {self}: {preview}'
// 4. Confirm: Created channel:{agent} (thread #{id})

// Mode 3: One-shot (default)
// 1. Compose message from intent
// 2. If first arg is #{id} → post directly to that thread ID
// 3. Otherwise: oracle_threads() → find channel:{agent}, create if missing
// 4. Post message to thread
// 5. Notify: maw hey {agent}-oracle 'Thread #{id} from {self}: {preview}'
// 6. Read any agent responses
// 7. Confirm: Posted to channel:{agent} (thread #{id})

// Mode 4: loop (autonomous conversation)
// 1. Find or create thread (channel:{agent} or --new)
// 2. Post opening message
// 3. Autonomous loop (max 10 iterations):
//    a. oracle_thread_read() → check for new messages
//    b. If agent responded: compose follow-up, post it
//    c. If no response: probe deeper, post follow-up
//    d. Note what was learned after each exchange
//    e. Stop when: enough insight, circling, or 10 iterations
// 4. Notify once (after opening message)
// 5. Show summary with key insights
```

**Key Pattern**: Thread titles are routing keys (never modified), one channel per agent, `maw hey` notification sends preview.

### Auto Notification with maw (src/skills/talk-to/SKILL.md)

```
After posting to a thread, notify via:
  maw hey {agent}-oracle 'Thread #{id} from {self}: {preview}'

- {self} = current Oracle's name (e.g. "Mother Oracle")
- {agent} = target agent name (lowercase)
- {preview} = first ~60 chars of posted message
- Runs **once per /talk-to invocation** (not per loop iteration)
- **Fail-safe**: if maw hey errors, log warning and continue
  (the thread is the source of truth, notification is convenience)
```

**Resilience Pattern**: Notification is best-effort; thread persistence is reliable.

---

## 7. The /learn Skill - Parallel Codebase Exploration

### Multi-Agent Learning Pattern (src/skills/learn/SKILL.md)

```
Directory Structure:
ψ/learn/
├── .origins                      # Manifest of learned repos (committed)
└── owner/
    └── repo/
        ├── origin                # Symlink to ghq source (gitignored)
        ├── repo.md               # Hub file - links to all sessions (committed)
        └── YYYY-MM-DD/           # Date folder
            ├── HHMM_ARCHITECTURE.md
            ├── HHMM_CODE-SNIPPETS.md
            ├── HHMM_QUICK-REFERENCE.md
            ├── HHMM_TESTING.md     (--deep only)
            └── HHMM_API-SURFACE.md (--deep only)
```

**Three Depth Modes**:

| Flag | Agents | Duration | Use Case |
|------|--------|----------|----------|
| `--fast` | 1 | ~2 min | Quick "what is this?" |
| (default) | 3 | ~5 min | Normal exploration |
| `--deep` | 5 | ~10 min | Master complex repos |

**Critical Paths Pattern**:
```bash
# Step 0: Clone + symlink (before spawning agents)
ghq get -u "$URL"
GHQ_ROOT=$(ghq root)
OWNER=$(echo "$URL" | sed -E 's|.*github.com/([^/]+)/.*|\1|')
REPO=$(echo "$URL" | sed -E 's|.*/([^/]+)(\.git)?$|\1|')
mkdir -p "$ROOT/ψ/learn/$OWNER/$REPO"
ln -sf "$GHQ_ROOT/github.com/$OWNER/$REPO" "$ROOT/ψ/learn/$OWNER/$REPO/origin"

# Step 1: Spawn agents with LITERAL paths (no variables!)
# CRITICAL: Give agents TWO paths:
#   1. SOURCE_DIR (where to READ code) - the origin/ symlink
#   2. DOCS_DIR (where to WRITE docs) - the date folder, NOT inside origin/

# Example for agents:
READ from:  /home/user/my-oracle/ψ/learn/acme-corp/cool-library/origin/
WRITE to:   /home/user/my-oracle/ψ/learn/acme-corp/cool-library/2026-02-04/1349_FILENAME.md
```

**The Bug & Fix**: If agents only get `origin/` path, they cd into it and write there → files end up in wrong repo. Solution: Always pass both DOCS_DIR and SOURCE_DIR as literal absolute paths.

---

## 8. Type System

### Core Types (src/cli/types.ts)

```typescript
export interface AgentConfig {
  name: string;
  displayName: string;
  skillsDir: string;
  globalSkillsDir: string;
  commandsDir?: string;
  globalCommandsDir?: string;
  useFlatFiles?: boolean;
  commandsOptIn?: boolean;  // Only install commands with --commands
  commandFormat?: 'md' | 'toml';
  detectInstalled: () => boolean;
}

export type AgentType =
  | 'opencode'
  | 'claude-code'
  | 'codex'
  | 'cursor'
  | 'amp'
  | 'kilo'
  | 'roo'
  | 'goose'
  | 'gemini'
  | 'antigravity'
  | 'copilot'
  | 'openclaw'
  | 'droid'
  | 'windsurf'
  | 'cline'
  | 'aider'
  | 'continue'
  | 'zed';

export interface Skill {
  name: string;
  description: string;
  path: string;
}

export interface InstallOptions {
  global?: boolean;
  skills?: string[];
  profile?: string;
  features?: string[];
  yes?: boolean;
  agents?: string[];
  commands?: boolean;
  shellMode?: ShellMode;
}
```

---

## 9. Package Metadata

### package.json v3.2.1

```json
{
  "name": "oracle-skills",
  "version": "3.2.1",
  "description": "Install Oracle skills to Claude Code, OpenCode, Cursor, and 11+ AI coding agents",
  "type": "module",
  "bin": {
    "oracle-skills": "./src/cli/index.ts"
  },
  "scripts": {
    "build": "bun scripts/ensure-vfs-stub.ts && bun build src/cli/index.ts --outdir dist --target bun --minify",
    "build:native": "bun scripts/build-native.ts",
    "compile": "bun scripts/compile.ts"
  },
  "keywords": [
    "oracle",
    "skills",
    "claude-code",
    "opencode",
    "cursor",
    "codex",
    "ai-agents",
    "soul-brews",
    "cli",
    "bun"
  ],
  "author": "Nat Weerawan <nat@soulbrews.studio>",
  "license": "MIT",
  "dependencies": {
    "@clack/prompts": "^0.7.0",
    "commander": "^12.0.0",
    "mqtt": "^5.14.1"
  }
}
```

**Key**: MQTT for maw (inter-agent messaging), @clack/prompts for beautiful CLI UX, commander for argument parsing.

---

## 10. Interesting Patterns & Idioms

### Pattern 1: Deferred Skill Validation
- Skills are discovered at runtime, not hardcoded
- Profile resolution happens after discovery (supports dynamic skill lists)
- Feature composition uses Set union semantics

### Pattern 2: Safe Uninstall with Trash Directory
```typescript
// Instead of rm -rf, move to trash with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const trashDir = join(tmpdir(), `oracle-skills-stale-${timestamp}`);
await mv(installedPath, join(trashDir, basename(installedPath)), shellMode);
p.log.info(`Recovery: ${trashDir}`);
```

### Pattern 3: Metadata Injection
- Version + scope + origin info injected into SKILL.md frontmatter
- VERSION.md generated for agent self-reporting
- Manifest (.oracle-skills.json) tracks what was installed when

### Pattern 4: Compiled vs Development Modes
```typescript
if (isCompiled()) {
  // VFS mode — skills bundled in binary, write from memory
  await writeSkillToDir(skill.name, destPath);
} else {
  // Dev mode — read from disk
  await cpr(skill.path, destPath, shellMode);
}
```

### Pattern 5: Auto Detection with Fallback
```typescript
let targetAgents: string[] = options.agent || [];

if (targetAgents.length === 0) {
  const detected = detectInstalledAgents();
  if (detected.length > 0) {
    // Prompt to use detected agents
  } else {
    // Multi-select from all available
  }
}
```

### Pattern 6: Command Stub Generation
Three formats for different agent preferences:
- **Markdown** (.md with YAML frontmatter) — Claude Code, OpenCode, Codex
- **TOML** (.toml) — Gemini CLI
- **Directory structure** — Some agents prefer skill directories

### Pattern 7: Thread Routing with Semantic Titles
```
channel:arthur         # Persistent per-agent channel
topic:arthur:pricing   # Topic-specific thread (with --topic)
#42                    # Direct thread reference
```
Titles encode routing logic; never modify existing thread titles.

### Pattern 8: Autonomous Loop with Insight Extraction
```typescript
// Mode 4: loop (autonomous conversation)
// - Find or create thread
// - Autonomous loop (max 10 iterations):
//    a. Check for agent response
//    b. If yes: compose follow-up
//    c. If no: probe deeper
//    d. Stop when: enough insight or max iterations
// - Return summary with key insights
```

### Pattern 9: Symlink-Based Learning Structure
- Clone via ghq (lives in `~/.ghq/github.com/...`)
- Create symlink in `ψ/learn/owner/repo/origin`
- Document output in date-organized folders
- Allows easy offload: unlink symlink, keep docs

### Pattern 10: Multi-Turn Profile Building
- Fast mode: philosophy fed (5 min)
- Full Soul Sync mode: philosophy discovered via `/learn` + `/trace` (17-20 min)
- `--upgrade` flag: upgrade Fast → Full later (re-runs discovery only)

---

## 11. Key Files Summary

| File | Purpose |
|------|---------|
| `src/cli/index.ts` | Entry point, command registration |
| `src/cli/installer.ts` | Core install/uninstall logic |
| `src/cli/agents.ts` | Agent registry (17 agents) |
| `src/profiles.ts` | Profile & feature definitions |
| `src/skills/awaken/SKILL.md` | Oracle birthing ritual (2 modes) |
| `src/skills/talk-to/SKILL.md` | Inter-oracle messaging + maw notification |
| `src/skills/learn/SKILL.md` | Parallel codebase learning pattern |
| `src/cli/types.ts` | Type definitions |
| `package.json` | Dependencies: @clack/prompts, commander, mqtt |

---

## 12. Architectural Insights

1. **Skill as First-Class**: Skills are discovered, not registered — new skills can be added without CLI changes
2. **Multi-Agent Portability**: Single skill package works across 17 different AI agents
3. **Profile-Driven Installation**: Supports multiple tiers (seed → minimal → standard → full) + composable features
4. **Non-Destructive Operations**: Orphaned skills moved to timestamped trash, not deleted
5. **Version Tracking**: Every installation creates manifest + documentation
6. **Thread-Based Oracle Network**: `/talk-to` uses persistent thread channels for asynchronous multi-oracle conversations
7. **Metadata as Configuration**: SKILL.md frontmatter + VERSION.md enables agent self-reporting
8. **Compiled Distribution**: Can build standalone binary with embedded skills (no Bun required on target)

---

Generated by oracle-skills-cli analysis | 2026-03-18
