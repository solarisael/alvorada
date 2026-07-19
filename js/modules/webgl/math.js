const clamp = (value, min_value, max_value) => {
  return Math.min(max_value, Math.max(min_value, value));
};

const to_rgb = (rgb_text = "214 217 226") => {
  const [red, green, blue] = String(rgb_text)
    .split(/\s+/)
    .map((value) => Number(value || 0));

  return [red || 214, green || 217, blue || 226];
};

const rgba = (rgb_values, alpha) => {
  return [
    rgb_values[0] / 255,
    rgb_values[1] / 255,
    rgb_values[2] / 255,
    alpha,
  ];
};

const world_to_screen = (x, y, view_state, canvas) => {
  const center_x = canvas.width * 0.5;
  const center_y = canvas.height * 0.5;

  return {
    x: (x - view_state.center_x) * view_state.zoom + center_x + view_state.pan_x,
    y: (y - view_state.center_y) * view_state.zoom + center_y + view_state.pan_y,
  };
};

const screen_to_world = (x, y, view_state, canvas) => {
  const center_x = canvas.width * 0.5;
  const center_y = canvas.height * 0.5;

  return {
    x: (x - center_x - view_state.pan_x) / view_state.zoom + view_state.center_x,
    y: (y - center_y - view_state.pan_y) / view_state.zoom + view_state.center_y,
  };
};

export { clamp, rgba, screen_to_world, to_rgb, world_to_screen };
