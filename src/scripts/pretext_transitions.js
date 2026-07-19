import {
  layout_pretext_root,
  reset_pretext_source,
} from "./pretext_justify.js";

const active_generation = new WeakMap();

const random_between = (minimum, maximum) =>
  minimum + Math.random() * (maximum - minimum);

const duration_options = (duration, delay = 0, easing) => ({
  duration,
  delay,
  easing,
  fill: "both",
});

export const PRETEXT_TRANSITION_EFFECTS = Object.freeze({
  dust: Object.freeze({
    out: (fragment, index, total) => {
      const x = random_between(-14, 14);
      const y = random_between(-18, -2);
      const rotation = random_between(-8, 8);
      return {
        keyframes: [
          {
            opacity: 1,
            transform: "translate(0, 0) rotate(0deg)",
            filter: "blur(0px)",
          },
          {
            opacity: 0,
            transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
            filter: "blur(6px)",
          },
        ],
        options: duration_options(520, 0, "ease-in"),
      };
    },
    in: (fragment, index, total) => {
      const x = random_between(-14, 14);
      const y = random_between(-18, -2);
      const rotation = random_between(-8, 8);
      return {
        keyframes: [
          {
            opacity: 0,
            transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
            filter: "blur(6px)",
          },
          {
            opacity: 1,
            transform: "translate(0, 0) rotate(0deg)",
            filter: "blur(0px)",
          },
        ],
        options: duration_options(560, 0, "cubic-bezier(0.16, 1.2, 0.3, 1)"),
      };
    },
  }),
  fog: Object.freeze({
    out: (fragment, index, total) => ({
      keyframes: [
        {
          opacity: 1,
          transform: "translateX(0) scale(1)",
          filter: "blur(0px)",
        },
        {
          opacity: 0,
          transform: "translateX(18px) scale(1.04)",
          filter: "blur(10px)",
        },
      ],
      options: duration_options(520, 0, "ease-in"),
    }),
    in: (fragment, index, total) => ({
      keyframes: [
        {
          opacity: 0,
          transform: "translateX(14px) scale(1.02)",
          filter: "blur(8px)",
        },
        {
          opacity: 1,
          transform: "translateX(0) scale(1)",
          filter: "blur(0px)",
        },
      ],
      options: duration_options(560, 0, "ease-out"),
    }),
  }),
});

const motion_multiplier = () => {
  if (
    typeof document === "undefined" ||
    typeof getComputedStyle !== "function"
  ) {
    return 1;
  }
  const value = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(
      "--site_fx_motion_mult",
    ),
  );
  return Number.isFinite(value) && value > 0 ? value : 1;
};

const reduced_motion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const animate_fragments = async (
  fragments,
  effect,
  phase,
  duration,
  stagger,
  multiplier,
  generation,
  root,
) => {
  const animations = [];
  for (const [index, fragment] of fragments.entries()) {
    if (active_generation.get(root) !== generation) return false;
    const result = effect[phase](fragment, index, fragments.length);
    const options = {
      ...result.options,
      duration: duration * multiplier,
      delay: index * stagger * multiplier,
    };
    const animation = fragment.animate(result.keyframes, options);
    animations.push(animation.finished.catch(() => undefined));
  }
  await Promise.all(animations);
  return active_generation.get(root) === generation;
};

export const transition_pretext_content = async (
  root,
  next_html,
  options = {},
) => {
  if (!(root instanceof HTMLElement)) return false;

  const generation = (active_generation.get(root) ?? 0) + 1;
  active_generation.set(root, generation);
  root.classList.add("sol__pretext_transitioning");

  const effect_name = options.effect ?? "dust";
  let effect = PRETEXT_TRANSITION_EFFECTS[effect_name];
  if (!effect) {
    console.warn(
      `Unknown pretext transition effect: ${effect_name}; falling back to dust.`,
    );
    effect = PRETEXT_TRANSITION_EFFECTS.dust;
  }

  const out_ms = options.out_ms ?? 520;
  const in_ms = options.in_ms ?? 560;
  const stagger_ms = options.stagger_ms ?? 14;
  const multiplier = motion_multiplier();
  const current_fragments = Array.from(
    root.querySelectorAll(".sol__pretext_fragment"),
  );
  const can_animate = current_fragments.every(
    (fragment) => typeof fragment.animate === "function",
  );
  const instant =
    reduced_motion() || !can_animate || current_fragments.length === 0;

  if (
    !instant &&
    !(await animate_fragments(
      current_fragments,
      effect,
      "out",
      out_ms,
      stagger_ms,
      multiplier,
      generation,
      root,
    ))
  ) {
    return false;
  }
  if (active_generation.get(root) !== generation) return false;

  root.innerHTML = next_html;
  reset_pretext_source(root);

  if (typeof options.on_swap === "function") {
    options.on_swap(root);
  }

  layout_pretext_root(root);

  const next_fragments = Array.from(
    root.querySelectorAll(".sol__pretext_fragment"),
  );
  const next_can_animate =
    next_fragments.length > 0 &&
    next_fragments.every((fragment) => typeof fragment.animate === "function");
  if (
    !instant &&
    next_can_animate &&
    !(await animate_fragments(
      next_fragments,
      effect,
      "in",
      in_ms,
      stagger_ms,
      multiplier,
      generation,
      root,
    ))
  ) {
    return false;
  }

  if (active_generation.get(root) === generation) {
    root.classList.remove("sol__pretext_transitioning");
    return true;
  }
  return false;
};
