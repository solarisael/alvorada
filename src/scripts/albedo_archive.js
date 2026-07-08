/**
 * Client-side controller for the virtual albedo feed.
 * Astro owns the entry templates; this layer filters, windows, and toggles them.
 */

import {
  Virtualizer,
  observeWindowOffset,
  observeWindowRect,
  windowScroll,
} from "@tanstack/virtual-core";

const OVERSCAN = 5;
const MOBILE_QUERY = "(max-width: 639px)";

export function filter_entries(entries, active_states) {
  if (!active_states || active_states.size === 0) return entries;
  return entries.filter((entry) =>
    entry.states.some((state) => active_states.has(state)),
  );
}

export function entry_matches_states(entry_states, active_states) {
  if (!active_states || active_states.size === 0) return true;
  return entry_states.some((state) => active_states.has(state));
}

export function toggle_container_states(active_states, container_states) {
  let all_active = container_states.length > 0;
  for (const state of container_states) {
    if (!active_states.has(state)) {
      all_active = false;
      break;
    }
  }

  for (const state of container_states) {
    if (all_active) {
      active_states.delete(state);
    } else {
      active_states.add(state);
    }
  }

  return !all_active;
}

function is_mobile_view() {
  return window.matchMedia?.(MOBILE_QUERY).matches ?? false;
}

function fallback_entry_size(entry, expanded) {
  if (expanded && !entry.can_expand) return fallback_entry_size(entry, false);
  if (expanded) {
    return is_mobile_view() ? entry.expanded_size_mobile : entry.expanded_size;
  }

  return is_mobile_view() ? entry.collapsed_size_mobile : entry.collapsed_size;
}

function entry_size_key(entry, expanded) {
  return `${entry.key}:${expanded ? "expanded" : "collapsed"}:${
    is_mobile_view() ? "mobile" : "desktop"
  }`;
}

function get_entry_template(entry) {
  return document.querySelector(
    `[data-albedo-entry-template][data-index="${entry.index}"]`,
  );
}

function clone_entry_node(entry, expanded) {
  const node =
    get_entry_template(entry)?.content.firstElementChild?.cloneNode(true) ?? null;
  if (!node) return null;

  set_entry_expanded(node, expanded);
  node.style.position = "static";
  node.style.top = "";
  node.style.left = "";
  node.style.width = "100%";
  node.style.transform = "";
  return node;
}

function set_entry_expanded(entry_node, expanded) {
  const preview = entry_node.querySelector("[data-albedo-preview]");
  const full = entry_node.querySelector("[data-albedo-full]");
  const button = entry_node.querySelector("[data-albedo-expand]");

  entry_node.dataset.expanded = expanded ? "true" : "false";
  if (preview) preview.hidden = expanded;
  if (full) full.hidden = !expanded;
  if (button) {
    button.setAttribute("aria-expanded", expanded ? "true" : "false");
    button.textContent = expanded ? "show less" : "read more";
  }
}

function create_measure_list(scroll_pane) {
  const measure_list = document.createElement("ol");
  measure_list.className = "sol__albedo_list sol__albedo_measure_list";
  measure_list.setAttribute("aria-hidden", "true");
  measure_list.inert = true;
  scroll_pane.appendChild(measure_list);
  return measure_list;
}

class EntrySizeCache {
  constructor(measure_list) {
    this.measure_list = measure_list;
    this.sizes = new Map();
  }

  clear() {
    this.sizes.clear();
    this.measure_list.replaceChildren();
  }

  measure(entry, expanded) {
    const key = entry_size_key(entry, expanded);
    const cached = this.sizes.get(key);
    if (cached) return cached;

    const fallback = fallback_entry_size(entry, expanded);
    const node = clone_entry_node(entry, expanded);
    if (!node) return fallback;

    this.measure_list.appendChild(node);
    const measured = Math.ceil(node.getBoundingClientRect().height);
    node.remove();

    const size = measured > 0 ? measured : fallback;
    this.sizes.set(key, size);
    return size;
  }
}

