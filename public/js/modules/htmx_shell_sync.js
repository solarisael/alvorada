const window_any = /** @type {any} */ (window);

const sync_shell_state_from_response = (response_text) => {
  if (typeof response_text !== "string" || !response_text.trim()) {
    return;
  }

  const parsed_document = new DOMParser().parseFromString(
    response_text,
    "text/html",
  );
  const incoming_html = parsed_document.documentElement;
  const incoming_body = parsed_document.body;

  if (
    !(incoming_html instanceof HTMLElement) ||
    !(incoming_body instanceof HTMLElement)
  ) {
    return;
  }

  const html_attrs_to_sync = [
    "data-site-theme",
    "data-site-shell",
    "data-site-fx",
  ];
  for (const attr_name of html_attrs_to_sync) {
    const attr_value = incoming_html.getAttribute(attr_name);

    if (attr_value == null || attr_value === "") {
      document.documentElement.removeAttribute(attr_name);
      continue;
    }

    document.documentElement.setAttribute(attr_name, attr_value);
  }

  document.body.className = incoming_body.className;

  const incoming_phase = incoming_body.getAttribute("data-phase");
  if (incoming_phase == null || incoming_phase === "") {
    document.body.removeAttribute("data-phase");
  } else {
    document.body.setAttribute("data-phase", incoming_phase);
  }
};

if (
  typeof window !== "undefined" &&
  typeof document !== "undefined" &&
  !window_any.__htmx_shell_sync_bound
) {
  document.body?.addEventListener("htmx:afterSwap", (event) => {
    const htmx_event = /** @type {CustomEvent} */ (event);
    const swap_target = htmx_event.detail?.target;
    const response_text = htmx_event.detail?.xhr?.responseText;

    if (!(swap_target instanceof HTMLElement) || swap_target.id !== "content") {
      return;
    }

    sync_shell_state_from_response(response_text);
  });

  window_any.__htmx_shell_sync_bound = true;
}

export { sync_shell_state_from_response };
