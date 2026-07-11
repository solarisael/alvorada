{{fx:neon}}<% tp.file.selection() %>{{/fx}}

## Color argument

Color is optional and unlabeled: `{{fx:neon[:value][:value][:value]}}...{{/fx}}`. Numbers fill visual then motion intensity (clamped `0.2`–`5`); CSS named colors, hex (`#fc0`, `#ffcc00`), and palette tokens may appear in any position.

Accepted palette tokens: `accent`, `accent_alt`, `nigredo`, `albedo`, `citrinitas`, `rubedo`, `codex`. In per-effect stacks, values after `=` are slash-separated.

```md
{{fx:neon:gold}}electric line{{/fx}}
{{fx:neon=accent_alt|glow:1.1}}electric halo{{/fx}}
```
