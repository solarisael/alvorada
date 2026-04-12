# Active Quests

## Meta

- Project: alvorada
- Updated_utc: 2026-04-12 17:15
- Updated_by: Kintsu (`openai / gpt-5.4`)
- next_session: co-pilot
- primary_outcome: continue Rubedo chapter-shell identity tuning and narrative presentation now that the reading plane/fog system is behaving correctly
- priority: polish
- edit_breadth: focused
- first_task: refine the reading-plane glow palette and continue chapter-shell spacing/identity decisions from the now-stable box and viewport fog layers
- commit_intent: handoff

## Active Scope

- State: handoff_ready
- Branch: master
- Head: pending_commit
- Scope_in: repo agent/runtime alignment, Rubedo chapter metadata cleanup, HTMX shell sync, reading-plane motion tuning, navbar/breadcrumb shell polish, box and viewport fog/glow tuning
- Scope_out: deeper content-authoring beyond the touched Rubedo chapter entry, unrelated future color retuning outside the current reading-plane shell work

## Next

1. [x] Realign local agent docs, command docs, and runtime config with the active House setup.
2. [x] Rework Rubedo chapter rendering so titles resolve correctly and chapters begin immediately without pre-body meta clutter.
3. [x] Stabilize HTMX shell/home navigation and retune the reading plane motion plus viewport/box glow layers.
4. [ ] Continue visual tuning from the now-working glow system, especially color character and final chapter-shell spacing identity.

## Blockers

- None.

## Validation

- House test: pass (`bun test tests/solarisael-house.test.mjs`) — 2026-04-12
- Timeline resolver test: pass (`bun test tests/timeline_threads.test.js`) — 2026-04-12
- Build: pass (`bun run build`) after shell/runtime and reading-plane changes — 2026-04-12
- Prettier: pass (touched alignment files) — 2026-04-12

## Current Snapshot

- Repo-local agent docs were reduced back to a project overlay instead of a competing runtime doctrine.
- Identity mapping drift was fixed across AGENTS, rules, command docs, and runtime plugins.
- Stale plugin paths were corrected in `opencode.jsonc`, and the House plugin test was renamed and updated to match current spirit language.
- HTMX navigation remains the site-wide contract; shell-state syncing was added so home transitions keep working without full reloads.
- Rubedo chapter-level metadata is now canonically resolved from the `cinza` thread, and chapter routes no longer show description/snippet/scene-label clutter before the prose.
- The reading plane motion no longer uses RAF easing; it now uses direct throttled scroll updates plus a short CSS transition for a faster, cleaner response.
- The viewport focus fog and the clipped box glow layers are both working, but final color-character tuning is still open for future polish.
