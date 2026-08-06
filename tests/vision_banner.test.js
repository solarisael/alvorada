import { describe, expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

if (!globalThis.window) {
  GlobalRegistrator.register({ url: "https://solarisael.local/current/" });
}

const disposal_callbacks = new Map();
globalThis[Symbol.for("solarisael.node_disposal")] = {
  register_node_disposal(root, callback) {
    disposal_callbacks.set(root, callback);
    return () => {
      if (disposal_callbacks.get(root) === callback)
        disposal_callbacks.delete(root);
    };
  },
};

const active_listeners = [];
const native_add_event_listener = EventTarget.prototype.addEventListener;
const native_remove_event_listener = EventTarget.prototype.removeEventListener;
EventTarget.prototype.addEventListener = function (type, callback, options) {
  active_listeners.push({ target: this, type, callback });
  return native_add_event_listener.call(this, type, callback, options);
};
EventTarget.prototype.removeEventListener = function (type, callback, options) {
  const listener_index = active_listeners.findIndex(
    (listener) =>
      listener.target === this &&
      listener.type === type &&
      listener.callback === callback,
  );
  if (listener_index >= 0) active_listeners.splice(listener_index, 1);
  return native_remove_event_listener.call(this, type, callback, options);
};
const track_target_listeners = (target) => {
  const add_event_listener = target.addEventListener.bind(target);
  const remove_event_listener = target.removeEventListener.bind(target);
  target.addEventListener = (type, callback, options) => {
    active_listeners.push({ target, type, callback });
    return add_event_listener(type, callback, options);
  };
  target.removeEventListener = (type, callback, options) => {
    const listener_index = active_listeners.findIndex(
      (listener) =>
        listener.target === target &&
        listener.type === type &&
        listener.callback === callback,
    );
    if (listener_index >= 0) active_listeners.splice(listener_index, 1);
    return remove_event_listener(type, callback, options);
  };
};
track_target_listeners(window);
track_target_listeners(document);

const listener_count = (target, type) =>
  active_listeners.filter(
    (listener) => listener.target === target && listener.type === type,
  ).length;

let reduced_motion = false;
let visibility_state = "visible";
window.matchMedia = () => ({ matches: reduced_motion });
Object.defineProperty(document, "visibilityState", {
  configurable: true,
  get: () => visibility_state,
});

let next_frame_id = 1;
const pending_frames = new Map();
const cancelled_frames = [];
globalThis.requestAnimationFrame = (callback) => {
  const frame_id = next_frame_id++;
  pending_frames.set(frame_id, callback);
  return frame_id;
};
globalThis.cancelAnimationFrame = (frame_id) => {
  cancelled_frames.push(frame_id);
  pending_frames.delete(frame_id);
};

const resize_observers = [];
class FakeResizeObserver {
  constructor(callback) {
    this.callback = callback;
    this.targets = [];
    this.disconnect_calls = 0;
    resize_observers.push(this);
  }

  observe(target) {
    this.targets.push(target);
  }

  disconnect() {
    this.disconnect_calls += 1;
  }
}

globalThis.ResizeObserver = FakeResizeObserver;

const intersection_observers = [];
class FakeIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
    this.targets = [];
    this.disconnect_calls = 0;
    intersection_observers.push(this);
  }

  observe(target) {
    this.targets.push(target);
  }

  disconnect() {
    this.disconnect_calls += 1;
  }

  set_intersecting(target, is_intersecting) {
    this.callback([{ target, isIntersecting: is_intersecting }]);
  }
}

globalThis.IntersectionObserver = FakeIntersectionObserver;

const constructed_images = [];
class DeferredImage extends EventTarget {
  constructor() {
    super();
    constructed_images.push(this);
  }

  complete = false;
  naturalWidth = 0;
  naturalHeight = 0;

  set src(value) {
    this._src = value;
  }

  get src() {
    return this._src;
  }

  get currentSrc() {
    return this._src;
  }

  finish(width = 640, height = 240) {
    this.complete = true;
    this.naturalWidth = width;
    this.naturalHeight = height;
    this.dispatchEvent(new Event("load"));
  }
}

