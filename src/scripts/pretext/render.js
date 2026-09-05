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

export const render_pretext_lines = ({
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
