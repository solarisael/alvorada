---
description: Install the shared sol OpenCode plugins and sound pack into the local operator runtime
agent: build
---

Use `sol_runtime_install` to install the shared sol OpenCode runtime assets.

Default behavior:

- copy the allowlisted shared plugins from the installed sol plugin bundle into `%USERPROFILE%/.config/opencode/plugins/`
- copy the shared sound files from the installed sol plugin bundle into `%USERPROFILE%/.config/opencode/sounds/`
- ensure the local OpenCode config includes the installed plugin file URIs without duplicating entries
- leave project config files alone unless the operator explicitly asks to scaffold one

Current shared plugin set:

- `notification-sounds.ts`
- `sol-anthropic-bypass.mjs`
- `sol-orchestrator.mjs`

Execution rules:

- use `dryRun: true` only when the operator explicitly asks for a preview
- otherwise install both plugins and sounds in one pass
- use `projectConfig: true` when the operator explicitly wants `.opencode/sol-orchestrator.json` scaffolded for the current project or wants first-time orchestrator bootstrap in a new repo
- when `projectConfig: true`, command scaffolding should also happen unless the operator explicitly disables it with `projectCommands: false`
- use `overwriteProjectConfig: true` only when the operator explicitly wants to replace an existing project config
- use `overwriteProjectCommands: true` only when the operator explicitly wants to replace existing scaffolded command files
- when a built-in project adapter is recognized, the scaffold should mirror that project's repo map instead of falling back to the generic single-repo template
- after the tool runs, report the copied plugin paths, copied sound paths, the final config path touched, and any project files scaffolded
