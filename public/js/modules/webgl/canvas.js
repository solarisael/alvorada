const resize_canvas_to_display_size = (canvas, max_dpr = 2) => {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, max_dpr);
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));

  canvas.width = width;
  canvas.height = height;

  return { width, height, dpr };
};

const canvas_pointer_position = (canvas, event, max_dpr = 2) => {
  const bounds = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, max_dpr);

  return {
    x: (event.clientX - bounds.left) * dpr,
    y: (event.clientY - bounds.top) * dpr,
  };
};

export { canvas_pointer_position, resize_canvas_to_display_size };
