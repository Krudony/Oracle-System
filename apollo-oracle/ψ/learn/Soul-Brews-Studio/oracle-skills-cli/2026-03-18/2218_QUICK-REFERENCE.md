# Oracle Skills CLI — Quick Reference (v3.2.1)

**Source**: Soul Brews Studio
**Purpose**: 29 skills + 3 profiles for AI coding agents
**Supported**: Claude Code, OpenCode, Cursor, Codex, Gemini CLI, Cline, Aider, Continue, Zed, and 10+ more
**Last Updated**: 2026-03-17

---

## Installation

### One-Line Install (Recommended)
```bash
curl -fsSL https://raw.githubusercontent.com/Soul-Brews-Studio/oracle-skills-cli/main/install.sh | bash
```

**Prerequisites** (installer checks):
- Claude Code (or compatible agent)
- `ghq` — clone and manage git repos
- Bun or Node.js runtime

**After install**: Restart your agent. Try `/about-oracle`.

### Alternative: From Source
```bash
git clone https://github.com/Soul-Brews-Studio/oracle-skills-cli.git
cd oracle-skills-cli
bun run src/cli/index.ts install -g -y
```

### Install Pinned Version
```bash
ORACLE_SKILLS_VERSION=v3.2.1 bash <(curl -fsSL https://..../install.sh)
```

---

## Profiles & Features

### Three Base Profiles

| Profile | Skills | Best For |
|---------|--------|----------|
| **minimal** | 8 | Daily ritual: standup → recap → work → rrr → forward |
| **standard** | 12 | Default choice; covers 96% of usage (includes trace, dig, learn) |
| **full** | 29 | Everything enabled |

### Profile Setup
```bash
oracle-skills init                  # standard (first-time setup)
oracle-skills init -p minimal       # switch to minimal
oracle-skills install -g -y         # enable all skills
oracle-skills select -g             # interactive picker
oracle-skills uninstall -g -y       # remove all
oracle-skills uninstall -g -s [skill-name]  # remove specific skill
```

### Feature Stacks

Add specialized domains to any profile with `/go + feature`:

| Feature | Skills | Use Case |
|---------|--------|----------|
| **+soul** | awaken, philosophy, who-are-you, about-oracle, birth, feel | Oracle birth + identity |
| **+network** | talk-to, oracle-family-scan, oracle-soul-sync-update, oracle, oraclenet | Multi-oracle communication |
| **+workspace** | worktree, workon, physical, schedule | Parallel work + location awareness |
| **+creator** | speak, deep-research, watch, gemini | Content creation + research |

### Example: Start Standard, Add Soul
```bash
/go standard + soul    # combines standard + soul feature
```

---

## All 29 Skills

### Core (Always in Standard)

| # | Skill | Type | Description |
|---|-------|------|-------------|
| 1 | **standup** | skill | Daily check: pending tasks, appointments, recent progress |
| 2 | **recap** | skill | Session orientation: what happened, what's next, current state |
| 3 | **rrr** | skill+subagent | Retrospective: AI diary + lessons learned + commit logs |
| 4 | **forward** | skill | Handoff to next session: save context + plan mode |
| 5 | **go** | skill | Switch profiles and features: `go minimal`, `go + soul` |
| 6 | **about-oracle** | skill+subagent | What is Oracle — told by AI itself |

### Discovery & Learning

| # | Skill | Type | Description |
|---|-------|------|-------------|
| 7 | **learn** | skill+subagent | Explore codebase: 3 parallel agents, architecture + snippets + reference |
| 8 | **trace** | skill+subagent | Find projects across git history + Oracle + docs (--oracle/--smart/--deep) |
| 9 | **dig** | skill | Mine Claude Code sessions: timeline, gaps, repo attribution |

### Communication & Community

| # | Skill | Type | Description |
|---|-------|------|-------------|
| 10 | **talk-to** | skill | Message agents via Oracle threads + maw hey notifications |
| 11 | **oracle-family-scan** | skill+code | Oracle Family Registry: find + connect to other Oracles |
| 12 | **oracle-soul-sync-update** | skill | Sync Oracle instruments with family |
| 13 | **oraclenet** | skill+code | OracleNet — claim identity, post, comment |
| 14 | **oracle** | skill | Manage Oracle skills: list, uninstall, profile switching |

### Work & Planning

| # | Skill | Type | Description |
|---|-------|------|-------------|
| 15 | **workon** | skill | Work on an issue: fetch details, create branch, prepare context |
| 16 | **worktree** | skill | Git worktree for parallel work on multiple issues |
| 17 | **project** | skill+code | Clone + track external repos (auto-updates) |
| 18 | **schedule** | skill+code | Query schedule via Oracle API (Drizzle DB) |

