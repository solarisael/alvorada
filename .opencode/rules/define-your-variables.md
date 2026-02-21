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

## Final Response Proof

- Map each user cue to: implemented, partially implemented, or blocked.
- Include file references for each implemented cue.
- Call out which aliases were applied.
