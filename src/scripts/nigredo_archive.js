/**
 * nigredo_archive.js
 * Client-side archive controller for the Nigredo pillar page.
 * Virtualizer: @tanstack/virtual-core, using window/document scroll as the
 * single scroll context. The `.nigredo-scroll-pane` is no longer an
 * overflow container — it just serves as a data-attribute carrier and
 * visual frame; the virtualizer measures against the document.
 */

import {
  Virtualizer,
  windowScroll,
  observeWindowOffset,
  observeWindowRect,
} from "@tanstack/virtual-core";

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function filter_entries(entries, active_states) {
  if (!active_states || active_states.size === 0) return entries;
  return entries.filter((entry) =>
    entry.states.some((s) => active_states.has(s)),
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INWARD = new Set([
  "grief",
  "dread",
  "shame",
  "guilt",
  "ache",
  "numb",
  "doubt",
  "loneliness",
  "exhaustion",
  "panic",
  "ruin",
  "hunger",
]);

const EXTREME_STATES = new Set(["rage", "panic", "ruin", "grief"]);

const OVERSCAN = 4;
// Per-variant estimates calibrated against real render heights. Uniform 88
// average was causing visible total-size oscillation during scroll as the
// virtualizer replaced estimates with real measurements on a per-row basis.
// Matching the estimate to the likely variant keeps the delta near zero,
// so the total stays stable and the archive doesn't stutter under scroll.
const ESTIMATED_HEIGHT_WITH_EXCERPT = 112;
const ESTIMATED_HEIGHT_HEADER_ONLY = 64;

function measure_row(node) {
  return node.getBoundingClientRect().height;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function redact_length(slug) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return 4 + (hash % 9);
}

function derive_align(entry, index) {
  const state = entry.states?.[0];
  return EXTREME_STATES.has(state) ? "right" : "left";
}

// ─── Row pool — stable DOM nodes keyed by virtual index ──────────────────────
// Avoids constant createElement/destroy cycles that break measurement caching.

class RowPool {
  constructor(template, base_path, on_remove = null) {
    this._template = template;
    this._base_path = base_path;
    this._pool = new Map(); // key (index) -> li element
    this._on_remove = on_remove;
  }

  _make_node() {
    const clone = this._template.content.cloneNode(true);
    // Fix ornament src paths that couldn't be dynamic in template
    clone.querySelectorAll("[data-ornament-src]").forEach((img) => {
      img.src = this._base_path + img.dataset.ornamentSrc;
    });
    return clone.querySelector("li");
  }

  _fill(node, entry, index) {
    const row = node;
    const article = node.querySelector(".nigredo-entry");
    const link = node.querySelector(".nigredo-entry-link");
    const title = node.querySelector(".nigredo-entry-title");
    const pill = node.querySelector(".nigredo-pill");
    const date = node.querySelector(".nigredo-entry-date");
    const excerpt = node.querySelector(".nigredo-entry-excerpt");

    // Lane
    const align = derive_align(entry, index);
    row.dataset.align = align;

    // Size-class for deterministic row heights. Paired with CSS rules keyed
    // off this attribute so each variant has a fixed height regardless of
    // internal text-wrap or short-excerpt padding quirks. Stabilizes the
    // virtualizer's size cache and eliminates scroll stutter.
    row.dataset.excerptPresent = entry.excerpt ? "true" : "false";

    // Variant
    if (article) {
      article.dataset.variant = entry.featured ? "rupture" : "quiet";
    }

    // Link
    if (link) link.href = entry.href;

    // Title
    if (title) {
      if (entry.title) {
        title.textContent = entry.title;
        title.dataset.redacted = "false";
      } else {
        title.textContent = "■".repeat(redact_length(entry.slug));
        title.dataset.redacted = "true";
      }
    }

    // Pill
    if (pill) {
      const state = entry.states[0] ?? "numb";
      pill.textContent = state;
      pill.dataset.state = state;
      pill.dataset.family = INWARD.has(state) ? "ash" : "ember";
    }

    // Date
    if (date) {
      date.setAttribute("datetime", entry.published_at);
      date.textContent = entry.published_at;
    }

    // Excerpt — show/hide with visibility to preserve height stability
    if (excerpt) {
      const p = excerpt.querySelector("p");
      if (entry.excerpt) {
        if (p) p.textContent = entry.excerpt;
        excerpt.hidden = false;
      } else {
        excerpt.hidden = true;
      }
    }

    return node;
  }

  get(v_item, filtered) {
    const entry = filtered[v_item.index];
    let node = this._pool.get(v_item.key);
    const is_new = !node;

    if (is_new) {
      node = this._make_node();
      this._pool.set(v_item.key, node);
    }

    // Only rebuild content when the node is freshly pooled OR when this key
    // has been remapped to a different entry-index (rare — happens on filter
    // changes if the pool survives a transition, which currently it doesn't
    // because apply_filters prunes empty). _fill() being called on every
    // render was generating constant textContent/dataset writes that layout-
    // thrashed the virtualizer and kept invalidating its size cache.
    const next_index_str = String(v_item.index);
    if (is_new || node.dataset.index !== next_index_str) {
      node.dataset.index = next_index_str;
      this._fill(node, entry, v_item.index);
    }

    // Absolute positioning inside inner track — the ONLY field that must be
    // updated every render (scroll moves rows through virtual space).
    node.style.position = "absolute";
    node.style.top = "0";
    node.style.left = "0";
    node.style.right = "";
    node.style.width = "100%";
    node.style.transform = `translateY(${v_item.start}px)`;

    return node;
  }

  is_new_to_dom(node) {
    // Helper for render_items to know whether a node needs first-time
    // observation / measurement.
    return !node.__observed;
  }

  mark_observed(node) {
    node.__observed = true;
  }

  clear_observed(node) {
    delete node.__observed;
  }

  prune(active_keys) {
    const key_set = new Set(active_keys);
    for (const [k, node] of this._pool) {
      if (!key_set.has(k)) {
        node.remove();
        if (this._on_remove) {
          this._on_remove(node);
        }
        this._pool.delete(k);
      }
    }
  }
}

// ─── DOM controller ──────────────────────────────────────────────────────────

export function init_nigredo_archive() {
  const root = document.querySelector("[data-nigredo-archive]");
  if (!root || root.__nigredo_archive_bound) return;
  root.__nigredo_archive_bound = true;

  // ── Data ──────────────────────────────────────────────────────────────────
  const raw_index = JSON.parse(
    document.getElementById("nigredo-archive-index")?.textContent ?? "[]",
  );

  const full_index = [...raw_index].sort((a, b) =>
    b.published_at.localeCompare(a.published_at),
  );

  let active_states = new Set();
  let filtered = full_index;

  // ── Nodes ─────────────────────────────────────────────────────────────────
  const filter_rail = root.querySelector("[data-nigredo-filter-rail]");
  const clear_btn = root.querySelector("[data-nigredo-filter-clear]");
  const filter_sum = root.querySelector("[data-nigredo-filter-summary]");
  const count_label = root.querySelector("[data-nigredo-count]");
  const scroll_el = root.querySelector("[data-nigredo-scroll]");
  const inner_track = root.querySelector("[data-nigredo-inner]");
  const list_el = root.querySelector("[data-nigredo-list]");

  if (!scroll_el || !inner_track || !list_el) return;

  const entry_template = document.getElementById("nigredo-entry-template");
  if (!entry_template) return;

  const base_path = scroll_el.dataset.basePath ?? "";

  let layout_measure_pending = false;

  function request_layout_measure() {
    if (!virtualizer || layout_measure_pending) return;

    layout_measure_pending = true;
    requestAnimationFrame(() => {
      layout_measure_pending = false;
      virtualizer?.measure();
    });
  }

  const row_resize_observer = new ResizeObserver((entries) => {
    if (!virtualizer) return;

    for (const entry of entries) {
      virtualizer.measureElement(entry.target);
    }

    request_layout_measure();
  });

  // ── Row pool ──────────────────────────────────────────────────────────────
  const pool = new RowPool(entry_template, base_path, (node) => {
    row_resize_observer.unobserve(node);
    pool?.clear_observed?.(node);
  });

  // ── Render visible items ───────────────────────────────────────────────────
  let rendering = false;

  function render_items(virtual_items, total_size) {
    if (rendering) return;
    rendering = true;

    inner_track.style.height = `${total_size}px`;

    // Update count + summary
    if (count_label) {
      count_label.textContent =
        active_states.size > 0
          ? `${filtered.length} / ${full_index.length}`
          : `${full_index.length}`;
    }

    if (filter_sum) {
      if (active_states.size > 0) {
        filter_sum.textContent = `— ${[...active_states].join(", ")}`;
        filter_sum.hidden = false;
      } else {
        filter_sum.hidden = true;
      }
    }

    if (clear_btn) clear_btn.hidden = active_states.size === 0;

    // Diff: keep existing nodes, add missing, prune stale
    const active_keys = virtual_items.map((v) => v.key);
    pool.prune(active_keys);

    for (const v_item of virtual_items) {
      const node = pool.get(v_item, filtered);
      if (node.parentElement !== list_el) {
        list_el.appendChild(node);
      }

      // Only observe + measure on the FIRST render for this node. ResizeObserver
      // fires synchronously on first observe with the initial size, so the
      // virtualizer gets its real measurement immediately. Subsequent size
      // changes (image lazy-load, font swap, window resize) are handled by the
      // ResizeObserver callback — no need to force re-measure every frame.
      // The previous unconditional measureElement call here was the core of
      // the stutter feedback loop: measured → cache updated → total changed →
      // onChange fired → render_items again → measure again.
      if (pool.is_new_to_dom(node)) {
        row_resize_observer.observe(node);
        pool.mark_observed(node);
      }
    }

    rendering = false;
  }

  // ── TanStack virtualizer ───────────────────────────────────────────────────
  let virtualizer = null;

  function make_virtualizer() {
    if (virtualizer) {
      virtualizer.cleanup?.();
      virtualizer = null;
    }

    virtualizer = new Virtualizer({
      count: filtered.length,
      // Window-based scroll: the nigredo archive is the primary content of
      // the page, so the document is the scroll context. The windowScroll /
      // observeWindow* helpers read element.innerHeight, scrollY, and call
      // scrollTo — which means getScrollElement must return `window` itself,
      // not document.documentElement. Returning the documentElement would
      // cause innerHeight/scrollY to be undefined and the virtualizer to
      // render nothing.
      getScrollElement: () => window,
      estimateSize: (index) => {
        const entry = filtered[index];
        return entry?.excerpt
          ? ESTIMATED_HEIGHT_WITH_EXCERPT
          : ESTIMATED_HEIGHT_HEADER_ONLY;
      },
      measureElement: (el) => {
        return measure_row(el);
      },
      overscan: OVERSCAN,
      scrollToFn: windowScroll,
      observeElementRect: observeWindowRect,
      observeElementOffset: observeWindowOffset,
      onChange: (v) => {
        render_items(v.getVirtualItems(), v.getTotalSize());
      },
    });

    virtualizer._didMount();
    virtualizer._willUpdate();

    return virtualizer;
  }

  // ── Filter wiring ─────────────────────────────────────────────────────────
  function apply_filters() {
    filtered = filter_entries(full_index, active_states);
    // Clear the pool so rows are rebuilt for new filtered set
    pool.prune([]);
    list_el.replaceChildren();
    // Reset the unified window scroll so a new filter starts the archive
    // from the top instead of stranding the reader deep in the old list.
    window.scrollTo({ top: 0, behavior: "instant" });
    make_virtualizer();
    request_layout_measure();
  }

  if (filter_rail) {
    filter_rail.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter-state]");
      if (!btn) return;
      const state = btn.dataset.filterState;
      if (active_states.has(state)) {
        active_states.delete(state);
        btn.dataset.active = "false";
      } else {
        active_states.add(state);
        btn.dataset.active = "true";
      }
      apply_filters();
    });
  }

  if (clear_btn) {
    clear_btn.addEventListener("click", () => {
      active_states.clear();
      filter_rail
        .querySelectorAll("[data-filter-state]")
        .forEach((btn) => (btn.dataset.active = "false"));
      apply_filters();
    });
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  make_virtualizer();

  request_layout_measure();

  window.addEventListener("resize", request_layout_measure, { passive: true });

  if (document.fonts?.status === "loading") {
    document.fonts.ready.then(() => {
      request_layout_measure();
    });
  }
}

// Auto-boot
document.addEventListener("DOMContentLoaded", init_nigredo_archive);
document.addEventListener("htmx:afterSettle", init_nigredo_archive);
