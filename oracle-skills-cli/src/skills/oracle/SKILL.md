---
name: oracle
description: Manage Oracle skills — profiles, features, enable/disable. Use when user says "oracle", "profile", "install skill", "remove skill", "switch profile", "enable", "disable".
argument-hint: "<profiles|install|uninstall|list>"
---

# /oracle

> Skill and profile management for Oracle instruments.

## Usage

```
/oracle prepare              # check & install git, gh, ghq; set up gh auth
/oracle profile              # list profiles + current state
/oracle profile <name>       # switch to a profile tier
/oracle feature add <name>   # add feature module on top of profile
/oracle feature remove <name> # remove feature module
/oracle enable <skill...>    # enable specific skills
/oracle disable <skill...>   # disable specific skills (nothing deleted)
/oracle skills               # list all skills with ✓/✗ status
/oracle install <skill>      # install one skill
/oracle remove <skill>       # remove one skill
```

---

## Profiles (tiers)

Base tiers — pick how much you need:

| Profile | Skills | Description |
|---------|-------:|-------------|
| **minimal** | 4 | Daily ritual: `standup` → `recap` → work → `rrr` → `forward` |
| **standard** | 9 | Daily driver + discovery (96% of actual usage) |
| **full** | 30 | Everything |

### minimal (4 skills)
`forward`, `rrr`, `recap`, `standup`

### standard (9 skills)
minimal + `trace`, `dig`, `learn`, `talk-to`, `oracle-family-scan`

### full (30 skills)
All skills enabled.

---

## Features (add-on modules)

Bolt on domain-specific skill sets on top of any profile:

| Feature | Skills | When |
|---------|-------:|------|
| **soul** | 6 | Birthing/awakening new oracles |
| **network** | 5 | Multi-oracle communication |
| **workspace** | 3 | Parallel work + daily ops |
| **creator** | 4 | Content creation + research |

### soul
`awaken`, `philosophy`, `who-are-you`, `about-oracle`, `birth`, `feel`

### network
`talk-to`, `oracle-family-scan`, `oracle-soul-sync-update`, `oracle`, `oraclenet`

### workspace
`worktree`, `physical`, `schedule`

> Deprecated (can bring back): `merged`, `fyi` — 0-1 calls, removed from v3

### creator
`speak`, `deep-research`, `watch`, `gemini`

### Composable examples
```
minimal + soul         → community oracle (10 skills)
minimal + creator      → content creator (8 skills)
standard + network     → oracle developer (14 skills)
standard + workspace   → parallel agent work (14 skills)
```

---

## Subcommands

### /oracle prepare

Check for required tools and install any that are missing. Set up `gh` auth if needed.

**First, detect the platform** by checking the runtime environment (e.g. `uname` or `$OSTYPE`):

| Platform | Package manager |
|----------|----------------|
| macOS | `brew install <pkg>` |
| Linux (Debian/Ubuntu) | `sudo apt install <pkg>` (use official gh repo for gh) |
| Linux (Fedora/RHEL) | `sudo dnf install <pkg>` |
| Linux (Arch) | `sudo pacman -S <pkg>` |
| Windows | `winget install <pkg>` or `scoop install <pkg>` |

**Steps (run each in order):**

1. **Check git**: `git --version`
   - If missing, install with the platform's package manager
2. **Check gh**: `gh --version`
   - If missing, install:
     - macOS: `brew install gh`
     - Debian/Ubuntu: follow https://github.com/cli/cli/blob/trunk/docs/install_linux.md
     - Windows: `winget install GitHub.cli`
     - Others: platform package manager
3. **Check gh auth**: `gh auth status`
   - If not authenticated: run `gh auth login` and guide the user through it
4. **Check ghq**: `ghq --version`
   - If missing, install:
     - macOS: `brew install ghq`
     - Linux/Windows: `go install github.com/x-motemen/ghq@latest` (needs Go), or download binary from GitHub releases
5. **Check ghq root**: `ghq root`
   - If not set, suggest: `git config --global ghq.root ~/Code`

Print a summary table at the end:

