import {
  load_three_webgpu_modules,
  initialize_renderer,
  create_owned_effect,
  dispose_renderer,
  dispose_effect,
} from "./gpu/renderer.js";
import {
  observe_effect_visibility,
  observe_effect_size,
  disconnect_effect_observers,
} from "./gpu/visibility.js";
import {
  minimum_frame_interval,
  create_frame_state,
  advance_frame_clock,
  sync_effect_size,
} from "./gpu/frame_state.js";

export const create_gpu_effect_runtime = async ({
  owner,
  canvas,
  create_effect,
  is_owner_alive = () => true,
  on_first_frame = () => {},
  on_error = () => {},
  maximum_frame_rate = 60,
  dpr_cap = 2,
}) => {
  const modules = await load_three_webgpu_modules();
  if (!is_owner_alive()) return null;

  const initialized_renderer = await initialize_renderer(
    modules.three,
    canvas,
    is_owner_alive,
  );
  if (!initialized_renderer || !is_owner_alive()) return null;

  const { renderer, backend } = initialized_renderer;
  let effect = await create_owned_effect(create_effect, modules, renderer);

  if (!is_owner_alive()) {
    effect?.dispose?.();
    dispose_renderer(renderer);
    return null;
  }

  const minimum_frame_ms = minimum_frame_interval(maximum_frame_rate);
  const state = create_frame_state(owner);
  const listener_cleanups = [];

  const alive = () =>
    !state.disposed && is_owner_alive() && owner?.isConnected !== false;
  const is_active = () =>
    alive() && state.document_visible && state.owner_visible;

  const cancel_frame = () => {
    if (state.frame === null) return;
    globalThis.cancelAnimationFrame?.(state.frame);
    state.frame = null;
  };

  const dispose = () => {
    if (state.disposed) return;
    state.disposed = true;
    cancel_frame();
    disconnect_effect_observers(state, listener_cleanups);
    dispose_effect(effect);
    effect = null;
    dispose_renderer(renderer);
  };

  const request_frame = () => {
    if (
      !is_active() ||
      state.frame !== null ||
      state.rendering ||
      typeof globalThis.requestAnimationFrame !== "function"
    )
      return;
    if (state.motion_reduced && !state.needs_render) return;
    state.frame = globalThis.requestAnimationFrame(draw_frame);
  };

  const update_activity = () => {
    if (!alive()) {
      dispose();
      return;
    }
    if (!is_active()) {
      cancel_frame();
      state.last_frame_time = null;
      return;
    }
    request_frame();
  };

  const invalidate = () => {
    if (!alive()) {
      dispose();
      return;
    }
    state.needs_render = true;
    request_frame();
  };

  async function draw_frame(frame_time) {
    state.frame = null;
    if (!is_active()) {
      state.last_frame_time = null;
      return;
    }

    if (
      !state.motion_reduced &&
      state.last_frame_time !== null &&
      frame_time - state.last_frame_time < minimum_frame_ms - 0.5
    ) {
      request_frame();
      return;
    }

    advance_frame_clock(state, frame_time);
    state.needs_render = false;
    state.rendering = true;

    try {
      const size = sync_effect_size(canvas, renderer, effect, state, dpr_cap);
      await effect.render({
        elapsed_seconds: state.motion_reduced ? 0 : state.elapsed_ms / 1000,
        width: Math.max(1, Math.round(size.width * size.dpr)),
        height: Math.max(1, Math.round(size.height * size.dpr)),
        dpr: size.dpr,
      });

      if (!alive()) {
        dispose();
        return;
      }
      if (!state.first_frame_rendered) {
        state.first_frame_rendered = true;
        on_first_frame(backend);
      }
    } catch (error_value) {
      dispose();
      on_error(error_value);
      return;
    } finally {
      state.rendering = false;
    }

    request_frame();
  }

  const handle_resize = () => {
    if (!alive()) {
      dispose();
      return;
    }
    invalidate();
  };
  try {
    observe_effect_size(owner, canvas, state, listener_cleanups, handle_resize);
    observe_effect_visibility(owner, state, listener_cleanups, update_activity);

    sync_effect_size(canvas, renderer, effect, state, dpr_cap);
    request_frame();
    return { backend, dispose, invalidate };
  } catch (error_value) {
    dispose();
    throw error_value;
  }
};
