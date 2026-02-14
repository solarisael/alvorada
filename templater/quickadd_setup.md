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
- `FX Terminal` -> `templater/fx_terminal.md`
- `FX Stat Screen` -> `templater/fx_stat_screen.md`
- `FX Game Screen` -> `templater/fx_game_screen.md`
- `FX Quest Log` -> `templater/fx_quest_log.md`
- `FX Skill Popup` -> `templater/fx_skill_popup.md`
- `FX Inventory` -> `templater/fx_inventory.md`
- `FX Combat Feed` -> `templater/fx_combat_feed.md`
- `FX Status Effects` -> `templater/fx_status_effects.md`
- `FX System Warning` -> `templater/fx_system_warning.md`
- `FX Memory Fragment` -> `templater/fx_memory_fragment.md`
- `FX Admin Trace` -> `templater/fx_admin_trace.md`
- `FX Party Roster` -> `templater/fx_party_roster.md`
- `FX Map Ping` -> `templater/fx_map_ping.md`
- `FX Aura` -> `templater/fx_aura.md`
- `FX Etch` -> `templater/fx_etch.md`
- `FX Whisper` -> `templater/fx_whisper.md`
- `FX Sigil Pulse` -> `templater/fx_sigil_pulse.md`
- `FX Veil` -> `templater/fx_veil.md`
- `FX Cadence` -> `templater/fx_cadence.md`
- `FX Cadence Soft` -> `templater/fx_cadence_soft.md`
- `FX Cadence Oracular` -> `templater/fx_cadence_oracular.md`
- `FX Cadence Childlike` -> `templater/fx_cadence_childlike.md`
- `FX Wiggle` -> `templater/fx_wiggle.md`
- `FX Float` -> `templater/fx_float.md`
- `FX Shake` -> `templater/fx_shake.md`
- `FX Glitch` -> `templater/fx_glitch.md`

## Workflow

1. Select text in the editor.
2. Trigger `FX Picker` or a direct effect command.
3. Result is inserted in canonical marker format:
   `{{fx:effect_name[:visual_intensity][:motion_intensity]}}...{{/fx}}`
4. Intensity values are optional and clamped to `0.2` -> `3` by the site runtime.

## Scene Bundles (authoring ergonomics)

Create Template choices using this map:

- `Bundle Combat Beat` -> `templater/bundle_combat_beat.md`
- `Bundle Quest Accept` -> `templater/bundle_quest_accept.md`
- `Bundle Checkpoint Summary` -> `templater/bundle_checkpoint_summary.md`
