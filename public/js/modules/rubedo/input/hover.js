import { clamp } from "../../webgl/math.js";
import { RUBEDO_CONSTELLATION_INTERACTION } from "../constellation_config.js";
import { render_hover_preview_from_cache } from "../constellation_preview.js";

const create_hover_preview = ({
  root_node,
  canvas,
  book_data,
  book_slug,
  base_path,
}) => {
  const get_hover_preview_node = () => {
    return root_node.querySelector("#sol_rubedo_timeline_hover_preview");
  };
  let last_hover_preview_node_id = "";
  const position_hover_preview = (event) => {
    const hover_preview_node = get_hover_preview_node();

    if (!(hover_preview_node instanceof HTMLElement)) {
      return;
    }

    const bounds = canvas.getBoundingClientRect();
    const preview_width = hover_preview_node.offsetWidth || 280;
    const preview_height = hover_preview_node.offsetHeight || 180;
    const raw_left =
      event.clientX -
      bounds.left +
      RUBEDO_CONSTELLATION_INTERACTION.hover_preview_offset_x;
    const raw_top =
      event.clientY -
      bounds.top +
      RUBEDO_CONSTELLATION_INTERACTION.hover_preview_offset_y;
    const max_left = Math.max(
      RUBEDO_CONSTELLATION_INTERACTION.hover_preview_margin,
      bounds.width -
        preview_width -
        RUBEDO_CONSTELLATION_INTERACTION.hover_preview_margin,
    );
    const max_top = Math.max(
      RUBEDO_CONSTELLATION_INTERACTION.hover_preview_margin,
      bounds.height -
        preview_height -
        RUBEDO_CONSTELLATION_INTERACTION.hover_preview_margin,
    );
    const clamped_left = clamp(
      raw_left,
      RUBEDO_CONSTELLATION_INTERACTION.hover_preview_margin,
      max_left,
    );
    const clamped_top = clamp(
      raw_top,
      RUBEDO_CONSTELLATION_INTERACTION.hover_preview_margin,
      max_top,
    );

    hover_preview_node.style.left = `${clamped_left}px`;
    hover_preview_node.style.top = `${clamped_top}px`;
  };

  const set_hover_preview = (hovered_node, pointer_event = null) => {
    const hover_preview_node = get_hover_preview_node();

    if (!(hover_preview_node instanceof HTMLElement)) {
      return;
    }

    if (!hovered_node?.is_clickable) {
      hover_preview_node.classList.remove("sol__is_visible");
      last_hover_preview_node_id = "";

      return;
    }

    hover_preview_node.classList.add("sol__is_visible");

    if (pointer_event) {
      position_hover_preview(pointer_event);
    }

    if (last_hover_preview_node_id === hovered_node.node_id) {
      return;
    }

    last_hover_preview_node_id = hovered_node.node_id;
    render_hover_preview_from_cache({
      node_entry: hovered_node,
      book_data,
      book_slug,
      base_path,
      preview_node: hover_preview_node,
    });
  };
  return { set_hover_preview };
};
export { create_hover_preview };
