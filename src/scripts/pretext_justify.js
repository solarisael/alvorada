import {
  layoutNextRichInlineLineRange,
  materializeRichInlineLineRange,
  prepareRichInline,
  walkRichInlineLineRanges,
} from "@chenglou/pretext/rich-inline";

const SOL_PRETEXT_SELECTOR = '[data-sol-pretext="justify"]';
const FX_SOURCE_SELECTOR =
  ".sol__text_fx, [data-text-fx], [class*='sol__text_fx'], [class*='fx-']";
const HYDRATION_DATA_ATTRS = new Set([
  "data-text-fx-hydrated",
  "data-combat-tokens-hydrated",
]);
const source_cache = new WeakMap();
const observed_roots = new WeakSet();
let resize_observer = null;
const MIN_SHAPED_LINE_WIDTH_RATIO = 0.34;
const SHAPED_LAYOUT_SAFETY_LINE_COUNT = 96;

const is_browser = () =>
  typeof document !== "undefined" && typeof window !== "undefined";

const normalize_space = (space_value) => (space_value.length > 0 ? " " : "");

export const split_text_for_pretext_items = (text_value) => {
  const source = String(text_value ?? "");
  const tokens = [];
  let pending_space = "";

  for (const match of source.matchAll(/\s+|\S+/gu)) {
    const token = match[0];

    if (/^\s+$/u.test(token)) {
      pending_space = normalize_space(pending_space + token);
      continue;
    }

    tokens.push(`${pending_space}${token}`);
    pending_space = "";
  }

  return { tokens, pendingSpace: pending_space };
};

export const compute_justified_gap_extra = ({
  lineWidth,
  targetWidth,
  gapCount,
  isLastLine,
}) => {
  if (isLastLine || gapCount <= 0 || targetWidth <= lineWidth) {
    return 0;
  }

  return (targetWidth - lineWidth) / gapCount;
};