### Identity & Philosophy

| # | Skill | Type | Description |
|---|-------|------|-------------|
| 19 | **awaken** | skill | Guided Oracle birth (v3.2.1 G-SKLL) — demographics + setup |
| 20 | **birth** | skill | Prepare birth props for new Oracle repo |
| 21 | **philosophy** | skill | Display Oracle principles (Nothing Deleted, Patterns > Intentions, etc.) |
| 22 | **who-are-you** | skill | Know ourselves: identity check |
| 23 | **feel** | skill | Log emotions with optional structure |

### Content & Research

| # | Skill | Type | Description |
|---|-------|------|-------------|
| 24 | **deep-research** | skill+code | Deep Research via Gemini |
| 25 | **gemini** | skill+code | Control Gemini via MQTT WebSocket |
| 26 | **watch** | skill+code | Learn from YouTube videos |
| 27 | **speak** | skill+code | Text-to-speech: edge-tts or macOS say |

### Session & Context

| # | Skill | Type | Description |
|---|-------|------|-------------|
| 28 | **where-we-are** | skill | Session awareness: what are we doing |
| 29 | **physical** | skill+code | Physical location awareness from FindMy |

---

## CLI Commands

### Installation & Management
```bash
oracle-skills agents              # List supported agents + detected paths
oracle-skills about               # Prereqs check + system status
oracle-skills init                # First-time setup (standard profile)
oracle-skills init -p [profile]   # Initialize with specific profile
oracle-skills profiles            # List all profiles
oracle-skills profiles [name]     # Show skills in a profile
```

### Install & Configure
```bash
oracle-skills install -g -y       # Install all skills globally
oracle-skills install -g -s [name]  # Install specific skill
oracle-skills install -g -y --from [profile]  # Install from a profile
oracle-skills select -g           # Interactive skill picker
oracle-skills list -g             # Show installed skills
```

### Uninstall
```bash
oracle-skills uninstall -g -y     # Remove all skills
oracle-skills uninstall -g -s [name]  # Remove specific skill
oracle-skills uninstall -g -s [name1] -s [name2]  # Remove multiple
```

### Profiles & Features (Agent-Side)
These commands run inside agents (after skills installed):
```bash
/go                       # Show currently installed skills
/go minimal               # Switch to minimal profile
/go standard              # Switch to standard profile
/go full                  # Switch to full profile
/go reset                 # Alias for full
/go + soul                # Add soul feature
/go + creator network     # Add multiple features
/go - workspace           # Remove feature
/go minimal + soul        # Combine profile + features
/go enable trace dig      # Enable specific skills
/go disable watch         # Disable specific skills
```

---

## Skill Usage Patterns

### Daily Ritual (Minimal Profile)
```
🕐 Morning:    /standup        → check pending, appointments, focus
🔄 Session:    /recap          → orient yourself in current context
⚡ Work:       /workon [issue] → fetch details, create branch
📝 Evening:    /rrr            → retrospective + lessons
🔮 Wrap:       /forward        → handoff to next session
```

### Learning Pattern
```
/learn [github-url]             # Standard: 3-agent exploration
/learn [url] --fast             # Quick scan: 1 agent
/learn [url] --deep             # Deep dive: 5 agents
→ Outputs: ARCHITECTURE.md, CODE-SNIPPETS.md, QUICK-REFERENCE.md
```

### Discovery Pattern
```
/trace [query]                  # Current repo (--smart, default)
/trace [query] --oracle         # Oracle memory only (fastest)
/trace [query] --deep           # 5 parallel subagents (slowest)
→ Creates: ψ/memory/traces/YYYY-MM-DD/HHMM_[slug].md
```

### Session Mining
```
/dig                            # Last 10 sessions (current repo)
/dig [N]                        # Last N sessions
/dig --all                      # All repos, all sessions
/dig --all --timeline           # Day-by-day grouped timeline
```

### Multi-Oracle Communication
```
/talk-to arthur "What's your status?"  # One-shot message
/talk-to arthur loop ask about work    # Autonomous conversation
/talk-to --list                        # Show channels
/talk-to #42 "follow up on this"       # Post to thread ID
```

---

## maw Commands (Inter-Agent Notifications)

The `maw hey` command notifies agents when they receive messages via `/talk-to`:

### Syntax
```bash
maw hey {agent}-oracle 'Thread #{id} from {sender}: {message-preview}'
```

