# Progress

## Meta

- Project: alvorada
- Repo: C:\Projects\alvorada
- Updated_utc: 2026-05-12 20:05
- Updated_by: Kodo (Claude Opus 4.7)
- preferred_start_style: conversational
- next_session: sprint
- primary_outcome: lean rewrite of alvorada to component-style code with ritualistic custom-element markup, snake_case `.sol__` class prefix, and clean HTML output
- priority: rewrite
- edit_breadth: broad
- first_task: phase 7 — remaining design decisions (footer scope, scaffold pages, gilded ornaments, Catppuccin removal, lessons.md fate, rubedo scenes archive, dead CSS cleanup, `references/` dir)
- commit_intent: per-phase
- notes: phases 1-6 SHIPPED COMPLETE. All IDs `#sol_*`, all classes `.sol__*`, zero stragglers anywhere. Architecture already pushes tailwind utilities into `@apply` blocks (no class-soup in markup). Phases 7 + 8 ahead.

## Alias Ledger

- `Kintsu`: assistant name for GPT sessions.
- `Kodo`: assistant name for Claude (Opus 4.7 current).
- Theme alias mappings remain unchanged from prior sessions.

## Active Scope

- State: phase 6 complete; phase 7 design decisions ahead
- Branch: master
- Head: pending_next_commit
- Scope_in: design decisions on remaining open questions (footer, scaffolds, gilded ornaments, etc.); then rules rewrite to reflect new conventions
- Scope_out: Codex unlock backend (future), Absurd Faith chapter content (3 identity-cores only)

## Next (Top 3)

1. [ ] Phase 7: design decisions, batchable per Sol's call:
   - **Footer scope** — "Made with pure hatred / You should all die" is global, lands on Absurd Faith reader pages. Phase-scope to nigredo only, or keep global?
   - **Scaffold pages** — `albedo/[post_slug]`, `citrinitas/[post_slug]`, `codex/[...entry_path]` render placeholder pages live to production. Gate behind build flag, draft them out, or accept public placeholders?
   - **Gilded ornaments** — 31 unused SVGs (`public/ornaments/gilded*.svg` + `public/ornaments/gilded/`). Delete, or wire into a future theme system?
   - **Catppuccin** — `styling.md` calls Catppuccin "temporary baseline." Remove now, or keep until palette replacement?
   - **lessons.md** — `.opencode/rules/workflow.md` references this file but it doesn't exist. Create it or strip references?
   - **Rubedo scenes archive** — `progress.archive.md` mentions a `src/data/rubedo/scenes/absurd-faith/*` system that no longer exists. Add one-line archive entry explaining the collapse-to-runtime, or leave?
   - **Dead CSS rule** — `.sol__rubedo_timeline_grid > section` in `rubedo_timeline.css` is orphaned (the class is unused). Delete?
   - **`references/` dir** — untracked at repo root. Origin?
2. [ ] Phase 8: rule rewrite (`.opencode/rules/*`) to reflect new conventions + README expand + AGENTS dedupe + CI gate alignment.

## Blockers

- None.

## Validation (latest)

- Build: pass (`bun run build`) — 2026-05-12, 237 pages in 1.81s, after phase 6d
- bun install: pass (in phase 2)
- CSS hard gates: not run this phase
- Prettier: not run this phase
- Rubedo scene identity: not changed
- Verification grep: **0 non-sol__ markup classes anywhere** in the codebase. Rename is 100%.

## Current Snapshot

