---
name: Define Your Variables
description: Clarify ambiguous terms and track Sol-defined aliases when they affect implementation.
alwaysApply: true
---

# Define Your Variables Rule

Use this rule when Sol uses ambiguous, overloaded, custom, or aesthetic terms that could materially change implementation.

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

## Preflight When Needed

Before implementation, provide a short preflight block when unresolved semantics would materially affect execution. Keep it compact:

- Intent restatement.
- Expected output.
- Defined variables/aliases.
- Verification method.

Do not block obvious, low-risk execution on ceremony when the meaning is already clear from context.

## Decision Pack Gate

Before implementation, present one consolidated
"decision pack" only when there are real blocking choices that Sol must resolve first.

### Required Structure

- `tradeoffs`: short list of key pros/cons and risks.
- `defaults`: explicit recommended defaults for each choice.
- `decision_questions`: numbered list with selectable options.
- `unknowns`: assumptions that remain if Sol does not choose.
- `execution_trigger`: execution is blocked only while genuine implementation blockers remain unresolved.

### Rules

- Ask all critical implementation questions in one batch.
- Do not drip-feed questions across multiple turns unless new blockers appear after new information.
- If Sol requests faster execution, provide defaults first, then ask only true blockers.
- If choices are not provided, pause and restate the minimum unresolved blockers.
- After Sol answers, restate locked decisions in one short block before executing.
- Do not invent blockers for straightforward work.

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
