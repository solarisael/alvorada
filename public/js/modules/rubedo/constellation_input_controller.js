import { clamp, screen_to_world } from "../webgl/math.js";
import {
  RUBEDO_CONSTELLATION_INTERACTION,
  RUBEDO_CONSTELLATION_VIEW,
} from "./constellation_config.js";
import { dispatch_map_navigation } from "./constellation_navigation.js";
import { create_keyboard_navigation } from "./input/keyboard.js";
import { create_hover_preview } from "./input/hover.js";
import { create_inertia } from "./input/inertia.js";
import { bind_zoom_controls } from "./input/zoom_controls.js";
import { create_input_lifetime } from "./input/lifetime.js";
import {
  apply_soft_bounds,
  compute_world_bounds,
  constrain_drag_delta,
  constellation_pointer_position,
  find_nearest_clickable_node,
  find_nearest_world_node,
  zoom_to_slider,
} from "./constellation_viewport.js";

const query_timeline_controls = (root_node) => {
  return {
    zoom_in_button: root_node.querySelector('[data-map-action="zoom_in"]'),
    zoom_out_button: root_node.querySelector('[data-map-action="zoom_out"]'),
    zoom_slider: root_node.querySelector('[data-map-action="zoom_slider"]'),
    center_button: root_node.querySelector('[data-map-action="center_active"]'),
    zoom_badge: root_node.querySelector('[data-map-action="zoom_badge"]'),
    keyboard_status: root_node.querySelector("[data-rubedo-keyboard-status]"),
  };
};

