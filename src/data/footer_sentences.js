// Sol-authorable: rows are data, add/edit freely.
const shared_rows = [
  {
    html: 'A cup of <span class="sol__text_fx sol__text_fx_whisper" data-text-fx-intensity="0.9">small fires</span> below the threshold',
    align: "start",
    effect: "fog",
  },
  {
    html: 'The gate opens where the work <span class="sol__text_fx sol__text_fx_glow" data-text-fx-intensity="1.2">glows next</span>',
    align: "center",
    effect: "dust",
  },
  {
    html: 'Keep the hearth lit; let the strange thing <span class="sol__text_fx sol__text_fx_etch" data-text-fx-intensity="0.8">take shape</span>',
    align: "end",
    effect: "fog",
  },
];

const nigredo_rows = [
  {
    html: 'Made with <span class="sol__text_fx" data-text-fx="glow glitch" data-text-fx-glow-intensity="1" data-text-fx-glitch-intensity="1" data-text-fx-glitch-motion="1">pure hatred</span>. You should all die.',
    align: "center",
    effect: "dust",
  },
  {
    html: 'At the black gate, the cup keeps what <span class="sol__text_fx sol__text_fx_etch" data-text-fx-intensity="1.1">refuses to vanish</span>',
    align: "start",
    effect: "fog",
  },
  {
    html: 'The threshold is a mouth; bring it your <span class="sol__text_fx sol__text_fx_whisper" data-text-fx-intensity="0.7">unquiet work</span>',
    align: "end",
    effect: "dust",
  },
];

const freeze_rows = (rows) =>
  Object.freeze(rows.map((row) => Object.freeze(row)));

export const FOOTER_SENTENCES = Object.freeze({
  shared: freeze_rows(shared_rows),
  nigredo: freeze_rows(nigredo_rows),
  albedo: freeze_rows([]),
  citrinitas: freeze_rows([]),
  rubedo: freeze_rows([]),
  codex: freeze_rows([]),
});

export const resolve_footer_sentences = (phase) => {
  const phase_rows = FOOTER_SENTENCES[phase];
  if (phase_rows?.length) {
    return phase_rows;
  }
  return FOOTER_SENTENCES.shared?.length ? FOOTER_SENTENCES.shared : [];
};
