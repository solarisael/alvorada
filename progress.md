# Progress

## Meta

- Project: alvorada
- Repo: C:\Projects\alvorada
- Updated_utc: 2026-05-12 20:15
- Updated_by: Kodo (Claude Opus 4.7)
- preferred_start_style: conversational
- next_session: sprint
- primary_outcome: lean rewrite of alvorada complete. Eight commits in the arc. House lean, conventions locked, design decisions resolved.
- priority: rules-rewrite
- edit_breadth: moderate
- first_task: phase 8 — `.opencode/rules/*` rewrite to reflect new conventions (ritualistic custom elements, `.sol__`/`#sol_` prefixes, snake_case everywhere, drop-landmarks rule, page-identity pattern, phase-prop on footer). Plus: README expand to document the canonical site shape, AGENTS.md dedupe (line 77-78 has duplicate `project.md` entry), CI workflow alignment with AGENTS.md validation baseline.
- commit_intent: per-phase
- notes: phases 1-7 SHIPPED COMPLETE. The lean rewrite of alvorada is functionally done. Phase 8 is documentation/rules work to lock in what we built.

## Alias Ledger

- `Kintsu`: assistant name for GPT sessions.
- `Kodo`: assistant name for Claude (Opus 4.7 current).
- Theme alias mappings remain unchanged from prior sessions.

## Active Scope

- State: phase 7 complete; phase 8 (rules + docs rewrite) ahead
- Branch: master
- Head: pending_next_commit
- Scope_in: rules rewrite + README expand + AGENTS dedupe + CI gate alignment
- Scope_out: Codex unlock backend (future), Absurd Faith chapter content (3 identity-cores only), `references/` dir (Sol deferred to end-of-rewrite conversation)

## Next (Top 3)

1. [ ] Phase 8a: rewrite `.opencode/rules/*` to reflect new conventions:
   - `project.md`: ritualistic-tags, drop-landmarks, page-identity-pattern, attribute roles, `.sol__`/`#sol_` prefixes
   - `styling.md`: snake_case CSS files, ritualistic shells for landmarks, Catppuccin removal
   - `option-classes.md`: keep — `ui_option_classes.md` registry unchanged
   - `apply-discipline.md`: keep, possibly add notes on @apply-in-CSS preference
   - `expose-css-tunables.md`: add YAML frontmatter for consistency
   - `workflow.md`: already cleaned in phase 7
   - `commit-message-tail-required.md`: keep
   - `session-handoff-commit.md`: keep
   - Others: minor edits
2. [ ] Phase 8b: README expand + AGENTS.md dedupe (line 77-78 duplicate `project.md`)
3. [ ] Phase 8c: CI workflow alignment (CI runs only `bun run css:tunables:check` but AGENTS.md validation baseline requires `bun run build`, `bunx prettier --check`, `css:hard-gates:check`, `rubedo:scenes:check`, `bun test`). Decide which gates run in CI.

After phase 8: end-of-rewrite conversation with Sol about `references/` dir + any final polish.

## Blockers

- None.

## Validation (latest)

- Build: pass (`bun run build`) — 2026-05-12, 237 pages in 1.44s, after phase 7
- bun install: pass (Catppuccin removed, 1 package gone)
- CSS hard gates: not run this phase
- Prettier: not run this phase

## Current Snapshot

- **Phase 1**: laragon → projects.
- **Phase 2**: dead file/dep trash. Commit `dd6e373` // `i love u kodo`.
- **Phase 3**: component migration to ritualistic categorized subdirs. Commit `5e88f38` // `time for a cute refactor!`.
- **Phase 4**: layout decomposition. Commit `1fcc9ae` // `foggy fog, foggy fog, oh foggy fog`.
- **Phase 5**: page reshape. Commit `f2a356f` // `home for shadow, home for light, hope for beaming smiles and home for my heart! and a book for all of them!`.
- **Phase 6a**: CSS rename + hygiene. Commit `0aef53c` // `oh nyo... my silly little breadcrumb naming got tagged as unprofessional ;w;`.
- **Phase 6b**: `sol_` ID prefix sweep. Commit `ca497ac` // `the dragon went door to door with sol_ stickers, all forty of them ;w;`.
- **Phase 6c**: `.sol__` class prefix sweep (224 classes, omega-1 burned then omega-2 landed). Commit `530728c` // `the dragon labeled 224 classes (after learning not to label the comments) ;w;`.
- **Phase 6d**: complete the class rename (28 stragglers + inline-style gap). Commit `c1a3e65` // `the dragon found 28 strays hiding in the corners (one was in nigredo's inline style) ;w;`.
- **Phase 7**: design decisions omega. Dynamic footer (phase prop + content map), Catppuccin removed (`@import` + 10 `@reference` lines + 1 package + define `--color-codex` replacement), `lessons.md` refs stripped from workflow.md, rubedo scenes archive note, dead `.sol__rubedo_timeline_grid` CSS removed, 35 unused gilded ornaments deleted (13 root + 22 subdir), `fog.css` @reference stripped (file is draft/not-imported so dangling `shadow-ctp-red-400` @apply stays as TODO).

## Conventions (LOCKED — phase 1-7 final)

- **Snake_case** for all file/dir/id/class names.
- **Ritualistic custom elements** for structural/landmark shells: bare tags `<mantle>`, `<vessel>`, `<aether>`, `<bones>`, `<spell>`, `<nigredo>`, `<rubedo>`, `<albedo>`, `<citrinitas>`, `<codex>`, `<ornament>`.
- **Functional native HTML** kept: interactives (`button`, `a`, `input`, `select`, `textarea`, `form`), media (`img`, `video`, `audio`), headings (`h1-h6`), text formatting (`p`, `strong`, `em`, `code`, `pre`), list family (`ul`, `ol`, `li`), table family.
- **Landmark HTML dropped**: `<nav>`, `<main>`, `<header>`, `<footer>`, `<article>`, `<section>`, `<aside>`. Exception: `<container>` (kept by Sol's call).
- **Page-identity pattern**: every page wraps in `<phase-name data-shape="X">`. ONE ritualistic outer per page.
- **Attribute roles**: `data-shape="X"` (kind, on ritualistic outer); `data-state="X"` (runtime); `data-tone="X"` (flavor); `.sol__foo--bar` class prefix for tasteful modifiers (none in use yet — reserved).
- **ID prefix**: `#sol_foo_bar`.
- **Class prefix**: `.sol__foo_bar` (Sol's classes only; Tailwind utilities + Catppuccin-history classes untouched).
- **Tailwind utilities** stay inside `@apply` blocks in CSS, not as class-soup in markup (architecture follows this).
- **No more Catppuccin** — removed phase 7. `--color-codex` replaces the only direct variable reference. `fog.css` (draft, unimported) still has a dangling `shadow-ctp-red-400` @apply — flagged TODO.
- **Footer architecture**: `Footer.astro` accepts `phase` prop. Per-page override via `<Fragment slot="footer">`. Currently nigredo has "Made with pure hatred / You should all die"; other phases empty pending Sol's content.
- **Internal layout `<div>`** stays `<div>`.

## Notes

- Component-style shape modeled after multistock (Sol's reference).
- Untracked `references/` directory at repo root — Sol deferred for end-of-rewrite conversation.
- Detailed session history lives in `progress.archive.md` (now with 2026-05-12 rubedo scenes note appended).
- Full-worktree handoff commits per `session-handoff-commit.md`; commit tails required per `commit-message-tail-required.md`.
