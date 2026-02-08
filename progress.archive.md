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
