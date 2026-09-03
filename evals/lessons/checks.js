import { readdir } from "node:fs/promises";
import { basename, dirname, extname, join, relative, sep } from "node:path";

const component_root = join("src", "components");
const generic_module_names = new Set([
  "common",
  "helpers",
  "misc",
  "shared",
  "utils",
]);
const interactive_markup = /<(a|button|input|select|textarea)\b/i;
const focus_selector = /:focus(?:-visible)?\b/i;
const visible_focus_rule =
  /:focus(?:-visible)?[^{}]*\{[^{}]*(?:outline\s*:\s*(?!none\b|0(?:\D|$))|box-shadow\s*:\s*(?!none\b)|border(?:-color)?\s*:)/is;
const custom_property = /--[a-zA-Z0-9_-]+/;
const dynamic_class = /class\s*=\s*\{`[^`]*\$\{[^}]+\}[^`]*`\}/s;

const project_path = (path) => path.split(sep).join("/");

const path_exists = async (path) => {
  try {
    return await Bun.file(path).exists();
  } catch {
    return false;
  }
};

const walk_files = async (root_path) => {
  if (!(await path_exists(root_path))) {
    return [];
  }

  const entries = await readdir(root_path, { withFileTypes: true });
  const nested_files = await Promise.all(
    entries.map(async (entry) => {
      const entry_path = join(root_path, entry.name);

      if (entry.isDirectory()) {
        return walk_files(entry_path);
      }

      return entry.isFile() ? [entry_path] : [];
    }),
  );

  return nested_files.flat();
};

const finding = (check, path, message) => ({
  check,
  path: project_path(path),
  message,
});

const mask_safe_grid_tracks = (value) =>
  value.replace(/minmax\(\s*0\s*,\s*(?:\d*\.?\d+)fr\s*\)/gi, "");

const check_css = async (absolute_path, reported_path) => {
  const source = await Bun.file(absolute_path).text();
  const findings = [];

  if (custom_property.test(source)) {
    findings.push(
      finding(
        "css-custom-property",
        reported_path,
        "The current reset forbids CSS custom properties.",
      ),
    );
  }

  for (const declaration of source.matchAll(
    /grid-template-(?:columns|rows)\s*:\s*([^;}{]+)/gi,
  )) {
    if (/(?:^|[^\w.-])(?:\d*\.?\d+)fr\b/i.test(mask_safe_grid_tracks(declaration[1]))) {
      findings.push(
        finding(
          "grid-flex-track",
          reported_path,
          "Wrap each flexible grid track in minmax(0, 1fr).",
        ),
      );
    }
  }

  return { source, findings };
};

const check_component_modules = async (root_path) => {
  const absolute_component_root = join(root_path, component_root);
  const files = await walk_files(absolute_component_root);
  const astro_files = files.filter((path) => extname(path) === ".astro");
  const findings = [];

  for (const astro_path of astro_files) {
    const module_path = dirname(astro_path);
    const relative_module_path = relative(absolute_component_root, module_path);
    const reported_astro_path = relative(root_path, astro_path);
    const module_name = basename(module_path);
    const public_door_name = `${module_name}.astro`;
    const css_name = `${module_name}.css`;
    const javascript_name = `${module_name}.js`;
    const source = await Bun.file(astro_path).text();

    if (!relative_module_path) {
      findings.push(
        finding(
          "component-folder",
          reported_astro_path,
          "Move the component into its own named concern folder.",
        ),
      );
    }

    if (
      project_path(relative_module_path)
        .split("/")
        .some((part) => generic_module_names.has(part.toLowerCase()))
    ) {
      findings.push(
        finding(
          "component-folder",
          reported_astro_path,
          "Replace the grab-bag folder with a named concern module.",
        ),
      );
    }

    if (basename(astro_path) !== public_door_name) {
      findings.push(
        finding(
          "component-public-door",
          reported_astro_path,
          `The public component door must be ${public_door_name}.`,
        ),
      );
    }

    for (const sibling_name of [css_name, javascript_name]) {
      if (!(await path_exists(join(module_path, sibling_name)))) {
        findings.push(
          finding(
            "component-triad",
            reported_astro_path,
            `The component requires co-located ${sibling_name}.`,
          ),
        );
      }
    }

    for (const import_name of [css_name, javascript_name]) {
      if (!source.includes(`./${import_name}`)) {
        findings.push(
          finding(
            "component-imports",
            reported_astro_path,
            `The public door must load ./${import_name}.`,
          ),
        );
      }
    }

    if (dynamic_class.test(source)) {
      findings.push(
        finding(
          "dynamic-class-contract",
          reported_astro_path,
          "Map semantic variants through a finite contract. Do not construct CSS classes from unchecked props.",
        ),
      );
    }

    const css_path = join(module_path, css_name);
    if (await path_exists(css_path)) {
      const css_result = await check_css(
        css_path,
        relative(root_path, css_path),
      );
      findings.push(...css_result.findings);

      if (
        interactive_markup.test(source) &&
        (!focus_selector.test(css_result.source) ||
          !visible_focus_rule.test(css_result.source))
      ) {
        findings.push(
          finding(
            "visible-focus",
            relative(root_path, css_path),
            "Interactive markup requires an explicit visible focus treatment.",
          ),
        );
      }
    }
  }

  return findings;
};

const check_site_styles = async (root_path) => {
  const site_root = join(root_path, "src", "site");
  const site_files = await walk_files(site_root);
  const css_files = site_files.filter((path) => extname(path) === ".css");
  const findings = [];

  for (const css_path of css_files) {
    const result = await check_css(css_path, relative(root_path, css_path));
    findings.push(...result.findings);
  }

  return findings;
};

const check_project_census = (manifest) => {
  const { expected_count, lesson_refs } = manifest.project_census;
  const unique_refs = new Set(lesson_refs);

  if (
    lesson_refs.length === expected_count &&
    unique_refs.size === expected_count
  ) {
    return [];
  }

  return [
    finding(
      "project-census",
      "evals/lessons/manifest.json",
      `Expected ${expected_count} unique project lesson pointers. Found ${unique_refs.size}.`,
    ),
  ];
};

export const run_mechanical_checks = async ({ root_path, manifest }) => [
  ...check_project_census(manifest),
  ...(await check_component_modules(root_path)),
  ...(await check_site_styles(root_path)),
];
