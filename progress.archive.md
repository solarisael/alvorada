# Progress Archive

## Purpose

Historical session log moved out of `progress.md` to keep active context concise.

## Archived Snapshot (2026-02-08)

- Source: prior `progress.md` before compacting active memory.
- Scope covered: HTMX transition stabilization, route-state timing sync, mobile nav implementation, nav stylesheet split, CSS tunables automation.

## Completed Themes (high level)

- Core route scaffolding completed for all current sections and dynamic child routes.
- Shared layout/breadcrumb/nav behavior stabilized for HTMX navigation flow.
- Mobile nav architecture implemented and style files split by platform.
- CSS tunables workflow added, including checker, sync script, and CI check.
- Agent policy set expanded across styling, typography, integration debugging, and commit workflow.

## Prior Next Items

1. Fresh-eye QA for mobile nav spacing/glow/center-home behavior.
2. Commit current uncommitted nav split + tunables automation after review.
3. Add Github Pages deployment workflow and validate static deploy output.

## Prior Validation Highlights

- Multiple successful builds through 2026-02-08 (`bun run build`).
- Repeated touched-file format checks passed (`bunx prettier --check ...`).
- CSS tunables checker passed (`bun run css:tunables:check`).

## Key Historical Decisions

- Use HTML-first HTMX attribute configuration with explicit edge-case overrides.
- Prefer least-invasive integration fixes with evidence-first diagnosis.
- Prefer CSS/native animation over JS per-frame animation when feasible.
- Require explicit commit-message-tail check protocol before commits.
- Keep switchable UI class options discoverable via a central registry.

## Retrieval Guidance

- For full granular history, use git history on `progress.md` before this archive split.
- Add detailed decision logs here when they stop being active but remain useful for future context.

## Archived Snapshot (2026-02-13)

- Source: session sequence that completed cinza visual refactor + governance hardening.
- Scope covered: background-to-layer decomposition, ornament migration from CSS to HTML nodes, component CSS separation, rule hardening, and audit automation.

### Completed Work (high level)

- Split heavy shell/card styles out of `src/styles/index.css` into component files.
- Converted decorative stacks to explicit markup layers across layout/nav/breadcrumb/mobile-nav/home cards.
- Migrated `/ornaments/cinza/*` usage from CSS `url(...)` to HTML `<img>` ornament nodes.
- Standardized layer naming (`*-layer-*`) and reduced variable indirection for ornament source selection.
- Added hard-gate governance for visuals:
  - new rule file `.opencode/rules/visual-hard-gates.md`
  - `alwaysApply: true` promotion for styling governance files
  - AGENTS validation/loading updates for hard-gate checks

### New Audit Tooling

- Added `scripts/css_ornaments_audit.js`.
- Added `scripts/css_background_stack_audit.js`.
- Added package scripts:
  - `bun run css:ornaments:check`
  - `bun run css:bg-stack:check`
  - `bun run css:hard-gates:check`

### Validation Highlights

- Build pass after hardening (`bun run build`).
- Formatting pass on touched files (`bunx prettier --check ...`).
- Hard-gates pass (`bun run css:hard-gates:check`).

### Commits (session batch)

- `7084f33` feat: render cinza ornaments as explicit image layers and reduce css indirection
- `88c1405` refactor: split layout and navigation visuals into component layers and simplify style ownership
- `43b6773` docs: harden visual implementation rules and add css gate audits

## Archived Snapshot (2026-02-13 Late Session)

- Source: typography + text effects + overlay system expansion session.
- Scope covered: readable rubedo typography uplift, POV-aware text rhythm,
  expanded text/block effects, parser reliability fixes, authoring ergonomics,
  and codex lab sandboxes.

### Completed Work (high level)

- Reworked reading typography baseline for stronger long-form readability,
  including Cinza/Rubedo tuning and cadence-ready styling.
- Expanded text effects system with new mystical inline effects and cadence
  variants, plus intensity and motion marker support.
- Added block overlay effects for LitRPG UI beats (terminal/stat/game and
  extended overlay suite).
- Added combat token auto-parser and higher-tier token styling for clearer
  battle log semantics.
- Enabled global markdown soft-break handling to remove authoring dependence on
  trailing double spaces.
- Migrated sandbox pages into Codex labs:
  - `src/pages/codex/labs/test-texts.md`
  - `src/pages/codex/labs/test-overlays.md`
- Added authoring bundles in `templater/` for common scene patterns.
- Added coverage test to require all registered effects to appear in sandbox
  pages.

### Validation Highlights

- Text effects + coverage tests passed (`bun test tests/text_effects.test.js tests/effects_coverage.test.js`).
- Build passed after parser and route migration (`bun run build`).
- CSS hard gates passed (`bun run css:hard-gates:check`).

## Archived Snapshot (2026-02-14)

- Source: stacked text-fx grammar and labs stress-testing session.
- Scope covered: `fx:a|b|c` stack syntax, sanitization warnings, combat-feed
  priority behavior, and cinematic chaos lab authoring.

### Completed Work (high level)

- Extended markdown marker parsing to support stacked inline effects with
  left-to-right precedence while preserving legacy `fx:effect[:v][:m]` markers.
- Added auto-sanitize pipeline for unknown/duplicate/blacklisted stack tokens
  with deduped build/dev warnings.
- Added stack blacklist defaults and runtime parity enforcement between SSR
  output and client hydration.
- Allowed `combat_feed` as the inline block exception in stacks and forced it to
  the front of emitted class order for deterministic priority.
- Added combat-feed color-priority CSS compatibility so stacked gradient/rainbow
  effects do not override combat line readability; combat tokens remain dominant.
