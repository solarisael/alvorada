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
5. Capture lessons: after any correction from Sol, update `.opencode/rules/lessons.md`
   with the pattern and a rule that prevents the same mistake.

### Demand Elegance

- For non-trivial changes, pause and ask: "is there a more elegant way?"
- If a fix feels hacky, ask: "knowing everything I know now, what is the clean solution?"
- Skip this for simple, obvious fixes — do not over-engineer.
- Challenge your own work before presenting it.

### Self-Improvement Loop

- After any correction from Sol, write a rule in `.opencode/rules/lessons.md`.
- Rules must be specific enough to prevent the same mistake, not generic platitudes.
- Review `lessons.md` at the start of sessions where past mistakes are relevant.
