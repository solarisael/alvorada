// fx interaction layer — one popup engine under everything.
//
// Any element carrying `data-ix="trigger:action:payload"` becomes a
// hover-preview / click-pin trigger for a single shared popup card. This
// mirrors text_effects.js: pure-ish module, no listeners bound at import
// time — `hydrate_interactions()` is called by index.js on DOM-ready and
// re-called on htmx:afterSwap.
//
// Grammar (see contract.js):
//   trigger: "hover" | "click"
//   action:  "preview" (payload is literal text, shown as-is)
//            "reveal"  (payload is a CSS selector; card shows its innerHTML)
//            "fetch"   (payload unused here — the anchor itself already
//                       carries real hx-get/hx-trigger/hx-target attributes
//                       emitted at build time; this engine only owns the
//                       popup shell — position/show/hide/pin — HTMX owns
//                       the network fetch and DOM swap into the slot)
//
// Pin contract: clicking a non-navigating trigger (no real href) toggles
// pin. A pinned card stays open until an outside click or another trigger
// is activated. A real `<a href>` with trigger="hover" is left alone on
// click — native navigation wins, the preview was just a hint.

import { IX_BASE_CLASS, parse_ix_descriptor } from "./contract.js";

const IX_POPUP_ID = "sol_ix_popup";
const IX_POPUP_SLOT_ID = "sol_ix_popup_slot";
const IX_HIDE_DELAY_MS = 120;

const window_any = /** @type {any} */ (globalThis);

let active_trigger_el = null;
let is_pinned = false;
let hide_timer_id = null;

const clear_hide_timer = () => {
  if (hide_timer_id !== null) {
    clearTimeout(hide_timer_id);
    hide_timer_id = null;
  }
};

const ensure_popup_el = () => {
  const existing_popup_el = document.getElementById(IX_POPUP_ID);

  if (existing_popup_el instanceof HTMLElement) {
    return existing_popup_el;
  }

  const popup_el = document.createElement("div");
  popup_el.id = IX_POPUP_ID;
  popup_el.className = `${IX_BASE_CLASS}_popup`;
  popup_el.hidden = true;
  popup_el.setAttribute("role", "tooltip");

  const ring_el = document.createElement("div");
  ring_el.className = `${IX_BASE_CLASS}_popup_ring`;

  const slot_el = document.createElement("div");
  slot_el.id = IX_POPUP_SLOT_ID;
  slot_el.className = `${IX_BASE_CLASS}_popup_slot`;

  const door_el = document.createElement("a");
  door_el.className = `${IX_BASE_CLASS}_popup_door`;
  door_el.hidden = true;

  popup_el.append(ring_el, slot_el, door_el);
  document.body.append(popup_el);

  popup_el.addEventListener("mouseenter", clear_hide_timer);
  popup_el.addEventListener("mouseleave", () => schedule_hide());

  return popup_el;
};

const schedule_hide = () => {
  clear_hide_timer();

  if (is_pinned) {
    return;
  }

  hide_timer_id = setTimeout(() => hide_popup(), IX_HIDE_DELAY_MS);
};

const hide_popup = () => {
  if (is_pinned) {
    return;
  }

  const popup_el = document.getElementById(IX_POPUP_ID);

  if (popup_el instanceof HTMLElement) {
    popup_el.hidden = true;
  }

  active_trigger_el = null;
};

// Below 769px there's no hover to speak of and a floating card near a
// fingertip covers exactly what you tapped to see — position_popup_near
// skips inline placement entirely there and lets the CSS media query
// (interactions.css) own a fixed bottom sheet instead. Matches the site's
// existing mobile/desktop split (mobile_nav.css / desktop_nav.css: 768px).
const IX_MOBILE_BREAKPOINT_QUERY = "(max-width: 768px)";

const ix_is_mobile_viewport = () => {
  return typeof window.matchMedia === "function" && window.matchMedia(IX_MOBILE_BREAKPOINT_QUERY).matches;
};

// Placement order flips based on popup height: a short card (plain-text
// preview) tries below/above first since that reads naturally under a
// word; a tall one (an image-carrying fetch/reveal) tries the sides
// first — above/below squeeze a tall card against the anchor's own
// height on top of the viewport edge, side placement only has to clear
// the viewport edge itself. Combined with no overflow/scroll on the
// popup (interactions.css), this is what keeps tall content fully
// visible instead of clipped.
const IX_TALL_POPUP_THRESHOLD_PX = 180;

