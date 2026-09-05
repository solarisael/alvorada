import { create_gpu_effect_runtime } from "./gpu_effect_runtime.js";
import { register_node_disposal } from "./node_disposal_bridge.js";
import { create_vision_banner_effect } from "./vision/effect.js";
import {
  create_banner_images,
  listen_for_image,
  update_banner_image,
} from "./vision/images.js";
import { observe_banner_viewport } from "./vision/viewport.js";

const BANNER_SELECTOR = "[data-sol-vision-banner]";
const CANVAS_SELECTOR = "[data-sol-vision-banner-canvas]";
const GPU_READY_CLASS = "sol__vision_banner_gpu_ready";
const HYDRATING_CLASS = "sol__vision_banner_hydrating";
const VISUAL_READY_CLASS = "sol__vision_banner_visual_ready";
const RENDERER_ATTRIBUTE = "data-sol-vision-renderer";
const active_banners = new WeakMap();
const hydrating_banners = new WeakSet();

const hydrate_banner = (banner) => {
  if (
    active_banners.has(banner) ||
    hydrating_banners.has(banner) ||
    banner.isConnected !== true
  )
    return;

  const canvas = banner.querySelector(CANVAS_SELECTOR);
  if (!(canvas instanceof HTMLCanvasElement)) return;

  const state = {
    banner,
    breakout_observer: null,
    disposed: false,
    effect: null,
    image: null,
    image_height: 0,
    image_source: "",
    image_width: 0,
    initialized: false,
    initializing: false,
    runtime: null,
    visual_ready: false,
  };
  const listener_cleanups = [];
  let unregister_node_disposal = () => {};

  const is_alive = () => !state.disposed && banner.isConnected === true;

  const dispose = () => {
    if (state.disposed) return;
    state.disposed = true;

    for (const cleanup_listener of listener_cleanups.splice(0)) {
      try {
        cleanup_listener();
      } catch {
        // Continue releasing the remaining banner-owned lifecycle.
      }
    }
    state.breakout_observer?.disconnect();
    state.breakout_observer = null;
    state.runtime?.dispose();
    state.runtime = null;
    state.effect = null;

    active_banners.delete(banner);
    hydrating_banners.delete(banner);
    banner.classList.remove(
      HYDRATING_CLASS,
      GPU_READY_CLASS,
      VISUAL_READY_CLASS,
    );
    banner.removeAttribute(RENDERER_ATTRIBUTE);

    unregister_node_disposal();
    unregister_node_disposal = () => {};
  };

  banner.classList.remove(GPU_READY_CLASS, VISUAL_READY_CLASS);
  banner.removeAttribute(RENDERER_ATTRIBUTE);
  hydrating_banners.add(banner);
  banner.classList.add(HYDRATING_CLASS);

  try {
    const unregister = register_node_disposal(banner, dispose);
    unregister_node_disposal =
      typeof unregister === "function" ? unregister : () => {};

    const {
      image,
      dom_image,
      source_nodes,
      get_loaded_image,
      get_image_source,
    } = create_banner_images(banner);

    const initialize = async () => {
      if (
        state.disposed ||
        state.initializing ||
        state.initialized ||
        !state.image
      )
        return;
      if (!is_alive()) {
        dispose();
        return;
      }

      state.initializing = true;
      try {
        const runtime = await create_gpu_effect_runtime({
          owner: banner,
          canvas,
          dpr_cap: 2,
          is_owner_alive: is_alive,
          create_effect: ({ three, tsl, renderer }) => {
            const effect = create_vision_banner_effect({
              three,
              tsl,
              renderer,
              image: state.image,
              image_width: state.image_width,
              image_height: state.image_height,
              inverted_bowl: banner.dataset.visionVariant === "inverted-bowl",
            });
            state.effect = effect;
            return effect;
          },
          on_first_frame: (backend) => {
            if (!is_alive()) return;
            state.visual_ready = true;
            banner.setAttribute(RENDERER_ATTRIBUTE, backend);
            banner.classList.add(GPU_READY_CLASS, VISUAL_READY_CLASS);
            banner.classList.remove(HYDRATING_CLASS);
          },
          on_error: dispose,
        });
        if (!runtime || !is_alive()) {
          runtime?.dispose();
          return;
        }

        state.runtime = runtime;
        state.initialized = true;
        active_banners.set(banner, state);
        hydrating_banners.delete(banner);
      } catch {
        dispose();
      } finally {
        state.initializing = false;
      }
    };

    const refresh_texture = (event_target = null) => {
      if (state.disposed) return;
      if (!is_alive()) {
        dispose();
        return;
      }
      const loaded_image = get_loaded_image(event_target);
      if (!loaded_image) return;

      const next_source = get_image_source(loaded_image);
      if (!update_banner_image(state, loaded_image, next_source)) return;
      if (!state.initialized && !state.initializing) void initialize();
    };

    const handle_image_error = (target) => {
      if (state.disposed) return;
      if (!is_alive()) {
        dispose();
        return;
      }
      if (
        !state.initialized &&
        !get_loaded_image(target) &&
        (target === dom_image || (!dom_image && target === image))
      )
        dispose();
    };

    const image_targets = [
      ...new Set([image, dom_image, ...source_nodes].filter(Boolean)),
    ];
    for (const image_target of image_targets) {
      listen_for_image(
        image_target,
        "load",
        () => refresh_texture(image_target),
        listener_cleanups,
      );
      listen_for_image(
        image_target,
        "error",
        () => handle_image_error(image_target),
        listener_cleanups,
      );
    }

    observe_banner_viewport(
      banner,
      state,
      listener_cleanups,
      is_alive,
      dispose,
      refresh_texture,
      dom_image,
    );

    if (image.complete) {
      image.naturalWidth > 0
        ? refresh_texture(image)
        : handle_image_error(image);
    }
  } catch {
    dispose();
  }
};

export const hydrate_vision_banners = (root = document) => {
  for (const banner of root.querySelectorAll?.(BANNER_SELECTOR) ?? [])
    hydrate_banner(banner);
  if (root instanceof HTMLElement && root.matches(BANNER_SELECTOR))
    hydrate_banner(root);
};

if (typeof document !== "undefined") {
  const hydrate = () => hydrate_vision_banners(document);
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", hydrate, { once: true })
    : hydrate();
  document.addEventListener("htmx:afterSwap", (event) =>
    hydrate_vision_banners(event?.detail?.target ?? document),
  );
}
