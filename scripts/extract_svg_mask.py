#!/usr/bin/env python3
"""Extract a real SVG mask path from a raster ornament crop.

This is intentionally boring and dependency-light except for Pillow. It is for
small UI ornaments where preserving the original silhouette matters more than
fancy simplification.

Example:
  python scripts/extract_svg_mask.py \
    --source references/moonchild-ui.jpg \
    --crop 45,935,245,1115 \
    --foreground light \
    --threshold 140 \
    --scale 4 \
    --output public/ornaments/navbar/moonchild_sun_dense_10_t140.svg \
    --preview .tmp/moonchild_sun_dense_10_t140_preview.png

Accepted navbar recipes from the 2026-07-06 extraction pass:

  python scripts/extract_svg_mask.py \
    --source references/vector_set/extracted/gothic_ui_elements_png/el_01_133x76.png \
    --crop 0,0,133,76 \
    --foreground alpha \
    --threshold 160 \
    --scale 4 \
    --output public/ornaments/navbar/el_01_133x76_thin_160.svg

  python scripts/extract_svg_mask.py \
    --source references/vector_set/extracted/gothic_ui_elements_png/el_02_136x74.png \
    --crop 0,0,136,74 \
    --foreground alpha \
    --threshold 160 \
    --scale 4 \
    --output public/ornaments/navbar/el_02_136x74_thin_160.svg

  python scripts/extract_svg_mask.py \
    --source references/moonchild-ui.jpg \
    --crop 45,935,245,1115 \
    --foreground light \
    --threshold 140 \
    --scale 4 \
    --output public/ornaments/navbar/moonchild_sun_dense_10_t140.svg

Generate variants, render side-by-side at intended UI size, and pick by visual
comparison. White SVG fills are intentional: the host element owns color.
"""

from __future__ import annotations

import argparse
from operator import gt, lt
from pathlib import Path

from PIL import Image


def parse_crop(value: str) -> tuple[int, int, int, int]:
    parts = value.split(",")
    if len(parts) != 4:
        raise argparse.ArgumentTypeError("crop must be left,top,right,bottom")

    try:
        left, top, right, bottom = map(int, parts)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("crop values must be integers") from exc

    if right <= left or bottom <= top:
        raise argparse.ArgumentTypeError("crop right/bottom must be greater than left/top")

    return left, top, right, bottom


def exposed_pixel_edges(mask, x, y, width, height):
    corners = ((x, y), (x + 1, y), (x + 1, y + 1), (x, y + 1))
    neighbors = ((x, y - 1), (x + 1, y), (x, y + 1), (x - 1, y))
    for index, (neighbor_x, neighbor_y) in enumerate(neighbors):
        inside = 0 <= neighbor_x < width and 0 <= neighbor_y < height
        if not inside or not mask[neighbor_y][neighbor_x]:
            yield corners[index], corners[(index + 1) % 4]


def iter_mask_edges(mask, width, height):
    for y, row in enumerate(mask):
        for x, is_foreground in enumerate(row):
            if is_foreground:
                yield from exposed_pixel_edges(mask, x, y, width, height)


def trace_edge_loop(by_start, guard_limit):
    start = next(iter(by_start))
    current = start
    points = [start]
    for _ in range(guard_limit):
        ends = by_start.get(current)
        if not ends:
            break
        current = ends.pop(0)
        if not ends:
            del by_start[points[-1]]
        points.append(current)
        if current == start:
            break
    return points


def trace_mask(mask: list[list[bool]], width: int, height: int) -> list[list[tuple[int, int]]]:
    edges = list(iter_mask_edges(mask, width, height))
    by_start: dict[tuple[int, int], list[tuple[int, int]]] = {}
    for start, end in edges:
        by_start.setdefault(start, []).append(end)

    loops: list[list[tuple[int, int]]] = []
    guard_limit = len(edges) + 8
    while by_start:
        points = trace_edge_loop(by_start, guard_limit)
        if len(points) > 3 and points[-1] == points[0]:
            loops.append(points[:-1])
    return loops


def simplify_collinear(points: list[tuple[int, int]]) -> list[tuple[int, int]]:
    if len(points) <= 3:
        return points

    simplified: list[tuple[int, int]] = []
    total = len(points)

    for index, point in enumerate(points):
        previous = points[(index - 1) % total]
        next_point = points[(index + 1) % total]
        dx_previous = point[0] - previous[0]
        dy_previous = point[1] - previous[1]
        dx_next = next_point[0] - point[0]
        dy_next = next_point[1] - point[1]

        if dx_previous * dy_next != dy_previous * dx_next:
            simplified.append(point)

    return simplified


