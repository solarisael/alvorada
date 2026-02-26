const window_any = /** @type {any} */ (globalThis);

const MAX_DPR = 2;
const HOVER_INTENT_MS = 280;
const INACTIVITY_TIMEOUT_MS = 900;
const DRAG_THRESHOLD_PX = 5;
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 8;
const ATTRACTOR_STRENGTH = 0.03;
const INERTIA_DAMPING = 0.988;
const INERTIA_STOP_PX = 0.008;
const ARROW_PAN_NUDGE = 32;
const HORIZONTAL_RANGE_MULTIPLIER = 3;
const VERTICAL_RANGE_MULTIPLIER = 2;
const WORLD_BOUNDS_PADDING_RATIO_X = 0.42 * HORIZONTAL_RANGE_MULTIPLIER;
const WORLD_BOUNDS_PADDING_MIN_X = 18 * HORIZONTAL_RANGE_MULTIPLIER;
const WORLD_BOUNDS_PADDING_MAX_X = 96 * HORIZONTAL_RANGE_MULTIPLIER;
const WORLD_BOUNDS_PADDING_RATIO_Y = 0.28 * VERTICAL_RANGE_MULTIPLIER;
const WORLD_BOUNDS_PADDING_MIN_Y = 12 * VERTICAL_RANGE_MULTIPLIER;
const WORLD_BOUNDS_PADDING_MAX_Y = 64 * VERTICAL_RANGE_MULTIPLIER;
const EDGE_IDLE_RETURN_DELAY_MS = 1400;
const EDGE_PULL_STRENGTH = 0.0025;
const EDGE_PULL_MAX_STEP_X = 0.32;
const EDGE_PULL_MAX_STEP_Y = 0.24;
const EDGE_PULL_DEADZONE = 0.05;
const EDGE_SOFT_OVERSCROLL_X = 72 * HORIZONTAL_RANGE_MULTIPLIER;
const EDGE_HARD_OVERSCROLL_X = 132 * HORIZONTAL_RANGE_MULTIPLIER;
const EDGE_SOFT_OVERSCROLL_Y = 48 * VERTICAL_RANGE_MULTIPLIER;
const EDGE_HARD_OVERSCROLL_Y = 88 * VERTICAL_RANGE_MULTIPLIER;
const EDGE_RESIST_K = 0.085;
const OUTSIDE_VELOCITY_DAMP_MULT = 0.9;
const HOVER_PREVIEW_OFFSET_X = 20;
const HOVER_PREVIEW_OFFSET_Y = 18;
const HOVER_PREVIEW_MARGIN = 10;

const THREAD_RGB = {
  cinza: [242, 246, 255],
  suul: [77, 214, 107],
  alvorada: [255, 159, 46],
};

const clamp = (value, min_value, max_value) => {
  return Math.min(max_value, Math.max(min_value, value));
};

const to_rgb = (rgb_text = "214 217 226") => {
  const [r, g, b] = String(rgb_text)
    .split(/\s+/)
    .map((value) => Number(value || 0));

  return [r || 214, g || 217, b || 226];
};

const rgba = (rgb_values, alpha) => {
  return [rgb_values[0] / 255, rgb_values[1] / 255, rgb_values[2] / 255, alpha];
};

