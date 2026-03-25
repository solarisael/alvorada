# LAZY

Fast command lookup for sol OpenCode orchestration.

Command authority:

- command behavior is authoritative only in `.opencode/commands/`
- if a command is described elsewhere and wording differs, the command file wins
- if a write request could mean more than one command, do not assume; ask the operator to choose

Explicit invocation forms:

- `invoke command <name>`
- `/<name>`

## Orchestration Commands

- `orchestrator` — canonical entrypoint for explicit `sol-orchestrator` dispatch
- `orchestrator-duel` — canonical side-by-side competition entrypoint
- `orchestrator-status` — inspect a previously dispatched `sol-orchestrator` job by `jobID`
- `sol-plugins` — install the shared sol plugins and sound pack into the local OpenCode runtime and scaffold new-repo orchestrator files when requested
- `delegate`, `duel`, `orchestrator-install`, and `install-sol-runtime` remain compatibility aliases

## Quick Picks

- Install shared plugins and sounds locally — `sol-plugins`
- Scaffold a new repo for orchestrator use — `sol-plugins` with `projectConfig: true`
- Dispatch worker lanes for a task — `orchestrator`
- Run GPT vs Claude on one task — `orchestrator-duel`
- Check a worker job later — `orchestrator-status`
