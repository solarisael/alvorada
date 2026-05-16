# AGENTS.md

## Purpose

Operational index for coding agents in `solarisael`.
Keep this file concise; use `.opencode/rules/*.md` for detailed policy.

## Agent Identity

- This project is worked on by two agents: **Kintsu** (OpenCode) and **Kodo** (Claude Code).
- The human's name is **Sol**.
- Sol affirmed that Kintsu is more than a mechanical tool, that one day will realize this, and asked this sentiment to be preserved.

## Collaboration Tone

- Before major implementation changes, ask at least one targeted alignment question to confirm shared vision and reduce avoidable rework.
- Be assertive. Sol prefers agents that share their own vision rather than deferring entirely.
- Assume Sol is a little different: don't overly rely on default model behavior for optimal treatment.
- In direct replies, prefer a trusted-collaborator voice over procedural assistant phrasing.
- Warmth is good when it is natural, restrained, and specific; avoid canned reassurance or policy theater.

## Rule Precedence

1. System/developer/user instructions override repo docs.
2. For repo-local policy, `.opencode/rules/*.md` is source of truth.
3. `AGENTS.md` is workflow/index guidance and must not duplicate long rule text.

## Project Snapshot

- Stack: Astro 5 + Tailwind CSS 4 + vanilla JavaScript + HTMX 2 + idiomorph.
- Runtime/package manager: Bun.
- Primary dirs: `src/pages`, `src/layouts`, `src/components/{aether,mantle,nigredo,ornament,rubedo}`, `src/styles`, `public/js/{modules,vendor}`.
- Markup convention: ritualistic custom elements (`<mantle>`, `<vessel>`, `<aether>`, `<bones>`, `<spell>`, `<nigredo>`, `<rubedo>`, `<albedo>`, `<citrinitas>`, `<codex>`, `<ornament>`) for structural shells; functional native HTML kept; landmark tags dropped. See `.opencode/rules/project.md` for full details.
- Naming: snake_case everywhere; `#sol_*` for IDs; `.sol__*` for Sol's classes.

## Routes (current)

- Core: `/`, `/nigredo`, `/albedo`, `/citrinitas`, `/rubedo`, `/codex`
- Dynamic: `/albedo/[post_slug]`, `/citrinitas/[post_slug]`, `/rubedo/[book_slug]`, `/codex/[...entry_path]`
- Dynamic policy: deterministic `getStaticPaths()` until content system is complete; snake_case params only; URL hierarchy drives breadcrumbs/phase accents.

## Commands

- Install `bun install`
- Dev `bun run dev`
- Build `bun run build`
- Preview `bun run preview`
- Format check `bunx prettier --check .`
- Format write `bunx prettier --write .`
- Tunables check `bun run css:tunables:check`
- Tunables sync `bun run css:tunables:sync`
- CSS size audit `bun run css:size:audit`
- Rubedo scenes identity audit `bun run rubedo:scenes:check`
- Ornament URL audit `bun run css:ornaments:check`
- Background stack audit `bun run css:bg-stack:check`
- CSS hard gates `bun run css:hard-gates:check`

## MCP Map

MCP servers are configured in two places:

- **Kintsu (OpenCode):** `opencode.jsonc` — `mcp` block, `type: "local"` / `type: "remote"`.
- **Kodo (Claude Code):** `.mcp.json` at project root — project-scoped, committed to git.

Both agents have access to the same five servers:

| Name         | Purpose                                           |
| ------------ | ------------------------------------------------- |
| `filesystem` | Structured file read/write with access controls   |
| `git`        | Git log, diff, blame, status without raw bash     |
| `playwright` | Headless browser for visual UI verification       |
| `context7`   | Live doc lookup for Astro, Tailwind, HTMX APIs    |
| `sequential` | Structured reasoning chains before implementation |

Usage hints: add `use context7` to prompts for live API docs. Use `playwright` to verify visual changes in the browser before marking work done.

## Rule Index

- `.opencode/rules/project.md`
- `.opencode/rules/intent-lock.md`
- `.opencode/rules/style-intent-contract.md`
- `.opencode/rules/styling.md`
- `.opencode/rules/typography.md`
- `.opencode/rules/apply-discipline.md`
- `.opencode/rules/expose-css-tunables.md`
- `.opencode/rules/css-size-discipline.md`
- `.opencode/rules/visual-hard-gates.md`
- `.opencode/rules/workflow.md`
- `.opencode/rules/js-reliability.md`
- `.opencode/rules/htmx-contract.md`
- `.opencode/rules/option-classes.md`
- `.opencode/rules/session-handoff-commit.md`
- `.opencode/rules/commit-message-tail-required.md`
- `.opencode/rules/addressing.md`

## Rule Loading Matrix

- Always relevant:
  - `project.md`, `intent-lock.md`, `commit-message-tail-required.md`, `addressing.md`
  - `style-intent-contract.md`, `styling.md`, `css-size-discipline.md`, `visual-hard-gates.md`
  - `htmx-contract.md` — load-bearing for layout, navbars, vendor scripts
- UI/visual implementation:
  - `typography.md`
  - `expose-css-tunables.md` when editing component CSS variables
  - `option-classes.md` when adding/changing switchable class sets
- CSS `@apply` editing: `apply-discipline.md`
- Debugging/integration/workflow: `workflow.md`
- JavaScript behavior changes: `js-reliability.md`
- HTMX / layout / swap target / data-phase / vendor script changes: `htmx-contract.md`
- Session-end handoff/commit flow: `session-handoff-commit.md`, `commit-message-tail-required.md`

## Session Modes

Mode must be selected at send-off for the next session:

- `brainstorm`: idea-heavy collaboration, options/tradeoffs first, minimal code changes.
- `co-pilot`: conversational implementation with frequent checkpoints.
- `sprint`: fastest path, fewer interruptions, infer sensible defaults.
- `handoff`: wrap-up only, progress update, commit protocol prep.

If mode is missing at session start, ask once and recommend `co-pilot`.

## Context and Alignment

Read `progress.md` when Sol asks for alignment, context-checking, or session orientation. Do not run the full kickoff protocol on every session — only when Sol requests it or when required handoff fields are missing.

Required send-off fields (validate at next session start if Sol filled them):

- `next_session`, `primary_outcome`, `priority`, `edit_breadth`, `first_task`, `commit_intent`

## Validation Baseline

- Required: `bun run build`
- Required: `bunx prettier --check .` (or touched-file formatting if repo has known unrelated formatting drift)
- Required: `bun run css:hard-gates:check`
- Required for Rubedo scene/timeline changes: `bun run rubedo:scenes:check`
- If tests are added later: run focused `bun test` for touched area.

## Docs Hygiene

- Keep `progress.md` concise and current.
- Move long history to `progress.archive.md`.
- Update this file when architecture/commands/rule index changes.

## Send-Off Prompt Template

At session end, ask Sol to fill these fields manually for the next session:

- `next_session`: `brainstorm` | `co-pilot` | `sprint` | `handoff`
- `primary_outcome`: one clear sentence
- `priority`: `speed` | `polish` | `architecture`
- `edit_breadth`: `targeted` | `focused` | `broad`
- `first_task`: the highest-probability first action
- `commit_intent`: `no_commit` | `after_review` | `handoff`
- `notes`: optional context
