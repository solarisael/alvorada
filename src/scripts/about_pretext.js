import { layoutNextLine, prepareWithSegments } from "@chenglou/pretext";

let alpha_rows = [];
let alpha_width = 0;
let alpha_height = 0;
let alpha_image = null;
let frame = 0;
let resize_observer = null;
let observed_composition = null;

const read_alpha_hull = (image) => {
  if (alpha_image === image && alpha_rows.length > 0) return;

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return;
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;

  alpha_image = image;
  alpha_width = canvas.width;
  alpha_height = canvas.height;
  alpha_rows = Array.from({ length: alpha_height }, (_, y) => {
    let left = alpha_width;
    let right = -1;
    for (let x = 0; x < alpha_width; x += 1) {
      if (pixels[(y * alpha_width + x) * 4 + 3] <= 12) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
    }
    return right >= left ? [left, right] : null;
  });
};

const card_text = (card) => {
  if (card.classList.contains("dossier-card--profile")) {
    return [...card.querySelectorAll("dl > div")]
      .map((row) => {
        const label = row.querySelector("dt")?.textContent?.trim();
        const value = row.querySelector("dd")?.textContent?.trim();
        return `${label}: ${value}`;
      })
      .join(" · ");
  }

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

const blocked_interval = (root_rect, image_rect, line_top, line_height) => {
  const absolute_top = root_rect.top + line_top;
  const absolute_bottom = absolute_top + line_height;
  if (absolute_bottom <= image_rect.top || absolute_top >= image_rect.bottom) {
    return null;
  }

  const first_row = Math.max(
    0,
    Math.floor(
      ((absolute_top - image_rect.top) / image_rect.height) * alpha_height,
    ),
  );
  const last_row = Math.min(
    alpha_height - 1,
    Math.ceil(
      ((absolute_bottom - image_rect.top) / image_rect.height) * alpha_height,
    ),
  );
  let left = alpha_width;
  let right = -1;
  for (let row = first_row; row <= last_row; row += 1) {
    const interval = alpha_rows[row];
    if (!interval) continue;
    left = Math.min(left, interval[0]);
    right = Math.max(right, interval[1]);
  }
  if (right < left) return null;

  const image_left = image_rect.left - root_rect.left;
  return [
    image_left + (left / alpha_width) * image_rect.width - 12,
    image_left + ((right + 1) / alpha_width) * image_rect.width + 12,
  ];
};

const slot_for_line = (side, root_rect, image_rect, y, line_height) => {
  const page_inset = 12;
  const blocked = blocked_interval(root_rect, image_rect, y, line_height);
  if (!blocked)
    return { left: page_inset, right: root_rect.width - page_inset };
  return side === "left"
    ? {
        left: page_inset,
        right: Math.min(root_rect.width - page_inset, blocked[0]),
      }
    : {
        left: Math.max(page_inset, blocked[1]),
        right: root_rect.width - page_inset,
      };
};

const render_block = (layer, card, side, start_y, root_rect, image_rect) => {
  if (card.classList.contains("dossier-card--profile")) {
    let y = start_y;
    let slot = slot_for_line(side, root_rect, image_rect, y, 18);
    while (slot.right - slot.left < 96) {
      y += 18;
      slot = slot_for_line(side, root_rect, image_rect, y, 18);
    }

    const heading = document.createElement("span");
    heading.className = "pretext-float-heading";
    heading.textContent =
      card.querySelector(".dossier-card__number")?.textContent?.trim() ?? "";
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
      label.textContent = row.querySelector("dt")?.textContent?.trim() ?? "";
      const value = document.createElement("span");
      value.className = "pretext-float-field__value";
      value.textContent = row.querySelector("dd")?.textContent?.trim() ?? "";
      field.append(label, value);
      Object.assign(field.style, {
        left: `${field_slot.left}px`,
        top: `${y}px`,
        width: `${field_slot.right - field_slot.left}px`,
      });
      layer.append(field);
      y += Math.max(42, field.getBoundingClientRect().height + 8);
    });
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
      heading.textContent =
        card.querySelector(".dossier-card__number")?.textContent?.trim() ?? "";
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

const compose = async () => {
  const root = document.querySelector("[data-sol-pretext-composition]");
  const layer = root?.querySelector(".character-sheet__flow");
  const image = root?.querySelector(".character-sheet__portrait img");

  if (
    !(root instanceof HTMLElement) ||
    !(layer instanceof HTMLElement) ||
    !(image instanceof HTMLImageElement)
  ) {
    resize_observer?.disconnect();
    observed_composition = null;
    return;
  }

  if (observed_composition !== root && typeof ResizeObserver !== "undefined") {
    resize_observer?.disconnect();
    resize_observer = new ResizeObserver(schedule_compose);
    resize_observer.observe(root);
    observed_composition = root;
  }

  if (root.clientWidth < 720) {
    layer.replaceChildren();
    root.removeAttribute("data-pretext-ready");
    return;
  }

  await image.decode();
  if (!root.isConnected) return;
  read_alpha_hull(image);
  const root_rect = root.getBoundingClientRect();
  const image_rect = image.getBoundingClientRect();
  const cards = [...root.querySelectorAll(".dossier-card")].filter(
    (card) => card instanceof HTMLElement,
  );
  if (cards.length !== 4 || alpha_rows.length === 0) return;

  layer.replaceChildren();
  const starts = [0.12, 0.46, 0.12, 0.5];
  const sides = ["left", "left", "right", "right"];
  cards.forEach((card, index) => {
    render_block(
      layer,
      card,
      sides[index],
      root_rect.height * starts[index],
      root_rect,
      image_rect,
    );
  });
  root.setAttribute("data-pretext-ready", "");
};

function schedule_compose() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => void compose());
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule_compose, {
      once: true,
    });
  } else {
    schedule_compose();
  }

  document.addEventListener("htmx:afterSwap", schedule_compose);
}