```
Platform: macOS / Linux (Ubuntu) / Windows
Tool    Status
----    ------
git     ✓ installed (2.x.x)
gh      ✓ installed + authenticated
ghq     ✓ installed (root: ~/Code)
```

If everything is already set up, just print the summary — no changes needed.

### /oracle profile

List available profiles and current state.

Show which profile is active, which features are enabled, and skill counts:

```
Current: standard + soul (15 skills enabled, 15 disabled)

Profiles:
  minimal     4 skills   Daily ritual
  standard    9 skills   Daily driver + discovery  ← active
  full       30 skills   Everything

Features:
  soul        6 skills   Birth/awaken oracles  ← active
  network     5 skills   Multi-oracle comms
  workspace   5 skills   Parallel work + ops
  creator     4 skills   Content + research
```

### /oracle profile \<name\>

Switch to a profile tier. This enables the profile's skills and disables the rest.

**Enable** = rename `SKILL.md.disabled` → `SKILL.md`
**Disable** = rename `SKILL.md` → `SKILL.md.disabled`

Nothing is deleted. Disabled skills stay on disk, invisible to AI.

```bash
# For each skill in profile: enable
# For each skill NOT in profile: disable
```

Show before/after:
```
Switching to: standard

  ✓ forward        (was ✓)
  ✓ rrr            (was ✓)
  ✓ recap          (was ✓)
  ✓ standup        (was ✗ disabled → enabled)
  ✓ trace          (was ✓)
  ✓ dig            (was ✓)
  ✓ learn          (was ✓)
  ✓ talk-to        (was ✓)
  ✓ oracle-family-scan (was ✓)
  ✗ awaken         (was ✓ enabled → disabled)
  ✗ oraclenet      (was ✓ enabled → disabled)
  ...

9 enabled, 21 disabled. Restart session to apply.
```

### /oracle feature add \<name\>

Enable a feature module on top of current profile.

```bash
# Enable all skills in the feature
```

### /oracle feature remove \<name\>

Disable a feature module (only disables skills not in the active profile).

### /oracle enable \<skill...\>

Enable specific skills by name:

```bash
# For each skill name:
#   ~/.claude/skills/<name>/SKILL.md.disabled → SKILL.md
```

### /oracle disable \<skill...\>

Disable specific skills — **nothing is deleted**:

```bash
# For each skill name:
#   ~/.claude/skills/<name>/SKILL.md → SKILL.md.disabled
```

### /oracle skills

List all skills with current status:

```
Oracle Skills (30 installed, 9 enabled, 21 disabled)

  ✓ forward          minimal    730 calls
  ✓ rrr              minimal    981 calls
  ✓ recap            minimal    449 calls
  ✓ standup          minimal      4 calls
  ✓ trace            standard  1537 calls
  ✓ dig              standard   679 calls
  ✓ learn            standard   420 calls
  ✓ talk-to          standard   177 calls
  ✓ oracle-family-scan standard  319 calls
  ✗ awaken           [soul]      25 calls
  ✗ philosophy       [soul]      29 calls
  ✗ worktree         [workspace] 63 calls
  ✗ merged           [workspace]  0 calls
  ...
```

### /oracle install \<skill\>

Install a single skill.

```bash
oracle-skills install -g -y --skill <skill>
```

### /oracle remove \<skill\>

Uninstall a single skill.

```bash
oracle-skills uninstall -g -y --skill <skill>
```

---

## Quick Reference

| Command | Action |
|---------|--------|
| `/oracle prepare` | Check & install git, gh, ghq |
| `/oracle profile` | Show profiles + current state |
| `/oracle profile minimal` | Switch to minimal (4 skills) |
| `/oracle profile standard` | Switch to standard (9 skills) |
| `/oracle profile full` | Enable all 30 |
| `/oracle feature add soul` | Add soul skills |
| `/oracle feature remove creator` | Remove creator skills |
| `/oracle enable trace dig` | Enable specific skills |
| `/oracle disable watch gemini` | Disable specific skills |
| `/oracle skills` | List all with ✓/✗ status |

---

ARGUMENTS: $ARGUMENTS
