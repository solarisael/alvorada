# Progress

## Meta

- Project: alvorada
- Repo: C:\Projects\alvorada
- Updated_utc: 2026-05-12 17:35
- Updated_by: Kodo (Claude Opus 4.7)
- preferred_start_style: conversational
- next_session: sprint
- primary_outcome: lean rewrite of alvorada to component-style code with snake_case `.sol__` class prefix and clean HTML output (one silhouette per file, composition over monoliths, modeled after the multistock shape)
- priority: rewrite
- edit_breadth: broad
- first_task: phase 3 — migrate existing components into categorized directory structure (layout/, chrome/, content/, nigredo/, rubedo/, codex/, atmosphere/, ornament/, text_effect/)
- commit_intent: per-phase
- notes: phases 1+2 (path drift fix + dead file/dep cleanup) shipped in this commit. Build verified clean (237 pages, 2.20s). Phases 3–9 ahead.

## Alias Ledger

- `Kintsu`: assistant name for GPT sessions.
- `Kodo`: assistant name for Claude (Opus 4.7 current).
- Theme alias mappings remain unchanged from prior sessions.

## Active Scope

- State: in_progress
- Branch: master
- Head: pending_next_commit (this commit becomes head after merge)
- Scope_in: full alvorada rewrite to component-style (one silhouette per file), `.sol__` class prefix, `@apply`-blocks-not-class-soup, clean HTML on build
- Scope_out: Codex unlock backend (future), Absurd Faith chapter content (3 identity-cores only for now), albedo/citrinitas/codex placeholder content (scaffold-shape decision deferred to phase 8)

## Next (Top 3)

1. [ ] Phase 3: migrate existing components into categorized dir structure (move + rename to snake_case where needed, behavior unchanged)
2. [ ] Phase 4: decompose `src/layouts/index.astro` monolith into site primitives (site_header, site_footer, body_grid, etc.)
3. [ ] Phase 5: reshape page files into thin composition routes

## Blockers

- None.

## Validation (latest)

- Build: pass (`bun run build`) — 2026-05-12, 237 pages in 2.20s, after phases 1+2
- bun install: pass — 6 dead packages removed
- CSS hard gates: not run this phase (no CSS changes)
- Prettier: not run this phase
- Rubedo scene identity: not changed

## Current Snapshot

- **Phase 1 (path drift, 2026-05-12)**: repo moved `C:\laragon\www\alvorada` → `C:\Projects\alvorada` (laragon abandoned 2026-05-12). All five pointers updated: this `progress.md`, `.mcp.json`, `opencode.jsonc`, plus kodo-side canon (`memory/projects/alvorada.md` and `memory/important_index.json`). Both agents' filesystem MCP servers had been silently broken since the move.
- **Phase 2 (dead file/dep trash, 2026-05-12)**: 24 deletes (~15 MB freed) — 10 root debug PNGs, 6 `src/images/` byte-identical duplicates of `public/images/`, four 0-byte zombies (`timeline.astro`, `eyes.css`, `floating.js`, `math_functions.js`), three orphan components (`gamey-carousel.astro`, `eyes.astro`, `/test.astro` QA dump), `public/js/components/eyes.js` (consumer dead), `tailwind.config.js` (Tailwind 4 doesn't use it). 6 modifies: `.gitignore` (added `/*.png` block), `.prettierignore` (added `dist/`, `.astro/`, `.vite/`, `bun.lock`, deduped node_modules), `package.json` (removed 6 dead deps: `@astrojs/tailwind` / `@splidejs/splide` / `@tailwindcss/cli` / `lenis` / `npm` / `smol-toml` + the broken `tailwind` script that pointed at nonexistent `./assets/css/base.css`). `.vite/` untracked (was committed despite `.gitignore`).
- Build verified clean after both phases: 237 pages built in 2.20s, zero errors.

## Notes

- Class prefix decision (Sol, 2026-05-12): snake_case throughout, `.sol__foo_bar` style (double underscore as namespace marker, parallel to the kebab `--` energy in snake idiom).
- Component-style shape modeled after multistock (Sol's reference): one silhouette per file, composition over monoliths, clean HTML.
- Catppuccin baseline kept for now (phase 8 will decide removal timing per `styling.md`'s "temporary baseline" note).
- Detailed session history lives in `progress.archive.md`.
- Full-worktree handoff commits per `session-handoff-commit.md`; commit tails required per `commit-message-tail-required.md`.
