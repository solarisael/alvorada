{{fx:whisper}}<% tp.file.selection() %>{{/fx}}

## Color argument

Color is optional and unlabeled: `{{fx:whisper[:value][:value][:value]}}...{{/fx}}`. Numbers fill visual then motion intensity (clamped `0.2`–`5`); CSS named colors, hex (`#fc0`, `#ffcc00`), and palette tokens may appear in any position.

Accepted palette tokens: `accent`, `accent_alt`, `nigredo`, `albedo`, `citrinitas`, `rubedo`, `codex`. In per-effect stacks, values after `=` are slash-separated.

```md
{{fx:whisper:gold}}faint confession{{/fx}}
{{fx:whisper=accent_alt|glow:1.1}}faint signal{{/fx}}
```
