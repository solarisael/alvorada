import {
  Virtualizer,
  observeWindowOffset,
  observeWindowRect,
  windowScroll,
} from "@tanstack/virtual-core";
import { register_node_disposal } from "./node_disposal_bridge.js";

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
  return globalThis.window?.matchMedia?.(MOBILE_QUERY).matches ?? false;
}

function fallback_entry_size(entry, expanded) {
  if (expanded && !entry.can_expand) return fallback_entry_size(entry, false);
  if (expanded) {
    return (
      (is_mobile_view() ? entry.expanded_size_mobile : entry.expanded_size) ??
      160
    );
  }

  return (
    (is_mobile_view() ? entry.collapsed_size_mobile : entry.collapsed_size) ??
    160
  );
}

function entry_size_key(entry, expanded) {
  return `${entry.key ?? entry.index}:${expanded ? "expanded" : "collapsed"}:${
    is_mobile_view() ? "mobile" : "desktop"
  }`;
}

function get_entry_template(entry, contract) {
  return document.querySelector(
    `${contract.entry_template_selector}[data-index="${entry.index}"]`,
  );
}

function set_entry_expanded(entry_node, expanded, contract) {
  const preview = entry_node.querySelector(contract.preview_selector);
  const full = entry_node.querySelector(contract.full_selector);
  const button = entry_node.querySelector(contract.expand_selector);

  entry_node.dataset.expanded = expanded ? "true" : "false";
  if (preview) preview.hidden = expanded;
  if (full) full.hidden = !expanded;
  if (button) {
    button.setAttribute("aria-expanded", expanded ? "true" : "false");
    button.textContent = expanded ? "show less" : "read more";
  }
}

function clone_entry_node(entry, expanded, contract) {
  const node =
    get_entry_template(entry, contract)?.content.firstElementChild?.cloneNode(
      true,
    ) ?? null;
  if (!node) return null;

  set_entry_expanded(node, expanded, contract);
  node.style.position = "static";
  node.style.top = "";
  node.style.left = "";
  node.style.width = "100%";
  node.style.transform = "";
  return node;
}

function create_measure_list(scroll_pane, contract) {
  const measure_list = document.createElement("ol");
  measure_list.className = contract.measure_list_class;
  measure_list.setAttribute("aria-hidden", "true");
  measure_list.inert = true;
  scroll_pane.appendChild(measure_list);
  return measure_list;
}

function create_entry_size_cache(measure_list, contract) {
  const sizes = new Map();

  return {
    clear() {
      sizes.clear();
      measure_list.replaceChildren();
    },

    measure(entry, expanded) {
      const key = entry_size_key(entry, expanded);
      const cached = sizes.get(key);
      if (cached) return cached;

      const fallback = fallback_entry_size(entry, expanded);
      const node = clone_entry_node(entry, expanded, contract);
      if (!node) return fallback;

      measure_list.appendChild(node);
      const measured = Math.ceil(node.getBoundingClientRect().height);
      node.remove();

      const size = measured > 0 ? measured : fallback;
      sizes.set(key, size);
      return size;
    },
  };
}

