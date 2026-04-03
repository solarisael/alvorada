# Active Quests

## Meta

- Project: alvorada
- Updated_utc: 2026-03-18 23:18
- Updated_by: Kintsu (`openai / gpt-5.4`)
- next_session: co-pilot
- primary_outcome: polish the Nigredo archive and every Nigredo page for layout, motion, spacing, and consistency
- priority: polish
- edit_breadth: focused
- first_task: verify `/nigredo` and several Nigredo entry pages in-browser, then tighten spacing, load behavior, and visual consistency
- commit_intent: after_review

## Active Scope

- State: handoff_ready
- Branch: master
- Head: pending_commit
- Scope_in: Nigredo collection, archive list, Nigredo entry route, archive virtualization sizing pass
- Scope_out: Rubedo timeline redesign, Eyes redesign

## Next

1. [ ] Polish `/nigredo` archive spacing, alignment, and first-load behavior.
2. [ ] Polish Nigredo entry pages for typography, spacing, and visual identity.
3. [ ] Run browser QA across desktop/mobile for Nigredo archive filters, scrolling, and entry navigation.

## Blockers

- None.

## Validation

- Build: pass (`bun run build`) — 2026-03-18
- CSS hard gates: pass (`bun run css:hard-gates:check`) — 2026-03-18
- Prettier: pass (`bunx prettier --check src/scripts/nigredo_archive.js`) — 2026-03-18

## Current Snapshot

- Added Astro `nigredo` content collection and wired Nigredo archive data from content frontmatter.
- Added Nigredo archive UI/components, entry route, seed script, and Nigredo-specific styles.
- Added TanStack virtualized archive runtime in `src/scripts/nigredo_archive.js` and reduced redundant first-load measurement scheduling.
- Build and hard-gate checks pass; browser polish remains for the next session.
