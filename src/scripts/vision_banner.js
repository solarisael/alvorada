import { create_gpu_effect_runtime } from "./gpu_effect_runtime.js";
import { register_node_disposal } from "./node_disposal_bridge.js";

const BANNER_SELECTOR = "[data-sol-vision-banner]";
const CANVAS_SELECTOR = "[data-sol-vision-banner-canvas]";
const GPU_READY_CLASS = "sol__vision_banner_gpu_ready";
const HYDRATING_CLASS = "sol__vision_banner_hydrating";
const VISUAL_READY_CLASS = "sol__vision_banner_visual_ready";
const RENDERER_ATTRIBUTE = "data-sol-vision-renderer";
const active_banners = new WeakMap();
const hydrating_banners = new WeakSet();

const sync_viewport_breakout = (banner) => {
  if (!banner.classList.contains("sol__vision_banner_page_top")) return;
  const current_shift =
    Number.parseFloat(
      banner.style.getPropertyValue("--vision-viewport-shift"),
    ) || 0;
  const banner_rect = banner.getBoundingClientRect();
  const unshifted_left = banner_rect.left - current_shift;
  const centered_left = (window.innerWidth - banner_rect.width) * 0.5;
  const next_shift = centered_left - unshifted_left;
  if (Math.abs(next_shift - current_shift) > 0.5) {
    banner.style.setProperty(
      "--vision-viewport-shift",
      `${next_shift.toFixed(2)}px`,
    );
  }
};

