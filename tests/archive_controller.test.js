import { describe, expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

if (!globalThis.window) {
  GlobalRegistrator.register({ url: "https://solarisael.local/current/" });
}

const { init_archive } = await import("../src/scripts/archive_controller.js");
const { init_albedo_archive } =
  await import("../src/scripts/albedo_archive.js");
const { init_nigredo_archive } =
  await import("../src/scripts/nigredo_archive.js");

const NODE_DISPOSAL_API_SYMBOL = Symbol.for("solarisael.node_disposal");
const contract = Object.freeze({
  phase: "test",
  root_selector: "[data-test-archive]",
  index_id: "sol_test_archive_index",
  bound_property: "__test_archive_controller",
  filter_rail_selector: "[data-test-filter-rail]",
  filter_toggle_selector: "[data-test-filter-toggle]",
  filter_clear_selector: "[data-test-filter-clear]",
  filter_summary_selector: "[data-test-filter-summary]",
  count_selector: "[data-test-count]",
  scroll_selector: "[data-test-scroll]",
  inner_selector: "[data-test-inner]",
  list_selector: "[data-test-list]",
  measure_list_class: "test_measure_list",
  filter_group_selector: ".test_filter_group",
  entry_template_selector: "[data-test-entry-template]",
  entry_selector: "[data-test-entry]",
  preview_selector: "[data-test-preview]",
  full_selector: "[data-test-full]",
  expand_selector: "[data-test-expand]",
});

const entries = [
  {
    key: "first",
    index: 0,
    published_at: "2026-06-02",
    states: ["calm"],
    can_expand: true,
    collapsed_size: 80,
    collapsed_size_mobile: 80,
    expanded_size: 120,
    expanded_size_mobile: 120,
  },
  {
    key: "second",
    index: 1,
    published_at: "2026-06-01",
    states: ["hope"],
    can_expand: false,
    collapsed_size: 80,
    collapsed_size_mobile: 80,
    expanded_size: 80,
    expanded_size_mobile: 80,
  },
];

function install_disposal_runtime() {
  const previous_runtime = globalThis[NODE_DISPOSAL_API_SYMBOL];
  const callbacks = new Map();
  let callback_invocations = 0;

  globalThis[NODE_DISPOSAL_API_SYMBOL] = {
    register_node_disposal(root, callback) {
      callbacks.set(root, callback);
      return () => callbacks.delete(root);
    },
  };

  return {
    dispose(root) {
      const callback = callbacks.get(root);
      if (!callback) return;
      callbacks.delete(root);
      callback_invocations += 1;
      callback();
      callback();
    },
    restore() {
      if (previous_runtime) {
        globalThis[NODE_DISPOSAL_API_SYMBOL] = previous_runtime;
      } else {
        delete globalThis[NODE_DISPOSAL_API_SYMBOL];
      }
    },
    get callback_invocations() {
      return callback_invocations;
    },
  };
}

function append_test_archive(index_text = JSON.stringify(entries)) {
  document.body.replaceChildren();

  const root = document.createElement("section");
  root.dataset.testArchive = "";
  root.innerHTML = `
    <div data-test-filter-rail data-mobile-collapsed="true">
      <button
        type="button"
        data-test-filter-toggle
        aria-expanded="false"
      >show filters</button>
      <div class="test_filter_group">
        <button type="button" data-filter-container="tone">tone</button>
        <button type="button" data-filter-state="calm">calm</button>
        <button type="button" data-filter-state="hope">hope</button>
      </div>
    </div>
    <button type="button" data-test-filter-clear hidden>clear</button>
    <span data-test-filter-summary hidden></span>
    <span data-test-count></span>
    <div data-test-scroll>
      <div data-test-inner><ol data-test-list></ol></div>
    </div>
  `;

  const index = document.createElement("script");
  index.id = contract.index_id;
  index.type = "application/json";
  index.textContent = index_text;

  for (const entry of entries) {
    const template = document.createElement("template");
    template.dataset.testEntryTemplate = "";
    template.dataset.index = String(entry.index);
    template.innerHTML = `
      <li data-test-entry data-entry-index="${entry.index}">
        <div data-test-preview>preview</div>
        <div data-test-full hidden>full</div>
        <button type="button" data-test-expand>read more</button>
      </li>
    `;
    root.append(template);
  }

  document.body.append(index, root);
  return root;
}

function append_phase_archive(phase, index_id) {
  document.body.replaceChildren();

  const root = document.createElement("section");
  root.setAttribute(`data-${phase}-archive`, "");
  root.innerHTML = `
    <div data-${phase}-filter-rail data-mobile-collapsed="true">
      <button
        type="button"
        data-${phase}-filter-toggle
        aria-expanded="false"
      >show filters</button>
    <button type="button" data-${phase}-filter-clear hidden>clear</button>
    <span data-${phase}-filter-summary hidden></span>
    <span data-${phase}-count></span>
    <div data-${phase}-scroll>
      <div data-${phase}-inner><ol data-${phase}-list></ol></div>
    </div>
  `;

  const index = document.createElement("script");
  index.id = index_id;
  index.type = "application/json";
  index.textContent = JSON.stringify(entries);

  for (const entry of entries) {
    const template = document.createElement("template");
    template.setAttribute(`data-${phase}-entry-template`, "");
    template.dataset.index = String(entry.index);
    template.innerHTML = `
      <li data-${phase}-entry data-entry-index="${entry.index}">
        <div data-${phase}-preview>preview</div>
        <div data-${phase}-full hidden>full</div>
        <button type="button" data-${phase}-expand>read more</button>
      </li>
    `;
    root.append(template);
  }

  document.body.append(index, root);
  return root;
}

describe("archive controller lifecycle", () => {
  test("preserves filtering and expansion before one detached-root cleanup", () => {
    const disposal = install_disposal_runtime();
    const root = append_test_archive();
    const controller = init_archive(contract);

    expect(controller).toBeTruthy();
    expect(root[contract.bound_property]).toBe(controller);
    expect(root.querySelector("[data-test-count]").textContent).toBe("2");
    const filter_toggle = root.querySelector("[data-test-filter-toggle]");
    expect(filter_toggle.getAttribute("aria-expanded")).toBe("false");
    filter_toggle.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(
      root.querySelector("[data-test-filter-rail]").dataset.mobileCollapsed,
    ).toBe("false");
    expect(filter_toggle.getAttribute("aria-expanded")).toBe("true");
    expect(filter_toggle.textContent).toBe("hide filters");

    root
      .querySelector('[data-filter-state="calm"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(root.querySelector("[data-test-count]").textContent).toBe("1 / 2");

    const expand_button = root.querySelector(
      "[data-test-list] [data-test-expand]",
    );
    expand_button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(
      root.querySelector("[data-test-list] [data-test-preview]").hidden,
    ).toBe(true);
    expect(root.querySelector("[data-test-list] [data-test-full]").hidden).toBe(
      false,
    );

    root.remove();
    disposal.dispose(root);
    expect(disposal.callback_invocations).toBe(1);
    expect(root.querySelector("[data-test-list]").childElementCount).toBe(0);
    expect(root.querySelector(".test_measure_list")).toBeNull();
    expect(root[contract.bound_property]).toBeUndefined();
    disposal.restore();
  });

  for (const [phase, index_id, init] of [
    ["nigredo", "sol_nigredo_archive_index", init_nigredo_archive],
    ["albedo", "sol_albedo_archive_index", init_albedo_archive],
  ]) {
    test(`${phase} binds its embedded archive payload`, () => {
      const disposal = install_disposal_runtime();
      const root = append_phase_archive(phase, index_id);
      const controller = init();

      expect(controller).toBeTruthy();
      expect(root.querySelector(`[data-${phase}-count]`).textContent).toBe("2");

      root.remove();
      disposal.dispose(root);
      disposal.restore();
    });
  }

  test("does not bind malformed JSON and retries after the index is corrected", () => {
    const disposal = install_disposal_runtime();
    const root = append_test_archive("{");

    expect(init_archive(contract)).toBeNull();
    expect(root[contract.bound_property]).toBeUndefined();

    document.getElementById(contract.index_id).textContent =
      JSON.stringify(entries);
    const controller = init_archive(contract);
    expect(controller).toBeTruthy();

    root.remove();
    disposal.dispose(root);
    disposal.restore();
  });
});
