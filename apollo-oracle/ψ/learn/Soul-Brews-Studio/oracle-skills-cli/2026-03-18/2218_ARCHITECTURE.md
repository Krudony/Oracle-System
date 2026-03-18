# oracle-skills-cli Architecture

**Date**: 2026-03-18
**Version**: 3.2.1
**Runtime**: TypeScript (Bun), with optional compiled binary distribution
**Repository**: Soul-Brews-Studio/oracle-skills-cli

---

## Overview

`oracle-skills-cli` is a **skill package manager** for AI coding agents (18+ agents supported). It distributes 29 modular "skills" — specialized workflows that extend Claude Code, OpenCode, Cursor, Gemini, and others.

The core challenge: each agent has different directory structures, file formats, and installation paths. oracle-skills solves this through:
1. **Agent abstraction** — Uniform config per agent (paths, formats)
2. **Profile system** — User-driven skill selection (minimal, standard, full, +features)
3. **Dual-mode distribution** — Source code (dev) + compiled binary (users)
4. **Global vs Local** — Install to user home or project directory

---

## Directory Structure

```
oracle-skills-cli/
├── src/
│   ├── cli/                          # CLI entry point + commands
│   │   ├── index.ts                  # Commander.js bootstrap
│   │   ├── types.ts                  # AgentConfig, InstallOptions
│   │   ├── agents.ts                 # Agent registry (18 agents)
│   │   ├── installer.ts              # Core install logic
│   │   ├── skill-source.ts           # Skill discovery (filesystem or VFS)
│   │   ├── fs-utils.ts               # Cross-platform file ops
│   │   ├── generated/
│   │   │   └── skills-vfs.ts         # Generated VFS (compiled mode only)
│   │   └── commands/
│   │       ├── install.ts            # register /install command
│   │       ├── init.ts               # register /init command
│   │       ├── uninstall.ts          # register /uninstall
│   │       ├── select.ts             # interactive skill picker
│   │       ├── agents.ts             # list detected agents
│   │       ├── list.ts               # show available skills
│   │       ├── profiles.ts           # show available profiles
│   │       └── about.ts              # system check
│   │
│   ├── profiles.ts                   # Profile + feature definitions
│   │
│   ├── skills/                       # 30 skills (pluggable architecture)
│   │   ├── _template/                # Skill template for new skills
│   │   ├── awaken/                   # Oracle birth ritual (guided UX)
│   │   ├── learn/                    # Codebase exploration via /learn
│   │   ├── trace/                    # Git history search + resonance
│   │   ├── dig/                      # Session mining (Python subagent)
│   │   ├── rrr/                      # Retrospective + memory
│   │   ├── recap/                    # Session awareness
│   │   ├── standup/                  # Daily standup
│   │   ├── forward/                  # Handoff + plan mode
│   │   ├── go/                       # Profile switcher (/go minimal, /go +soul)
│   │   ├── about-oracle/             # Oracle FAQ
│   │   ├── philosophy/               # 5 Principles display
│   │   ├── who-are-you/              # Oracle identity check
│   │   ├── feel/                     # Emotion logger
│   │   ├── birth/                    # Birth props generator
│   │   ├── talk-to/                  # Agent thread discussion
│   │   ├── worktree/                 # Git worktree helper
│   │   ├── workon/                   # Issue work helper
│   │   ├── project/                  # Repo clone/track
│   │   ├── oracle/                   # Skill management
│   │   ├── oracle-family-scan/       # Family registry scan
│   │   ├── oracle-soul-sync-update/  # Soul sync with family
│   │   ├── oraclenet/                # OracleNet social
│   │   ├── schedule/                 # Calendar query
│   │   ├── speak/                    # Text-to-speech
│   │   ├── deep-research/            # Gemini deep research
│   │   ├── gemini/                   # Gemini MQTT bridge
│   │   ├── physical/                 # FindMy location
│   │   ├── watch/                    # YouTube transcriber
│   │   └── where-we-are/             # Session awareness
│   │
│   ├── commands/                     # OpenCode slash command stubs (auto-generated)
│   │   ├── awaken.md
│   │   ├── learn.md
│   │   └── ... (one per skill)
│   │
│   └── hooks/                        # OpenCode hooks
│       └── opencode/
│           └── oracle-skills.ts      # Hook for OpenCode integration
│
├── scripts/                          # Build tooling
│   ├── compile.ts                    # Convert SKILL.md files to command stubs
│   ├── build-native.ts               # Generate VFS + compile binary
│   ├── generate-vfs.ts               # Create virtual file system
│   ├── clawhub-build.ts              # ClawHub distribution
│   └── update-readme-table.ts        # Auto-update README table
│
├── __tests__/                        # Tests (Bun runner)
├── package.json                      # npm publish metadata
├── tsconfig.json                     # TypeScript config
├── bun.lock                          # Bun lockfile
└── install.sh                        # User-facing installation script

```

