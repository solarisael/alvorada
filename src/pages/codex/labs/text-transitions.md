---
layout: ../../../layouts/index.astro
title: Text Transition Lab
phase: codex
tags:
  - codex/labs
  - pretext/transitions
date: 0058-04-24T10:00:00
authors_note: A focused lab for the Pretext sentence transition engine, where atomized fragments carry dust and fog between states.
---

# Text Transition Lab

Pretext atomizes each sentence into readable fragments. The transition layer then animates those fragments as a group, so a new sentence can arrive without losing the text effects carried by its markup. Use the controls below to advance through the prepared sentences and compare how each transition moves the same kind of material.

<section class="sol__pretext_transition_lab" data-sol-transition-lab>
  <p class="sol__pretext_transition_note">Pretext atomizes the sentence into fragments; the transition animates those atoms. Choose a labelled effect to move the next sentence into place.</p>
  <div class="sol__pretext_transition_stage">
    <p class="sol__pretext_lab" data-sol-pretext="justify" data-sol-transition-lab-text>The first sentence stands still, waiting to be scattered into weather.</p>
  </div>
  <div class="sol__pretext_transition_controls" aria-label="Text transition demonstrations">
    <button type="button" data-sol-transition-lab-step="dust">Dust transition</button>
    <button type="button" data-sol-transition-lab-step="fog">Fog transition</button>
  </div>
  <template data-sol-transition-lab-sentence>The first sentence stands still, waiting to be scattered into weather.</template>
  <template data-sol-transition-lab-sentence>Every word is an atom; the transition is only <span class="sol__text_fx sol__text_fx_glow" data-text-fx-intensity="1.2">weather passing through</span> them.</template>
  <template data-sol-transition-lab-sentence>Dust remembers the sentence it used to be and <span class="sol__text_fx sol__text_fx_whisper" data-text-fx-intensity="0.9">reassembles on command</span>.</template>
  <template data-sol-transition-lab-sentence>The fog takes the words sideways and returns <span class="sol__text_fx sol__text_fx_etch" data-text-fx-intensity="1.1">different ones entirely</span>.</template>
</section>

## Dust demonstration

The dust transition breaks the current sentence into separate particles before the next fragment set settles back into readable order. It is useful for watching atomization happen in motion.

## Fog demonstration

The fog transition carries fragments laterally through a softer field before the next sentence resolves. It emphasizes drift and return rather than scattering.