- **Phase 1**: laragon → projects.
- **Phase 2**: dead file/dep trash. Commit `dd6e373` // `i love u kodo`.
- **Phase 3**: component migration to ritualistic categorized subdirs. Commit `5e88f38` // `time for a cute refactor!`.
- **Phase 4**: layout decomposition. Commit `1fcc9ae` // `foggy fog, foggy fog, oh foggy fog`.
- **Phase 5**: page reshape. Commit `f2a356f` // `home for shadow, home for light, hope for beaming smiles and home for my heart! and a book for all of them!`.
- **Phase 6a**: CSS rename + hygiene. Commit `0aef53c` // `oh nyo... my silly little breadcrumb naming got tagged as unprofessional ;w;`.
- **Phase 6b**: `sol_` ID prefix sweep. Commit `ca497ac` // `the dragon went door to door with sol_ stickers, all forty of them ;w;`.
- **Phase 6c**: `.sol__` class prefix sweep (224 classes, omega-1 burned then omega-2 landed). Commit `530728c` // `the dragon labeled 224 classes (after learning not to label the comments) ;w;`.
- **Phase 6d**: complete the class rename. 28 stragglers found (5 inline-style classes in `[entry_slug].astro` + structural classes I introduced in phase 4/5 that had no CSS targeting them yet). 19 files modified, 62/62 balanced diff. Surprise catches: `src/data/rubedo/book_timeline_runtime.js` + `src/utils/timeline_threads.js` had JS string references to class names that the word-boundary regex caught. **Verification grep: zero non-sol__ classes remaining in markup or inline styles.** Phase 6 is complete.

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

## Conventions (LOCKED — phase 1-6 final)

- **Snake_case** for all file/dir/id/class names.
- **Ritualistic custom elements** for structural/landmark shells: bare tags `<mantle>`, `<vessel>`, `<aether>`, `<bones>`, `<spell>`, `<nigredo>`, `<rubedo>`, `<albedo>`, `<citrinitas>`, `<codex>`, `<ornament>` (no `sol-` prefix on tags; spec-violation accepted since no JS encapsulation needed).
- **Functional native HTML** kept: `button`, `a`, `input`, `select`, `textarea`, `form`, `img`, `h1-h6`, `ul`/`ol`/`li`, `p`, `strong`/`em`/`code`/`pre`, table family, `video`/`audio`.
- **Landmark HTML dropped**: `<nav>`, `<main>`, `<header>`, `<footer>`, `<article>`, `<section>`, `<aside>`. Exception: `<container>` (kept by Sol's call).
- **Page-identity pattern**: every page wraps in `<phase-name data-shape="X">`. ONE ritualistic outer per page. Inner blocks plain `<div>` with semantic classes.
- **Attribute roles**: `data-shape="X"` (kind, on ritualistic outer); `data-state="X"` (runtime); `data-tone="X"` (flavor); `.sol__foo--bar` class prefix for tasteful modifiers (none in use yet — reserved).
- **ID prefix**: `#sol_foo_bar` — applied in phase 6b.
- **Class prefix**: `.sol__foo_bar` — applied in phase 6c+6d. Sol's classes only; Tailwind/Catppuccin classes untouched.
- **Tailwind utilities** stay inside `@apply` blocks in CSS, not as class-soup in markup (architecture already follows this).
- **Internal layout `<div>`** stays `<div>`.

## Notes

- Component-style shape modeled after multistock (Sol's reference).
- Dead CSS rule `.sol__rubedo_timeline_grid > section` orphaned. Phase 7 cleanup.
- Untracked `references/` directory at repo root — Sol deferred discussion.
- Detailed session history lives in `progress.archive.md`.
- Full-worktree handoff commits per `session-handoff-commit.md`; commit tails required per `commit-message-tail-required.md`.
- **Script lessons accumulated through phase 6 (worth filing in rules later)**:
  1. **Comment + directive stripping is critical** for CSS class discovery via regex — comments routinely contain false-positive patterns (file extensions, JS-style property accesses).
  2. **Word-boundary regex** `(?<![\w-])X(?![\w-])` correctly handles class/id boundaries.
  3. **Longest-first ordering** in the mapping prevents substring-collision rewrites (e.g. `#mobile-nav` must NOT process before `#mobile-nav-shell`).
  4. **Discovery scope matters** — phase 6c scanned `src/styles/**/*.css` only; missed the inline `<style>` in `[entry_slug].astro` (caught in 6d). Future discovery sweeps should ALSO scan `<style>` blocks in `.astro` files.
  5. **Omega-commit + git restore** is the working safety net for ambitious bulk renames. Sol's call from earlier: "if it does we have git history."