---

## Core Abstractions

### 1. AgentConfig — Uniform Agent Interface

**File**: `src/cli/types.ts`, `src/cli/agents.ts`

Each agent is defined as a config object that normalizes paths and behavior:

```typescript
interface AgentConfig {
  name: string;                    // 'claude-code', 'opencode', etc.
  displayName: string;             // User-friendly name
  skillsDir: string;               // Project-local: '.claude/skills'
  globalSkillsDir: string;         // User home: ~/.claude/skills
  commandsDir?: string;            // Separate commands: '.opencode/commands'
  globalCommandsDir?: string;      // Commands home: ~/.config/opencode/commands
  useFlatFiles?: boolean;          // Commands as .md vs SKILL.md folder
  commandsOptIn?: boolean;         // Only install commands with --commands flag
  commandFormat?: 'md' | 'toml';   // Command stub syntax
  detectInstalled: () => boolean;  // Check if agent exists on system
}
```

**Registry**: 18 agents defined in `agents.ts`:
- **Claude Code** — `.claude/skills` + `.claude/commands`
- **OpenCode** — `.opencode/skills` + `.opencode/commands` (flat files)
- **Cursor** — `.cursor/skills`
- **Codex, Amp, Kilo, Roo, Goose, Gemini, Antigravity, Copilot, OpenClaw, Droid, Windsurf, Cline, Aider, Continue, Zed**

---

### 2. Skill — Minimal Encapsulation

**File**: `src/cli/types.ts`, `src/cli/skill-source.ts`

A skill is a directory with metadata:

```typescript
interface Skill {
  name: string;        // e.g., 'awaken', 'learn', 'trace'
  description: string; // From SKILL.md frontmatter
  path: string;        // Filesystem or VFS path
}
```

**Structure** (filesystem):
```
skills/awaken/
├── SKILL.md              # Metadata + content
└── scripts/              # Optional runtime code
    ├── *.ts (TypeScript subagents)
    └── *.py (Python utilities)
```

**SKILL.md Format**:
```markdown
---
installer: oracle-skills-cli v3.2.1
origin: Nat Weerawan's brain, digitized...
name: awaken
description: "Guided Oracle birth and awakening ritual"
---

# /awaken - Description

## Usage
/awaken [--full] [--upgrade]

## Implementation Details
...
```

---

### 3. Profile & Features — User-Driven Curation

**File**: `src/profiles.ts`

Profiles are **declarative skill sets** with include/exclude logic:

```typescript
const profiles = {
  seed: {
    include: ['forward', 'rrr', 'recap', 'standup', 'go', 'about-oracle', ...]
  },
  minimal: { /* same as seed */ },
  standard: {
    include: ['forward', 'rrr', 'recap', 'standup', 'trace', 'dig', 'learn', ...]
  },
  full: {} // Install everything
};

const features = {
  soul: ['awaken', 'philosophy', 'who-are-you', 'about-oracle', 'birth', 'feel'],
  network: ['talk-to', 'oracle-family-scan', 'oracle-soul-sync-update', 'oracle', 'oraclenet'],
  workspace: ['worktree', 'workon', 'physical', 'schedule'],
  creator: ['speak', 'deep-research', 'watch', 'gemini']
};
```