const read_font_shorthand = (style) => {
  if (style.font && style.font !== "") {
    return style.font;
  }

  return `${style.fontStyle} ${style.fontVariant} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
};

const read_letter_spacing = (style) => {
  const raw_value = style.letterSpacing;

  if (!raw_value || raw_value === "normal") {
    return 0;
  }

  const parsed_value = Number.parseFloat(raw_value);
  return Number.isFinite(parsed_value) ? parsed_value : 0;
};

const shaped_width_ratio = ({ shape, lineIndex, lineCount }) => {
  if (lineCount <= 1) {
    return 1;
  }

  const progress = lineIndex / (lineCount - 1);

  if (shape === "diamond") {
    return 0.38 + 0.62 * (1 - Math.abs(progress - 0.5) * 2);
  }

  if (shape === "hourglass") {
    return 0.42 + 0.58 * Math.abs(progress - 0.5) * 2;
  }

  if (shape === "chalice") {
    if (progress < 0.16) {
      return 0.9;
    }

    if (progress < 0.56) {
      return 0.9 - ((progress - 0.16) / 0.4) * 0.34;
    }

    if (progress < 0.82) {
      return 0.34;
    }

    return 0.34 + ((progress - 0.82) / 0.18) * 0.42;
  }

  if (shape === "vessel") {
    const shoulder = Math.sin(progress * Math.PI);
    const base_taper = 1 - 0.24 * progress;
    return 0.5 + 0.5 * shoulder * base_taper;
  }

  return 1;
};

const shaped_line_width = ({ shape, width, lineIndex, lineCount }) =>
  width *
  Math.max(
    MIN_SHAPED_LINE_WIDTH_RATIO,
    Math.min(1, shaped_width_ratio({ shape, lineIndex, lineCount })),
  );

const layout_shaped_pretext_lines = ({ prepared, width, shape }) => {
  let line_count = Math.max(
    3,
    walkRichInlineLineRanges(prepared, width * 0.68, () => {}),
  );
  let lines = [];

  for (let iteration = 0; iteration < 4; iteration += 1) {
    line_count = Math.max(3, line_count);
    lines = [];

    let cursor;

    for (
      let line_index = 0;
      line_index < SHAPED_LAYOUT_SAFETY_LINE_COUNT;
      line_index += 1
    ) {
      const targetWidth = shaped_line_width({
        shape,
        width,
        lineIndex: line_index,
        lineCount: line_count,
      });
      const range = layoutNextRichInlineLineRange(
        prepared,
        targetWidth,
        cursor,
      );

      if (!range) {
        break;
      }

      const line = materializeRichInlineLineRange(prepared, range);
      line.targetWidth = targetWidth;
      lines.push(line);
      cursor = range.end;
    }

    if (lines.length === line_count) {
      break;
    }

    line_count = lines.length;
  }

  return lines;
};

const read_fx_meta = (element) => {
  if (
    !(element instanceof HTMLElement) ||
    !element.matches(FX_SOURCE_SELECTOR)
  ) {
    return null;
  }

  const attributes = {};

  for (const attribute of element.attributes) {
    if (attribute.name === "class") {
      attributes.class = attribute.value;
      continue;
    }

    if (
      attribute.name === "data-text-fx" ||
      attribute.name.startsWith("data-text-fx-")
    ) {
      if (!HYDRATION_DATA_ATTRS.has(attribute.name)) {
        attributes[attribute.name] = attribute.value;
      }
    }
  }

  if (!attributes.class && !attributes["data-text-fx"]) {
    return null;
  }

  return attributes;
};

const push_text_items = ({
  items,
  metadata,
  text,
  styleElement,
  meta,
  pendingSpaceRef,
}) => {
  const { tokens, pendingSpace } = split_text_for_pretext_items(
    `${pendingSpaceRef.value}${text}`,
  );
  pendingSpaceRef.value = pendingSpace;

  if (!tokens.length) {
    return;
  }

  const style = getComputedStyle(styleElement);
  const font = read_font_shorthand(style);
  const letterSpacing = read_letter_spacing(style);

  for (const token of tokens) {
    items.push({
      text: token,
      font,
      letterSpacing,
    });
    metadata.push(meta);
  }
};

const extract_pretext_source = (root) => {
  const items = [];
  const metadata = [];
  const pendingSpaceRef = { value: "" };

  const walk = (node, inheritedMeta = null, inheritedStyleElement = root) => {
    if (node.nodeType === Node.TEXT_NODE) {
      push_text_items({
        items,
        metadata,
        text: node.textContent ?? "",
        styleElement: inheritedStyleElement,
        meta: inheritedMeta,
        pendingSpaceRef,
      });
      return;
    }

    if (!(node instanceof HTMLElement)) {
      return;
    }

    if (node.matches("script, style")) {
      return;
    }

    const own_meta = read_fx_meta(node) ?? inheritedMeta;
    const style_element = node;

    for (const child of node.childNodes) {
      walk(child, own_meta, style_element);
    }
  };

  for (const child of root.childNodes) {
    walk(child);
  }

  return { items, metadata };
};

const count_justifiable_gaps = (line) =>
  line.fragments.filter(
    (fragment, index) => index > 0 && fragment.gapBefore > 0,
  ).length;

const apply_fragment_meta = (fragment_element, meta) => {
  fragment_element.classList.add("sol__pretext_fragment");

  if (!meta) {
    return;
  }

  for (const [name, value] of Object.entries(meta)) {
    if (name === "class") {
      fragment_element.className = `${value} sol__pretext_fragment`;
      continue;
    }

    fragment_element.setAttribute(name, value);
  }
};

const render_pretext_lines = ({
  root,
  lines,
  metadata,
  width,
  shape = null,
}) => {
  const rendered_lines = lines.map((line, line_index) => {
    const is_last_line = line_index === lines.length - 1;
    const line_width = line.targetWidth ?? width;
    const gap_count = count_justifiable_gaps(line);
    const gap_extra = compute_justified_gap_extra({
      lineWidth: line.width,
      targetWidth: line_width,
      gapCount: gap_count,
      isLastLine: is_last_line,
    });
    const line_element = document.createElement("span");
    line_element.className = "sol__pretext_line";
    line_element.dataset.solPretextLine = String(line_index + 1);
    line_element.dataset.solPretextJustified = String(gap_extra > 0);
    line_element.style.width = `${line_width}px`;
    line_element.style.maxWidth = "100%";

    for (const [fragment_index, fragment] of line.fragments.entries()) {
      const fragment_element = document.createElement("span");
      const meta = metadata[fragment.itemIndex] ?? null;
      apply_fragment_meta(fragment_element, meta);
      const should_add_gap = fragment_index > 0 && fragment.gapBefore > 0;
      fragment_element.textContent = should_add_gap
        ? ` ${fragment.text}`
        : fragment.text;
      fragment_element.dataset.solPretextItem = String(fragment.itemIndex);

      if (should_add_gap && gap_extra > 0) {
        fragment_element.style.marginInlineStart = `${gap_extra}px`;
      }

      line_element.append(fragment_element);
    }

    return line_element;
  });

  const rendered_nodes = rendered_lines.flatMap((line_element) => [
    line_element,
    document.createTextNode("\n"),
  ]);

  root.classList.add("sol__pretext_justified");
  root.classList.toggle("sol__pretext_shaped", Boolean(shape));
  root.dataset.solPretextHydrated = "true";

  if (shape) {
    root.dataset.solPretextShapeHydrated = shape;
  } else {
    delete root.dataset.solPretextShapeHydrated;
  }

  root.replaceChildren(...rendered_nodes);
};

export const reset_pretext_source = (root) => {
  source_cache.delete(root);
};

export const layout_pretext_root = (root) => {
  if (!(root instanceof HTMLElement)) {
    return false;
  }

  const width = root.clientWidth;

  if (!Number.isFinite(width) || width <= 0) {
    return false;
  }

  let source = source_cache.get(root);

  if (!source) {
    source = extract_pretext_source(root);
    source_cache.set(root, source);
  }

  if (!source.items.length) {
    return false;
  }

  const prepared = prepareRichInline(source.items);
  const shape = root.dataset.solPretextShape ?? null;
  const lines = shape
    ? layout_shaped_pretext_lines({ prepared, width, shape })
    : (() => {
        const ranges = [];
        walkRichInlineLineRanges(prepared, width, (range) =>
          ranges.push(range),
        );
        return ranges.map((range) =>
          materializeRichInlineLineRange(prepared, range),
        );
      })();

  render_pretext_lines({
    root,
    lines,
    metadata: source.metadata,
    width,
    shape,
  });

  return true;
};

const ensure_resize_observer = () => {
  if (resize_observer || typeof ResizeObserver === "undefined") {
    return resize_observer;
  }

  resize_observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      layout_pretext_root(entry.target);
    }
  });

  return resize_observer;
};

export const hydrate_pretext_justification = (root = document) => {
  if (!root || typeof root.querySelectorAll !== "function") {
    return;
  }

  const roots = Array.from(root.querySelectorAll(SOL_PRETEXT_SELECTOR));

  if (root instanceof HTMLElement && root.matches(SOL_PRETEXT_SELECTOR)) {
    roots.unshift(root);
  }

  const observer = ensure_resize_observer();

  for (const pretext_root of roots) {
    layout_pretext_root(pretext_root);

    if (observer && !observed_roots.has(pretext_root)) {
      observer.observe(pretext_root);
      observed_roots.add(pretext_root);
    }
  }
};

const hydrate_when_ready = (root = document) => {
  const font_ready = document.fonts?.ready ?? Promise.resolve();
  font_ready.then(() => hydrate_pretext_justification(root));
};

if (is_browser()) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => hydrate_when_ready());
  } else {
    hydrate_when_ready();
  }

  document.addEventListener("htmx:afterSwap", (event) => {
    const swap_target = event?.detail?.target;
    hydrate_when_ready(
      swap_target instanceof HTMLElement ? swap_target : document,
    );
  });
}
