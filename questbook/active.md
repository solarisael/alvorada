# Active Quests

## Meta

- Project: alvorada
- Updated_utc: 2026-04-22 17:10
- Updated_by: Kodo (`anthropic / claude-opus-4-7`)
- next_session: co-pilot
- primary_outcome: fix the script-load-order race where `idiomorph-ext.js` (classic script) tries to reference `htmx` before `htmx_runtime.js` (module) finishes loading — visible as `ReferenceError: htmx is not defined` in the console on first paint.
- priority: polish
- edit_breadth: targeted
- first_task: audit how the scripts are emitted from the layout(s) (likely `src/layouts/*.astro`), identify whether `idiomorph-ext.js` can be loaded as a module (or deferred, or imported from `htmx_runtime.js` directly), and land the fix so the console error disappears on a fresh `/nigredo` visit.
- commit_intent: after_review

## Active Scope

- State: handoff_ready
- Branch: sol
- Head: pending_commit (Nigredo scroll-fix changes staged)
- Scope_in: script load-order fix between htmx_runtime + idiomorph-ext; any adjacent dependency-chain cleanup surfaced by the audit.
- Scope_out: Rubedo chapter-shell polish (moved to `backlog.md`); unrelated decorative/content work.

## Next

1. [x] Fix Nigredo archive scroll — unified window/document scroll, TanStack window observers. (See `completed.md` 2026-04-22.)
2. [x] AGENTS.md Kodo model refresh (4-6 → 4-7).
3. [ ] **Fix `htmx is not defined at idiomorph-ext.js` load-order race.** Make idiomorph-ext load as a module so it imports `htmx_runtime.js` properly, OR ensure it runs after htmx is exposed. Target: zero console errors on fresh page load for any of the five alchemical phases.

## Blockers

- None.

## Validation

- Nigredo fix: `bunx prettier --check` pass, `bun run css:hard-gates:check` pass, `bun run build` pass (238 pages, 2.58s), Playwright virtualizer + filter tests pass — 2026-04-22.

## Current Snapshot

- Nigredo archive scroll fixed today (2026-04-22) by Kodo — details in `completed.md`. The `.nigredo-scroll-pane` is no longer an overflow container; TanStack virtualizer now uses window observers (`getScrollElement: () => window`). Browser scroll restoration + keyboard scroll both work naturally as a bonus.
- AGENTS.md refreshed to Kodo `claude-opus-4-7`.
- Residual drift present in the worktree and NOT touched by this session: `templater/timeline_thread_scene_template.md` has unstaged changes of unknown origin, and `.opencode/package-lock.json` is untracked. Flagged for Sol to decide intent before a broader commit.
- Outstanding polish thread (Rubedo chapter-shell identity + reading-plane glow) moved to `backlog.md`.
- Next work is the htmx/idiomorph load-order race — separate small fix, confirmed by Sol.

## Notes

- This is a light same-session update, not a full end-of-day send-off. Fields are filled for continuity but the session is still active with Kodo.