- Expanded codex lab content with large cinematic stack coverage and an extreme
  chaos section for visual QA.

### Validation Highlights

- Text effects + coverage tests passed (`bun test tests/text_effects.test.js tests/effects_coverage.test.js`).
- Build passed after parser/style/lab updates (`bun run build`).
- CSS hard gates passed (`bun run css:hard-gates:check`).

## Archived Snapshot (2026-02-14 Pass 2)

- Source: typography token-organization and debugability pass.
- Scope covered: canonical token naming, sectioned CSS structure, cadence token inclusion, and legacy token removal with no visual-intent changes.

### Completed Work (high level)

- Reorganized `src/styles/typography.css` into a deterministic, debug-first layout with a top mini TOC and section headers.
- Migrated typography tokens to canonical families:
  - `type_*`
  - `leading_*`
  - `measure_*`
  - `space_*`
  - `weight_*`
- Included cadence token normalization in the same structure pass (`cadence_*` and reading font token naming).
- Removed old variable naming families instead of keeping CSS aliases, per session constraint.
- Preserved route and POV override intent while keeping consumer/utility mappings consistent.

### Validation Highlights

- Formatting passed for touched stylesheet (`bunx prettier --check src/styles/typography.css`).
- Build passed after token migration (`bun run build`).
- CSS hard gates passed (`bun run css:hard-gates:check`).

### Debug Convention Captured

- Every major token family has an explicit comment header directly above it.
- Section ordering is fixed and mirrored by the mini TOC for fast manual lookup.

## Archived Snapshot (2026-02-15)

- Source: Eyes + Timeline continuation focused on Rubedo constellation UX and markdown-first scene architecture.
- Scope covered: dedicated timeline route/component, markdown scene ingestion, identity governance, metadata override resolution, and session cleanup to single source of truth.

### Completed Work (high level)

- Added interactive Rubedo constellation timeline route and component:
  - `src/pages/rubedo/[book_slug]/timeline.astro`
  - `src/components/rubedo_timeline_constellation.astro`
  - `src/styles/components/rubedo-timeline.css`
- Wired reader/timeline link parity so "Open full reader" preserves chapter and POV query-state.
- Added markdown scene source files under `src/data/rubedo/scenes/absurd-faith/*` with duplicated identity fields/tags and per-variant card override support.
- Added markdown runtime book map builder `src/data/rubedo/book_timeline_runtime.js` and switched Rubedo pages to it.
- Added reusable identity validation module `src/data/rubedo/scene_identity.js`.
- Added identity audit CLI `scripts/rubedo_scene_identity_audit.js` and command `bun run rubedo:scenes:check`.
- Extended resolver output to include resolved chapter card metadata and override precedence in `src/utils/timeline_threads.js`.
- Extended tests:
  - `tests/timeline_threads.test.js`
  - `tests/rubedo_scene_identity.test.js`
- Completed markdown-only cutover by removing legacy fallback file `src/data/rubedo/book_timeline.js` and removing duplicate standalone chapter route `src/pages/rubedo/absurd-faith/af_000.md`.
- Updated authoring docs/template for duplicated identity fields/tags:
  - `templater/timeline_thread_scene_template.md`
  - `AGENTS.md`

### Validation Highlights

- Rubedo scene identity audit passed (`bun run rubedo:scenes:check`).
- Focused resolver + identity tests passed (`bun test tests/timeline_threads.test.js tests/rubedo_scene_identity.test.js`).
- Build passed after markdown-only cutover (`bun run build`).
- CSS hard gates passed (`bun run css:hard-gates:check`).

## Archived Snapshot (2026-02-21)

- Source: compound grid + shell cleanup + motion/style governance pass.
- Scope covered: body composition contracts, nav/content/footer alignment, CSS policy hardening, runtime state migration away from aria, clamp/logical-property cleanup, and shell-light rebalance with center-axis alignment.

### Completed Work (high level)

- Introduced class-driven body composition contracts and wired desktop layout around shared grid intent:
  - `body_grid`
  - `compound_body_grid`
- Rebuilt nav/content shell alignment for desktop while preserving fixed nav behavior and interaction runtime contracts.
- Moved footer inside `#content` transition scope with a dedicated full-width footer lane and per-page footer slot support.
- Rebalanced content shell light behavior by shell strength:
  - capped top light multiplier
  - increased bottom light multiplier for subtle/medium/strong
- Added shared center-axis tokens and aligned nav center + content line/sigil ornaments to the same center contract.
- Removed legacy duplicated stylesheet payload by deleting `src/styles/style.css`.
- Performed broad CSS cleanup:
  - removed logical properties (`*-inline`, `*-block`) in favor of physical properties
  - reduced non-typography clamp usage and kept clamp usage typography-scoped
  - pruned redundant percentage-based layout usage where not composition-critical
- Converted text effect motion keyframes from percent offsets to `em` constants with amplified motion profile.
- Removed `prefers-reduced-motion` branches from styles.
- Removed aria/role runtime-state contracts from markup and JS flows; migrated active/current/expanded behavior to classes/data attributes.
- Updated policy docs/rules to prevent regressions:
  - explicit ban on logical properties
  - aria/role runtime-state prohibition
  - no `prefers-reduced-motion` branches
  - clamp guidance restricted to typography

### Validation Highlights

- Repeated formatting checks passed on touched files (`bunx prettier --check ...`).
- Build passed after each major checkpoint (`bun run build`).
- Visual hard gates passed (`bun run css:hard-gates:check`).
- Tunables checks passed (`bun run css:tunables:check`).
