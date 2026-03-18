# Pulse CLI - AI Context

## Project Overview
- **Project Name:** Pulse CLI
- **GitHub URL:** https://github.com/Krudony/pulse-cli.git
- **Description:** Project heartbeat for the Oracle family — manage GitHub Projects V2 from the terminal.
- **Tech Stack:** Bun, GitHub CLI (`gh`), TypeScript, GraphQL.

## Core Features
- Manage GitHub Projects V2 from the terminal.
- Task Management (add, start, close, set, remove, clear).
- Board Visibility (board, timeline, triage, scan).
- Fleet/Agent Management (heartbeat, escalate, resume, cleanup, auto-assign, sentry).
- Ops & Maintenance (init, field-add, scheduler, blog, backfill-wt).

## Architecture
- `packages/sdk/`: Core logic (types, GitHub API, formatting, filtering, routing).
- `packages/cli/`: CLI entry point and 22 commands.

## Getting Started
- Requires [Bun](https://bun.sh) and [GitHub CLI](https://cli.github.com).
- Run `bun install`.
- Run `bun packages/cli/src/pulse.ts init` to setup.

## Current Focus
- Initializing the project with ψ-Standard structure.
