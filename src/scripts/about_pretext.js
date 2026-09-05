import { read_alpha_hull, has_alpha_hull } from "./about/portrait_hull.js";
import { render_block } from "./about/render_block.js";
let frame = 0;
let resize_observer = null;
let observed_composition = null;

const observe_composition = (root) => {
  if (observed_composition === root || typeof ResizeObserver === "undefined")
    return;
  resize_observer?.disconnect();
  resize_observer = new ResizeObserver(schedule_compose);
  resize_observer.observe(root);
  observed_composition = root;
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

  observe_composition(root);

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
  if (cards.length !== 4 || !has_alpha_hull()) return;

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
