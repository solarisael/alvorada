import { layoutNextLine, prepareWithSegments } from "@chenglou/pretext";
import { slot_for_line } from "./portrait_hull.js";

const read_field_text = (root, selector) =>
  root.querySelector(selector)?.textContent?.trim() ?? "";

const card_text = (card) => {
  if (card.classList.contains("dossier-card--traits")) {
    return [...card.querySelectorAll("li")]
      .map((item) => item.textContent?.trim())
      .filter(Boolean)
      .join(" · ");
  }

  return [...card.querySelectorAll("blockquote, p:not(.dossier-card__number)")]
    .map((element) => element.textContent?.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" ");
};

const render_profile = (layer, card, side, start_y, root_rect, image_rect) => {
  let y = start_y;
  let slot = slot_for_line(side, root_rect, image_rect, y, 18);
  while (slot.right - slot.left < 96) {
    y += 18;
    slot = slot_for_line(side, root_rect, image_rect, y, 18);
  }

  const heading = document.createElement("span");
  heading.className = "pretext-float-heading";
  heading.textContent = read_field_text(card, ".dossier-card__number");
  Object.assign(heading.style, {
    left: `${slot.left}px`,
    top: `${y}px`,
    width: `${slot.right - slot.left}px`,
  });
  layer.append(heading);
  y += 23;

  card.querySelectorAll("dl > div").forEach((row) => {
    let field_slot = slot_for_line(side, root_rect, image_rect, y, 34);
    while (field_slot.right - field_slot.left < 84) {
      y += 17;
      field_slot = slot_for_line(side, root_rect, image_rect, y, 34);
    }

    const field = document.createElement("span");
    field.className = "pretext-float-field";
    const label = document.createElement("span");
    label.className = "pretext-float-field__label";
    label.textContent = read_field_text(row, "dt");
    const value = document.createElement("span");
    value.className = "pretext-float-field__value";
    value.textContent = read_field_text(row, "dd");
    field.append(label, value);
    Object.assign(field.style, {
      left: `${field_slot.left}px`,
      top: `${y}px`,
      width: `${field_slot.right - field_slot.left}px`,
    });
    layer.append(field);
    y += Math.max(42, field.getBoundingClientRect().height + 8);
  });
};

export const render_block = (
  layer,
  card,
  side,
  start_y,
  root_rect,
  image_rect,
) => {
  if (card.classList.contains("dossier-card--profile")) {
    render_profile(layer, card, side, start_y, root_rect, image_rect);
    return;
  }

  const source = card_text(card);
  const sample = card.querySelector(
    "dd, blockquote, p:not(.dossier-card__number), li",
  );
  const styles = getComputedStyle(sample ?? card);
  const line_height = Math.max(15, Number.parseFloat(styles.lineHeight) || 20);
  const font = `${styles.fontStyle} ${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
  const prepared = prepareWithSegments(source, font, {
    whiteSpace: "pre-wrap",
  });
  let cursor = { segmentIndex: 0, graphemeIndex: 0 };
  let y = start_y;
  let heading_rendered = false;

  for (let guard = 0; guard < 120; guard += 1) {
    const slot = slot_for_line(side, root_rect, image_rect, y, line_height);
    const width = slot.right - slot.left;
    if (width < 72) {
      y += line_height;
      continue;
    }

    if (!heading_rendered) {
      const heading = document.createElement("span");
      heading.className = "pretext-float-heading";
      heading.textContent = read_field_text(card, ".dossier-card__number");
      Object.assign(heading.style, {
        left: `${slot.left}px`,
        top: `${y}px`,
        width: `${width}px`,
      });
      layer.append(heading);
      y += 22;
      heading_rendered = true;
      continue;
    }

    const line = layoutNextLine(prepared, cursor, width);
    if (line === null) break;
    const span = document.createElement("span");
    span.className = "pretext-float-line";
    span.textContent = line.text;
    Object.assign(span.style, {
      left: `${slot.left}px`,
      top: `${y}px`,
      font,
      lineHeight: `${line_height}px`,
    });
    layer.append(span);
    cursor = line.end;
    y += line_height + 2;
  }
};