globalThis.Image = DeferredImage;

class FakeNode {
  constructor(value = 0) {
    this.value = value;
    this.x = this;
    this.y = this;
    this.rgb = this;
    this.a = this;
  }

  add() {
    return this;
  }

  div() {
    return this;
  }

  greaterThan() {
    return this;
  }

  mul() {
    return this;
  }

  oneMinus() {
    return this;
  }

  sub() {
    return this;
  }
}

class FakeVector2 {
  constructor(x, y) {
    this.set(x, y);
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }
}

const textures = [];
class FakeTexture {
  constructor(image) {
    this.image = image;
    this.needs_update_count = 0;
    this.dispose_calls = 0;
    textures.push(this);
  }

  set needsUpdate(value) {
    if (value === true) this.needs_update_count += 1;
  }

  dispose() {
    this.dispose_calls += 1;
  }
}

const materials = [];
class FakeMaterial {
  constructor() {
    this.dispose_calls = 0;
    materials.push(this);
  }

  dispose() {
    this.dispose_calls += 1;
  }
}

const geometries = [];
class FakeGeometry {
  constructor() {
    this.dispose_calls = 0;
    geometries.push(this);
  }

  dispose() {
    this.dispose_calls += 1;
  }
}

const scenes = [];
class FakeScene {
  constructor() {
    this.added = [];
    this.removed = [];
    scenes.push(this);
  }

  add(node) {
    this.added.push(node);
  }

  remove(node) {
    this.removed.push(node);
  }
}

let renderer_plans = [];
const renderers = [];
class FakeRenderer {
  constructor(options) {
    this.options = options;
    this.plan = renderer_plans.shift() ?? {};
    this.dispose_calls = 0;
    this.render_calls = 0;
    const backend =
      this.plan.backend ?? (options.forceWebGL ? "webgl2" : "webgpu");
    this.backend = {
      isWebGPUBackend: backend === "webgpu",
      isWebGLBackend: backend === "webgl2",
    };
    renderers.push(this);
  }

  async init() {
    if (this.plan.init_gate) await this.plan.init_gate.promise;
    if (this.plan.init_error) throw this.plan.init_error;
  }

  setClearColor() {}

  setPixelRatio(value) {
    this.pixel_ratio = value;
  }

  setSize(width, height) {
    this.size = { width, height };
  }

  render() {
    this.render_calls += 1;
    if (this.plan.render_error) throw this.plan.render_error;
  }

  dispose() {
    this.dispose_calls += 1;
  }
}

const node = () => new FakeNode();
const fake_tsl = {
  abs: node,
  cos: node,
  exp: node,
  float: node,
  length: node,
  max: node,
  min: node,
  mix: node,
  mx_fractal_noise_float: node,
  mx_noise_float: node,
  pow: node,
  select: node,
  sin: node,
  smoothstep: node,
  texture: node,
  uniform: (value) => new FakeNode(value),
  uv: node,
  vec2: node,
  vec3: node,
};
const fake_three = {
  WebGPURenderer: FakeRenderer,
  Vector2: FakeVector2,
  Texture: FakeTexture,
  SRGBColorSpace: "srgb",
  LinearFilter: "linear",
  ClampToEdgeWrapping: "clamp",
  MeshBasicNodeMaterial: FakeMaterial,
  PlaneGeometry: FakeGeometry,
  Mesh: class FakeMesh {
    constructor(geometry, material) {
      this.geometry = geometry;
      this.material = material;
    }
  },
  Scene: FakeScene,
  OrthographicCamera: class FakeOrthographicCamera {},
};

let module_loads = 0;
globalThis[Symbol.for("solarisael.three_webgpu")] = {
  async load_modules() {
    module_loads += 1;
    return { three: fake_three, tsl: fake_tsl };
  },
};

const settle_async = async () => {
  for (let turn = 0; turn < 12; turn += 1) await Promise.resolve();
};

