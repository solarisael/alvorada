const window_any = /** @type {any} */ (globalThis);

const MOTION_MEDIA_QUERY = "(prefers-reduced-motion: reduce)";
const SHIFT_MAX_PX = 5;
const SHIFT_TRIGGER_PX = 2;
const SHIFT_VELOCITY_FACTOR = 0.16;
const SHIFT_EASE_FACTOR = 0.18;
const SHIFT_DAMPING_FACTOR = 0.9;
const SCROLL_THROTTLE_MS = 16;

let current_shift_px = 0;
let target_shift_px = 0;
let raf_id = 0;
let last_scroll_y = 0;
let last_scroll_handle_at = 0;

const clamp_value = (value, min_value, max_value) => {
  return Math.min(max_value, Math.max(min_value, value));
};

const set_shift_css_var = (value_px) => {
  document.documentElement.style.setProperty(
    "--reading_plane_shift_y",
    `${value_px.toFixed(2)}px`,
  );
};

const reset_shift = () => {
  current_shift_px = 0;
  target_shift_px = 0;

  if (raf_id) {
    window.cancelAnimationFrame(raf_id);
    raf_id = 0;
  }

  set_shift_css_var(0);
};

const animate_shift = () => {
  current_shift_px += (target_shift_px - current_shift_px) * SHIFT_EASE_FACTOR;
  target_shift_px *= SHIFT_DAMPING_FACTOR;

  if (Math.abs(current_shift_px) < 0.02 && Math.abs(target_shift_px) < 0.02) {
    reset_shift();
    return;
  }

  set_shift_css_var(current_shift_px);
  raf_id = window.requestAnimationFrame(animate_shift);
};

const queue_animation = () => {
  if (raf_id) {
    return;
  }

  raf_id = window.requestAnimationFrame(animate_shift);
};

const handle_scroll = () => {
  const current_scroll_y = window.scrollY;
  const scroll_delta = current_scroll_y - last_scroll_y;

  last_scroll_y = current_scroll_y;

  if (Math.abs(scroll_delta) <= SHIFT_TRIGGER_PX) {
    return;
  }

  const directional_target = clamp_value(
    -scroll_delta * SHIFT_VELOCITY_FACTOR,
    -SHIFT_MAX_PX,
    SHIFT_MAX_PX,
  );

  target_shift_px = clamp_value(
    target_shift_px + directional_target,
    -SHIFT_MAX_PX,
    SHIFT_MAX_PX,
  );

  queue_animation();
};

const init_reading_plane_motion = () => {
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    window_any.__reading_plane_motion_init_bound
  ) {
    return;
  }

  const reduced_motion_query = window.matchMedia(MOTION_MEDIA_QUERY);

  const apply_motion_mode = () => {
    if (reduced_motion_query.matches) {
      reset_shift();
      return;
    }

    last_scroll_y = window.scrollY;
    last_scroll_handle_at = 0;
  };

  apply_motion_mode();

  window.addEventListener(
    "scroll",
    () => {
      if (reduced_motion_query.matches) {
        return;
      }

      const now = performance.now();

      if (now - last_scroll_handle_at < SCROLL_THROTTLE_MS) {
        return;
      }

      last_scroll_handle_at = now;

      handle_scroll();
    },
    { passive: true },
  );

  reduced_motion_query.addEventListener("change", apply_motion_mode);
  window_any.__reading_plane_motion_init_bound = true;
};

init_reading_plane_motion();

export { init_reading_plane_motion };