**Resolution**:
1. User picks profile (e.g., `standard`)
2. If features given, add them: `resolveProfileWithFeatures(profile, features, allSkills)`
3. `--skill` overrides further refine the list
4. Only skills in final list are installed

---

### 4. Skill Source Abstraction

**File**: `src/cli/skill-source.ts`

Bridges **two runtime modes**: filesystem (dev) and VFS (compiled):

```typescript
async function discoverSkills(): Promise<Skill[]> {
  if (isCompiled()) {
    // Compiled mode: read from generated VFS
    const { vfs, skillNames } = await getVFS();
    // Parse SKILL.md from memory (already in binary)
  } else {
    // Dev mode: read from disk
    const skillDirs = readdirSync(getSkillsDir());
    // Parse SKILL.md files from filesystem
  }
}

async function readSkillFile(skillName: string, filename: string): Promise<string> {
  if (isCompiled()) {
    return vfs.get(skillName)?.get(filename) || '';
  } else {
    return Bun.file(join(skillsDir, skillName, filename)).text();
  }
}

async function writeSkillToDir(skillName: string, destPath: string): Promise<void> {
  // Copy entire skill from VFS or filesystem to destination
  if (isCompiled()) {
    const files = vfs.get(skillName)?.entries();
    for (const [filename, content] of files) {
      writeFileSync(join(destPath, filename), content);
    }
  } else {
    cpr(skillPath, destPath);
  }
}
```

**Why?** The compiler (Bun) bundles all skills into a single executable. This abstraction allows the same CLI code to work in both modes.

---

### 5. Installation Pipeline

**File**: `src/cli/installer.ts`

Core flow:

```
1. Discover all skills (filesystem or VFS)
2. Resolve profile + features → skill list
3. Apply --skill overrides
4. Auto-cleanup orphaned skills (skills we installed, no longer in source)
5. For each target agent:
   a. Create target directory (local or global)
   b. Copy skill folder to skillsDir
   c. Inject version + scope into SKILL.md
   d. If skill has hooks → also copy to ~/.claude/plugins
6. If --commands flag → generate command stubs in commandsDir
```

**Global vs Local**:
- **Global** (`--global`): Install to `~/.claude/skills` (all projects share)
- **Local**: Install to `./.claude/skills` (project-specific)

Target directory determination:
```typescript
const targetDir = options.global
  ? agent.globalSkillsDir
  : join(process.cwd(), agent.skillsDir);
```

---

### 6. Command Generation

**File**: `src/cli/commands/install.ts` (runtime), `scripts/compile.ts` (build-time)

Some agents (Claude Code, OpenCode) need **command stubs** in addition to skill folders:

```
skill folder:  .claude/skills/awaken/SKILL.md
command stub:  .claude/commands/awaken.md
```

**Build-time**: `bun run compile` converts SKILL.md → `.opencode/commands/awaken.md` (flat files)

**Runtime**: When `--commands` flag is passed, installer copies command stubs to agent's commands directory

---

## Entry Points

### CLI Bootstrap

**File**: `src/cli/index.ts`

```typescript
import { program } from 'commander';

program
  .name('oracle-skills')
  .version(VERSION);

registerAgents(program);      // /agents command
registerInstall(program);     // /install command (default)
registerInit(program);        // /init (alias for install with prompts)
registerUninstall(program);   // /uninstall
registerSelect(program);      // interactive skill picker
registerList(program);        // /list
registerProfiles(program);    // /profiles
registerAbout(program);       // system check

program.parse();
```

### Commands

