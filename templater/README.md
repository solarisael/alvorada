# Templater Text Effects

This folder contains Obsidian templates for the canonical marker syntax used by
the site build pipeline:

`{{fx:effect_name[:visual_intensity][:motion_intensity]}}...{{/fx}}`

Notes:

- `visual_intensity` and `motion_intensity` are optional.
- Single intensity applies to visual only.
- Supported range for both intensities is clamped to `0.2` -> `3`.

## Included Effects

- glow
- neon
- shadow
- chroma
- blur
- flicker
- rainbow
- gradient
- terminal
- stat_screen
- game_screen
- quest_log
- skill_popup
- inventory
- combat_feed
- status_effects
- system_warning
- memory_fragment
- admin_trace
- party_roster
- map_ping
- aura
- etch
- whisper
- sigil_pulse
- veil
- cadence
- cadence_soft
- cadence_oracular
- cadence_childlike
- wiggle
- float
- shake
- glitch

## Files

- `fx_<effect>.md`: wraps current selection with a specific effect marker.
- `fx_picker.md`: asks for effect name and wraps current selection.
- block effects (`terminal`, `stat_screen`, `game_screen`, `quest_log`, `skill_popup`, `inventory`, `combat_feed`, `status_effects`, `system_warning`, `memory_fragment`, `admin_trace`, `party_roster`, `map_ping`) wrap selection in multiline marker blocks.
- `bundle_*.md`: scene-ready authoring bundles for common LitRPG beats.
- `quickadd_setup.md`: ready-to-follow QuickAdd mapping.
- `chapter_template.md`: starter chapter scaffold with canonical text effects.
- `timeline_thread_scene_template.md`: frontmatter scaffold for canonical
  timeline scenes and thread variants (`thread_key` + `thread_modifier`).

## Recommended Usage

1. Point Templater's template folder to `templater`.
2. Bind one hotkey to the `FX Picker` QuickAdd choice.
3. Use per-effect commands only for your most frequent effects.
4. Pin `templater/fx_cheatsheet.md` in Obsidian for quick lookup.