const bind_constellation_input_controller = async ({
  root_node,
  canvas,
  payload,
  renderer,
  view_state,
  store,
  storage_key,
  book_data,
  book_slug,
  base_path,
  signal,
}) => {
  if (!root_node.isConnected || signal?.aborted) {
    return null;
  }
  const controls = query_timeline_controls(root_node);

  const active_node_id = `${payload.active_chapter_id}:${payload.active_thread_key}`;
  const world_bounds = compute_world_bounds(payload);
  const payload_map = new Map();
  for (const node_entry of payload.nodes || []) {
    payload_map.set(node_entry.node_id, node_entry);
  }

  let hover_node_id = "";
  let wheel_intent_active = false;
  let hover_intent_timer = 0;
  let inactivity_timer = 0;
  let is_dragging = false;
  let drag_pointer_id = null;
  let drag_started_at = { x: 0, y: 0 };
  let drag_moved = false;

  const reduced_motion_query =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
  const reduced_motion = () => reduced_motion_query?.matches === true;
  let last_pointer = { x: 0, y: 0 };
  let suppress_click_until = 0;
  const pointers = new Map();
  let pinch_state = null;

  let last_interaction_ms = performance.now();
  let resize_observer = null;

  const { set_hover_preview } = create_hover_preview({
    root_node,
    canvas,
    book_data,
    book_slug,
    base_path,
  });
  const inertia = create_inertia({
    view_state,
    canvas,
    world_bounds,
    reduced_motion: () => !lifetime.is_active() || reduced_motion(),
    persist_view: () => persist_view(),
    render_now: () => render_now(),
    mark_interaction: () => {
      last_interaction_ms = performance.now();
    },
  });
  const { stop_inertia, run_inertia } = inertia;
  const lifetime = create_input_lifetime(root_node, signal, () => {
    stop_inertia();
    window.clearTimeout(hover_intent_timer);
    window.clearTimeout(inactivity_timer);
    resize_observer?.disconnect();
    pointers.clear();
    set_hover_preview(null);
  });
  const { listen } = lifetime;

  const persist_view = () => {
    store[storage_key] = {
      center_x: view_state.center_x,
      center_y: view_state.center_y,
      pan_x: view_state.pan_x,
      pan_y: view_state.pan_y,
      zoom: view_state.zoom,
    };
  };

  const render_now = () => {
    if (!lifetime.is_active()) {
      return;
    }
    const now_ms = performance.now();
    const inertia_active = !reduced_motion() && inertia.is_active();
    const interaction_active =
      is_dragging ||
      pinch_state !== null ||
      pointers.size > 1 ||
      inertia_active;
    const allow_pullback =
      !interaction_active &&
      now_ms - last_interaction_ms >=
        RUBEDO_CONSTELLATION_VIEW.edge_idle_return_delay_ms;

    apply_soft_bounds(view_state, canvas, world_bounds, allow_pullback);
    renderer.render(
      active_node_id,
      keyboard.has_focus() ? keyboard.get_node_id() : hover_node_id,
    );

    if (controls.zoom_slider instanceof HTMLInputElement) {
      controls.zoom_slider.value = String(zoom_to_slider(view_state.zoom));
    }

    if (controls.zoom_badge instanceof HTMLElement) {
      controls.zoom_badge.classList.toggle(
        "sol__is_active",
        wheel_intent_active,
      );
    }
  };

  const update_size = () => {
    if (!lifetime.is_active()) {
      return;
    }
    renderer.resize();
    render_now();
  };

  const bump_interaction = () => {
    if (!lifetime.is_active()) {
      return;
    }
    last_interaction_ms = performance.now();
    wheel_intent_active = true;

    if (inactivity_timer) {
      window.clearTimeout(inactivity_timer);
    }

    inactivity_timer = window.setTimeout(() => {
      if (!lifetime.is_active()) {
        return;
      }
      wheel_intent_active = false;

      if (controls.zoom_badge instanceof HTMLElement) {
        controls.zoom_badge.classList.remove("sol__is_active");
      }
    }, RUBEDO_CONSTELLATION_INTERACTION.inactivity_timeout_ms);
  };

  const zoom_at_screen_point = (screen_x, screen_y, scale_multiplier) => {
    const cursor_world = screen_to_world(
      screen_x,
      screen_y,
      view_state,
      canvas,
    );
    const nearest = find_nearest_world_node(
      payload,
      cursor_world.x,
      cursor_world.y,
    );
    const use_attractor = nearest.node && nearest.distance > 2.2;
    const before = use_attractor
      ? {
          x:
            cursor_world.x +
            (nearest.node.x - cursor_world.x) *
              RUBEDO_CONSTELLATION_VIEW.attractor_strength,
          y:
            cursor_world.y +
            (nearest.node.y - cursor_world.y) *
              RUBEDO_CONSTELLATION_VIEW.attractor_strength,
        }
      : cursor_world;

    view_state.zoom = clamp(
      view_state.zoom * scale_multiplier,
      RUBEDO_CONSTELLATION_VIEW.min_zoom,
      RUBEDO_CONSTELLATION_VIEW.max_zoom,
    );

    const center_x = canvas.width * 0.5;
    const center_y = canvas.height * 0.5;
    view_state.center_x =
      before.x - (screen_x - center_x - view_state.pan_x) / view_state.zoom;
    view_state.center_y =
      before.y - (screen_y - center_y - view_state.pan_y) / view_state.zoom;

    apply_soft_bounds(view_state, canvas, world_bounds, false);
    persist_view();
    render_now();
  };

  const center_active = () => {
    const active_node = payload_map.get(active_node_id);

    if (!active_node) {
      return;
    }
    keyboard.set_keyboard_node(active_node.node_id);
    view_state.zoom = 1;
    view_state.pan_x = 0;
    view_state.pan_y = 0;
    view_state.center_x = active_node.x;
    view_state.center_y = active_node.y;

    persist_view();
    render_now();
  };

  const keyboard = create_keyboard_navigation({
    payload,
    listen,
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
  });
  try {
    await renderer.load_textures(lifetime.signal);
  } catch (error) {
    lifetime.dispose();
    throw error;
  }
  if (!lifetime.is_active()) {
    return null;
  }
  update_size();

  resize_observer = new ResizeObserver(update_size);
  resize_observer.observe(canvas.parentElement ?? root_node);

  canvas.style.touchAction = "none";
  root_node.dataset.canvasBound = "true";

  keyboard.bind_focus();

  listen(canvas, "pointerenter", () => {
    if (hover_intent_timer) {
      window.clearTimeout(hover_intent_timer);
    }

    hover_intent_timer = window.setTimeout(() => {
      bump_interaction();
    }, RUBEDO_CONSTELLATION_INTERACTION.hover_intent_ms);
  });

  listen(canvas, "pointerleave", () => {
    if (is_dragging) {
      if (drag_moved) {
        suppress_click_until = performance.now() + 180;
        run_inertia();
      }

      is_dragging = false;
      drag_pointer_id = null;
      drag_moved = false;
      pointers.clear();
      pinch_state = null;
      canvas.style.cursor = "grab";
    }

    if (hover_intent_timer) {
      window.clearTimeout(hover_intent_timer);
      hover_intent_timer = 0;
    }

    hover_node_id = "";
    set_hover_preview(null);
    wheel_intent_active = false;

    if (controls.zoom_badge instanceof HTMLElement) {
      controls.zoom_badge.classList.remove("sol__is_active");
    }

    render_now();
  });

  listen(
    canvas,
    "wheel",
    (event) => {
      if (!wheel_intent_active) {
        return;
      }

      event.preventDefault();
      bump_interaction();

      const pointer = constellation_pointer_position(canvas, event);
      const scale = Math.exp(-event.deltaY * 0.0018);
      zoom_at_screen_point(pointer.x, pointer.y, scale);
    },
    { passive: false },
  );

  listen(canvas, "mousedown", (event) => {
    if (event.button === 1) {
      event.preventDefault();
    }
  });

  listen(canvas, "auxclick", (event) => {
    if (event.button === 1) {
      event.preventDefault();
    }
  });

  listen(canvas, "pointerdown", (event) => {
    if (event.button !== 0 && event.button !== 1) {
      return;
    }

    stop_inertia();
    canvas.focus();

    const pointer = constellation_pointer_position(canvas, event);
    pointers.set(event.pointerId, pointer);

    if (pointers.size === 2) {
      const values = [...pointers.values()];
      const dx = values[0].x - values[1].x;
      const dy = values[0].y - values[1].y;
      const midpoint_x = (values[0].x + values[1].x) * 0.5;
      const midpoint_y = (values[0].y + values[1].y) * 0.5;

      pinch_state = {
        start_distance: Math.hypot(dx, dy),
        start_zoom: view_state.zoom,
        midpoint_x,
        midpoint_y,
        midpoint_world: screen_to_world(
          midpoint_x,
          midpoint_y,
          view_state,
          canvas,
        ),
      };

      return;
    }

    drag_pointer_id = event.pointerId;
    is_dragging = true;
    drag_moved = false;
    drag_started_at = { ...pointer };
    last_pointer = { ...pointer };
    canvas.style.cursor = "grabbing";
    bump_interaction();
  });

  const move_drag = (pointer, event) => {
    const raw_dx = pointer.x - last_pointer.x;
    const raw_dy = pointer.y - last_pointer.y;
    const { dx, dy } = constrain_drag_delta(
      view_state,
      canvas,
      world_bounds,
      raw_dx,
      raw_dy,
    );
    inertia.set_velocity(dx, dy);
    if (
      !drag_moved &&
      Math.hypot(pointer.x - drag_started_at.x, pointer.y - drag_started_at.y) >
        RUBEDO_CONSTELLATION_INTERACTION.drag_threshold_px
    ) {
      drag_moved = true;
    }
    view_state.pan_x += dx;
    view_state.pan_y += dy;
    last_pointer = pointer;
    const hovered_node = find_nearest_clickable_node(
      payload,
      canvas,
      view_state,
      pointer.x,
      pointer.y,
    );
    if (hovered_node) {
      keyboard.set_keyboard_node(hovered_node.node_id);
    }
    hover_node_id = drag_moved ? "" : hovered_node?.node_id || "";
    set_hover_preview(drag_moved ? null : hovered_node, event);
    bump_interaction();
    persist_view();
    render_now();
  };

  listen(canvas, "pointermove", (event) => {
    const pointer = constellation_pointer_position(canvas, event);
    pointers.set(event.pointerId, pointer);

    if (pointers.size === 2 && pinch_state) {
      const values = [...pointers.values()];
      const dx = values[0].x - values[1].x;
      const dy = values[0].y - values[1].y;
      const distance = Math.hypot(dx, dy);
      const midpoint_x = (values[0].x + values[1].x) * 0.5;
      const midpoint_y = (values[0].y + values[1].y) * 0.5;
      const ratio = distance / Math.max(1, pinch_state.start_distance);

      view_state.zoom = clamp(
        pinch_state.start_zoom * ratio,
        RUBEDO_CONSTELLATION_VIEW.min_zoom,
        RUBEDO_CONSTELLATION_VIEW.max_zoom,
      );

      const center_x = canvas.width * 0.5;
      const center_y = canvas.height * 0.5;
      view_state.center_x =
        pinch_state.midpoint_world.x -
        (midpoint_x - center_x - view_state.pan_x) / view_state.zoom;
      view_state.center_y =
        pinch_state.midpoint_world.y -
        (midpoint_y - center_y - view_state.pan_y) / view_state.zoom;

      bump_interaction();
      persist_view();
      render_now();

      return;
    }

    if (is_dragging && drag_pointer_id === event.pointerId) {
      move_drag(pointer, event);

      return;
    }

    const hovered_node = find_nearest_clickable_node(
      payload,
      canvas,
      view_state,
      pointer.x,
      pointer.y,
    );
    if (hovered_node) {
      keyboard.set_keyboard_node(hovered_node.node_id);
    }

    hover_node_id = hovered_node?.node_id || "";
    set_hover_preview(hovered_node, event);
    canvas.style.cursor = hovered_node ? "pointer" : "grab";
    render_now();
  });

  const release_pointer = (event) => {
    pointers.delete(event.pointerId);

    if (pointers.size < 2) {
      pinch_state = null;
    }

    if (drag_pointer_id === event.pointerId) {
      if (drag_moved) {
        suppress_click_until = performance.now() + 180;
        run_inertia();
      }

      is_dragging = false;
      drag_pointer_id = null;
      drag_moved = false;
      canvas.style.cursor = "grab";
    }
  };

  listen(canvas, "pointerup", release_pointer);
  listen(canvas, "pointercancel", release_pointer);

  listen(canvas, "click", (event) => {
    if (performance.now() < suppress_click_until) {
      return;
    }

    const pointer = constellation_pointer_position(canvas, event);
    const nearest = find_nearest_clickable_node(
      payload,
      canvas,
      view_state,
      pointer.x,
      pointer.y,
    );

    if (!nearest) {
      return;
    }

    dispatch_map_navigation(nearest);
  });

  bind_zoom_controls({
    controls,
    listen,
    canvas,
    view_state,
    world_bounds,
    bump_interaction,
    zoom_at_screen_point,
    center_active,
    persist_view,
    render_now,
  });
  keyboard.bind_keydown();

  render_now();
  return lifetime.dispose;
};

export { bind_constellation_input_controller, query_timeline_controls };
