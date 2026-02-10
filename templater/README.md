# Templater Text Effects

This folder contains Obsidian templates for the canonical marker syntax used by the site build pipeline:

`{{fx:effect_name}}...{{/fx}}`

## Included Effects

- glow
- neon
- shadow
- chroma
- blur
- flicker
- rainbow
- gradient
- wiggle
- float
- shake
- glitch

## Files

- `fx_<effect>.md`: wraps current selection with a specific effect marker.
- `fx_picker.md`: asks for effect name and wraps current selection.
- `quickadd_setup.md`: ready-to-follow QuickAdd mapping.
- `chapter_template.md`: starter chapter scaffold with canonical text effects.

## Recommended Usage

1. Point Templater's template folder to `templater`.
2. Bind one hotkey to the `FX Picker` QuickAdd choice.
3. Use per-effect commands only for your most frequent effects.
4. Pin `templater/fx_cheatsheet.md` in Obsidian for quick lookup.
