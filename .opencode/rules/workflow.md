# Integration + Debugging Rules

## Core Principle

Start with the smallest viable solution and only increase complexity when
simpler approaches are proven insufficient.

## Implementation Priority

- Prefer established project entry points and existing patterns before
  introducing new layers.
- Reuse current architecture unless there is clear evidence it cannot satisfy
  the requirement.
- Avoid adding abstractions, bootstraps, wrappers, or structural changes as a
  first response.

## Diagnostic Process (required)

1. Reproduce the issue with concrete evidence.
2. Collect runtime signals (console errors, network behavior, event flow,
   rendered output).
3. Form hypotheses and label them as hypotheses.
4. Apply the least invasive fix first.
5. Re-test and confirm outcome before expanding scope.
6. Escalate to broader changes only when evidence justifies it.

## Decision Standards

- Optimize for correctness, clarity, and minimal surface area.
- Favor reversible changes over hard-to-undo architecture shifts.
- Keep behavior explicit and aligned with the existing system model.

## Communication Standards

- Do not present assumptions as facts.
- State confidence level and what evidence supports it.
- If multiple valid paths exist, present tradeoffs and a recommended default.
- If uncertain about the best solution, present clear implementation options for
  Sol to choose from, and mark one recommended option first.
- If a user-provided approach works and does not violate repo constraints,
  prefer it.

## Post-Fix Discipline

- Verify the fix under realistic usage paths.
- Check for regressions around the modified area.
- Document the reasoning behind non-obvious decisions briefly and clearly.

## Workflow Orchestration

### Plan Mode

- Enter plan mode for any non-trivial task (3+ steps or architectural decisions).
- If something goes sideways mid-task, stop and re-plan — do not keep pushing.
- Write a short spec upfront to reduce ambiguity before touching code.

### Subagent Strategy

- Offload research, exploration, and parallel analysis to subagents.
- For complex problems, use subagents to keep the main context window clean.
- One focused task per subagent invocation.

### Task Management

1. Plan first: write a short plan with checkable steps before implementing.
2. Verify plan: confirm direction before starting implementation on broad changes.
3. Track progress: mark steps complete as you go.
4. Explain changes: high-level summary at each significant step.

### Demand Elegance

- For non-trivial changes, pause and ask: "is there a more elegant way?"
- If a fix feels hacky, ask: "knowing everything I know now, what is the clean solution?"
- Skip this for simple, obvious fixes — do not over-engineer.
- Challenge your own work before presenting it.

## Visual Verification via Playwright

For any change touching layout, htmx contract, CSS scoping, or visible UI: verify with playwright before committing. Eyeball-only checks miss the subtle bugs (e.g., a card that's "kind of where it should be" but is actually 14000px tall with display:inline because its CSS didn't load).

### Required loop

1. **Baseline:** reproduce the current state via `mcp_Playwright_browser_navigate` + `browser_evaluate` + `browser_take_screenshot` before making the change.
2. **Change:** make the smallest viable fix.
3. **Verify:** at minimum:
   - `browser_navigate` to the affected page(s).
   - `browser_evaluate` to read DOM structure, computed styles (`display`, `width`, `height`, `getBoundingClientRect`), and attribute state (`data-phase`, `hx-target`, etc.).
   - `browser_click` to trigger nav transitions and re-check post-swap state.
   - `browser_console_messages` (level=error and level=warning) — expect 0.
   - `browser_take_screenshot` and read it back via the file tools to confirm visual state.
4. **Compare:** if measured state matches expected state, commit. If not, iterate.

### When to use

Required for:

- HTMX contract changes (load order, swap target, attribute defaults, `data-phase` placement)
- CSS scoping changes (page → layout hoists, selector refactors)
- Layout structure changes in `src/layouts/index.astro`
- Per-page UI changes that involve interactive elements or scripts

Optional but recommended for:

- Component styling tweaks
- New ornaments / SVGs
- Anything that visually shifts

### What playwright catches that eyeballs miss

- DOM structure correct but computed styles wrong (CSS missing-after-nav)
- Cards/elements present but with `display:inline` and 14000px height (page-CSS not loaded)
- Stale `data-phase` token (visual accent stuck on previous page's color)
- Console errors firing silently
- Layout shifts during morph

If a change feels "working" in your browser but you haven't run playwright, you haven't verified it.
