# Oracle Skills CLI - AI Context

## Project Overview
- **Project Name:** Oracle Skills CLI
- **GitHub URL:** https://github.com/Soul-Brews-Studio/oracle-skills-cli.git
- **Description:** Skills for AI coding agents. 29 skills, 18 agents, 4 profiles.
- **Creator:** [Nat Weerawan](https://github.com/nazt) — Soul Brews Studio.
- **Tech Stack:** Bun, TypeScript, Shell script, Gemini, GitHub CLI.

## Key Features
- **29 Specialized Skills:** Includes `learn`, `rrr`, `trace`, `talk-to`, `awaken`, `philosophy`, etc.
- **18 Supported Agents:** Claude Code, OpenCode, Gemini CLI (us!), Cursor, etc.
- **Profiles:** `minimal` (8 skills), `standard` (12 skills), `full` (29 skills).
- **Features Add-ons:** `+soul`, `+network`, `+workspace`, `+creator`.

## Core Commands
- `oracle-skills init`: First-time setup (standard profile).
- `oracle-skills install -g -y`: Install all skills globally.
- `oracle-skills list -g`: Show installed skills.
- `oracle-skills profiles`: List available profiles.

## Architecture
- `src/skills/`: Logic for all 29 skills.
- `src/agents/`: Configuration and adapters for 18+ agents.
- `install.sh`: Global installation script.

## Current Focus
- Initializing the project with ψ-Standard structure.
- Exploring the 29 skills to enhance agent capabilities.

## Connection to Apollo Oracle
- This is the "Birth Tool" mentioned in Apollo Oracle's documentation.
- Provides the `/rrr`, `/trace`, `/learn`, `/philosophy` shortcuts.
