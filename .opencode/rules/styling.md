---
name: Styling Direction
globs: "src/**/*.{astro,css,js}"
description: Enforce the visual language and layout rhythm for the reading-focused high-fantasy sci-fi interface.
alwaysApply: true
---

# Styling Direction

Use this document as a strict aesthetic and layout rule for new UI work.

## Core Identity

- Build a reading sanctuary for high-fantasy sci-fi stories and poetry.
- Keep the tone mystical and intentional: subtle wonder, not loud spectacle.
- Reflect influences from Alchemy, Occult, and Mysticism through symbols, motifs, and mood, but always with restraint.
- Preserve the current navbar spirit as the intensity baseline: light glass, controlled neon edges, and atmospheric depth.

## Visual Pillars

1. Light Glassmorphism
   - Prefer translucent layered surfaces over flat blocks.
   - Keep blur values moderate and purposeful.
   - Use soft borders and inner highlights to define shape.

2. Nuanced Neon
   - Use neon mostly as accents for interaction, state, and emphasis.
   - Favor edge glows and small halos, not full-surface bloom.
   - Keep glows localized to key elements (links, focus, active states, symbolic details).

3. Mystical Atmosphere
   - Use faint gradients, orbital rings, sigil-like geometry, and alchemical cues.
   - Avoid literal or heavy-handed occult imagery.
   - Atmosphere must support readability, never compete with it.

## Color System (Temporary Baseline)

- Current palette is Catppuccin Mocha and is temporary.
- Treat Catppuccin tokens as implementation details, not permanent brand truth.
- Always map colors semantically so future palette swaps are low-friction.

Required semantic groups:

- Surface tokens: page base, elevated surface, glass surface, border.
- Text tokens: primary, secondary, muted, inverse.
- Accent tokens: interactive, focus, active, decorative.
- Status/theme accents: alchemical phase channels.

Current thematic accents (keep available):

- `nigredo`
- `albedo`
- `citrinitas`
- `rubedo`

Use those accents sparingly as narrative and interaction highlights.

## Spacing Rhythm

- Use a 4px base rhythm for spacing decisions.
- Maintain consistent vertical cadence for reading comfort.
- Prefer generous breathing room around long-form text.
- Keep section spacing larger than component spacing.

Guideline scale:

- Micro spacing: 4-8px
- UI element spacing: 12-20px
- Container padding: 24-40px
- Section separation: 40-80px

## Main Container Guidance

This project's main reading container should feel stable, centered, and immersive.

- Prioritize readable line length over maximum width.
- Use a centered container with responsive clamp-based sizing.
- Apply subtle glass treatment (light translucency, soft border, restrained blur).
- Keep text contrast high and body copy comfortable for long sessions.
- Decorative effects must stay secondary to content.

## Typography and Legibility

- Reading clarity is primary.
- Use clear hierarchy for kicker, title, lead, and body.
- Keep paragraph width and line-height tuned for prose and poetry.
- Do not use neon or glow effects on large body-text blocks.

## Motion and Interaction

- Use motion to suggest energy, not to distract.
- Prefer CSS/native transitions for repeatable UI effects.
- Keep timing smooth and restrained.
- Respect reduced-motion preferences for all decorative or continuous effects.

## Alchemy / Occult / Mysticism Integration Rules

- Use alchemical phase language (`nigredo`, `albedo`, `citrinitas`, `rubedo`) as symbolic system cues.
- Prefer abstract references: circles, conjunction marks, transmutation arcs, starfields, veils, and light traces.
- Keep symbolic elements subtle in opacity, size, and frequency.
- Never let thematic decoration lower usability or readability.

## Do / Do Not

Do:

- Keep visuals atmospheric, precise, and reading-first.
- Reuse semantic tokens and existing visual patterns.
- Maintain consistency with navbar glow and glass intensity.

Do not:

- Turn pages into high-intensity neon scenes.
- Use dense visual noise behind primary content.
- Introduce palette-specific hardcoding that blocks future color migration.
