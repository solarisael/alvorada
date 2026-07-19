const BANNER_SELECTOR = "[data-sol-vision-banner]";
const CANVAS_SELECTOR = "[data-sol-vision-banner-canvas]";
const active_banners = new WeakMap();

const vertex_source = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const fragment_source = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform vec2 u_canvas_size;
uniform vec2 u_image_size;
uniform float u_time;
uniform float u_motion;
uniform float u_variant;
in vec2 v_uv;
out vec4 out_color;

float hash(vec2 point) {
  return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 point) {
  vec2 cell = floor(point);
  vec2 local = fract(point);
  local = local * local * (3.0 - 2.0 * local);
  return mix(
    mix(hash(cell), hash(cell + vec2(1.0, 0.0)), local.x),
    mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0)), local.x),
    local.y
  );
}

float fbm(vec2 point) {
  float value = 0.0;
  float amplitude = 0.52;
  mat2 turn = mat2(0.82, -0.57, 0.57, 0.82);
  for (int octave = 0; octave < 5; octave += 1) {
    value += amplitude * noise(point);
    point = turn * point * 2.03 + 13.17;
    amplitude *= 0.5;
  }
  return value;
}

vec2 cover_uv(vec2 uv) {
  float canvas_aspect = u_canvas_size.x / u_canvas_size.y;
  float image_aspect = u_image_size.x / u_image_size.y;
  vec2 scale = vec2(1.0);
  if (canvas_aspect > image_aspect) {
    scale.y = image_aspect / canvas_aspect;
  } else {
    scale.x = canvas_aspect / image_aspect;
  }
  return (uv - 0.5) * scale + 0.5;
}

void main() {
  vec2 centered = v_uv - vec2(0.5, 0.48);
  centered.x *= u_canvas_size.x / u_canvas_size.y * 0.62;

  float time = u_time * 0.000035 * u_motion;
  vec2 stain_space = centered * vec2(4.2, 5.0);
  float broad = fbm(stain_space + vec2(time, -time * 0.63));
  float detail = fbm(stain_space * 2.7 + broad * 2.1 - vec2(time * 1.7, 0.0));
  float alpha;
  if (u_variant > 0.5) {
    float downward = 1.0 - v_uv.y;
    float opening = pow(smoothstep(0.015, 0.92, downward), 0.68);
    float half_width = mix(0.235, 0.6, opening);
    float side_distance = abs(v_uv.x - 0.5) / half_width;
    float stained_side = 0.93 + (broad - 0.5) * 0.16 + (detail - 0.5) * 0.07;
    float side_alpha = 1.0 - smoothstep(stained_side - 0.095, stained_side + 0.095, side_distance);
    float top_alpha = 1.0 - smoothstep(0.88, 0.985, v_uv.y + (broad - 0.5) * 0.035);
    float bottom_edge = 0.045 + (broad - 0.5) * 0.055 + (detail - 0.5) * 0.025;
    float bottom_alpha = smoothstep(bottom_edge - 0.045, bottom_edge + 0.075, v_uv.y);
    alpha = side_alpha * top_alpha * bottom_alpha;
  } else {
    float distance_field = length(centered * vec2(0.92, 1.08));
    float broken_edge = 0.405 + (broad - 0.5) * 0.085 + (detail - 0.5) * 0.036;
    alpha = 1.0 - smoothstep(broken_edge - 0.068, broken_edge + 0.068, distance_field);
    float clear_center = 1.0 - smoothstep(0.205, 0.295, distance_field);
    alpha = max(alpha, clear_center);
  }
  float border_distance = min(min(v_uv.x, 1.0 - v_uv.x), min(v_uv.y, 1.0 - v_uv.y));
  float border_cut = smoothstep(0.0, 0.052, border_distance);
  alpha *= border_cut;
  alpha = alpha < 0.003 ? 0.0 : alpha;

  vec2 image_uv = cover_uv(v_uv);
  vec4 color = texture(u_image, image_uv);
  color.rgb *= vec3(0.83, 0.86, 0.9);
  color.rgb = mix(color.rgb, color.rgb * vec3(0.86, 0.91, 0.96), broad * 0.22);
  out_color = vec4(color.rgb * alpha, alpha);
}`;

const compile_shader = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

const create_program = (gl) => {
  const vertex = compile_shader(gl, gl.VERTEX_SHADER, vertex_source);
  const fragment = compile_shader(gl, gl.FRAGMENT_SHADER, fragment_source);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
};

const resize_canvas = (canvas, gl) => {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  gl.viewport(0, 0, width, height);
  return [width, height];
};

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

const hydrating_banners = new WeakSet();

const hydrate_banner = (banner) => {
  if (active_banners.has(banner) || hydrating_banners.has(banner)) return;
  const canvas = banner.querySelector(CANVAS_SELECTOR);
  if (!(canvas instanceof HTMLCanvasElement)) return;
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
  });
  if (!gl) return;
  const program = create_program(gl);
  if (!program) return;

  hydrating_banners.add(banner);
  const position = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, position);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const position_location = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(position_location);
  gl.vertexAttribPointer(position_location, 2, gl.FLOAT, false, 0, 0);

  const fallback_image = banner.querySelector(".sol__vision_banner_image");
  const image = new Image();
  image.decoding = "async";
  let initialized = false;
  const initialize = () => {
    if (initialized) return;
    initialized = true;
    hydrating_banners.delete(banner);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    const reduced_motion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const state = { banner, canvas, gl, program, image, frame: 0 };
    active_banners.set(banner, state);
    banner.classList.add("sol__vision_banner_webgl_ready");
    sync_viewport_breakout(banner);
    const breakout_observer =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(() => sync_viewport_breakout(banner))
        : null;
    breakout_observer?.observe(banner.parentElement ?? banner);
    state.breakoutObserver = breakout_observer;

    const draw = (time) => {
      if (!document.contains(banner)) {
        state.breakoutObserver?.disconnect();
        active_banners.delete(banner);
        return;
      }
      const size = resize_canvas(canvas, gl);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(
        gl.getUniformLocation(program, "u_canvas_size"),
        size[0],
        size[1],
      );
      gl.uniform2f(
        gl.getUniformLocation(program, "u_image_size"),
        image.naturalWidth,
        image.naturalHeight,
      );
      gl.uniform1f(gl.getUniformLocation(program, "u_time"), time);
      gl.uniform1f(
        gl.getUniformLocation(program, "u_motion"),
        reduced_motion ? 0 : 1,
      );
      gl.uniform1f(
        gl.getUniformLocation(program, "u_variant"),
        banner.dataset.visionVariant === "inverted-bowl" ? 1 : 0,
      );
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      state.frame = requestAnimationFrame(draw);
    };
    state.frame = requestAnimationFrame(draw);
  };
  image.onload = initialize;
  image.onerror = () => hydrating_banners.delete(banner);
  image.src = fallback_image?.currentSrc || fallback_image?.src || "";
  if (image.complete && image.naturalWidth > 0) initialize();
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