function create_virtual_entry_pool(contract) {
  const nodes = new Map();

  return {
    get(entry, expanded) {
      let node = nodes.get(entry.key);
      if (!node) {
        node = clone_entry_node(entry, expanded, contract);
        if (!node) return null;
        nodes.set(entry.key, node);
      }

      set_entry_expanded(node, expanded, contract);
      return node;
    },

    prune(active_keys) {
      const active_key_set = new Set(active_keys);
      for (const [key, node] of nodes) {
        if (!active_key_set.has(key)) {
          node.remove();
          nodes.delete(key);
        }
      }
    },

    clear() {
      this.prune([]);
    },
  };
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

function report_init_failure(contract, error_value) {
  globalThis.console?.error?.(
    `Failed to initialize ${contract.phase} archive`,
    error_value,
  );
}

export function create_archive_controller({ root, full_index, contract }) {
  const filter_rail = root.querySelector(contract.filter_rail_selector);
  const filter_toggle = root.querySelector(contract.filter_toggle_selector);
  const clear_btn = root.querySelector(contract.filter_clear_selector);
  const filter_sum = root.querySelector(contract.filter_summary_selector);
  const count_label = root.querySelector(contract.count_selector);
  const scroll_pane = root.querySelector(contract.scroll_selector);
  const inner_track = root.querySelector(contract.inner_selector);
  const list_el = root.querySelector(contract.list_selector);

  if (!scroll_pane || !inner_track || !list_el) return null;

  const active_states = new Set();
  const expanded_indexes = new Set();
  const entries = full_index.slice();
  const measure_list = create_measure_list(scroll_pane, contract);
  const size_cache = create_entry_size_cache(measure_list, contract);
  const pool = create_virtual_entry_pool(contract);

  let filtered = entries;
  let virtualizer = null;
  let cleanup_virtualizer = null;
  let disposed = false;
  let unregister_node_disposal = () => {};

  function get_scroll_margin() {
    return (
      scroll_pane.getBoundingClientRect().top +
      (globalThis.window?.scrollY ?? 0)
    );
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
      total_count: entries.length,
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
    if (!virtualizer || disposed) return;

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
      getScrollElement: () => globalThis.window,
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

    cleanup_virtualizer = virtualizer._didMount();
    virtualizer._willUpdate();
    render_virtual_items();
  }

  function apply_filters() {
    filtered = filter_entries(entries, active_states);
    update_count();
    make_virtualizer();
  }

  function sync_filter_controls() {
    if (!filter_rail) return;

    for (const button of filter_rail.querySelectorAll("[data-filter-state]")) {
      const is_active = active_states.has(button.dataset.filterState);
      button.dataset.active = is_active ? "true" : "false";
      button.setAttribute("aria-pressed", is_active ? "true" : "false");
    }

    for (const button of filter_rail.querySelectorAll(
      "[data-filter-container]",
    )) {
      const group = button.closest(contract.filter_group_selector);
      const state_buttons =
        group?.querySelectorAll("[data-filter-state]") ?? [];
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
  function sync_filter_disclosure() {
    if (!filter_rail || !filter_toggle) return;

    const is_collapsed = filter_rail.dataset.mobileCollapsed !== "false";
    filter_toggle.setAttribute(
      "aria-expanded",
      is_collapsed ? "false" : "true",
    );
    filter_toggle.textContent = is_collapsed ? "show filters" : "hide filters";
  }

  function on_filter_toggle_click() {
    if (!filter_rail) return;

    const is_collapsed = filter_rail.dataset.mobileCollapsed !== "false";
    filter_rail.dataset.mobileCollapsed = is_collapsed ? "false" : "true";
    sync_filter_disclosure();
  }

  function on_filter_click(event) {
    const event_target = event.target;
    const container_button = event_target?.closest?.("[data-filter-container]");
    if (container_button) {
      const group = container_button.closest(contract.filter_group_selector);
      const container_states = [];
      for (const button of group?.querySelectorAll("[data-filter-state]") ??
        []) {
        container_states.push(button.dataset.filterState);
      }

      toggle_container_states(active_states, container_states);
      sync_filter_controls();
      apply_filters();
      return;
    }

    const button = event_target?.closest?.("[data-filter-state]");
    if (!button) return;

    const state = button.dataset.filterState;
    if (active_states.has(state)) {
      active_states.delete(state);
    } else {
      active_states.add(state);
    }

    sync_filter_controls();
    apply_filters();
  }

  function on_clear_click() {
    active_states.clear();
    sync_filter_controls();
    apply_filters();
  }

  function on_root_click(event) {
    const event_target = event.target;
    const button = event_target?.closest?.(contract.expand_selector);
    if (!button || !virtualizer) return;

    const entry_node = button.closest(contract.entry_selector);
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

    set_entry_expanded(entry_node, entry_is_expanded(entry), contract);
    resize_entry(entry, filtered_index);
    render_virtual_items();
  }

  function on_resize() {
    make_virtualizer();
  }

  function dispose() {
    if (disposed) return;
    disposed = true;

    filter_rail?.removeEventListener("click", on_filter_click);
    clear_btn?.removeEventListener("click", on_clear_click);
    filter_toggle?.removeEventListener("click", on_filter_toggle_click);
    root.removeEventListener("click", on_root_click);
    globalThis.window?.removeEventListener("resize", on_resize);

    cleanup_current_virtualizer();
    size_cache.clear();
    pool.clear();
    list_el.replaceChildren();
    measure_list.remove();
    active_states.clear();
    expanded_indexes.clear();
    filtered = [];
    entries.length = 0;

    if (root[contract.bound_property]?.dispose === dispose) {
      delete root[contract.bound_property];
    }

    unregister_node_disposal();
    unregister_node_disposal = () => {};
  }

  filter_rail?.addEventListener("click", on_filter_click);
  clear_btn?.addEventListener("click", on_clear_click);
  filter_toggle?.addEventListener("click", on_filter_toggle_click);
  root.addEventListener("click", on_root_click);
  globalThis.window?.addEventListener("resize", on_resize, { passive: true });

  try {
    unregister_node_disposal = register_node_disposal(root, dispose);
    update_count();
    sync_filter_controls();
    sync_filter_disclosure();
    make_virtualizer();
  } catch (error_value) {
    dispose();
    throw error_value;
  }

  const fonts_ready = document.fonts?.ready;
  if (fonts_ready && typeof fonts_ready.then === "function") {
    fonts_ready.then(() => {
      if (!disposed && root.isConnected) make_virtualizer();
    });
  }

  return Object.freeze({ dispose });
}

export function init_archive(contract) {
  if (typeof document === "undefined") return null;

  const root = document.querySelector(contract.root_selector);
  if (!root || root[contract.bound_property]) return null;

  let raw_index;
  try {
    raw_index = JSON.parse(
      document.getElementById(contract.index_id)?.textContent ?? "[]",
    );
    if (!Array.isArray(raw_index)) {
      throw new TypeError("archive index must be an array");
    }
  } catch (error_value) {
    report_init_failure(contract, error_value);
    return null;
  }

  try {
    const full_index = [...raw_index].sort((a, b) =>
      String(b.published_at).localeCompare(String(a.published_at)),
    );
    const controller = create_archive_controller({
      root,
      full_index,
      contract,
    });
    if (!controller) return null;

    root[contract.bound_property] = controller;
    return controller;
  } catch (error_value) {
    report_init_failure(contract, error_value);
    return null;
  }
}
