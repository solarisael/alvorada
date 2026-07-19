---
layout: ../../../layouts/index.astro
title: Shader Chalice Lab
phase: codex
tags:
  - codex/labs
  - shader/chalice
date: 0058-04-24T11:05:00
authors_note: A focused aperture study for animated quote-water and shader clipping.
---

# Shader Chalice Lab

The chalice is an aperture, not a shaped paragraph. A shader-painted outer
window clips an ordinary square text source: the quote-water is allowed to
spill and move behind the opening, while the chalice aperture decides which
parts become visible. This keeps the prose readable as a source while the
window supplies the vessel silhouette.

## Live stage

The canvas is the animated surface; the aperture below it is the live quote
window. Reduced-motion handling remains with the existing initializer.

<section class="sol__shader_chalice_lab" data-sol-shader-chalice-lab>
  <p class="sol__shader_chalice_note">Outer chalice = the actual clipping window. The quote-water is an ordinary square text source behind it, allowed to spill; the chalice aperture decides what can be seen.</p>
  <div class="sol__shader_chalice_stage">
    <canvas class="sol__shader_chalice_canvas" data-sol-shader-chalice-canvas aria-hidden="true"></canvas>
    <div class="sol__shader_chalice_aperture" aria-label="Animated chalice quote window">
      <div class="sol__shader_chalice_text_box">
        <p class="sol__shader_chalice_text" data-sol-pretext="justify">The wound is not the ending. The vessel remembers every fracture and still holds water. What passes through the cup becomes signal, then weather, then prayer with teeth. A city can be a spell if enough hands refuse to let it become a machine for forgetting. The gate opens, closes, glitches, opens again. Somewhere inside the noise, a small black sun keeps counting the living names.</p>
      </div>
    </div>
  </div>
</section>
