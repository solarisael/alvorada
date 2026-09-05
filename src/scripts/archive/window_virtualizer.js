import {
  Virtualizer,
  observeWindowOffset,
  observeWindowRect,
  windowScroll,
} from "@tanstack/virtual-core";
const OVERSCAN = 5;

export function create_window_virtualizer(
  filtered,
  entry_size,
  scroll_margin,
  render_virtual_items,
) {
  const virtualizer = new Virtualizer({
    count: filtered.length,
    getScrollElement: () => globalThis.window,
    estimateSize: (index) => {
      const entry = filtered[index];
      return entry ? entry_size(entry) : 160;
    },
    getItemKey: (index) => filtered[index]?.key ?? index,
    observeElementRect: observeWindowRect,
    observeElementOffset: observeWindowOffset,
    scrollToFn: windowScroll,
    scrollMargin: scroll_margin,
    overscan: OVERSCAN,
    initialRect: {
      width: globalThis.window?.innerWidth ?? 0,
      height: globalThis.window?.innerHeight ?? 0,
    },
    onChange: render_virtual_items,
  });

  if (
    typeof virtualizer._didMount !== "function" ||
    typeof virtualizer._willUpdate !== "function"
  ) {
    throw new Error(
      "@tanstack/virtual-core does not expose the lifecycle required by the archive controller",
    );
  }
  // @tanstack/virtual-core 3.16 has no public mount/update lifecycle;
  // these underscored hooks are its only observer lifecycle seam.
  return virtualizer;
}

const position_entry_node = (
  node,
  virtual_item,
  virtualizer,
  filtered,
  list_el,
) => {
  node.dataset.virtualIndex = String(virtual_item.index);
  node.setAttribute("aria-posinset", String(virtual_item.index + 1));
  node.setAttribute("aria-setsize", String(filtered.length));
  node.style.position = "absolute";
  node.style.top = "0";
  node.style.left = "0";
  node.style.width = "100%";
  node.style.transform = `translateY(${virtual_item.start - virtualizer.options.scrollMargin}px)`;

  if (node.parentElement !== list_el) {
    list_el.appendChild(node);
    globalThis.htmx?.process?.(node);
  }
};

export function render_window_entries(
  virtualizer,
  inner_track,
  filtered,
  pool,
  entry_is_expanded,
  list_el,
) {
  const virtual_items = virtualizer.getVirtualItems();
  inner_track.style.height = `${virtualizer.getTotalSize()}px`;

  const active_keys = [];
  for (const virtual_item of virtual_items) {
    const entry = filtered[virtual_item.index];
    if (!entry) continue;

    active_keys.push(entry.key);
    const node = pool.get(entry, entry_is_expanded(entry));
    if (!node) continue;

    position_entry_node(node, virtual_item, virtualizer, filtered, list_el);
  }

  pool.prune(active_keys);
}