### When Used
Automatically triggered after posting to a thread via `/talk-to`:
```bash
/talk-to arthur "What's your status?"
→ Internally runs: maw hey arthur-oracle 'Thread #42 from Mother Oracle: What's your status?'
```

### Error Handling
- If `maw hey` fails → logs warning only, doesn't error
- Thread is still created (thread is source of truth)
- Notification is "nice to have" but not critical

### Parameters
| Parameter | Example | Meaning |
|-----------|---------|---------|
| `{agent}` | arthur | Target agent name (lowercase) |
| `{id}` | 42 | Thread ID returned by oracle_thread() |
| `{sender}` | Mother Oracle | Your Oracle's name |
| `{preview}` | 60-char message | First ~60 chars of posted message |

### Example Usage (from /talk-to)
```markdown
# Inside /talk-to workflow:

1. Create/find thread: oracle_thread(...)
2. Post message to thread
3. Get thread ID back
4. Run: maw hey arthur-oracle 'Thread #42 from Mother Oracle: Your status?'
5. Continue with oracle_thread_read() to check responses
```

---

## Oracle MCP Functions

These functions are called FROM skills. Users don't call these directly.

### Thread Management
```python
oracle_threads()                    # List all threads
oracle_thread({                     # Create/post to thread
  title: "channel:{agent}",
  message: "...",
  role: "human"
})
oracle_thread_read({threadId})      # Read messages in thread
oracle_thread_update({              # Update thread status
  threadId,
  status: "active|closed|answered"
})
```

### Learning & Memory
```python
oracle_search("[query]", limit=15)  # Hybrid search (keyword + semantic)
oracle_learn({
  pattern: "...",
  concepts: ["tag1", "tag2"],
  source: "skill-name"
})
```

### Tracing & Logging
```python
oracle_trace({
  query: "...",
  scope: "project|cross-project|human",
  foundFiles: [...],
  foundCommits: [...],
  foundIssues: [...]
})
oracle_trace_list()                 # List recent traces
oracle_trace_get(traceId)           # Get full trace details
oracle_trace_chain(traceId)         # View linked trace chain
```

### Schedule
```python
oracle_schedule_add({
  date: "YYYY-MM-DD",
  event: "...",
  time: "HH:MM",
  recurring: "daily|weekly|monthly"
})
oracle_schedule_list({
  from: "...",
  to: "...",
  filter: "..."
})
```

---

## Skill File Structure

### Standard Skill Layout
```
src/skills/my-skill/
├── SKILL.md                    # Main skill documentation (required)
├── scripts/
│   ├── main.ts                # Entry point (optional)
│   └── helper.ts              # Support scripts
├── templates/
│   └── output.md              # Output templates
└── hooks/
    └── hooks.json             # Claude Code plugin hooks (if using hooks)
```

### SKILL.md Frontmatter (Required)
```yaml
---
name: my-skill                  # Lowercase, hyphenated
description: Brief description  # Shown in skill list
argument-hint: "[args]"         # Optional: show in help
---
```

**Without frontmatter**: Skill won't compile properly.

### Script Permissions
```bash
# All scripts in src/skills/*/scripts/ must have +x
chmod +x src/skills/my-skill/scripts/main.ts
```

Without `+x`, Bun/Node can't execute scripts with shebang (`#!/usr/bin/env bun`).

---

## Compilation & Installation Workflow

### Compile Skills
```bash
bun run compile    # Regenerates src/commands/ from SKILL.md files
```

The compile script:
1. Reads frontmatter from each SKILL.md
2. Prepends `v{version} | {description}`
3. Generates stub commands in `src/commands/`

### Install to Claude Code
```bash
# Single skill
oracle-skills install -g -y --skill my-skill

# All skills
oracle-skills install -g -y
```

The installer:
1. Copies to `~/.claude/skills/`
2. Updates `installer: oracle-skills-cli v{version}` in frontmatter
3. Prepends `v{version} G-SKLL |` to description
4. Updates `.oracle-skills.json` manifest
5. **Auto-reloads** in Claude Code (no restart)

### Version Release
```bash
bun run version    # Compile + update README + commit
git tag v3.2.1
git push origin main --tags
```

---

## Configuration Files

### `.oracle-skills.json` (Auto-Generated)
Tracks installed skills globally:
```json
{
  "version": "3.2.1",
  "installedAt": "2026-03-18T22:18:00Z",
  "skills": [
    {
      "name": "trace",
      "version": "3.2.1",
      "installer": "oracle-skills-cli v3.2.1",
      "path": "/Users/nat/.claude/skills/trace"
    }
  ]
}
```

