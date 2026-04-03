---
description: Scaffold generic local .opencode command files for the current project
agent: build
---

Use `sol_scaffold_setup` for project-local command scaffolding.

Scope:

- scaffold `.opencode/commands/*` templates used by local command invocation
- do not install global plugins, sounds, or operator identity files
- do not create `.opencode/solarisael-orchestra.json`

Default behavior:

- keep existing command files intact unless overwrite is explicitly requested
- report created, skipped, and overwritten files