def format_scaled(value: int, scale: int) -> str:
    scaled = value / scale
    rounded = round(scaled)

    if abs(scaled - rounded) < 1e-6:
        return str(int(rounded))

    return f"{scaled:.2f}".rstrip("0").rstrip(".")


def loops_to_path(loops: list[list[tuple[int, int]]], scale: int) -> str:
    chunks: list[str] = []

    for loop in sorted(loops, key=len, reverse=True):
        points = simplify_collinear(loop)
        if len(points) < 3:
            continue

        first_x, first_y = points[0]
        commands = [f"M {format_scaled(first_x, scale)} {format_scaled(first_y, scale)}"]
        commands.extend(
            f"L {format_scaled(x, scale)} {format_scaled(y, scale)}" for x, y in points[1:]
        )
        commands.append("Z")
        chunks.append(" ".join(commands))

    return " ".join(chunks)


def build_mask(
    source: Path,
    crop: tuple[int, int, int, int],
    foreground: str,
    threshold: int,
    scale: int,
    pad: int,
) -> tuple[list[list[bool]], int, int, int, int, Image.Image]:
    with Image.open(source) as source_image:
        image = source_image.convert("RGBA").crop(crop)
    channel = image.getchannel("A") if foreground == "alpha" else image.convert("L")
    channel = channel.resize(
        (image.width * scale, image.height * scale), Image.Resampling.LANCZOS
    )
    compare = gt if foreground in ("alpha", "light") else lt
    selected = channel.point(lambda value: 255 * compare(value, threshold))
    bounds = selected.getbbox()
    if bounds is None:
        raise ValueError("threshold produced an empty mask")

    left, top, right, bottom = bounds
    scaled_pad = pad * scale
    trimmed = selected.crop((
        max(0, left - scaled_pad),
        max(0, top - scaled_pad),
        min(selected.width, right + scaled_pad),
        min(selected.height, bottom + scaled_pad),
    ))
    width, height = trimmed.size
    values = list(map(bool, trimmed.getdata()))
    mask = [values[y * width : (y + 1) * width] for y in range(height)]
    selected_pixels = selected.histogram()[255]
    return mask, width, height, selected_pixels, selected_pixels, image


def write_preview(
    preview_path: Path,
    mask: list[list[bool]],
    width: int,
    height: int,
    scale: int,
) -> None:
    preview = Image.new("RGBA", (width, height), (8, 8, 12, 255))
    pixels = preview.load()

    for y, row in enumerate(mask):
        for x, is_foreground in enumerate(row):
            if is_foreground:
                pixels[x, y] = (245, 140, 169, 255)

    display = preview.resize((round(width / scale), round(height / scale)), Image.Resampling.LANCZOS)
    preview_path.parent.mkdir(parents=True, exist_ok=True)
    display.save(preview_path)


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract an SVG path mask from a raster ornament crop.")
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--crop", required=True, type=parse_crop)
    parser.add_argument("--foreground", choices=("alpha", "light", "dark"), default="dark")
    parser.add_argument("--threshold", required=True, type=int)
    parser.add_argument("--scale", type=int, default=4)
    parser.add_argument("--pad", type=int, default=6)
    parser.add_argument("--preview", type=Path)
    args = parser.parse_args()

    if args.scale < 1:
        raise ValueError("scale must be >= 1")
    if not 0 <= args.threshold <= 255:
        raise ValueError("threshold must be between 0 and 255")

    mask, width, height, selected_xs, _selected_ys, _crop_image = build_mask(
        args.source,
        args.crop,
        args.foreground,
        args.threshold,
        args.scale,
        args.pad,
    )
    loops = trace_mask(mask, width, height)
    path_data = loops_to_path(loops, args.scale)
    viewbox_width = width / args.scale
    viewbox_height = height / args.scale

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 {viewbox_width:.2f} {viewbox_height:.2f}" '
        f'width="{viewbox_width:.2f}" height="{viewbox_height:.2f}">\n'
        f'  <path fill="#fff" fill-rule="evenodd" d="{path_data}"/>\n'
        f'</svg>\n'
    )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(svg, encoding="utf-8")

    if args.preview:
        write_preview(args.preview, mask, width, height, args.scale)

    print(
        f"wrote {args.output} viewBox={viewbox_width:.2f}x{viewbox_height:.2f} "
        f"loops={len(loops)} selected_pixels={selected_xs}"
    )


if __name__ == "__main__":
    main()
