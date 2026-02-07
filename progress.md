# Progress

## Meta

- Project: alvorada
- Repo: C:\laragon\www\alvorada
- Updated_utc: 2026-02-08 00:36
- Updated_by: agent (opencode)

## Goal

- Primary: Keep session memory concise and reliable across agent handoffs.
- Success:
  - [x] `AGENTS.md` created with accurate repo guidance
  - [ ] Maintain this file every session

## Project Goals (Phased)

### Phase 1 - Foundation (Now / MVP)

- [ ] Implement floating fixed navbar:
  - [x] desktop variant pinned at top (magical glass + neon, center Eyes placeholder)
  - [ ] mobile variant pinned at bottom
- [x] Ship core sections/pages:
  - `Home / Nigredo` (introduction)
  - `Blog / Albedo` (personal writing, daily entries)
  - `Collections / Citrinitas` (highlights, image galleries)
  - `Book / Rubedo` (book projects, chapter entries)
  - `Wiki / Codex` (characters, world-building)
- [x] Define baseline content structure for each section (listing + detail pages).
- [ ] Ensure responsive behavior and navigation consistency across desktop/mobile.
- [ ] Apply baseline accessibility (semantic structure, keyboard-safe navigation).

### Phase 2 - Content System + Discovery (Next)

- [ ] Define reusable content schema for:
  - posts/entries
  - chapters
  - codex records
  - collection items
- [ ] Add taxonomy/tag system for filtering and cross-linking.
- [ ] Improve gallery/content browsing UX in `Citrinitas`.
- [ ] Strengthen internal linking between `Rubedo`, `Codex`, and `Albedo`.
- [ ] Add performance passes for media-heavy sections (image sizing, lazy loading).

### Phase 3 - Progression Mechanics (Next+)

- [ ] Design and implement unlock progression model for:
  - Codex entries
  - Rubedo pages/chapters
- [ ] Track reading progress and unlock state per user.
- [ ] Build locked/unlocked UI states and progression cues.
- [ ] Add persistence strategy:
  - local-first progress storage
  - optional future account/cloud sync

### Phase 4 - Rubedo POV Timeline System (Advanced)

- [ ] Define timeline/event data model for chapters.
- [ ] Implement character POV selector for `Rubedo`.
- [ ] Render chapter/timeline view based on selected POV + time position.
- [ ] Support deep-link/shareable URLs for POV + timeline state.
- [ ] Validate continuity rules (what should/should not be visible per POV/time).

### Phase 5 - Text Effects Engine (Polish + Power Features)

- [ ] Implement text effects system where span classes decorate entry text.
- [ ] Provide reusable effect presets (consistent, performant, readable).
- [ ] Integrate effect usage into content pipeline safely.
- [ ] Add accessibility guardrails:
  - reduced-motion support
  - readability fallbacks
  - non-effect fallback rendering

### Milestones

- [ ] MVP complete: Phase 1 done.
- [ ] Content platform complete: Phases 1-2 done.
- [ ] Narrative systems complete: Phases 1-4 done.
- [ ] Full vision complete: Phases 1-5 done.

## Phase 1 Sprint Checklist (1-2 Weeks)

- [x] Define MVP page map and IA:
  - routes `/`, `/nigredo`, `/albedo`, `/citrinitas`, `/rubedo`, `/codex`
  - dynamic routes `/albedo/[post_slug]`, `/citrinitas/[post_slug]`, `/rubedo/[book_slug]`, `/codex/[...entry_path]`
  - required content blocks per page
- [ ] Build global navigation shell:
  - floating desktop top navbar
  - floating mobile bottom navbar
  - active-link states and no overlap on small screens
- [ ] Implement shared layout primitives:
  - base layout
  - section/container spacing system
  - shared typography/content-width rules
- [x] Ship pages:
  - Nigredo (home)
  - Albedo (blog index MVP)
  - Albedo post page (child)
  - Citrinitas (collections index MVP)
  - Citrinitas post page (child)
  - Rubedo (book/chapter index MVP)
  - Rubedo book page (child)
  - Codex (wiki index MVP)
  - Codex entry page (variable-depth child)
