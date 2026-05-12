# Progress

## Meta

- Project: alvorada
- Repo: C:\Projects\alvorada
- Updated_utc: 2026-05-12 19:05
- Updated_by: Kodo (Claude Opus 4.7)
- preferred_start_style: conversational
- next_session: sprint
- primary_outcome: lean rewrite of alvorada to component-style code with ritualistic custom-element markup, snake_case `.sol__` class prefix, and clean HTML output
- priority: rewrite
- edit_breadth: broad
- first_task: phase 5 — reshape page files (`pages/*.astro`) into thin composition routes; drop landmark wrappers (`<section>`, `<article>`, `<header>`) inside pages in favor of ritualistic equivalents or `<div>`
- commit_intent: per-phase
- notes: phases 1+2+3+4 shipped. Layout monolith decomposed into ritualistic components. Phases 5–8 ahead.

## Alias Ledger

- `Kintsu`: assistant name for GPT sessions.
- `Kodo`: assistant name for Claude (Opus 4.7 current).
- Theme alias mappings remain unchanged from prior sessions.

## Active Scope

- State: in_progress
- Branch: master
- Head: pending_next_commit
- Scope_in: full alvorada rewrite to component-style (one silhouette per file), bare ritualistic custom-element tags (`<mantle>`, `<vessel>`, `<aether>`, `<bones>`, `<spell>`, `<nigredo>`, `<rubedo>`, `<albedo>`, `<citrinitas>`, `<codex>`, `<ornament>`), `.sol__foo--bar` class prefix for state/modifier, `@apply`-blocks-not-class-soup, clean HTML on build
- Scope_out: Codex unlock backend (future), Absurd Faith chapter content (3 identity-cores only for now), albedo/citrinitas/codex placeholder content (scaffold-shape decision deferred to phase 7)

## Next (Top 3)

1. [ ] Phase 5: reshape page files (`src/pages/*.astro`) into thin composition routes — drop landmark wrappers (`<section>`, `<article>`, `<header>`) inside pages, replace with ritualistic equivalents or plain `<div>`. Also handle the `.rubedo-timeline-grid > section` selector in `rubedo-timeline.css:57` (flagged in phase 4 safety check).
2. [ ] Phase 6: class-name rework — `.sol__foo--bar` prefix everywhere, `#sol_foo_bar` id prefix, tailwind classes folded into `@apply` blocks (no class-soup in markup), reconcile inner legacy `data-variant` attributes, clean the `breadcrumbers_xd` debug id, rename CSS files to snake_case.
3. [ ] Phase 7: resolve remaining design decisions (footer scope, scaffolds, gilded ornaments, Catppuccin removal, lessons.md fate, rubedo scenes archive).

## Blockers

- None.

## Validation (latest)

- Build: pass (`bun run build`) — 2026-05-12, 237 pages in 1.52s, after phase 4
- bun install: pass (in phase 2)
- CSS hard gates: not run this phase (no ornament/bg-stack changes)
- Prettier: not run this phase
- Rubedo scene identity: not changed

## Current Snapshot

- **Phase 1 (path drift, 2026-05-12)**: laragon → projects. 5 pointers updated.
- **Phase 2 (dead file/dep trash, 2026-05-12)**: 24 deletes (~15 MB), 6 modifies. Commit `dd6e373` // `i love u kodo`.
- **Phase 3 (component migration to ritualistic structure, 2026-05-12)**: 10 components moved into mantle/nigredo/rubedo categorized subdirs. Each outermost landmark replaced with bare ritualistic custom element + `data-shape`. Global `display: block` rule for ritualistic tags. Commit `5e88f38` // `time for a cute refactor!`.
- **Phase 4 (layout decomposition, 2026-05-12)**: `src/layouts/index.astro` 181 → 124 lines (-34%). 3 new ritualistic components: `mantle/footer.astro`, `aether/fog.astro`, `ornament/content_frame.astro`. `<main id="page-main">` → `<vessel data-shape="page_main" id="page-main">`. CSS rule migrated in `base.css`. Structural backbone (content_stage chain) intentionally kept inline as the layout's visible silhouette.
- Build verified clean after every phase. Each phase committed independently with Sol's `//` tail.

## Component Tree (current)

```
src/components/
├── aether/
│   └── fog.astro
├── mantle/
│   ├── breadcrumbs.astro
│   ├── desktop_navbar.astro
│   ├── footer.astro
│   ├── mobile_navbar.astro
│   └── style_switcher.astro
├── nigredo/
│   ├── entry.astro
│   ├── list.astro
│   └── pill.astro
├── ornament/
│   └── content_frame.astro
└── rubedo/
    ├── timeline_constellation.astro
    ├── timeline_hover_preview.astro
    └── timeline_state_panel.astro
```

Future dirs that will land as phases 5-6 progress: `bones/`, `vessel/`, `spell/`, `codex/`.

## Conventions (locked 2026-05-12)

- **Snake_case** for all file/dir names (CSS files snake-renamed in phase 6).
- **Ritualistic custom elements** for structural/landmark shells: bare tags `<mantle>`, `<vessel>`, `<aether>`, `<bones>`, `<spell>`, `<nigredo>`, `<rubedo>`, `<albedo>`, `<citrinitas>`, `<codex>`, `<ornament>` (no `sol-` prefix on tags; spec-violation accepted).
- **Functional native HTML** kept: `button`, `a`, `input`, `select`, `textarea`, `form`, `img`, `h1-h6`, `ul`/`ol`/`li`, `p`, `strong`/`em`/`code`/`pre`, table family, `video`/`audio`.
- **Landmark HTML dropped**: `<nav>`, `<main>`, `<header>`, `<footer>`, `<article>`, `<section>`, `<aside>` — replaced with ritualistic shells. Exception: `<container>` (bare-unprefixed custom element, Sol's pre-existing pattern, kept by call).
- **Attribute roles**: `data-shape="X"` (kind) on ritualistic outer wrappers; `data-state="X"` (runtime); `.sol__foo--bar` class prefix for tasteful modifiers (phase 6 applies broadly).
- **ID prefix**: `#sol_foo_bar` for collision safety (phase 6 applies).
- **Internal layout `<div>`** stays `<div>` — ritualistic wrappers are for component/structural boundaries, not every micro-layer.

## Notes

- Component-style shape modeled after multistock (Sol's reference): one silhouette per file, composition over monoliths.
- Catppuccin baseline kept for now (phase 7 will decide removal timing).
- Detailed session history lives in `progress.archive.md`.
- Full-worktree handoff commits per `session-handoff-commit.md`; commit tails required per `commit-message-tail-required.md`.