const run_next_frame = async (time) => {
  const next_frame = pending_frames.entries().next().value;
  if (!next_frame) throw new Error("Expected a pending animation frame");
  const [frame_id, callback] = next_frame;
  pending_frames.delete(frame_id);
  await callback(time);
  await settle_async();
  return frame_id;
};

const deferred = () => {
  let resolve;
  const promise = new Promise((resolve_promise) => {
    resolve = resolve_promise;
  });
  return { promise, resolve };
};

const reset_metrics = () => {
  constructed_images.length = 0;
  resize_observers.length = 0;
  intersection_observers.length = 0;
  textures.length = 0;
  materials.length = 0;
  geometries.length = 0;
  scenes.length = 0;
  renderers.length = 0;
  renderer_plans = [];
  module_loads = 0;
  pending_frames.clear();
  cancelled_frames.length = 0;
  next_frame_id = 1;
  reduced_motion = false;
  visibility_state = "visible";
};

const create_banner = ({
  complete = true,
  picture = false,
  source = "/images/banner.webp",
} = {}) => {
  const banner = document.createElement("section");
  banner.dataset.solVisionBanner = "";
  banner.getBoundingClientRect = () => ({
    width: 640,
    height: 240,
    top: 0,
    right: 640,
    bottom: 240,
    left: 0,
  });

  const canvas = document.createElement("canvas");
  canvas.dataset.solVisionBannerCanvas = "";
  canvas.getBoundingClientRect = () => ({ width: 640, height: 240 });

  const image = document.createElement("img");
  image.className = "sol__vision_banner_image";
  image.src = source;
  Object.defineProperties(image, {
    complete: { configurable: true, value: complete },
    naturalWidth: { configurable: true, value: complete ? 640 : 0 },
    naturalHeight: { configurable: true, value: complete ? 240 : 0 },
    currentSrc: { configurable: true, value: source },
  });
  track_target_listeners(image);

  let source_node = null;
  if (picture) {
    const picture_node = document.createElement("picture");
    source_node = document.createElement("source");
    source_node.type = "image/webp";
    source_node.srcset = source;
    track_target_listeners(source_node);
    picture_node.append(source_node, image);
    banner.append(canvas, picture_node);
  } else {
    banner.append(canvas, image);
  }
  document.body.append(banner);
  return { banner, canvas, image, source_node };
};

const dispose_banner = (banner) => {
  const dispose = disposal_callbacks.get(banner);
  banner.remove();
  dispose?.();
  return dispose;
};

const { hydrate_vision_banners } =
  await import("../src/scripts/vision_banner.js");

