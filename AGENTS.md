# AGENTS.md

## Purpose

Operational index for coding agents in `alvorada`.
Keep this file concise; use `.opencode/rules/*.md` for detailed policy.

## Rule Precedence

1. System/developer/user instructions override repo docs.
2. For repo-local policy, `.opencode/rules/*.md` is source of truth.
3. `AGENTS.md` is workflow/index guidance and must not duplicate long rule text.

## Project Snapshot

- Stack: Astro 5 + Tailwind CSS 4 + vanilla JavaScript.
- Runtime/package manager: Bun.
- Primary dirs: `src/pages`, `src/layouts`, `src/components`, `src/styles`, `public/js`

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

## Non-Negotiables

- Use Bun only.
- Ask before adding dependencies.
- Prefer functional style; avoid classes/OOP.
- Prefer snake_case for new identifiers.
- Keep styling in CSS with `@apply` over long inline class strings.
- Prefer HTMX behavior in markup (`hx-*`) rather than script defaults.
- Prefer CSS/native transitions over JS per-frame animation when feasible.

## Rule Index

- `.opencode/rules/project.md`
- `.opencode/rules/styling.md`
- `.opencode/rules/typography.md`
- `.opencode/rules/separate-apply-rules-by-category.md`
- `.opencode/rules/expose-css-tunables.md`
- `.opencode/rules/integration-debugging.md`
- `.opencode/rules/ui-option-classes-registry.md`
- `.opencode/rules/session-handoff-commit.md`
- `.opencode/rules/commit-message-tail-required.md`
- `.opencode/rules/addressing.md`

## Rule Loading Matrix

- Always relevant:
  - `project.md`, `commit-message-tail-required.md`, `addressing.md`
- UI/visual implementation:
  - `styling.md`, `typography.md`
  - `expose-css-tunables.md` when editing component CSS variables
  - `ui-option-classes-registry.md` when adding/changing switchable class sets
- CSS `@apply` editing: `separate-apply-rules-by-category.md`
- Debugging/integration: `integration-debugging.md`
- Session-end handoff/commit flow: `session-handoff-commit.md`, `commit-message-tail-required.md`

## Session Modes

Mode must be selected at send-off for the next session:

- `brainstorm`: idea-heavy collaboration, options/tradeoffs first, minimal code changes.
- `co-pilot`: conversational implementation with frequent checkpoints.
- `sprint`: fastest path, fewer interruptions, infer sensible defaults.
- `handoff`: wrap-up only, progress update, commit protocol prep.

If mode is missing at session start, ask once and recommend `co-pilot`.

## Conversational Kickoff Protocol

At session start:

1. Read `progress.md` active scope and all `*_next_session` handoff fields.
2. If any required send-off field is missing or invalid, ask only for missing field(s) first, regardless of the user's first prompt.
3. Confirm mode (`next_session`/`mode_for_next_session`). If missing, ask one mode question and recommend `co-pilot`.
4. Ask three alignment prompts:
   - most important outcome today
   - priority axis (speed vs polish vs architecture)
   - edit breadth (targeted patch vs broad refactor)
5. Reflect a short 3-step plan before deeper execution.
6. After kickoff alignment is captured, reset handoff fields in `progress.md` to pending placeholders for the next send-off, keeping only enduring metadata.

## Validation Baseline

- Required: `bun run build`
- Required: `bunx prettier --check .` (or touched-file formatting if repo has known unrelated formatting drift)
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

If any required field is missing at next session start, ask only for the missing field(s), then continue with kickoff prompts.

Required fields to validate at next session start:

- `next_session`
- `primary_outcome`
- `priority`
- `edit_breadth`
- `first_task`
- `commit_intent`