- [ ] Add baseline content model/frontmatter for entries.
- [ ] QA responsiveness + accessibility pass.
- [ ] Validate with:
  - `bun run build`
  - `bunx prettier --check .`

## Status

- State: in_progress
- Branch: master
- Head: 63fdff0
- Scope_in: route scaffolding for all core/dynamic pages, breadcrumb URL theming, navbar behavior and HTMX navigation reliability
- Scope_out: final page content authoring and full mobile-nav UX polish

## Commands

- Install: `bun install`
- Dev: `bun run dev`
- Build: `bun run build`
- Preview: `bun run preview`
- Format_check: `bunx prettier --check .`
- Format_fix: `bunx prettier --write .`
- Single_test_file: `bun test path/to/file.test.js`
- Single_test_name: `bun test path/to/file.test.js -t "name"`

## Constraints

- Bun only (no npm/yarn)
- Ask before adding dependencies
- Prefer functional style; avoid classes/OOP
- Prefer snake_case for new identifiers
- Prefer CSS `@apply` over long inline utility classes

## Done

- [x] Created agent guide - Files: `AGENTS.md`
- [x] Verified Cursor/Copilot rule file status (not found) - Files: `.cursor/rules/`, `.cursorrules`, `.github/copilot-instructions.md`
- [x] Implemented floating desktop navbar phase-1 visuals - Files: `src/components/navbar.astro`, `src/styles/components/nav.css`
- [x] Added navbar-local interaction script (cursor-follow + per-pill glow) - Files: `src/components/navbar.astro`
- [x] Integrated HTMX navbar defaults with edge-case overrides (`data-hx-target`, `data-hx-swap`, `data-hx-select`) - Files: `src/components/navbar.astro`
- [x] Enabled global HTMX extensions (`idiomorph`, `head-support`, `preload`, `sse`) - Files: `src/layouts/index.astro`, `src/scripts/htmx_bootstrap.js`
- [x] Replaced CDN runtime package sourcing with local bundled imports for HTMX/extensions - Files: `src/layouts/index.astro`, `src/scripts/htmx_bootstrap.js`, `AGENTS.md`
- [x] Refined desktop navbar glow behavior: border-only rail effect, single-pill proximity glow, and `~/` prefix-only hover glow - Files: `src/components/navbar.astro`, `src/styles/components/nav.css`
- [x] Added center icon orbit glow with elastic timing and comet-like arc; removed legacy `#icon-user-glow` image layer - Files: `src/components/navbar.astro`, `src/styles/components/nav.css`
- [x] Added debounced navbar pointer interaction (`16ms`) via shared performance module and smooth return-to-center motion for cursor glow - Files: `src/components/navbar.astro`, `public/js/modules/performance.js`, `src/styles/components/nav.css`
- [x] Documented required interaction-performance policy (throttle/debounce + exceptions) for future agents - Files: `AGENTS.md`
- [x] Scaffolded Home/Nigredo reading container inside `main` with centered layout and clamp-based sizing (`min 340px`, `max 66vw`) - Files: `src/pages/index.astro`, `src/styles/index.css`
- [x] Moved navbar HTMX defaults from script into direct HTML attributes and removed `apply_htmx_defaults` script flow - Files: `src/components/navbar.astro`
- [x] Reworked navbar `pointerleave` behavior to use debounced, JS-driven 420ms recenter animation with coherent pill-glow decay - Files: `src/components/navbar.astro`
- [x] Clarified agent rule to avoid script-applied HTMX defaults except explicit edge cases - Files: `AGENTS.md`
- [x] Replaced JS-calculated navbar recenter animation with CSS transition recenter controlled by pointer-state class toggles - Files: `src/components/navbar.astro`, `src/styles/components/nav.css`
- [x] Added explicit AGENTS guidance to prefer CSS/native animation over JS per-frame calculations when feasible - Files: `AGENTS.md`
- [x] Added strict site aesthetic rule doc (glass + nuanced neon + mystical/alchemical direction; Catppuccin Mocha marked temporary) - Files: `.opencode/rules/styling.md`
- [x] Added strict typography rule doc (fluid, semantic, reading-first, CSS/Tailwind utility approach) - Files: `.opencode/rules/typography.md`
- [x] Implemented shared main reading shell inside persistent `#content` target - Files: `src/layouts/index.astro`, `src/styles/base.css`, `src/styles/index.css`
- [x] Migrated typography from SCSS artifacts to source-of-truth CSS with 10px min base and 768-1440 fluid interpolation - Files: `src/styles/typography.css`, `src/styles/typography.scss`, `src/styles/typography.css.map`
- [x] Scoped global typography defaults to reading surface (`#main_reading_container`) using semantic element selectors and rhythm spacing - Files: `src/styles/typography.css`
- [x] Updated Home/Nigredo scaffold to rely on shared container and scoped typography defaults - Files: `src/pages/index.astro`, `src/styles/index.css`
- [x] Added breathing room below fixed navbar and implemented hide-on-down/show-on-up navbar visibility with focus-safe reveal - Files: `src/styles/index.css`, `src/styles/components/nav.css`, `src/components/navbar.astro`
- [x] Moved breadcrumbs into shared reading container, generated URL-hierarchy breadcrumbs, and applied phase-aware accent styling with muted parents - Files: `src/layouts/index.astro`, `src/components/breadcrumbers.astro`, `src/styles/components/breadcrumbs.css`
- [x] Scaffolded core pages and dynamic child routes with deterministic `getStaticPaths()` for static builds - Files: `src/pages/nigredo.astro`, `src/pages/albedo.astro`, `src/pages/citrinitas.astro`, `src/pages/rubedo.astro`, `src/pages/codex.astro`, `src/pages/albedo/[post_slug].astro`, `src/pages/citrinitas/[post_slug].astro`, `src/pages/rubedo/[book_slug].astro`, `src/pages/codex/[...entry_path].astro`
- [x] Added codex category routes (`/codex/characters`, `/codex/factions`, `/codex/places`, `/codex/relics`) and category/back links for traversal testing - Files: `src/pages/codex.astro`, `src/pages/codex/[...entry_path].astro`
- [x] Added codex to desktop/mobile navigation visual systems and breadcrumb phase accents - Files: `src/components/navbar.astro`, `src/styles/components/nav.css`, `src/styles/components/mobile-nav.css`, `src/components/breadcrumbers.astro`
- [x] Stabilized partial navigation by using global client entry import strategy and container replacement swap mode - Files: `public/js/scripts.js`, `src/layouts/index.astro`, `src/components/navbar.astro`
- [x] Added generalized integration/debugging rule to prioritize least-invasive fixes and evidence-first diagnosis - Files: `.opencode/rules/integration-debugging.md`
- [x] Added explicit session-handoff commit rule and linked it in AGENTS guidance - Files: `.opencode/rules/session-handoff-commit.md`, `AGENTS.md`
- [x] Extended session-handoff commit rule to request optional user-provided commit-message tail separated with `//` - Files: `.opencode/rules/session-handoff-commit.md`