const compile_shader = (gl, shader_type, source) => {
  const shader = gl.createShader(shader_type);

  if (!shader) {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
};

const create_program = (gl, vertex_source, fragment_source) => {
  const vertex_shader = compile_shader(gl, gl.VERTEX_SHADER, vertex_source);
  const fragment_shader = compile_shader(
    gl,
    gl.FRAGMENT_SHADER,
    fragment_source,
  );

  if (!vertex_shader || !fragment_shader) {
    return null;
  }

  const program = gl.createProgram();

  if (!program) {
    return null;
  }

  gl.attachShader(program, vertex_shader);
  gl.attachShader(program, fragment_shader);
  gl.linkProgram(program);

  gl.deleteShader(vertex_shader);
  gl.deleteShader(fragment_shader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  return program;
};

const create_storage_key = (root_node) => {
  return `${window.location.pathname}::${root_node.id || "rubedo_constellation_map"}`;
};

const get_store = () => {
  if (!window_any.__rubedo_constellation_view_state) {
    window_any.__rubedo_constellation_view_state = {};
  }

  return window_any.__rubedo_constellation_view_state;
};

const create_view_state = (payload) => {
  const active_node = (payload.nodes || []).find((node_entry) => {
    return (
      node_entry.node_id ===
      `${payload.active_chapter_id}:${payload.active_thread_key}`
    );
  });

  return {
    center_x: active_node?.x ?? payload.viewbox_width / 2,
    center_y: active_node?.y ?? payload.viewbox_height / 2,
    pan_x: 0,
    pan_y: 0,
    zoom: 1,
  };
};

const slider_to_zoom = (slider_value) => {
  const normalized = clamp(Number(slider_value), 0, 1);
  return MIN_ZOOM * (MAX_ZOOM / MIN_ZOOM) ** normalized;
};

const zoom_to_slider = (zoom_value) => {
  const normalized_zoom = clamp(zoom_value, MIN_ZOOM, MAX_ZOOM);
  return Math.log(normalized_zoom / MIN_ZOOM) / Math.log(MAX_ZOOM / MIN_ZOOM);
};

const compute_world_bounds = (payload) => {
  const nodes = (payload.nodes || []).filter(
    (node_entry) => node_entry.is_clickable,
  );

  if (!nodes.length) {
    return {
      min_x: 0,
      max_x: payload.viewbox_width,
      min_y: 0,
      max_y: payload.viewbox_height,
    };
  }

  let min_x = Number.POSITIVE_INFINITY;
  let max_x = Number.NEGATIVE_INFINITY;
  let min_y = Number.POSITIVE_INFINITY;
  let max_y = Number.NEGATIVE_INFINITY;

  for (const node_entry of nodes) {
    min_x = Math.min(min_x, node_entry.x);
    max_x = Math.max(max_x, node_entry.x);
    min_y = Math.min(min_y, node_entry.y);
    max_y = Math.max(max_y, node_entry.y);
  }

  return { min_x, max_x, min_y, max_y };
};

const compute_bounds_limits = (world_bounds, zoom, canvas) => {
  const half_world_width = canvas.width / (2 * zoom);
  const half_world_height = canvas.height / (2 * zoom);
  const world_span_x = world_bounds.max_x - world_bounds.min_x;
  const world_span_y = world_bounds.max_y - world_bounds.min_y;

  const padding_x = clamp(
    world_span_x * WORLD_BOUNDS_PADDING_RATIO_X,
    WORLD_BOUNDS_PADDING_MIN_X,
    WORLD_BOUNDS_PADDING_MAX_X,
  );
  const padding_y = clamp(
    world_span_y * WORLD_BOUNDS_PADDING_RATIO_Y,
    WORLD_BOUNDS_PADDING_MIN_Y,
    WORLD_BOUNDS_PADDING_MAX_Y,
  );

  return {
    min_x: world_bounds.min_x - padding_x + half_world_width,
    max_x: world_bounds.max_x + padding_x - half_world_width,
    min_y: world_bounds.min_y - padding_y + half_world_height,
    max_y: world_bounds.max_y + padding_y - half_world_height,
  };
};

const world_to_screen = (x, y, view_state, canvas) => {
  const cx = canvas.width * 0.5;
  const cy = canvas.height * 0.5;

  return {
    x: (x - view_state.center_x) * view_state.zoom + cx + view_state.pan_x,
    y: (y - view_state.center_y) * view_state.zoom + cy + view_state.pan_y,
  };
};

const screen_to_world = (x, y, view_state, canvas) => {
  const cx = canvas.width * 0.5;
  const cy = canvas.height * 0.5;

  return {
    x: (x - cx - view_state.pan_x) / view_state.zoom + view_state.center_x,
    y: (y - cy - view_state.pan_y) / view_state.zoom + view_state.center_y,
  };
};

const find_nearest_world_node = (payload, world_x, world_y) => {
  const nodes = (payload.nodes || []).filter(
    (node_entry) => node_entry.is_clickable,
  );

  let nearest = null;
  let nearest_distance = Number.POSITIVE_INFINITY;

  for (const node_entry of nodes) {
    const distance = Math.hypot(world_x - node_entry.x, world_y - node_entry.y);

    if (distance < nearest_distance) {
      nearest = node_entry;
      nearest_distance = distance;
    }
  }

  return {
    node: nearest,
    distance: nearest_distance,
  };
};

const apply_soft_bounds = (
  view_state,
  canvas,
  world_bounds,
  allow_pullback,
) => {
  const effective_center_x =
    view_state.center_x - view_state.pan_x / view_state.zoom;
  const effective_center_y =
    view_state.center_y - view_state.pan_y / view_state.zoom;

  const limits = compute_bounds_limits(world_bounds, view_state.zoom, canvas);

  const target_center_x =
    limits.min_x <= limits.max_x
      ? clamp(effective_center_x, limits.min_x, limits.max_x)
      : (world_bounds.min_x + world_bounds.max_x) * 0.5;
  const target_center_y =
    limits.min_y <= limits.max_y
      ? clamp(effective_center_y, limits.min_y, limits.max_y)
      : (world_bounds.min_y + world_bounds.max_y) * 0.5;

  if (!allow_pullback) {
    return;
  }

  const delta_x = target_center_x - effective_center_x;
  const delta_y = target_center_y - effective_center_y;
  const pull_x =
    Math.abs(delta_x) <= EDGE_PULL_DEADZONE
      ? 0
      : clamp(
          delta_x * EDGE_PULL_STRENGTH,
          -EDGE_PULL_MAX_STEP_X,
          EDGE_PULL_MAX_STEP_X,
        );
  const pull_y =
    Math.abs(delta_y) <= EDGE_PULL_DEADZONE
      ? 0
      : clamp(
          delta_y * EDGE_PULL_STRENGTH,
          -EDGE_PULL_MAX_STEP_Y,
          EDGE_PULL_MAX_STEP_Y,
        );

  view_state.center_x += pull_x;
  view_state.center_y += pull_y;
};

const compute_axis_resistance = (overscroll_world, axis) => {
  const soft_limit =
    axis === "x" ? EDGE_SOFT_OVERSCROLL_X : EDGE_SOFT_OVERSCROLL_Y;
  const hard_limit =
    axis === "x" ? EDGE_HARD_OVERSCROLL_X : EDGE_HARD_OVERSCROLL_Y;

  if (overscroll_world <= soft_limit) {
    return 1;
  }

  if (overscroll_world >= hard_limit) {
    return 0;
  }

  const outside_after_soft = overscroll_world - soft_limit;
  return 1 / (1 + EDGE_RESIST_K * outside_after_soft);
};

const compute_overscroll = (view_state, canvas, world_bounds) => {
  const limits = compute_bounds_limits(world_bounds, view_state.zoom, canvas);
  const effective_center_x =
    view_state.center_x - view_state.pan_x / view_state.zoom;
  const effective_center_y =
    view_state.center_y - view_state.pan_y / view_state.zoom;

  return {
    left: Math.max(0, limits.min_x - effective_center_x),
    right: Math.max(0, effective_center_x - limits.max_x),
    top: Math.max(0, limits.min_y - effective_center_y),
    bottom: Math.max(0, effective_center_y - limits.max_y),
  };
};

const constrain_drag_delta = (view_state, canvas, world_bounds, dx, dy) => {
  const overscroll = compute_overscroll(view_state, canvas, world_bounds);

  let next_dx = dx;
  let next_dy = dy;

  if (dx > 0) {
    next_dx = dx * compute_axis_resistance(overscroll.left, "x");
  } else if (dx < 0) {
    next_dx = dx * compute_axis_resistance(overscroll.right, "x");
  }

  if (dy > 0) {
    next_dy = dy * compute_axis_resistance(overscroll.top, "y");
  } else if (dy < 0) {
    next_dy = dy * compute_axis_resistance(overscroll.bottom, "y");
  }

  return {
    dx: next_dx,
    dy: next_dy,
  };
};

const create_webgl_renderer = (canvas, payload, view_state) => {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
  });

  if (!gl) {
    return null;
  }

  const line_program = create_program(
    gl,
    `#version 300 es
    in vec2 a_position;
    uniform vec2 u_canvas_size;
    void main() {
      vec2 ndc = vec2(
        (a_position.x / u_canvas_size.x) * 2.0 - 1.0,
        1.0 - (a_position.y / u_canvas_size.y) * 2.0
      );
      gl_Position = vec4(ndc, 0.0, 1.0);
    }`,
    `#version 300 es
    precision highp float;
    uniform vec4 u_color;
    out vec4 out_color;
    void main() {
      out_color = u_color;
    }`,
  );

  const point_program = create_program(
    gl,
    `#version 300 es
    in vec2 a_position;
    in float a_size;
    uniform vec2 u_canvas_size;
    void main() {
      vec2 ndc = vec2(
        (a_position.x / u_canvas_size.x) * 2.0 - 1.0,
        1.0 - (a_position.y / u_canvas_size.y) * 2.0
      );
      gl_Position = vec4(ndc, 0.0, 1.0);
      gl_PointSize = a_size;
    }`,
    `#version 300 es
    precision highp float;
    uniform vec4 u_color;
    uniform float u_softness;
    out vec4 out_color;
    void main() {
      vec2 p = gl_PointCoord * 2.0 - 1.0;
      float d = length(p);
      if (d > 1.0) {
        discard;
      }
      float alpha = smoothstep(1.0, 1.0 - u_softness, d);
      out_color = vec4(u_color.rgb, u_color.a * (1.0 - alpha));
    }`,
  );

  const ring_program = create_program(
    gl,
    `#version 300 es
    in vec2 a_position;
    in float a_size;
    uniform vec2 u_canvas_size;
    void main() {
      vec2 ndc = vec2(
        (a_position.x / u_canvas_size.x) * 2.0 - 1.0,
        1.0 - (a_position.y / u_canvas_size.y) * 2.0
      );
      gl_Position = vec4(ndc, 0.0, 1.0);
      gl_PointSize = a_size;
    }`,
    `#version 300 es
    precision highp float;
    uniform vec4 u_color;
    uniform float u_thickness;
    out vec4 out_color;
    void main() {
      vec2 p = gl_PointCoord * 2.0 - 1.0;
      float d = length(p);
      float inner = 1.0 - u_thickness;
      if (d > 1.0 || d < inner) {
        discard;
      }
      out_color = u_color;
    }`,
  );

  const tex_program = create_program(
    gl,
    `#version 300 es
    in vec2 a_position;
    in float a_size;
    uniform vec2 u_canvas_size;
    void main() {
      vec2 ndc = vec2(
        (a_position.x / u_canvas_size.x) * 2.0 - 1.0,
        1.0 - (a_position.y / u_canvas_size.y) * 2.0
      );
      gl_Position = vec4(ndc, 0.0, 1.0);
      gl_PointSize = a_size;
    }`,
    `#version 300 es
    precision highp float;
    uniform sampler2D u_texture;
    out vec4 out_color;
    void main() {
      vec2 p = gl_PointCoord * 2.0 - 1.0;
      if (length(p) > 1.0) {
        discard;
      }
      vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
      out_color = texture(u_texture, uv);
    }`,
  );

  if (!line_program || !point_program || !ring_program || !tex_program) {
    return null;
  }

  const line_buffer = gl.createBuffer();
  const point_buffer = gl.createBuffer();
  const textures = new Map();
  const clickable_nodes = (payload.nodes || []).filter(
    (node_entry) => node_entry.is_clickable,
  );

  const transform_point = (x, y) => {
    return world_to_screen(x, y, view_state, canvas);
  };

  const draw_lines = (edges, rgb_values, alpha) => {
    if (!edges.length || !line_buffer) {
      return;
    }

    const vertices = new Float32Array(edges.length * 4);

    for (let edge_index = 0; edge_index < edges.length; edge_index += 1) {
      const edge_entry = edges[edge_index];
      const p1 = transform_point(edge_entry.x1, edge_entry.y1);
      const p2 = transform_point(edge_entry.x2, edge_entry.y2);
      const base = edge_index * 4;

      vertices[base] = p1.x;
      vertices[base + 1] = p1.y;
      vertices[base + 2] = p2.x;
      vertices[base + 3] = p2.y;
    }

    gl.useProgram(line_program);
    gl.bindBuffer(gl.ARRAY_BUFFER, line_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);

    const pos = gl.getAttribLocation(line_program, "a_position");
    const size = gl.getUniformLocation(line_program, "u_canvas_size");
    const color = gl.getUniformLocation(line_program, "u_color");

    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(size, canvas.width, canvas.height);
    gl.uniform4f(color, ...rgba(rgb_values, alpha));
    gl.drawArrays(gl.LINES, 0, vertices.length / 2);
    gl.disableVertexAttribArray(pos);
  };

  const draw_points = (
    nodes,
    radius_getter,
    rgb_values,
    alpha,
    softness = 0.6,
  ) => {
    if (!nodes.length || !point_buffer) {
      return;
    }

    const values = new Float32Array(nodes.length * 3);

    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes[index];
      const p = transform_point(node.x, node.y);
      const base = index * 3;

      values[base] = p.x;
      values[base + 1] = p.y;
      values[base + 2] = Math.max(2, radius_getter(node) * view_state.zoom * 2);
    }

    gl.useProgram(point_program);
    gl.bindBuffer(gl.ARRAY_BUFFER, point_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, values, gl.STREAM_DRAW);

    const pos = gl.getAttribLocation(point_program, "a_position");
    const size = gl.getAttribLocation(point_program, "a_size");
    const canvas_loc = gl.getUniformLocation(point_program, "u_canvas_size");
    const color = gl.getUniformLocation(point_program, "u_color");
    const soft = gl.getUniformLocation(point_program, "u_softness");

    gl.enableVertexAttribArray(pos);
    gl.enableVertexAttribArray(size);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 12, 0);
    gl.vertexAttribPointer(size, 1, gl.FLOAT, false, 12, 8);
    gl.uniform2f(canvas_loc, canvas.width, canvas.height);
    gl.uniform4f(color, ...rgba(rgb_values, alpha));
    gl.uniform1f(soft, softness);
    gl.drawArrays(gl.POINTS, 0, nodes.length);
    gl.disableVertexAttribArray(pos);
    gl.disableVertexAttribArray(size);
  };

  const draw_rings = (
    nodes,
    radius_getter,
    rgb_values,
    alpha,
    thickness = 0.18,
  ) => {
    if (!nodes.length || !point_buffer) {
      return;
    }

    const values = new Float32Array(nodes.length * 3);

    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes[index];
      const p = transform_point(node.x, node.y);
      const base = index * 3;

      values[base] = p.x;
      values[base + 1] = p.y;
      values[base + 2] = Math.max(2, radius_getter(node) * view_state.zoom * 2);
    }

    gl.useProgram(ring_program);
    gl.bindBuffer(gl.ARRAY_BUFFER, point_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, values, gl.STREAM_DRAW);

    const pos = gl.getAttribLocation(ring_program, "a_position");
    const size = gl.getAttribLocation(ring_program, "a_size");
    const canvas_loc = gl.getUniformLocation(ring_program, "u_canvas_size");
    const color = gl.getUniformLocation(ring_program, "u_color");
    const thick = gl.getUniformLocation(ring_program, "u_thickness");

    gl.enableVertexAttribArray(pos);
    gl.enableVertexAttribArray(size);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 12, 0);
    gl.vertexAttribPointer(size, 1, gl.FLOAT, false, 12, 8);
    gl.uniform2f(canvas_loc, canvas.width, canvas.height);
    gl.uniform4f(color, ...rgba(rgb_values, alpha));
    gl.uniform1f(thick, thickness);
    gl.drawArrays(gl.POINTS, 0, nodes.length);
    gl.disableVertexAttribArray(pos);
    gl.disableVertexAttribArray(size);
  };

  const load_textures = async () => {
    const unique_sources = [
      ...new Set(
        clickable_nodes
          .map((node_entry) => node_entry.image_src)
          .filter(Boolean),
      ),
    ];

    await Promise.all(
      unique_sources.map(async (source) => {
        const image = new Image();
        image.decoding = "async";
        image.src = source;
        await image.decode().catch(() => null);

        if (!image.complete || image.naturalWidth === 0) {
          return;
        }

        const texture = gl.createTexture();

        if (!texture) {
          return;
        }

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          image,
        );

        textures.set(source, texture);
      }),
    );
  };

  const draw_textures = () => {
    if (!point_buffer) {
      return;
    }

    gl.useProgram(tex_program);
    const pos = gl.getAttribLocation(tex_program, "a_position");
    const size = gl.getAttribLocation(tex_program, "a_size");
    const canvas_loc = gl.getUniformLocation(tex_program, "u_canvas_size");
    const tex_loc = gl.getUniformLocation(tex_program, "u_texture");

    gl.uniform2f(canvas_loc, canvas.width, canvas.height);
    gl.uniform1i(tex_loc, 0);

    for (const node of clickable_nodes) {
      if (!node.image_src || !textures.has(node.image_src)) {
        continue;
      }

      const p = transform_point(node.x, node.y);
      const values = new Float32Array([
        p.x,
        p.y,
        Math.max(2, node.core_radius * view_state.zoom * 2),
      ]);

      gl.bindBuffer(gl.ARRAY_BUFFER, point_buffer);
      gl.bufferData(gl.ARRAY_BUFFER, values, gl.STREAM_DRAW);
      gl.enableVertexAttribArray(pos);
      gl.enableVertexAttribArray(size);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 12, 0);
      gl.vertexAttribPointer(size, 1, gl.FLOAT, false, 12, 8);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures.get(node.image_src));
      gl.drawArrays(gl.POINTS, 0, 1);
      gl.disableVertexAttribArray(pos);
      gl.disableVertexAttribArray(size);
    }
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  const render = (active_node_id, hover_node_id) => {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    draw_lines(payload.edges.branch || [], [165, 170, 184], 0.26);
    draw_lines(payload.edges.trunk || [], [242, 246, 255], 0.64);
    draw_lines(payload.edges.connectors || [], [154, 158, 168], 0.22);

    for (const edge of payload.edges.canonical || []) {
      draw_lines([edge], THREAD_RGB[edge.thread_key] || [214, 217, 226], 0.42);
    }

    for (const node of clickable_nodes) {
      draw_points(
        [node],
        (entry) => entry.halo_radius * 1.3,
        to_rgb(node.neon_rgb),
        0.2,
        0.72,
      );
    }

    draw_textures();

    for (const node of clickable_nodes) {
      draw_rings(
        [node],
        (entry) => entry.highlight_radius,
        to_rgb(node.neon_rgb),
        0.58,
        0.18,
      );
    }

    const focus_nodes = clickable_nodes.filter((node) => {
      return node.node_id === active_node_id || node.node_id === hover_node_id;
    });

    for (const node of focus_nodes) {
      draw_points(
        [node],
        (entry) => entry.halo_radius * 1.44,
        [255, 255, 255],
        0.12,
        0.82,
      );
      draw_rings(
        [node],
        (entry) => entry.highlight_radius,
        [255, 255, 255],
        0.92,
        0.2,
      );

      const angle = ((Number(node.trail_rotation) || 18) * Math.PI) / 180;
      const spark = {
        ...node,
        x: node.x + Math.cos(angle) * node.highlight_radius,
        y: node.y + Math.sin(angle) * node.highlight_radius,
      };

      draw_points([spark], () => 0.72, [255, 255, 255], 1, 0.56);
    }
  };

  return {
    type: "webgl",
    resize,
    render,
    load_textures,
  };
};

