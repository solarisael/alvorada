---
description: Install the shared sol OpenCode plugins and sound pack into the local operator runtime
agent: build
---

Use `sol_runtime_install` to install the shared sol OpenCode runtime assets.

Default behavior:

- copy the allowlisted shared plugins from the installed sol plugin bundle into `%USERPROFILE%/.config/opencode/plugins/`
- copy the shared sound files from the installed sol plugin bundle into `%USERPROFILE%/.config/opencode/sounds/`
- create `%USERPROFILE%/.local/operators/` and `%USERPROFILE%/.local/operators/spirits/` when missing
- seed a neutral shared baseline plus a starter `Kintsu.md` spirit into `%USERPROFILE%/.local/operators/`
- ensure the local OpenCode config includes the installed plugin file URIs without duplicating entries
- ensure the local OpenCode config includes the shared baseline instruction path without duplicating entries
- do not scaffold project `.opencode` files; project setup uses separate commands

Current shared plugin set:

- `notification-sounds.ts`
- `sol-anthropic-bypass.mjs`
- `solarisael-orchestra.mjs`
- `solarisael-house.mjs`

Seeded operator files:

- `AGENTS.shared.md` (neutral baseline)
- `spirits/Kintsu.md` (starter spirit)

Execution rules:

- use `dryRun: true` only when the operator explicitly asks for a preview
- otherwise install both plugins and sounds in one pass
- after the tool runs, report the copied plugin paths, copied sound paths, copied operator baseline files, and the final config path touched
- after install, tell the operator to edit `~/.local/operators/spirits/Kintsu.md` to match their preferences and add more spirit files manually if they want more spirits
- for project scaffolding, direct the operator to `scaffold-setup` or `orchestra-setup`
