import {
  RUBEDO_CONSTELLATION_INTERACTION,
  RUBEDO_CONSTELLATION_WORLD_BOUNDS,
} from "../constellation_config.js";
import { compute_overscroll } from "../constellation_viewport.js";

const create_inertia = ({
  view_state,
  canvas,
  world_bounds,
  reduced_motion,
  persist_view,
  render_now,
  mark_interaction,
}) => {
  let inertia_frame_id = 0;
  let velocity_x = 0;
  let velocity_y = 0;
  const stop_inertia = () => {
    if (inertia_frame_id) {
      window.cancelAnimationFrame(inertia_frame_id);
      inertia_frame_id = 0;
    }

    velocity_x = 0;
    velocity_y = 0;
  };

  const run_inertia = () => {
    if (reduced_motion()) {
      stop_inertia();
      return;
    }

    if (inertia_frame_id) {
      return;
    }

    const step = () => {
      if (reduced_motion()) {
        stop_inertia();
        return;
      }

      mark_interaction();
      view_state.pan_x += velocity_x;
      view_state.pan_y += velocity_y;

      const overscroll = compute_overscroll(view_state, canvas, world_bounds);
      const outside_soft_zone =
        overscroll.left >
          RUBEDO_CONSTELLATION_WORLD_BOUNDS.edge_soft_overscroll_x ||
        overscroll.right >
          RUBEDO_CONSTELLATION_WORLD_BOUNDS.edge_soft_overscroll_x ||
        overscroll.top >
          RUBEDO_CONSTELLATION_WORLD_BOUNDS.edge_soft_overscroll_y ||
        overscroll.bottom >
          RUBEDO_CONSTELLATION_WORLD_BOUNDS.edge_soft_overscroll_y;

      velocity_x *= RUBEDO_CONSTELLATION_INTERACTION.inertia_damping;
      velocity_y *= RUBEDO_CONSTELLATION_INTERACTION.inertia_damping;

      if (outside_soft_zone) {
        velocity_x *=
          RUBEDO_CONSTELLATION_INTERACTION.outside_velocity_damp_mult;
        velocity_y *=
          RUBEDO_CONSTELLATION_INTERACTION.outside_velocity_damp_mult;
      }

      persist_view();
      render_now();

      if (
        Math.abs(velocity_x) <
          RUBEDO_CONSTELLATION_INTERACTION.inertia_stop_px &&
        Math.abs(velocity_y) < RUBEDO_CONSTELLATION_INTERACTION.inertia_stop_px
      ) {
        inertia_frame_id = 0;

        return;
      }

      inertia_frame_id = window.requestAnimationFrame(step);
    };

    inertia_frame_id = window.requestAnimationFrame(step);
  };
  return {
    stop_inertia,
    run_inertia,
    set_velocity: (x, y) => {
      velocity_x = x;
      velocity_y = y;
    },
    is_active: () =>
      inertia_frame_id !== 0 ||
      Math.abs(velocity_x) >=
        RUBEDO_CONSTELLATION_INTERACTION.inertia_stop_px ||
      Math.abs(velocity_y) >= RUBEDO_CONSTELLATION_INTERACTION.inertia_stop_px,
  };
};
export { create_inertia };
