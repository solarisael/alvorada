import { describe, expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

if (!globalThis.window) {
  GlobalRegistrator.register({ url: "https://solarisael.local/current/" });
}

const texture_calls = [];
const frame_callbacks = [];
const observer_targets = [];

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
  createProgram: () => ({}),
  attachShader: () => {},
  linkProgram: () => {},
  getProgramParameter: () => true,
  deleteProgram: () => {},
  createBuffer: () => ({}),
  bindBuffer: () => {},
  bufferData: () => {},
  getAttribLocation: () => 0,
  enableVertexAttribArray: () => {},
  bindTexture: () => {},
  vertexAttribPointer: () => {},
  createTexture: () => {
    texture_calls.push(true);
    return {};
  },
  texParameteri: () => {},
  pixelStorei: () => {},
  texImage2D: () => {},
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
  constructor() {
    this.observe = (target) => observer_targets.push(target);
    this.disconnect = () => {};
  }
}

globalThis.Image = CachedImage;
globalThis.ResizeObserver = FakeResizeObserver;
globalThis.requestAnimationFrame = (callback) => {
  frame_callbacks.push(callback);
  return frame_callbacks.length;
};
globalThis.cancelAnimationFrame = () => {};
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
banner.append(canvas, fallback);
const { hydrate_vision_banners } =
  await import("../src/scripts/vision_banner.js");
hydrate_vision_banners(banner);

describe("vision banner cached-image hydration", () => {
  test("initializes a cached image once without waiting for onload", () => {
    expect(texture_calls).toHaveLength(1);
    expect(frame_callbacks).toHaveLength(1);
    expect(observer_targets).toHaveLength(1);
    expect(banner.classList.contains("sol__vision_banner_webgl_ready")).toBe(
      true,
    );

    hydrate_vision_banners(banner);
    hydrate_vision_banners(banner);

    expect(texture_calls).toHaveLength(1);
    expect(frame_callbacks).toHaveLength(1);
    expect(observer_targets).toHaveLength(1);
  });
});
