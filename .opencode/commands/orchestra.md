---
description: Dispatch a task through solarisael-orchestra with explicit operator invocation
agent: build
---

Use `solarisael_orchestra_dispatch` to launch worker lanes only when the operator explicitly invokes `orchestra`.

Requirements:

- orchestration stays dormant unless the operator explicitly calls `orchestra`
- after dispatch returns, stop and wait for explicit operator instruction before running `orchestra-status`, `orchestra-continue`, `orchestra-adjudicate`, or any new child process
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
- if the operator wants project-aware routing in a new repo, help them define `.opencode/solarisael-orchestra.json`

Default model references:

- `openai / gpt-5.4` - Kintsu
- `openai / gpt-5-codex` - Kest
- `openai / gpt-5.3-codex-spark` - Suri
- `anthropic / claude-opus-4-6` - Kodo
- `anthropic / claude-sonnet-4-6` - Veyr

After the tool returns:

- report the `jobID`
- list each lane with model, repo, branch, worktree directory, and session id
- mention return-chain continuation via `solarisael_orchestra_continue` when relevant
- if write mode is enabled, remind the operator that no auto-merge or auto-promotion occurs
- do not auto-run follow-up orchestration tools unless the operator explicitly asks