const ix_popup_placements = (anchor_rect, popup_rect, viewport_width, viewport_height, margin) => {
  const centered_left = anchor_rect.left + anchor_rect.width / 2 - popup_rect.width / 2;
  const centered_top = anchor_rect.top + anchor_rect.height / 2 - popup_rect.height / 2;

  const below = { left: centered_left, top: anchor_rect.bottom + margin };
  const above = { left: centered_left, top: anchor_rect.top - popup_rect.height - margin };
  const to_the_right = { left: anchor_rect.right + margin, top: centered_top };
  const to_the_left = { left: anchor_rect.left - popup_rect.width - margin, top: centered_top };

  const ordered_placements =
    popup_rect.height > IX_TALL_POPUP_THRESHOLD_PX
      ? [to_the_right, to_the_left, below, above]
      : [below, above, to_the_right, to_the_left];

  return ordered_placements.map((placement) => ({
    ...placement,
    fits:
      placement.left >= margin &&
      placement.left + popup_rect.width <= viewport_width - margin &&
      placement.top >= margin &&
      placement.top + popup_rect.height <= viewport_height - margin,
  }));
};

const position_popup_near = (popup_el, anchor_el) => {
  if (ix_is_mobile_viewport()) {
    popup_el.style.removeProperty("left");
    popup_el.style.removeProperty("top");
    return;
  }

  const anchor_rect = anchor_el.getBoundingClientRect();
  const popup_rect = popup_el.getBoundingClientRect();
  const viewport_width = window.innerWidth;
  const viewport_height = window.innerHeight;
  const margin = 8;

  const placements = ix_popup_placements(anchor_rect, popup_rect, viewport_width, viewport_height, margin);
  const best_fit = placements.find((placement) => placement.fits) ?? placements[0];

  const clamped_left = Math.max(margin, Math.min(best_fit.left, viewport_width - popup_rect.width - margin));
  const clamped_top = Math.max(margin, Math.min(best_fit.top, viewport_height - popup_rect.height - margin));

  popup_el.style.left = `${clamped_left}px`;
  popup_el.style.top = `${clamped_top}px`;
};

// `data-ix` payload URLs are authored as site-root-relative paths
// ("/codex/characters/cinza") in markdown/vault content, same convention
// as href/src there — but unlike href/src, `fetch()` resolves a leading
// "/" against the origin, NOT the deployed base subpath, so a
// site-root-relative fetch target needs the base prepended by hand. The
// layout stamps the configured base onto <html data-base-path> at build
// time (see src/utils/routes.js); read it once, here, not per-call.
const ix_site_base_path = (() => {
  const raw_base = document.documentElement?.dataset?.basePath ?? "";
  return raw_base.replace(/\/+$/, "");
})();

const resolve_ix_fetch_url = (raw_url) => {
  if (!raw_url.startsWith("/") || raw_url.startsWith("//")) {
    return raw_url;
  }

  if (!ix_site_base_path || raw_url.startsWith(`${ix_site_base_path}/`)) {
    return raw_url;
  }

  return `${ix_site_base_path}${raw_url}`;
};

// fetch action: dependency-free (plain fetch + DOMParser, no htmx.ajax) so
// this engine stays copy-paste portable per the vendor README — a host
// page without HTMX still gets working fetch-preview popups. Page-lifetime
// cache keyed by URL means a URL is only ever fetched once, hover it as
// many times as you like; `ix_fetch_prefetch(...)` (called from
// bind_ix_node below) warms that same cache during browser idle time so
// the first real hover is often already a cache hit.
const ix_fetch_cache = new Map();

const extract_selected_fragment = (html_text, select_value) => {
  if (!select_value) {
    return html_text;
  }

  const parsed_document = new DOMParser().parseFromString(html_text, "text/html");
  const selected_el = parsed_document.querySelector(select_value);

  return selected_el instanceof HTMLElement ? selected_el.innerHTML : html_text;
};

const ix_fetch_fragment = async (raw_url_value, select_value) => {
  const url_value = resolve_ix_fetch_url(raw_url_value);
  const cache_key = `${url_value}\u0000${select_value ?? ""}`;

  if (ix_fetch_cache.has(cache_key)) {
    return ix_fetch_cache.get(cache_key);
  }

  const fetch_promise = fetch(url_value)
    .then((response_value) => response_value.text())
    .then((html_text) => extract_selected_fragment(html_text, select_value));

  // Cache the in-flight promise, not just the eventual value — two triggers
  // racing for the same URL (hover + idle-prefetch, or two triggers sharing
  // a target) share one network request instead of firing two.
  ix_fetch_cache.set(cache_key, fetch_promise);

  try {
    return await fetch_promise;
  } catch (fetch_error) {
    ix_fetch_cache.delete(cache_key);
    throw fetch_error;
  }
};

