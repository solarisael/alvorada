<%\*
const effect_options = [
"glow",
"neon",
"shadow",
"chroma",
"blur",
"flicker",
"rainbow",
"gradient",
"wiggle",
"float",
"shake",
"glitch",
];

const selected_effect = await tp.system.suggester(effect_options, effect_options);

if (!selected_effect) {
tR += tp.file.selection() ?? "";
} else {
const selected_text = tp.file.selection();
const inner_text = selected_text && selected_text.length ? selected_text : "your_text";
tR += `{{fx:${selected_effect}}}${inner_text}{{/fx}}`;
}
%>
