import { describe, expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

if (!globalThis.window) {
  GlobalRegistrator.register({ url: "https://solarisael.local/current/" });
}

const disposal_callbacks = new Map();
const deleted_buffers = [];
const deleted_textures = [];
const deleted_programs = [];
const cancelled_frames = [];
globalThis[Symbol.for("solarisael.node_disposal")] = {
  register_node_disposal(root, callback) {
    disposal_callbacks.set(root, callback);
    return () => {
      if (disposal_callbacks.get(root) === callback)
        disposal_callbacks.delete(root);
    };
  },
};

const texture_calls = [];
const texture_sources = [];
const frame_callbacks = [];
const observer_targets = [];
const resize_observers = [];
const constructed_images = [];

const fake_gl = {
  ARRAY_BUFFER: 0x8892,
  STATIC_DRAW: 0x88e4,
  FLOAT: 0x1406,
  TRIANGLES: 0x0004,
  COLOR_BUFFER_BIT: 0x4000,
  COMPILE_STATUS: 0x8b81,
  LINK_STATUS: 0x8b82,
  VERTEX_SHADER: 0x8b31,
  FRAGMENT_SHADER: 0x8b30,
  TEXTURE_2D: 0x0de1,
  TEXTURE_MIN_FILTER: 0x2801,
  TEXTURE_MAG_FILTER: 0x2800,
  TEXTURE_WRAP_S: 0x2802,
  TEXTURE_WRAP_T: 0x2803,
  LINEAR: 0x2601,
  CLAMP_TO_EDGE: 0x812f,
  UNPACK_FLIP_Y_WEBGL: 0x9240,
  createShader: () => ({}),
  shaderSource: () => {},
  compileShader: () => {},
  getShaderParameter: () => true,
  deleteShader: () => {},
  createProgram: () => {
    const program = {};
    return program;
  },
  attachShader: () => {},
  linkProgram: () => {},
  getProgramParameter: () => true,
  deleteProgram: (program) => deleted_programs.push(program),
  createBuffer: () => ({}),
  deleteBuffer: (buffer) => deleted_buffers.push(buffer),
  bindBuffer: () => {},
  bufferData: () => {},
  getAttribLocation: () => 0,
  enableVertexAttribArray: () => {},
  bindTexture: () => {},
  vertexAttribPointer: () => {},
  createTexture: () => {
    const texture = {};
    texture_calls.push(true);
    return texture;
  },
  deleteTexture: (texture) => deleted_textures.push(texture),
  texParameteri: () => {},
  pixelStorei: () => {},
  texImage2D: (...args) => texture_sources.push(args.at(-1)),
  viewport: () => {},
  clearColor: () => {},
  clear: () => {},
  useProgram: () => {},
  getUniformLocation: () => ({}),
  uniform2f: () => {},
  uniform1f: () => {},
  drawArrays: () => {},
};

class CachedImage {
  constructor() {
    constructed_images.push(this);
  }

  complete = false;
  naturalWidth = 0;
  naturalHeight = 0;

  set src(value) {
    this._src = value;
    this.complete = true;
    this.naturalWidth = 640;
    this.naturalHeight = 240;
    // Deliberately do not fire onload: this models a cache-complete image whose
    // load event was already delivered before hydration attached its callback.
  }
  get src() {
    return this._src;
  }
}

class FakeResizeObserver {
  constructor(callback) {
    resize_observers.push(this);
    this.callback = callback;
    this.observe = (target) => observer_targets.push(target);
    this.disconnect = () => {
      this.disconnected = true;
    };
  }
}

globalThis.Image = CachedImage;
globalThis.ResizeObserver = FakeResizeObserver;
globalThis.requestAnimationFrame = (callback) => {
  frame_callbacks.push(callback);
  return frame_callbacks.length;
};
globalThis.cancelAnimationFrame = (frame) => cancelled_frames.push(frame);
window.matchMedia = () => ({ matches: false });
HTMLCanvasElement.prototype.getContext = () => fake_gl;

const banner = document.createElement("section");
banner.dataset.solVisionBanner = "";
const canvas = document.createElement("canvas");
canvas.dataset.solVisionBannerCanvas = "";
canvas.getBoundingClientRect = () => ({ width: 640, height: 240 });
const fallback = document.createElement("img");
fallback.className = "sol__vision_banner_image";
fallback.src = "/images/banner.webp";
Object.defineProperties(fallback, {
  complete: { configurable: true, value: true },
  naturalWidth: { configurable: true, value: 640 },
  naturalHeight: { configurable: true, value: 240 },
  currentSrc: { configurable: true, value: "/images/banner.webp" },
});
banner.append(canvas, fallback);
document.body.append(banner);
const { hydrate_vision_banners } =
  await import("../src/scripts/vision_banner.js");
hydrate_vision_banners(banner);

describe("vision banner image source hydration", () => {
  test("reuses a complete DOM image without waiting for onload", () => {
    expect(texture_calls).toHaveLength(1);
    expect(frame_callbacks).toHaveLength(1);
    expect(observer_targets).toHaveLength(1);
    expect(constructed_images).toHaveLength(0);
    expect(texture_sources[0]).toBe(fallback);
    expect(banner.classList.contains("sol__vision_banner_webgl_ready")).toBe(
      true,
    );
    expect(banner.classList.contains("sol__vision_banner_hydrating")).toBe(true);
    expect(banner.classList.contains("sol__vision_banner_visual_ready")).toBe(
      false,
    );

    frame_callbacks[0](0);

    expect(banner.classList.contains("sol__vision_banner_hydrating")).toBe(
      false,
    );
    expect(banner.classList.contains("sol__vision_banner_visual_ready")).toBe(
      true,
    );

    hydrate_vision_banners(banner);
    hydrate_vision_banners(banner);

    expect(texture_calls).toHaveLength(1);
    expect(frame_callbacks).toHaveLength(2);
    expect(observer_targets).toHaveLength(1);
  });

  test("uses the Image loader only when the DOM fallback is incomplete", () => {
    const second_banner = document.createElement("section");
    second_banner.dataset.solVisionBanner = "";
    const second_canvas = document.createElement("canvas");
    second_canvas.dataset.solVisionBannerCanvas = "";
    second_canvas.getBoundingClientRect = () => ({ width: 640, height: 240 });
    const second_fallback = document.createElement("img");
    second_fallback.className = "sol__vision_banner_image";
    second_fallback.src = "/images/incomplete.webp";
    Object.defineProperties(second_fallback, {
      complete: { configurable: true, value: false },
      naturalWidth: { configurable: true, value: 0 },
      naturalHeight: { configurable: true, value: 0 },
      currentSrc: { configurable: true, value: "/images/incomplete.webp" },
    });
    second_banner.append(second_canvas, second_fallback);
    document.body.append(second_banner);

    hydrate_vision_banners(second_banner);

    expect(constructed_images).toHaveLength(1);
    expect(texture_calls).toHaveLength(2);
    expect(texture_sources[1]).toBe(constructed_images[0]);
    expect(second_banner.classList.contains("sol__vision_banner_webgl_ready")).toBe(
      true,
    );
  });
  test("re-uploads the texture when the picture source changes", () => {
    const responsive_banner = document.createElement("section");
    responsive_banner.dataset.solVisionBanner = "";
    const responsive_canvas = document.createElement("canvas");
    responsive_canvas.dataset.solVisionBannerCanvas = "";
    responsive_canvas.getBoundingClientRect = () => ({
      width: 640,
      height: 240,
    });
    const responsive_picture = document.createElement("picture");
    const responsive_source = document.createElement("source");
    responsive_source.type = "image/webp";
    responsive_source.srcset = "/images/banner-mobile.webp";
    const responsive_image = document.createElement("img");
    responsive_image.className = "sol__vision_banner_image";
    responsive_image.src = "/images/banner-mobile.webp";
    Object.defineProperties(responsive_image, {
      complete: { configurable: true, value: true },
      naturalWidth: { configurable: true, value: 640 },
      naturalHeight: { configurable: true, value: 240 },
      currentSrc: {
        configurable: true,
        value: "/images/banner-mobile.webp",
      },
    });
    responsive_picture.append(responsive_source, responsive_image);
    responsive_banner.append(responsive_canvas, responsive_picture);
    document.body.append(responsive_banner);

    const previous_texture_source_count = texture_sources.length;
    hydrate_vision_banners(responsive_banner);
    expect(texture_sources.at(-1)).toBe(responsive_image);

    Object.defineProperty(responsive_image, "currentSrc", {
      configurable: true,
      value: "/images/banner-desktop.webp",
    });
    Object.defineProperty(responsive_image, "naturalWidth", {
      configurable: true,
      value: 1672,
    });
    Object.defineProperty(responsive_image, "naturalHeight", {
      configurable: true,
      value: 628,
    });
    responsive_source.dispatchEvent(new Event("load"));

    expect(texture_sources).toHaveLength(previous_texture_source_count + 2);
    expect(texture_sources.at(-1)).toBe(responsive_image);

    responsive_image.dispatchEvent(new Event("load"));
    expect(texture_sources).toHaveLength(previous_texture_source_count + 2);
  });

  test("disposes a detached banner exactly once and blocks async restart", () => {
    const disposable_banner = document.createElement("section");
    disposable_banner.dataset.solVisionBanner = "";
    const disposable_canvas = document.createElement("canvas");
    disposable_canvas.dataset.solVisionBannerCanvas = "";
    disposable_canvas.getBoundingClientRect = () => ({
      width: 640,
      height: 240,
    });
    const disposable_picture = document.createElement("picture");
    const disposable_source = document.createElement("source");
    disposable_source.srcset = "/images/disposable.webp";
    const disposable_image = document.createElement("img");
    disposable_image.className = "sol__vision_banner_image";
    disposable_image.src = "/images/disposable.webp";
    Object.defineProperties(disposable_image, {
      complete: { configurable: true, value: true },
      naturalWidth: { configurable: true, value: 640 },
      naturalHeight: { configurable: true, value: 240 },
      currentSrc: {
        configurable: true,
        value: "/images/disposable.webp",
      },
    });
    disposable_picture.append(disposable_source, disposable_image);
    disposable_banner.append(disposable_canvas, disposable_picture);
    document.body.append(disposable_banner);

    hydrate_vision_banners(disposable_banner);
    const dispose_banner = disposal_callbacks.get(disposable_banner);
    const frame_id = frame_callbacks.length;
    const observer = resize_observers.at(-1);
    const texture_source_count = texture_sources.length;
    expect(dispose_banner).toEqual(expect.any(Function));

    disposable_banner.remove();
    dispose_banner();
    dispose_banner();

    expect(cancelled_frames).toContain(frame_id);
    expect(observer.disconnected).toBe(true);
    expect(deleted_buffers).toHaveLength(1);
    expect(deleted_textures).toHaveLength(1);
    expect(deleted_programs).toHaveLength(1);
    expect(disposal_callbacks.has(disposable_banner)).toBe(false);

    const frame_count = frame_callbacks.length;
    frame_callbacks[frame_id - 1](1);
    disposable_image.dispatchEvent(new Event("load"));
    disposable_source.dispatchEvent(new Event("load"));
    hydrate_vision_banners(disposable_banner);

    expect(frame_callbacks).toHaveLength(frame_count);
    expect(texture_sources).toHaveLength(texture_source_count);
  });
});
