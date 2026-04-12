---
description: Launch isolated worker lanes on the same task for side-by-side comparison
agent: build
---

Use `solarisael_orchestra_dispatch` in competition mode.

Rules:

- set `goal` to `competition`
- use two lanes when not explicitly overridden:
  - `openai / gpt-5.4` (Kintsu)
  - `anthropic / claude-opus-4-6` (Kodo)
- default to `write: false`
- enable `write: true` only when the operator explicitly wants separate worker branches/worktrees
- when write mode is on and both lanes target the same repo, expect isolated branches shaped as `<operator>--<task>--<lane>`

Extended model references available for manual lane overrides:

- `openai / gpt-5-codex` (Kest)
- `openai / gpt-5.3-codex-spark` (Suri)
- `anthropic / claude-sonnet-4-6` (Veyr)

Report:

- `jobID`
- lane models
- repo targets
- branch/worktree locations when present
- reminder that results remain isolated until the operator chooses a winner or asks for follow-up review