const ix_fetch_prefetch = (url_value, select_value) => {
  ix_fetch_fragment(url_value, select_value).catch(() => {
    // Idle prefetch is a courtesy, not a promise — a real hover will retry
    // and surface the failure state normally.
  });
};

const load_ix_fetch_content = (slot_el, url_value, select_value) => {
  slot_el.dataset.ixFetchUrl = url_value;
  slot_el.dataset.ixFetchPending = "true";

  ix_fetch_fragment(url_value, select_value)
    .then((fragment_html) => {
      // The user may have moved to a different trigger while this was in
      // flight — only paint if this slot is still showing the request we
      // started (the shared popup slot has no other way to know).
      if (slot_el.dataset.ixFetchUrl !== url_value) {
        return;
      }

      slot_el.innerHTML = fragment_html;
      delete slot_el.dataset.ixFetchPending;
    })
    .catch(() => {
      if (slot_el.dataset.ixFetchUrl !== url_value) {
        return;
      }

      slot_el.textContent = "couldn't load this.";
      delete slot_el.dataset.ixFetchPending;
    });
};

// Five defaults, opt in via data-ix-profile on the trigger (unset ->
// "card", the original ring/border/blur chrome with image-then-text
// stacking):
//   "float"       same chrome, image floats to the inline-start edge and
//                 text wraps around it instead of stacking below it.
//   "explanation" dictionary layout: the trigger's own visible text, bold,
//                 then the action's content below it with a small margin.
//   "compact"     small label/chip shape for terse definitions.
//   "reliquary"   ceremonial card shape for richer lore/image previews.
// Content-building (the action branches) is identical across profiles —
// only WHERE it writes to differs, via content_target_el.
const IX_PROFILE_FLOAT = "float";
const IX_PROFILE_EXPLANATION = "explanation";
const IX_PROFILE_COMPACT = "compact";
const IX_PROFILE_RELIQUARY = "reliquary";
const IX_KNOWN_PROFILES = new Set([
  IX_PROFILE_FLOAT,
  IX_PROFILE_EXPLANATION,
  IX_PROFILE_COMPACT,
  IX_PROFILE_RELIQUARY,
]);

const populate_popup = (popup_el, descriptor, anchor_el) => {
  const slot_el = popup_el.querySelector(`#${IX_POPUP_SLOT_ID}`);
  const door_el = popup_el.querySelector(`.${IX_BASE_CLASS}_popup_door`);

  if (!(slot_el instanceof HTMLElement) || !(door_el instanceof HTMLAnchorElement)) {
    return;
  }

  delete slot_el.dataset.ixFetchPending;

  const raw_profile = anchor_el.dataset.ixProfile;
  const profile = IX_KNOWN_PROFILES.has(raw_profile) ? raw_profile : null;

  popup_el.classList.toggle(`${IX_BASE_CLASS}_popup_profile_float`, profile === IX_PROFILE_FLOAT);
  popup_el.classList.toggle(`${IX_BASE_CLASS}_popup_profile_explanation`, profile === IX_PROFILE_EXPLANATION);
  popup_el.classList.toggle(`${IX_BASE_CLASS}_popup_profile_compact`, profile === IX_PROFILE_COMPACT);
  popup_el.classList.toggle(`${IX_BASE_CLASS}_popup_profile_reliquary`, profile === IX_PROFILE_RELIQUARY);
  let content_target_el = slot_el;

  if (profile === IX_PROFILE_EXPLANATION) {
    slot_el.innerHTML = "";

    const term_el = document.createElement("strong");
    term_el.className = `${IX_BASE_CLASS}_popup_term`;
    term_el.textContent = anchor_el.textContent ?? "";

    const body_el = document.createElement("div");
    body_el.className = `${IX_BASE_CLASS}_popup_explanation_body`;

    slot_el.append(term_el, body_el);
    content_target_el = body_el;
  }

  if (descriptor.action === "preview") {
    content_target_el.textContent = descriptor.payload;
  } else if (descriptor.action === "reveal") {
    const reveal_target_el = descriptor.payload
      ? document.querySelector(descriptor.payload)
      : null;
    content_target_el.innerHTML = reveal_target_el instanceof HTMLElement ? reveal_target_el.innerHTML : "";
  } else if (descriptor.action === "fetch") {
    // Own the whole round-trip here (see ix_fetch_fragment above) rather
    // than leaning on the anchor's own hx-get — that attribute is already
    // claimed by this same element's normal click-navigation behavior on
    // most triggers (e.g. nav pills), and HTMX only supports one
    // target/select pair per element, not one per trigger.
    load_ix_fetch_content(content_target_el, descriptor.payload, anchor_el.dataset.ixSelect || null);
  }

  // Explicit data-ix-href wins; otherwise a real navigation link's own
  // href doubles as the door — mobile has no hover, so the pinned peek
  // needs *some* way through besides a second tap that just unpins it.
  const door_href =
    anchor_el.dataset.ixHref ||
    (is_real_navigation_link(anchor_el) ? anchor_el.getAttribute("href") : null);
  door_el.hidden = !(is_pinned && door_href);

  if (!door_el.hidden && door_href) {
    door_el.href = door_href;
    door_el.textContent = anchor_el.dataset.ixDoorLabel || "\u2192 open";
  }
};

