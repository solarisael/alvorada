import { describe, expect, test } from "bun:test";

import { compute_chalice_animation_state } from "../src/scripts/shader_chalice_lab.js";

const CHALICE_ANIMATION_CYCLE_MS = 7600;
const animation_at_phase = (phase) =>
  compute_chalice_animation_state(CHALICE_ANIMATION_CYCLE_MS * phase);

describe("compute_chalice_animation_state", () => {
  test("keeps text fade and glitch intensity on the same wrapped clock", () => {
    const before_fade = animation_at_phase(0.6);
    const vanish_window = animation_at_phase(0.72);
    const after_wrap = compute_chalice_animation_state(
      CHALICE_ANIMATION_CYCLE_MS + 320,
    );

    expect(before_fade.textOpacity).toBeCloseTo(0.9, 5);
    expect(before_fade.textBlurRem).toBeCloseTo(0, 5);
    expect(before_fade.glitch).toBeCloseTo(0, 5);

    expect(vanish_window.textOpacity).toBeLessThan(before_fade.textOpacity);
    expect(vanish_window.textBlurRem).toBeGreaterThan(before_fade.textBlurRem);
    expect(vanish_window.glitch).toBeGreaterThan(before_fade.glitch);

    expect(after_wrap.textOpacity).toBeCloseTo(before_fade.textOpacity, 5);
    expect(after_wrap.textBlurRem).toBeCloseTo(before_fade.textBlurRem, 5);
    expect(after_wrap.glitch).toBeCloseTo(before_fade.glitch, 5);
    expect(vanish_window.glitch).toBeGreaterThan(after_wrap.glitch);
  });
});
