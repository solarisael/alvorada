import { canvas_pointer_position } from "../webgl/canvas.js";
import { clamp, screen_to_world, world_to_screen } from "../webgl/math.js";
import {
  RUBEDO_CONSTELLATION_VIEW,
  RUBEDO_CONSTELLATION_WORLD_BOUNDS,
} from "./constellation_config.js";

const create_storage_key = (root_node) => {
  return `${window.location.pathname}::${root_node.id || "rubedo_constellation_map"}`;
};

const get_store = () => {
  const window_any = /** @type {any} */ (globalThis);

  if (!window_any.__rubedo_constellation_view_state) {
    window_any.__rubedo_constellation_view_state = {};
  }

  return window_any.__rubedo_constellation_view_state;
};

const create_view_state = (payload) => {
  const active_node = (payload.nodes || []).find((node_entry) => {
    return (
      node_entry.node_id ===
      `${payload.active_chapter_id}:${payload.active_thread_key}`
    );
  });

  return {
    center_x: active_node?.x ?? payload.viewbox_width / 2,
    center_y: active_node?.y ?? payload.viewbox_height / 2,
    pan_x: 0,
    pan_y: 0,
    zoom: 1,
  };
};

const slider_to_zoom = (slider_value) => {
  const normalized = clamp(Number(slider_value), 0, 1);

  return (
    RUBEDO_CONSTELLATION_VIEW.min_zoom *
    (RUBEDO_CONSTELLATION_VIEW.max_zoom /
      RUBEDO_CONSTELLATION_VIEW.min_zoom) **
      normalized
  );
};

const zoom_to_slider = (zoom_value) => {
  const normalized_zoom = clamp(
    zoom_value,
    RUBEDO_CONSTELLATION_VIEW.min_zoom,
    RUBEDO_CONSTELLATION_VIEW.max_zoom,
  );

  return (
    Math.log(normalized_zoom / RUBEDO_CONSTELLATION_VIEW.min_zoom) /
    Math.log(
      RUBEDO_CONSTELLATION_VIEW.max_zoom /
        RUBEDO_CONSTELLATION_VIEW.min_zoom,
    )
  );
};

const compute_world_bounds = (payload) => {
  const nodes = (payload.nodes || []).filter((node_entry) => {
    return node_entry.is_clickable;
  });

  if (!nodes.length) {
    return {
      min_x: 0,
      max_x: payload.viewbox_width,
      min_y: 0,
      max_y: payload.viewbox_height,
    };
  }

  let min_x = Number.POSITIVE_INFINITY;
  let max_x = Number.NEGATIVE_INFINITY;
  let min_y = Number.POSITIVE_INFINITY;
  let max_y = Number.NEGATIVE_INFINITY;

  for (const node_entry of nodes) {
    min_x = Math.min(min_x, node_entry.x);
    max_x = Math.max(max_x, node_entry.x);
    min_y = Math.min(min_y, node_entry.y);
    max_y = Math.max(max_y, node_entry.y);
  }

  return { min_x, max_x, min_y, max_y };
};

const compute_bounds_limits = (world_bounds, zoom, canvas) => {
  const half_world_width = canvas.width / (2 * zoom);
  const half_world_height = canvas.height / (2 * zoom);
  const world_span_x = world_bounds.max_x - world_bounds.min_x;
  const world_span_y = world_bounds.max_y - world_bounds.min_y;
  const padding_x = clamp(
    world_span_x * RUBEDO_CONSTELLATION_WORLD_BOUNDS.padding_ratio_x,
    RUBEDO_CONSTELLATION_WORLD_BOUNDS.padding_min_x,
    RUBEDO_CONSTELLATION_WORLD_BOUNDS.padding_max_x,
  );
  const padding_y = clamp(
    world_span_y * RUBEDO_CONSTELLATION_WORLD_BOUNDS.padding_ratio_y,
    RUBEDO_CONSTELLATION_WORLD_BOUNDS.padding_min_y,
    RUBEDO_CONSTELLATION_WORLD_BOUNDS.padding_max_y,
  );

  return {
    min_x: world_bounds.min_x - padding_x + half_world_width,
    max_x: world_bounds.max_x + padding_x - half_world_width,
    min_y: world_bounds.min_y - padding_y + half_world_height,
    max_y: world_bounds.max_y + padding_y - half_world_height,
  };
};

const find_nearest_world_node = (payload, world_x, world_y) => {
  const nodes = (payload.nodes || []).filter((node_entry) => {
    return node_entry.is_clickable;
  });

  let nearest = null;
  let nearest_distance = Number.POSITIVE_INFINITY;

  for (const node_entry of nodes) {
    const distance = Math.hypot(world_x - node_entry.x, world_y - node_entry.y);

    if (distance < nearest_distance) {
      nearest = node_entry;
      nearest_distance = distance;
    }
  }

  return {
    node: nearest,
    distance: nearest_distance,
  };
};