describe("vision banner GPU hydration", () => {
  test("hydrates a complete responsive image WebGPU-first and reveals only after the first successful frame", async () => {
    reset_metrics();
    const { banner, image } = create_banner();

    hydrate_vision_banners(banner);
    hydrate_vision_banners(banner);
    await settle_async();

    expect(module_loads).toBe(1);
    expect(constructed_images).toHaveLength(0);
    expect(renderers).toHaveLength(1);
    expect(renderers[0].options.forceWebGL).toBe(false);
    expect(textures).toHaveLength(1);
    expect(textures[0].image).toBe(image);
    expect(pending_frames.size).toBe(1);
    expect(banner.classList.contains("sol__vision_banner_hydrating")).toBe(
      true,
    );
    expect(banner.classList.contains("sol__vision_banner_gpu_ready")).toBe(
      false,
    );
    expect(banner.classList.contains("sol__vision_banner_visual_ready")).toBe(
      false,
    );
    expect(banner.hasAttribute("data-sol-vision-renderer")).toBe(false);

    await run_next_frame(16);

    expect(renderers[0].render_calls).toBe(1);
    expect(banner.classList.contains("sol__vision_banner_hydrating")).toBe(
      false,
    );
    expect(banner.classList.contains("sol__vision_banner_gpu_ready")).toBe(
      true,
    );
    expect(banner.classList.contains("sol__vision_banner_visual_ready")).toBe(
      true,
    );
    expect(banner.dataset.solVisionRenderer).toBe("webgpu");
    expect([...banner.classList].sort()).toEqual(
      [
        "sol__vision_banner_gpu_ready",
        "sol__vision_banner_visual_ready",
      ].sort(),
    );

    hydrate_vision_banners(banner);
    hydrate_vision_banners(banner);
    await settle_async();
    expect(module_loads).toBe(1);
    expect(renderers).toHaveLength(1);
    expect(textures).toHaveLength(1);
    expect(intersection_observers).toHaveLength(1);

    dispose_banner(banner);
  });

  test("caps continuous GPU rendering at 60 frames per second", async () => {
    reset_metrics();
    const { banner } = create_banner();

    hydrate_vision_banners(banner);
    await settle_async();
    await run_next_frame(0);
    expect(renderers[0].render_calls).toBe(1);

    for (const frame_time of [4, 8, 12]) await run_next_frame(frame_time);
    expect(renderers[0].render_calls).toBe(1);

    await run_next_frame(17);
    expect(renderers[0].render_calls).toBe(2);

    dispose_banner(banner);
  });

  test("waits for an incomplete fallback image and hydrates from its loader", async () => {
    reset_metrics();
    const { banner } = create_banner({
      complete: false,
      source: "/images/incomplete.webp",
    });

    hydrate_vision_banners(banner);
    await settle_async();

    expect(constructed_images).toHaveLength(1);
    expect(module_loads).toBe(0);
    expect(renderers).toHaveLength(0);
    expect(textures).toHaveLength(0);
    expect(pending_frames.size).toBe(0);
    expect(banner.classList.contains("sol__vision_banner_hydrating")).toBe(
      true,
    );

    constructed_images[0].finish();
    await settle_async();

    expect(module_loads).toBe(1);
    expect(textures).toHaveLength(1);
    expect(textures[0].image).toBe(constructed_images[0]);
    expect(pending_frames.size).toBe(1);

    await run_next_frame(8);
    expect(banner.dataset.solVisionRenderer).toBe("webgpu");
    dispose_banner(banner);
  });

  test("refreshes one texture when a responsive picture source changes and ignores duplicate load delivery", async () => {
    reset_metrics();
    const { banner, image, source_node } = create_banner({
      picture: true,
      source: "/images/banner-mobile.webp",
    });

    hydrate_vision_banners(banner);
    await settle_async();
    await run_next_frame(0);

    const texture = textures[0];
    expect(texture.needs_update_count).toBe(1);

    Object.defineProperties(image, {
      currentSrc: {
        configurable: true,
        value: "/images/banner-desktop.webp",
      },
      naturalWidth: { configurable: true, value: 1672 },
      naturalHeight: { configurable: true, value: 628 },
    });
    source_node.dispatchEvent(new Event("load"));

    expect(textures).toHaveLength(1);
    expect(texture.image).toBe(image);
    expect(texture.needs_update_count).toBe(2);
    expect(pending_frames.size).toBe(1);

    image.dispatchEvent(new Event("load"));
    expect(texture.needs_update_count).toBe(2);
    expect(renderers).toHaveLength(1);

    dispose_banner(banner);
  });

  test("falls back to WebGL2 when WebGPU initialization fails and reports the actual backend", async () => {
    reset_metrics();
    renderer_plans = [
      { backend: "webgpu", init_error: new Error("WebGPU unavailable") },
      { backend: "webgl2" },
    ];
    const { banner } = create_banner();

    hydrate_vision_banners(banner);
    await settle_async();

    expect(renderers).toHaveLength(2);
    expect(renderers.map((renderer) => renderer.options.forceWebGL)).toEqual([
      false,
      true,
    ]);
    expect(renderers[0].dispose_calls).toBe(1);
    expect(renderers[1].dispose_calls).toBe(0);
    expect(banner.hasAttribute("data-sol-vision-renderer")).toBe(false);

    await run_next_frame(12);

    expect(banner.dataset.solVisionRenderer).toBe("webgl2");
    expect(banner.classList.contains("sol__vision_banner_gpu_ready")).toBe(
      true,
    );
    expect([...banner.classList].sort()).toEqual(
      [
        "sol__vision_banner_gpu_ready",
        "sol__vision_banner_visual_ready",
      ].sort(),
    );

    dispose_banner(banner);
    expect(renderers[1].dispose_calls).toBe(1);
  });

  test("keeps the fallback image visible when neither GPU backend can initialize", async () => {
    reset_metrics();
    renderer_plans = [
      { init_error: new Error("WebGPU unavailable") },
      { init_error: new Error("WebGL2 unavailable") },
    ];
    const { banner, image } = create_banner();

    hydrate_vision_banners(banner);
    await settle_async();

    expect(renderers).toHaveLength(2);
    expect(renderers.every((renderer) => renderer.dispose_calls === 1)).toBe(
      true,
    );
    expect(image.isConnected).toBe(true);
    expect(image.classList.contains("sol__vision_banner_image")).toBe(true);
    expect(banner.classList.contains("sol__vision_banner_hydrating")).toBe(
      false,
    );
    expect(banner.classList.contains("sol__vision_banner_gpu_ready")).toBe(
      false,
    );
    expect(banner.classList.contains("sol__vision_banner_visual_ready")).toBe(
      false,
    );
    expect(banner.hasAttribute("data-sol-vision-renderer")).toBe(false);
    expect(pending_frames.size).toBe(0);
    expect(disposal_callbacks.has(banner)).toBe(false);

    banner.remove();
  });

  test("does not reveal a banner whose first GPU frame fails", async () => {
    reset_metrics();
    renderer_plans = [{ render_error: new Error("device lost") }];
    const { banner, image } = create_banner();

    hydrate_vision_banners(banner);
    await settle_async();
    await run_next_frame(4);

    expect(image.isConnected).toBe(true);
    expect(banner.classList.contains("sol__vision_banner_gpu_ready")).toBe(
      false,
    );
    expect(banner.classList.contains("sol__vision_banner_visual_ready")).toBe(
      false,
    );
    expect(banner.hasAttribute("data-sol-vision-renderer")).toBe(false);
    expect(renderers[0].dispose_calls).toBe(1);
    expect(textures[0].dispose_calls).toBe(1);
    expect(materials[0].dispose_calls).toBe(1);
    expect(geometries[0].dispose_calls).toBe(1);
    expect(pending_frames.size).toBe(0);

    banner.remove();
  });

  test("renders one stable frame for reduced motion and only redraws when invalidated", async () => {
    reset_metrics();
    reduced_motion = true;
    const { banner } = create_banner();

    hydrate_vision_banners(banner);
    await settle_async();
    await run_next_frame(100);

    expect(renderers[0].render_calls).toBe(1);
    expect(pending_frames.size).toBe(0);

    const runtime_resize = resize_observers.find((observer) =>
      observer.targets.includes(banner),
    );
    runtime_resize.callback();
    runtime_resize.callback();
    expect(pending_frames.size).toBe(1);

    await run_next_frame(900);
    expect(renderers[0].render_calls).toBe(2);
    expect(pending_frames.size).toBe(0);

    dispose_banner(banner);
  });

  test("suspends hidden banners, resumes one loop, and removes observers and listeners on disposal", async () => {
    reset_metrics();
    const { banner, image } = create_banner();
    const resize_listener_baseline = listener_count(window, "resize");
    const visibility_listener_baseline = listener_count(
      document,
      "visibilitychange",
    );

    hydrate_vision_banners(banner);
    await settle_async();

    expect(listener_count(window, "resize")).toBe(resize_listener_baseline + 2);
    expect(listener_count(document, "visibilitychange")).toBe(
      visibility_listener_baseline + 1,
    );
    expect(listener_count(image, "load")).toBe(1);
    expect(listener_count(image, "error")).toBe(1);

    const visibility_observer = intersection_observers[0];
    const first_frame_id = pending_frames.keys().next().value;
    visibility_observer.set_intersecting(banner, false);
    expect(cancelled_frames).toContain(first_frame_id);
    expect(pending_frames.size).toBe(0);

    visibility_observer.set_intersecting(banner, true);
    visibility_observer.set_intersecting(banner, true);
    expect(pending_frames.size).toBe(1);

    await run_next_frame(100);
    expect(pending_frames.size).toBe(1);

    visibility_state = "hidden";
    document.dispatchEvent(new Event("visibilitychange"));
    expect(pending_frames.size).toBe(0);

    visibility_state = "visible";
    document.dispatchEvent(new Event("visibilitychange"));
    document.dispatchEvent(new Event("visibilitychange"));
    expect(pending_frames.size).toBe(1);

    const owned_resize_observers = [...resize_observers];
    const dispose = disposal_callbacks.get(banner);
    dispose_banner(banner);
    dispose();

    expect(visibility_observer.disconnect_calls).toBe(1);
    expect(
      owned_resize_observers.every(
        (observer) => observer.disconnect_calls === 1,
      ),
    ).toBe(true);
    expect(listener_count(window, "resize")).toBe(resize_listener_baseline);
    expect(listener_count(document, "visibilitychange")).toBe(
      visibility_listener_baseline,
    );
    expect(listener_count(image, "load")).toBe(0);
    expect(listener_count(image, "error")).toBe(0);
    expect(pending_frames.size).toBe(0);
  });

  test("disposes every GPU node exactly once, cancels animation, and blocks late restart", async () => {
    reset_metrics();
    const { banner, image, source_node } = create_banner({ picture: true });

    hydrate_vision_banners(banner);
    await settle_async();

    const scheduled_frame = pending_frames.keys().next().value;
    const dispose = disposal_callbacks.get(banner);
    expect(dispose).toEqual(expect.any(Function));

    banner.remove();
    dispose();
    dispose();

    expect(cancelled_frames).toContain(scheduled_frame);
    expect(textures[0].dispose_calls).toBe(1);
    expect(materials[0].dispose_calls).toBe(1);
    expect(geometries[0].dispose_calls).toBe(1);
    expect(renderers[0].dispose_calls).toBe(1);
    expect(scenes[0].removed).toHaveLength(1);
    expect(disposal_callbacks.has(banner)).toBe(false);

    const texture_updates = textures[0].needs_update_count;
    image.dispatchEvent(new Event("load"));
    source_node.dispatchEvent(new Event("load"));
    hydrate_vision_banners(banner);
    await settle_async();

    expect(textures[0].needs_update_count).toBe(texture_updates);
    expect(renderers).toHaveLength(1);
    expect(pending_frames.size).toBe(0);
  });

  test("abandons an initialization that finishes after its banner was disposed", async () => {
    reset_metrics();
    const init_gate = deferred();
    renderer_plans = [{ init_gate }];
    const { banner, image } = create_banner();

    hydrate_vision_banners(banner);
    await settle_async();

    expect(renderers).toHaveLength(1);
    expect(textures).toHaveLength(0);
    const dispose = disposal_callbacks.get(banner);
    banner.remove();
    dispose();

    init_gate.resolve();
    await settle_async();
    image.dispatchEvent(new Event("load"));
    hydrate_vision_banners(banner);
    await settle_async();

    expect(renderers[0].dispose_calls).toBe(1);
    expect(textures).toHaveLength(0);
    expect(pending_frames.size).toBe(0);
    expect(banner.classList.contains("sol__vision_banner_hydrating")).toBe(
      false,
    );
    expect(banner.classList.contains("sol__vision_banner_gpu_ready")).toBe(
      false,
    );
    expect(banner.hasAttribute("data-sol-vision-renderer")).toBe(false);
    expect(disposal_callbacks.has(banner)).toBe(false);
  });

  test("hydrates banners inserted by the HTMX after-swap lifecycle", async () => {
    reset_metrics();
    const { banner } = create_banner();

    document.dispatchEvent(
      new CustomEvent("htmx:afterSwap", { detail: { target: banner } }),
    );
    await settle_async();

    expect(renderers).toHaveLength(1);
    expect(pending_frames.size).toBe(1);
    await run_next_frame(0);
    expect(banner.classList.contains("sol__vision_banner_visual_ready")).toBe(
      true,
    );

    dispose_banner(banner);
  });
});
