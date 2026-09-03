// main.js — Obsidian plugin shell for the Solarisael fx preview.
// Bundled by scripts/build_obsidian_fx_plugin.js into the vault at
// .obsidian/plugins/solarisael-fx/. The transform and the hydration runtime
// are imported from the site repo, so the preview can never drift from the
// site's grammar.

import { Plugin } from "obsidian";

import { hydrate_text_effects } from "../../public/vendor/fx/js/text_effects.js";
import {
  pair_block_fx_sections,
  transform_fx_in_element,
} from "./dom_transform.js";

const SIZER_SELECTOR = ".markdown-preview-view .markdown-preview-sizer";

export default class SolarisaelFxPlugin extends Plugin {
  block_pass_scheduled = false;

  onload() {
    this.registerMarkdownPostProcessor((element) => {
      transform_fx_in_element(element);
      hydrate_text_effects(element);
      this.schedule_block_pass();
    });
  }

  // Blocks arrive one post-processor call at a time; paragraph-spanning
  // markers need the whole rendered document. One rAF pass per render burst.
  schedule_block_pass() {
    if (this.block_pass_scheduled) {
      return;
    }

    this.block_pass_scheduled = true;
    window.requestAnimationFrame(() => {
      this.block_pass_scheduled = false;

      for (const sizer of document.querySelectorAll(SIZER_SELECTOR)) {
        pair_block_fx_sections(sizer);
        hydrate_text_effects(sizer);
      }
    });
  }
}
