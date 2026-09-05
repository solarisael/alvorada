const THREE_WEBGPU_API_SYMBOL = Symbol.for("solarisael.three_webgpu");

export const load_three_webgpu_modules = async () => {
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
  const backend = renderer.backend;
  if (!backend) return null;
  if (backend.isWebGPUBackend === true) return "webgpu";
  if (backend.isWebGLBackend === true) return "webgl2";
  return null;
};

export const dispose_renderer = (renderer) => {
  try {
    renderer?.dispose?.();
  } catch {
    // A failed backend must not prevent the fallback backend from being tried.
  }
};

const require_renderer_backend = (renderer, force_webgl) => {
  const backend = get_renderer_backend(renderer);
  if (!backend || (force_webgl && backend !== "webgl2"))
    throw new Error("WebGPURenderer did not expose a supported backend");
  return backend;
};

export const initialize_renderer = async (three, canvas, is_owner_alive) => {
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

      const backend = require_renderer_backend(renderer, force_webgl);

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

export const create_owned_effect = async (create_effect, modules, renderer) => {
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
  return effect;
};

export const dispose_effect = (effect) => {
  try {
    effect?.dispose?.();
  } catch {
    // Renderer disposal still owns every backend resource after effect failure.
  }
};
