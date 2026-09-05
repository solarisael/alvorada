import { dispatch_map_navigation } from "../constellation_navigation.js";
import { RUBEDO_CONSTELLATION_INTERACTION } from "../constellation_config.js";

const activation_keys = new Set(["Enter", " ", "Spacebar"]);
const zoom_in_keys = new Set(["+", "="]);
const zoom_out_keys = new Set(["-", "_"]);

const arrow_directions = new Map([
  ["ArrowLeft", [-1, 0]],
  ["ArrowRight", [1, 0]],
  ["ArrowUp", [0, -1]],
  ["ArrowDown", [0, 1]],
]);

const create_keyboard_navigation = ({
  payload,
  payload_map,
  active_node_id,
  controls,
  canvas,
  view_state,
  bump_interaction,
  zoom_at_screen_point,
  center_active,
  persist_view,
  render_now,
  listen,
}) => {
  const clickable_nodes = (payload.nodes || []).filter(
    (node_entry) => node_entry.is_clickable,
  );
  let keyboard_node_id =
    (payload_map.get(active_node_id)?.is_clickable
      ? active_node_id
      : clickable_nodes[0]?.node_id) ?? "";
  let keyboard_focus_active = false;

  const set_keyboard_node = (node_id) => {
    const selected_node = payload_map.get(node_id);
    if (!selected_node?.is_clickable) {
      return false;
    }

    keyboard_node_id = selected_node.node_id;
    if (controls.keyboard_status instanceof HTMLElement) {
      const chapter_label = selected_node.label ?? selected_node.chapter_id;
      controls.keyboard_status.textContent = `Selected chapter ${chapter_label}, ${selected_node.thread_key} thread.`;
    }

    return true;
  };

  const select_keyboard_node_in_direction = (direction_x, direction_y) => {
    const current_node =
      payload_map.get(keyboard_node_id) ??
      payload_map.get(active_node_id) ??
      clickable_nodes[0];
    if (!current_node) {
      return false;
    }

    let nearest_node = null;
    let nearest_score = Number.POSITIVE_INFINITY;

    for (const candidate_node of clickable_nodes) {
      if (candidate_node.node_id === current_node.node_id) {
        continue;
      }

      const delta_x = candidate_node.x - current_node.x;
      const delta_y = candidate_node.y - current_node.y;
      const forward_distance = delta_x * direction_x + delta_y * direction_y;
      if (forward_distance <= 0) {
        continue;
      }

      const cross_distance = Math.abs(
        delta_x * direction_y - delta_y * direction_x,
      );
      const score = forward_distance + cross_distance * 4;
      if (score < nearest_score) {
        nearest_node = candidate_node;
        nearest_score = score;
      }
    }

    return nearest_node ? set_keyboard_node(nearest_node.node_id) : false;
  };

  set_keyboard_node(keyboard_node_id);
  const activate_keyboard_node = () => {
    const selected_node = payload_map.get(keyboard_node_id);
    if (selected_node?.is_clickable) {
      dispatch_map_navigation(selected_node);
    }
  };

  const bind_keydown = () => {
    listen(canvas, "keydown", (event) => {
      if (activation_keys.has(event.key)) {
        event.preventDefault();
        bump_interaction();
        activate_keyboard_node();

        return;
      }

      if (zoom_in_keys.has(event.key)) {
        event.preventDefault();
        bump_interaction();
        zoom_at_screen_point(canvas.width * 0.5, canvas.height * 0.5, 1.16);

        return;
      }

      if (zoom_out_keys.has(event.key)) {
        event.preventDefault();
        bump_interaction();
        zoom_at_screen_point(canvas.width * 0.5, canvas.height * 0.5, 1 / 1.16);

        return;
      }

      if (event.key === "0" || event.key.toLowerCase() === "c") {
        event.preventDefault();
        bump_interaction();
        center_active();

        return;
      }

      const direction = arrow_directions.get(event.key);
      if (!direction) {
        return;
      }
      event.preventDefault();
      bump_interaction();
      view_state.pan_x -=
        direction[0] * RUBEDO_CONSTELLATION_INTERACTION.arrow_pan_nudge;
      view_state.pan_y -=
        direction[1] * RUBEDO_CONSTELLATION_INTERACTION.arrow_pan_nudge;
      select_keyboard_node_in_direction(direction[0], direction[1]);

      persist_view();
      render_now();
    });
  };
  return {
    bind_keydown,
    set_keyboard_node,
    get_node_id: () => keyboard_node_id,
    has_focus: () => keyboard_focus_active,
    bind_focus: () => {
      listen(canvas, "focus", () => {
        keyboard_focus_active = true;
        if (!keyboard_node_id && clickable_nodes.length > 0) {
          set_keyboard_node(clickable_nodes[0].node_id);
        }
        render_now();
      });

      listen(canvas, "blur", () => {
        keyboard_focus_active = false;
        render_now();
      });
    },
  };
};
export { create_keyboard_navigation };
