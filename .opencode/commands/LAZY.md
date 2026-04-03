# LAZY

Fast command lookup for sol OpenCode orchestration.

Command authority:

- command behavior is authoritative only in `.opencode/commands/`
- if a command is described elsewhere and wording differs, the command file wins
- if a write request could mean more than one command, do not assume; ask the operator to choose

Explicit invocation forms:

- `invoke command <name>`
- `/<name>`

## Orchestra Commands

- `orchestra` — canonical entrypoint for explicit `solarisael-orchestra` dispatch
- `orchestra-duel` — canonical side-by-side competition entrypoint
- `orchestra-status` — inspect a previously dispatched `solarisael-orchestra` job by `jobID`
- `sol-plugins` — install shared runtime plugins/sounds plus neutral operator baseline files
- `scaffold-setup` — scaffold generic local `.opencode/commands/*` templates
- `orchestra-setup` — scaffold `.opencode/solarisael-orchestra.json` and, by default, generic command scaffolding
- `delegate` and `duel` remain shorthand aliases

## Quick Picks

- Install shared plugins and sounds locally — `sol-plugins`
- Scaffold generic project command files — `scaffold-setup`
- Bootstrap orchestra in the current repo — `orchestra-setup`
- Dispatch worker lanes for a task — `orchestra`
- Run GPT vs Claude on one task — `orchestra-duel`
- Check a worker job later — `orchestra-status`
