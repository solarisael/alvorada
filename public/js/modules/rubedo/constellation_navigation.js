const dispatch_map_navigation = (node_entry) => {
  if (!node_entry?.link) {
    return;
  }

  const window_any = /** @type {any} */ (globalThis);
  const htmx_api = window_any.htmx;

  if (htmx_api?.ajax) {
    htmx_api.ajax("GET", node_entry.link.hx_get || node_entry.link.href, {
      target: node_entry.link.hx_target || "#sol_content",
      select: node_entry.link.hx_select || "#sol_content",
      swap: node_entry.link.hx_swap || "morph swap:220ms settle:260ms",
      pushURL: String(node_entry.link.hx_push_url) === "true",
    });

    return;
  }

  if (node_entry.link.href) {
    window.location.href = node_entry.link.href;
  }
};

export { dispatch_map_navigation };
