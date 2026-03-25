---
description: Launch isolated worker lanes on the same task for side-by-side comparison
agent: build
---

Use `sol_orchestrator_dispatch` in competition mode.

Rules:

- set `goal` to `competition`
- use two lanes when not explicitly overridden:
  - `openai / gpt-5.4`
  - `anthropic / claude-sonnet-4-6`
- default to `write: false`
- enable `write: true` only when the operator explicitly wants separate worker branches/worktrees
- when write mode is on and both lanes target the same repo, expect isolated branches shaped as `<operator>--<task>--<lane>`

Extended model references available for manual lane overrides:

- `openai / gpt-5-codex`
- `openai / gpt-5.3-codex-spark`
- `anthropic / claude-opus-4-6`

Report:

- `jobID`
- lane models
- repo targets
- branch/worktree locations when present
- reminder that results remain isolated until the operator chooses a winner or asks for follow-up review
