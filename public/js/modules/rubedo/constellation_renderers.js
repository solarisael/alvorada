import { resize_canvas_to_display_size } from "../webgl/canvas.js";
import { rgba, to_rgb, world_to_screen } from "../webgl/math.js";
import { create_program } from "../webgl/program.js";
import {
  RUBEDO_CONSTELLATION_THREADS,
  RUBEDO_CONSTELLATION_VIEW,
} from "./constellation_config.js";

const create_texture_source_list = (nodes) => {
  const source_set = new Set();

  for (const node_entry of nodes) {
    if (node_entry.image_src) {
      source_set.add(node_entry.image_src);
    }
  }

  return [...source_set];
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

  // GL location lookups are slow and were previously re-queried inside every
  // draw call, every frame, once PER NODE. Cache them once here — the program
  // and its attribute/uniform locations never change after link. Draw helpers
  // read from these records instead of calling getAttribLocation each frame.
  const cache_locations = (program, attrib_names, uniform_names) => ({
    program,
    attribs: Object.fromEntries(
      attrib_names.map((name) => [name, gl.getAttribLocation(program, name)]),
    ),
    uniforms: Object.fromEntries(
      uniform_names.map((name) => [name, gl.getUniformLocation(program, name)]),
    ),
  });

  const line_loc = cache_locations(
    line_program,
    ["a_position"],
    ["u_canvas_size", "u_color"],
  );
  const point_loc = cache_locations(
    point_program,
    ["a_position", "a_size"],
    ["u_canvas_size", "u_color", "u_softness"],
  );
  const ring_loc = cache_locations(
    ring_program,
    ["a_position", "a_size"],
    ["u_canvas_size", "u_color", "u_thickness"],
  );
  const tex_loc = cache_locations(
    tex_program,
    ["a_position", "a_size"],
    ["u_canvas_size", "u_texture"],
  );

  const line_buffer = gl.createBuffer();
  const point_buffer = gl.createBuffer();
  const textures = new Map();
  const clickable_nodes = (payload.nodes || []).filter((node_entry) => {
    return node_entry.is_clickable;
  });
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

    gl.useProgram(line_loc.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, line_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);

    const pos = line_loc.attribs.a_position;

    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(line_loc.uniforms.u_canvas_size, canvas.width, canvas.height);
    gl.uniform4f(line_loc.uniforms.u_color, ...rgba(rgb_values, alpha));
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

    gl.useProgram(point_loc.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, point_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, values, gl.STREAM_DRAW);

    const pos = point_loc.attribs.a_position;
    const size = point_loc.attribs.a_size;

    gl.enableVertexAttribArray(pos);
    gl.enableVertexAttribArray(size);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 12, 0);
    gl.vertexAttribPointer(size, 1, gl.FLOAT, false, 12, 8);
    gl.uniform2f(point_loc.uniforms.u_canvas_size, canvas.width, canvas.height);
    gl.uniform4f(point_loc.uniforms.u_color, ...rgba(rgb_values, alpha));
    gl.uniform1f(point_loc.uniforms.u_softness, softness);
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

    gl.useProgram(ring_loc.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, point_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, values, gl.STREAM_DRAW);

    const pos = ring_loc.attribs.a_position;
    const size = ring_loc.attribs.a_size;

    gl.enableVertexAttribArray(pos);
    gl.enableVertexAttribArray(size);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 12, 0);
    gl.vertexAttribPointer(size, 1, gl.FLOAT, false, 12, 8);
    gl.uniform2f(ring_loc.uniforms.u_canvas_size, canvas.width, canvas.height);
    gl.uniform4f(ring_loc.uniforms.u_color, ...rgba(rgb_values, alpha));
    gl.uniform1f(ring_loc.uniforms.u_thickness, thickness);
    gl.drawArrays(gl.POINTS, 0, nodes.length);
    gl.disableVertexAttribArray(pos);
    gl.disableVertexAttribArray(size);
  };

  const load_textures = async () => {
    const unique_sources = create_texture_source_list(clickable_nodes);

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

    gl.useProgram(tex_loc.program);
    const pos = tex_loc.attribs.a_position;
    const size = tex_loc.attribs.a_size;

    gl.uniform2f(tex_loc.uniforms.u_canvas_size, canvas.width, canvas.height);
    gl.uniform1i(tex_loc.uniforms.u_texture, 0);

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
    resize_canvas_to_display_size(canvas, RUBEDO_CONSTELLATION_VIEW.max_dpr);
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
      const rgb = RUBEDO_CONSTELLATION_THREADS.rgb[edge.thread_key] || [
        214, 217, 226,
      ];
      draw_lines([edge], rgb, 0.42);
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
  const clickable_nodes = (payload.nodes || []).filter((node_entry) => {
    return node_entry.is_clickable;
  });

  const resize = () => {
    resize_canvas_to_display_size(canvas, RUBEDO_CONSTELLATION_VIEW.max_dpr);
  };

  const load_textures = async () => {
    const sources = create_texture_source_list(clickable_nodes);

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
      const rgb = RUBEDO_CONSTELLATION_THREADS.rgb[edge.thread_key] || [
        214, 217, 226,
      ];
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

const create_constellation_renderer = (canvas, payload, view_state) => {
  return (
    create_webgl_renderer(canvas, payload, view_state) ||
    create_canvas2d_renderer(canvas, payload, view_state)
  );
};

export {
  create_canvas2d_renderer,
  create_constellation_renderer,
  create_texture_source_list,
  create_webgl_renderer,
};