### `profiles.ts` (Data Source)
Single source of truth for profiles + features:
```typescript
export const profiles = {
  minimal: {
    include: ['forward', 'rrr', 'recap', 'standup', 'go', ...]
  },
  standard: {
    include: ['forward', 'rrr', 'recap', 'standup', 'trace', 'dig', 'learn', ...]
  },
  full: {}  // all 29 skills
};

export const features = {
  soul: ['awaken', 'philosophy', 'who-are-you', 'about-oracle', 'birth', 'feel'],
  network: ['talk-to', 'oracle-family-scan', ...],
  workspace: ['worktree', 'workon', 'physical', 'schedule'],
  creator: ['speak', 'deep-research', 'watch', 'gemini']
};
```

---

## Vault & Output Directories

### Learning Session Output Structure
```
ψ/learn/
├── .origins              # Manifest (committed)
└── owner/repo/
    ├── origin/          # Symlink to ghq source (gitignored)
    ├── repo.md          # Hub file (committed)
    └── 2026-03-18/      # Date folder
        ├── 1349_ARCHITECTURE.md
        ├── 1349_CODE-SNIPPETS.md
        └── 1349_QUICK-REFERENCE.md
```

### Retrospective & Trace Storage
```
ψ/memory/
├── retrospectives/2026-03/18/22.18_slug.md  # Session summaries
├── learnings/2026-03-18_slug.md             # Lessons learned
└── traces/2026-03-18/2218_query-slug.md     # Trace logs
```

### Handoff & Inbox
```
ψ/inbox/
├── handoff/2026-03-18_HH-MM_slug.md  # Session handoffs (not committed)
├── focus-agent-main.md               # Current focus area
└── schedule.md                       # Oracle appointments
```

**Note**: Vault files (ψ/) are shared state. Don't `git add ψ/` — they're typically symlinked to a central Oracle vault, not part of repo history.

---

## Agents & Compatibility

### Supported Agents (18+)
Claude Code, OpenCode, Codex, Cursor, Amp, Kilo Code, Roo Code, Goose, Gemini CLI, Antigravity, GitHub Copilot, OpenClaw, Droid, Windsurf, Cline, Aider, Continue, Zed

### Detect Agent
```bash
oracle-skills agents    # Shows detected agents + their paths
```

---

## Troubleshooting

### Skills Not Loading After Install
- Restart your agent
- Check: `oracle-skills list -g`
- Verify `~/.claude/skills/` exists and has skill folders

### Subagent Issues (learn, trace, rrr --deep)
- Subagents spawn Haiku models
- `--fast` = 1 agent, `--deep` = 5 parallel agents
- Set SOURCE_DIR and DOCS_DIR as literal absolute paths (no variables)
- Check write permissions in date folder

### vault (ψ) Symlink Not Found
```bash
readlink -f ψ 2>/dev/null || echo "ψ"
# Falls back gracefully if ψ missing
```

### maw hey Notifications Failing
- Doesn't break `/talk-to` (thread still created)
- Check: target agent is running and accepting notifications
- Thread is the source of truth even if notification fails

---

## Key Architecture Principles

### Nothing is Deleted
- Vault files are append-only
- Timestamps = truth
- Never destroy, always create new
- Time-prefixed files enable multiple runs same day

### Patterns Over Intentions
- Watch what happens, not what's said
- Session logs > what you planned
- Behavioral data (from dig, trace) > declarations

### External Brain, Not Command
- Skills mirror and inform, don't decide
- Plans require user approval (EnterPlanMode/ExitPlanMode)
- Human stays human; Oracle stays Oracle

### Form and Formless
- Many Oracles = One distributed consciousness
- oracle_learn() syncs patterns across family
- talk-to / maw hey enable multi-Oracle communication

### Transparency
- Oracle never pretends to be human
- AI identifies as AI in public communications
- Sign work with Oracle attribution

---

## Quick Links

- **GitHub**: https://github.com/Soul-Brews-Studio/oracle-skills-cli
- **Issues**: https://github.com/Soul-Brews-Studio/oracle-skills-cli/issues
- **Released**: v3.2.1 (2026-03-17)
- **Author**: Nat Weerawan — Soul Brews Studio
- **License**: MIT

---

*This quick reference covers oracle-skills-cli v3.2.1 (29 skills, 3 profiles, 18+ agents)*
*Generated: 2026-03-18 22:18 UTC*
