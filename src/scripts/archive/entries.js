const MOBILE_QUERY = "(max-width: 639px)";

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

export function set_entry_expanded(entry_node, expanded, contract) {
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

export function create_measure_list(scroll_pane, contract) {
  const measure_list = document.createElement("ol");
  measure_list.className = contract.measure_list_class;
  measure_list.setAttribute("aria-hidden", "true");
  measure_list.inert = true;
  scroll_pane.appendChild(measure_list);
  return measure_list;
}

export function create_entry_size_cache(measure_list, contract) {
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

export function create_virtual_entry_pool(contract) {
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
