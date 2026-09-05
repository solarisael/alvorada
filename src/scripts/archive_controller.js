import {
  create_window_virtualizer,
  render_window_entries,
} from "./archive/window_virtualizer.js";
import { register_node_disposal } from "./node_disposal_bridge.js";
import {
  create_entry_size_cache,
  create_measure_list,
  create_virtual_entry_pool,
  set_entry_expanded,
} from "./archive/entries.js";
import {
  create_filter_controls,
  filter_entries,
  update_status,
} from "./archive/filters.js";
export {
  filter_entries,
  entry_matches_states,
  toggle_container_states,
} from "./archive/filters.js";

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

    render_window_entries(
      virtualizer,
      inner_track,
      filtered,
      pool,
      entry_is_expanded,
      list_el,
    );
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

    virtualizer = create_window_virtualizer(
      filtered,
      entry_size,
      get_scroll_margin(),
      render_virtual_items,
    );

    cleanup_virtualizer = virtualizer._didMount();
    virtualizer._willUpdate();
    render_virtual_items();
  }

  function apply_filters() {
    filtered = filter_entries(entries, active_states);
    update_count();
    make_virtualizer();
  }

  const filters = create_filter_controls({
    filter_rail,
    filter_toggle,
    clear_btn,
    contract,
    active_states,
    apply_filters,
  });
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

    filters.dispose();
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

  filters.bind();
  root.addEventListener("click", on_root_click);
  globalThis.window?.addEventListener("resize", on_resize, { passive: true });

  try {
    unregister_node_disposal = register_node_disposal(root, dispose);
    update_count();
    filters.sync_filter_controls();
    filters.sync_filter_disclosure();
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