## Next

1. [ ] Replace scaffold placeholders with first-pass real content blocks for core pages.
2. [ ] Add active-link visual state rules for desktop/mobile navigation.
3. [ ] Run mobile navigation QA pass and adjust spacing/overlap behavior.

## Blockers

- No technical blocker; process adoption pending.

## Validation

- Build: pass (`bun run build`) - 2026-02-07 00:09
- Format: pass for latest touched files (`.opencode/rules/typography.md`, `src/layouts/index.astro`, `src/styles/base.css`, `src/styles/index.css`, `src/styles/typography.css`, `src/pages/index.astro`, `progress.md`) - 2026-02-07 02:26
- Format_repo: fail (`bunx prettier --check .`) due to pre-existing unrelated files (17 files)
- Tests: not_run (no test suite in project) - 2026-02-07 02:30

## Decisions

- 2026-02-06 18:58 - Include explicit "not found" rule-file status - Why: remove ambiguity for future agents
- 2026-02-06 20:12 - Use HTMX with default `#content` swapping and edge-case data-attribute overrides - Why: keep shell persistent while preserving flexibility
- 2026-02-06 20:17 - Load HTMX/extensions from local dependencies only (no CDN runtime scripts) - Why: reproducibility, policy compliance, and offline/dev consistency
- 2026-02-06 20:22 - Resolved Tailwind build blocker by ensuring local utilities are correctly imported/referenced - Why: restore successful production builds
- 2026-02-06 23:40 - Constrain navbar proximity effect to one button at a time and shift rail glow to border-only behavior - Why: match intended subtle interaction design
- 2026-02-06 23:45 - Add debounced pointer handling and eased cursor return-to-center motion - Why: keep interactions smooth while reducing high-frequency handler cost
- 2026-02-06 23:50 - Require performance guards (`throttle`/`debounce`) for repeatable interactions in `AGENTS.md` with explicit opt-out rules - Why: establish consistent performance baseline for future sessions
- 2026-02-06 23:57 - Start Home/Nigredo scaffolding with centered, readable container and clamp-based width constraints - Why: establish content surface for next session's page composition
- 2026-02-06 22:34 - Remove navbar script-applied HTMX defaults and declare `hx-*` attributes directly in nav-pill markup - Why: align with preferred HTMX pattern and reduce hidden behavior
- 2026-02-06 22:36 - Replace immediate `pointerleave` reset with debounced 420ms JS recenter easing - Why: fix overly fast return-to-center feel not governed by CSS transition timing
- 2026-02-06 22:38 - Codify "HTML-first HTMX configuration" in `AGENTS.md` with rare edge-case exception - Why: enforce consistent, inspectable HTMX usage across sessions
- 2026-02-06 22:47 - Shift navbar recenter to CSS-driven transition with pointer-state class toggles instead of JS interpolation - Why: keep behavior simpler, explicit, and free of animation-frame calculations
- 2026-02-06 22:55 - Add AGENTS policy to prefer CSS/native animation over JS per-frame calculations when possible - Why: reduce complexity and runtime animation overhead
- 2026-02-07 02:20 - Add strict styling rule with mystical/alchemical direction and Catppuccin-as-temporary guidance - Why: lock aesthetic consistency while preserving future palette flexibility
- 2026-02-07 02:24 - Migrate typography to CSS-native source with 10px base and 768-1440 fluid interpolation - Why: simplify styling pipeline and align with Tailwind/CSS utility workflow
- 2026-02-07 02:29 - Scope global typography defaults to `#main_reading_container` only - Why: avoid UI side effects while removing per-component content typography setup
- 2026-02-07 23:57 - Add codex route to desktop navbar and codex character sibling route (`sol` <-> `luna`) - Why: broaden navigation-path testing across nested routes
- 2026-02-08 00:04 - Add generic codex category routes and links - Why: validate intermediate hierarchy levels, not only leaf entries
- 2026-02-08 00:08 - Prefer simple global client import strategy and container-replacement swap mode for reliable partial navigation - Why: reduce integration complexity and avoid duplicate container artifacts
- 2026-02-08 00:12 - Add generalized integration/debugging rule focused on evidence-first, least-invasive fixes - Why: prevent over-engineered diagnostics and improve iteration quality
- 2026-02-08 00:28 - Add session-handoff commit permission rule and uncertainty-option communication requirement - Why: make handoff workflow explicit and improve decision collaboration under uncertainty
- 2026-02-08 00:36 - Require optional user-supplied commit-message suffix prompt at handoff (using `//` separator) - Why: preserve user voice in handoff commits with consistent formatting

## Handoff

- Summary:
  - All planned core routes and dynamic child routes are scaffolded and buildable, including codex category and variable-depth entry pages.
  - Breadcrumbs are layout-owned, URL-driven, HTMX-safe, and phase-accented with reduced emphasis for ancestor segments.
  - Desktop navbar includes codex and uses hide-on-down/show-on-up behavior; mobile styling now includes codex label/accent parity.
  - Partial navigation behavior was stabilized via the existing global client entry approach and container-replacement swap mode.
  - Added a generalized integration/debugging rule to enforce evidence-first, least-invasive changes.
- First_action_next_session: replace scaffold copy with initial real content and tune active-link states/QA for mobile navigation.
