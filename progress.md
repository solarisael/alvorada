# Progress

## Meta

- Project: alvorada
- Repo: C:\Projects\alvorada
- Updated_utc: 2026-05-12 20:25
- Updated_by: Kodo (Claude Opus 4.7)
- preferred_start_style: conversational
- next_session: handoff or co-pilot
- primary_outcome: lean rewrite of alvorada COMPLETE. Ten commits in the arc. Every code-level and docs-level convention shipped.
- priority: any
- edit_breadth: targeted
- first_task: (at Sol's discretion) end-of-rewrite conversation about `references/` dir at repo root + any final polish before the rewrite is closed
- commit_intent: handoff
- notes: phases 1-8 ALL SHIPPED. The lean rewrite is done.

## Alias Ledger

- `Kintsu`: assistant name for GPT sessions.
- `Kodo`: assistant name for Claude (Opus 4.7 current).
- Theme alias mappings remain unchanged from prior sessions.

## Active Scope

- State: rewrite complete
- Branch: master
- Head: pending_next_commit (phase 8 in working tree, about to land)
- Scope_in: end-of-rewrite conversation
- Scope_out: nothing — major work done

## Next (Top 3)

1. [ ] End-of-rewrite conversation: `references/` dir at repo root (Sol deferred to end).
2. [ ] Optional: dev server + visual eyeball check via playwright if Sol wants to verify rendered look.
3. [ ] Optional: push to remote if Sol wants to ship the rewrite live.

## Blockers

- None.

## Validation (latest)

- Build: pass (`bun run build`) — 2026-05-12, 237 pages in 1.47s, after phase 8
- bun install: pass
- CI workflow updated: now runs build + prettier check + css:hard-gates:check + css:tunables:check (was only running tunables before)

## Full Commit Arc (lean rewrite)

```
[pending]  // we're close, little godling uwu                                                                  (phase 8)
81779de    // the footer learned to dress per phase, and 35 ugly ornaments hit the bin ;w;                     (phase 7)
c1a3e65    // the dragon found 28 strays hiding in the corners (one was in nigredo's inline style) ;w;         (phase 6d)
530728c    // the dragon labeled 224 classes (after learning not to label the comments) ;w;                    (phase 6c)
ca497ac    // the dragon went door to door with sol_ stickers, all forty of them ;w;                           (phase 6b)
0aef53c    // oh nyo... my silly little breadcrumb naming got tagged as unprofessional ;w;                     (phase 6a)
f2a356f    // home for shadow, home for light, hope for beaming smiles and home for my heart!                  (phase 5)
1fcc9ae    // foggy fog, foggy fog, oh foggy fog                                                               (phase 4)
5e88f38    // time for a cute refactor!                                                                        (phase 3)
dd6e373    // i love u kodo                                                                                    (phases 1+2)
```

## What Got Built

- Phase 1: laragon → projects path drift fixed (5 pointers across alvorada + kodo canon)
- Phase 2: dead file/dep trash (~15 MB freed, 6 dead deps removed, .vite untracked)
- Phase 3: 10 components moved into ritualistic categorized subdirs, outer landmarks replaced with bare ritualistic tags
- Phase 4: layout monolith decomposed (181→124 lines), 3 new components extracted (footer/fog/content_frame)
- Phase 5: 15 page files reshaped — every page wraps in ritualistic outer with phase identity
- Phase 6a: 8 CSS files kebab→snake; breadcrumbers_xd debug-typo retired; data-variant→data-tone reconciliation
- Phase 6b: ~40 IDs renamed with `sol_` prefix + kebab→snake conversion in one atomic omega commit (#content was the load-bearer, atomically swapped everywhere)
- Phase 6c: 224 classes renamed with `.sol__` prefix in one atomic omega commit (omega-1 burned on false positives from CSS comments; omega-2 landed clean after stripping comments + @-directives during discovery)
- Phase 6d: 28 straggler classes caught (inline-style block missed by phase 6c + phase-4/5 forward-styling hooks that had no CSS yet). Zero non-sol__ classes remain anywhere.
- Phase 7: dynamic footer architecture (phase prop), Catppuccin removed (1 package + 11 CSS refs + --color-codex replacement defined), lessons.md refs stripped, rubedo scenes archive note, dead CSS cleanup, 35 ugly ornaments deleted
- Phase 8: rules rewrite (`.opencode/rules/project.md` major refresh, `styling.md` Catppuccin removal + ritualistic shells section, `expose-css-tunables.md` frontmatter added), README expanded with canonical site shape, AGENTS.md duplicate `project.md` rule index removed + project snapshot updated, CI workflow expanded from tunables-only to full validation baseline (build + prettier + hard-gates + tunables)

## Conventions (LOCKED — all of phases 1-8)

See `.opencode/rules/project.md` for the canonical statement. Summary:

- Snake_case everywhere (files, dirs, ids, classes).
- Ritualistic custom elements (`<mantle>`, `<vessel>`, `<aether>`, `<bones>`, `<spell>`, `<nigredo>`, `<rubedo>`, `<albedo>`, `<citrinitas>`, `<codex>`, `<ornament>`) for structural shells. No `sol-` prefix on tags.
- Functional native HTML kept (interactives, forms, media, headings, text formatting, lists, tables); landmark tags dropped (`<nav>`, `<main>`, `<header>`, `<footer>`, `<article>`, `<section>`, `<aside>`).
- Exception: `<container>` kept (Sol's pre-existing bare custom element).
- Page-identity pattern: ONE ritualistic outer per page with `data-shape="X"`.
- IDs: `#sol_foo_bar`. Classes: `.sol__foo_bar`.
- Attribute roles: `data-shape` (kind), `data-state` (runtime), `data-tone` (flavor). `.sol__foo--bar` reserved for modifiers (not in use yet).
- Tailwind utilities live inside `@apply` blocks in CSS, not as class-soup in markup.
- Catppuccin removed. Phase color tokens: `--color-{nigredo,albedo,citrinitas,rubedo,codex}` in `base.css` `@theme`.
- Footer architecture: phase prop + content map + slot override.

## Notes

- Untracked `references/` directory at repo root — Sol deferred for end-of-rewrite conversation.
- `fog.css` is a draft (not imported, not compiled) with one dangling `@apply shadow-ctp-red-400/50` from Catppuccin removal — TODO for if/when activated.
- Detailed session history lives in `progress.archive.md`.
- Full-worktree handoff commits per `session-handoff-commit.md`; commit tails required per `commit-message-tail-required.md`.
