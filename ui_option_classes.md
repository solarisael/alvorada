# UI Option Classes

This file is the single registry for switchable UI class options.

When new optional class variants are introduced, add them here in the same change.

## Changelog

- 2026-02-08: Added initial registry with `navbar-preset-*`,
  `route-active-tone-*`, and `page-transition-breath-*` option sets.
- 2026-02-08: Added `home_theme_*` and `home_fx_*` option sets for `/` card-gate visuals.
- 2026-02-08: Migrated `home_theme_*` to `site_theme_*` and `home_fx_*` to `site_fx_*` for global naming.
- 2026-02-08: Added `site_shell_*` option set for shell intensity control.
- 2026-02-08: Added `verdigris` to `data-site-theme` options.
- 2026-02-09: Replaced 4 theme options with 7 inspiration-aligned themes and dual alias naming.

## Navbar Preset

- Purpose: controls baseline desktop navbar richness (glass blur/light intensity).
- Apply on: `#desktop-nav` in `src/components/navbar.astro`.
- Default: `navbar-preset-rich`.
- Options:
  - `navbar-preset-soft`
  - `navbar-preset-rich`

Quick switch:

```html
<nav id="desktop-nav" class="navbar-preset-rich ..."></nav>
```

## Route Active Tone

- Purpose: controls active-link background tint/saturation and border intensity.
- Apply on: `#desktop-nav` in `src/components/navbar.astro`.
- Default: `route-active-tone-medium`.
- Options:
  - `route-active-tone-subtle`
  - `route-active-tone-medium`
  - `route-active-tone-strong`

Quick switch:

```html
<nav id="desktop-nav" class="route-active-tone-medium ... ..."></nav>
```

## Page Transition Breath

- Purpose: controls fade-out -> gap -> fade-in timing between page swaps.
- Apply on: `body` in `src/layouts/index.astro`.
- Default: `page-transition-breath-subtle`.
- Options:
  - `page-transition-breath-subtle`
  - `page-transition-breath-noticeable`

Quick switch:

```html
<body class="page-transition-breath-subtle" ...></body>
```

## Add New Option Sets

For each new option set, document:

1. Purpose
2. Where to apply the class
3. Default class
4. Full options list
5. One-line quick switch example

## Text Effects

- Purpose: inline visual emphasis that follows global `data-site-fx` intensity.
- Apply on: inline `span` elements only.
- Base class: `text_fx`.
- Effect classes:
  - `text_fx_glow`
  - `text_fx_neon`
  - `text_fx_shadow`
  - `text_fx_chroma`
  - `text_fx_blur`
  - `text_fx_flicker`
  - `text_fx_rainbow`
  - `text_fx_gradient`
  - `text_fx_aura`
  - `text_fx_etch`
  - `text_fx_whisper`
  - `text_fx_sigil_pulse`
  - `text_fx_veil`
  - `text_fx_cadence`
  - `text_fx_cadence_soft`
  - `text_fx_cadence_oracular`
  - `text_fx_cadence_childlike`
  - `text_fx_wiggle`
  - `text_fx_float`
  - `text_fx_shake`
  - `text_fx_glitch`

Quick switch:

```html
<span class="text_fx text_fx_glow">luminous text</span>
```

Markdown marker (Obsidian flow):

```md
{{fx:glow}}luminous text{{/fx}}
{{fx:glow:1.4}}luminous text (visual only){{/fx}}
{{fx:flicker:1.2:0.8}}fading signal (visual + motion){{/fx}}
{{fx:aura:1.5}}consecrated phrase{{/fx}}
{{fx:sigil_pulse:1.4:1.1}}warding phrase{{/fx}}
{{fx:cadence_oracular:1.1}}inner vow{{/fx}}
```

- Marker syntax: `{{fx:effect_name[:visual_intensity][:motion_intensity]}}...{{/fx}}`
- Intensity range: `0.2` -> `3` (runtime-clamped)
- Coverage rule: every registered effect must appear in at least one sandbox page (`src/pages/codex/labs/test-texts.md` or `src/pages/codex/labs/test-overlays.md`).

## Block Effects

- Purpose: full-width in-prose overlays for LitRPG system layers.
- Apply on: wrapper `div` generated from standalone marker pairs.
- Base class: `block_fx`.
- Effect classes:
  - `block_fx_terminal`
  - `block_fx_stat_screen`
  - `block_fx_game_screen`
  - `block_fx_quest_log`
  - `block_fx_skill_popup`
  - `block_fx_inventory`
  - `block_fx_combat_feed`
  - `block_fx_status_effects`
  - `block_fx_system_warning`
  - `block_fx_memory_fragment`
  - `block_fx_admin_trace`
  - `block_fx_party_roster`
  - `block_fx_map_ping`

Markdown marker (Obsidian flow):

```md
{{fx:terminal:1.2:0.9}}
[SYSTEM] Awaiting input.
{{/fx}}

{{fx:stat_screen:1.1}}

- HP: 100/100
- MP: 62/62
  {{/fx}}

{{fx:game_screen:1.2}}
**Milestone Quest Received**

- Objective A // 0%
  {{/fx}}

{{fx:quest_log:1.25}}
**Active Quests**

- [Main] Descend alive // 0%
  {{/fx}}

{{fx:system_warning:1.2}}
**CAUTION: ACCESS INSTABILITY DETECTED**
{{/fx}}
```

- Block wrapper element: `div`
- Marker syntax: `{{fx:block_effect[:visual_intensity][:motion_intensity]}} ... {{/fx}}`
- Intensity range: `0.2` -> `3` (runtime-clamped)
- Coverage rule: every registered effect must appear in at least one sandbox page (`src/pages/codex/labs/test-texts.md` or `src/pages/codex/labs/test-overlays.md`).

## Site Theme

- Purpose: controls global site visual language aligned to inspiration families with dual alias names.
- Apply on: `html` via `data-site-theme` and globally via style switcher cookies.
- Default: `minimal_astral`.
- Options:
  - `minimal_astral` (`astrology_themed`) - clean celestial linework
  - `gilded_arcane` (`golden_mystical_tarot`) - ornate black-gold tarot
  - `cosmic_overlay` (`cosmic_themed`) - orbital cosmic layouts
  - `witchy_ornate` (`wicca_ornamentation`) - decorative occult motifs
  - `graveyard_gothic` (`gothic_dark_girl`) - dark feminine collage
  - `pixel_relic` (`relic_gothic`) - retro relic HUD
  - `grimdark_tarot` (`grimdark_tarot`) - moody narrative tarot

Quick switch:

```html
<html data-site-theme="minimal_astral"></html>
```

## Site Effects Intensity

- Purpose: controls content emphasis intensity (text/border/interactions + non-shell motion) independent of theme.
- Apply on: `html` via `data-site-fx` and globally via style switcher cookies.
- Default: `balanced`.
- Options:
  - `subtle`
  - `balanced`
  - `bold`

Quick switch:

```html
<html data-site-fx="bold"></html>
```

## Site Shell Strength

- Purpose: controls page/chrome container intensity (surfaces/backgrounds/blur/shell glow/decorative overlays).
- Apply on: `html` via `data-site-shell` and style switcher cookies.
- Default: `medium`.
- Options:
  - `subtle`
  - `medium`
  - `strong`

Quick switch:

```html
<html data-site-shell="strong"></html>
```