const create_canvas2d_renderer = (canvas, payload, view_state) => {
  const context = canvas.getContext("2d", { alpha: true });

  if (!context) {
    return null;
  }

  const image_map = new Map();
  const clickable_nodes = (payload.nodes || []).filter(
    (node_entry) => node_entry.is_clickable,
  );

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  };

  const load_textures = async () => {
    const sources = [
      ...new Set(
        clickable_nodes
          .map((node_entry) => node_entry.image_src)
          .filter(Boolean),
      ),
    ];

    await Promise.all(
      sources.map(async (source) => {
        const image = new Image();
        image.decoding = "async";
        image.src = source;
        await image.decode().catch(() => null);

        if (image.complete && image.naturalWidth > 0) {
          image_map.set(source, image);
        }
      }),
    );
  };

  const draw_line = (edge, stroke_style, width, alpha = 1) => {
    const p1 = world_to_screen(edge.x1, edge.y1, view_state, canvas);
    const p2 = world_to_screen(edge.x2, edge.y2, view_state, canvas);

    context.save();
    context.globalAlpha = alpha;
    context.strokeStyle = stroke_style;
    context.lineWidth = width * view_state.zoom;
    context.beginPath();
    context.moveTo(p1.x, p1.y);
    context.lineTo(p2.x, p2.y);
    context.stroke();
    context.restore();
  };

  const draw_node = (node, is_focus) => {
    const p = world_to_screen(node.x, node.y, view_state, canvas);
    const core_radius = node.core_radius * view_state.zoom;
    const halo_radius = node.halo_radius * view_state.zoom;
    const highlight_radius = node.highlight_radius * view_state.zoom;
    const rgb_values = to_rgb(node.neon_rgb);

    context.save();
    context.strokeStyle = `rgba(${rgb_values[0]},${rgb_values[1]},${rgb_values[2]},${is_focus ? 0.94 : 0.52})`;
    context.lineWidth = is_focus ? 1.4 : 1;
    context.shadowColor = `rgba(${rgb_values[0]},${rgb_values[1]},${rgb_values[2]},${is_focus ? 0.72 : 0.26})`;
    context.shadowBlur = is_focus ? 18 : 8;
    context.beginPath();
    context.arc(p.x, p.y, halo_radius, 0, Math.PI * 2);
    context.stroke();
    context.restore();

    const image = node.image_src ? image_map.get(node.image_src) : null;

    if (image) {
      context.save();
      context.beginPath();
      context.arc(p.x, p.y, core_radius, 0, Math.PI * 2);
      context.clip();
      context.drawImage(
        image,
        p.x - core_radius,
        p.y - core_radius,
        core_radius * 2,
        core_radius * 2,
      );
      context.restore();
    } else {
      context.save();
      context.fillStyle = "rgba(222,226,233,0.82)";
      context.beginPath();
      context.arc(p.x, p.y, core_radius, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    context.save();
    context.strokeStyle = `rgba(255,255,255,${is_focus ? 0.96 : 0.62})`;
    context.lineWidth = is_focus ? 1.3 : 0.9;
    context.beginPath();
    context.arc(p.x, p.y, highlight_radius, 0, Math.PI * 2);
    context.stroke();

    const angle = ((Number(node.trail_rotation) || 18) * Math.PI) / 180;
    const spark_x = p.x + Math.cos(angle) * highlight_radius;
    const spark_y = p.y + Math.sin(angle) * highlight_radius;
    context.fillStyle = "rgba(255,255,255,0.98)";
    context.shadowColor = "rgba(255,255,255,0.82)";
    context.shadowBlur = is_focus ? 14 : 9;
    context.beginPath();
    context.arc(spark_x, spark_y, is_focus ? 2.2 : 1.7, 0, Math.PI * 2);
    context.fill();
    context.restore();
  };

  const render = (active_node_id, hover_node_id) => {
    context.clearRect(0, 0, canvas.width, canvas.height);

    for (const edge of payload.edges.branch || []) {
      draw_line(edge, "rgba(165,170,184,0.28)", 1);
    }

    for (const edge of payload.edges.trunk || []) {
      draw_line(edge, "rgba(242,246,255,0.66)", 1.1);
    }

    for (const edge of payload.edges.connectors || []) {
      draw_line(edge, "rgba(154,158,168,0.2)", 1);
    }

    for (const edge of payload.edges.canonical || []) {
      const rgb = THREAD_RGB[edge.thread_key] || [214, 217, 226];
      draw_line(edge, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.46)`, 1.06);
    }

    for (const node of clickable_nodes) {
      const is_focus =
        node.node_id === active_node_id || node.node_id === hover_node_id;
      draw_node(node, is_focus);
    }
  };

  return {
    type: "canvas2d",
    resize,
    render,
    load_textures,
  };
};

const find_nearest_clickable_node = (
  payload,
  canvas,
  view_state,
  pointer_x,
  pointer_y,
) => {
  const clickable_nodes = (payload.nodes || []).filter(
    (node_entry) => node_entry.is_clickable,
  );

  let nearest = null;
  let nearest_distance = Number.POSITIVE_INFINITY;

  for (const node of clickable_nodes) {
    const p = world_to_screen(node.x, node.y, view_state, canvas);
    const radius = (node.halo_radius + 0.9) * view_state.zoom;
    const distance_sq = (pointer_x - p.x) ** 2 + (pointer_y - p.y) ** 2;

    if (distance_sq <= radius ** 2 && distance_sq < nearest_distance) {
      nearest = node;
      nearest_distance = distance_sq;
    }
  }

  return nearest;
};

const apply_label_visibility = (
  root_node,
  active_node_id,
  hover_node_id,
  view_state,
  canvas,
) => {
  const label_nodes = root_node.querySelectorAll(
    ".rubedo-constellation-node-label",
  );
  const payload_map = root_node.__payload_map;

  label_nodes.forEach((label_node) => {
    const node_id = label_node.getAttribute("data-node-id") || "";
    const node_entry = payload_map?.get(node_id);

    if (!node_entry) {
      return;
    }

    const p = world_to_screen(node_entry.x, node_entry.y, view_state, canvas);
    const left = `${(p.x / canvas.width) * 100}%`;
    const top = `${(p.y / canvas.height) * 100}%`;
    label_node.style.left = left;
    label_node.style.top = top;

    const is_visible = node_id === active_node_id || node_id === hover_node_id;
    label_node.classList.toggle("is-visible", is_visible);
  });
};

const dispatch_map_navigation = (node_entry) => {
  if (!node_entry?.link) {
    return;
  }

  const htmx_api = window_any.htmx;

  if (htmx_api?.ajax) {
    htmx_api.ajax("GET", node_entry.link.hx_get || node_entry.link.href, {
      target: node_entry.link.hx_target || "#rubedo_timeline_interactive",
      select: node_entry.link.hx_select || "#rubedo_timeline_interactive",
      swap: node_entry.link.hx_swap || "morph swap:240ms settle:240ms",
      pushURL: String(node_entry.link.hx_push_url) === "true",
    });
    return;
  }

  if (node_entry.link.href) {
    window.location.href = node_entry.link.href;
  }
};

const dispatch_hover_preview = (node_entry) => {
  if (!node_entry?.hover_preview) {
    return;
  }

  const htmx_api = window_any.htmx;

  if (htmx_api?.ajax) {
    htmx_api.ajax(
      "GET",
      node_entry.hover_preview.hx_get || node_entry.hover_preview.href,
      {
        target:
          node_entry.hover_preview.hx_target ||
          "#rubedo_timeline_hover_preview",
        select:
          node_entry.hover_preview.hx_select ||
          "#rubedo_timeline_hover_preview",
        swap:
          node_entry.hover_preview.hx_swap || "morph swap:180ms settle:120ms",
        pushURL: String(node_entry.hover_preview.hx_push_url) === "true",
      },
    );
  }
};

const init_constellation = async (root_node) => {
  if (
    !(root_node instanceof HTMLElement) ||
    root_node.dataset.canvasBound === "true"
  ) {
    return;
  }

  const canvas = root_node.querySelector(
    ".rubedo-constellation-canvas-surface",
  );
  const payload_script = root_node.querySelector(
    ".rubedo-constellation-payload",
  );
  const zoom_in_button = root_node.querySelector('[data-map-action="zoom_in"]');
  const zoom_out_button = root_node.querySelector(
    '[data-map-action="zoom_out"]',
  );
  const zoom_slider = root_node.querySelector(
    '[data-map-action="zoom_slider"]',
  );
  const center_button = root_node.querySelector(
    '[data-map-action="center_active"]',
  );
  const zoom_badge = root_node.querySelector('[data-map-action="zoom_badge"]');
  const get_hover_preview_node = () => {
    return root_node.querySelector("#rubedo_timeline_hover_preview");
  };

  if (
    !(canvas instanceof HTMLCanvasElement) ||
    !(payload_script instanceof HTMLScriptElement)
  ) {
    return;
  }

  const payload = JSON.parse(payload_script.textContent || "{}");
  const active_node_id = `${payload.active_chapter_id}:${payload.active_thread_key}`;
  const world_bounds = compute_world_bounds(payload);
  const payload_map = new Map(
    (payload.nodes || []).map((node_entry) => [node_entry.node_id, node_entry]),
  );
  root_node.__payload_map = payload_map;

  const store = get_store();
  const storage_key = create_storage_key(root_node);
  const view_state = {
    ...create_view_state(payload),
    ...(store[storage_key] || {}),
  };

  let hover_node_id = "";
  let wheel_intent_active = false;
  let hover_intent_timer = 0;
  let inactivity_timer = 0;
  let is_dragging = false;
  let drag_pointer_id = null;
  let drag_started_at = { x: 0, y: 0 };
  let drag_moved = false;
  let last_pointer = { x: 0, y: 0 };
  let suppress_click_until = 0;
  const pointers = new Map();
  let pinch_state = null;
  let inertia_frame_id = 0;
  let velocity_x = 0;
  let velocity_y = 0;
  let last_hover_preview_node_id = "";
  let last_interaction_ms = performance.now();

  const renderer =
    create_webgl_renderer(canvas, payload, view_state) ||
    create_canvas2d_renderer(canvas, payload, view_state);

  if (!renderer) {
    return;
  }

  const persist_view = () => {
    store[storage_key] = {
      center_x: view_state.center_x,
      center_y: view_state.center_y,
      pan_x: view_state.pan_x,
      pan_y: view_state.pan_y,
      zoom: view_state.zoom,
    };
  };

  const render_now = () => {
    const now_ms = performance.now();
    const inertia_active =
      inertia_frame_id !== 0 ||
      Math.abs(velocity_x) >= INERTIA_STOP_PX ||
      Math.abs(velocity_y) >= INERTIA_STOP_PX;
    const interaction_active =
      is_dragging ||
      pinch_state !== null ||
      pointers.size > 1 ||
      inertia_active;
    const allow_pullback =
      !interaction_active &&
      now_ms - last_interaction_ms >= EDGE_IDLE_RETURN_DELAY_MS;

    apply_soft_bounds(view_state, canvas, world_bounds, allow_pullback);
    renderer.render(active_node_id, hover_node_id);
    apply_label_visibility(
      root_node,
      active_node_id,
      hover_node_id,
      view_state,
      canvas,
    );

    if (zoom_slider instanceof HTMLInputElement) {
      zoom_slider.value = String(zoom_to_slider(view_state.zoom));
    }

    if (zoom_badge instanceof HTMLElement) {
      zoom_badge.classList.toggle("is-active", wheel_intent_active);
    }
  };

  const position_hover_preview = (event) => {
    const hover_preview_node = get_hover_preview_node();

    if (!(hover_preview_node instanceof HTMLElement)) {
      return;
    }

    const bounds = canvas.getBoundingClientRect();
    const preview_width = hover_preview_node.offsetWidth || 280;
    const preview_height = hover_preview_node.offsetHeight || 180;
    const raw_left = event.clientX - bounds.left + HOVER_PREVIEW_OFFSET_X;
    const raw_top = event.clientY - bounds.top + HOVER_PREVIEW_OFFSET_Y;
    const max_left = Math.max(
      HOVER_PREVIEW_MARGIN,
      bounds.width - preview_width - HOVER_PREVIEW_MARGIN,
    );
    const max_top = Math.max(
      HOVER_PREVIEW_MARGIN,
      bounds.height - preview_height - HOVER_PREVIEW_MARGIN,
    );
    const clamped_left = clamp(raw_left, HOVER_PREVIEW_MARGIN, max_left);
    const clamped_top = clamp(raw_top, HOVER_PREVIEW_MARGIN, max_top);

    hover_preview_node.style.left = `${clamped_left}px`;
    hover_preview_node.style.top = `${clamped_top}px`;
  };

  const set_hover_preview = (hovered_node, pointer_event = null) => {
    const hover_preview_node = get_hover_preview_node();

    if (!(hover_preview_node instanceof HTMLElement)) {
      return;
    }

    if (!hovered_node?.is_clickable) {
      hover_preview_node.classList.remove("is-visible");
      last_hover_preview_node_id = "";
      return;
    }

    hover_preview_node.classList.add("is-visible");

    if (pointer_event) {
      position_hover_preview(pointer_event);
    }

    if (last_hover_preview_node_id === hovered_node.node_id) {
      return;
    }

    last_hover_preview_node_id = hovered_node.node_id;
    dispatch_hover_preview(hovered_node);
  };

  const update_size = () => {
    renderer.resize();
    render_now();
  };

  const bump_interaction = () => {
    last_interaction_ms = performance.now();
    wheel_intent_active = true;

    if (inactivity_timer) {
      window.clearTimeout(inactivity_timer);
    }

    inactivity_timer = window.setTimeout(() => {
      wheel_intent_active = false;
      if (zoom_badge instanceof HTMLElement) {
        zoom_badge.classList.remove("is-active");
      }
    }, INACTIVITY_TIMEOUT_MS);
  };

  const stop_inertia = () => {
    if (inertia_frame_id) {
      window.cancelAnimationFrame(inertia_frame_id);
      inertia_frame_id = 0;
    }

    velocity_x = 0;
    velocity_y = 0;
  };

  const run_inertia = () => {
    if (inertia_frame_id) {
      return;
    }

    const step = () => {
      last_interaction_ms = performance.now();
      view_state.pan_x += velocity_x;
      view_state.pan_y += velocity_y;

      const overscroll = compute_overscroll(view_state, canvas, world_bounds);
      const outside_soft_zone =
        overscroll.left > EDGE_SOFT_OVERSCROLL_X ||
        overscroll.right > EDGE_SOFT_OVERSCROLL_X ||
        overscroll.top > EDGE_SOFT_OVERSCROLL_Y ||
        overscroll.bottom > EDGE_SOFT_OVERSCROLL_Y;

      velocity_x *= INERTIA_DAMPING;
      velocity_y *= INERTIA_DAMPING;

      if (outside_soft_zone) {
        velocity_x *= OUTSIDE_VELOCITY_DAMP_MULT;
        velocity_y *= OUTSIDE_VELOCITY_DAMP_MULT;
      }

      persist_view();
      render_now();

      if (
        Math.abs(velocity_x) < INERTIA_STOP_PX &&
        Math.abs(velocity_y) < INERTIA_STOP_PX
      ) {
        inertia_frame_id = 0;
        return;
      }

      inertia_frame_id = window.requestAnimationFrame(step);
    };

    inertia_frame_id = window.requestAnimationFrame(step);
  };

  const zoom_at_screen_point = (screen_x, screen_y, scale_multiplier) => {
    const cursor_world = screen_to_world(
      screen_x,
      screen_y,
      view_state,
      canvas,
    );
    const nearest = find_nearest_world_node(
      payload,
      cursor_world.x,
      cursor_world.y,
    );
    const use_attractor = nearest.node && nearest.distance > 2.2;
    const before = use_attractor
      ? {
          x:
            cursor_world.x +
            (nearest.node.x - cursor_world.x) * ATTRACTOR_STRENGTH,
          y:
            cursor_world.y +
            (nearest.node.y - cursor_world.y) * ATTRACTOR_STRENGTH,
        }
      : cursor_world;

    view_state.zoom = clamp(
      view_state.zoom * scale_multiplier,
      MIN_ZOOM,
      MAX_ZOOM,
    );

    const cx = canvas.width * 0.5;
    const cy = canvas.height * 0.5;
    view_state.center_x =
      before.x - (screen_x - cx - view_state.pan_x) / view_state.zoom;
    view_state.center_y =
      before.y - (screen_y - cy - view_state.pan_y) / view_state.zoom;

    apply_soft_bounds(view_state, canvas, world_bounds, false);
    persist_view();
    render_now();
  };

  const center_active = () => {
    const active_node = payload_map.get(active_node_id);

    if (!active_node) {
      return;
    }

    view_state.zoom = 1;
    view_state.pan_x = 0;
    view_state.pan_y = 0;
    view_state.center_x = active_node.x;
    view_state.center_y = active_node.y;

    persist_view();
    render_now();
  };

  await renderer.load_textures();
  update_size();

  const resize_observer = new ResizeObserver(update_size);
  resize_observer.observe(root_node);

  canvas.style.touchAction = "none";
  root_node.dataset.canvasBound = "true";

  const pointer_to_canvas = (event) => {
    const bounds = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    return {
      x: (event.clientX - bounds.left) * dpr,
      y: (event.clientY - bounds.top) * dpr,
    };
  };

  canvas.addEventListener("pointerenter", () => {
    if (hover_intent_timer) {
      window.clearTimeout(hover_intent_timer);
    }

    hover_intent_timer = window.setTimeout(() => {
      bump_interaction();
    }, HOVER_INTENT_MS);
  });

  canvas.addEventListener("pointerleave", () => {
    if (is_dragging) {
      if (drag_moved) {
        suppress_click_until = performance.now() + 180;
        run_inertia();
      }

      is_dragging = false;
      drag_pointer_id = null;
      drag_moved = false;
      pointers.clear();
      pinch_state = null;
      canvas.style.cursor = "grab";
    }

    if (hover_intent_timer) {
      window.clearTimeout(hover_intent_timer);
      hover_intent_timer = 0;
    }

    hover_node_id = "";
    set_hover_preview(null);
    wheel_intent_active = false;
    if (zoom_badge instanceof HTMLElement) {
      zoom_badge.classList.remove("is-active");
    }
    render_now();
  });

  canvas.addEventListener(
    "wheel",
    (event) => {
      if (!wheel_intent_active) {
        return;
      }

      event.preventDefault();
      bump_interaction();

      const pointer = pointer_to_canvas(event);
      const scale = Math.exp(-event.deltaY * 0.0018);
      zoom_at_screen_point(pointer.x, pointer.y, scale);
    },
    { passive: false },
  );

  canvas.addEventListener("mousedown", (event) => {
    if (event.button === 1) {
      event.preventDefault();
    }
  });

  canvas.addEventListener("auxclick", (event) => {
    if (event.button === 1) {
      event.preventDefault();
    }
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 && event.button !== 1) {
      return;
    }

    stop_inertia();
    canvas.focus();

    const pointer = pointer_to_canvas(event);
    pointers.set(event.pointerId, pointer);

    if (pointers.size === 2) {
      const values = [...pointers.values()];
      const dx = values[0].x - values[1].x;
      const dy = values[0].y - values[1].y;
      const midpoint_x = (values[0].x + values[1].x) * 0.5;
      const midpoint_y = (values[0].y + values[1].y) * 0.5;

      pinch_state = {
        start_distance: Math.hypot(dx, dy),
        start_zoom: view_state.zoom,
        midpoint_x,
        midpoint_y,
        midpoint_world: screen_to_world(
          midpoint_x,
          midpoint_y,
          view_state,
          canvas,
        ),
      };
      return;
    }

    drag_pointer_id = event.pointerId;
    is_dragging = true;
    drag_moved = false;
    drag_started_at = { ...pointer };
    last_pointer = { ...pointer };
    canvas.style.cursor = "grabbing";
    bump_interaction();
  });

  canvas.addEventListener("pointermove", (event) => {
    const pointer = pointer_to_canvas(event);
    pointers.set(event.pointerId, pointer);

    if (pointers.size === 2 && pinch_state) {
      const values = [...pointers.values()];
      const dx = values[0].x - values[1].x;
      const dy = values[0].y - values[1].y;
      const distance = Math.hypot(dx, dy);
      const midpoint_x = (values[0].x + values[1].x) * 0.5;
      const midpoint_y = (values[0].y + values[1].y) * 0.5;
      const ratio = distance / Math.max(1, pinch_state.start_distance);

      view_state.zoom = clamp(
        pinch_state.start_zoom * ratio,
        MIN_ZOOM,
        MAX_ZOOM,
      );

      const cx = canvas.width * 0.5;
      const cy = canvas.height * 0.5;
      view_state.center_x =
        pinch_state.midpoint_world.x -
        (midpoint_x - cx - view_state.pan_x) / view_state.zoom;
      view_state.center_y =
        pinch_state.midpoint_world.y -
        (midpoint_y - cy - view_state.pan_y) / view_state.zoom;

      bump_interaction();
      persist_view();
      render_now();
      return;
    }

    if (is_dragging && drag_pointer_id === event.pointerId) {
      const raw_dx = pointer.x - last_pointer.x;
      const raw_dy = pointer.y - last_pointer.y;
      const constrained_delta = constrain_drag_delta(
        view_state,
        canvas,
        world_bounds,
        raw_dx,
        raw_dy,
      );
      const dx = constrained_delta.dx;
      const dy = constrained_delta.dy;

      velocity_x = dx;
      velocity_y = dy;

      if (
        !drag_moved &&
        Math.hypot(
          pointer.x - drag_started_at.x,
          pointer.y - drag_started_at.y,
        ) > DRAG_THRESHOLD_PX
      ) {
        drag_moved = true;
      }

      view_state.pan_x += dx;
      view_state.pan_y += dy;
      last_pointer = pointer;

      const hovered_node = find_nearest_clickable_node(
        payload,
        canvas,
        view_state,
        pointer.x,
        pointer.y,
      );
      hover_node_id = drag_moved ? "" : hovered_node?.node_id || "";
      set_hover_preview(drag_moved ? null : hovered_node, event);

      bump_interaction();
      persist_view();
      render_now();
      return;
    }

    const hovered_node = find_nearest_clickable_node(
      payload,
      canvas,
      view_state,
      pointer.x,
      pointer.y,
    );

    hover_node_id = hovered_node?.node_id || "";
    set_hover_preview(hovered_node, event);
    canvas.style.cursor = hovered_node ? "pointer" : "grab";
    render_now();
  });

  const release_pointer = (event) => {
    pointers.delete(event.pointerId);

    if (pointers.size < 2) {
      pinch_state = null;
    }

    if (drag_pointer_id === event.pointerId) {
      if (drag_moved) {
        suppress_click_until = performance.now() + 180;
        run_inertia();
      }

      is_dragging = false;
      drag_pointer_id = null;
      drag_moved = false;
      canvas.style.cursor = "grab";
    }
  };

  canvas.addEventListener("pointerup", release_pointer);
  canvas.addEventListener("pointercancel", release_pointer);

  canvas.addEventListener("click", (event) => {
    if (performance.now() < suppress_click_until) {
      return;
    }

    const pointer = pointer_to_canvas(event);
    const nearest = find_nearest_clickable_node(
      payload,
      canvas,
      view_state,
      pointer.x,
      pointer.y,
    );

    if (!nearest) {
      return;
    }

    dispatch_map_navigation(nearest);
  });

  if (zoom_in_button instanceof HTMLElement) {
    zoom_in_button.addEventListener("click", () => {
      bump_interaction();
      zoom_at_screen_point(canvas.width * 0.5, canvas.height * 0.5, 1.16);
    });
  }

  if (zoom_out_button instanceof HTMLElement) {
    zoom_out_button.addEventListener("click", () => {
      bump_interaction();
      zoom_at_screen_point(canvas.width * 0.5, canvas.height * 0.5, 1 / 1.16);
    });
  }

  if (zoom_slider instanceof HTMLInputElement) {
    zoom_slider.min = "0";
    zoom_slider.max = "1";
    zoom_slider.step = "0.01";
    zoom_slider.value = String(zoom_to_slider(view_state.zoom));

    zoom_slider.addEventListener("input", () => {
      const slider_value = Number(
        zoom_slider.value || zoom_to_slider(view_state.zoom),
      );
      const center_world = screen_to_world(
        canvas.width * 0.5,
        canvas.height * 0.5,
        view_state,
        canvas,
      );

      view_state.zoom = slider_to_zoom(slider_value);
      view_state.center_x = center_world.x;
      view_state.center_y = center_world.y;
      bump_interaction();
      apply_soft_bounds(view_state, canvas, world_bounds, false);
      persist_view();
      render_now();
    });
  }

  if (center_button instanceof HTMLElement) {
    center_button.addEventListener("click", () => {
      bump_interaction();
      center_active();
    });
  }

  if (!window_any.__rubedo_constellation_keyboard_bound) {
    window.addEventListener("keydown", (event) => {
      const focused_map = document.querySelector(
        '#rubedo_constellation_map[data-renderer="canvas"][data-canvas-bound="true"]',
      );

      if (!(focused_map instanceof HTMLElement)) {
        return;
      }

      const focused_canvas = focused_map.querySelector(
        ".rubedo-constellation-canvas-surface",
      );

      if (!(focused_canvas instanceof HTMLCanvasElement)) {
        return;
      }

      const map_has_focus =
        focused_map.matches(":hover") ||
        document.activeElement === focused_canvas;

      if (!map_has_focus) {
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        bump_interaction();
        zoom_at_screen_point(canvas.width * 0.5, canvas.height * 0.5, 1.16);
        return;
      }

      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        bump_interaction();
        zoom_at_screen_point(canvas.width * 0.5, canvas.height * 0.5, 1 / 1.16);
        return;
      }

      if (event.key === "0") {
        event.preventDefault();
        bump_interaction();
        center_active();
        return;
      }

      if (event.key.toLowerCase() === "c") {
        event.preventDefault();
        bump_interaction();
        center_active();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        bump_interaction();
        view_state.pan_x += ARROW_PAN_NUDGE;
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        bump_interaction();
        view_state.pan_x -= ARROW_PAN_NUDGE;
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        bump_interaction();
        view_state.pan_y += ARROW_PAN_NUDGE;
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        bump_interaction();
        view_state.pan_y -= ARROW_PAN_NUDGE;
      } else {
        return;
      }

      persist_view();
      render_now();
    });

    window_any.__rubedo_constellation_keyboard_bound = true;
  }

  render_now();
};

const init_rubedo_constellation = () => {
  if (typeof document === "undefined") {
    return;
  }

  const map_nodes = document.querySelectorAll(
    '#rubedo_constellation_map[data-renderer="canvas"]',
  );

  map_nodes.forEach((map_node) => {
    init_constellation(map_node);
  });
};

init_rubedo_constellation();

if (!window_any.__rubedo_constellation_after_swap_bound) {
  document.body?.addEventListener("htmx:afterSwap", (event) => {
    const target_node = event.target;

    if (!(target_node instanceof HTMLElement)) {
      return;
    }

    if (target_node.closest("#rubedo_timeline_interactive")) {
      init_rubedo_constellation();
    }
  });

  window_any.__rubedo_constellation_after_swap_bound = true;
}

export { init_rubedo_constellation };
