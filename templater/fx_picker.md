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
"terminal",
"stat_screen",
"game_screen",
"quest_log",
"skill_popup",
"inventory",
"combat_feed",
"status_effects",
"system_warning",
"memory_fragment",
"admin_trace",
"party_roster",
"map_ping",
"aura",
"etch",
"whisper",
"sigil_pulse",
"veil",
"cadence",
"cadence_soft",
"cadence_oracular",
"cadence_childlike",
"wiggle",
"float",
"shake",
"glitch",
];

const selected_effect = await tp.system.suggester(effect_options, effect_options);
const block_effect_options = [
"terminal",
"stat_screen",
"game_screen",
"quest_log",
"skill_popup",
"inventory",
"combat_feed",
"status_effects",
"system_warning",
"memory_fragment",
"admin_trace",
"party_roster",
"map_ping",
];

if (!selected_effect) {
tR += tp.file.selection() ?? "";
} else {
const selected_text = tp.file.selection();
const inner_text = selected_text && selected_text.length ? selected_text : "your_text";
const is_block_effect = block_effect_options.includes(selected_effect);

const raw_visual_intensity = await tp.system.prompt(
"Visual intensity (optional, clamp 0.2-3)",
"",
);
const visual_intensity = typeof raw_visual_intensity === "string"
? raw_visual_intensity.trim()
: "";

const raw_motion_intensity = visual_intensity
? await tp.system.prompt("Motion intensity (optional, clamp 0.2-3)", "")
: "";
const motion_intensity = typeof raw_motion_intensity === "string"
? raw_motion_intensity.trim()
: "";

const marker_tokens = ["fx", selected_effect];

if (visual_intensity) {
marker_tokens.push(visual_intensity);

    if (motion_intensity) {
      marker_tokens.push(motion_intensity);
    }

}

if (is_block_effect) {
tR += `{{${marker_tokens.join(":")}}}\n${inner_text}\n{{/fx}}`;
} else {
tR += `{{${marker_tokens.join(":")}}}${inner_text}{{/fx}}`;
}
}
%>
