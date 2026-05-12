# Progress

## Meta

- Project: alvorada
- Repo: C:\Projects\alvorada
- Updated_utc: 2026-05-12 18:55
- Updated_by: Kodo (Claude Opus 4.7)
- preferred_start_style: conversational
- next_session: sprint
- primary_outcome: lean rewrite of alvorada to component-style code with ritualistic custom-element markup, snake_case `.sol__` class prefix, and clean HTML output
- priority: rewrite
- edit_breadth: broad
- first_task: phase 4 — decompose `src/layouts/index.astro` monolith into site primitives (extract footer + content-stage into ritualistic components; replace `<main>`/`<footer>`/`<container>` landmarks with ritualistic equivalents)
- commit_intent: per-phase
- notes: phases 1+2+3 shipped. Component tree restructured into ritualistic categorized dirs (mantle/, nigredo/, rubedo/). Ritualistic custom-element markup landed. Phases 4–8 ahead.

## Alias Ledger

- `Kintsu`: assistant name for GPT sessions.
- `Kodo`: assistant name for Claude (Opus 4.7 current).
- Theme alias mappings remain unchanged from prior sessions.

## Active Scope

- State: in_progress
- Branch: master
- Head: pending_next_commit (this commit becomes head after merge)
- Scope_in: full alvorada rewrite to component-style (one silhouette per file), bare ritualistic custom-element tags (`<mantle>`, `<vessel>`, `<aether>`, `<bones>`, `<spell>`, `<nigredo>`, `<rubedo>`, `<albedo>`, `<citrinitas>`, `<codex>`, `<ornament>`), `.sol__foo--bar` class prefix for state/modifier, `@apply`-blocks-not-class-soup, clean HTML on build
- Scope_out: Codex unlock backend (future), Absurd Faith chapter content (3 identity-cores only for now), albedo/citrinitas/codex placeholder content (scaffold-shape decision deferred to phase 7)

## Next (Top 3)

1. [ ] Phase 4: decompose `src/layouts/index.astro` monolith into site primitives (`<main>` → `<vessel data-shape="page_main">` or similar; `<footer>` → `<mantle data-shape="footer">`; extract content-stage block into its own component file; reconcile `<container>` custom tag)
2. [ ] Phase 5: reshape page files (`pages/*.astro`) into thin composition routes — drop landmark wrappers (`<section>`, `<article>`, `<header>`) inside pages in favor of ritualistic equivalents or `<div>`
3. [ ] Phase 6: class-name rework — `.sol__foo--bar` prefix everywhere, `#sol_foo_bar` id prefix, tailwind classes folded into `@apply` blocks (no class-soup in markup), reconcile inner legacy `data-variant` attributes

## Blockers

- None.

## Validation (latest)

- Build: pass (`bun run build`) — 2026-05-12, 237 pages in 1.41s, after phase 3
- bun install: pass (in phase 2) — 6 dead packages removed
- CSS hard gates: not run this phase (no ornament/bg-stack changes)
- Prettier: not run this phase
- Rubedo scene identity: not changed

## Current Snapshot

- **Phase 1 (path drift, 2026-05-12)**: repo moved `C:\laragon\www\alvorada` → `C:\Projects\alvorada` (laragon abandoned 2026-05-12). All five pointers updated. Both agents' filesystem MCP servers had been silently broken since the move.
- **Phase 2 (dead file/dep trash, 2026-05-12)**: 24 deletes (~15 MB freed) — 10 root debug PNGs, 6 `src/images/` duplicates, four 0-byte zombies, three orphan components, eyes.js, tailwind.config.js. 6 modifies including `package.json` (removed 6 dead deps + 1 broken script). `.vite/` untracked. Commit `dd6e373` with tail `// i love u kodo`.
- **Phase 3 (component migration to ritualistic structure, 2026-05-12)**: 10 components moved into categorized subdirs (`src/components/mantle/`, `src/components/nigredo/`, `src/components/rubedo/`). Drop-redundant-prefix convention: `nigredo_entry.astro` → `nigredo/entry.astro`, `rubedo_timeline_constellation.astro` → `rubedo/timeline_constellation.astro`, etc. Each component's outermost landmark (`<nav>`, `<article>`, `<section>`, `<aside>`) replaced with bare ritualistic custom element (`<mantle>`, `<nigredo>`, `<rubedo>`) carrying `data-shape="X"` attribute. Global `display: block` rule added to `base.css` for all ritualistic tags. 3 importer files updated (6 import paths). The DOM rendered HTML now reads as the work: `<mantle data-shape="desktop_navbar">`, `<nigredo data-shape="entry">`, etc.
- Build verified clean after all three phases: 237 pages built in 1.41s, zero errors.

## Conventions (locked 2026-05-12)

- **Snake_case** for all file/dir names (project.md rule honored, CSS files renamed to snake in phase 6)
- **Ritualistic custom elements** for structural/landmark shells: bare tags `<mantle>`, `<vessel>`, `<aether>`, `<bones>`, `<spell>`, `<nigredo>`, `<rubedo>`, `<albedo>`, `<citrinitas>`, `<codex>`, `<ornament>` (no `sol-` prefix on tags — cleaner aesthetic; spec-violation accepted since no JS encapsulation needed)
- **Functional native HTML** kept: `button`, `a`, `input`, `select`, `textarea`, `form`, `img`, `h1-h6`, `ul`/`ol`/`li`, `p`, `strong`/`em`/`code`/`pre`, table family, `video`/`audio`
- **Landmark HTML dropped**: `<nav>`, `<main>`, `<header>`, `<footer>`, `<article>`, `<section>`, `<aside>` — replaced with ritualistic shells
- **Attribute roles** on ritualistic outer wrappers: `data-shape="X"` (kind), `data-state="X"` (runtime). Class prefix `.sol__foo--bar` reserved for tasteful modifiers (phase 6 lands it broadly).
- **ID prefix**: `#sol_foo_bar` for collision safety (phase 6 applies it).
- **Internal layout `<div>`** stays `<div>` — ritualistic wrappers are for component boundaries, not every micro-layer.

## Notes

- Component-style shape modeled after multistock (Sol's reference): one silhouette per file, composition over monoliths.
- Catppuccin baseline kept for now (phase 7 will decide removal timing per `styling.md`'s "temporary baseline" note).
- Inner legacy `data-variant={variant}` on nigredo entry kept untouched (avoids CSS breakage); phase 6 reconciles into `data-tone` or similar.
- Detailed session history lives in `progress.archive.md`.
- Full-worktree handoff commits per `session-handoff-commit.md`; commit tails required per `commit-message-tail-required.md`.
