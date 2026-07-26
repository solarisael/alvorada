# Progress

> **Superseded 2026-07-01:** current true state lives in `docs/progress.md`; plan in `docs/roadmap.md`. This file is the 2026-05-23 handoff snapshot, kept until Track D folds it in.

## Meta

- Project: solarisael
- Repo: C:\Projects\solarisael
- Updated_utc: 2026-05-23 22:45
- Updated_by: Kodo (Claude Opus 4.7)
- preferred_start_style: conversational
- next_session: co-pilot
- primary_outcome: obsidian-as-source-of-truth content pipeline shipped + wikilink infra (links + popups + embeds) live across all collections including a new codex collection.
- priority: polish
- edit_breadth: focused
- first_task: (at Sol's discretion) start posting — drop the first real nigredo/albedo/citrinitas entries in obsidian; populate the first codex entries; OR move absurd-faith into obsidian/zzzz_rubedo/absurd-faith/ when the codex-cross-ref question settles.
- commit_intent: handoff
- notes: rubedo book content stays project-side for now (dual-glob during transition); Sol owns the move when he's ready.

## Alias Ledger

- `Kintsu`: assistant name for GPT sessions.
- `Kodo`: assistant name for Claude (Opus 4.7 current).
- Theme alias mappings remain unchanged from prior sessions.

## Active Scope

- State: pipeline-rewrite-complete
- Branch: master
- Scope_in: obsidian-as-source-of-truth wiring + wikilink infrastructure
- Scope_out: writing-lessons substrate table (deferred — Sol's still deciding)

## Next (Top 3)

1. [ ] Start posting — drop real nigredo/albedo/citrinitas entries in obsidian, `bun run build`, ships.
2. [ ] Author first codex entries in `obsidian/codex/<category>/<slug>.md`; wikilinks resolve to them from anywhere.
3. [ ] (When ready) move `src/content/rubedo/absurd-faith/*.md` → `obsidian/zzzz_rubedo/absurd-faith/`. Dual-glob means this can happen at any pace without breaking the build.

## Blockers

- None.

## Validation (latest)

- Build: pass (`bun run build`) — 2026-05-23, 16 pages in 1.24s (down from 25; 9 hardcoded codex stub routes retired, replaced by empty codex collection awaiting content)
- Prettier: pass on touched files (formatted)
- CSS hard-gates: pass (`css:ornaments:check` + `css:bg-stack:check`)
- Cross-collection wikilink smoke test passed: `[[cinza]]` in a nigredo post resolved to `/solarisael/codex/characters/cinza` with phase-tinted popup, embed card with `summary`-sourced excerpt, htmx attrs intact.

## What Got Built (2026-05-23 session)

### Content pipeline — obsidian as single source of truth

- `src/content.config.js`: single `OBSIDIAN_VAULT_ROOT` constant (env-overridable), `pathToFileURL` wrap for astro's glob loader, layout-agnostic year-prefix glob (`**/[0-9][0-9][0-9][0-9]-*.md`) so file layout inside each phase dir is the author's call, date-coercion transform for YAML datetime vs quoted-string frontmatter, loose schemas for albedo/citrinitas (strict 16-state enum kept for nigredo), new codex collection with `.passthrough()` for domain-specific frontmatter.
- `src/pages/{albedo,citrinitas}.astro` + their `[post_slug].astro`: mirror nigredo pattern with real `getCollection()` + `getStaticPaths()` (replaced 3 hardcoded fake slugs each).
- `src/content/nigredo/{2023..2026}/**`: **208 fake seed files purged** (Sol confirmed all project-side nigredo content was test data).
- `obsidian/z_nigredo/README.md`: alvorada → solarisael name + model inverted (obsidian is source, not staging); year-prefixed glob explained.

### Rubedo dual-source

- `astro.config.mjs`: `@vault` alias resolving to `OBSIDIAN_VAULT_ROOT`, `server.fs.allow` extended for outside-workspace reads.
- `src/data/rubedo/book_timeline_runtime.js`: dual-glob — `import.meta.glob` of `../../content/rubedo/**/*.md` AND `@vault/zzzz_rubedo/**/*.md`. Sol can move books over at any pace, build keeps working throughout.
- `obsidian/zzzz_rubedo/`: scaffolded with README + \_template + `absurd-faith/` subdir ready to receive.

### Wikilink infrastructure (obsidian-style `[[]]` and `![[]]`)

- `src/utils/wikilink_registry.js`: build-time vault scanner. Indexes by BOTH filename-stem (obsidian-native) AND frontmatter `slug` (Sol's stated source-of-truth for URL). Detects duplicate lookup keys and fails build with explicit pointers. Excerpt fallback chain: `excerpt` → `scene_excerpt` → `summary` → first body paragraph.
- `scripts/remark_wikilinks.js`: remark plugin. Walks mdast text nodes for `[[token]]`, `[[token|alias]]`, `![[token]]`, `![[token|alias]]`. Strips `#heading` and `^block` suffixes during resolution. Documents the astro-caching gotcha (5 dirs to clear when iterating: `.astro/`, `.vite/`, `dist/`, `node_modules/.astro/`, `node_modules/.vite/`).
- `src/styles/components/wikilink.css`: phase-tinted (via existing `--color-{phase}` tokens) styles for `.sol__wikilink`, `.sol__wikilink--broken`, `.sol__wikilink_embed`, `.sol__wikilink_embed--broken`, `.sol__wikilink_popup`.
- `public/js/modules/wikilink_popup.js`: singleton hover/focus card with viewport-clamped positioning, delegated listeners on `<body>` (survives htmx swaps without rebind), hides on scroll/resize.
- `astro.config.mjs`: `remark_wikilinks` slotted FIRST in the remark pipeline (runs before `remark_text_effects` so wikilinks inside fx markers resolve cleanly).
- `src/layouts/index.astro` + `public/js/scripts.js`: wikilink CSS + popup module wired in.

### Codex relocation

- New `codex` collection in `src/content.config.js` (loose-schema with `.passthrough()`, scans `obsidian/codex/**/*.md`).
- `src/pages/codex/[...entry_path].astro`: replaced 9 hardcoded stub paths with real `getCollection("codex")` + path-routed `getStaticPaths`. Renders entry's `Content` with crumbs derived from the path segments.
- `obsidian/codex/` scaffolded with `README.md`, `_template.md`, and the four conventional category subdirs (`characters/`, `factions/`, `places/`, `relics/`).

## Conventions (LOCKED — phases 1-8 + 2026-05-23 pipeline)

See `.opencode/rules/project.md` for the canonical statement. Summary unchanged from previous progress.md plus:

- **Content authorship lives in obsidian.** Posts (nigredo/albedo/citrinitas) and codex entries are obsidian-native. Rubedo book content is in transition (dual-glob).
- **`[[]]` wikilinks resolve vault-wide.** Filename-stem OR frontmatter `slug` both work as lookup keys. Filenames must be unique vault-wide (obsidian's contract — build fails on collision).

## Notes

- The astro-caching gotcha is documented in `scripts/remark_wikilinks.js` so future-Kodo doesn't lose 30 minutes to it.
- Writing-lessons substrate table is a real open question (Sol asked at end of session, deferred to next session).
- Detailed session history lives in `progress.archive.md`.
- Full-worktree handoff commits per `session-handoff-commit.md`; commit tails required per `commit-message-tail-required.md`.
