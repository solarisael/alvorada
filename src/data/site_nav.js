export const SITE_NAV_ITEMS = [
  { label: "hearth", short_label: "hea", phase: "home", href: "/" },
  { label: "nigredo", short_label: "nig", phase: "nigredo", href: "nigredo" },
  { label: "albedo", short_label: "alb", phase: "albedo", href: "albedo" },
  {
    label: "citrinitas",
    short_label: "cit",
    phase: "citrinitas",
    href: "citrinitas",
  },
  { label: "rubedo", short_label: "rub", phase: "rubedo", href: "rubedo" },
  { label: "codex", short_label: "cdx", phase: "codex", href: "codex" },
];

export const DESKTOP_NAV_LEFT = SITE_NAV_ITEMS.slice(0, 3);
export const DESKTOP_NAV_RIGHT = SITE_NAV_ITEMS.slice(3);
