---
layout: ../../../layouts/index.astro
title: Pretext Shapes Lab
phase: codex
tags:
  - codex/labs
  - layout/pretext
  - text-shapes
date: 0058-04-24T11:05:00
authors_note: Focused Pretext layout studies for justification, shaped line profiles, and inline FX across line breaks.
---

# Pretext Shapes Lab

A focused study of Pretext's line layout: first ordinary justification, then three shaped profiles. Each example keeps inline text effects inside the source paragraph so spacing, wrapping, and effect metadata can be inspected together.

## 1. Justified Rich Text

This baseline stretches ordinary word gaps to create a book-like edge. The animated fragments are intentionally long enough to cross line breaks, verifying that their individual intensity and motion settings survive Pretext's layout pass.

<p class="sol__pretext_lab" data-sol-pretext="justify">Pretext carries this paragraph as rich inline fragments, so Solarisael can keep its own <span class="sol__text_fx" data-text-fx="whisper glow" data-text-fx-whisper-intensity="0.9" data-text-fx-glow-intensity="0.7">soft spectral emphasis</span> while the layout layer stretches the ordinary word gaps into a quieter, book-like edge. The important test is that <span class="sol__text_fx" data-text-fx="flicker glow" data-text-fx-flicker-intensity="0.85" data-text-fx-flicker-motion="1.35" data-text-fx-glow-intensity="0.7">animated fragments survive line breaks</span> without giving up their individual intensity and motion controls.</p>

## 2. Diamond Profile

The diamond narrows to a capstone, widens toward a broad center, and tapers to a deliberate point. This longer passage gives the profile enough rows to show its silhouette while the inline glow and whisper fragment tests shaped-line FX continuity.

<p class="sol__pretext_lab sol__pretext_shape_lab" data-sol-pretext="justify" data-sol-pretext-shape="diamond">Diamond shape: the first breath is narrow, the middle opens into a bright chamber, and the ending tapers back to a point. Solarisael can keep <span class="sol__text_fx" data-text-fx="glow whisper" data-text-fx-glow-intensity="0.8" data-text-fx-whisper-intensity="0.9">low spectral ink</span> inside the shaped line stack while the words themselves become the visible body. This longer sample keeps feeding the layout enough language to show the diamond breathing: small capstone, widening shoulders, a broad center where the sentence can rest, then a closing taper that makes the bottom feel deliberate instead of merely short. If the shape is working, the eye should feel the paragraph becoming a little faceted reliquary, not a normal text box with accidental line breaks. Add more words and the gem starts to show its planes: one line catches the light, the next line carries it farther, the center has enough room to feel almost like a chamber, and the descent should close with the same pressure that opened it. This is where we can judge whether the algorithm preserves a clean silhouette after several sentences, whether inline effects still land on the correct fragments, and whether the final point feels intentional rather than starved.</p>

## 3. Hourglass Profile

The hourglass starts broad, pinches at a readable hinge, and opens again below. Its sustained copy makes both the narrow waist and the survival of inline layout behavior visible instead of reducing the test to a short decorative sample.

<p class="sol__pretext_lab sol__pretext_shape_lab" data-sol-pretext="justify" data-sol-pretext-shape="hourglass">Hourglass shape: wide at the shoulders, narrowed at the hinge, then wide again at the base. This longer version gives the algorithm more room to show the waist. The upper lines should feel generous, almost like the paragraph is inhaling; the middle should pinch into a readable throat; the bottom should open again without losing the thread. It is a good stress test for whether shaped text still reads naturally when the silhouette asks the prose to squeeze, pause, and expand. If the line widths become too dramatic, this is where it should be obvious. More copy makes the hinge less theoretical: the reader can watch the field contract over several rows, hold tension through the narrow center, then release back into wider language. The hourglass is useful because it punishes sloppy shaping fast. If the center gets too thin, words fragment and the reading rhythm breaks. If it does not get thin enough, the whole thing becomes a rectangle in a costume. This sample should make both failure modes visible without needing a separate diagram.</p>

## 4. Chalice Profile

The chalice forms a wide lip, narrowing bowl, thin stem, and reopening foot. This is a text-only shape study: the paragraph itself is the vessel, with no shader, transition, or external clipping layer involved.

<p class="sol__pretext_lab sol__pretext_shape_lab" data-sol-pretext="justify" data-sol-pretext-shape="chalice">Chalice shape: a wide lip, a narrowing bowl, a thin stem, and a foot that opens again. This is closer to the Pretext demo idea: line widths are computed per row, so the paragraph itself becomes the cup instead of wrapping around some other object. More text makes the cup easier to judge. The upper mouth should hold several full lines, the bowl should taper gradually, the stem should become visibly narrow without breaking readability, and the foot should widen just enough to make the final line feel placed. This is the candidate shape for the home screen because it feels like a vessel, a threshold, and a little altar made entirely out of words. With a longer passage, the chalice gets to prove its actual behavior: the lip should feel ceremonial rather than merely broad, the bowl should have enough depth to gather thought, the stem should be delicate but not useless, and the base should arrive like a quiet landing. If this holds together, we can later feed it devotional copy, navigation hints, or small myth-texts and decide whether the shape feels alive on the page or only clever in the lab.</p>
