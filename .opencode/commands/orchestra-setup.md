---
description: Bootstrap orchestra setup for the current project
agent: build
---

Use `solarisael_orchestra_setup` for project-level orchestra bootstrap.

Scope:

- scaffold `.opencode/solarisael-orchestra.json`
- include generic command scaffolding by default (equivalent to `scaffold-setup`)
- do not install global plugins, sounds, or operator identity files

Default behavior:

- `includeScaffoldSetup` defaults to `true`
- existing files are preserved unless overwrite flags are explicitly provided
- report config scaffold status and command scaffold status
