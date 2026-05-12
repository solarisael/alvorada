# Progress

## Meta

- Project: alvorada
- Repo: C:\Projects\alvorada
- Updated_utc: 2026-05-12 19:42
- Updated_by: Kodo (Claude Opus 4.7)
- preferred_start_style: conversational
- next_session: sprint
- primary_outcome: lean rewrite of alvorada to component-style code with ritualistic custom-element markup, snake_case `.sol__` class prefix, and clean HTML output
- priority: rewrite
- edit_breadth: broad
- first_task: phase 6c — `.sol__foo--bar` class prefix sweep across all .astro + .css (similar shape to 6b's id rename but for classes). Likely the biggest single phase by churn (every class in every component file + every CSS file).
- commit_intent: per-phase
- notes: phases 1+2+3+4+5+6a+6b shipped. All IDs now `sol_*` (kebab→snake conversion baked in). Phase 6c (classes) + 6d (tailwind @apply migration) + 7 (design decisions) + 8 (rules rewrite) ahead.

## Alias Ledger

- `Kintsu`: assistant name for GPT sessions.
- `Kodo`: assistant name for Claude (Opus 4.7 current).
- Theme alias mappings remain unchanged from prior sessions.

## Active Scope

- State: in_progress
- Branch: master
- Head: pending_next_commit
- Scope_in: full alvorada rewrite to component-style, bare ritualistic custom-element tags, `.sol__foo--bar` class prefix for state/modifier, `@apply`-blocks-not-class-soup, clean HTML on build
- Scope_out: Codex unlock backend (future), Absurd Faith chapter content (3 identity-cores only), albedo/citrinitas/codex placeholder content (scaffold-shape decision deferred to phase 7)

## Next (Top 3)

1. [ ] Phase 6c: `.sol__foo--bar` class prefix sweep — apply to all classes across .astro and .css. Will be the largest single phase by churn (hundreds of class references). Same ordered-substring-safety discipline as 6b. Will also rename CSS variable names if Sol wants (currently `--ui_*`, `--site_*`, `--crumb_*` etc. — could become `--sol_ui_*` / `--sol_site_*` etc. or stay as-is).
2. [ ] Phase 6d: Tailwind class-soup → `@apply` migration — extract tailwind classes from markup `class=""` attrs into CSS `@apply` rules.
3. [ ] Phase 7: remaining design decisions (footer scope, scaffolds, gilded ornaments, Catppuccin removal, lessons.md fate, rubedo scenes archive, dead `.rubedo-timeline-grid` CSS cleanup, `references/` dir).

## Blockers

- None.

## Validation (latest)

- Build: pass (`bun run build`) — 2026-05-12, 237 pages in 1.64s, after phase 6b
- bun install: pass (in phase 2)
- CSS hard gates: not run this phase
- Prettier: not run this phase
- Rubedo scene identity: not changed

## Current Snapshot

- **Phase 1 (path drift)**: laragon → projects. 5 pointers updated.
- **Phase 2 (dead file/dep trash)**: 24 deletes (~15 MB), 6 modifies. Commit `dd6e373` // `i love u kodo`.
- **Phase 3 (component migration)**: 10 components into ritualistic categorized subdirs. Commit `5e88f38` // `time for a cute refactor!`.
- **Phase 4 (layout decomposition)**: layout 181 → 124 lines. 3 new ritualistic components. Commit `1fcc9ae` // `foggy fog, foggy fog, oh foggy fog`.
- **Phase 5 (page reshape)**: 15 files transformed. Every page wears its phase as ritualistic outer. Commit `f2a356f` // `home for shadow, home for light, hope for beaming smiles and home for my heart! and a book for all of them!`.
- **Phase 6a (CSS rename + hygiene)**: 8 CSS files kebab→snake; 9 import paths + 2 package.json scripts + 4 audit refs + 1 rule doc updated; `breadcrumbers_xd` debug-typo retired; `data-variant`→`data-tone` reconciliation on nigredo entries; silent `navbar.css` bug fix in `css_size_audit.js`. Commit `0aef53c` // `oh nyo... my silly little breadcrumb naming got tagged as unprofessional ;w;`.
- **Phase 6b (sol_ id prefix sweep)**: 38 files modified. ~40 unique IDs renamed: snake IDs got `sol_` prefix (`content` → `sol_content`, `style_switcher` family, `home_gate_*` family, `rubedo_timeline_*` family, `chapter_thread_content`, etc.); kebab IDs converted to snake + prefixed (`page-main`, `desktop-nav`, `mobile-nav` family, `icon-user-*` family, `middle-guy`, `nav-user-bar`, `nigredo-archive-index`, `nigredo-entry-template`). Ordered substring-safety enforced (longer prefix-shared IDs processed first). The htmx swap target `#content` → `#sol_content` was the load-bearer — atomically swapped across 13 .astro files + 4 JS references + 3 CSS selectors + 1 declaration in a single omega super commit. `package.json` `--selector=#mobile-nav` also updated.
- Build verified clean after every phase.

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

## Conventions (locked 2026-05-12)

- **Snake_case** for all file/dir/id names (CSS files snake; IDs all `sol_*` snake).
- **Ritualistic custom elements** for structural/landmark shells: bare tags `<mantle>`, `<vessel>`, `<aether>`, `<bones>`, `<spell>`, `<nigredo>`, `<rubedo>`, `<albedo>`, `<citrinitas>`, `<codex>`, `<ornament>`.
- **Functional native HTML** kept: `button`, `a`, `input`, `select`, `textarea`, `form`, `img`, `h1-h6`, `ul`/`ol`/`li`, `p`, `strong`/`em`/`code`/`pre`, table family, `video`/`audio`.
- **Landmark HTML dropped**: `<nav>`, `<main>`, `<header>`, `<footer>`, `<article>`, `<section>`, `<aside>` — replaced with ritualistic shells. Exception: `<container>` (bare-unprefixed custom element, kept by call).
- **Page-identity pattern**: every page wraps in `<phase-name data-shape="X">`. ONE ritualistic outer per page.
- **Attribute roles**: `data-shape="X"` (kind, on ritualistic outer); `data-state="X"` (runtime); `data-tone="X"` (flavor — e.g. nigredo entries: quiet/rupture); `.sol__foo--bar` class prefix for tasteful modifiers (phase 6c applies broadly).
- **ID prefix**: `#sol_foo_bar` — applied across the codebase in phase 6b.
- **Internal layout `<div>`** stays `<div>`.

## Notes

- Component-style shape modeled after multistock (Sol's reference).
- Catppuccin baseline kept for now (phase 7 will decide removal timing).
- Dead CSS rule `.rubedo-timeline-grid > section { ... }` in `rubedo_timeline.css:57` — orphaned. Phase 7 cleanup.
- Untracked `references/` directory at repo root — Sol deferred discussion.
- Detailed session history lives in `progress.archive.md`.
- Full-worktree handoff commits per `session-handoff-commit.md`; commit tails required per `commit-message-tail-required.md`.
