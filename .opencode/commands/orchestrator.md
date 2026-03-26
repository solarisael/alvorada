---
description: Dispatch a task through sol-orchestrator with explicit operator invocation
agent: build
---

Use `sol_orchestrator_dispatch` to launch worker lanes only when the operator explicitly invokes `orchestrator`.

Requirements:

- orchestration stays dormant unless the operator explicitly calls `orchestrator`
- infer the operator automatically from the current repository branch when possible
- infer the best topology for the scenario (`single`, `relay`, or `isolate`)
- prefer `hybrid` as the sane default for write-capable multi-lane work
- keep write mode off unless the operator explicitly asked for worker branches or worktrees
- prefer adapter-defined repo routing when available; otherwise accept generic single-repo mode
- if the tool reports generic mode for a new project, surface that prompt to the operator instead of pretending project routing exists

When you call the tool:

- pass the operator's task packet as `task`
- let execution mode default to `auto` unless the operator explicitly wants competition or review mode
- set `repos` only when repo scope is already clear
- set `write` to `true` only when the operator explicitly wants worker branches/worktrees
- if the operator wants project-aware routing in a new repo, help them define `.opencode/sol-orchestrator.json`

Default model references:

- `openai / gpt-5.4`
- `openai / gpt-5-codex`
- `openai / gpt-5.3-codex-spark`
- `anthropic / claude-opus-4-6`
- `anthropic / claude-sonnet-4-6`

After the tool returns:

- report the `jobID`
- list each lane with model, repo, branch, worktree directory, and session id
- mention return-chain continuation via `sol_orchestrator_continue` when relevant
- if write mode is enabled, remind the operator that no auto-merge or auto-promotion occurs
