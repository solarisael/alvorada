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
    mx_fractal_noise_float,
    mx_noise_float,
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
  const light_offset = vec2(
    banner_uv.x.sub(0.78).mul(canvas_aspect).mul(0.55),
    banner_uv.y.sub(0.72).mul(0.95),
  );
  const light_reach = smoothstep(0.08, 0.92, length(light_offset)).oneMinus();
  const phase_alignment = pow(light_reach, 2.2).mul(0.72).add(0.28);
  const height_density = float(0.38).add(exp(banner_uv.y.mul(-1.15)).mul(0.62));

  // Five virtual depth slices form a shallow volume around the aperture.
  const bank_noise = mx_fractal_noise_float(
    vec3(
      fog_space.x.mul(0.85).add(time.mul(0.03)),
      fog_space.y.mul(1.05).sub(time.mul(0.012)),
      time.mul(0.008),
    ),
    3,
    2.01,
    0.6,
  )
    .mul(0.5)
    .add(0.5);
  const bank_envelope = smoothstep(0.32, 0.68, bank_noise).mul(0.9).add(0.1);

  const sample_volume_density = (position, depth) => {
    const broad_noise = mx_fractal_noise_float(
      position.mul(vec3(1.15, 1.35, 0.72)),
      3,
      2.03,
      0.58,
    )
      .mul(0.5)
      .add(0.5);
    const detail_noise = mx_fractal_noise_float(
      position.mul(vec3(2.65, 2.2, 1.75)).add(vec3(4.1, -2.7, 1.3)),
      2,
      2.17,
      0.5,
    )
      .mul(0.5)
      .add(0.5);
    const billows = broad_noise.mul(0.78).add(detail_noise.mul(0.22));
    const soft_bank = smoothstep(0.4, 0.7, billows);
    const depth_envelope = sin(depth.mul(Math.PI)).mul(0.24).add(0.76);
    return soft_bank.mul(height_density).mul(depth_envelope).mul(bank_envelope);
  };

  // Integrate scattering and Beer-Lambert transmittance front to back.
  const volume_steps = 5;
  const step_length = 1 / volume_steps;
  let ray_transmittance = float(1);
  let scattered_light = vec3(0);

  for (let step = 0; step < volume_steps; step += 1) {
    const depth = float((step + 0.5) * step_length);
    const volume_position = vec3(
      fog_space.x
        .mul(1.55)
        .add(depth.mul(0.14))
        .add(time.mul(mix(0.028, 0.052, depth))),
      fog_space.y
        .mul(1.85)
        .sub(depth.mul(0.06))
        .sub(time.mul(mix(0.012, 0.024, depth))),
      depth.mul(1.1).add(time.mul(mix(0.006, 0.014, depth))),
    );
    const density = sample_volume_density(volume_position, depth).mul(
      mix(0.82, 1.18, depth),
    );
    const light_probe_density = mx_noise_float(
      volume_position.add(vec3(0.18, 0.14, -0.08)).mul(vec3(1.25, 1.35, 0.8)),
    )
      .mul(0.5)
      .add(0.5);
    const light_visibility = exp(
      density.add(light_probe_density.mul(0.6)).mul(-0.85),
    );
    const direct_scatter = light_visibility
      .mul(light_reach)
      .mul(phase_alignment);
    const multiple_scatter = min(1, direct_scatter.add(density.mul(0.22)));
    const slice_color = mix(
      vec3(0.64, 0.62, 0.59),
      vec3(1, 0.91, 0.75),
      multiple_scatter,
    );
    const slice_alpha = exp(density.mul(step_length * -1.35)).oneMinus();

    scattered_light = scattered_light.add(
      slice_color.mul(slice_alpha).mul(ray_transmittance),
    );
    ray_transmittance = ray_transmittance.mul(slice_alpha.oneMinus());
  }

  const aperture_shift = ray_transmittance.sub(0.55).mul(0.12);
  const moving_round_outer = smoothstep(
    broken_edge.sub(0.16).add(aperture_shift),
    broken_edge.add(0.12).add(aperture_shift),
    round_distance,
  ).oneMinus();
  const moving_round_alpha = max(moving_round_outer, round_center);
  const moving_side_alpha = smoothstep(
    stained_side.sub(0.18).add(aperture_shift),
    stained_side.add(0.16).add(aperture_shift),
    side_distance,
  ).oneMinus();
  const moving_top_shift = aperture_shift.mul(0.45);
  const moving_top_alpha = smoothstep(
    float(0.78).add(moving_top_shift),
    float(1.01).add(moving_top_shift),
    banner_uv.y.add(edge_broad.sub(0.5).mul(0.035)),
  ).oneMinus();
  const moving_bottom_alpha = smoothstep(
    bottom_edge.sub(0.12).sub(moving_top_shift),
    bottom_edge.add(0.11).sub(moving_top_shift),
    banner_uv.y,
  );
  const moving_inverted_bowl_alpha = moving_side_alpha
    .mul(moving_top_alpha)
    .mul(moving_bottom_alpha);
  const moving_aperture_alpha = mix(
    moving_round_alpha,
    moving_inverted_bowl_alpha,
    variant,
  ).mul(smoothstep(0, 0.052, border_distance));
  const revealed_aperture_alpha = mix(
    aperture_alpha,
    moving_aperture_alpha,
    0.88,
  );

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
  const volume_alpha = ray_transmittance.oneMinus();
  const image_alpha = revealed_aperture_alpha.mul(source_color.a);
  const fog_opacity = volume_alpha
    .mul(fog_region)
    .mul(image_alpha.oneMinus())
    .mul(0.88);
  const combined_alpha = min(1, image_alpha.add(fog_opacity));
  const resolved_fog_color = scattered_light.div(max(volume_alpha, 0.0001));
  const premultiplied_color = base_color
    .mul(image_alpha)
    .add(resolved_fog_color.mul(fog_opacity));
  const fog_color = premultiplied_color.div(max(combined_alpha, 0.0001));

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
