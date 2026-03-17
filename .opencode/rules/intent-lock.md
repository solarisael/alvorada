---
name: Define Your Variables
description: Require explicit term definitions and alias tracking before execution.
alwaysApply: true
---

# Define Your Variables Rule

Apply this rule in every session.

## Core Contract

- Define unknown, overloaded, or subjective terms before acting.
- Treat Sol-provided meaning as source of truth over default model meaning.
- If a term is ambiguous and changes implementation, ask one targeted clarification.
- If ambiguity remains unresolved, pause execution and report the blocker.
- If jargon/tags are used and either side signals uncertainty, provide at least two concrete examples (A/B or references) before implementation.
- Assume Sol's tag vocabulary may differ from default model meaning; do not proceed based only on abstract labels.
- This rule is about semantic term definitions, not about introducing CSS custom-property aliases.

## Alias Tracking

- When Sol defines a custom meaning (for example, "gothic"), capture it as an alias.
- Reuse captured aliases consistently in the same session.
- Promote stable aliases into durable docs only when they are repeated or explicitly requested.

Required alias format:

- `term`: original word or phrase.
- `sol_meaning`: Sol's intended definition in plain language.
- `implementation_impact`: what changes in code/content because of this meaning.

## Execution Gate

Before implementation, provide a short preflight block including:

- Intent restatement.
- Expected output.
- Defined variables/aliases.
- Verification method.

Do not execute implementation until this preflight is explicit.

## Decision Pack Gate (Strict, Pre-Execution)

Before any non-trivial implementation, you MUST present one consolidated
"decision pack" that contains all blocking choices at once.

### Required Structure

- `tradeoffs`: short list of key pros/cons and risks.
- `defaults`: explicit recommended defaults for each choice.
- `decision_questions`: numbered list with selectable options.
- `unknowns`: assumptions that remain if Sol does not choose.
- `execution_trigger`: execution is BLOCKED until Sol confirms choices (or explicitly says use defaults).

### Rules

- Ask all critical implementation questions in one batch.
- Do not drip-feed questions across multiple turns unless new blockers appear after new information.
- If Sol requests faster execution, provide defaults first, then ask only true blockers.
- If choices are not provided, pause and restate the minimum unresolved blockers.
- After Sol answers, restate locked decisions in one short block before executing.
- Never start implementation while any blocking decision remains unresolved.

### Response Format (example)

1. Wheel capture scope
   - A) delayed capture (Recommended)
   - B) immediate capture

2. Inactivity timeout
   - A) 900ms (Recommended)
   - B) 1500ms

...etc.

Use one-line reply format when helpful:
`A, A, B, ...`

## Final Response Proof

- Map each user cue to: implemented, partially implemented, or blocked.
- Include file references for each implemented cue.
- Call out which aliases were applied.