const apply_soft_bounds = (
  view_state,
  canvas,
  world_bounds,
  allow_pullback,
) => {
  const effective_center_x =
    view_state.center_x - view_state.pan_x / view_state.zoom;
  const effective_center_y =
    view_state.center_y - view_state.pan_y / view_state.zoom;
  const limits = compute_bounds_limits(world_bounds, view_state.zoom, canvas);

  if (limits.min_x > limits.max_x) {
    const midpoint_x = (limits.min_x + limits.max_x) * 0.5;

    if (allow_pullback) {
      view_state.center_x +=
        (midpoint_x - effective_center_x) * RUBEDO_CONSTELLATION_VIEW.edge_pull_strength;
    }
  } else if (allow_pullback && effective_center_x < limits.min_x) {
    view_state.center_x += Math.min(
      RUBEDO_CONSTELLATION_VIEW.edge_pull_max_step_x,
      (limits.min_x - effective_center_x) *
        RUBEDO_CONSTELLATION_VIEW.edge_pull_strength,
    );
  } else if (allow_pullback && effective_center_x > limits.max_x) {
    view_state.center_x -= Math.min(
      RUBEDO_CONSTELLATION_VIEW.edge_pull_max_step_x,
      (effective_center_x - limits.max_x) *
        RUBEDO_CONSTELLATION_VIEW.edge_pull_strength,
    );
  }

  if (limits.min_y > limits.max_y) {
    const midpoint_y = (limits.min_y + limits.max_y) * 0.5;

    if (allow_pullback) {
      view_state.center_y +=
        (midpoint_y - effective_center_y) * RUBEDO_CONSTELLATION_VIEW.edge_pull_strength;
    }
  } else if (allow_pullback && effective_center_y < limits.min_y) {
    view_state.center_y += Math.min(
      RUBEDO_CONSTELLATION_VIEW.edge_pull_max_step_y,
      (limits.min_y - effective_center_y) *
        RUBEDO_CONSTELLATION_VIEW.edge_pull_strength,
    );
  } else if (allow_pullback && effective_center_y > limits.max_y) {
    view_state.center_y -= Math.min(
      RUBEDO_CONSTELLATION_VIEW.edge_pull_max_step_y,
      (effective_center_y - limits.max_y) *
        RUBEDO_CONSTELLATION_VIEW.edge_pull_strength,
    );
  }
};

const compute_axis_resistance = (overscroll_world, axis) => {
  if (overscroll_world <= RUBEDO_CONSTELLATION_VIEW.edge_pull_deadzone) {
    return 1;
  }

  const hard_limit =
    axis === "x"
      ? RUBEDO_CONSTELLATION_WORLD_BOUNDS.edge_hard_overscroll_x
      : RUBEDO_CONSTELLATION_WORLD_BOUNDS.edge_hard_overscroll_y;
  const normalized = clamp(overscroll_world / hard_limit, 0, 1);

  return 1 / (1 + RUBEDO_CONSTELLATION_VIEW.edge_resist_k * normalized * 16);
};

const compute_overscroll = (view_state, canvas, world_bounds) => {
  const effective_center_x =
    view_state.center_x - view_state.pan_x / view_state.zoom;
  const effective_center_y =
    view_state.center_y - view_state.pan_y / view_state.zoom;
  const limits = compute_bounds_limits(world_bounds, view_state.zoom, canvas);

  return {
    left: Math.max(0, limits.min_x - effective_center_x),
    right: Math.max(0, effective_center_x - limits.max_x),
    top: Math.max(0, limits.min_y - effective_center_y),
    bottom: Math.max(0, effective_center_y - limits.max_y),
  };
};

const constrain_drag_delta = (view_state, canvas, world_bounds, dx, dy) => {
  const overscroll = compute_overscroll(view_state, canvas, world_bounds);
  const overscroll_x = Math.max(overscroll.left, overscroll.right);
  const overscroll_y = Math.max(overscroll.top, overscroll.bottom);
  const resistance_x = compute_axis_resistance(overscroll_x, "x");
  const resistance_y = compute_axis_resistance(overscroll_y, "y");

  return {
    dx: dx * resistance_x,
    dy: dy * resistance_y,
  };
};

const find_nearest_clickable_node = (
  payload,
  canvas,
  view_state,
  pointer_x,
  pointer_y,
) => {
  const clickable_nodes = (payload.nodes || []).filter((node_entry) => {
    return node_entry.is_clickable;
  });

  let nearest = null;
  let nearest_distance = Number.POSITIVE_INFINITY;

  for (const node of clickable_nodes) {
    const p = world_to_screen(node.x, node.y, view_state, canvas);
    const radius = (node.halo_radius + 0.9) * view_state.zoom;
    const distance_sq = (pointer_x - p.x) ** 2 + (pointer_y - p.y) ** 2;

    if (distance_sq <= radius ** 2 && distance_sq < nearest_distance) {
      nearest = node;
      nearest_distance = distance_sq;
    }
  }

  return nearest;
};

const constellation_pointer_position = (canvas, event) => {
  return canvas_pointer_position(
    canvas,
    event,
    RUBEDO_CONSTELLATION_VIEW.max_dpr,
  );
};

export {
  apply_soft_bounds,
  compute_bounds_limits,
  compute_overscroll,
  compute_world_bounds,
  constrain_drag_delta,
  constellation_pointer_position,
  create_storage_key,
  create_view_state,
  find_nearest_clickable_node,
  find_nearest_world_node,
  get_store,
  screen_to_world,
  slider_to_zoom,
  world_to_screen,
  zoom_to_slider,
};