function update_status({
  count_label,
  filter_sum,
  clear_btn,
  active_states,
  visible_count,
  total_count,
}) {
  if (count_label) {
    count_label.textContent =
      active_states.size > 0
        ? `${visible_count} / ${total_count}`
        : `${total_count}`;
  }

  if (filter_sum) {
    if (active_states.size > 0) {
      filter_sum.textContent = `— ${[...active_states].join(", ")}`;
      filter_sum.hidden = false;
    } else {
      filter_sum.textContent = "";
      filter_sum.hidden = true;
    }
  }

  if (clear_btn) clear_btn.hidden = active_states.size === 0;
}

class VirtualEntryPool {
  constructor() {
    this.nodes = new Map();
  }

  get(entry, expanded) {
    let node = this.nodes.get(entry.key);
    if (!node) {
      node = clone_entry_node(entry, expanded);
      if (!node) return null;
      this.nodes.set(entry.key, node);
    }

    set_entry_expanded(node, expanded);
    return node;
  }

  prune(active_keys) {
    const active_key_set = new Set(active_keys);
    for (const [key, node] of this.nodes) {
      if (!active_key_set.has(key)) {
        node.remove();
        this.nodes.delete(key);
      }
    }
  }

  clear() {
    this.prune([]);
  }
}

export function init_albedo_archive() {
  const root = document.querySelector("[data-albedo-archive]");
  if (!root || root.__albedo_archive_bound) return;
  root.__albedo_archive_bound = true;

  const raw_index = JSON.parse(
    document.getElementById("sol_albedo_archive_index")?.textContent ?? "[]",
  );

  const full_index = [...raw_index].sort((a, b) =>
    b.published_at.localeCompare(a.published_at),
  );

  const filter_rail = root.querySelector("[data-albedo-filter-rail]");
  const clear_btn = root.querySelector("[data-albedo-filter-clear]");
  const filter_sum = root.querySelector("[data-albedo-filter-summary]");
  const count_label = root.querySelector("[data-albedo-count]");
  const scroll_pane = root.querySelector("[data-albedo-scroll]");
  const inner_track = root.querySelector("[data-albedo-inner]");
  const list_el = root.querySelector("[data-albedo-list]");

  if (!scroll_pane || !inner_track || !list_el) return;

  const active_states = new Set();
  const expanded_indexes = new Set();
  const measure_list = create_measure_list(scroll_pane);
  const size_cache = new EntrySizeCache(measure_list);
  const pool = new VirtualEntryPool();

  let filtered = full_index;
  let virtualizer = null;
  let cleanup_virtualizer = null;

  function get_scroll_margin() {
    return scroll_pane.getBoundingClientRect().top + window.scrollY;
  }

  function entry_is_expanded(entry) {
    return expanded_indexes.has(entry.index);
  }

  function update_count() {
    update_status({
      count_label,
      filter_sum,
      clear_btn,
      active_states,
      visible_count: filtered.length,
      total_count: full_index.length,
    });
  }

  function entry_size(entry) {
    return size_cache.measure(entry, entry_is_expanded(entry));
  }

  function resize_entry(entry, filtered_index) {
    if (!virtualizer || !entry) return;
    virtualizer.resizeItem(filtered_index, entry_size(entry));
  }

  function render_virtual_items() {
    if (!virtualizer) return;

    const virtual_items = virtualizer.getVirtualItems();
    inner_track.style.height = `${virtualizer.getTotalSize()}px`;

    const active_keys = [];
    for (const virtual_item of virtual_items) {
      const entry = filtered[virtual_item.index];
      if (!entry) continue;

      active_keys.push(entry.key);
      const node = pool.get(entry, entry_is_expanded(entry));
      if (!node) continue;

      node.dataset.virtualIndex = String(virtual_item.index);
      node.style.position = "absolute";
      node.style.top = "0";
      node.style.left = "0";
      node.style.width = "100%";
      node.style.transform = `translateY(${
        virtual_item.start - virtualizer.options.scrollMargin
      }px)`;

      if (node.parentElement !== list_el) {
        list_el.appendChild(node);
        globalThis.htmx?.process?.(node);
      }
    }

    pool.prune(active_keys);
  }

  function cleanup_current_virtualizer() {
    cleanup_virtualizer?.();
    cleanup_virtualizer = null;
    virtualizer = null;
  }

  function make_virtualizer() {
    cleanup_current_virtualizer();
    size_cache.clear();
    pool.clear();
    list_el.replaceChildren();

    virtualizer = new Virtualizer({
      count: filtered.length,
      getScrollElement: () => window,
      estimateSize: (index) => {
        const entry = filtered[index];
        return entry ? entry_size(entry) : 160;
      },
      getItemKey: (index) => filtered[index]?.key ?? index,
      observeElementRect: observeWindowRect,
      observeElementOffset: observeWindowOffset,
      scrollToFn: windowScroll,
      scrollMargin: get_scroll_margin(),
      overscan: OVERSCAN,
      initialRect: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      onChange: render_virtual_items,
    });

    cleanup_virtualizer = virtualizer._didMount();
    virtualizer._willUpdate();
    render_virtual_items();
  }

  function apply_filters() {
    filtered = filter_entries(full_index, active_states);
    update_count();
    make_virtualizer();
  }

  function sync_filter_controls() {
    if (!filter_rail) return;

    for (const button of filter_rail.querySelectorAll("[data-filter-state]")) {
      button.dataset.active = active_states.has(button.dataset.filterState)
        ? "true"
        : "false";
    }

    for (const button of filter_rail.querySelectorAll("[data-filter-container]")) {
      const group = button.closest(".sol__albedo_filter_group");
      const state_buttons = group?.querySelectorAll("[data-filter-state]") ?? [];
      let all_active = state_buttons.length > 0;
      for (const state_button of state_buttons) {
        if (!active_states.has(state_button.dataset.filterState)) {
          all_active = false;
          break;
        }
      }

      button.dataset.active = all_active ? "true" : "false";
      button.setAttribute("aria-pressed", all_active ? "true" : "false");
    }
  }

  if (filter_rail) {
    filter_rail.addEventListener("click", (event) => {
      const container_button = event.target.closest("[data-filter-container]");
      if (container_button) {
        const group = container_button.closest(".sol__albedo_filter_group");
        const container_states = [];
        for (const button of group?.querySelectorAll("[data-filter-state]") ?? []) {
          container_states.push(button.dataset.filterState);
        }

        toggle_container_states(active_states, container_states);
        sync_filter_controls();
        apply_filters();
        return;
      }

      const button = event.target.closest("[data-filter-state]");
      if (!button) return;

      const state = button.dataset.filterState;
      if (active_states.has(state)) {
        active_states.delete(state);
      } else {
        active_states.add(state);
      }

      sync_filter_controls();
      apply_filters();
    });
  }

  if (clear_btn) {
    clear_btn.addEventListener("click", () => {
      active_states.clear();
      sync_filter_controls();
      apply_filters();
    });
  }

  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-albedo-expand]");
    if (!button || !virtualizer) return;

    const entry_node = button.closest("[data-albedo-entry]");
    const entry_index = Number(entry_node?.dataset.entryIndex);
    if (!Number.isInteger(entry_index)) return;

    const filtered_index = filtered.findIndex(
      (entry) => entry.index === entry_index,
    );
    const entry = filtered[filtered_index];
    if (!entry || !entry.can_expand) return;

    if (expanded_indexes.has(entry_index)) {
      expanded_indexes.delete(entry_index);
    } else {
      expanded_indexes.add(entry_index);
    }

    set_entry_expanded(entry_node, entry_is_expanded(entry));
    resize_entry(entry, filtered_index);
    render_virtual_items();
  });

  window.addEventListener(
    "resize",
    () => {
      make_virtualizer();
    },
    { passive: true },
  );

  document.fonts?.ready.then(() => {
    if (root.isConnected) make_virtualizer();
  });

  update_count();
  sync_filter_controls();
  make_virtualizer();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", init_albedo_archive);
  document.addEventListener("htmx:afterSettle", init_albedo_archive);
}
