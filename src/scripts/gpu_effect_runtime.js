const THREE_WEBGPU_API_SYMBOL = Symbol.for("solarisael.three_webgpu");
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const load_three_webgpu_modules = async () => {
  const injected_api = globalThis[THREE_WEBGPU_API_SYMBOL];
  if (typeof injected_api?.load_modules === "function")
    return injected_api.load_modules();

  const [three, tsl] = await Promise.all([
    import("three/webgpu"),
    import("three/tsl"),
  ]);
  return { three, tsl };
};

const get_renderer_backend = (renderer) => {
  if (renderer?.backend?.isWebGPUBackend === true) return "webgpu";
  if (renderer?.backend?.isWebGLBackend === true) return "webgl2";
  return null;
};

const dispose_renderer = (renderer) => {
  try {
    renderer?.dispose?.();
  } catch {
    // A failed backend must not prevent the fallback backend from being tried.
  }
};

const initialize_renderer = async (three, canvas, is_owner_alive) => {
  const initialization_errors = [];

  for (const force_webgl of [false, true]) {
    let renderer = null;
    try {
      renderer = new three.WebGPURenderer({
        canvas,
        alpha: true,
        antialias: false,
        premultipliedAlpha: true,
        forceWebGL: force_webgl,
      });
      await renderer.init();

      if (!is_owner_alive()) {
        dispose_renderer(renderer);
        return null;
      }

      const backend = get_renderer_backend(renderer);
      if (!backend || (force_webgl && backend !== "webgl2"))
        throw new Error("WebGPURenderer did not expose a supported backend");

      return { renderer, backend };
    } catch (error_value) {
      initialization_errors.push(error_value);
      dispose_renderer(renderer);
    }
  }

  throw new AggregateError(
    initialization_errors,
    "WebGPU and WebGL2 renderer initialization failed",
  );
};

const owner_intersects_viewport = (owner) => {
  if (typeof owner?.getBoundingClientRect !== "function") return true;
  const rect = owner.getBoundingClientRect();
  const viewport_width = globalThis.window?.innerWidth ?? 0;
  const viewport_height = globalThis.window?.innerHeight ?? 0;
  if (!viewport_width || !viewport_height) return true;
  const left = Number.isFinite(rect.left) ? rect.left : 0;
  const top = Number.isFinite(rect.top) ? rect.top : 0;
  const right = Number.isFinite(rect.right)
    ? rect.right
    : left + (rect.width || 0);
  const bottom = Number.isFinite(rect.bottom)
    ? rect.bottom
    : top + (rect.height || 0);
  return (
    bottom >= 0 &&
    right >= 0 &&
    top <= viewport_height &&
    left <= viewport_width
  );
};

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
  let effect = null;
  try {
    effect = await create_effect({
      three: modules.three,
      tsl: modules.tsl,
      renderer,
    });
  } catch (error_value) {
    dispose_renderer(renderer);
    throw error_value;
  }

  if (!is_owner_alive()) {
    effect?.dispose?.();
    dispose_renderer(renderer);
    return null;
  }

  const minimum_frame_ms =
    Number.isFinite(maximum_frame_rate) && maximum_frame_rate > 0
      ? 1000 / maximum_frame_rate
      : 0;
  const state = {
    disposed: false,
    document_visible:
      !globalThis.document || document.visibilityState !== "hidden",
    elapsed_ms: 0,
    first_frame_rendered: false,
    frame: null,
    intersection_observer: null,
    last_frame_time: null,
    motion_reduced:
      globalThis.window?.matchMedia?.(REDUCED_MOTION_QUERY)?.matches === true,
    needs_render: true,
    owner_visible: owner_intersects_viewport(owner),
    rendering: false,
    resize_observer: null,
    size: { width: 0, height: 0, dpr: 0 },
  };
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

  const sync_size = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(
      Math.max(globalThis.window?.devicePixelRatio || 1, 1),
      dpr_cap,
    );
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const changed =
      width !== state.size.width ||
      height !== state.size.height ||
      dpr !== state.size.dpr;

    if (changed) {
      state.size = { width, height, dpr };
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      effect?.resize?.({
        width: Math.max(1, Math.round(width * dpr)),
        height: Math.max(1, Math.round(height * dpr)),
        dpr,
      });
    }

    return state.size;
  };

  const dispose = () => {
    if (state.disposed) return;
    state.disposed = true;
    cancel_frame();
    state.intersection_observer?.disconnect();
    state.intersection_observer = null;
    state.resize_observer?.disconnect();
    state.resize_observer = null;

    for (const cleanup_listener of listener_cleanups.splice(0)) {
      try {
        cleanup_listener();
      } catch {
        // Continue releasing the remaining effect and renderer resources.
      }
    }

    try {
      effect?.dispose?.();
    } catch {
      // Renderer disposal still owns every backend resource after effect failure.
    }
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

    if (state.motion_reduced) {
      state.elapsed_ms = 0;
    } else if (state.last_frame_time !== null) {
      state.elapsed_ms += Math.max(0, frame_time - state.last_frame_time);
    }
    state.last_frame_time = state.motion_reduced ? null : frame_time;
    state.needs_render = false;
    state.rendering = true;

    try {
      const size = sync_size();
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
    if (typeof globalThis.ResizeObserver === "function") {
      state.resize_observer = new globalThis.ResizeObserver(handle_resize);
      state.resize_observer.observe(owner ?? canvas);
    }
    if (typeof globalThis.window?.addEventListener === "function") {
      globalThis.window.addEventListener("resize", handle_resize, {
        passive: true,
      });
      listener_cleanups.push(() =>
        globalThis.window.removeEventListener("resize", handle_resize),
      );
    }

    if (typeof globalThis.IntersectionObserver === "function") {
      state.intersection_observer = new globalThis.IntersectionObserver(
        (entries) => {
          const owner_entry = entries.find((entry) => entry.target === owner);
          if (!owner_entry) return;
          state.owner_visible = owner_entry.isIntersecting === true;
          update_activity();
        },
      );
      state.intersection_observer.observe(owner);
    }

    if (typeof globalThis.document?.addEventListener === "function") {
      const handle_visibility = () => {
        state.document_visible = document.visibilityState !== "hidden";
        update_activity();
      };
      document.addEventListener("visibilitychange", handle_visibility);
      listener_cleanups.push(() =>
        document.removeEventListener("visibilitychange", handle_visibility),
      );
    }

    sync_size();
    request_frame();
    return { backend, dispose, invalidate };
  } catch (error_value) {
    dispose();
    throw error_value;
  }
};
