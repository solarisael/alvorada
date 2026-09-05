const FX_SOURCE_SELECTOR =
  ".sol__text_fx, [data-text-fx], [class*='sol__text_fx'], [class*='fx-']";
const HYDRATION_DATA_ATTRS = new Set([
  "data-text-fx-hydrated",
  "data-combat-tokens-hydrated",
]);

export const split_text_for_pretext_items = (text_value) => {
  const source = String(text_value ?? "");
  const tokens = [];
  let pending_space = "";

  for (const match of source.matchAll(/\s+|\S+/gu)) {
    const token = match[0];

    if (/^\s+$/u.test(token)) {
      pending_space = " ";
      continue;
    }

    tokens.push(`${pending_space}${token}`);
    pending_space = "";
  }

  return { tokens, pendingSpace: pending_space };
};

const read_font_shorthand = (style) => {
  if (style.font) {
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

const is_source_attribute = (name) => {
  if (name === "class") return true;
  if (HYDRATION_DATA_ATTRS.has(name)) return false;
  return name === "data-text-fx" || name.startsWith("data-text-fx-");
};

const read_fx_meta = (element) => {
  if (!element.matches(FX_SOURCE_SELECTOR)) {
    return null;
  }

  const attributes = {};

  for (const attribute of element.attributes) {
    if (is_source_attribute(attribute.name)) {
      attributes[attribute.name] = attribute.value;
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

export const extract_pretext_source = (root) => {
  const items = [];
  const metadata = [];
  const pendingSpaceRef = { value: "" };

  const walk = (node, inheritedMeta, inheritedStyleElement) => {
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
    walk(child, null, root);
  }

  return { items, metadata };
};