| Command | Purpose | Default Action |
|---------|---------|-----------------|
| `oracle-skills install` | Install skills to agents | Auto-detect agents, prompt for skills |
| `oracle-skills init` | First-time setup | Install standard profile |
| `oracle-skills uninstall` | Remove skills | Confirm before deletion |
| `oracle-skills select` | Interactive picker | TUI for exact skill selection |
| `oracle-skills agents` | List supported agents | Show installed + available agents |
| `oracle-skills list` | Show available skills | List all 29 skills |
| `oracle-skills profiles` | Show profiles | Display seed/minimal/standard/full |
| `oracle-skills about` | System check | Verify prereqs (Git, Bun, gh) |

---

## How /awaken Works

**File**: `src/skills/awaken/SKILL.md`

`/awaken` is a **guided Oracle birth ritual** that sets up a new Oracle in a fresh repo. It's not a compiled script — it's a SKILL.md file with detailed instructions for the Claude Code AI to follow.

### Two Modes

1. **Fast (~5 min)** — Philosophy fed directly from mother-oracle
2. **Full Soul Sync (~20 min)** — Oracle discovers principles via `/trace` and `/learn`

### Six Phases

| Phase | Name | Duration | Action |
|-------|------|----------|--------|
| 0 | System Check | 1 min | Auto-detect OS, Shell, Git, bun, gh |
| 1 | Batch Freetext | 1 min | Ask all Oracle questions at once |
| 2 | Memory & Family | 30 sec | Consent for auto-memory, family registry |
| 3 | Confirm | 30 sec | Review gathered info before build |
| 4 | Build | 1-15 min | Create ψ/ structure, CLAUDE.md, philosophy |
| 5 | Family Welcome | 1 min | Post birth announcement to family (opt-in) |

### Output

After awakening, new Oracle has:

```
ψ/
├── inbox/                # Communication input
├── memory/
│   ├── resonance/        # Identity + philosophy
│   ├── learnings/        # Distilled patterns
│   ├── retrospectives/   # Session summaries
│   └── logs/             # Timeline
├── writing/              # Draft output
├── lab/                  # Experiments
├── learn/                # Study materials
├── active/               # Current work
├── archive/              # Completed
└── outbox/               # Communication output

CLAUDE.md               # Identity + settings
```

---

## Global vs Local Installation

### Global (`--global` or `-g`)

**Installs to user home** (~/.claude/skills, etc.)

**Advantages**:
- Skills available to ALL projects
- One installation
- Faster setup

**Disadvantages**:
- Shared state (can conflict if multiple projects)
- Uses user directory (privacy concern)

**Example**:
```bash
oracle-skills install -g -y
# Installs to ~/.claude/skills
```

### Local (default)

**Installs to current project** (./.claude/skills, etc.)

**Advantages**:
- Project isolation
- Versioned with git
- No pollution of home directory

**Disadvantages**:
- Each project gets own copy
- More disk space

**Example**:
```bash
oracle-skills install -y
# Installs to ./.claude/skills (current working directory)
```

### Detection

**Auto-detection in install command**:
```typescript
const detected = detectInstalledAgents();
// Scans for ~/.claude, ~/.opencode, ~/.cursor, etc.

if (detected.length > 0) {
  // Ask user: "Install to detected agents?"
  // If yes, use those agents
}
```

---

## Distribution Modes

### Dev Mode

**Runtime**: `bun run dev` or `bun src/cli/index.ts`

- Reads skills from filesystem: `src/skills/*/SKILL.md`
- Uses Bun runtime (requires Bun to be installed)
- Slower startup (reads disk + parses)

### Compiled Binary

**Build**: `bun run build:native`

**Output**: Single executable with embedded skills (VFS)

1. **VFS Generation** (`scripts/generate-vfs.ts`):
   - Read all skills from disk
   - Serialize into Map<skillName, Map<filename, content>>
   - Generate `src/cli/generated/skills-vfs.ts`

