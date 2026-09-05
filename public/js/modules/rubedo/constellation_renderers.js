import { create_webgl_renderer } from "./rendering/webgl.js";
import { create_canvas2d_renderer } from "./rendering/canvas2d.js";
import { create_texture_source_list } from "./rendering/textures.js";

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
