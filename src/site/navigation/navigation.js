const mounted = new WeakSet();
const panel_delay = 180;
const ready_delay = 450;
const close_delay = 520;

const mount = (dialog) => {
  if (mounted.has(dialog)) return;

  const toggle = document.querySelector(
    `[data-sol-navigation-summon][aria-controls="${dialog.id}"]`,
  );
  const panel = dialog.querySelector("[data-sol-navigation-reliquary]");
  const release = dialog.querySelector("[data-sol-navigation-release]");
  const title = dialog.querySelector("[data-sol-navigation-title]");
  const count = dialog.querySelector("[data-sol-navigation-count]");
  const links = [...dialog.querySelectorAll("[data-sol-navigation-option]")];

  if (
    !(toggle instanceof HTMLButtonElement) ||
    !(panel instanceof HTMLElement) ||
    !(release instanceof HTMLButtonElement) ||
    !(title instanceof HTMLElement) ||
    !(count instanceof HTMLElement) ||
    links.length === 0
  )
    return;

  mounted.add(dialog);

  let index = Math.max(
    0,
    links.findIndex((link) => link.dataset.selected === "true"),
  );
  let closing = false;
  let ready = false;
  let return_focus = null;
  const timers = new Set();

  const after = (delay, action) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      action();
    }, delay);
    timers.add(timer);
  };

  const clear_timers = () => {
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
  };

  const select = (next, focus = false) => {
    index = ((next % links.length) + links.length) % links.length;

    for (const [link_index, link] of links.entries()) {
      const selected = link_index === index;
      link.dataset.selected = String(selected);
      link.tabIndex = selected ? 0 : -1;
    }

    const link = links[index];
    const label = link.getAttribute("aria-label") ?? link.textContent.trim();
    title.textContent = label;
    count.textContent = String(index + 1).padStart(2, "0");
    if (focus) link.focus();
  };

  const show = () => {
    if (dialog.open || closing) return;

    return_focus = document.activeElement;
    ready = false;
    panel.inert = true;
    dialog.dataset.phase = "veil";
    dialog.showModal();

    after(panel_delay, () => {
      if (dialog.open && !closing) dialog.dataset.phase = "panel";
    });
    after(ready_delay, () => {
      if (!dialog.open || closing) return;
      ready = true;
      panel.inert = false;
      dialog.dataset.phase = "ready";
      select(index, true);
    });
  };

  const hide = () => {
    if (!dialog.open || closing) return;

    clear_timers();
    closing = true;
    ready = false;
    panel.inert = true;
    dialog.dataset.phase = "closing";

    after(close_delay, () => {
      dialog.close();
      delete dialog.dataset.phase;
      closing = false;
      if (return_focus instanceof HTMLElement) return_focus.focus();
      return_focus = null;
    });
  };

  const move = (step) => {
    if (ready) select(index + step, true);
  };

  toggle.addEventListener("click", show);
  release.addEventListener("click", hide);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    hide();
  });
  dialog.addEventListener("pointerdown", (event) => {
    if (event.target === dialog) hide();
  });
  dialog.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (["arrowup", "arrowleft", "w", "a"].includes(key)) {
      event.preventDefault();
      move(-1);
    } else if (["arrowdown", "arrowright", "s", "d"].includes(key)) {
      event.preventDefault();
      move(1);
    } else if (key === "home" && ready) {
      event.preventDefault();
      select(0, true);
    } else if (key === "end" && ready) {
      event.preventDefault();
      select(links.length - 1, true);
    }
  });

  for (const [link_index, link] of links.entries()) {
    link.addEventListener("focus", () => select(link_index));
    link.addEventListener("pointerenter", () => select(link_index));
  }

  document.addEventListener("keydown", (event) => {
    if (
      event.key !== "Escape" ||
      event.defaultPrevented ||
      dialog.open ||
      document.querySelector("dialog[open]")
    )
      return;

    event.preventDefault();
    show();
  });
};

export const mount_navigation = (root = document) => {
  for (const dialog of root.querySelectorAll("[data-sol-navigation]")) {
    if (dialog instanceof HTMLDialogElement) mount(dialog);
  }
};