const show_popup_for = (anchor_el, descriptor) => {
  clear_hide_timer();

  const popup_el = ensure_popup_el();
  active_trigger_el = anchor_el;
  popup_el.hidden = false;
  popup_el.classList.toggle(`${IX_BASE_CLASS}_popup_pinned`, is_pinned);
  populate_popup(popup_el, descriptor, anchor_el);
  position_popup_near(popup_el, anchor_el);
};

const pin_popup = (anchor_el, descriptor) => {
  is_pinned = true;
  show_popup_for(anchor_el, descriptor);
};

const unpin_popup = () => {
  is_pinned = false;

  const popup_el = document.getElementById(IX_POPUP_ID);

  if (popup_el instanceof HTMLElement) {
    popup_el.classList.remove(`${IX_BASE_CLASS}_popup_pinned`);
  }

  schedule_hide();
};

const is_real_navigation_link = (node_value) => {
  return node_value instanceof HTMLAnchorElement && node_value.hasAttribute("href");
};

const bind_ix_node = (node_value) => {
  if (!(node_value instanceof HTMLElement)) {
    return;
  }

  if (node_value.dataset.ixHydrated === "true") {
    return;
  }

  const descriptor = parse_ix_descriptor(node_value.dataset.ix ?? "");

  if (!descriptor) {
    return;
  }

  node_value.dataset.ixHydrated = "true";
  node_value.classList.add(IX_BASE_CLASS);

  if (descriptor.action === "fetch") {
    const prefetch_url = descriptor.payload;
    const prefetch_select = node_value.dataset.ixSelect || null;
    const schedule_idle = typeof requestIdleCallback === "function" ? requestIdleCallback : setTimeout;

    schedule_idle(() => ix_fetch_prefetch(prefetch_url, prefetch_select));
  }
  if (descriptor.trigger === "hover") {
    node_value.addEventListener("mouseenter", () => show_popup_for(node_value, descriptor));
    node_value.addEventListener("mouseleave", () => schedule_hide());
    node_value.addEventListener("focus", () => show_popup_for(node_value, descriptor));
    node_value.addEventListener("blur", () => schedule_hide());
  }

  node_value.addEventListener("click", (click_event) => {
    if (descriptor.trigger === "hover" && is_real_navigation_link(node_value) && !ix_is_mobile_viewport()) {
      // Native navigation wins for real links; the preview was just a hint.
      return;
    }

    // Mobile has no hover: a real link's first tap peeks the popup
    // (informational, matches the desktop hover step) instead of
    // navigating away immediately. The door link (see populate_popup's
    // href fallback) is how a mobile tap actually goes through.
    if (
      descriptor.trigger === "hover" &&
      is_real_navigation_link(node_value) &&
      ix_is_mobile_viewport() &&
      !(is_pinned && active_trigger_el === node_value)
    ) {
      click_event.preventDefault();
      pin_popup(node_value, descriptor);
      return;
    }

    click_event.preventDefault();

    if (is_pinned && active_trigger_el === node_value) {
      unpin_popup();
      return;
    }

    pin_popup(node_value, descriptor);
  });
};

const find_ix_nodes = (root_node = document) => {
  if (!root_node || typeof root_node.querySelectorAll !== "function") {
    return [];
  }

  return Array.from(root_node.querySelectorAll("[data-ix]"));
};

const hydrate_interactions = (root_node = document) => {
  find_ix_nodes(root_node).forEach(bind_ix_node);
};

if (typeof document !== "undefined" && !window_any.__ix_global_dismiss_bound) {
  document.addEventListener("click", (click_event) => {
    if (!is_pinned) {
      return;
    }

    const popup_el = document.getElementById(IX_POPUP_ID);
    const click_target = click_event.target;

    if (popup_el instanceof HTMLElement && popup_el.contains(click_target)) {
      return;
    }

    if (active_trigger_el instanceof HTMLElement && active_trigger_el.contains(click_target)) {
      return;
    }

    unpin_popup();
  });

  document.addEventListener("keydown", (key_event) => {
    if (is_pinned && key_event.key === "Escape") {
      unpin_popup();
    }
  });

  window_any.__ix_global_dismiss_bound = true;
}

export { hydrate_interactions };