const create_vision_banner_effect = ({
  three,
  tsl,
  renderer,
  image,
  image_width,
  image_height,
  inverted_bowl,
}) => {
  const {
    abs,
    cos,
    exp,
    float,
    length,
    max,
    min,
    mix,
    pow,
    select,
    sin,
    smoothstep,
    texture,
    uniform,
    uv,
    vec2,
    vec3,
  } = tsl;

  const time = uniform(0);
  const canvas_size = uniform(new three.Vector2(1, 1));
  const image_size = uniform(
    new three.Vector2(image_width || 1, image_height || 1),
  );
  const variant = uniform(inverted_bowl ? 1 : 0);
  const image_texture = new three.Texture(image);
  image_texture.colorSpace = three.SRGBColorSpace;
  image_texture.minFilter = three.LinearFilter;
  image_texture.magFilter = three.LinearFilter;
  image_texture.wrapS = three.ClampToEdgeWrapping;
  image_texture.wrapT = three.ClampToEdgeWrapping;
  image_texture.needsUpdate = true;

  const banner_uv = uv();
  const canvas_aspect = canvas_size.x.div(canvas_size.y);
  const image_aspect = image_size.x.div(image_size.y);
  const canvas_is_wider = canvas_aspect.greaterThan(image_aspect);
  const cover_scale = vec2(
    select(canvas_is_wider, float(1), canvas_aspect.div(image_aspect)),
    select(canvas_is_wider, image_aspect.div(canvas_aspect), float(1)),
  );
  const image_uv = banner_uv.sub(0.5).mul(cover_scale).add(0.5);
  const source_color = texture(image_texture, image_uv);
  const base_color = source_color.rgb;

  const centered = vec2(
    banner_uv.x.sub(0.5).mul(canvas_aspect).mul(0.62),
    banner_uv.y.sub(0.48),
  );
  const edge_broad = sin(centered.x.mul(12.7).add(centered.y.mul(7.1)))
    .mul(0.5)
    .add(0.5);
  const edge_detail = sin(
    centered.x
      .mul(29.3)
      .sub(centered.y.mul(18.1))
      .add(cos(centered.y.mul(11.7)).mul(0.72)),
  )
    .mul(0.5)
    .add(0.5);

  const downward = banner_uv.y.oneMinus();
  const opening = pow(smoothstep(0.015, 0.92, downward), 0.68);
  const half_width = mix(0.235, 0.6, opening);
  const side_distance = abs(banner_uv.x.sub(0.5)).div(half_width);
  const stained_side = float(0.93)
    .add(edge_broad.sub(0.5).mul(0.16))
    .add(edge_detail.sub(0.5).mul(0.07));
  const side_alpha = smoothstep(
    stained_side.sub(0.18),
    stained_side.add(0.16),
    side_distance,
  ).oneMinus();
  const top_alpha = smoothstep(
    0.78,
    1.01,
    banner_uv.y.add(edge_broad.sub(0.5).mul(0.035)),
  ).oneMinus();
  const bottom_edge = float(0.045)
    .add(edge_broad.sub(0.5).mul(0.055))
    .add(edge_detail.sub(0.5).mul(0.025));
  const bottom_alpha = smoothstep(
    bottom_edge.sub(0.12),
    bottom_edge.add(0.11),
    banner_uv.y,
  );
  const inverted_bowl_alpha = side_alpha.mul(top_alpha).mul(bottom_alpha);

  const round_distance = length(centered.mul(vec2(0.92, 1.08)));
  const broken_edge = float(0.405)
    .add(edge_broad.sub(0.5).mul(0.085))
    .add(edge_detail.sub(0.5).mul(0.036));
  const round_outer = smoothstep(
    broken_edge.sub(0.16),
    broken_edge.add(0.12),
    round_distance,
  ).oneMinus();
  const round_center = smoothstep(0.205, 0.295, round_distance).oneMinus();
  const round_alpha = max(round_outer, round_center);
  const border_distance = min(
    min(banner_uv.x, banner_uv.x.oneMinus()),
    min(banner_uv.y, banner_uv.y.oneMinus()),
  );
  const aperture_alpha = mix(round_alpha, inverted_bowl_alpha, variant).mul(
    smoothstep(0, 0.052, border_distance),
  );

  const fog_space = vec2(
    banner_uv.x.sub(0.5).mul(canvas_aspect),
    banner_uv.y.sub(0.5),
  );
  const warp = vec2(
    sin(fog_space.y.mul(7.7).add(time.mul(0.16)))
      .mul(0.018)
      .add(sin(fog_space.x.mul(4.3).sub(time.mul(0.11))).mul(0.01)),
    cos(fog_space.x.mul(6.9).sub(time.mul(0.14)))
      .mul(0.016)
      .add(sin(fog_space.y.mul(4.7).add(time.mul(0.09))).mul(0.009)),
  );
  const warped_space = fog_space.add(warp);
  const detail_space = warped_space.add(
    vec2(time.mul(0.009), sin(time.mul(0.13)).mul(0.018)),
  );
  const billow_pattern = sin(
    detail_space.x
      .mul(14.3)
      .add(sin(detail_space.y.mul(11.7).sub(time.mul(0.18))).mul(1.25)),
  )
    .mul(0.46)
    .add(
      cos(
        detail_space.y
          .mul(22.7)
          .sub(time.mul(0.14))
          .add(sin(detail_space.x.mul(9.1).add(time.mul(0.11))).mul(1.05)),
      ).mul(0.34),
    )
    .add(
      sin(detail_space.x.add(detail_space.y).mul(36.0).add(time.mul(0.22))).mul(
        0.2,
      ),
    )
    .mul(0.5)
    .add(0.5);
  const fog_detail = smoothstep(0.12, 0.88, billow_pattern);

  const gaussian_lobe = (center_x, center_y, radius_x, radius_y, angle) => {
    const offset = warped_space.sub(vec2(center_x, center_y));
    const turn_cos = Math.cos(angle);
    const turn_sin = Math.sin(angle);
    const turned = vec2(
      offset.x.mul(turn_cos).add(offset.y.mul(turn_sin)),
      offset.y.mul(turn_cos).sub(offset.x.mul(turn_sin)),
    );
    const distance_squared = pow(turned.x.div(radius_x), 2).add(
      pow(turned.y.div(radius_y), 2),
    );
    return exp(distance_squared.mul(-0.5));
  };

  const far_left = gaussian_lobe(
    float(-0.42).add(sin(time.mul(0.14).add(0.4)).mul(0.1)),
    float(0.19).add(cos(time.mul(0.12).add(1.1)).mul(0.045)),
    0.46,
    0.13,
    -0.18,
  );
  const far_right = gaussian_lobe(
    float(0.44).add(sin(time.mul(0.13).add(2.2)).mul(0.11)),
    float(-0.14).add(cos(time.mul(0.15).add(0.2)).mul(0.055)),
    0.42,
    0.15,
    0.24,
  );
  const middle_low = gaussian_lobe(
    float(-0.08).add(cos(time.mul(0.18).add(0.7)).mul(0.13)),
    float(-0.3).add(sin(time.mul(0.16).add(2.6)).mul(0.05)),
    0.36,
    0.105,
    0.08,
  );
  const middle_high = gaussian_lobe(
    float(0.16).add(sin(time.mul(0.2).add(3.4)).mul(0.12)),
    float(0.28).add(cos(time.mul(0.17).add(1.6)).mul(0.05)),
    0.31,
    0.09,
    -0.31,
  );
  const near_left = gaussian_lobe(
    float(-0.54).add(sin(time.mul(0.22).add(1.9)).mul(0.13)),
    float(-0.02).add(cos(time.mul(0.19).add(2.8)).mul(0.06)),
    0.27,
    0.07,
    0.38,
  );
  const near_right = gaussian_lobe(
    float(0.56).add(cos(time.mul(0.21).add(0.9)).mul(0.14)),
    float(0.08).add(sin(time.mul(0.18).add(4.1)).mul(0.055)),
    0.25,
    0.065,
    -0.42,
  );

  const lobe_density = far_left
    .mul(0.62)
    .add(far_right.mul(0.58))
    .add(middle_low.mul(0.7))
    .add(middle_high.mul(0.66))
    .add(near_left.mul(0.56))
    .add(near_right.mul(0.52));
  const fog_density = mix(
    0.12,
    1,
    smoothstep(0.22, 1.25, lobe_density.mul(mix(0.22, 1.05, fog_detail))),
  );

  const light_offset = vec2(
    banner_uv.x.sub(0.78).mul(canvas_aspect).mul(0.55),
    banner_uv.y.sub(0.72).mul(0.95),
  );
  const light_reach = smoothstep(0.1, 0.78, length(light_offset)).oneMinus();
  const fog_transmittance = exp(fog_density.mul(-1.45));
  const in_scatter = fog_transmittance
    .oneMinus()
    .mul(light_reach)
    .mul(mix(0.38, 0.78, fog_detail));

  const round_fog_outer = smoothstep(
    broken_edge.add(0.08),
    broken_edge.add(0.21),
    round_distance,
  ).oneMinus();
  const bowl_fog_side = smoothstep(
    stained_side.add(0.06),
    stained_side.add(0.22),
    side_distance,
  ).oneMinus();
  const bowl_fog_top = smoothstep(
    0.94,
    1.08,
    banner_uv.y.add(edge_broad.sub(0.5).mul(0.025)),
  ).oneMinus();
  const bowl_fog_bottom = smoothstep(
    bottom_edge.sub(0.14),
    bottom_edge.add(0.045),
    banner_uv.y,
  );
  const bowl_fog_outer = bowl_fog_side.mul(bowl_fog_top).mul(bowl_fog_bottom);
  const fog_region = mix(round_fog_outer, bowl_fog_outer, variant).mul(
    smoothstep(0, 0.025, border_distance),
  );
  const image_alpha = aperture_alpha.mul(source_color.a);
  const fog_opacity = min(0.26, fog_density.mul(fog_region).mul(0.3));
  const combined_alpha = image_alpha.add(
    fog_opacity.mul(image_alpha.oneMinus()),
  );

  const fog_shadow = vec3(0.58, 0.57, 0.55);
  const fog_light = vec3(0.8, 0.78, 0.75);
  const neutral_fog = mix(fog_shadow, fog_light, fog_detail);
  const illuminated_fog = mix(neutral_fog, vec3(0.98, 0.91, 0.78), in_scatter);
  const fog_color = mix(
    illuminated_fog,
    base_color,
    smoothstep(0, 1, image_alpha),
  );

  const material = new three.MeshBasicNodeMaterial();
  material.colorNode = fog_color;
  material.opacityNode = combined_alpha;
  material.transparent = true;
  material.premultipliedAlpha = true;
  material.depthTest = false;
  material.depthWrite = false;
  material.toneMapped = false;

  const geometry = new three.PlaneGeometry(2, 2);
  const mesh = new three.Mesh(geometry, material);
  const scene = new three.Scene();
  const camera = new three.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene.add(mesh);
  renderer.setClearColor(0x000000, 0);

  let disposed = false;
  return {
    resize: ({ width, height }) => {
      canvas_size.value.set(width, height);
    },
    set_image: (next_image, width, height) => {
      if (disposed) return;
      image_texture.image = next_image;
      image_texture.needsUpdate = true;
      image_size.value.set(width || 1, height || 1);
    },
    render: ({ elapsed_seconds }) => {
      if (disposed) return;
      time.value = elapsed_seconds;
      renderer.render(scene, camera);
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      scene.remove(mesh);
      image_texture.dispose();
      material.dispose();
      geometry.dispose();
    },
  };
};

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

    const fallback_image = banner.querySelector(".sol__vision_banner_image");
    const dom_image =
      fallback_image instanceof HTMLImageElement ? fallback_image : null;
    const image =
      dom_image?.complete && dom_image.naturalWidth > 0
        ? dom_image
        : new Image();
    if (image !== dom_image) {
      image.decoding = "async";
      image.src = dom_image?.currentSrc || dom_image?.src || "";
    }

    const picture =
      dom_image?.closest?.("picture") ?? banner.querySelector("picture");
    const source_nodes = Array.from(
      picture?.querySelectorAll?.("source") ?? [],
    );

    const get_loaded_image = (event_target = null) => {
      if (dom_image?.complete && dom_image.naturalWidth > 0) return dom_image;
      if (
        (event_target === dom_image || event_target === image) &&
        event_target.naturalWidth > 0
      )
        return event_target;
      if (image.complete && image.naturalWidth > 0) return image;
      return null;
    };
    const get_image_source = (candidate) =>
      candidate === dom_image
        ? candidate.currentSrc || candidate.src || ""
        : candidate.currentSrc ||
          candidate.src ||
          dom_image?.currentSrc ||
          dom_image?.src ||
          "";

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
      const next_width = loaded_image.naturalWidth;
      const next_height = loaded_image.naturalHeight;
      const changed =
        state.image !== loaded_image ||
        state.image_source !== next_source ||
        state.image_width !== next_width ||
        state.image_height !== next_height;
      if (!changed) return;

      state.image = loaded_image;
      state.image_source = next_source;
      state.image_width = next_width;
      state.image_height = next_height;
      state.effect?.set_image(loaded_image, next_width, next_height);
      state.runtime?.invalidate();
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

    const listen_for_image = (target, event_name, callback) => {
      if (!target) return;
      if (typeof target.addEventListener === "function") {
        target.addEventListener(event_name, callback);
        listener_cleanups.push(() =>
          target.removeEventListener?.(event_name, callback),
        );
      } else {
        const property_name = `on${event_name}`;
        const previous_callback = target[property_name];
        target[property_name] = callback;
        listener_cleanups.push(() => {
          if (target[property_name] === callback)
            target[property_name] = previous_callback;
        });
      }
    };
    const image_targets = [
      ...new Set([image, dom_image, ...source_nodes].filter(Boolean)),
    ];
    for (const image_target of image_targets) {
      listen_for_image(image_target, "load", () =>
        refresh_texture(image_target),
      );
      listen_for_image(image_target, "error", () =>
        handle_image_error(image_target),
      );
    }

    const handle_banner_resize = () => {
      if (!is_alive()) {
        dispose();
        return;
      }
      sync_viewport_breakout(banner);
      refresh_texture(dom_image);
    };
    if (typeof ResizeObserver === "function") {
      state.breakout_observer = new ResizeObserver(handle_banner_resize);
      state.breakout_observer.observe(banner.parentElement ?? banner);
    }
    if (typeof window.addEventListener === "function") {
      window.addEventListener("resize", handle_banner_resize, {
        passive: true,
      });
      listener_cleanups.push(() =>
        window.removeEventListener("resize", handle_banner_resize),
      );
    }
    sync_viewport_breakout(banner);

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
