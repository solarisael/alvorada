import { clamp, screen_to_world } from "../webgl/math.js";
import {
  RUBEDO_CONSTELLATION_INTERACTION,
  RUBEDO_CONSTELLATION_VIEW,
  RUBEDO_CONSTELLATION_WORLD_BOUNDS,
} from "./constellation_config.js";
import { dispatch_map_navigation } from "./constellation_navigation.js";
import { render_hover_preview_from_cache } from "./constellation_preview.js";
import {
  apply_soft_bounds,
  compute_overscroll,
  compute_world_bounds,
  constrain_drag_delta,
  constellation_pointer_position,
  find_nearest_clickable_node,
  find_nearest_world_node,
  slider_to_zoom,
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
}) => {
  const controls = query_timeline_controls(root_node);
  const get_hover_preview_node = () => {
    return root_node.querySelector("#sol_rubedo_timeline_hover_preview");
  };
  const active_node_id = `${payload.active_chapter_id}:${payload.active_thread_key}`;
  const world_bounds = compute_world_bounds(payload);
  const payload_map = new Map();

  for (const node_entry of payload.nodes || []) {
    payload_map.set(node_entry.node_id, node_entry);
  }

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
      controls.keyboard_status.textContent =
        `Selected chapter ${chapter_label}, ${selected_node.thread_key} thread.`;
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
      const forward_distance =
        delta_x * direction_x + delta_y * direction_y;
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
  let inertia_frame_id = 0;
  let velocity_x = 0;
  let velocity_y = 0;
  let last_hover_preview_node_id = "";
  let last_interaction_ms = performance.now();

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
    const now_ms = performance.now();
    const inertia_active =
      !reduced_motion() &&
      (inertia_frame_id !== 0 ||
        Math.abs(velocity_x) >= RUBEDO_CONSTELLATION_INTERACTION.inertia_stop_px ||
        Math.abs(velocity_y) >= RUBEDO_CONSTELLATION_INTERACTION.inertia_stop_px);
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
      keyboard_focus_active ? keyboard_node_id : hover_node_id,
    );

    if (controls.zoom_slider instanceof HTMLInputElement) {
      controls.zoom_slider.value = String(zoom_to_slider(view_state.zoom));
    }

    if (controls.zoom_badge instanceof HTMLElement) {
      controls.zoom_badge.classList.toggle("sol__is_active", wheel_intent_active);
    }
  };

  const set_keyboard_node_from_screen_point = (screen_x, screen_y) => {
    const nearest = find_nearest_clickable_node(
      payload,
      canvas,
      view_state,
      screen_x,
      screen_y,
    );
    if (nearest) {
      set_keyboard_node(nearest.node_id);
    }
  };


  const position_hover_preview = (event) => {
    const hover_preview_node = get_hover_preview_node();

    if (!(hover_preview_node instanceof HTMLElement)) {
      return;
    }

    const bounds = canvas.getBoundingClientRect();
    const preview_width = hover_preview_node.offsetWidth || 280;
    const preview_height = hover_preview_node.offsetHeight || 180;
    const raw_left =
      event.clientX - bounds.left +
      RUBEDO_CONSTELLATION_INTERACTION.hover_preview_offset_x;
    const raw_top =
      event.clientY - bounds.top +
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

  const update_size = () => {
    renderer.resize();
    render_now();
  };

  const bump_interaction = () => {
    last_interaction_ms = performance.now();
    wheel_intent_active = true;

    if (inactivity_timer) {
      window.clearTimeout(inactivity_timer);
    }

    inactivity_timer = window.setTimeout(() => {
      wheel_intent_active = false;

      if (controls.zoom_badge instanceof HTMLElement) {
        controls.zoom_badge.classList.remove("sol__is_active");
      }
    }, RUBEDO_CONSTELLATION_INTERACTION.inactivity_timeout_ms);
  };

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

      last_interaction_ms = performance.now();
      view_state.pan_x += velocity_x;
      view_state.pan_y += velocity_y;

      const overscroll = compute_overscroll(view_state, canvas, world_bounds);
      const outside_soft_zone =
        overscroll.left > RUBEDO_CONSTELLATION_WORLD_BOUNDS.edge_soft_overscroll_x ||
        overscroll.right > RUBEDO_CONSTELLATION_WORLD_BOUNDS.edge_soft_overscroll_x ||
        overscroll.top > RUBEDO_CONSTELLATION_WORLD_BOUNDS.edge_soft_overscroll_y ||
        overscroll.bottom > RUBEDO_CONSTELLATION_WORLD_BOUNDS.edge_soft_overscroll_y;

      velocity_x *= RUBEDO_CONSTELLATION_INTERACTION.inertia_damping;
      velocity_y *= RUBEDO_CONSTELLATION_INTERACTION.inertia_damping;

      if (outside_soft_zone) {
        velocity_x *= RUBEDO_CONSTELLATION_INTERACTION.outside_velocity_damp_mult;
        velocity_y *= RUBEDO_CONSTELLATION_INTERACTION.outside_velocity_damp_mult;
      }

      persist_view();
      render_now();

      if (
        Math.abs(velocity_x) < RUBEDO_CONSTELLATION_INTERACTION.inertia_stop_px &&
        Math.abs(velocity_y) < RUBEDO_CONSTELLATION_INTERACTION.inertia_stop_px
      ) {
        inertia_frame_id = 0;

        return;
      }

      inertia_frame_id = window.requestAnimationFrame(step);
    };

    inertia_frame_id = window.requestAnimationFrame(step);
  };

  const zoom_at_screen_point = (screen_x, screen_y, scale_multiplier) => {
    const cursor_world = screen_to_world(screen_x, screen_y, view_state, canvas);
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

    set_keyboard_node(active_node.node_id);
    view_state.zoom = 1;
    view_state.pan_x = 0;
    view_state.pan_y = 0;
    view_state.center_x = active_node.x;
    view_state.center_y = active_node.y;

    persist_view();
    render_now();
  };

  await renderer.load_textures();
  update_size();

  const resize_observer = new ResizeObserver(update_size);
  resize_observer.observe(canvas.parentElement ?? root_node);

  canvas.style.touchAction = "none";
  root_node.dataset.canvasBound = "true";

  canvas.addEventListener("focus", () => {
    keyboard_focus_active = true;
    if (!keyboard_node_id && clickable_nodes.length > 0) {
      set_keyboard_node(clickable_nodes[0].node_id);
    }
    render_now();
  });

  canvas.addEventListener("blur", () => {
    keyboard_focus_active = false;
    render_now();
  });

  canvas.addEventListener("pointerenter", () => {
    if (hover_intent_timer) {
      window.clearTimeout(hover_intent_timer);
    }

    hover_intent_timer = window.setTimeout(() => {
      bump_interaction();
    }, RUBEDO_CONSTELLATION_INTERACTION.hover_intent_ms);
  });

  canvas.addEventListener("pointerleave", () => {
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

  canvas.addEventListener(
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

  canvas.addEventListener("mousedown", (event) => {
    if (event.button === 1) {
      event.preventDefault();
    }
  });

  canvas.addEventListener("auxclick", (event) => {
    if (event.button === 1) {
      event.preventDefault();
    }
  });

  canvas.addEventListener("pointerdown", (event) => {
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

  canvas.addEventListener("pointermove", (event) => {
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
      const raw_dx = pointer.x - last_pointer.x;
      const raw_dy = pointer.y - last_pointer.y;
      const constrained_delta = constrain_drag_delta(
        view_state,
        canvas,
        world_bounds,
        raw_dx,
        raw_dy,
      );
      const dx = constrained_delta.dx;
      const dy = constrained_delta.dy;

      velocity_x = dx;
      velocity_y = dy;

      if (
        !drag_moved &&
        Math.hypot(
          pointer.x - drag_started_at.x,
          pointer.y - drag_started_at.y,
        ) > RUBEDO_CONSTELLATION_INTERACTION.drag_threshold_px
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
        set_keyboard_node(hovered_node.node_id);
      }
      hover_node_id = drag_moved ? "" : hovered_node?.node_id || "";
      set_hover_preview(drag_moved ? null : hovered_node, event);

      bump_interaction();
      persist_view();
      render_now();

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
      set_keyboard_node(hovered_node.node_id);
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

  canvas.addEventListener("pointerup", release_pointer);
  canvas.addEventListener("pointercancel", release_pointer);

  canvas.addEventListener("click", (event) => {
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

  if (controls.zoom_in_button instanceof HTMLElement) {
    controls.zoom_in_button.addEventListener("click", () => {
      bump_interaction();
      zoom_at_screen_point(canvas.width * 0.5, canvas.height * 0.5, 1.16);
    });
  }

  if (controls.zoom_out_button instanceof HTMLElement) {
    controls.zoom_out_button.addEventListener("click", () => {
      bump_interaction();
      zoom_at_screen_point(canvas.width * 0.5, canvas.height * 0.5, 1 / 1.16);
    });
  }

  if (controls.zoom_slider instanceof HTMLInputElement) {
    controls.zoom_slider.min = "0";
    controls.zoom_slider.max = "1";
    controls.zoom_slider.step = "0.01";
    controls.zoom_slider.value = String(zoom_to_slider(view_state.zoom));

    controls.zoom_slider.addEventListener("input", () => {
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
    controls.center_button.addEventListener("click", () => {
      bump_interaction();
      center_active();
    });
  }


  const activate_keyboard_node = () => {
    const selected_node = payload_map.get(keyboard_node_id);
    if (selected_node?.is_clickable) {
      dispatch_map_navigation(selected_node);
    }
  };

  canvas.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      bump_interaction();
      activate_keyboard_node();

      return;
    }

    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      bump_interaction();
      zoom_at_screen_point(canvas.width * 0.5, canvas.height * 0.5, 1.16);

      return;
    }

    if (event.key === "-" || event.key === "_") {
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

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      bump_interaction();
      view_state.pan_x += RUBEDO_CONSTELLATION_INTERACTION.arrow_pan_nudge;
      select_keyboard_node_in_direction(-1, 0);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      bump_interaction();
      view_state.pan_x -= RUBEDO_CONSTELLATION_INTERACTION.arrow_pan_nudge;
      select_keyboard_node_in_direction(1, 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      bump_interaction();
      view_state.pan_y += RUBEDO_CONSTELLATION_INTERACTION.arrow_pan_nudge;
      select_keyboard_node_in_direction(0, -1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      bump_interaction();
      view_state.pan_y -= RUBEDO_CONSTELLATION_INTERACTION.arrow_pan_nudge;
      select_keyboard_node_in_direction(0, 1);
    } else {
      return;
    }

    persist_view();
    render_now();
  });

  render_now();
};

export { bind_constellation_input_controller, query_timeline_controls };
