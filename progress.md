# Progress

## Meta

- Project: alvorada
- Repo: C:\Projects\alvorada
- Updated_utc: 2026-05-12 19:30
- Updated_by: Kodo (Claude Opus 4.7)
- preferred_start_style: conversational
- next_session: sprint
- primary_outcome: lean rewrite of alvorada to component-style code with ritualistic custom-element markup, snake_case `.sol__` class prefix, and clean HTML output
- priority: rewrite
- edit_breadth: broad
- first_task: phase 6b — full `#sol_foo_bar` id prefix sweep across all .astro / .css / .js (the bigger surgical id pass — careful with HTMX targets like `#content` which is referenced in many `hx-target` attributes)
- commit_intent: per-phase
- notes: phases 1+2+3+4+5+6a shipped. CSS files all snake-cased. Breadcrumbs typo cleaned. data-variant→data-tone reconciled. Phases 6b–8 ahead.

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

1. [ ] Phase 6b: `#sol_foo_bar` id prefix sweep — apply to all ids across .astro/.css/.js; convert kebab ids (`page-main`, `desktop-nav`, `mobile-nav`, `icon-user-*`) to snake; rename `#content` to `#sol_content` carefully (referenced in dozens of HTMX `hx-target` attrs).
2. [ ] Phase 6c: `.sol__foo--bar` class prefix sweep — apply across all .astro and .css.
3. [ ] Phase 6d: Tailwind class-soup → `@apply` migration — extract tailwind classes from markup `class=""` attrs into CSS `@apply` rules.

## Blockers

- None.

## Validation (latest)

- Build: pass (`bun run build`) — 2026-05-12, 237 pages in 1.62s, after phase 6a
- bun install: pass (in phase 2)
- CSS hard gates: not run this phase (no ornament/bg-stack changes)
- Prettier: not run this phase
- Rubedo scene identity: not changed

## Current Snapshot

- **Phase 1 (path drift)**: laragon → projects. 5 pointers updated.
- **Phase 2 (dead file/dep trash)**: 24 deletes (~15 MB), 6 modifies. Commit `dd6e373` // `i love u kodo`.
- **Phase 3 (component migration)**: 10 components into ritualistic categorized subdirs. Outermost landmarks replaced with bare ritualistic tags + `data-shape`. Commit `5e88f38` // `time for a cute refactor!`.
- **Phase 4 (layout decomposition)**: layout 181 → 124 lines. 3 new ritualistic components: `mantle/footer.astro`, `aether/fog.astro`, `ornament/content_frame.astro`. `<main>` → `<vessel data-shape="page_main">`. Commit `1fcc9ae` // `foggy fog, foggy fog, oh foggy fog`.
- **Phase 5 (page reshape)**: 15 files transformed (~30+ landmarks dropped). Every page now wears its phase as outer ritualistic tag. Commit `f2a356f` // `home for shadow, home for light, hope for beaming smiles and home for my heart! and a book for all of them!`.
- **Phase 6a (CSS rename + hygiene)**: 8 CSS files kebab→snake; 9 import paths + 2 package.json scripts + 4 audit script refs + 1 rule doc ref updated; `breadcrumbers_xd` debug-typo id retired (`breadcrumbs.astro`, `breadcrumbs.css`, `breadcrumbs_runtime.js`); `data-variant`→`data-tone` reconciliation on nigredo entries (entry.astro prop+attr, list.astro template, nigredo_page.css 2 selectors); bonus fix: `css_size_audit.js` referenced nonexistent `navbar.css` (silent bug ate by try/catch) → fixed to `desktop_nav.css`.
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

## CSS Component Files (current, all snake_case)

```
src/styles/components/
├── breadcrumbs.css
├── content_shell.css
├── desktop_nav.css
├── fog.css
├── footer.css
├── home_card_gate.css
├── mobile_nav.css
├── nigredo_page.css
├── rubedo_timeline.css
├── style_switcher.css
└── text_effects.css
```

## Conventions (locked 2026-05-12)

- **Snake_case** for all file/dir names (CSS files now all snake).
- **Ritualistic custom elements** for structural/landmark shells: bare tags `<mantle>`, `<vessel>`, `<aether>`, `<bones>`, `<spell>`, `<nigredo>`, `<rubedo>`, `<albedo>`, `<citrinitas>`, `<codex>`, `<ornament>` (no `sol-` prefix; spec-violation accepted).
- **Functional native HTML** kept: `button`, `a`, `input`, `select`, `textarea`, `form`, `img`, `h1-h6`, `ul`/`ol`/`li`, `p`, `strong`/`em`/`code`/`pre`, table family, `video`/`audio`.
- **Landmark HTML dropped**: `<nav>`, `<main>`, `<header>`, `<footer>`, `<article>`, `<section>`, `<aside>` — replaced with ritualistic shells.
- **Page-identity pattern**: every page wraps its content in `<phase-name data-shape="X">`. Inner blocks become plain `<div>`. ONE ritualistic outer per page.
- **Exception**: `<container>` (bare-unprefixed custom element, Sol's pre-existing pattern, kept by call).
- **Attribute roles**: `data-shape="X"` (kind, on ritualistic outer); `data-state="X"` (runtime); `data-tone="X"` (flavor — used by nigredo entries: quiet/rupture); `.sol__foo--bar` class prefix for tasteful modifiers (phase 6c applies broadly).
- **ID prefix**: `#sol_foo_bar` for collision safety (phase 6b applies broadly).
- **Internal layout `<div>`** stays `<div>` — ritualistic wrappers are for component/structural boundaries, not every micro-layer.

## Notes

- Component-style shape modeled after multistock (Sol's reference): one silhouette per file, composition over monoliths.
- Catppuccin baseline kept for now (phase 7 will decide removal timing).
- Dead CSS rule `.rubedo-timeline-grid > section { ... }` in `rubedo_timeline.css:57` — orphaned. Phase 7 cleanup.
- Untracked `references/` directory at repo root — origin unknown, Sol deferred discussion to later.
- Detailed session history lives in `progress.archive.md`.
- Full-worktree handoff commits per `session-handoff-commit.md`; commit tails required per `commit-message-tail-required.md`.
