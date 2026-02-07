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
  you to choose from, and mark one recommended option first.
- If a user-provided approach works and does not violate repo constraints,
  prefer it.

## Post-Fix Discipline

- Verify the fix under realistic usage paths.
- Check for regressions around the modified area.
- Document the reasoning behind non-obvious decisions briefly and clearly.
