---
name: Typography Rules
globs: "src/**/*.{astro,css,js}"
description: Enforce fluid, reading-first typography using Tailwind-friendly CSS utilities and semantic text scales.
alwaysApply: true
---

# Typography Rules

Use this document as a strict rule for all text styles.

## Core Principles

- Typography serves long-form reading first, decoration second.
- Maintain clear hierarchy with stable rhythm across desktop and mobile.
- Keep text highly legible in mystical/glass surfaces.
- Prioritize semantics: use heading/body/caption intent, not arbitrary visual jumps.

## Required Fluid System

- Source of truth must be `src/styles/typography.css`.
- Use CSS + Tailwind utilities; do not rely on SCSS for typography generation.
- Use a minimum base size of `10px`.
- Use fluid interpolation range from `768px` to `1440px`.
- Prefer `clamp()` and custom properties for reusable formulas.

## Scale and Hierarchy

- Body text defines the baseline reading comfort.
- Heading scale must step progressively (`h1` through `h6`) with visible but controlled contrast.
- Small/caption text must remain readable and not collapse below accessibility-friendly sizes.
- Long-form text line-height should be more generous than UI labels.

## Line Length and Rhythm

- Keep prose line length in readable measure ranges.
- Keep paragraph spacing consistent and calm.
- Avoid dense vertical stacking in reading containers.
- Use spacing tokens/rhythm from the styling rule document.

## Utility and Semantic Usage

- Provide reusable text utilities for body, lead, heading tiers, and caption tiers.
- Apply typography through semantic classes/element defaults, not inline one-off sizes.
- Keep utility naming descriptive and stable.
- Prefer semantic token usage so palette and theme changes do not require typography rewrites.

## Effects and Accessibility

- Do not apply neon/glow effects to large body text blocks.
- Keep heading embellishments subtle and optional.
- Respect `prefers-reduced-motion` when text effects involve animation.
- Preserve strong contrast for all interactive and narrative text.

## Do / Do Not

Do:

- Build consistent fluid scales from the 10px base.
- Keep typography calm, atmospheric, and reading-centered.
- Reuse shared typography utilities.

Do not:

- Mix multiple unrelated type systems in the same surface.
- Hardcode random per-component font sizes without semantic purpose.
- Let decorative styles reduce readability.
