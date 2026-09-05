import { screen_to_world } from "../../webgl/math.js";
import {
  apply_soft_bounds,
  slider_to_zoom,
  zoom_to_slider,
} from "../constellation_viewport.js";

const bind_zoom_controls = ({
  controls,
  canvas,
  view_state,
  world_bounds,
  bump_interaction,
  zoom_at_screen_point,
  center_active,
  persist_view,
  render_now,
  listen,
}) => {
  if (controls.zoom_in_button instanceof HTMLElement) {
    listen(controls.zoom_in_button, "click", () => {
      bump_interaction();
      zoom_at_screen_point(canvas.width * 0.5, canvas.height * 0.5, 1.16);
    });
  }

  if (controls.zoom_out_button instanceof HTMLElement) {
    listen(controls.zoom_out_button, "click", () => {
      bump_interaction();
      zoom_at_screen_point(canvas.width * 0.5, canvas.height * 0.5, 1 / 1.16);
    });
  }

  if (controls.zoom_slider instanceof HTMLInputElement) {
    controls.zoom_slider.min = "0";
    controls.zoom_slider.max = "1";
    controls.zoom_slider.step = "0.01";
    controls.zoom_slider.value = String(zoom_to_slider(view_state.zoom));

    listen(controls.zoom_slider, "input", () => {
      const slider_value = Number(
        controls.zoom_slider.value || zoom_to_slider(view_state.zoom),
      );
      const center_world = screen_to_world(
        canvas.width * 0.5,
        canvas.height * 0.5,
        view_state,
        canvas,
      );

      view_state.zoom = slider_to_zoom(slider_value);
      view_state.center_x = center_world.x;
      view_state.center_y = center_world.y;
      bump_interaction();
      apply_soft_bounds(view_state, canvas, world_bounds, false);
      persist_view();
      render_now();
    });
  }

  if (controls.center_button instanceof HTMLElement) {
    listen(controls.center_button, "click", () => {
      bump_interaction();
      center_active();
    });
  }
};
export { bind_zoom_controls };
