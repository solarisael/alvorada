# Progress

## Meta

- Project: alvorada
- Repo: C:\laragon\www\alvorada
- Updated_utc: 2026-02-06 23:58
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
- [ ] Ship core sections/pages:
  - `Home / Nigredo` (introduction)
  - `Blog / Albedo` (personal writing, daily entries)
  - `Collections / Citrinitas` (highlights, image galleries)
  - `Book / Rubedo` (book projects, chapter entries)
  - `Wiki / Codex` (characters, world-building)
- [ ] Define baseline content structure for each section (listing + detail pages).
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

- [ ] Define MVP page map and IA:
  - routes `/`, `/albedo`, `/citrinitas`, `/rubedo`, `/codex`
  - required content blocks per page
- [ ] Build global navigation shell:
  - floating desktop top navbar
  - floating mobile bottom navbar
  - active-link states and no overlap on small screens
- [ ] Implement shared layout primitives:
  - base layout
  - section/container spacing system
  - shared typography/content-width rules
- [ ] Ship pages:
  - Nigredo (home)
  - Albedo (blog index MVP)
  - Citrinitas (collections index MVP)
  - Rubedo (book/chapter index MVP)
  - Codex (wiki index MVP)
- [ ] Add baseline content model/frontmatter for entries.
- [ ] QA responsiveness + accessibility pass.
- [ ] Validate with:
  - `bun run build`
  - `bunx prettier --check .`

## Status

- State: in_progress
- Branch: master
- Head: 890a1e3
- Scope_in: desktop navbar interaction refinements, performance optimization, and agent-rule documentation updates
- Scope_out: mobile navbar redesign and Home/Nigredo container implementation

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

## Next

1. [ ] Expand Home/Nigredo scaffold into final content sections (intro, thematic overview, CTA/navigation cues)
2. [ ] Tune reading rhythm and vertical spacing for long-form comfort on desktop/mobile

## Blockers

- No technical blocker; process adoption pending.

## Validation

- Build: pass (`bun run build`) - 2026-02-06 23:58
- Format: pass for latest touched files (`src/pages/index.astro`, `src/styles/index.css`, `progress.md`) - 2026-02-06 23:58
- Tests: not_run (no test suite in project) - 2026-02-06 23:58

## Decisions

- 2026-02-06 18:58 - Include explicit "not found" rule-file status - Why: remove ambiguity for future agents
- 2026-02-06 20:12 - Use HTMX with default `#content` swapping and edge-case data-attribute overrides - Why: keep shell persistent while preserving flexibility
- 2026-02-06 20:17 - Load HTMX/extensions from local dependencies only (no CDN runtime scripts) - Why: reproducibility, policy compliance, and offline/dev consistency
- 2026-02-06 20:22 - Resolved Tailwind build blocker by ensuring local utilities are correctly imported/referenced - Why: restore successful production builds
- 2026-02-06 23:40 - Constrain navbar proximity effect to one button at a time and shift rail glow to border-only behavior - Why: match intended subtle interaction design
- 2026-02-06 23:45 - Add debounced pointer handling and eased cursor return-to-center motion - Why: keep interactions smooth while reducing high-frequency handler cost
- 2026-02-06 23:50 - Require performance guards (`throttle`/`debounce`) for repeatable interactions in `AGENTS.md` with explicit opt-out rules - Why: establish consistent performance baseline for future sessions
- 2026-02-06 23:57 - Start Home/Nigredo scaffolding with centered, readable container and clamp-based width constraints - Why: establish content surface for next session's page composition

## Handoff

- Summary:
  - Desktop navbar was refined to use subtle border-led glow interactions, single-target button proximity, and prefix-specific hover glow behavior.
  - Center icon glow now uses an orbiting comet-like arc with elastic timing; legacy background glow image layer was removed.
  - Navbar pointer effects now use shared debounce utilities with smooth return-to-center motion, `AGENTS.md` now mandates performance guards for repeatable interactions, and Home/Nigredo container scaffolding is in place.
- First_action_next_session: expand Home/Nigredo scaffold into concrete content sections and finalize spacing rhythm.
