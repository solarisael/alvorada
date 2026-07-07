---
layout: ../../../layouts/index.astro
title: Interaction Sandbox
phase: codex
tags:
  - codex/labs
  - sandbox/interaction
date: 0058-04-24T09:15:00
end: 0058-04-24T10:02:00
authors_note: One popup engine under everything — hover-preview, click-pin, reveal, and the deeper-door link, all through data-ix / {{ix:...}}.
---

# Interaction Sandbox

## Hover preview (no pin)

Hover the word {{ix:hover:preview:a lantern kept lit past its own oil}}lantern{{/ix}}
to see the word-meaning card. Move away and it closes on its own — nothing
pinned yet.

## Click to pin

Hover, then **click**, {{ix:hover:preview:the black vessel of becoming — everything unmade before it's remade}}nigredo{{/ix}}
to pin the card open. Click the same word again to unpin, or click anywhere
else on the page to dismiss it.

## Pinned card with a deeper door

{{ix:hover:preview:silver breath — distill signal from noise|/albedo}}albedo{{/ix}}
carries a door: pin it (click) and a "\u2192 open" link appears at the
bottom of the card, pointing at `/albedo`. That's the
`payload|door_href` grammar — same trailing-pipe syntax works from
`data-ix-href` on hand-authored chrome too.

## Click-trigger (no hover step)

{{ix:click:preview:this one only opens on click — no hover-preview step at all}}click-only{{/ix}}
uses `trigger:click` instead of `trigger:hover`. Hovering it does nothing;
the first click both opens and pins directly.

## Popup profiles

<span class="sol__ix" data-ix="hover:preview:a small compact label, for hints that should not feel like a whole card" data-ix-profile="compact">compact</span>
uses `data-ix-profile="compact"` for terse labels and UI hints.

<span class="sol__ix" data-ix="hover:preview:a shrine-card profile for richer codex lore and image-bearing fetches" data-ix-profile="reliquary">reliquary</span>
uses `data-ix-profile="reliquary"` for a more ceremonial default skin.

## Reveal — pull existing DOM into the card

{{ix:hover:reveal:#sol_ix_reveal_source}}hover to reveal the hidden panel{{/ix}}

<div id="sol_ix_reveal_source" hidden>
  <strong>Reveal source.</strong> This markup lives on the page already,
  just hidden — the popup engine copies its <code>innerHTML</code> into the
  card instead of using literal text. Useful for anything too rich for a
  plain-text payload (formatting, multiple lines, inline markup).
</div>

## Real chrome, not just prose

Nav pills across the whole site already carry `data-ix="hover:preview:…"`
sourced from `src/data/site_nav.js` — hover Nigredo/Albedo/Citrinitas/Rubedo
in the navbar (desktop or mobile) to see the same engine driving real UI,
not just this sandbox.

## Fetch — live content, cache-conscious, idle-preloaded

<a class="sol__ix" data-ix="hover:fetch:/nigredo" data-ix-select=".sol__page_hero p:first-of-type" href="/nigredo">hover to fetch nigredo's live lead paragraph</a>

This one hits the network — `hover:fetch:/nigredo` with `data-ix-select`
pulling just `.sol__page_hero p:first-of-type` out of the real, live
`/nigredo` page response, not a hand-written blurb. Two things happening
underneath so a hover never waits on cold network if it can help it:

- **Cache:** every fetched URL is cached for the rest of the page's
  lifetime (in-memory `Map`, keyed by URL + selector) — hover this twice
  and the second time is instant, no second request goes out.
- **Preload:** the moment this element hydrates, a `requestIdleCallback`
  (or `setTimeout` fallback) warms that same cache in the background —
  by the time you actually hover, it's very often already resolved.

Separately, the site's `htmx-preload` extension (vendored today — it was
declared in `hx-ext` sitewide but the extension file itself didn't exist
yet) now actually preloads real page navigations too: hover near any nav
pill and the browser starts warming that page's HTTP cache before you
click, via `preload="mouseover"` on the nav rail. That's independent of
this sandbox's `fetch` action — it speeds up normal clicking-through, not
the popup previews.

## Fetch — a real codex entry, with and without an image

Two minimal codex entries exist purely to prove this pipeline handles both
shapes: a fetch response that includes an image, and one that doesn't.

<a class="sol__ix" data-ix="hover:fetch:/codex/characters/cinza" data-ix-select=".sol__entry_body" data-ix-profile="reliquary" href="/codex/characters/cinza">hover — Cinza (has an image)</a>

<a class="sol__ix" data-ix="hover:fetch:/codex/relics/lantern" data-ix-select=".sol__entry_body" data-ix-profile="compact" href="/codex/relics/lantern">hover — the Lantern (text only)</a>

Both pull `.sol__entry_body` — the same selector, same code path — out of
their respective codex entry pages. Cinza's carries the same portrait used
for the navbar's hearth emblem (`images/small_render_4.png`); the Lantern's
doesn't have one at all. Same `fetch` action, same cache, same idle-preload,
two honestly different results — the popup shows whatever's actually there.
