---
layout: ../../../layouts/index.astro
title: FX Diagnostics Lab
phase: codex
tags:
  - codex/labs
  - sandbox/text-fx
  - diagnostics
date: 0058-04-24T11:15:00
authors_note: A technical parser and sanitization bench; this is not the aesthetic reference.
---

# FX Diagnostics Lab

This page is a **diagnostics bench**, not an aesthetic reference. The prose is synthetic and intentionally plain so parser behavior can be inspected without turning failure modes into spectacle. Each case records the input marker and the expected sanitization result. Reduced-motion preferences and runtime hydration should continue to govern the resulting effects.

## Reading the markers

FX channels are ordered as visual intensity, motion range, and speed. A one-number marker sets visual intensity; two numbers add motion; three numbers add speed. Stack separators (`|`) combine effects, while a color token may appear where the effect supports color.

## Duplicate effect token

**Input:** duplicate `glow` in one stack.

{{fx:glow|glow|whisper:1.05:0.9}}Duplicate tokens should collapse to one `glow`; `whisper` remains, and the shared numeric channels stay bounded. The sentence remains readable after sanitization.{{/fx}}

**Expected sanitization:** deduplicate by effect name; do not emit duplicate classes, variables, or animation work.

## Blacklisted pair: rainbow + gradient

**Input:** mutually noisy color treatments in one stack.

{{fx:rainbow|gradient|glow:1.1:1.0}}This diagnostic keeps the color conflict small enough to inspect.{{/fx}}

**Expected sanitization:** remove or neutralize the blacklisted `rainbow` + `gradient` pairing according to the runtime sanitizer, while retaining the safe effect(s). No private or legacy-only literal should leak into output.

## Blacklisted pair: shake + float

**Input:** incompatible displacement families.

{{fx:shake|float|veil:1.05:1.1}}The parser should choose a stable motion result rather than stacking competing displacement transforms.{{/fx}}

**Expected sanitization:** reject the `shake` + `float` pair (or retain only the sanitizer's canonical survivor); preserve `veil` and readable text.

## Unsupported and block tokens in a stack

**Input:** a block/UI token mixed into an inline stack, plus an unknown token.

{{fx:glow|terminal|not_a_real_effect|whisper:0.95}}Only supported inline effects should survive this stack.{{/fx}}

**Expected sanitization:** discard unsupported or block-only tokens (`terminal`, `not_a_real_effect`) without creating classes or runtime hooks for them; retain `glow` and `whisper`. The fallback must be plain, readable text if no valid token remains.

## Excess numeric channels

**Input:** four numeric channels where the grammar defines at most visual, motion, and speed.

{{fx:flicker:1.1:0.8:1.2:9.9}}An invalid fourth channel must not become a hidden control.{{/fx}}

**Expected sanitization:** reject the malformed marker rather than partially applying ambiguous settings; preserve its text as readable fallback and avoid inventing a fourth CSS variable.

## Color on a non-color-capable effect

**Input:** a color token attached to motion-only `shake`.

{{fx:shake:0.9:1.05:crimson}}Color is deliberately attached to an effect that does not consume it.{{/fx}}

**Expected sanitization:** ignore the color token for `shake` while preserving valid motion controls. Do not apply `crimson` globally or reinterpret it as a numeric channel.

## Bounded high-load stack

**Input:** several supported effects at conservative values, with no blacklist pair.

{{fx:glow|flicker|etch|shadow:1.15:0.85:1.05}}A bounded load should remain inspectable even when several safe effects share one fragment.{{/fx}}

**Expected sanitization:** preserve the supported stack, clamp values to runtime limits if necessary, and keep one predictable set of variables. This is a load probe—not an invitation to reproduce the legacy chaos catalogue.

## Diagnostic checklist

- Unknown, block-only, and unsupported tokens are removed without private literals or spectacle.
- Duplicate effects are canonicalized before classes and variables are emitted.
- Blacklisted pairs are rejected deterministically.
- Numeric channels stop at visual, motion, and speed.
- Color is consumed only by color-capable effects.
- Empty or fully invalid stacks degrade to readable text.
- Runtime hydration remains symmetric, and reduced-motion behavior still wins over author-supplied intensity or speed.
