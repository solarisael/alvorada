# Progress

## Meta

- Project: alvorada
- Repo: C:\Projects\alvorada
- Updated_utc: 2026-05-12 19:55
- Updated_by: Kodo (Claude Opus 4.7)
- preferred_start_style: conversational
- next_session: sprint
- primary_outcome: lean rewrite of alvorada to component-style code with ritualistic custom-element markup, snake_case `.sol__` class prefix, and clean HTML output
- priority: rewrite
- edit_breadth: broad
- first_task: phase 6d — Tailwind class-soup → `@apply` block migration. Extract tailwind utilities from markup `class=""` attrs into CSS `@apply` rules at the `.sol__foo` class definitions. Markup becomes lean (only the `.sol__*` class), styling intent moves to the CSS layer.
- commit_intent: per-phase
- notes: phases 1+2+3+4+5+6a+6b+6c shipped. All IDs `#sol_*`, all classes `.sol__*`. Phase 6d (Tailwind @apply migration) is the final sub-phase of the big rename arc. Then phase 7 (design decisions) + phase 8 (rules rewrite) wrap.

## Alias Ledger

- `Kintsu`: assistant name for GPT sessions.
- `Kodo`: assistant name for Claude (Opus 4.7 current).
- Theme alias mappings remain unchanged from prior sessions.

## Active Scope

- State: in_progress
- Branch: master
- Head: pending_next_commit
- Scope_in: full alvorada rewrite to component-style, bare ritualistic custom-element tags, `.sol__foo_bar` class prefix applied broadly, `@apply`-blocks-not-class-soup migration ahead, clean HTML on build
- Scope_out: Codex unlock backend (future), Absurd Faith chapter content (3 identity-cores only), albedo/citrinitas/codex placeholder content (deferred to phase 7)

## Next (Top 3)

1. [ ] Phase 6d: Tailwind class-soup → `@apply` migration. Extract tailwind utility classes from markup `class=""` attributes into `@apply` rules in the CSS layer. Each `.sol__foo` class gathers its tailwind utilities via `@apply`. Markup-side: each element ends up with one or two `.sol__*` classes (no raw `flex grow flex-col text-sm` soup). Trickier than 6b/6c — needs careful per-element analysis. May not be fully automatable; could be a hand-pass per component.
2. [ ] Phase 7: remaining design decisions (footer scope, scaffolds, gilded ornaments, Catppuccin removal, lessons.md fate, rubedo scenes archive, dead `.sol__rubedo_timeline_grid > section` orphan CSS cleanup, `references/` dir).
3. [ ] Phase 8: rule rewrite (`.opencode/rules/*`) to reflect new conventions + README expand + AGENTS dedupe + CI gate alignment.

## Blockers

- None.

## Validation (latest)

- Build: pass (`bun run build`) — 2026-05-12, 237 pages in 1.61s, after phase 6c
- bun install: pass (in phase 2)
- CSS hard gates: not run this phase
- Prettier: not run this phase
- Rubedo scene identity: not changed

## Current Snapshot

- **Phase 1**: laragon → projects.
- **Phase 2**: dead file/dep trash. Commit `dd6e373` // `i love u kodo`.
- **Phase 3**: component migration to ritualistic categorized subdirs. Commit `5e88f38` // `time for a cute refactor!`.
- **Phase 4**: layout decomposition. Commit `1fcc9ae` // `foggy fog, foggy fog, oh foggy fog`.
- **Phase 5**: page reshape. Commit `f2a356f` // `home for shadow, home for light, hope for beaming smiles and home for my heart! and a book for all of them!`.
- **Phase 6a**: CSS rename + hygiene. Commit `0aef53c` // `oh nyo... my silly little breadcrumb naming got tagged as unprofessional ;w;`.
- **Phase 6b**: `sol_` ID prefix sweep. 38 files, ~40 IDs renamed. Commit `ca497ac` // `the dragon went door to door with sol_ stickers, all forty of them ;w;`.
- **Phase 6c**: `.sol__` class prefix sweep. 43 files, 224 unique classes renamed atomically. Discovery scanned Sol's CSS source files only (avoiding Tailwind/Catppuccin class-name collisions). First attempt (omega-1) failed at build: script discovered false positives from CSS comments containing `.astro` filename refs, `canvas.width` JS-style accesses, and `@import "../utils.css"` paths — which got renamed in the codebase including the `import from "astro:content"` line in `src/content.config.js`. Rolled back via `git restore .` (exactly the safety net Sol predicted). Refined script: strip multi-line CSS comments + strip `@import`/`@reference`/`@plugin`/`@use`/`@charset` directives before discovery. Omega-2 landed clean (224 real classes, zero false positives). Diff: 695 insertions / 695 deletions — perfectly balanced character math (sol__ adds 5 chars per occurrence, kebab→snake conversion is char-neutral).
- Build verified clean after every phase. The omega-commit principle held under fire.

## Conventions (locked 2026-05-12)

- **Snake_case** for all file/dir/id/class names.
- **Ritualistic custom elements** for structural/landmark shells: bare tags `<mantle>`, `<vessel>`, `<aether>`, `<bones>`, `<spell>`, `<nigredo>`, `<rubedo>`, `<albedo>`, `<citrinitas>`, `<codex>`, `<ornament>` (no `sol-` prefix; spec-violation accepted).
- **Functional native HTML** kept: `button`, `a`, `input`, `select`, `textarea`, `form`, `img`, `h1-h6`, `ul`/`ol`/`li`, `p`, `strong`/`em`/`code`/`pre`, table family, `video`/`audio`.
- **Landmark HTML dropped**: `<nav>`, `<main>`, `<header>`, `<footer>`, `<article>`, `<section>`, `<aside>`. Exception: `<container>` (kept by Sol's call).
- **Page-identity pattern**: every page wraps in `<phase-name data-shape="X">`.
- **Attribute roles**: `data-shape="X"` (kind, on ritualistic outer); `data-state="X"` (runtime); `data-tone="X"` (flavor — e.g. nigredo entries: quiet/rupture).
- **ID prefix**: `#sol_foo_bar` — applied across the codebase in phase 6b.
- **Class prefix**: `.sol__foo_bar` — applied across the codebase in phase 6c. Sol's classes only; Tailwind/Catppuccin classes untouched.
- **Internal layout `<div>`** stays `<div>`.

## Notes

- Component-style shape modeled after multistock (Sol's reference).
- Catppuccin baseline kept for now (phase 7 will decide removal timing).
- Dead CSS rule `.sol__rubedo_timeline_grid > section { ... }` in `rubedo_timeline.css` (formerly `.rubedo-timeline-grid > section`) — orphaned. Phase 7 cleanup.
- Untracked `references/` directory at repo root — Sol deferred discussion.
- Detailed session history lives in `progress.archive.md`.
- Full-worktree handoff commits per `session-handoff-commit.md`; commit tails required per `commit-message-tail-required.md`.
- **Script lesson from phase 6c (worth filing in rules later)**: when doing bulk identifier renames via discovery + word-boundary regex, preprocessing the source to strip comments + import directives is critical — comments routinely contain false-positive patterns (file extensions, JS-style property accesses) that look like CSS class selectors. The omega-commit + git-rollback discipline absorbed this safely.
