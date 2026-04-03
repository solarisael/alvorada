# Progress History

Migrated from the legacy `progress.archive.md` continuity file.

## Purpose

Historical session log moved out of the root active quest surface to keep current context concise.

## Archived Snapshot (2026-02-21)

- Rebuilt desktop composition around class-driven body contracts (`body_grid`, `compound_body_grid`) and aligned nav/content on shared grid intent.
- Moved footer into `#content` transition scope with a dedicated full-width lane and footer-slot override support.
- Rebalanced shell lighting response by shell intensity: top-light capped and bottom-light boosted for subtle/medium/strong.
- Added shared center-axis controls to align nav center and content line/sigil ornaments to one visual spine.
- Removed logical CSS properties, removed reduced-motion branches, and migrated runtime aria-state behavior to classes/data attributes.
- Reduced non-typography clamp usage and simplified spacing/sizing values while preserving container-proportional percentages where composition-critical.
- Converted text effect animation offsets from percentages to `em` constants with stronger motion amplitude.
- Updated project/rules docs to codify new constraints and prevent regression.

## Archived Snapshot (2026-03-18)

- Added `nigredo` collection to `src/content.config.js` with state validation and frontmatter schema.
- Introduced Nigredo archive component stack and page runtime.
- Added archive runtime in `src/scripts/nigredo_archive.js` using `@tanstack/virtual-core` with row pooling, filtering, and measurement scheduling.
- Added Nigredo-specific page styling in `src/styles/components/nigredo-page.css`.
- Added Nigredo content files and seed support in `scripts/nigredo_seed.js`.
- Reduced redundant initial measurement scheduling after overlap reports.

## Retrieval Guidance

- For full granular history, use git history on the old root progress files before this migration commit.
- Add older retired session context here instead of re-bloating the active quest surface.