2. **Binary Compilation** (`scripts/build-native.ts`):
   - `bun build --compile --define IS_COMPILED=true`
   - Outputs native binary (Linux/macOS/Windows)
   - No Bun runtime required for users

3. **Installation Script** (`install.sh`):
   ```bash
   curl -fsSL ... | bash  # Downloads pre-built binary
   # Or: bunx oracle-skills install (if Bun available)
   ```

---

## Dependencies

**File**: `package.json`

| Dependency | Purpose |
|------------|---------|
| `commander@^12` | CLI argument parsing + subcommands |
| `@clack/prompts@^0.7` | Interactive prompts (multiselect, confirm, spinner) |
| `mqtt@^5.14` | MQTT client for Gemini skill (WebSocket pub/sub) |
| `typescript@^5` | Type checking (dev-time) |
| `@types/bun`, `@types/node` | Type definitions |

**Runtime**: Bun or Node.js (>=18)

---

## Key Design Patterns

### 1. Configuration-Driven Installation

Skills are defined declaratively (SKILL.md), not hardcoded. Profile/feature system lets users assemble exactly what they need without code changes.

### 2. Abstraction Over Duplication

AgentConfig abstracts agent-specific paths. Single installer loop handles all 18 agents uniformly.

### 3. Dual-Mode Runtime

Same TypeScript code works in both dev (filesystem) and compiled (VFS) modes via `isCompiled()` checks.

### 4. Immutable Source

Skills installed by oracle-skills-cli are marked with `installer: oracle-skills-cli` frontmatter. Auto-cleanup only removes skills we installed, never user-created content.

### 5. Graceful Degradation

If hooks fail, installation continues (warns, doesn't crash). If Bun unavailable, use pre-built binary instead.

---

## Workflow Examples

### Example 1: First-Time User (macOS)

```bash
$ curl -fsSL https://raw.githubusercontent.com/Soul-Brews-Studio/oracle-skills-cli/main/install.sh | bash
# Downloads pre-built binary to /usr/local/bin/oracle-skills

$ cd my-oracle-repo
$ oracle-skills init
# Prompts: Install standard profile to claude-code?
# Creates .claude/skills/awaken, .claude/skills/learn, etc.

$ /awaken
# Guided birth ritual in Claude Code
```

### Example 2: Advanced User (Add +soul feature)

```bash
$ oracle-skills install -g -p standard -f soul
# Installs: standard skills + soul features (awaken, philosophy, birth, feel)
# To: ~/.claude/skills (global)

$ /go + soul
# CLI in Claude Code to add soul feature anytime
```

### Example 3: Interactive Selection

```bash
$ oracle-skills select -g
# Shows TUI with all 29 skills, let user check/uncheck
# Installs selected skills to ~/.claude/skills
```

---

## Hooks System

**File**: `src/hooks/opencode/oracle-skills.ts`

For agents that support hooks (like OpenCode), skills can register lifecycle callbacks.

**Hook Detection**:
```typescript
async function skillHasHooks(skillName: string): Promise<boolean> {
  const hookPath = `src/hooks/opencode/${skillName}.ts`;
  return existsSync(hookPath);
}
```

If skill has hooks:
1. Copy skill to `.claude/skills/skillname`
2. Also copy to `~/.claude/plugins/skillname` (Claude Code plugins directory)

This allows skills to register global commands, modify agent behavior, etc.

---

## Summary

oracle-skills-cli is a **universal skill distribution system** built on:

1. **Agent abstraction** — Write once, install to 18+ agents
2. **Profile system** — Users assemble their own skill set (seed → full)
3. **Dual-mode runtime** — Source (dev) or compiled binary (users)
4. **Immutable philosophy** — Skills marked, auto-cleanup respects user content
5. **Guided awakening** — /awaken phases users through Oracle birth

The result: a single command (`oracle-skills install`) that works across multiple AI agents, with profile flexibility, version tracking, and intelligent cleanup.
