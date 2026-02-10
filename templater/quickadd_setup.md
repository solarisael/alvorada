# QuickAdd Setup (Text Effects)

## Prerequisites

- Install `Templater` and `QuickAdd` in Obsidian.
- Set your Templater templates folder to `templater`.

## Fast Setup (recommended)

1. Open QuickAdd settings.
2. Create one `Template` choice named `FX Picker`.
3. Point it to `templater/fx_picker.md`.
4. Assign a hotkey to `QuickAdd: FX Picker`.
5. Optional: add a `Template` choice named `Chapter Template` pointing to `templater/chapter_template.md`.

## Per-Effect Choices (optional)

Create Template choices using this map:

- `FX Glow` -> `templater/fx_glow.md`
- `FX Neon` -> `templater/fx_neon.md`
- `FX Shadow` -> `templater/fx_shadow.md`
- `FX Chroma` -> `templater/fx_chroma.md`
- `FX Blur` -> `templater/fx_blur.md`
- `FX Flicker` -> `templater/fx_flicker.md`
- `FX Rainbow` -> `templater/fx_rainbow.md`
- `FX Gradient` -> `templater/fx_gradient.md`
- `FX Wiggle` -> `templater/fx_wiggle.md`
- `FX Float` -> `templater/fx_float.md`
- `FX Shake` -> `templater/fx_shake.md`
- `FX Glitch` -> `templater/fx_glitch.md`

## Workflow

1. Select text in the editor.
2. Trigger `FX Picker` or a direct effect command.
3. Result is inserted in canonical marker format:
   `{{fx:effect_name}}...{{/fx}}`
