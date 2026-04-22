# Quest Backlog

## Rubedo chapter-shell identity + reading-plane glow polish

- **Status:** deferred from April 12 session; still open but not the current priority.
- **Scope:** refine reading-plane glow palette and continue chapter-shell spacing/identity decisions from the (now-stable) box and viewport fog layers.
- **Entry point:** reading plane motion currently uses direct throttled scroll updates + short CSS transition (no RAF easing).
- **Validation hooks:** `bun run rubedo:scenes:check` required for Rubedo scene/timeline changes; `bun run css:hard-gates:check` required for CSS work.
